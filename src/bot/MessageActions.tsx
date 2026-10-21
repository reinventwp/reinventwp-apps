import CheckRoundedIcon from "@mui/icons-material/CheckRounded";
import ContentCopyRoundedIcon from "@mui/icons-material/ContentCopyRounded";
import { IconButton, Stack, Tooltip, Typography } from "@mui/material";
import { useEffect, useState } from "react";
import strings from "../strings";
import copyText from "./clipboard";
import { exactTime, relativeTime } from "./time";

interface MessageActionsProps {
  text: string;
  /** When the message was sent; older chats have none. */
  at?: number;
  now: number;
  align: "left" | "right";
}

/** Under a message, shown on hover: when it was sent ("4 minutes ago") and a copy button. */
export default function MessageActions({ text, at, now, align }: MessageActionsProps) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return undefined;
    const timer = setTimeout(() => setCopied(false), 1500);
    return () => clearTimeout(timer);
  }, [copied]);

  return (
    <Stack
      className="rwpbot-message-actions"
      direction="row"
      spacing={0.25}
      alignItems="center"
      justifyContent={align === "right" ? "flex-end" : "flex-start"}
      sx={{ minHeight: 26, color: "text.secondary", transition: "opacity 0.15s ease" }}
    >
      {at && (
        <Tooltip title={exactTime(at)}>
          <Typography variant="caption" sx={{ fontSize: "0.75rem", px: 0.5, cursor: "default" }}>
            {relativeTime(at, now)}
          </Typography>
        </Tooltip>
      )}
      {text && (
        <Tooltip title={copied ? strings.ask_copied : strings.ask_copy_message}>
          <IconButton
            aria-label={copied ? strings.ask_copied : strings.ask_copy_message}
            onClick={async () => setCopied(await copyText(text).catch(() => false))}
            size="small"
            sx={{ p: 0.5, color: copied ? "success.main" : "text.secondary", "&:hover, &:focus": { color: copied ? "success.main" : "primary.main" } }}
          >
            {copied ? <CheckRoundedIcon sx={{ fontSize: 15 }} /> : <ContentCopyRoundedIcon sx={{ fontSize: 15 }} />}
          </IconButton>
        </Tooltip>
      )}
    </Stack>
  );
}
