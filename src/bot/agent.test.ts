import { afterEach, describe, expect, it, vi } from "vitest";
import type { HubApp } from "../types";
import {
  approvalText,
  callsThatFit,
  compactSteps,
  fetchAgentTools,
  historyContent,
  inputSummary,
  MAX_STEPS,
  parseTools,
  questionBody,
  runAgentLoop,
  runAgentTool,
  STEP_RESULTS_BUDGET,
  stepLine,
  toolCalls,
  type AssistantReply,
} from "./agent";
import type { AgentStep, AgentTool, AgentToolCall } from "./types";

const tool = (name: string, label: string, readonly: boolean, destructive = false): AgentTool => ({
  name: `reinvent-media-cleanup/${name}`,
  label,
  description: "",
  input_schema: null,
  readonly,
  destructive,
});

const TOOLS = [
  tool("get-status", "Check Media Cleanup status", true),
  tool("scan", "Scan media", true),
  tool("list-unused", "List unused files", true),
  tool("move-to-trash", "Move files to the Media Cleanup trash", false, true),
  tool("restore", "Restore files from the Media Cleanup trash", false),
];
const byName = (name: string) => TOOLS.find((item) => item.name === `reinvent-media-cleanup/${name}`) as AgentTool;
const step = (name: string, result: unknown, extra: Partial<AgentStep> = {}, input: AgentStep["input"] = {}): AgentStep => ({
  id: `call_${name}`,
  name: `reinvent-media-cleanup/${name}`,
  input,
  result,
  ...extra,
});
const AGENT = { tools: "/wp-json/ai-agent/v1/bot/tools", run: "/wp-json/ai-agent/v1/bot/run", nonce: "abc123" };
const ids = (count: number) => Array.from({ length: count }, (_value, index) => index + 1);

afterEach(() => vi.unstubAllGlobals());

describe("site tools", () => {
  it("keeps well-formed tools and labels the ones without a label", () => {
    expect(parseTools({ tools: [{ name: "reinvent-x/list-all", description: "d", readonly: true }, { label: "no name" }, "junk"] })).toEqual([
      { name: "reinvent-x/list-all", label: "List all", description: "d", input_schema: null, readonly: true, destructive: false },
    ]);
    expect(parseTools(null)).toEqual([]);
  });

  it("reads tool calls and treats anything else as a normal answer", () => {
    expect(toolCalls({ tool_calls: [{ id: "c1", name: "a/b", input: { limit: 5 } }, { id: 2 }] })).toEqual([{ id: "c1", name: "a/b", input: { limit: 5 } }]);
    expect(toolCalls({ answer: "Hi" })).toBeNull();
    expect(toolCalls({ tool_calls: [] })).toBeNull();
  });

  it("stops at the step limit", () => {
    const calls = ids(5).map((n) => ({ id: `c${n}`, name: "a/b", input: null }));
    expect(callsThatFit(calls, 0)).toHaveLength(5);
    expect(callsThatFit(calls, MAX_STEPS - 2)).toHaveLength(2);
    expect(callsThatFit(calls, MAX_STEPS)).toHaveLength(0);
  });
});

describe("input summary and approval text", () => {
  it("counts ids as files for media tools", () => {
    expect(inputSummary({ ids: ids(12) }, "reinvent-media-cleanup/restore")).toBe("12 files");
    expect(inputSummary({ ids: [7] }, "reinvent-media-cleanup/restore")).toBe("1 file");
    expect(inputSummary({ ids: [7, 8] }, "reinvent-seo/fix")).toBe("2 items");
    expect(inputSummary({ limit: 20, offset: 0 }, "reinvent-media-cleanup/list-unused")).toBe("limit 20, offset 0");
    expect(inputSummary(null, "a/b")).toBe("");
  });

  it("says what moving to trash will do", () => {
    const call = { id: "c", name: "reinvent-media-cleanup/move-to-trash", input: { ids: ids(12) } };
    expect(approvalText(byName("move-to-trash"), call, "Media Cleanup")).toBe("Move 12 files to the Media Cleanup trash (you can restore them)");
    expect(approvalText(byName("move-to-trash"), call)).toBe("Move 12 files to the trash (you can restore them)");
    expect(approvalText(byName("restore"), { id: "c", name: "reinvent-media-cleanup/restore", input: { ids: [1, 2, 3] } }, "Media Cleanup")).toBe("Restore 3 files from the Media Cleanup trash");
  });

  it("falls back to the label and its input", () => {
    const fix = { ...byName("restore"), name: "reinvent-seo/fix-titles", label: "Fix titles" };
    expect(approvalText(fix, { id: "c", name: "reinvent-seo/fix-titles", input: { ids: [1, 2, 3] } })).toBe("Fix titles — 3 items");
    expect(approvalText(fix, { id: "c", name: "reinvent-seo/fix-titles", input: {} })).toBe("Fix titles");
  });
});

