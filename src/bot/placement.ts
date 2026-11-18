import { useState } from "react";
import { MINIMIZED_KEY } from "./storedFlag";

/** Where the closed assistant sits: the ask bar at the bottom centre, or a chat button in a bottom corner. */
export type Placement = "bar" | "right" | "left";

export const PLACEMENTS: Placement[] = ["bar", "right", "left"];

/** The admin's choice from the settings dialog, kept in this browser. */
export const PLACEMENT_KEY = "reinventwp-assistant-placement";

type Storage = Pick<globalThis.Storage, "getItem" | "setItem" | "removeItem">;

/**
 * The saved placement. Before the setting existed, minimizing saved MINIMIZED_KEY, which means the
 * button on the right. Blocked storage (private mode, policies) gives the default bar.
 */
export function readPlacement(storage: Storage | undefined): Placement {
  try {
    const saved = storage?.getItem(PLACEMENT_KEY);
    if (saved && (PLACEMENTS as string[]).includes(saved)) return saved as Placement;
    return storage?.getItem(MINIMIZED_KEY) === "1" ? "right" : "bar";
  } catch {
    return "bar";
  }
}

/** Saves the placement and drops the old minimized flag; best effort, so blocked storage only loses it on reload. */
export function writePlacement(storage: Storage | undefined, placement: Placement): void {
  try {
    storage?.setItem(PLACEMENT_KEY, placement);
    storage?.removeItem(MINIMIZED_KEY);
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

/** The placement, remembered in localStorage across reloads and admin pages. */
export default function usePlacement(): [Placement, (placement: Placement) => void] {
  const [placement, setPlacement] = useState<Placement>(() => readPlacement(browserStorage()));

  const update = (next: Placement) => {
    setPlacement(next);
    writePlacement(browserStorage(), next);
  };

  return [placement, update];
}

/** How the open chat panel sits: beside the page (the page narrows to make room) or over it. */
export type PanelMode = "beside" | "over";

export const PANEL_MODES: PanelMode[] = ["beside", "over"];

export const PANEL_MODE_KEY = "reinventwp-assistant-panel";

/** The saved panel mode; "beside" (the page makes room) when nothing valid is saved or storage is blocked. */
export function readPanelMode(storage: Storage | undefined): PanelMode {
  try {
    return storage?.getItem(PANEL_MODE_KEY) === "over" ? "over" : "beside";
  } catch {
    return "beside";
  }
}

/** Saves the panel mode; best effort. */
export function writePanelMode(storage: Storage | undefined, mode: PanelMode): void {
  try {
    storage?.setItem(PANEL_MODE_KEY, mode);
  } catch {
    // Keep the in-memory value.
  }
}

/** The panel mode, remembered in localStorage across reloads and admin pages. */
export function usePanelMode(): [PanelMode, (mode: PanelMode) => void] {
  const [mode, setMode] = useState<PanelMode>(() => readPanelMode(browserStorage()));

  const update = (next: PanelMode) => {
    setMode(next);
    writePanelMode(browserStorage(), next);
  };

  return [mode, update];
}
