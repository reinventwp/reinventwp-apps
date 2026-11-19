import { useCallback, useEffect, useRef, useState, type MouseEvent as ReactMouseEvent, type PointerEvent as ReactPointerEvent } from "react";

/**
 * Dragging the closed assistant (the ask bar, the chat icon) away from its usual spot. The element keeps its
 * normal CSS position and moves by an offset (a CSS translate), so its default layout logic stays as it is.
 */

/** How far the element has been moved from its usual spot, in pixels. */
export interface Offset {
  dx: number;
  dy: number;
}

/** The smallest and largest offsets that keep the element fully inside the window. */
export interface OffsetLimits {
  minDx: number;
  maxDx: number;
  minDy: number;
  maxDy: number;
}

/** A pointer moving less than this is a click, not a drag. */
export const DRAG_THRESHOLD = 5;
/** Space kept between the dragged element and the window edges. */
const EDGE = 8;
const ZERO: Offset = { dx: 0, dy: 0 };

type Storage = Pick<globalThis.Storage, "getItem" | "setItem">;

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), Math.max(min, max));

/**
 * The offsets that keep an element on screen, from where it is now (its rectangle with the current offset) and
 * the window. `top` is the space taken at the top, like the WordPress admin bar.
 *
 * @example
 * dragLimits({ left: 100, top: 700, right: 152, bottom: 752 }, { dx: 0, dy: 0 }, { width: 1440, height: 800, top: 32 });
 * // { minDx: -92, maxDx: 1280, minDy: -660, maxDy: 40 }
 */
export function dragLimits(
  rect: { left: number; top: number; right: number; bottom: number },
  offset: Offset,
  viewport: { width: number; height: number; top: number },
): OffsetLimits {
  return {
    minDx: offset.dx - rect.left + EDGE,
    maxDx: offset.dx + viewport.width - rect.right - EDGE,
    minDy: offset.dy - rect.top + viewport.top + EDGE,
    maxDy: offset.dy + viewport.height - rect.bottom - EDGE,
  };
}

/** An offset kept inside the limits. */
export function clampOffset(offset: Offset, limits: OffsetLimits): Offset {
  return { dx: clamp(offset.dx, limits.minDx, limits.maxDx), dy: clamp(offset.dy, limits.minDy, limits.maxDy) };
}

/** The saved offset, or none for a missing, broken or blocked value. */
export function readOffset(storage: Storage | undefined, key: string): Offset {
  try {
    const saved = JSON.parse(storage?.getItem(key) ?? "null") as Partial<Offset> | null;
    return saved && Number.isFinite(saved.dx) && Number.isFinite(saved.dy) ? { dx: Number(saved.dx), dy: Number(saved.dy) } : ZERO;
  } catch {
    return ZERO;
  }
}

/** Saves the offset; best effort, so blocked storage only loses it on reload. */
export function writeOffset(storage: Storage | undefined, key: string, offset: Offset): void {
  try {
    storage?.setItem(key, JSON.stringify({ dx: Math.round(offset.dx), dy: Math.round(offset.dy) }));
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

const viewport = () => ({ width: window.innerWidth, height: window.innerHeight, top: document.getElementById("wpadminbar")?.offsetHeight ?? 0 });

interface DragState {
  pointerId: number;
  startX: number;
  startY: number;
  origin: Offset;
  limits: OffsetLimits;
  moved: boolean;
}

/**
 * Lets the user drag an element; a press that barely moves stays a click. The offset is remembered per `key` in
 * this browser and kept on screen when the window shrinks. Spread `handlers` on the element and use `transform`.
 */
export function useDragOffset(key: string) {
  const ref = useRef<HTMLDivElement | null>(null);
  const drag = useRef<DragState | null>(null);
  const swallowClick = useRef(false);
  const [offset, setOffset] = useState<Offset>(() => readOffset(browserStorage(), key));
  const [dragging, setDragging] = useState(false);

  // Another placement has its own spot.
  useEffect(() => {
    setOffset(readOffset(browserStorage(), key));
  }, [key]);

  // Keep it on screen when the window gets smaller.
  useEffect(() => {
    const keepVisible = () => {
      const rect = ref.current?.getBoundingClientRect();
      if (!rect) return;
      setOffset((current) => clampOffset(current, dragLimits(rect, current, viewport())));
    };
    keepVisible();
    window.addEventListener("resize", keepVisible);
    return () => window.removeEventListener("resize", keepVisible);
  }, [key]);

  const onPointerDown = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      if (event.button !== 0 || !ref.current) return;
      const rect = ref.current.getBoundingClientRect();
      drag.current = { pointerId: event.pointerId, startX: event.clientX, startY: event.clientY, origin: offset, limits: dragLimits(rect, offset, viewport()), moved: false };
    },
    [offset],
  );

  const onPointerMove = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    const state = drag.current;
    if (!state || state.pointerId !== event.pointerId) return;
    const dx = event.clientX - state.startX;
    const dy = event.clientY - state.startY;
    if (!state.moved) {
      if (Math.hypot(dx, dy) < DRAG_THRESHOLD) return;
      state.moved = true;
      setDragging(true);
      ref.current?.setPointerCapture(event.pointerId);
    }
    setOffset(clampOffset({ dx: state.origin.dx + dx, dy: state.origin.dy + dy }, state.limits));
  }, []);

  const finish = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      const state = drag.current;
      if (!state || state.pointerId !== event.pointerId) return;
      drag.current = null;
      if (!state.moved) return;
      swallowClick.current = true;
      setDragging(false);
      setOffset((current) => {
        writeOffset(browserStorage(), key, current);
        return current;
      });
    },
    [key],
  );

  // The click that ends a drag must not open the chat or press a button.
  const onClickCapture = useCallback((event: ReactMouseEvent<HTMLDivElement>) => {
    if (!swallowClick.current) return;
    swallowClick.current = false;
    event.preventDefault();
    event.stopPropagation();
  }, []);

  return {
    dragging,
    transform: offset.dx || offset.dy ? `translate(${offset.dx}px, ${offset.dy}px)` : undefined,
    handlers: { ref, onPointerDown, onPointerMove, onPointerUp: finish, onPointerCancel: finish, onClickCapture },
  };
}
