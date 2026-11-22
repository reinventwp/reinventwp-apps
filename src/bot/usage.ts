import type { BotAgentConfig, BotConfig } from "./types";

/**
 * The assistant's usage ring (CHATBOT:USAGE_RING): the asker's plan and what it has used of its hourly and monthly
 * allowance. Services answers per site for a Suite Pass (the request is signed through AI Agent's `bot/usage`) and
 * per IP otherwise (straight to Services); every answer carries the same object, so the ring follows each question.
 */

export interface UsageWindow {
  used: number;
  limit: number;
  /** ISO time the window starts again. */
  resets_at: string;
}

export interface AssistantUsage {
  plan: "free" | "pro";
  hour: UsageWindow;
  month: UsageWindow;
  /** Whether the assistant is switched on; only the usage endpoint says it (answers' usage leaves it out). */
  available?: boolean;
}

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null && !Array.isArray(value);

function readWindow(value: unknown): UsageWindow | null {
  if (!isRecord(value)) return null;
  const used = Number(value.used);
  const limit = Number(value.limit);
  if (!Number.isFinite(used) || !Number.isFinite(limit) || limit <= 0) return null;
  return { used: Math.max(0, used), limit, resets_at: typeof value.resets_at === "string" ? value.resets_at : "" };
}

/**
 * The usage from Services' object (the `usage` of an answer, or the usage endpoint's `data`); null when it isn't one.
 *
 * @example
 * readUsage({ plan: "pro", hour: { used: 18000, limit: 200000, resets_at: "…" }, month: { … } }); // { plan: "pro", … }
 */
export function readUsage(value: unknown): AssistantUsage | null {
  if (!isRecord(value)) return null;
  const hour = readWindow(value.hour);
  const month = readWindow(value.month);
  if (!hour || !month) return null;
  const usage: AssistantUsage = { plan: value.plan === "pro" ? "pro" : "free", hour, month };
  if (typeof value.available === "boolean") usage.available = value.available;
  return usage;
}

/** How full one window is, 0–1. */
export const shareOf = (window: UsageWindow): number => Math.min(1, window.used / window.limit);

/** The ring shows the window closest to its limit: that's the one that will stop the next question. */
export const ringShare = (usage: AssistantUsage): number => Math.max(shareOf(usage.hour), shareOf(usage.month));

/** Whole percent for the popup ("9%"); anything used shows at least 1%. */
export function percent(window: UsageWindow): string {
  const value = shareOf(window) * 100;
  return `${value > 0 && value < 1 ? 1 : Math.floor(value)}%`;
}

/** "21:00" when it starts again within a day, else "Dec 1", in the viewer's time; "" when unknown. */
export function resetLabel(iso: string, now = Date.now()): string {
  const date = new Date(iso);
  if (!iso || Number.isNaN(date.getTime())) return "";
  return date.getTime() - now < 86_400_000
    ? date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false })
    : date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

/** "ok" below 80%, "near" from 80%, "full" at the limit: the ring's colour. */
export const level = (share: number): "ok" | "near" | "full" => (share >= 1 ? "full" : share >= 0.8 ? "near" : "ok");

/** Where to read the usage: through AI Agent (signed, the site's Suite Pass) when it's there, else Services itself. */
export function usageRequest(config: Pick<BotConfig, "url">, agent?: BotAgentConfig): [string, RequestInit] {
  if (agent?.usage) return [agent.usage, { credentials: "include", headers: { "X-WP-Nonce": agent.nonce } }];
  return [`${config.url.replace(/\/+$/, "")}/usage`, {}];
}

/** The usage now, or null when it can't be read (the ring then stays hidden). */
export async function fetchUsage(config: Pick<BotConfig, "url">, agent?: BotAgentConfig): Promise<AssistantUsage | null> {
  try {
    const [url, init] = usageRequest(config, agent);
    const response = await fetch(url, init);
    const body = await response.json().catch(() => null);
    return response.ok ? readUsage(body?.data) : null;
  } catch {
    return null;
  }
}
