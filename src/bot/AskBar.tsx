import ArrowUpwardRoundedIcon from "@mui/icons-material/ArrowUpwardRounded";
import { keyframes } from "@emotion/react";
import { Box, ButtonBase, Typography } from "@mui/material";
import { NEUTRAL_BORDER } from "../theme";
import useTypewriter from "./useTypewriter";

interface AskBarProps {
  /** The fixed label (screen readers, reduced motion). */
  placeholder: string;
  /** Phrases the field types in turn to catch the eye. */
  phrases: string[];
  /** The page area to centre over (the WordPress content area, or the viewport). */
  anchor: { left: number; width: number };
  onOpen: () => void;
}

const blink = keyframes`50% { opacity: 0; }`;

/** The "ask" field pinned to the bottom centre of the page; it types example problems and opens the assistant panel. */
export default function AskBar({ placeholder, phrases, anchor, onOpen }: AskBarProps) {
  const { text, animated } = useTypewriter(phrases, true);

  return (
    <Box
      sx={{ position: "fixed", bottom: 20, left: anchor.left, width: anchor.width, px: 2, boxSizing: "border-box", display: "flex", justifyContent: "center", pointerEvents: "none", zIndex: 9988 }}
    >
      <ButtonBase
        onClick={onOpen}
        aria-haspopup="dialog"
        aria-label={placeholder}
        sx={{
          pointerEvents: "auto",
          width: "100%",
          maxWidth: 480,
          justifyContent: "space-between",
          gap: 2,
          pl: 2.5,
          pr: 1,
          py: 1,
          borderRadius: 3,
          border: NEUTRAL_BORDER,
          backgroundColor: "#FFFFFF",
          boxShadow: "0 8px 24px rgba(7, 21, 34, 0.08)",
          transition: "border-color 0.2s ease",
          "&:hover, &:focus-visible": { borderColor: "primary.main" },
        }}
      >
        <Typography variant="body1" color="text.secondary" noWrap aria-hidden="true" sx={{ minWidth: 0 }}>
          {text}
          {animated && (
            <Box
              component="span"
              sx={{ display: "inline-block", width: "1.5px", height: "1.1em", ml: "1px", verticalAlign: "text-bottom", bgcolor: "primary.main", animation: `${blink} 1s step-end infinite` }}
            />
          )}
        </Typography>
        <Box sx={{ display: "grid", placeItems: "center", width: 34, height: 34, borderRadius: 2, bgcolor: "primary.main", color: "#FFFFFF", flexShrink: 0 }}>
          <ArrowUpwardRoundedIcon fontSize="small" />
        </Box>
      </ButtonBase>
    </Box>
  );
}
