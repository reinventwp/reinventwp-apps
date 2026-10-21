import ArrowUpwardRoundedIcon from "@mui/icons-material/ArrowUpwardRounded";
import OpenInNewRoundedIcon from "@mui/icons-material/OpenInNewRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import DownloadRoundedIcon from "@mui/icons-material/DownloadRounded";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import TuneRoundedIcon from "@mui/icons-material/TuneRounded";
import {
  Box,
  Button,
  ButtonBase,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  IconButton,
  InputBase,
  Link,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import { useEffect, useRef, useState, type ClipboardEvent, type DragEvent, type KeyboardEvent } from "react";
import hubApps from "../apps";
import strings, { ASK_EXAMPLES } from "../strings";
import AnswerMarkdown from "./AnswerMarkdown";
import AttachmentStrip, { FileChip } from "./AttachmentStrip";
import FeedbackForm from "./FeedbackForm";
import ImageViewer from "./ImageViewer";
import MessageActions from "./MessageActions";
import { useNow } from "./time";
import { imageSrc, MAX_IMAGES, prepareImage, type PreparedImage } from "./images";
import ResearchDetail from "./ResearchDetail";
import { fileSummary, isTextFile, prepareTextFile, TEXT_EXTENSIONS, type PreparedFile } from "./textFile";
import TextViewer from "./TextViewer";
import ThinkingIndicator, { thinkingSteps } from "./ThinkingIndicator";
import { NEUTRAL_BORDER } from "../theme";
import type { HubApp } from "../types";
import type { BotConfig } from "./types";
import type { AssistantSource, AssistantSuggestion, ChatMessage } from "./useAssistant";

/** Width of the panel on wide screens; the page makes room for it. */
export const PANEL_WIDTH = 400;

interface AssistantPanelProps {
  apps: HubApp[];
  /** Where the bot runs; the feedback form reads its address and prefills from it. */
  config: BotConfig;
  /** In wp-admin the panel sits below the admin bar and the site's app list is sent. */
  surface: BotConfig["surface"];
  messages: ChatMessage[];
  loading: boolean;
  onSend: (text: string, images: PreparedImage[], file: PreparedFile | null) => void;
  onReset: () => void;
  onClose: () => void;
  onFeedbackSent: (index: number) => void;
}

/**
 * A suggested app, with the same Open / Activate / Install button as its card. When the answer
 * points to one of its settings and the app is active, the button opens that setting instead.
 */
function SuggestionCard({ suggestion, apps }: { suggestion: AssistantSuggestion; apps: HubApp[] }) {
  const app = apps.find((item) => item.slug === suggestion.slug);
  const settingHref = app && suggestion.setting ? hubApps.settingUrl(app, suggestion.setting.path) : "";
  const action =
    settingHref && suggestion.setting
      ? { href: settingHref, label: strings.go_to.replace("%s", suggestion.setting.name), variant: "contained" as const, install: false }
      : app
        ? hubApps.action(app)
        : null;

  return (
    <Box
      sx={{
        border: NEUTRAL_BORDER,
        borderRadius: 2,
        p: 1.5,
        bgcolor: "#FFFFFF",
      }}
    >
      <Typography variant="subtitle2" component="p">
        {app?.name ?? suggestion.title}
      </Typography>
      {suggestion.reason && (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25, fontSize: "0.9rem" }}>
          {suggestion.reason}
        </Typography>
      )}
      {suggestion.setting?.location && (
        <Stack direction="row" spacing={0.5} alignItems="center" sx={{ mt: 0.75, color: "text.secondary" }}>
          <TuneRoundedIcon sx={{ fontSize: 15 }} />
          <Typography variant="caption" sx={{ fontSize: "0.8rem" }}>
            {suggestion.setting.location}
          </Typography>
        </Stack>
      )}
      {action && (
        <Button
          size="small"
          variant={action.variant}
          disableElevation
          href={action.href}
          title={settingHref ? suggestion.setting?.location : action.label}
          startIcon={action.install ? <DownloadRoundedIcon /> : undefined}
          sx={{ mt: 1 }}
        >
          {action.label}
        </Button>
      )}
      {!app && (
        <Typography variant="caption" color="text.secondary" component="p" sx={{ mt: 0.5 }}>
          {strings.coming_soon}
        </Typography>
      )}
    </Box>
  );
}

/** Links to the reinventwp.com sections the answer is based on. */
function Sources({ sources, label }: { sources: AssistantSource[]; label: string }) {
  return (
    <Stack spacing={0.5}>
      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
        {label}
      </Typography>
      {sources.map((source) => (
        <Link
          key={source.id}
          href={source.url}
          target="_blank"
          rel="noopener noreferrer"
          variant="body2"
          underline="hover"
          sx={{ display: "inline-flex", alignItems: "center", gap: 0.5, "&:hover, &:focus": { color: "primary.main" } }}
        >
          <Box component="span" sx={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 300 }}>
            {source.title}
          </Box>
          <OpenInNewRoundedIcon sx={{ fontSize: 14, flexShrink: 0 }} />
        </Link>
      ))}
    </Stack>
  );
}

