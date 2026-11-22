/**
 * reinventwp.com only (CHATBOT:CHAT_LOG in Reinvent WP Services): which visitor and which conversation a question
 * belongs to, so Services can keep each visitor's chats together. A random session id lives in localStorage (it
 * stays across visits until the visitor clears their browser data), with where the visitor first opened the
 * assistant; a random chat id lives in sessionStorage next to the conversation and changes on "New chat". Neither
 * says who the visitor is. Never used in wp-admin.
 */

const SESSION_KEY = "rwpbot_session";
const CHAT_KEY = "rwpbot_chat";
const UTM_KEYS = ["source", "medium", "campaign", "content", "term"] as const;

export interface VisitorSession {
  id: string;
  /** The page the visitor first opened the assistant on. */
  firstPage: string;
  /** Where they came from: scheme, host and path (no query). */
  referrer: string;
  utm: Partial<Record<(typeof UTM_KEYS)[number], string>>;
}

/** The session part of a website question. */
export interface QuestionSession {
  id: string;
  chat: string;
  visitor: { lang: string; firstPage: string; referrer: string; utm: VisitorSession["utm"] };
}

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

/** A random id with a prefix ("s_7Hk29xQm4pLz"), from the browser's crypto when it has it. */
export function randomId(prefix: "s" | "c", length = 14): string {
  const bytes = new Uint8Array(length);
  if (typeof crypto !== "undefined" && crypto.getRandomValues) crypto.getRandomValues(bytes);
  else for (let index = 0; index < length; index++) bytes[index] = Math.floor(Math.random() * 256);
  return `${prefix}_${Array.from(bytes, (byte) => ALPHABET[byte % ALPHABET.length]).join("")}`;
}

/** A referrer without its query or fragment (they can carry personal data); "" when there is none or it isn't a URL. */
export function cleanReferrer(value: string): string {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:" ? `${url.protocol}//${url.host}${url.pathname}`.slice(0, 200) : "";
  } catch {
    return "";
  }
}

/** The utm_* parameters of a query string. */
export function readUtm(search: string): VisitorSession["utm"] {
  const params = new URLSearchParams(search);
  const utm: VisitorSession["utm"] = {};
  for (const key of UTM_KEYS) {
    const value = params.get(`utm_${key}`)?.trim().slice(0, 80);
    if (value) utm[key] = value;
  }
  return utm;
}

function read<T>(storage: Storage, key: string): T | null {
  try {
    const value = storage.getItem(key);
    return value ? (JSON.parse(value) as T) : null;
  } catch {
    return null;
  }
}

function write(storage: Storage, key: string, value: unknown): void {
  try {
    storage.setItem(key, JSON.stringify(value));
  } catch {
    // Without storage each page load is a new session; the assistant still answers.
  }
}

/** This visitor's session, made on their first question (with the page and referrer of that moment). */
export function visitorSession(): VisitorSession {
  const saved = read<VisitorSession>(localStorage, SESSION_KEY);
  if (saved && /^s_[A-Za-z0-9]{10,40}$/.test(saved.id)) return saved;
  const session: VisitorSession = {
    id: randomId("s"),
    firstPage: window.location.pathname.slice(0, 80),
    // An internal referrer only says which reinventwp.com page came before: not where the visitor came from.
    referrer: document.referrer && !document.referrer.startsWith(window.location.origin) ? cleanReferrer(document.referrer) : "",
    utm: readUtm(window.location.search),
  };
  write(localStorage, SESSION_KEY, session);
  return session;
}

/** The current conversation's id; a new one after "New chat" (newChat) or in a new tab. */
export function chatId(): string {
  const saved = read<string>(sessionStorage, CHAT_KEY);
  if (saved && /^c_[A-Za-z0-9]{6,40}$/.test(saved)) return saved;
  const id = randomId("c");
  write(sessionStorage, CHAT_KEY, id);
  return id;
}

/** "New chat": the next question starts another conversation in the same session. */
export function newChat(): void {
  write(sessionStorage, CHAT_KEY, randomId("c"));
}

/** What a website question sends about its visitor and conversation. */
export function questionSession(): QuestionSession {
  const session = visitorSession();
  return {
    id: session.id,
    chat: chatId(),
    visitor: { lang: (navigator.language || "").slice(0, 20), firstPage: session.firstPage, referrer: session.referrer, utm: session.utm },
  };
}
