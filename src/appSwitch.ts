import { createContext } from "react";
import type { HubApp } from "./types";

/**
 * Activate and Deactivate in the background: the hub's admin-post links (class-hub.php activate() / deactivate())
 * answer with JSON when `format=json` is added, so the card changes in place instead of reloading the page.
 */

/** What a switch comes back with: the app's new card, or a page to go to (the last app was deactivated). */
export type SwitchResult = { app: HubApp } | { reload: string };

/** The link with `format=json` added. */
export function jsonUrl(url: string): string {
  return `${url}${url.includes("?") ? "&" : "?"}format=json`;
}

/**
 * The answer as a result, or null when it isn't one (an error, an old hub copy that redirects instead).
 *
 * @example
 * readSwitch({ success: true, data: { app } }); // { app }
 */
export function readSwitch(body: unknown): SwitchResult | null {
  if (typeof body !== "object" || body === null || (body as { success?: unknown }).success !== true) return null;
  const data = (body as { data?: { app?: HubApp | null; reload?: unknown } }).data;
  if (data?.app && typeof data.app.slug === "string") return { app: data.app };
  if (typeof data?.reload === "string" && data.reload) return { reload: data.reload };
  return null;
}

/** Runs one Activate or Deactivate link in the background; null when it didn't work (the caller follows the link). */
export async function switchApp(url: string): Promise<SwitchResult | null> {
  try {
    const response = await fetch(jsonUrl(url), { credentials: "same-origin", headers: { Accept: "application/json" } });
    return readSwitch(await response.json());
  } catch {
    return null;
  }
}

/**
 * Fired on window after the hub activated or deactivated an app in the background, with the app's new card as
 * `detail`. The assistant (bot.js, its own bundle) listens: it updates the app's state and fetches the site's tools
 * again, because an activated app brings its abilities and a deactivated one takes them away.
 */
export const APP_CHANGED = "reinventwp:app-changed";

/** Tells the rest of the page (the assistant) that an app changed. */
export function announceApp(app: HubApp): void {
  window.dispatchEvent(new CustomEvent<HubApp>(APP_CHANGED, { detail: app }));
}

/** Replaces one app's card on the page (App.tsx provides it). */
export const UpdateAppContext = createContext<(app: HubApp) => void>(() => undefined);