/** The user's message to start a feedback with: what they wrote, unless it's just "feedback" or similar. */
function feedbackDraft(previous: ChatMessage | undefined): string {
  const text = previous?.role === "user" ? previous.content.trim() : "";
  return text.split(/\s+/).length > 3 ? text : "";
}

/** Shows a message's time and copy button on hover (always on touch screens, which can't hover). */
const showActionsOnHover = {
  "& .rwpbot-message-actions": { opacity: 0 },
  "&:hover .rwpbot-message-actions, &:focus-within .rwpbot-message-actions": { opacity: 1 },
  "@media (hover: none)": { "& .rwpbot-message-actions": { opacity: 1 } },
};

interface MessageProps {
  message: ChatMessage;
  apps: HubApp[];
  config: BotConfig;
  /** The user's message before this answer, to start a feedback message with. */
  draft: string;
  onFeedbackSent: () => void;
  now: number;
  onView: (src: string) => void;
  onViewFile: (file: { name: string; summary: string; text: string }) => void;
}

function Message({ message, apps, config, draft, onFeedbackSent, now, onView, onViewFile }: MessageProps) {
  if (message.role === "user") {
    return (
      <Stack alignItems="flex-end" spacing={0.25} sx={showActionsOnHover}>
        <Box
          sx={{
            alignSelf: "flex-end",
            maxWidth: "85%",
            px: 1.5,
            py: 1,
            borderRadius: 2,
            bgcolor: "rgba(7, 21, 34, 0.05)",
          }}
        >
          {Boolean(message.images?.length) && (
            <Stack direction="row" spacing={0.75} sx={{ mb: message.content ? 0.75 : 0, justifyContent: "flex-end" }}>
              {message.images?.map((src, index) => (
                <Tooltip key={index} title={strings.ask_view_image}>
                  <ButtonBase
                    onClick={() => onView(message.full?.[index] ?? src)}
                    aria-label={strings.ask_view_image}
                    sx={{ borderRadius: 1 }}
                  >
                    <Box
                      component="img"
                      src={src}
                      alt=""
                      sx={{ maxWidth: 120, maxHeight: 90, borderRadius: 1, border: NEUTRAL_BORDER, display: "block" }}
                    />
                  </ButtonBase>
                </Tooltip>
              ))}
            </Stack>
          )}
          {message.file && (
            <Box sx={{ mb: message.content ? 0.75 : 0, display: "flex", justifyContent: "flex-end" }}>
              <FileChip
                name={message.file.name}
                summary={message.file.summary}
                onClick={
                  message.fileText && message.file
                    ? () => onViewFile({ ...(message.file as { name: string; summary: string }), text: message.fileText ?? "" })
                    : undefined
                }
              />
            </Box>
          )}
          <Typography variant="body2" sx={{ whiteSpace: "pre-wrap", fontSize: "0.95rem" }}>
            {message.content}
          </Typography>
        </Box>
        <MessageActions text={message.content} at={message.at} now={now} align="right" />
      </Stack>
    );
  }
  return (
    <Stack spacing={1} sx={showActionsOnHover}>
      {Boolean(message.research?.searches.length) && message.research && <ResearchDetail research={message.research} apps={apps} />}
      {message.failed ? (
        <Typography variant="body2" color="error.main" sx={{ whiteSpace: "pre-wrap", fontSize: "0.95rem" }}>
          {message.content}
        </Typography>
      ) : (
        <AnswerMarkdown text={message.content} />
      )}
      <Box sx={{ mt: "2px !important", ml: -0.5 }}>
        <MessageActions text={message.content} at={message.at} now={now} align="left" />
      </Box>
      {Boolean(message.sources?.length) && <Sources sources={message.sources ?? []} label={strings.ask_sources} />}
      {message.form === "feedback" && <FeedbackForm config={config} apps={apps} draft={draft} sent={Boolean(message.feedbackSent)} onSent={onFeedbackSent} />}
      {message.suggestions?.map((suggestion) => (
        <SuggestionCard key={suggestion.slug} suggestion={suggestion} apps={apps} />
      ))}
    </Stack>
  );
}

/**
 * The assistant, docked on the right like a side panel. The page beside it narrows on wide
 * screens; on phones it covers the page.
 */
