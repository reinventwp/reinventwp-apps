import { useCallback, useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";

/** Where the floating panel ("Over the page") sits, in viewport pixels. */
export interface Geometry {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** The area the panel may use: the window, minus the admin bar at the top. */
export interface Bounds {
  width: number;
  height: number;
  top: number;
}

/** One of the 8 resize handles: edges n, e, s, w and corners ne, se, sw, nw. */
export type Handle = "n" | "e" | "s" | "w" | "ne" | "se" | "sw" | "nw";

export const HANDLES: Handle[] = ["n", "e", "s", "w", "ne", "se", "sw", "nw"];

export const MIN_WIDTH = 320;
export const MIN_HEIGHT = 360;
/** Space kept between the default floating panel and the window edges. */
const GAP = 12;

export const GEOMETRY_KEY = "reinventwp-assistant-geometry";

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), Math.max(min, max));

/** The first floating position: docked on the right, inset from the edges, full height. */
export function defaultGeometry(bounds: Bounds, preferredWidth = 400): Geometry {
  const width = clamp(preferredWidth, MIN_WIDTH, bounds.width - 2 * GAP);
  const height = Math.max(MIN_HEIGHT, bounds.height - bounds.top - 2 * GAP);
  return clampGeometry({ x: bounds.width - width - GAP, y: bounds.top + GAP, width, height }, bounds);
}

/** Keeps the panel at least its minimum size and fully inside the window, below the admin bar. */
export function clampGeometry(geometry: Geometry, bounds: Bounds): Geometry {
  const width = clamp(geometry.width, MIN_WIDTH, bounds.width);
  const height = clamp(geometry.height, MIN_HEIGHT, bounds.height - bounds.top);
  return {
    width,
    height,
    x: clamp(geometry.x, 0, bounds.width - width),
    y: clamp(geometry.y, bounds.top, bounds.height - height),
  };
}

/** The panel moved by (dx, dy) from where the drag started. */
export function dragGeometry(start: Geometry, dx: number, dy: number, bounds: Bounds): Geometry {
  return clampGeometry({ ...start, x: start.x + dx, y: start.y + dy }, bounds);
}

/**
 * The panel resized from one handle by (dx, dy). The opposite edge stays put, the size never goes
 * below the minimum, and the panel never leaves the window.
 */
export function resizeGeometry(start: Geometry, handle: Handle, dx: number, dy: number, bounds: Bounds): Geometry {
  let { x, y, width, height } = start;
  const right = start.x + start.width;
  const bottom = start.y + start.height;

  if (handle.includes("e")) width = clamp(start.width + dx, MIN_WIDTH, bounds.width - start.x);
  if (handle.includes("s")) height = clamp(start.height + dy, MIN_HEIGHT, bounds.height - start.y);
  if (handle.includes("w")) {
    x = clamp(start.x + dx, 0, right - MIN_WIDTH);
    width = right - x;
  }
  if (handle.includes("n")) {
    y = clamp(start.y + dy, bounds.top, bottom - MIN_HEIGHT);
    height = bottom - y;
  }
  return { x, y, width, height };
}

type Storage = Pick<globalThis.Storage, "getItem" | "setItem">;

/** The saved floating position; null when there is none or it is not valid. */
export function readGeometry(storage: Storage | undefined): Geometry | null {
  try {
    const saved = JSON.parse(storage?.getItem(GEOMETRY_KEY) ?? "null") as Partial<Geometry> | null;
    if (!saved) return null;
    const values = [saved.x, saved.y, saved.width, saved.height];
    if (!values.every((value) => typeof value === "number" && Number.isFinite(value))) return null;
    return saved as Geometry;
  } catch {
    return null;
  }
}

