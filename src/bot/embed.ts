/**
 * Lets a host page draw the assistant inside its own layout instead of as the floating panel. The
 * AI Agent plugin's admin page (a Claude-style app with its own sidebar) uses it for its chat view,
 * so the chat, its welcome and its agent loop are the same code everywhere.
 *
 *   window.reinventwpBotApi.mount(element, { agent? })  // draws the chat into element; returns an unmount function.
 *                                                      // `agent` (tools, run, chats, nonce) is used when the page has no
 *                                                      // window.reinventwpBotAgent (the AI Agent dev server).
 *   window.reinventwpBotApi.newChat()                  // starts a new conversation (the host's "New chat")
 *   window.reinventwpBotApi.openChat(id)               // opens a chat saved in WordPress (AI Agent)
 *   window.reinventwpBotApi.load(messages)             // shows a conversation the host has
 *   window.reinventwpBotApi.onChange(fn)               // fn({ messages, busy, chatId, savedAt }) after every change
 *
 * bot.js may load before or after the host app, so it also fires "reinventwp-bot:ready" on window
 * once the API exists. After a host has mounted once, the floating ask bar stays hidden on that page.
 */

import type { BotAgentConfig } from "./types";

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
  mount: (element: HTMLElement, options?: { agent?: BotAgentConfig }) => () => void;
  newChat: () => void;
  openChat: (id: number) => void;
  load: (messages: unknown[]) => void;
  onChange: (listener: (change: BotEmbedChange) => void) => () => void;
}

declare global {
  interface Window {
    reinventwpBotApi?: BotEmbedApi;
  }
}

export const EMBED_READY_EVENT = "reinventwp-bot:ready";

let host: HTMLElement | null = null;
let hosted = false;
/** Agent config from the host, used when the page printed none. */
let hostAgent: BotAgentConfig | undefined;
const openChatListeners = new Set<(id: number) => void>();
const hostListeners = new Set<Listener>();
const newChatListeners = new Set<Listener>();
const loadListeners = new Set<(messages: unknown[]) => void>();
const changeListeners = new Set<(change: BotEmbedChange) => void>();

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
      setHost(element);
      return () => {
        if (host === element) setHost(null);
      };
    },
    newChat() {
      newChatListeners.forEach((listener) => listener());
    },
    openChat(id) {
      if (Number.isInteger(id) && id > 0) openChatListeners.forEach((listener) => listener(id));
    },
    load(messages) {
      if (Array.isArray(messages)) loadListeners.forEach((listener) => listener(messages));
    },
    onChange(listener) {
      changeListeners.add(listener);
      return () => {
        changeListeners.delete(listener);
      };
    },
  };
  window.dispatchEvent(new Event(EMBED_READY_EVENT));
}
