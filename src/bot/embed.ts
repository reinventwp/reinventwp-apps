/**
 * Lets a host page draw the assistant inside its own layout instead of as the floating panel. The
 * AI Agent plugin's admin page (a Claude-style app with its own sidebar) uses it for its chat view,
 * so the chat, its welcome and its agent loop are the same code everywhere.
 *
 *   window.reinventwpBotApi.mount(element, { agent?, readOnly? })  // draws the chat into element; returns an unmount function.
 *                                                      // `agent` (tools, run, chats, nonce) is used when the page has no
 *                                                      // window.reinventwpBotAgent (the AI Agent dev server).
 *                                                      // `readOnly`: a conversation to read (reinventwp.com's chat log):
 *                                                      // no input, no request to Services, nothing saved in the browser.
 *   window.reinventwpBotApi.newChat()                  // starts a new conversation (the host's "New chat")
 *   window.reinventwpBotApi.openChat(id)               // opens a chat saved in WordPress (AI Agent)
 *   window.reinventwpBotApi.load(messages)             // shows a conversation the host has
 *   window.reinventwpBotApi.onChange(fn)               // fn({ messages, busy, chatId, savedAt }) after every change
 *   window.reinventwpBotApi.openSettings()             // opens the assistant's settings (where it shows, panel, placement)
 *   window.reinventwpBotApi.registerPage(page)         // a plugin's admin page gives the assistant tools while it's open
 *                                                      // (e.g. read and change its settings); returns an unregister function
 *
 * bot.js may load before or after the host app, so it also fires "reinventwp-bot:ready" on window
 * once the API exists. After a host has mounted once, the floating ask bar stays hidden on that page.
 */

import type { BotAgentConfig, BotPage, PageTool } from "./types";

type Listener = () => void;

/** What a host is told after every change: the conversation as it can be saved, and whether a reply is still coming. */
export interface BotEmbedChange {
  messages: unknown[];
  busy: boolean;
  /** The saved chat open now (AI Agent), or null for a chat that isn't saved yet. */
  chatId: number | null;
  /** When the chat was last saved (ms), so the host can refresh its list. */
  savedAt: number;
}

export interface BotEmbedApi {
  mount: (element: HTMLElement, options?: { agent?: BotAgentConfig; readOnly?: boolean }) => () => void;
  newChat: () => void;
  openChat: (id: number) => void;
  load: (messages: unknown[]) => void;
  onChange: (listener: (change: BotEmbedChange) => void) => () => void;
  openSettings: () => void;
  registerPage: (page: BotPage) => () => void;
}

declare global {
  interface Window {
    reinventwpBotApi?: BotEmbedApi;
  }
}

export const EMBED_READY_EVENT = "reinventwp-bot:ready";

let host: HTMLElement | null = null;
let hosted = false;
/** The host only shows conversations (load); nothing can be asked. */
let readOnly = false;
/**
 * The last conversation a host loaded, handed to the chat when it subscribes: the API exists as soon as bot.js runs,
 * but the chat subscribes a moment later, so a load() in between would be lost.
 */
let lastLoad: unknown[] | null = null;
/** Agent config from the host, used when the page printed none. */
let hostAgent: BotAgentConfig | undefined;
const openChatListeners = new Set<(id: number) => void>();
const hostListeners = new Set<Listener>();
const newChatListeners = new Set<Listener>();
const loadListeners = new Set<(messages: unknown[]) => void>();
const changeListeners = new Set<(change: BotEmbedChange) => void>();
const settingsListeners = new Set<Listener>();
/** Admin pages open now that gave the assistant tools. */
const pages = new Set<BotPage>();

const setHost = (element: HTMLElement | null) => {
  host = element;
  if (element) hosted = true;
  hostListeners.forEach((listener) => listener());
};

export const embedStore = {
  /** The element the chat is drawn into, or null for the floating panel. */
  host: () => host,
  /** True once any host has mounted on this page. */
  hosted: () => hosted,
  /** The agent config a host passed to mount(), if any. */
  agent: () => hostAgent,
  /** True while a host that only shows conversations is mounted. */
  readOnly: () => readOnly,
  /** The tools the open admin pages give the assistant (names already carry the plugin's slug). */
  pageTools(): PageTool[] {
    return Array.from(pages).flatMap((page) => page.tools);
  },
  onOpenSettings(listener: Listener) {
    settingsListeners.add(listener);
    return () => {
      settingsListeners.delete(listener);
    };
  },
  onOpenChat(listener: (id: number) => void) {
    openChatListeners.add(listener);
    return () => {
      openChatListeners.delete(listener);
    };
  },
  subscribe(listener: Listener) {
    hostListeners.add(listener);
    return () => {
      hostListeners.delete(listener);
    };
  },
  onNewChat(listener: Listener) {
    newChatListeners.add(listener);
    return () => {
      newChatListeners.delete(listener);
    };
  },
  onLoad(listener: (messages: unknown[]) => void) {
    loadListeners.add(listener);
    if (lastLoad) listener(lastLoad);
    return () => {
      loadListeners.delete(listener);
    };
  },
  /** Tells the host about a change (Bot calls it whenever the conversation changes). */
  emitChange(change: BotEmbedChange) {
    changeListeners.forEach((listener) => listener(change));
  },
};

/** Publishes window.reinventwpBotApi and tells a host page that is already waiting. */
export function installEmbedApi(): void {
  window.reinventwpBotApi = {
    mount(element, options) {
      if (options?.agent && !window.reinventwpBotAgent) hostAgent = options.agent;
      readOnly = options?.readOnly === true;
      setHost(element);
      return () => {
        if (host !== element) return;
        readOnly = false;
        lastLoad = null;
        setHost(null);
      };
    },
    newChat() {
      newChatListeners.forEach((listener) => listener());
    },
    openChat(id) {
      if (Number.isInteger(id) && id > 0) openChatListeners.forEach((listener) => listener(id));
    },
    load(messages) {
      if (!Array.isArray(messages)) return;
      lastLoad = messages;
      loadListeners.forEach((listener) => listener(messages));
    },
    onChange(listener) {
      changeListeners.add(listener);
      return () => {
        changeListeners.delete(listener);
      };
    },
    openSettings() {
      settingsListeners.forEach((listener) => listener());
    },
    registerPage(page) {
      // Only well-formed tools, named "<plugin>/<action>" like WordPress abilities, and only for this plugin.
      const tools = Array.isArray(page?.tools)
        ? page.tools.filter((tool) => typeof tool?.run === "function" && typeof tool.name === "string" && tool.name.startsWith(`${page.app}/`) && /^[a-z0-9-]+\/[a-z0-9-]+$/.test(tool.name))
        : [];
      const entry: BotPage = { app: String(page?.app ?? ""), tools };
      pages.add(entry);
      return () => {
        pages.delete(entry);
      };
    },
  };
  window.dispatchEvent(new Event(EMBED_READY_EVENT));
}
