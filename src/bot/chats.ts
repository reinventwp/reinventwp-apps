import type { BotAgentConfig } from "./types";

/**
 * The chats AI Agent saves in WordPress (its routes in components/chat-sessions.php). Only on
 * wp-admin when AI Agent is active, which prints `chats` in window.reinventwpBotAgent.
 */

/** A saved chat as lists show it. */
export interface SavedChat {
  id: number;
  title: string;
  /** ISO time of the last change (UTC). */
  updated: string;
  archived: boolean;
}

/** The chat routes' address and login, from AI Agent. */
export type ChatsConfig = Pick<BotAgentConfig, "nonce"> & { chats: string };

/** The config when AI Agent offers saved chats, else null. */
export function chatsConfig(agent: BotAgentConfig | undefined): ChatsConfig | null {
  return agent?.chats ? { chats: agent.chats, nonce: agent.nonce } : null;
}

/**
 * The address of a chat route: rest_url() gives "/wp-json/ai-agent/v1/chats" with pretty
 * permalinks and "/?rest_route=/ai-agent/v1/chats" without, so the id goes on the path and
 * query values are added with & or ? as needed.
 *
 * @example chatRoute("/?rest_route=/ai-agent/v1/chats", 12) // "/?rest_route=/ai-agent/v1/chats/12"
 * @example chatRoute("/wp-json/ai-agent/v1/chats", null, { archived: "1" }) // "/wp-json/ai-agent/v1/chats?archived=1"
 */
export function chatRoute(base: string, id: number | null = null, query: Record<string, string> = {}): string {
  const [path, search = ""] = base.split("?");
  const params = new URLSearchParams(search);
  let route = path;
  // With plain permalinks the route is the rest_route value, not the path.
  if (params.has("rest_route")) {
    if (id !== null) params.set("rest_route", `${params.get("rest_route")}/${id}`);
  } else if (id !== null) {
    route = `${path.replace(/\/$/, "")}/${id}`;
  }
  Object.entries(query).forEach(([key, value]) => params.set(key, value));
  const rest = params.toString().replace(/%2F/g, "/");
  return rest ? `${route}?${rest}` : route;
}

async function call<T>(config: ChatsConfig, url: string, method = "GET", body?: unknown): Promise<T> {
  const response = await fetch(url, {
    method,
    // Same origin in WordPress; "include" also lets the AI Agent dev page (another port) use it.
    credentials: "include",
    headers: { "X-WP-Nonce": config.nonce, ...(body === undefined ? {} : { "Content-Type": "application/json" }) },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const data = (await response.json().catch(() => null)) as (T & { message?: string }) | null;
  if (!response.ok || !data) throw new Error(data?.message || `HTTP ${response.status}`);
  return data;
}

export const chatsApi = {
  list: (config: ChatsConfig, archived = false) =>
    call<{ chats: SavedChat[] }>(config, chatRoute(config.chats, null, archived ? { archived: "1" } : {})).then((data) => data.chats ?? []),
  get: (config: ChatsConfig, id: number) => call<SavedChat & { messages: unknown[] }>(config, chatRoute(config.chats, id)),
  create: (config: ChatsConfig, messages: unknown[]) => call<SavedChat>(config, chatRoute(config.chats), "POST", { messages }),
  update: (config: ChatsConfig, id: number, patch: { messages?: unknown[]; title?: string; archived?: boolean }) =>
    call<SavedChat>(config, chatRoute(config.chats, id), "POST", patch),
  remove: (config: ChatsConfig, id: number) => call<{ deleted: boolean }>(config, chatRoute(config.chats, id), "DELETE"),
};
