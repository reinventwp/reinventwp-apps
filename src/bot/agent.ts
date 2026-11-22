import strings from "../strings";
import type { QuestionSession } from "./visitor";
import type { HubApp } from "../types";
import type { AgentStep, AgentTool, AgentToolCall, BotAgentConfig, BotConfig } from "./types";

/**
 * The assistant acting on the site (wp-admin only): Services answers with `tool_calls`, bot.js
 * runs them through AI Agent (`bot/run`), read-only ones at once and the rest after the admin's
 * Approve, then asks Services again with the steps until a normal answer comes back.
 */

/** Steps per question; Services refuses more (`too_many_steps`). */
export const MAX_STEPS = 12;

/** A step as kept in the chat (and sessionStorage): the line shown, not the tool's result. */
export interface StepView {
  id: string;
  name: string;
  text: string;
  status: "done" | "failed" | "declined";
}

/** What Services answers: a normal answer, or tool calls (with an optional short message). */
export interface AssistantReply {
  answer?: string;
  tool_calls?: unknown;
  message?: string;
  [key: string]: unknown;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** Fills "%s" and "%d" in turn. */
function fill(template: string, ...values: Array<string | number>): string {
  let at = 0;
  return template.replace(/%[sd]/g, () => String(values[at++] ?? ""));
}

/** All tool results sent with one request stay under this many characters; older ones are compacted first. */
export const STEP_RESULTS_BUDGET = 20_000;

const resultSize = (result: unknown) => (result === null || result === undefined ? 0 : JSON.stringify(result)?.length ?? 0);

/**
 * The steps as they're sent to Services, compacted so the context doesn't fill up with tool output (every request
 * sends all steps so far):
 * - a result that a newer call of the same tool replaced (a newer settings read, the next scan progress) becomes a
 *   short note;
 * - then, while the results are still over STEP_RESULTS_BUDGET, the oldest full results become a note with their start.
 * The newest step always stays whole. Errors and declines stay as they are; the steps shown in the chat aren't changed.
 */
export function compactSteps(steps: AgentStep[]): AgentStep[] {
  const out = steps.map((step) => ({ ...step }));
  const newest = new Map<string, number>();
  out.forEach((step, index) => newest.set(step.name, index));
  out.forEach((step, index) => {
    if (newest.get(step.name) !== index && resultSize(step.result) > 200) {
      step.result = { compacted: "Replaced by a newer call of this tool below." };
    }
  });
  let total = out.reduce((sum, step) => sum + resultSize(step.result), 0);
  for (let index = 0; index < out.length - 1 && total > STEP_RESULTS_BUDGET; index += 1) {
    const size = resultSize(out[index].result);
    if (size <= 300) continue;
    const text = JSON.stringify(out[index].result);
    out[index].result = { compacted: "Left out to save space; call the tool again if you need it.", start: `${text.slice(0, 240)}…` };
    total -= size - resultSize(out[index].result);
  }
  return out;
}

/** The tools AI Agent offers, with anything malformed left out. */
export function parseTools(body: unknown): AgentTool[] {
  const list = isObject(body) && Array.isArray(body.tools) ? body.tools : [];
  return list.filter(isObject).flatMap((tool) =>
    typeof tool.name === "string" && tool.name
      ? [
          {
            name: tool.name,
            label: typeof tool.label === "string" && tool.label ? tool.label : humanize(tool.name),
            description: typeof tool.description === "string" ? tool.description : "",
            input_schema: isObject(tool.input_schema) ? tool.input_schema : null,
            readonly: tool.readonly === true,
            destructive: tool.destructive === true,
          },
        ]
      : [],
  );
}

/** The tools as Services takes them: the objects from `bot/tools`. */
export function toolsForService(tools: AgentTool[]) {
  return tools.map(({ name, label, description, input_schema, readonly, destructive }) => ({ name, label, description, input_schema, readonly, destructive }));
}

/** v1 rule: only read-only tools run at once; everything else waits for Approve. */
export function needsApproval(tool: AgentTool): boolean {
  return tool.readonly !== true;
}

/** The calls that still fit in the step limit. */
export function callsThatFit(calls: AgentToolCall[], done: number): AgentToolCall[] {
  return calls.slice(0, Math.max(MAX_STEPS - done, 0));
}

/** Services' tool calls, or null for a normal answer. */
export function toolCalls(reply: AssistantReply | null | undefined): AgentToolCall[] | null {
  if (!reply || !Array.isArray(reply.tool_calls)) return null;
  const calls = reply.tool_calls.filter(isObject).flatMap((call) =>
    typeof call.id === "string" && typeof call.name === "string"
      ? [{ id: call.id, name: call.name, input: isObject(call.input) ? call.input : null }]
      : [],
  );
  return calls.length ? calls : null;
}

/** "reinvent-media-cleanup/list-unused" → "list-unused". */
function action(name: string): string {
  return name.slice(name.indexOf("/") + 1);
}

/** "reinvent-media-cleanup/list-unused" → "List unused", when a tool has no label. */
function humanize(name: string): string {
  const words = action(name).replace(/[-_]+/g, " ").trim();
  return words.charAt(0).toUpperCase() + words.slice(1);
}

/** "12 files" / "1 file"; media tools count files, others items. */
export function countText(count: number, name: string): string {
  const noun = /media|image/.test(name) ? "file" : "item";
  return `${count} ${noun}${count === 1 ? "" : "s"}`;
}

/** How many things an input points at: the length of its first list (e.g. `ids`). */
function listLength(input: AgentToolCall["input"]): number | null {
  if (!input) return null;
  if (Array.isArray(input.ids)) return input.ids.length;
  const list = Object.values(input).find(Array.isArray);
  return list ? list.length : null;
}

/** A short line for what a call is given: "12 files", or "limit 20, offset 0". */
export function inputSummary(input: AgentToolCall["input"], name: string): string {
  const count = listLength(input);
  if (count !== null) return countText(count, name);
  if (!input) return "";
  return Object.entries(input)
    .filter(([, value]) => ["string", "number", "boolean"].includes(typeof value))
    .slice(0, 3)
    .map(([key, value]) => `${key.replace(/_/g, " ")} ${String(value).slice(0, 40)}`)
    .join(", ");
}

/** The app a tool belongs to ("Media Cleanup"), from its name's plugin slug. */
export function appName(name: string, apps: HubApp[]): string {
  const slug = name.split("/")[0];
  return apps.find((app) => app.slug === slug)?.name ?? "";
}

/**
 * What will happen if the admin approves: "Move 12 files to the Media Cleanup trash (you can restore
 * them)", "Restore 3 files from the Media Cleanup trash", or the tool's label and its input.
 */
export function approvalText(tool: AgentTool, call: AgentToolCall, app = ""): string {
  const count = listLength(call.input);
  const trash = app ? `the ${app} trash` : "the trash";
  if (count !== null && action(call.name) === "move-to-trash") return fill(strings.ask_agent_move_trash, countText(count, call.name), trash);
  if (count !== null && action(call.name) === "restore") return fill(strings.ask_agent_restore, countText(count, call.name), trash);
  const summary = inputSummary(call.input, call.name);
  return summary ? `${tool.label} — ${summary}` : tool.label;
}

const PAST: Record<string, string> = {
  get: "Checked",
  check: "Checked",
  list: "Listed",
  scan: "Scanned",
  move: "Moved",
  restore: "Restored",
  delete: "Deleted",
  remove: "Removed",
  empty: "Emptied",
  find: "Found",
  search: "Searched",
  count: "Counted",
  start: "Started",
  run: "Ran",
  create: "Created",
  add: "Added",
  update: "Updated",
  change: "Changed",
  set: "Set",
  save: "Saved",
  rename: "Renamed",
  replace: "Replaced",
  clean: "Cleaned",
  generate: "Generated",
  regenerate: "Regenerated",
  optimize: "Optimized",
  read: "Read",
  fetch: "Fetched",
  show: "Showed",
};

/** A scan's progress in percent, when the result reports one. */
function progressOf(result: unknown): number | null {
  if (!isObject(result)) return null;
  const tracked = "finished" in result || "progress" in result || "percent" in result;
  if (!tracked) return null;
  if (result.finished === true) return 100;
  for (const value of [result.percent, result.progress]) {
    if (typeof value === "number" && value >= 0 && value <= 100) return Math.round(value);
  }
  const source = isObject(result.progress) ? result.progress : result;
  if (typeof source.done === "number" && typeof source.total === "number" && source.total > 0) {
    return Math.min(100, Math.round((source.done / source.total) * 100));
  }
  return null;
}

/** How many things a result counts: moved, restored, … or a total, or its items. */
function countOf(result: unknown): number | null {
  if (!isObject(result)) return null;
  for (const key of ["moved", "restored", "deleted", "removed", "updated", "count", "total"]) {
    if (typeof result[key] === "number") return result[key] as number;
  }
  return Array.isArray(result.items) ? result.items.length : null;
}

/** "files" → "file" after a count of 1. */
function singular(text: string): string {
  return text.replace(/\b(entr)ies\b/, "$1y").replace(/\b(file|image|item|attachment|post|page|comment|user|row|table)s\b/, "$1");
}

/**
 * The compact line for a step: "Listed 12 unused files", "Scanned media (45%)", "Moved 12 files to
 * trash"; the label in the past tense with the result's count, or the label as it is.
 */
export function stepLine(step: AgentStep, tool?: AgentTool): StepView {
  const label = tool?.label || humanize(step.name);
  const base = { id: step.id, name: step.name };
  if (step.declined) return { ...base, text: fill(strings.ask_agent_declined, label), status: "declined" };
  if (step.error) {
    const error = step.error.length > 120 ? `${step.error.slice(0, 119)}…` : step.error;
    return { ...base, text: fill(strings.ask_agent_failed, label, error), status: "failed" };
  }
  const [verb, ...words] = label.trim().split(/\s+/);
  const past = PAST[verb.toLowerCase()];
  if (!past) return { ...base, text: label, status: "done" };
  const rest = words.join(" ");
  // A status check reports progress and totals of its own; its line stays "Checked status".
  const checks = past === "Checked";
  const progress = checks ? null : progressOf(step.result);
  if (progress !== null) return { ...base, text: `${[past, rest].filter(Boolean).join(" ")} (${progress}%)`, status: "done" };
  const count = checks ? null : (countOf(step.result) ?? (tool && !tool.readonly ? listLength(step.input) : null));
  if (count === null) return { ...base, text: [past, rest].filter(Boolean).join(" "), status: "done" };
  // "Moved to trash" has no noun to count, so it gets one: "Moved 12 files to trash".
  const counted = !rest || /^(to|from|into|in|out|back|on|off)\b/i.test(rest) ? [countText(count, step.name), rest] : [count, count === 1 ? singular(rest) : rest];
  return { ...base, text: [past, ...counted].filter((part) => part !== "").join(" "), status: "done" };
}

/** The history turn for an answer that acted on the site, so a follow-up knows what was done. */
export function historyContent(content: string, steps: StepView[] | undefined): string {
  const done = steps?.filter((step) => step.status === "done").map((step) => step.text) ?? [];
  return done.length ? `${fill(strings.ask_agent_history, done.join("; "))}\n${content}` : content;
}

export interface QuestionInput {
  question: string;
  history: Array<{ role: "user" | "assistant"; content: string }>;
  images?: Array<{ media_type: string; data: string }>;
  file?: { name: string; text: string } | null;
  surface: BotConfig["surface"];
  page: string;
  apps: HubApp[];
  /** The site's tools and the steps so far; only sent in wp-admin. */
  agent?: { tools: AgentTool[]; steps: AgentStep[] } | null;
  /** reinventwp.com only: the visitor's session and conversation (visitor.ts), so Services keeps their chats together. */
  session?: QuestionSession | null;
}

/** The body POSTed to Services' assistant. */
export function questionBody({ question, history, images = [], file, surface, page, apps, agent, session }: QuestionInput) {
  const wpAdmin = surface === "wp-admin";
  return {
    question,
    history,
    ...(images.length && { images }),
    ...(file && { files: [{ name: file.name, text: file.text }] }),
    surface,
    page,
    ...(wpAdmin && { site: { apps: apps.map(({ slug, state, version }) => ({ slug, state, version })) } }),
    ...(wpAdmin && agent?.tools.length && { agent: { tools: toolsForService(agent.tools), steps: agent.steps } }),
    ...(!wpAdmin && session && { session }),
  };
}

/**
 * Where a question goes: through AI Agent's `bot/ask` when its config has one (wp-admin with AI Agent; the request
 * reaches Services signed by the site's Suite Pass), else straight to Services. The body is the same either way.
 */
export function askRequest(servicesUrl: string, agent: BotAgentConfig | undefined, body: string): [string, RequestInit] {
  if (agent?.ask) {
    return [agent.ask, { method: "POST", credentials: "include", headers: { "Content-Type": "application/json", "X-WP-Nonce": agent.nonce }, body }];
  }
  return [servicesUrl, { method: "POST", headers: { "Content-Type": "application/json" }, body }];
}

/**
 * `GET bot/tools` from AI Agent. Credentials are always sent (like the chats): on the AI Agent dev server the page
 * (localhost:3001) and WordPress (localhost:8000) are different origins, and without the login cookie WordPress
 * refuses the nonce (rest_cookie_invalid_nonce). On wp-admin both are the same site, so nothing changes there.
 */
export async function fetchAgentTools(agent: BotAgentConfig): Promise<AgentTool[]> {
  const response = await fetch(agent.tools, { credentials: "include", headers: { "X-WP-Nonce": agent.nonce } });
  if (!response.ok) throw new Error(`bot/tools ${response.status}`);
  return parseTools(await response.json());
}

/** `POST bot/run` on AI Agent: the result, or the error to tell the model. */
export async function runAgentTool(agent: BotAgentConfig, call: AgentToolCall, approved: boolean): Promise<{ result: unknown; error?: string }> {
  try {
    const response = await fetch(agent.run, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json", "X-WP-Nonce": agent.nonce },
      body: JSON.stringify({ ability: call.name, input: call.input, approved }),
    });
    const body = await response.json().catch(() => null);
    if (!response.ok || !isObject(body) || body.ok !== true) {
      const message = isObject(body) && typeof body.message === "string" && body.message ? body.message : strings.ask_agent_error;
      return { result: null, error: message };
    }
    return { result: body.result ?? null };
  } catch {
    return { result: null, error: strings.ask_agent_error };
  }
}

