import { Box, ButtonBase, Typography } from "@mui/material";
import type { ReactNode } from "react";
import type { PanelMode, Placement } from "./placement";

/**
 * Small drawn previews for the assistant settings, animated the way reinventwp.com draws its
 * mocks (boxes and lines, CSS keyframes, looping, still for people who prefer reduced motion).
 */

const PAGE = "#E9E9E5";
const LINE = "#FFFFFF";
const PANEL = "#FFFFFF";
const PANEL_HEAD = "#E3E3DF";
const INK = "#004984";
const LOOP = "7s";

const still = { "@media (prefers-reduced-motion: reduce)": { animation: "none" } } as const;

/** A few white lines that stand for page content. */
function PageLines() {
  return (
    <Box sx={{ display: "grid", gap: "5px", p: "8px" }}>
      <Box sx={{ bgcolor: LINE, borderRadius: "3px", height: 8, width: "70%" }} />
      <Box sx={{ bgcolor: LINE, borderRadius: "3px", height: 5 }} />
      <Box sx={{ bgcolor: LINE, borderRadius: "3px", height: 5, width: "90%" }} />
      <Box sx={{ bgcolor: LINE, borderRadius: "3px", height: 5, width: "80%" }} />
      <Box sx={{ bgcolor: LINE, borderRadius: "3px", height: 5, width: "60%" }} />
    </Box>
  );
}

