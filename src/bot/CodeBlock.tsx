import CheckRoundedIcon from "@mui/icons-material/CheckRounded";
import ContentCopyRoundedIcon from "@mui/icons-material/ContentCopyRounded";
import { Box, IconButton, Tooltip } from "@mui/material";
import { useEffect, useRef, useState, type ReactNode } from "react";
import strings from "../strings";
import copyText from "./clipboard";

/** A code block in an answer, with a copy button at the top right. */
export default function CodeBlock({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLPreElement>(null);
  const [result, setResult] = useState<"copied" | "failed" | null>(null);

  useEffect(() => {
    if (!result) return undefined;
    const timer = setTimeout(() => setResult(null), result === "copied" ? 1500 : 4000);
    return () => clearTimeout(timer);
  }, [result]);

  /** Copies the code; if the browser refuses, selects it so Ctrl+C / ⌘+C copies it. */
  const copy = async () => {
    const pre = ref.current;
    const text = pre?.innerText.replace(/\n$/, "") ?? "";
    if (!pre || !text) return;
    const copied = await copyText(text).catch(() => false);
    if (!copied) {
      const range = document.createRange();
      range.selectNodeContents(pre);
      window.getSelection()?.removeAllRanges();
      window.getSelection()?.addRange(range);
    }
    setResult(copied ? "copied" : "failed");
  };
  const copied = result === "copied";
  const label = copied ? strings.ask_copied : result === "failed" ? strings.ask_copy_failed : strings.ask_copy;

  return (
    <Box sx={{ position: "relative", my: 1, "&:hover .rwpbot-copy, &:focus-within .rwpbot-copy": { opacity: 1 } }}>
      <Box component="pre" ref={ref} sx={{ m: "0 !important", pr: "44px !important" }}>
        {children}
      </Box>
      <Tooltip title={label} open={result ? true : undefined}>
        <IconButton
          className="rwpbot-copy"
          aria-label={label}
          onClick={() => void copy()}
          size="small"
          sx={{
            position: "absolute",
            top: 6,
            right: 6,
            opacity: { xs: 1, md: copied ? 1 : 0.6 },
            bgcolor: "#FFFFFF",
            border: "1px solid rgba(7, 21, 34, 0.12)",
            color: copied ? "success.main" : "text.secondary",
            transition: "opacity 0.15s ease",
            "&:hover, &:focus": { bgcolor: "#FFFFFF", color: copied ? "success.main" : "primary.main" },
          }}
        >
          {copied ? <CheckRoundedIcon sx={{ fontSize: 16 }} /> : <ContentCopyRoundedIcon sx={{ fontSize: 16 }} />}
        </IconButton>
      </Tooltip>
    </Box>
  );
}