/** Tools per request; Services refuses more ("Send at most 20 tools."). */
export const MAX_TOOLS = 20;

/** The tool the model calls first when the site has more tools than fit: it picks the app the question is about. */
export const APP_PICKER = "reinventwp-apps/use-app";

/** A tool's plugin slug ("reinvent-database-cleaner" for "reinvent-database-cleaner/clean"). */
const toolApp = (name: string) => name.split("/")[0];

/**
 * The app picker, for a site whose tools don't fit in one request: it lists the apps that have tools (name, slug,
 * what the app does) and loads the chosen app's tools for the rest of the question.
 */
export function appPicker(tools: AgentTool[], apps: HubApp[] = []): AgentTool {
  const slugs = [...new Set(tools.map((tool) => toolApp(tool.name)))];
  const lines = slugs.map((slug) => {
    const app = apps.find((item) => item.slug === slug);
    const about = (app?.description ?? "").replace(/\s+/g, " ").trim().slice(0, 90);
    return `${app?.name ?? slug} (${slug})${about ? `: ${about}` : ""}`;
  });
  const intro = "This site's apps have more tools than fit in one request. To act on the site, first pick the one app the admin's question is about; its tools load for the rest of this question (one app per question). Apps: ";
  return {
    name: APP_PICKER,
    label: "Choose an app",
    description: (intro + lines.join("; ")).slice(0, 1000),
    input_schema: { type: "object", properties: { app: { type: "string", enum: slugs, description: "The app's slug." } }, required: ["app"], additionalProperties: false },
    readonly: true,
    destructive: false,
  };
}

