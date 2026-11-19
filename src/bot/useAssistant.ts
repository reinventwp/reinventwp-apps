import { useCallback, useEffect, useRef, useState } from "react";
import strings from "../strings";
import type { HubApp } from "../types";
import {
  appName,
  approvalText,
  askRequest,
  compactSteps,
  fetchAgentTools,
  historyContent,
  MAX_STEPS,
  questionBody,
  runAgentLoop,
  runAgentTool,
  stepLine,
  type AssistantReply,
  type StepView,
} from "./agent";
import { chatsApi, chatsConfig } from "./chats";
import { imageSrc, type PreparedImage } from "./images";
import { fileSummary, type PreparedFile } from "./textFile";
import { embedStore } from "./embed";
import type { AgentStep, AgentTool, AgentToolCall, BotAgentConfig, BotConfig, PageTool } from "./types";

/** A settings screen of a suggested app; its card links straight to it. */
export interface AssistantSetting {
  id: string;
  name: string;
  /** "Podcast & Export Audio › Podcast RSS" */
  location: string;
  /** The app's settings page `path` parameter. */
  path: string;
}

export interface AssistantSuggestion {
  slug: string;
  title: string;
  reason: string;
  setting?: AssistantSetting;
}

/** A reinventwp.com section the answer is based on; Services builds the title and link. */
export interface AssistantSource {
  id: string;
  title: string;
  url: string;
}

/** One website search behind an answer: the user's question first, then the assistant's own keywords. */
export interface AssistantSearch {
  /** reinventwp.com (pages and readmes), or an installed app's settings screens. */
  where: "website" | "settings";
  plugin?: string;
  by: "question" | "assistant";
  query: string;
  /** Sections this search found first (ids into `AssistantResearch.sections`). */
  sections: string[];
  /** Sections it returned in total, including ones already read. */
  found: number;
}

/** What the assistant searched and read before answering. */
export interface AssistantResearch {
  searches: AssistantSearch[];
  /** A setting has no url; its link is built from the app's settings page and `path`. */
  sections: Array<{ id: string; page: string; heading: string; url: string; plugin?: string; path?: string }>;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  /** When it was sent (ms); chats from before times were kept have none. */
  at?: number;
  /** Small previews of the screenshots the user attached (kept in sessionStorage). */
  images?: string[];
  /** The shrunk screenshots, for viewing full size; in memory only, so not after a reload. */
  full?: string[];
  /** A text file the user attached: its name and what was sent ("newest 400 lines · 3 private values hidden"). */
  file?: { name: string; summary: string };
  /** The text that was sent, in memory only. */
  fileText?: string;
  /** The answer asks for the feedback form under it; `feedbackSent` once it was sent. */
  form?: "feedback";
  feedbackSent?: boolean;
  suggestions?: AssistantSuggestion[];
  sources?: AssistantSource[];
  research?: AssistantResearch;
  /** An error shown in the chat; never sent back as history. */
  failed?: boolean;
  /** What the assistant did on the site for this answer (wp-admin), one line per tool run. */
  steps?: StepView[];
  /** Still working through tool calls; the answer replaces `content` when it arrives. */
  working?: boolean;
  /** A change waiting for the admin's Approve or Decline. */
  approval?: { id: string; text: string };
}

const STORAGE_KEY = "reinventwp_apps_assistant";
/** The saved chat (AI Agent) this tab's conversation belongs to, so a reload keeps saving into it. */
const CHAT_KEY = "reinventwp_apps_assistant_chat";
/** Wait this long after an answer before saving it, so a quick follow-up saves once. */
const SAVE_DELAY_MS = 700;

function readChatId(): number | null {
  try {
    const value = Number(sessionStorage.getItem(CHAT_KEY));
    return Number.isInteger(value) && value > 0 ? value : null;
  } catch {
    return null;
  }
}

function writeChatId(id: number | null): void {
  try {
    if (id) sessionStorage.setItem(CHAT_KEY, String(id));
    else sessionStorage.removeItem(CHAT_KEY);
  } catch {
    // Without storage a reload starts a new saved chat.
  }
}

