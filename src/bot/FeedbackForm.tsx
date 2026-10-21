import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import SendRoundedIcon from "@mui/icons-material/SendRounded";
import { Alert, Box, Button, Stack, TextField, Typography } from "@mui/material";
import { useState, type FormEvent } from "react";
import strings from "../strings";
import { NEUTRAL_BORDER } from "../theme";
import type { HubApp } from "../types";
import type { BotConfig } from "./types";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** "https://www.example.com/blog" → "www.example.com"; "" when it isn't a hostname. */
export function hostnameOf(value: string): string {
  const text = value.trim().toLowerCase();
  if (!text) return "";
  try {
    return new URL(text.includes("://") ? text : `https://${text}`).hostname;
  } catch {
    return "";
  }
}

/** Where feedback from the chat was sent from (FEEDBACK:SOURCE in Services). */
export function feedbackSource(config: BotConfig, apps: HubApp[]) {
  const website = config.surface === "website";
  const product = website ? "website" : config.page || "apps";
  const screen = website ? window.location.pathname : new URLSearchParams(window.location.search).get("path") || "";
  return { channel: "assistant", product, page: screen, version: apps.find((app) => app.slug === product)?.version ?? "" };
}

interface FeedbackFormProps {
  config: BotConfig;
  apps: HubApp[];
  /** What the user wrote before, to start the message with. */
  draft: string;
  sent: boolean;
  onSent: () => void;
}

/** The feedback form the assistant shows under an answer; it sends to Reinvent WP Services /feedback. */
export default function FeedbackForm({ config, apps, draft, sent, onSent }: FeedbackFormProps) {
  const feedback = config.feedback;
  const [email, setEmail] = useState(feedback?.email ?? "");
  const [website, setWebsite] = useState(feedback?.origin ?? "");
  const [message, setMessage] = useState(draft);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  if (!feedback?.url) return null;

  if (sent) {
    return (
      <Stack direction="row" spacing={1} alignItems="center" sx={{ color: "success.main" }}>
        <CheckCircleRoundedIcon sx={{ fontSize: 18 }} />
        <Typography variant="body2">{strings.feedback_sent}</Typography>
      </Stack>
    );
  }

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const origin = hostnameOf(website);
    if (!EMAIL.test(email.trim()) || !origin || !message.trim()) {
      setError(strings.feedback_check);
      return;
    }
    setSending(true);
    setError("");
    try {
      const response = await fetch(feedback.url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), origin, message: message.trim(), source: feedbackSource(config, apps) }),
      });
      const body = await response.json().catch(() => null);
      if (!response.ok) throw new Error(body?.message || strings.feedback_error);
      onSent();
    } catch (sendError) {
      setError(sendError instanceof Error && sendError.message ? sendError.message : strings.feedback_error);
    } finally {
      setSending(false);
    }
  };

  return (
    <Box component="form" onSubmit={(event) => void submit(event)} sx={{ border: NEUTRAL_BORDER, borderRadius: 2, p: 1.5, bgcolor: "#FFFFFF" }}>
      <Stack spacing={1.25}>
        <Typography variant="subtitle2" component="p">
          {strings.feedback_title}
        </Typography>
        <TextField size="small" type="email" label={strings.feedback_email} value={email} onChange={(event) => setEmail(event.target.value)} required />
        {!feedback.origin && (
          <TextField size="small" label={strings.feedback_website} placeholder="example.com" value={website} onChange={(event) => setWebsite(event.target.value)} required />
        )}
        <TextField
          size="small"
          multiline
          minRows={3}
          maxRows={8}
          label={strings.feedback_message}
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          inputProps={{ maxLength: 2000 }}
          required
        />
        {error && <Alert severity="error" sx={{ py: 0 }}>{error}</Alert>}
        <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between">
          <Typography variant="caption" color="text.secondary">
            {strings.feedback_notice}
          </Typography>
          <Button type="submit" size="small" variant="contained" disableElevation disabled={sending} endIcon={<SendRoundedIcon />} sx={{ flexShrink: 0 }}>
            {sending ? strings.feedback_sending : strings.feedback_send}
          </Button>
        </Stack>
      </Stack>
    </Box>
  );
}
