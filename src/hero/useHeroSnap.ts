import { type RefObject, useCallback, useEffect } from "react";

/** After this long without a scroll event, the page has come to rest. */
const REST_MS = 120;
/** Scrolling up from the page into the hero by less than this goes back to the page instead of up to the hero. */
const BACK_UP_PX = 80;

/** The scroll position where the hero has fully left the screen and the page under it starts below wp-admin's bar. */
function pageTop(hero: HTMLElement): number {
  const bar = document.getElementById("wpadminbar");
  const barHeight = bar && getComputedStyle(bar).position === "fixed" ? bar.offsetHeight : 0;
  return Math.max(0, Math.round(hero.getBoundingClientRect().bottom + window.scrollY - barHeight));
}

const behavior = (): ScrollBehavior => (window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth");

/**
 * Keeps the window from resting half on the hero and half on the page under it: when a scroll stops in between, it
 * carries on to the page (scrolling down) or back to the hero (scrolling up). Below the hero, scrolling is free.
 * Returns the "Scroll down" action: go to the page.
 */
export default function useHeroSnap(hero: RefObject<HTMLElement | null>): () => void {
  useEffect(() => {
    let lastY = window.scrollY;
    let goingDown = true;
    let timer = 0;

    const rest = () => {
      const element = hero.current;
      if (!element) return;
      const end = pageTop(element);
      const y = window.scrollY;
      if (y <= 1 || y >= end - 1) return;
      const toPage = goingDown || y > end - BACK_UP_PX;
      window.scrollTo({ top: toPage ? end : 0, behavior: behavior() });
    };
    const onScroll = () => {
      const y = window.scrollY;
      if (y !== lastY) goingDown = y > lastY;
      lastY = y;
      window.clearTimeout(timer);
      timer = window.setTimeout(rest, REST_MS);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.clearTimeout(timer);
    };
  }, [hero]);

  return useCallback(() => {
    if (hero.current) window.scrollTo({ top: pageTop(hero.current), behavior: behavior() });
  }, [hero]);
}