/** What is saved: no full-size screenshots or file texts (memory only), no unfinished state. */
function savable(messages: ChatMessage[]): ChatMessage[] {
  return messages.filter((message) => !message.working).map(({ full: _full, fileText: _fileText, approval: _approval, ...message }) => message);
}
/** Turns sent with each question (the service keeps at most 6). */
const HISTORY_TURNS = 6;

function load(): ChatMessage[] {
  try {
    const saved = JSON.parse(sessionStorage.getItem(STORAGE_KEY) || "[]");
    return Array.isArray(saved) ? saved.map(settle) : [];
  } catch {
    return [];
  }
}

/** A reload stops tool runs: an unfinished answer keeps its steps and says it stopped. */
function settle(message: ChatMessage): ChatMessage {
  if (!message.working && !message.approval) return message;
  const { working: _working, approval: _approval, ...rest } = message;
  return { ...rest, content: rest.content || strings.ask_agent_interrupted };
}

/** The site's tools, fetched once per page; null when AI Agent doesn't offer any. */
let agentTools: Promise<AgentTool[] | null> | null = null;

function loadAgentTools(agent: BotAgentConfig): Promise<AgentTool[] | null> {
  agentTools ??= fetchAgentTools(agent)
    .then((tools) => (tools.length ? tools : null))
    .catch(() => null);
  return agentTools;
}

/** Runs a tool the open admin page gave the assistant; a failure becomes the error the model is told. */
async function runPageTool(tool: PageTool, call: AgentToolCall): Promise<{ result: unknown; error?: string }> {
  try {
    return { result: (await tool.run(call.input)) ?? null };
  } catch (error) {
    return { result: null, error: error instanceof Error && error.message ? error.message : strings.ask_agent_error };
  }
}

/** Puts `patch` on the answer being worked on (the last message), or starts it. */
function patchWorking(current: ChatMessage[], patch: Partial<ChatMessage>): ChatMessage[] {
  const last = current[current.length - 1];
  if (last?.working) return [...current.slice(0, -1), { ...last, ...patch }];
  return [...current, { role: "assistant", content: "", at: Date.now(), working: true, ...patch }];
}

/** The finished answer: replaces the one being worked on, or is added. */
function finish(current: ChatMessage[], message: ChatMessage): ChatMessage[] {
  const last = current[current.length - 1];
  return last?.working ? [...current.slice(0, -1), { ...message, steps: message.steps ?? last.steps }] : [...current, message];
}

/**
 * The assistant conversation. It lives only in this tab (sessionStorage); each question
 * sends the last few turns, where it was asked (surface and page) and, in WordPress, this
 * site's Reinvent WP apps (slug, state, version) to Reinvent WP Services, which stores nothing.
 */