/** The chat panel: a header strip and two message lines. */
function MiniPanel({ floating }: { floating: boolean }) {
  return (
    <Box
      sx={{
        bgcolor: PANEL,
        height: "100%",
        borderRadius: floating ? "6px" : 0,
        boxShadow: floating ? "0 4px 12px rgba(7, 21, 34, 0.18)" : "-2px 0 6px rgba(7, 21, 34, 0.08)",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Box sx={{ bgcolor: PANEL_HEAD, height: 10, flex: "0 0 auto" }} />
      <Box sx={{ display: "grid", gap: "4px", p: "5px", flex: 1, alignContent: "start" }}>
        <Box sx={{ bgcolor: "#EDEDEA", borderRadius: "3px", height: 4, width: "70%" }} />
        <Box sx={{ bgcolor: "#EDEDEA", borderRadius: "3px", height: 4, width: "50%", justifySelf: "end" }} />
      </Box>
      <Box sx={{ border: "1px solid #E1E1DC", borderRadius: "6px", height: 8, m: "4px", flex: "0 0 auto" }} />
    </Box>
  );
}

/** A mouse pointer drawn in SVG. */
function Pointer() {
  return (
    <Box component="svg" viewBox="0 0 12 16" sx={{ width: 10, height: 14, display: "block", filter: "drop-shadow(0 1px 1px rgba(0,0,0,0.3))" }}>
      <path d="M1 1 L1 13 L4 10 L6.5 15 L8.5 14 L6 9 L10.5 9 Z" fill="#111" stroke="#fff" strokeWidth="1" strokeLinejoin="round" />
    </Box>
  );
}

/** "Beside the page": the panel slides in and the page gets narrower to make room. */
function BesidePreview() {
  return (
    <>
      <Box
        sx={{
          position: "absolute",
          inset: 0,
          "@keyframes besidePage": { "0%, 15%": { right: 0 }, "35%, 80%": { right: "40%" }, "95%, 100%": { right: 0 } },
          animation: `besidePage ${LOOP} ease-in-out infinite`,
          ...still,
          right: { xs: "40%" },
        }}
      >
        <PageLines />
      </Box>
      <Box
        sx={{
          position: "absolute",
          top: 0,
          bottom: 0,
          right: 0,
          width: "40%",
          "@keyframes besidePanel": {
            "0%, 15%": { transform: "translateX(100%)" },
            "35%, 80%": { transform: "translateX(0)" },
            "95%, 100%": { transform: "translateX(100%)" },
          },
          animation: `besidePanel ${LOOP} ease-in-out infinite`,
          ...still,
        }}
      >
        <MiniPanel floating={false} />
      </Box>
    </>
  );
}

/** "Over the page": a pointer drags the floating panel by its header, then resizes it from a corner. */
function OverPreview() {
  return (
    <>
      <Box sx={{ position: "absolute", inset: 0 }}>
        <PageLines />
      </Box>
      <Box
        sx={{
          position: "absolute",
          "@keyframes overPanel": {
            "0%, 12%": { left: "56%", top: "8%", width: "38%", height: "84%" },
            "35%, 45%": { left: "22%", top: "14%", width: "38%", height: "72%" },
            "62%, 78%": { left: "22%", top: "14%", width: "52%", height: "78%" },
            "95%, 100%": { left: "56%", top: "8%", width: "38%", height: "84%" },
          },
          animation: `overPanel ${LOOP} ease-in-out infinite`,
          ...still,
          left: "56%",
          top: "8%",
          width: "38%",
          height: "84%",
        }}
      >
        <MiniPanel floating />
      </Box>
      <Box
        aria-hidden
        sx={{
          position: "absolute",
          // On the header while dragging, then on the bottom-right corner while resizing.
          "@keyframes overPointer": {
            "0%": { left: "90%", top: "60%", opacity: 0 },
            "8%": { left: "72%", top: "12%", opacity: 1 },
            "12%": { left: "72%", top: "12%", transform: "scale(0.85)" },
            "35%": { left: "38%", top: "18%", transform: "scale(0.85)" },
            "42%": { left: "38%", top: "18%", transform: "scale(1)" },
            "55%": { left: "58%", top: "84%", transform: "scale(1)" },
            "62%": { left: "58%", top: "84%", transform: "scale(0.85)" },
            "78%": { left: "72%", top: "90%", transform: "scale(0.85)" },
            "85%": { left: "72%", top: "90%", transform: "scale(1)", opacity: 1 },
            "95%, 100%": { left: "90%", top: "60%", opacity: 0 },
          },
          animation: `overPointer ${LOOP} ease-in-out infinite`,
          ...still,
          left: "72%",
          top: "12%",
        }}
      >
        <Pointer />
      </Box>
    </>
  );
}

/** Where the minimized assistant waits: a pill at the bottom, or a round button in a corner. */
function PlacementMock({ placement }: { placement: Placement }) {
  const pulse = {
    "@keyframes placementPulse": {
      "0%, 100%": { boxShadow: "0 0 0 0 rgba(0, 73, 132, 0.35)" },
      "50%": { boxShadow: "0 0 0 5px rgba(0, 73, 132, 0)" },
    },
    animation: "placementPulse 2s ease-in-out infinite",
    ...still,
  };
  return (
    <>
      <Box sx={{ position: "absolute", inset: 0 }}>
        <PageLines />
      </Box>
      {placement === "bar" ? (
        <Box
          sx={{
            position: "absolute",
            bottom: 6,
            left: "18%",
            right: "18%",
            height: 10,
            borderRadius: 999,
            bgcolor: PANEL,
            border: `1px solid ${INK}`,
            ...pulse,
          }}
        />
      ) : (
        <Box sx={{ position: "absolute", bottom: 6, [placement]: 6, width: 14, height: 14, borderRadius: "50%", bgcolor: INK, ...pulse }} />
      )}
    </>
  );
}

/** The drawn window frame every preview sits in. */
function Frame({ children, height }: { children: ReactNode; height: number }) {
  return (
    <Box sx={{ position: "relative", height, bgcolor: PAGE, borderRadius: "8px", overflow: "hidden", border: "1px solid rgba(7, 21, 34, 0.08)" }}>
      {children}
    </Box>
  );
}

export function PanelModePreview({ mode }: { mode: PanelMode }) {
  return <Frame height={92}>{mode === "beside" ? <BesidePreview /> : <OverPreview />}</Frame>;
}

export function PlacementPreview({ placement }: { placement: Placement }) {
  return (
    <Frame height={56}>
      <PlacementMock placement={placement} />
    </Frame>
  );
}

/** A selectable card: the preview on top, the name and a short line under it. */
export function OptionCard({
  selected,
  onSelect,
  preview,
  label,
  help,
}: {
  selected: boolean;
  onSelect: () => void;
  preview: ReactNode;
  label: string;
  help?: string;
}) {
  return (
    <ButtonBase
      role="radio"
      aria-checked={selected}
      onClick={onSelect}
      sx={{
        display: "block",
        width: "100%",
        textAlign: "left",
        p: 1,
        borderRadius: "12px",
        border: selected ? `2px solid ${INK}` : "2px solid rgba(7, 21, 34, 0.1)",
        bgcolor: selected ? "rgba(0, 73, 132, 0.04)" : "#FFFFFF",
        transition: "border-color 0.15s ease, background-color 0.15s ease",
        "&:hover": { borderColor: selected ? INK : "rgba(7, 21, 34, 0.25)" },
        "&.Mui-focusVisible": { outline: `2px solid ${INK}`, outlineOffset: 2 },
      }}
    >
      {preview}
      <Typography variant="body2" sx={{ fontWeight: 600, mt: 1, color: selected ? INK : "text.primary" }}>
        {label}
      </Typography>
      {help && (
        <Typography variant="caption" color="text.secondary" component="p" sx={{ lineHeight: 1.4 }}>
          {help}
        </Typography>
      )}
    </ButtonBase>
  );
}
