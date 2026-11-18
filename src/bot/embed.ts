/**
 * Lets a host page draw the assistant inside its own layout instead of as the floating panel. The
 * AI Agent plugin's admin page (a Claude-style app with its own sidebar) uses it for its chat view,
 * so the chat, its welcome and its agent loop are the same code everywhere.
 *
 *   window.reinventwpBotApi.mount(element)  // draws the chat into element; returns an unmount function
 *   window.reinventwpBotApi.newChat()       // clears the conversation (the host's "New chat" button)
 *
 * bot.js may load before or after the host app, so it also fires "reinventwp-bot:ready" on window
 * once the API exists. After a host has mounted once, the floating ask bar stays hidden on that page.
 */

type Listener = () => void;

export interface BotEmbedApi {
  mount: (element: HTMLElement) => () => void;
  newChat: () => void;
}

declare global {
  interface Window {
    reinventwpBotApi?: BotEmbedApi;
  }
}

export const EMBED_READY_EVENT = "reinventwp-bot:ready";

let host: HTMLElement | null = null;
let hosted = false;
const hostListeners = new Set<Listener>();
const newChatListeners = new Set<Listener>();

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
};

/** Publishes window.reinventwpBotApi and tells a host page that is already waiting. */
export function installEmbedApi(): void {
  window.reinventwpBotApi = {
    mount(element) {
      setHost(element);
      return () => {
        if (host === element) setHost(null);
      };
    },
    newChat() {
      newChatListeners.forEach((listener) => listener());
    },
  };
  window.dispatchEvent(new Event(EMBED_READY_EVENT));
}