/**
 * The tools sent with the first request: all of them when they fit, otherwise the open page's own tools and the
 * app picker.
 */
export function firstTools(tools: AgentTool[], pageTools: string[] = [], apps: HubApp[] = []): AgentTool[] {
  if (tools.length <= MAX_TOOLS) return tools;
  return [...tools.filter((tool) => pageTools.includes(tool.name)).slice(0, MAX_TOOLS - 1), appPicker(tools, apps)];
}

/**
 * The tools after the model picked an app: the ones already used in this question (Services only accepts steps of
 * tools it's sent) and then the app's own, up to MAX_TOOLS. Null when the app has no tools.
 */
export function pickedTools(tools: AgentTool[], app: unknown, steps: AgentStep[]): AgentTool[] | null {
  const own = tools.filter((tool) => toolApp(tool.name) === app);
  if (!own.length) return null;
  const used = tools.filter((tool) => steps.some((step) => step.name === tool.name));
  return [...used, ...own.filter((tool) => !used.includes(tool))].slice(0, MAX_TOOLS);
}

export interface AgentLoop {
  tools: AgentTool[];
  /** The tools of the open admin page (their names); with many site tools, they're sent before an app is picked. */
  pageTools?: string[];
  /** The hub's apps, for the app picker's names and descriptions. */
  apps?: HubApp[];
  /** Asks Services with the steps so far and the tools for this request; throws when it can't answer. */
  ask: (steps: AgentStep[], tools: AgentTool[]) => Promise<AssistantReply>;
  run: (call: AgentToolCall, approved: boolean) => Promise<{ result: unknown; error?: string }>;
  /** Shows the Approve card and waits for the admin. */
  approve: (call: AgentToolCall, tool: AgentTool) => Promise<boolean>;
  /** The steps so far, the model's short message and the tool now running, for the chat. */
  onProgress: (progress: { steps: AgentStep[]; message: string; running: AgentToolCall | null }) => void;
}