describe("step lines", () => {
  it("puts the label in the past tense with the result's count", () => {
    expect(stepLine(step("get-status", { state: "done", progress: 100, total: 300 }), byName("get-status")).text).toBe("Checked Media Cleanup status");
    expect(stepLine(step("scan", { state: "running", percent: 45.4, finished: false, unused: 3 }), byName("scan")).text).toBe("Scanned media (45%)");
    expect(stepLine(step("scan", { state: "running", done: 30, total: 120, finished: false }), byName("scan")).text).toBe("Scanned media (25%)");
    expect(stepLine(step("scan", { state: "done", finished: true }), byName("scan")).text).toBe("Scanned media (100%)");
    expect(stepLine(step("list-unused", { total: 12, items: [] }), byName("list-unused")).text).toBe("Listed 12 unused files");
    expect(stepLine(step("list-unused", { total: 1, items: [] }), byName("list-unused")).text).toBe("Listed 1 unused file");
    expect(stepLine(step("move-to-trash", { moved: 12, freed_kb: 900, failed: [] }), byName("move-to-trash")).text).toBe("Moved 12 files to the Media Cleanup trash");
    expect(stepLine(step("restore", { restored: 1, failed: [] }), byName("restore")).text).toBe("Restored 1 file from the Media Cleanup trash");
    // A label without a noun gets one.
    expect(stepLine(step("move-to-trash", { moved: 2 }), { ...byName("move-to-trash"), label: "Move to trash" }).text).toBe("Moved 2 files to trash");
  });

  it("falls back to the label", () => {
    const line = stepLine(step("x", { ok: true }), { ...byName("scan"), name: "reinvent-media-cleanup/x", label: "Media health report" });
    expect(line).toEqual({ id: "call_x", name: "reinvent-media-cleanup/x", text: "Media health report", status: "done" });
    expect(stepLine(step("list-unused", null)).text).toBe("Listed unused");
  });

  it("marks declined and failed steps", () => {
    expect(stepLine(step("move-to-trash", null, { declined: true }), byName("move-to-trash"))).toMatchObject({ text: "Declined: Move files to the Media Cleanup trash", status: "declined" });
    expect(stepLine(step("scan", null, { error: "A scan is already running." }), byName("scan"))).toMatchObject({ text: "Scan media failed: A scan is already running.", status: "failed" });
  });

  it("tells the next question what was done", () => {
    const steps = [stepLine(step("move-to-trash", { moved: 2 }), byName("move-to-trash")), stepLine(step("restore", null, { declined: true }), byName("restore"))];
    expect(historyContent("Done.", steps)).toBe("Done on this site: Moved 2 files to the Media Cleanup trash.\nDone.");
    expect(historyContent("Hi", undefined)).toBe("Hi");
  });
});

