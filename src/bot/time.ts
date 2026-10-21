import { useEffect, useState } from "react";

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

const relative = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

/** "just now", "4 minutes ago", "2 hours ago", "yesterday", or a date for anything older. */
export function relativeTime(at: number, now: number): string {
  const ago = Math.max(0, now - at);
  if (ago < 45_000) return "just now";
  if (ago < HOUR) return relative.format(-Math.max(1, Math.round(ago / MINUTE)), "minute");
  if (ago < DAY) return relative.format(-Math.round(ago / HOUR), "hour");
  if (ago < 2 * DAY) return relative.format(-1, "day");
  return new Date(at).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

/** The exact time, for the tooltip: "21 Oct 2026, 18:42". */
export const exactTime = (at: number) =>
  new Date(at).toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });

/** The current time, updated every minute, so "4 minutes ago" stays right while the panel is open. */
export function useNow(): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), MINUTE);
    return () => clearInterval(timer);
  }, []);
  return now;
}