/**
 * Asks, runs the tools Services calls for in order, and asks again until a normal answer comes back
 * (`reply`) or the step limit is reached (`stopped`, no reply). A change that isn't destructive
 * (a scan, called again until it's finished) is approved once per question; a destructive one once per
 * input, so a batch job called again with the same input ("watermark all images", one step per call)
 * continues without asking again, while other ids or items still need their own approval.
 */
export async function runAgentLoop({ tools, pageTools = [], apps = [], ask, run, approve, onProgress }: AgentLoop) {
  const steps: AgentStep[] = [];
  const approvedTools = new Set<string>();
  const approvedCalls = new Set<string>();
  const callKey = (call: AgentToolCall) => `${call.name}\n${JSON.stringify(call.input ?? {})}`;
  // With more tools than fit, the model first picks an app (once per question; that call isn't a step).
  let sent = firstTools(tools, pageTools, apps);
  let message = "";
  for (;;) {
    const reply = await ask(steps.slice(), sent);
    const calls = toolCalls(reply);
    if (!calls) return { reply, steps, message, stopped: false };
    if (typeof reply.message === "string" && reply.message.trim()) message = reply.message.trim();
    const pick = calls.find((call) => call.name === APP_PICKER && sent.some((tool) => tool.name === APP_PICKER));
    // Picker calls never become steps (Services would refuse a step of a tool it wasn't sent).
    const fitting = callsThatFit(calls.filter((call) => call.name !== APP_PICKER), steps.length);
    if (!pick && !fitting.length) return { reply: null, steps, message, stopped: true };
    for (const call of fitting) {
      const tool = tools.find((item) => item.name === call.name);
      if (!tool) {
        steps.push({ ...call, result: null, error: strings.ask_agent_unknown });
        continue;
      }
      let approved = false;
      if (needsApproval(tool)) {
        approved = tool.destructive ? approvedCalls.has(callKey(call)) : approvedTools.has(tool.name);
        if (!approved) {
          onProgress({ steps: steps.slice(), message, running: null });
          approved = await approve(call, tool);
        }
        if (!approved) {
          steps.push({ ...call, result: null, declined: true });
          continue;
        }
        if (tool.destructive) approvedCalls.add(callKey(call));
        else approvedTools.add(tool.name);
      }
      onProgress({ steps: steps.slice(), message, running: call });
      const outcome = await run(call, approved);
      steps.push({ ...call, result: outcome.result ?? null, ...(outcome.error && { error: outcome.error }) });
      onProgress({ steps: steps.slice(), message, running: null });
    }
    if (pick) {
      // The picked app's tools from now on; an unknown app leaves only the tools already used, so the model answers.
      const app = isObject(pick.input) ? pick.input.app : undefined;
      sent = pickedTools(tools, app, steps) ?? tools.filter((tool) => steps.some((step) => step.name === tool.name));
    }
  }
}