describe("question body", () => {
  const base = { question: "clean up", history: [], surface: "wp-admin" as const, page: "apps", apps: [{ slug: "reinvent-media-cleanup", state: "active", version: "1.0.8", name: "Media Cleanup" }] as HubApp[] };

  it("is today's body without site tools", () => {
    expect(questionBody(base)).toEqual({ question: "clean up", history: [], surface: "wp-admin", page: "apps", site: { apps: [{ slug: "reinvent-media-cleanup", state: "active", version: "1.0.8" }] } });
    expect(questionBody({ ...base, agent: { tools: [], steps: [] } })).not.toHaveProperty("agent");
  });

  it("sends the tools as AI Agent gave them, and the steps", () => {
    const steps = [step("get-status", { state: "idle" })];
    const body = questionBody({ ...base, agent: { tools: [byName("get-status")], steps } });
    expect(body.agent).toEqual({ tools: [byName("get-status")], steps });
  });

  it("never sends tools or the site from the website", () => {
    const body = questionBody({ ...base, surface: "website", page: "/", agent: { tools: TOOLS, steps: [] } });
    expect(body).not.toHaveProperty("agent");
    expect(body).not.toHaveProperty("site");
  });
});

describe("AI Agent requests", () => {
  it("fetches the tools with the nonce", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ tools: [{ name: "a/b", label: "B", readonly: true }] }) });
    vi.stubGlobal("fetch", fetchMock);
    expect(await fetchAgentTools(AGENT)).toHaveLength(1);
    expect(fetchMock).toHaveBeenCalledWith(AGENT.tools, { credentials: "same-origin", headers: { "X-WP-Nonce": "abc123" } });
  });

  it("runs a tool and returns its result or error", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({ ok: true, result: { moved: 2 } }) })
      .mockResolvedValueOnce({ ok: false, status: 409, json: async () => ({ code: "needs_approval", message: "Needs approval." }) })
      .mockRejectedValueOnce(new Error("offline"));
    vi.stubGlobal("fetch", fetchMock);
    const call = { id: "c", name: "reinvent-media-cleanup/move-to-trash", input: { ids: [1, 2] } };
    expect(await runAgentTool(AGENT, call, true)).toEqual({ result: { moved: 2 } });
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({ ability: call.name, input: { ids: [1, 2] }, approved: true });
    expect(fetchMock.mock.calls[0][1].headers["X-WP-Nonce"]).toBe("abc123");
    expect(await runAgentTool(AGENT, call, false)).toEqual({ result: null, error: "Needs approval." });
    expect(await runAgentTool(AGENT, call, true)).toEqual({ result: null, error: "The tool couldn't run. Please try again." });
  });
});