export default function AssistantPanel({ apps, surface, messages, loading, onSend, onReset, onClose, config, onFeedbackSent }: AssistantPanelProps) {
  const [draft, setDraft] = useState("");
  const [confirmingReset, setConfirmingReset] = useState(false);
  const now = useNow();
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [messages, loading]);

  const [attachments, setAttachments] = useState<PreparedImage[]>([]);
  const [viewing, setViewing] = useState<string | null>(null);
  const [file, setFile] = useState<PreparedFile | null>(null);
  const [viewingFile, setViewingFile] = useState<{ name: string; summary: string; text: string } | null>(null);
  const [attachError, setAttachError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  /**
   * Adds pasted, dropped or chosen files: screenshots shrunk (up to MAX_IMAGES), one text file
   * trimmed to its newest lines and masked; anything else is refused.
   */
  const addFiles = async (files: File[]) => {
    const images = files.filter((item) => item.type.startsWith("image/"));
    const texts = files.filter((item) => !item.type.startsWith("image/") && isTextFile(item));
    if (texts.length) {
      setAttachError(texts.length > 1 || file ? strings.ask_file_limit : null);
      if (!file) {
        const prepared = await prepareTextFile(texts[0]).catch(() => null);
        if (prepared) setFile(prepared);
        else setAttachError(strings.ask_image_error);
      }
    }
    if (files.length > images.length + texts.length) setAttachError(strings.ask_image_error);
    if (!images.length) return;
    const room = MAX_IMAGES - attachments.length;
    setAttachError(images.length > room ? strings.ask_image_limit : null);
    const prepared = await Promise.all(images.slice(0, Math.max(room, 0)).map((file) => prepareImage(file).catch(() => null)));
    if (prepared.includes(null)) setAttachError(strings.ask_image_error);
    setAttachments((current) => [...current, ...prepared.filter((image): image is PreparedImage => image !== null)].slice(0, MAX_IMAGES));
  };

  const onPaste = (event: ClipboardEvent) => {
    const files = Array.from(event.clipboardData.files).filter((item) => item.type.startsWith("image/") || isTextFile(item));
    if (!files.length) return;
    event.preventDefault();
    void addFiles(files);
  };

  const onDrop = (event: DragEvent) => {
    if (!event.dataTransfer.files.length) return;
    event.preventDefault();
    void addFiles(Array.from(event.dataTransfer.files));
  };

  const submit = (text: string) => {
    if ((!text.trim() && !attachments.length && !file) || loading) return;
    onSend(text, attachments, file);
    setDraft("");
    setAttachments([]);
    setFile(null);
    setAttachError(null);
  };

  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      submit(draft);
    }
    if (event.key === "Escape" && !confirmingReset) onClose();
  };

  return (
    <Box
      component="aside"
      role="dialog"
      aria-label={strings.ask_title}
      onDragOver={(event: DragEvent) => event.preventDefault()}
      onDrop={onDrop}
      sx={{
        position: "fixed",
        top: surface === "wp-admin" ? 46 : 0,
        "@media (min-width: 783px)": { top: surface === "wp-admin" ? 32 : 0 },
        right: 0,
        bottom: 0,
        width: { xs: "100%", sm: PANEL_WIDTH },
        display: "flex",
        flexDirection: "column",
        bgcolor: "#FFFFFF",
        borderLeft: NEUTRAL_BORDER,
        zIndex: 9989,
        color: "text.primary",
      }}
    >
      <Stack direction="row" alignItems="center" spacing={1} sx={{ px: 2, py: 1.25, borderBottom: NEUTRAL_BORDER }}>
        <Typography variant="subtitle1" component="h2" sx={{ fontWeight: 600, flexGrow: 1 }}>
          {strings.ask_title}
        </Typography>
        <Tooltip title={strings.ask_new}>
          <span>
            <Button
              size="small"
              startIcon={<AddRoundedIcon />}
              onClick={() => setConfirmingReset(true)}
              disabled={!messages.length || loading}
            >
              {strings.ask_new}
            </Button>
          </span>
        </Tooltip>
        <Tooltip title={strings.ask_close}>
          <IconButton aria-label={strings.ask_close} onClick={onClose} size="small">
            <CloseRoundedIcon />
          </IconButton>
        </Tooltip>
      </Stack>

      <Stack spacing={2} sx={{ flexGrow: 1, overflowY: "auto", px: 2, py: 2 }} aria-live="polite">
        {!messages.length && (
          <Stack spacing={1.5}>
            <Typography variant="body2" sx={{ fontSize: "0.95rem" }}>
              {strings.ask_intro}
            </Typography>
            <Stack direction="row" useFlexGap flexWrap="wrap" gap={1}>
              {ASK_EXAMPLES.map((example) => (
                <Chip
                  key={example}
                  label={example}
                  variant="outlined"
                  onClick={() => submit(example)}
                  sx={{
                    height: "auto",
                    py: 0.5,
                    "& .MuiChip-label": { whiteSpace: "normal" },
                  }}
                />
              ))}
            </Stack>
          </Stack>
        )}
        {messages.map((message, index) => (
          <Message
            key={index}
            message={message}
            apps={apps}
            config={config}
            draft={feedbackDraft(messages[index - 1])}
            onFeedbackSent={() => onFeedbackSent(index)}
            now={now}
            onView={setViewing}
            onViewFile={setViewingFile}
          />
        ))}
        {loading && (
          <ThinkingIndicator
            steps={thinkingSteps({
              image: Boolean(messages[messages.length - 1]?.images?.length),
              file: Boolean(messages[messages.length - 1]?.file),
              wpAdmin: surface === "wp-admin",
            })}
          />
        )}
        <div ref={endRef} />
      </Stack>

      <Box sx={{ px: 2, pb: 2, pt: 1 }}>
        <AttachmentStrip
          images={attachments}
          file={file}
          error={attachError}
          onRemoveFile={() => setFile(null)}
          onViewFile={() => file && setViewingFile({ name: file.name, summary: fileSummary(file), text: file.text })}
          onRemove={(index) => setAttachments((current) => current.filter((_image, at) => at !== index))}
          onView={(image) => setViewing(imageSrc(image))}
        />
        <Stack
          direction="row"
          alignItems="flex-end"
          spacing={1}
          sx={{
            border: NEUTRAL_BORDER,
            borderRadius: 3,
            pl: 1.75,
            pr: 0.75,
            py: 0.75,
            "&:focus-within": { borderColor: "primary.main" },
          }}
        >
          <Tooltip title={attachments.length >= MAX_IMAGES && file ? strings.ask_image_limit : strings.ask_attach}>
            <span>
              <IconButton
                aria-label={strings.ask_attach}
                onClick={() => fileRef.current?.click()}
                disabled={(attachments.length >= MAX_IMAGES && Boolean(file)) || loading}
                sx={{ width: 34, height: 34, ml: -1, color: "text.secondary", "&:hover, &:focus": { color: "primary.main" } }}
              >
                <AddRoundedIcon fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>
          <input
            ref={fileRef}
            type="file"
            accept={["image/png,image/jpeg,image/webp,image/gif", ...TEXT_EXTENSIONS, "text/plain,application/json"].join(",")}
            multiple
            hidden
            onChange={(event) => {
              void addFiles(Array.from(event.target.files ?? []));
              event.target.value = "";
            }}
          />
          <InputBase
            inputRef={inputRef}
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={onKeyDown}
            onPaste={onPaste}
            placeholder={strings.ask}
            multiline
            maxRows={5}
            inputProps={{ maxLength: 500, "aria-label": strings.ask }}
            sx={{
              flexGrow: 1,
              py: 0.5,
              fontSize: "0.95rem",
              // wp-admin styles every textarea (border, focus ring, padding); this one has its own frame.
              "& textarea, & textarea:focus": {
                border: 0,
                boxShadow: "none",
                outline: 0,
                background: "transparent",
                padding: 0,
                borderRadius: 0,
                minHeight: 0,
              },
            }}
          />
          <Tooltip title={strings.ask_send}>
            <span>
              <IconButton
                aria-label={strings.ask_send}
                onClick={() => submit(draft)}
                disabled={(!draft.trim() && !attachments.length && !file) || loading}
                sx={{
                  width: 34,
                  height: 34,
                  borderRadius: 2,
                  bgcolor: "primary.main",
                  color: "#FFFFFF",
                  "&:hover, &:focus, &:active": {
                    bgcolor: "primary.dark",
                    color: "#FFFFFF",
                  },
                  "&.Mui-disabled": {
                    bgcolor: "rgba(7, 21, 34, 0.12)",
                    color: "#FFFFFF",
                  },
                }}
              >
                <ArrowUpwardRoundedIcon fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>
        </Stack>
        <Typography variant="caption" color="text.secondary" component="p" sx={{ mt: 0.75, textAlign: "center" }}>
          {surface === "wp-admin" ? strings.ask_notice : strings.ask_notice_website}
        </Typography>
      </Box>

      <ImageViewer src={viewing} onClose={() => setViewing(null)} />
      <TextViewer file={viewingFile} onClose={() => setViewingFile(null)} />

      <Dialog open={confirmingReset} onClose={() => setConfirmingReset(false)} maxWidth="xs" fullWidth>
        <DialogTitle>{strings.ask_new_title}</DialogTitle>
        <DialogContent>
          <DialogContentText>{strings.ask_new_text}</DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setConfirmingReset(false)}>{strings.ask_cancel}</Button>
          <Button
            variant="contained"
            disableElevation
            onClick={() => {
              setConfirmingReset(false);
              onReset();
              inputRef.current?.focus();
            }}
          >
            {strings.ask_new}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