export default function useAssistant(config: BotConfig, errorText: string, apps: HubApp[], agentConfig?: BotAgentConfig) {
  const { url, surface, page } = config;
  const [messages, setMessages] = useState<ChatMessage[]>(load);
  const [loading, setLoading] = useState(false);
  /** The tool running now ("List unused media"), shown while waiting. */
  const [running, setRunning] = useState<string | null>(null);
  const approvalRef = useRef<((approved: boolean) => void) | null>(null);
  // Tools never run on reinventwp.com.
  const agent = surface === "wp-admin" ? agentConfig : undefined;
  // With AI Agent active, every finished answer is saved in WordPress (see chats.ts).
  const chats = chatsConfig(agent);
  const [chatId, setChatIdState] = useState<number | null>(readChatId);
  const chatIdRef = useRef(chatId);
  /** The JSON last saved or opened, so the same conversation is never saved twice. */
  const savedRef = useRef<string | null>(null);
  const savingRef = useRef(false);
  /** Bumped after each save, so lists (the history dialog, AI Agent's sidebar) refresh. */
  const [savedAt, setSavedAt] = useState(0);

  const setChatId = useCallback((id: number | null) => {
    chatIdRef.current = id;
    setChatIdState(id);
    writeChatId(id);
  }, []);

  useEffect(() => {
    if (!chats || loading || !messages.length) return undefined;
    const toSave = savable(messages);
    const json = JSON.stringify(toSave);
    if (!toSave.length || json === savedRef.current) return undefined;
    const timer = window.setTimeout(async () => {
      if (savingRef.current) return;
      savingRef.current = true;
      savedRef.current = json;
      try {
        const id = chatIdRef.current;
        if (id) await chatsApi.update(chats, id, { messages: toSave });
        else setChatId((await chatsApi.create(chats, toSave)).id);
        setSavedAt(Date.now());
      } catch (error) {
        savedRef.current = null;
        console.error("Reinvent WP Assistant: saving the chat failed", error);
      } finally {
        savingRef.current = false;
      }
    }, SAVE_DELAY_MS);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- chats is rebuilt from agent each render; its values are what matter.
  }, [chats?.chats, chats?.nonce, loading, messages, setChatId]);

  useEffect(() => {
    try {
      // Full-size screenshots stay in memory; storage keeps the small previews only.
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(messages.map(({ full: _full, fileText: _fileText, ...message }) => message)));
    } catch {
      // Private mode or full storage: the chat still works for this page view.
    }
  }, [messages]);

  const send = useCallback(
    async (text: string, images: PreparedImage[] = [], file: PreparedFile | null = null) => {
      const question = text.trim();
      if ((!question && !images.length && !file) || loading) return;
      // Earlier screenshots and files aren't sent again; the history only says one was there.
      const history = messages
        .filter((message) => !message.failed)
        .slice(-HISTORY_TURNS)
        .map(({ role, content, images: attached, file: sent, steps }) => ({
          role,
          content: [historyContent(content, steps), attached?.length ? "(image)" : "", sent ? `(file: ${sent.name})` : ""].filter(Boolean).join(" "),
        }));
      setMessages((current) => [
        ...current,
        {
          role: "user",
          content: question,
          at: Date.now(),
          ...(images.length && { images: images.map((image) => image.preview), full: images.map(imageSrc) }),
          ...(file && { file: { name: file.name, summary: fileSummary(file) }, fileText: file.text }),
        },
      ]);
      setLoading(true);
      // The open admin page's own tools (embed.ts registerPage) and the site's tools (AI Agent's abilities). A plugin
      // registers the same tools both ways; on its own page the page tool wins, because it works on the page's live
      // state and save (the server one would leave the page showing old values, and its Save would write them back).
      const siteTools = agent ? await loadAgentTools(agent) : null;
      const pageTools = surface === "wp-admin" ? embedStore.pageTools() : [];
      const merged = [...pageTools, ...(siteTools ?? []).filter((tool) => !pageTools.some((item) => item.name === tool.name))];
      const tools = merged.length ? merged : null;
      const pageTool = (name: string) => pageTools.find((tool) => tool.name === name);
      /** One request to Services (through AI Agent's bot/ask when it's there); with site tools, the steps so far go along. */
      const ask = async (steps: AgentStep[]): Promise<AssistantReply> => {
        const [askUrl, init] = askRequest(
          url,
          agent,
          JSON.stringify(
            questionBody({
              question,
              history,
              images: images.map(({ media_type, data }) => ({ media_type, data })),
              file,
              surface,
              // reinventwp.com navigates without reloading, so read the page the question is asked on.
              page: surface === "website" ? window.location.pathname : page,
              apps,
              // Older results are compacted so a long run (big settings lists, repeated scans) stays small.
              agent: tools && { tools, steps: compactSteps(steps) },
            }),
          ),
        );
        const response = await fetch(askUrl, init);
        const body = await response.json().catch(() => null);
        if (!response.ok || !body?.data) throw new Error(body?.message || errorText);
        return body.data;
      };
      const views = (steps: AgentStep[]) => steps.map((step) => stepLine(step, tools?.find((tool) => tool.name === step.name)));
      try {
        let reply: AssistantReply | null;
        let steps: StepView[] | undefined;
        let stopped = "";
        if (tools) {
          const outcome = await runAgentLoop({
            tools,
            ask,
            run: async (call, approved) => {
              const own = pageTool(call.name);
              if (own) return runPageTool(own, call);
              return agent ? runAgentTool(agent, call, approved) : { result: null, error: strings.ask_agent_unknown };
            },
            approve: (call, tool) =>
              new Promise<boolean>((resolve) => {
                approvalRef.current = resolve;
                const text = pageTool(call.name)?.approval?.(call.input) || approvalText(tool, call, appName(call.name, apps));
                setMessages((current) => patchWorking(current, { approval: { id: call.id, text } }));
              }),
            onProgress: (progress) => {
              setRunning(progress.running ? (tools.find((tool) => tool.name === progress.running?.name)?.label ?? progress.running.name) : null);
              setMessages((current) => patchWorking(current, { content: progress.message, steps: views(progress.steps) }));
            },
          });
          reply = outcome.reply;
          steps = outcome.steps.length ? views(outcome.steps) : undefined;
          if (outcome.stopped) stopped = [outcome.message, strings.ask_agent_stopped.replace("%d", String(MAX_STEPS))].filter(Boolean).join("\n\n");
        } else {
          reply = await ask([]);
        }
        const done: ChatMessage = reply
          ? { role: "assistant", content: String(reply.answer ?? ""), at: Date.now(), form: reply.form === "feedback" ? "feedback" : undefined, suggestions: reply.suggestions as AssistantSuggestion[] | undefined, sources: reply.sources as AssistantSource[] | undefined, research: reply.research as AssistantResearch | undefined, steps }
          : { role: "assistant", content: stopped, at: Date.now(), steps };
        setMessages((current) => finish(current, done));
      } catch (error) {
        const content = error instanceof Error && error.message ? error.message : errorText;
        setMessages((current) => finish(current, { role: "assistant", content, at: Date.now(), failed: true }));
      } finally {
        approvalRef.current = null;
        setRunning(null);
        setLoading(false);
      }
    },
    [agent, apps, errorText, loading, messages, page, surface, url],
  );

  /** The admin's answer on the Approve card. */
  const answerApproval = useCallback((approved: boolean) => {
    const resolve = approvalRef.current;
    if (!resolve) return;
    approvalRef.current = null;
    setMessages((current) => current.map((message) => (message.approval ? { ...message, approval: undefined } : message)));
    resolve(approved);
  }, []);

  const reset = useCallback(() => {
    setMessages([]);
    savedRef.current = null;
    setChatId(null);
  }, [setChatId]);

  /** Shows a saved conversation (a host page's chat history); unfinished tool runs are settled. */
  const loadSaved = useCallback((saved: ChatMessage[]) => setMessages(saved.map(settle)), []);

  /** Opens a saved chat (AI Agent): its messages replace the conversation, and new answers save into it. */
  const openChat = useCallback(
    async (id: number) => {
      if (!chats || loading) return;
      try {
        const chat = await chatsApi.get(chats, id);
        const saved = (Array.isArray(chat.messages) ? chat.messages : []) as ChatMessage[];
        savedRef.current = JSON.stringify(saved);
        setChatId(id);
        setMessages(saved.map(settle));
      } catch (error) {
        console.error("Reinvent WP Assistant: opening the chat failed", error);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps -- see the save effect.
    [chats?.chats, chats?.nonce, loading, setChatId],
  );

  /** Marks a message's feedback form as sent, so it shows "sent" even after a reload. */
  const markFeedbackSent = useCallback((index: number) => {
    setMessages((current) => current.map((message, at) => (at === index ? { ...message, feedbackSent: true } : message)));
  }, []);

  return { messages, loading, running, send, reset, loadSaved, openChat, chats, chatId, savedAt, markFeedbackSent, answerApproval };
}
