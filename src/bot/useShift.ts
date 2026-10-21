import { useEffect, useState } from "react";

/** Narrower than this, the panel covers the page instead of pushing it aside. */
const SHIFT_MIN_WIDTH = 900;

/**
 * Makes room for the open panel by narrowing `selector` (its right margin), the way the Apps
 * page grid used to; restores the element's own margin on close.
 */
export function useShift(selector: string | undefined, open: boolean, width: number): void {
  useEffect(() => {
    const element = selector ? document.querySelector<HTMLElement>(selector) : null;
    if (!element || !open) return undefined;
    const previous = { margin: element.style.marginRight, transition: element.style.transition };
    const apply = () => {
      element.style.transition = "margin-right 0.2s ease";
      element.style.marginRight = window.innerWidth >= SHIFT_MIN_WIDTH ? `${width}px` : previous.margin;
    };
    apply();
    window.addEventListener("resize", apply);
    return () => {
      window.removeEventListener("resize", apply);
      element.style.marginRight = previous.margin;
      element.style.transition = previous.transition;
    };
  }, [selector, open, width]);
}

/** The left edge and width of `selector` (else the viewport), kept up to date, to centre the ask bar over it. */
export function useAnchor(selector: string | undefined): { left: number; width: number } {
  const [box, setBox] = useState({ left: 0, width: typeof window === "undefined" ? 0 : window.innerWidth });

  useEffect(() => {
    const element = selector ? document.querySelector<HTMLElement>(selector) : null;
    const measure = () => {
      const rect = element?.getBoundingClientRect();
      setBox(rect ? { left: rect.left, width: rect.width } : { left: 0, width: window.innerWidth });
    };
    measure();
    window.addEventListener("resize", measure);
    const observer = element && typeof ResizeObserver !== "undefined" ? new ResizeObserver(measure) : null;
    if (element) observer?.observe(element);
    return () => {
      window.removeEventListener("resize", measure);
      observer?.disconnect();
    };
  }, [selector]);

  return box;
}