/** Saves the floating position; best effort. */
export function writeGeometry(storage: Storage | undefined, geometry: Geometry): void {
  try {
    storage?.setItem(GEOMETRY_KEY, JSON.stringify(geometry));
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

/** Cursor for each resize handle. */
export const HANDLE_CURSOR: Record<Handle, string> = {
  n: "ns-resize",
  s: "ns-resize",
  e: "ew-resize",
  w: "ew-resize",
  ne: "nesw-resize",
  sw: "nesw-resize",
  nw: "nwse-resize",
  se: "nwse-resize",
};

interface FloatingOptions {
  /** True while the panel floats over the page (and the screen is wide enough). */
  floating: boolean;
  /** Pixels taken by the admin bar at the top. */
  top: number;
  /** Called when a drag starts on the docked panel, so it can float. */
  onFloat: () => void;
}

/**
 * Drag (from the header) and resize (from 8 handles) for the floating panel. The position is kept
 * in localStorage and pulled back inside the window when the window shrinks.
 */
export function useFloatingPanel({ floating, top, onFloat }: FloatingOptions) {
  const panelRef = useRef<HTMLElement | null>(null);
  const [geometry, setGeometry] = useState<Geometry | null>(() => readGeometry(browserStorage()));
  const [moving, setMoving] = useState(false);
  /** The handle being dragged right now, so its border sides can light up. */
  const [resizing, setResizing] = useState<Handle | null>(null);

  const bounds = useCallback((): Bounds => ({ width: window.innerWidth, height: window.innerHeight, top }), [top]);

  // Pull the panel back inside when the window gets smaller.
  useEffect(() => {
    if (!floating) return undefined;
    const fit = () => setGeometry((current) => clampGeometry(current ?? defaultGeometry(bounds()), bounds()));
    fit();
    window.addEventListener("resize", fit);
    return () => window.removeEventListener("resize", fit);
  }, [floating, bounds]);

  /** Follows the pointer until it is released, then saves the position. */
  const track = (event: ReactPointerEvent, start: Geometry, next: (start: Geometry, dx: number, dy: number) => Geometry, cursor: string) => {
    event.preventDefault();
    const originX = event.clientX;
    const originY = event.clientY;
    let latest = start;
    setMoving(true);
    const previousCursor = document.body.style.cursor;
    const previousSelect = document.body.style.userSelect;
    document.body.style.cursor = cursor;
    document.body.style.userSelect = "none";

    const move = (moveEvent: PointerEvent) => {
      latest = next(start, moveEvent.clientX - originX, moveEvent.clientY - originY);
      setGeometry(latest);
    };
    const stop = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", stop);
      window.removeEventListener("pointercancel", stop);
      document.body.style.cursor = previousCursor;
      document.body.style.userSelect = previousSelect;
      setMoving(false);
      setResizing(null);
      writeGeometry(browserStorage(), latest);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", stop);
    window.addEventListener("pointercancel", stop);
  };

  /** Header pointer down: starts a drag (buttons and links in the header keep working). */
  const onDragStart = (event: ReactPointerEvent) => {
    if (event.button !== 0 || (event.target as Element).closest("button, a, input, textarea")) return;
    if (window.innerWidth < 600) return;
    let start = geometry ?? defaultGeometry(bounds());
    if (!floating) {
      // Docked beside the page: float from exactly where it is now, then follow the pointer.
      const rect = panelRef.current?.getBoundingClientRect();
      if (rect) start = clampGeometry({ x: rect.left, y: rect.top, width: rect.width, height: rect.height }, bounds());
      setGeometry(start);
      onFloat();
    }
    track(event, start, (from, dx, dy) => dragGeometry(from, dx, dy, bounds()), "grabbing");
  };

  /** Resize handle pointer down. */
  const onResizeStart = (handle: Handle) => (event: ReactPointerEvent) => {
    if (event.button !== 0 || !geometry) return;
    event.stopPropagation();
    setResizing(handle);
    track(event, geometry, (from, dx, dy) => resizeGeometry(from, handle, dx, dy, bounds()), HANDLE_CURSOR[handle]);
  };

  return { panelRef, geometry: floating ? geometry : null, moving, resizing, onDragStart, onResizeStart };
}