describe("agent loop", () => {
  const call = (id: string, name: string, input: AgentToolCall["input"] = {}) => ({ id, name: `reinvent-media-cleanup/${name}`, input });

  it("runs read-only tools at once, asks before changes, and asks again until an answer", async () => {
    const replies: AssistantReply[] = [
      { tool_calls: [call("c1", "get-status"), call("c2", "list-unused", { limit: 20 })], message: "Checking." },
      { tool_calls: [call("c3", "move-to-trash", { ids: [1, 2] })] },
      { answer: "Moved 2 files to trash." },
    ];
    const asked: AgentStep[][] = [];
    const ask = vi.fn(async (steps: AgentStep[]) => {
      asked.push(steps);
      return replies[asked.length - 1];
    });
    const run = vi.fn(async (item: AgentToolCall, _approved: boolean) => ({ result: { ok: item.id } }));
    const approve = vi.fn(async () => true);
    const outcome = await runAgentLoop({ tools: TOOLS, ask, run, approve, onProgress: () => undefined });

    expect(outcome).toMatchObject({ reply: { answer: "Moved 2 files to trash." }, message: "Checking.", stopped: false });
    expect(asked.map((steps) => steps.length)).toEqual([0, 2, 3]);
    expect(approve).toHaveBeenCalledTimes(1);
    expect(run.mock.calls.map(([item, approved]) => [item.id, approved])).toEqual([["c1", false], ["c2", false], ["c3", true]]);
  });

  it("asks once per question for a change that isn't destructive, every time for a destructive one", async () => {
    const ask = vi
      .fn()
      .mockResolvedValueOnce({ tool_calls: [call("c1", "restore", { ids: [1] }), call("c2", "restore", { ids: [2] })] })
      .mockResolvedValueOnce({ tool_calls: [call("c3", "restore", { ids: [3] }), call("c4", "move-to-trash", { ids: [1] }), call("c5", "move-to-trash", { ids: [2] })] })
      .mockResolvedValueOnce({ answer: "Done." });
    const approve = vi.fn(async (_item: AgentToolCall, _tool: AgentTool) => true);
    const run = vi.fn(async (_item: AgentToolCall, _approved: boolean) => ({ result: {} }));
    await runAgentLoop({ tools: TOOLS, ask, run, approve, onProgress: () => undefined });
    expect(approve.mock.calls.map(([item]) => item.id)).toEqual(["c1", "c4", "c5"]);
    expect(run.mock.calls.every(([, approved]) => approved)).toBe(true);
  });

  it("records a decline and an unknown tool without running them", async () => {
    const ask = vi
      .fn()
      .mockResolvedValueOnce({ tool_calls: [call("c1", "move-to-trash", { ids: [1] }), call("c2", "drop-tables")] })
      .mockResolvedValueOnce({ answer: "Okay, nothing was moved." });
    const run = vi.fn();
    const outcome = await runAgentLoop({ tools: TOOLS, ask, run, approve: async () => false, onProgress: () => undefined });
    expect(run).not.toHaveBeenCalled();
    expect(outcome.steps).toEqual([
      { ...call("c1", "move-to-trash", { ids: [1] }), result: null, declined: true },
      { ...call("c2", "drop-tables"), result: null, error: "This tool isn't available on this site." },
    ]);
    expect(ask.mock.calls[1][0]).toHaveLength(2);
  });

  it("stops after the step limit", async () => {
    let n = 0;
    const ask = vi.fn(async (_steps: AgentStep[]) => ({ tool_calls: [call(`c${++n}`, "scan"), call(`c${++n}`, "scan"), call(`c${++n}`, "scan"), call(`c${++n}`, "scan"), call(`c${++n}`, "scan")] }));
    const outcome = await runAgentLoop({ tools: TOOLS, ask, run: async () => ({ result: { finished: false } }), approve: async () => true, onProgress: () => undefined });
    expect(outcome.stopped).toBe(true);
    expect(outcome.reply).toBeNull();
    expect(outcome.steps).toHaveLength(MAX_STEPS);
    // 5 + 5 + 2 steps, then one more ask with 12 steps that still wants tools.
    expect(ask.mock.calls.map(([steps]) => steps.length)).toEqual([0, 5, 10, 12]);
  });

  it("passes errors from Services up", async () => {
    const ask = vi.fn().mockRejectedValue(new Error("Too many questions"));
    await expect(runAgentLoop({ tools: TOOLS, ask, run: vi.fn(), approve: vi.fn(), onProgress: () => undefined })).rejects.toThrow("Too many questions");
  });
});

describe("compactSteps", () => {
  const big = (fill: string, size: number) => ({ settings: fill.repeat(size) });
  const step = (id: string, name: string, result: unknown) => ({ id, name, input: null, result });

  it("keeps only the newest result of a tool in full", () => {
    const out = compactSteps([step("1", "natural-text-to-speech/get-settings", big("a", 500)), step("2", "natural-text-to-speech/get-settings", big("b", 500))]);
    expect(out[0].result).toEqual({ compacted: "Replaced by a newer call of this tool below." });
    expect(out[1].result).toEqual(big("b", 500));
  });

  it("compacts the oldest results when they're over the budget, never the newest", () => {
    const steps = [step("1", "a/one", big("x", 15_000)), step("2", "a/two", big("y", 15_000)), step("3", "a/three", big("z", 15_000))];
    const out = compactSteps(steps);
    expect((out[0].result as { compacted?: string }).compacted).toMatch(/save space/);
    expect(out[2].result).toEqual(big("z", 15_000));
    expect(JSON.stringify(out.map((item) => item.result)).length).toBeLessThan(STEP_RESULTS_BUDGET + 1_000);
    // The steps shown in the chat are left alone.
    expect(steps[0].result).toEqual(big("x", 15_000));
  });

  it("leaves small results, errors and declines as they are", () => {
    const steps = [{ id: "1", name: "a/one", input: null, result: null, error: "Failed" }, step("2", "a/one", { ok: true })];
    expect(compactSteps(steps)).toEqual(steps);
  });
});
