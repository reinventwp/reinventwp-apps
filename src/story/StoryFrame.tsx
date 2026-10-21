import { Box } from "@mui/material";
import { AnimatePresence, motion, useInView, useReducedMotion } from "framer-motion";
import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";

/**
 * Three-step story player, copied from reinventwp-next
 * (src/content/Demo/Plugins/NaturalTTS/sections/business-impact/StoryFrame.tsx).
 * Plays only while on screen and the tab is visible; reduced motion shows the last step.
 */

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

export type StoryPhase = 0 | 1 | 2;

const PHASE_MS = [2500, 2500, 3000] as const;

interface StoryPlayback {
  phase: StoryPhase;
  playing: boolean;
}

const StoryContext = createContext<StoryPlayback>({ phase: 2, playing: false });

export const useStory = () => useContext(StoryContext);

const usePageVisible = () => {
  const [visible, setVisible] = useState(() => document.visibilityState !== "hidden");

  useEffect(() => {
    const onChange = () => setVisible(document.visibilityState !== "hidden");
    document.addEventListener("visibilitychange", onChange);
    return () => document.removeEventListener("visibilitychange", onChange);
  }, []);

  return visible;
};

const useStoryTimer = (active: boolean): StoryPhase => {
  const [phase, setPhase] = useState<StoryPhase>(0);

  useEffect(() => {
    if (!active) return undefined;
    const timer = setTimeout(() => setPhase((current) => ((current + 1) % 3) as StoryPhase), PHASE_MS[phase]);
    return () => clearTimeout(timer);
  }, [active, phase]);

  return phase;
};

interface StoryFrameProps {
  captions: readonly [string, string, string];
  children: ReactNode;
}

/** A 200×128 scene with a caption under it that changes with each step. */
export default function StoryFrame({ captions, children }: StoryFrameProps) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { amount: 0.3 });
  const visible = usePageVisible();
  const reduced = useReducedMotion() ?? false;
  const playing = inView && visible && !reduced;
  const timedPhase = useStoryTimer(playing);
  const phase: StoryPhase = reduced ? 2 : timedPhase;

  return (
    <Box ref={ref} sx={{ width: "100%" }}>
      <Box aria-hidden="true" sx={{ height: 128, mx: "auto", maxWidth: 240, position: "relative", width: "100%" }}>
        <StoryContext.Provider value={{ phase, playing }}>{children}</StoryContext.Provider>
      </Box>
      <Box sx={{ height: 22, position: "relative" }}>
        <AnimatePresence initial={false}>
          <Box
            animate={{ opacity: 1, y: 0 }}
            component={motion.div}
            exit={{ opacity: 0, y: -4 }}
            initial={{ opacity: 0, y: 4 }}
            key={phase}
            transition={{ duration: reduced ? 0 : 0.3, ease: EASE }}
            sx={{
              color: "text.secondary",
              fontSize: 12.5,
              fontWeight: 650,
              left: 0,
              lineHeight: "22px",
              position: "absolute",
              right: 0,
              textAlign: "center",
            }}
          >
            {captions[phase]}
          </Box>
        </AnimatePresence>
      </Box>
    </Box>
  );
}
