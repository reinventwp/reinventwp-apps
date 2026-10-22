import { useState } from "react";

/** The field was shrunk to a chat icon. */
export const MINIMIZED_KEY = "reinventwp-assistant-minimized";

/** The side panel was open, so it opens again after a reload. */
export const OPEN_KEY = "reinventwp-assistant-open";

type Storage = Pick<globalThis.Storage, "getItem" | "setItem" | "removeItem">;

/** A remembered on/off flag; false when storage is blocked (private mode, policies). */
export function readFlag(storage: Storage | undefined, key: string): boolean {
  try {
    return storage?.getItem(key) === "1";
  } catch {
    return false;
  }
}

/** Remembers a flag; best effort, so a blocked storage only loses it on reload. */
export function writeFlag(storage: Storage | undefined, key: string, on: boolean): void {
  try {
    if (on) storage?.setItem(key, "1");
    else storage?.removeItem(key);
  } catch {
    // Keep the in-memory value.
  }
}

const browserStorage = (): Storage | undefined => {
  try {
    return window.localStorage;
  } catch {
    return undefined;
  }
};

/** An on/off state kept in localStorage, so it survives reloads and applies across the site. */
export default function useStoredFlag(key: string): [boolean, (on: boolean) => void] {
  const [on, setOn] = useState(() => readFlag(browserStorage(), key));

  const update = (next: boolean) => {
    setOn(next);
    writeFlag(browserStorage(), key, next);
  };

  return [on, update];
}
