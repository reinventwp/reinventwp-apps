import { keyframes } from "@emotion/react";
import { CircularProgress, Stack, Typography } from "@mui/material";
import { useEffect, useState } from "react";
import strings from "../strings";

/** How long each step shows. */
const STEP_MS = 2500;

const fadeIn = keyframes`from { opacity: 0; transform: translateY(2px); } to { opacity: 1; transform: none; }`;

/**
 * The steps shown while waiting, so a 10–20 second answer doesn't feel stuck: what was attached
 * first, then the usual work, ending on one that stays until the answer arrives. They're not live
 * progress, just the order the work usually happens in.
 */
export function thinkingSteps({ image, file, wpAdmin }: { image: boolean; file: boolean; wpAdmin: boolean }): string[] {
  return [
    ...(image ? [strings.ask_step_image] : []),
    ...(file ? [strings.ask_step_file] : []),
    strings.ask_step_search,
    strings.ask_step_docs,
    ...(wpAdmin ? [strings.ask_step_site] : []),
    strings.ask_step_write,
    strings.ask_step_almost,
  ];
}

/** "Searching reinventwp.com…" and the next steps in turn, under a small spinner. */
export default function ThinkingIndicator({ steps }: { steps: string[] }) {
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (step >= steps.length - 1) return undefined;
    const timer = setTimeout(() => setStep((current) => current + 1), STEP_MS);
    return () => clearTimeout(timer);
  }, [step, steps.length]);

  return (
    <Stack direction="row" spacing={1} alignItems="center" sx={{ color: "text.secondary" }} role="status" aria-live="polite">
      <CircularProgress size={14} />
      <Typography
        key={step}
        variant="body2"
        sx={{ animation: `${fadeIn} 0.3s ease-out`, "@media (prefers-reduced-motion: reduce)": { animation: "none" } }}
      >
        {steps[step] ?? strings.ask_thinking}
      </Typography>
    </Stack>
  );
}
