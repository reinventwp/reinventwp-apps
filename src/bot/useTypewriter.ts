import { useEffect, useState } from "react";

const TYPE_MS = 55;
const ERASE_MS = 25;
const HOLD_MS = 2200;
const NEXT_MS = 350;

export interface TypewriterState {
  /** Which phrase is on screen. */
  index: number;
  /** How many of its characters are shown. */
  length: number;
  erasing: boolean;
}

/** The next step of the typewriter, and how long to wait before taking it. */
export function nextStep(state: TypewriterState, phrases: string[]): { state: TypewriterState; wait: number } {
  const phrase = phrases[state.index] ?? "";
  if (!state.erasing && state.length < phrase.length) return { state: { ...state, length: state.length + 1 }, wait: TYPE_MS };
  if (!state.erasing) return { state: { ...state, erasing: true }, wait: HOLD_MS };
  if (state.length > 0) return { state: { ...state, length: state.length - 1 }, wait: ERASE_MS };
  return { state: { index: (state.index + 1) % phrases.length, length: 0, erasing: false }, wait: NEXT_MS };
}

const prefersReducedMotion = () => typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

/**
 * Types each phrase, holds it, erases it and moves to the next, while `running`. With reduced
 * motion it just shows the first phrase. It waits while the browser tab is hidden.
 */
export default function useTypewriter(phrases: string[], running: boolean): { text: string; animated: boolean } {
  const animated = running && phrases.length > 1 && !prefersReducedMotion();
  const [state, setState] = useState<TypewriterState>({ index: 0, length: animated ? 0 : (phrases[0]?.length ?? 0), erasing: false });

  useEffect(() => {
    if (!animated) return undefined;
    const { state: next, wait } = nextStep(state, phrases);
    const timer = setTimeout(() => {
      if (document.visibilityState !== "hidden") setState(next);
      else setState({ ...state });
    }, wait);
    return () => clearTimeout(timer);
  }, [animated, phrases, state]);

  const phrase = phrases[animated ? state.index : 0] ?? "";
  return { text: animated ? phrase.slice(0, state.length) : phrase, animated };
}
