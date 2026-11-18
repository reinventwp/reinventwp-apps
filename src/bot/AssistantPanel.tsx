import KeyboardReturnRoundedIcon from "@mui/icons-material/KeyboardReturnRounded";
import OpenInNewRoundedIcon from "@mui/icons-material/OpenInNewRounded";
import MinimizeRoundedIcon from "@mui/icons-material/MinimizeRounded";
import SettingsRoundedIcon from "@mui/icons-material/SettingsRounded";
import OpenWithRoundedIcon from "@mui/icons-material/OpenWithRounded";
import DownloadRoundedIcon from "@mui/icons-material/DownloadRounded";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import TuneRoundedIcon from "@mui/icons-material/TuneRounded";
import {
  Box,
  Button,
  ButtonBase,
  Chip,
  IconButton,
  InputBase,
  Link,
  Stack,
  Tooltip,
  Typography,
  useMediaQuery,
} from "@mui/material";
import { useEffect, useRef, useState, type ClipboardEvent, type DragEvent, type KeyboardEvent } from "react";
import hubApps from "../apps";
import strings, { ASK_EXAMPLES } from "../strings";
import { ApprovalCard, StepLines } from "./AgentSteps";
import AnswerMarkdown from "./AnswerMarkdown";
import AttachmentStrip, { FileChip } from "./AttachmentStrip";
import FeedbackForm from "./FeedbackForm";
import ImageViewer from "./ImageViewer";
import MessageActions from "./MessageActions";
import { useNow } from "./time";
import { imageSrc, MAX_IMAGES, prepareImage, type PreparedImage } from "./images";
import ResearchDetail from "./ResearchDetail";
import { LINK_SX } from "./linkStyle";
import { fileSummary, isTextFile, prepareTextFile, TEXT_EXTENSIONS, type PreparedFile } from "./textFile";
import TextViewer from "./TextViewer";
import ThinkingIndicator, { thinkingSteps } from "./ThinkingIndicator";
import { NEUTRAL_BORDER } from "../theme";
import { PANEL_MODES, PLACEMENTS, type PanelMode, type Placement } from "./placement";
import ButtonDialog from "./ButtonDialog";
import { OptionCard, PanelModePreview, PlacementPreview } from "./SettingsPreview";
import { HANDLE_CURSOR, HANDLES, useFloatingPanel, type Handle } from "./floating";
import type { HubApp } from "../types";
import type { BotConfig } from "./types";
import type { AssistantSource, AssistantSuggestion, ChatMessage } from "./useAssistant";

/** Width of the panel on wide screens; the page makes room for it. */
export const PANEL_WIDTH = 400;

/** Chat background: a soft off-white, so the white composer box and answer cards stand out (like Claude). */
const CHAT_BG = "#F7F7F5";

/** Header: a little darker than the chat, so the title bar reads as its own strip. */
const HEADER_BG = "#EEEEEB";
const HEADER_BG_HOVER = "#E4E4E0";

/** Space between the floating panel ("Over the page") and the window edges, in px. */
const FLOAT_GAP = 12;

interface AssistantPanelProps {
  apps: HubApp[];
  /** Where the bot runs; the feedback form reads its address and prefills from it. */
  config: BotConfig;
  /** In wp-admin the panel sits below the admin bar and the site's app list is sent. */
  surface: BotConfig["surface"];
  messages: ChatMessage[];
  loading: boolean;
  /** The site tool running now, shown while waiting. */
  running: string | null;
  /** The admin's answer on an Approve card. */
  onApprove: (approved: boolean) => void;
  onSend: (text: string, images: PreparedImage[], file: PreparedFile | null) => void;
  onReset: () => void;
  /** Minimizes the panel back to the ask bar or the corner button. */
  onClose: () => void;
  onFeedbackSent: (index: number) => void;
  /** Where the closed assistant sits; changed in the settings dialog. */
  placement: Placement;
  onPlacementChange: (placement: Placement) => void;
  /** Whether the open panel sits beside the page (the page narrows) or over it. */
  panelMode: PanelMode;
  onPanelModeChange: (mode: PanelMode) => void;
}

/** The AI Agent page on reinventwp.com; from wp-admin it carries UTM tags. */
function agentPageUrl(surface: BotConfig["surface"]): string {
  if (surface === "website") return "/ai-agent";
  return "https://reinventwp.com/ai-agent?utm_source=wp_admin&utm_medium=plugin_ui&utm_campaign=reinventwp_assistant&utm_content=panel_title";
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
    <Box sx={{ border: NEUTRAL_BORDER, borderRadius: 2, p: 1.5, bgcolor: "#FFFFFF" }}>
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
function Sources({ sources, label, wpAdmin }: { sources: AssistantSource[]; label: string; wpAdmin: boolean }) {
  return (
    <Stack spacing={0.5}>
      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
        {label}
      </Typography>
      {sources.map((source) => (
        <Link
          key={source.id}
          href={wpAdmin ? hubApps.siteLink(source.url, "assistant") : source.url}
          target="_blank"
          rel="noopener noreferrer"
          variant="body2"
          underline="always"
          sx={{
            ...LINK_SX,
            display: "inline-flex",
            alignItems: "center",
            gap: 0.5,
          }}
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
  onApprove: (approved: boolean) => void;
}

function Message({ message, apps, config, draft, onFeedbackSent, now, onView, onViewFile, onApprove }: MessageProps) {
  if (message.role === "user") {
    return (
      <Stack alignItems="flex-end" spacing={0.25} sx={showActionsOnHover}>
        <Box sx={{ alignSelf: "flex-end", maxWidth: "85%", px: 1.5, py: 1, borderRadius: 2, bgcolor: "rgba(7, 21, 34, 0.05)" }}>
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
                    ? () =>
                        onViewFile({
                          ...(message.file as { name: string; summary: string }),
                          text: message.fileText ?? "",
                        })
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
      {Boolean(message.steps?.length) && <StepLines steps={message.steps ?? []} />}
      {message.failed ? (
        <Typography variant="body2" color="error.main" sx={{ whiteSpace: "pre-wrap", fontSize: "0.95rem" }}>
          {message.content}
        </Typography>
      ) : (
        message.content && <AnswerMarkdown text={message.content} />
      )}
      {message.approval && <ApprovalCard text={message.approval.text} onAnswer={onApprove} />}
      {!message.working && (
        <Box sx={{ mt: "2px !important", ml: -0.5 }}>
          <MessageActions text={message.content} at={message.at} now={now} align="left" />
        </Box>
      )}
      {Boolean(message.sources?.length) && (
        <Sources sources={message.sources ?? []} label={strings.ask_sources} wpAdmin={config.surface === "wp-admin"} />
      )}
      {message.form === "feedback" && (
        <FeedbackForm config={config} apps={apps} draft={draft} sent={Boolean(message.feedbackSent)} onSent={onFeedbackSent} />
      )}
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
export default function AssistantPanel({
  apps,
  surface,
  messages,
  loading,
  running,
  onApprove,
  onSend,
  onReset,
  onClose,
  config,
  onFeedbackSent,
  placement,
  onPlacementChange,
  panelMode,
  onPanelModeChange,
}: AssistantPanelProps) {
  const [draft, setDraft] = useState("");
  const last = messages[messages.length - 1];
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

  // The send button shows only when there is something to send, so an empty field stays one clean line.
  const canSend = Boolean(draft.trim() || attachments.length || file);

  // Drag from the header (a docked panel starts floating), resize from 8 handles while floating.
  const isPhone = useMediaQuery("(max-width: 599.95px)");
  const adminTop = surface === "wp-admin" ? (window.innerWidth >= 783 ? 32 : 46) : 0;
  const floating = useFloatingPanel({ floating: panelMode === "over" && !isPhone, top: adminTop, onFloat: () => onPanelModeChange("over") });
  const placed = floating.geometry;
  // The border sides of the handle under the pointer (or being dragged) light up, like Claude's app.
  const [hoveredHandle, setHoveredHandle] = useState<Handle | null>(null);
  const litHandle = floating.resizing ?? hoveredHandle;

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
    if (event.key === "Escape") onClose();
  };

  return (
    <Box
      component="aside"
      ref={floating.panelRef}
      role="dialog"
      aria-label={strings.ask_title}
      onDragOver={(event: DragEvent) => event.preventDefault()}
      onDrop={onDrop}
      style={placed ? { left: placed.x, top: placed.y, width: placed.width, height: placed.height, right: "auto", bottom: "auto" } : undefined}
      sx={{
        position: "fixed",
        // Width and height include the border, so a dragged or resized panel fits the window exactly.
        boxSizing: "border-box",
        top: surface === "wp-admin" ? 46 : 0,
        right: 0,
        bottom: 0,
        width: { xs: "100%", sm: PANEL_WIDTH },
        display: "flex",
        flexDirection: "column",
        bgcolor: CHAT_BG,
        borderLeft: NEUTRAL_BORDER,
        // A soft shadow instead of a hard edge beside the page.
        boxShadow: "-6px 0 20px rgba(7, 21, 34, 0.06)",
        overflow: "hidden",
        // Over the page (not on phones, where it fills the screen) it floats as a card: inset from
        // the edges, rounded on all four corners, with a deeper shadow.
        ...(panelMode === "over" && {
          "@media (min-width: 600px)": {
            top: (surface === "wp-admin" ? 46 : 0) + FLOAT_GAP,
            right: FLOAT_GAP,
            bottom: FLOAT_GAP,
            border: NEUTRAL_BORDER,
            borderRadius: "16px",
            boxShadow: "0 12px 40px rgba(7, 21, 34, 0.16)",
          },
        }),
        "@media (min-width: 783px)": { top: (surface === "wp-admin" ? 32 : 0) + (panelMode === "over" ? FLOAT_GAP : 0) },
        zIndex: 9989,
        color: "text.primary",
      }}
    >
      <Stack
        direction="row"
        alignItems="center"
        spacing={0.5}
        onPointerDown={floating.onDragStart}
        title={isPhone ? undefined : strings.ask_drag}
        sx={{
          position: "relative",
          zIndex: 1,
          px: 2,
          py: 1.25,
          bgcolor: HEADER_BG,
          borderBottom: NEUTRAL_BORDER,
          transition: "background-color 0.15s ease",
          // Darker on hover, so the header reads as something you can grab and drag.
          ...(!isPhone && { "&:hover": { bgcolor: HEADER_BG_HOVER } }),
          cursor: isPhone ? "default" : "grab",
          touchAction: isPhone ? "auto" : "none",
          // The chat fades in under the header, like it fades out above the composer.
          "&::after": {
            content: '""',
            position: "absolute",
            left: 0,
            right: 0,
            top: "100%",
            height: 20,
            background: `linear-gradient(to top, rgba(247, 247, 245, 0), ${CHAT_BG})`,
            pointerEvents: "none",
          },
        }}
      >
        <Typography variant="subtitle1" component="h2" sx={{ fontWeight: 600, flexGrow: 1 }}>
          <Link
            href={agentPageUrl(surface)}
            target={surface === "website" ? undefined : "_blank"}
            rel={surface === "website" ? undefined : "noopener"}
            underline="always"
            color="inherit"
            sx={{
              textDecorationColor: "currentColor",
              textUnderlineOffset: "0.18em",
              "&:visited, &:hover, &:focus, &:active": { color: "inherit" },
            }}
          >
            {strings.ask_title}
          </Link>
        </Typography>
        <ButtonDialog
          title={strings.ask_new_title}
          closeLabel={strings.ask_dialog_close}
          button={(open) => (
            <Tooltip title={strings.ask_new}>
              <span>
                <IconButton aria-label={strings.ask_new} onClick={open} disabled={!messages.length || loading} size="small">
                  <AddRoundedIcon fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>
          )}
        >
          {(close) => (
            <>
              <Typography variant="body2" color="text.secondary">
                {strings.ask_new_text}
              </Typography>
              <Stack direction="row" spacing={1} justifyContent="flex-end" sx={{ mt: 2.5 }}>
                <Button onClick={close}>{strings.ask_cancel}</Button>
                <Button
                  variant="contained"
                  disableElevation
                  onClick={() => {
                    close();
                    onReset();
                    inputRef.current?.focus();
                  }}
                >
                  {strings.ask_new}
                </Button>
              </Stack>
            </>
          )}
        </ButtonDialog>
        <ButtonDialog
          title={strings.ask_settings_title}
          maxWidth="sm"
          closeLabel={strings.ask_dialog_close}
          button={(open) => (
            <Tooltip title={strings.ask_settings_title}>
              <IconButton aria-label={strings.ask_settings_title} onClick={open} size="small">
                <SettingsRoundedIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        >
          {() => (
            <>
              <Typography variant="subtitle2" component="p" sx={{ mb: 1 }}>
                {strings.ask_panel_mode}
              </Typography>
              <Box role="radiogroup" aria-label={strings.ask_panel_mode} sx={{ display: "grid", gap: 1.25, gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" } }}>
                {PANEL_MODES.map((option) => (
                  <OptionCard
                    key={option}
                    selected={panelMode === option}
                    onSelect={() => onPanelModeChange(option)}
                    preview={<PanelModePreview mode={option} />}
                    label={strings.ask_panel_mode_options[option].label}
                    help={strings.ask_panel_mode_options[option].help}
                  />
                ))}
              </Box>
              <Stack direction="row" spacing={1} alignItems="flex-start" sx={{ mt: 1.25, mb: 2.5, px: 1.25, py: 1, borderRadius: "10px", bgcolor: "rgba(2, 136, 209, 0.07)" }}>
                <OpenWithRoundedIcon fontSize="small" sx={{ color: "info.dark", mt: "1px" }} />
                <Typography variant="caption" sx={{ color: "info.dark", lineHeight: 1.5 }}>
                  {strings.ask_drag_tip}
                </Typography>
              </Stack>
              <Typography variant="subtitle2" component="p" sx={{ mb: 1 }}>
                {strings.ask_placement}
              </Typography>
              <Box role="radiogroup" aria-label={strings.ask_placement} sx={{ display: "grid", gap: 1.25, gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr 1fr" } }}>
                {PLACEMENTS.map((option) => (
                  <OptionCard
                    key={option}
                    selected={placement === option}
                    onSelect={() => onPlacementChange(option)}
                    preview={<PlacementPreview placement={option} />}
                    label={strings.ask_placement_options[option]}
                  />
                ))}
              </Box>
              <Typography variant="caption" color="text.secondary" component="p" sx={{ mt: 1.5 }}>
                {strings.ask_settings_saved}
              </Typography>
            </>
          )}
        </ButtonDialog>
        <Tooltip title={strings.ask_close}>
          <IconButton aria-label={strings.ask_close} onClick={onClose} size="small">
            <MinimizeRoundedIcon fontSize="small" />
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
                  sx={{ height: "auto", py: 0.5, "& .MuiChip-label": { whiteSpace: "normal" } }}
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
            onApprove={onApprove}
          />
        ))}
        {loading && !last?.approval && (
          // While tools run: the one running, or "Thinking…" while Services decides the next step.
          <ThinkingIndicator
            key={running ?? (last?.working ? "working" : "asking")}
            steps={
              running
                ? [`${running}…`]
                : last?.working
                  ? [strings.ask_thinking]
                  : thinkingSteps({ image: Boolean(last?.images?.length), file: Boolean(last?.file), wpAdmin: surface === "wp-admin" })
            }
          />
        )}
        <div ref={endRef} />
      </Stack>

      <Box
        sx={{
          position: "relative",
          px: 1.5,
          pb: 1.5,
          pt: 0.5,
          bgcolor: CHAT_BG,
          // The chat fades out above the composer instead of ending on a hard line.
          "&::before": {
            content: '""',
            position: "absolute",
            left: 0,
            right: 0,
            top: -20,
            height: 20,
            background: `linear-gradient(to bottom, rgba(247, 247, 245, 0), ${CHAT_BG})`,
            pointerEvents: "none",
          },
        }}
      >
        <Box
          sx={{
            bgcolor: "#FFFFFF",
            border: "1px solid rgba(7, 21, 34, 0.12)",
            borderRadius: "20px",
            px: 0.75,
            py: 0.75,
            boxShadow: "0 4px 20px rgba(7, 21, 34, 0.05)",
            transition: "box-shadow 0.2s ease, border-color 0.2s ease",
            "&:hover": { borderColor: "rgba(7, 21, 34, 0.2)" },
            "&:focus-within": { borderColor: "rgba(7, 21, 34, 0.24)", boxShadow: "0 6px 28px rgba(7, 21, 34, 0.11)" },
          }}
        >
          <AttachmentStrip
            images={attachments}
            file={file}
            error={attachError}
            onRemoveFile={() => setFile(null)}
            onViewFile={() => file && setViewingFile({ name: file.name, summary: fileSummary(file), text: file.text })}
            onRemove={(index) => setAttachments((current) => current.filter((_image, at) => at !== index))}
            onView={(image) => setViewing(imageSrc(image))}
          />
          <Stack direction="row" alignItems="flex-end" spacing={0.5}>
            <Tooltip title={attachments.length >= MAX_IMAGES && file ? strings.ask_image_limit : strings.ask_attach}>
              <span>
                <IconButton
                  aria-label={strings.ask_attach}
                  onClick={() => fileRef.current?.click()}
                  disabled={(attachments.length >= MAX_IMAGES && Boolean(file)) || loading}
                  sx={{ width: 34, height: 34, color: "text.secondary", "&:hover, &:focus": { color: "primary.main" } }}
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
                alignSelf: "center",
                px: 0.25,
                py: 0.75,
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
            {canSend && (
              <Tooltip title={strings.ask_send}>
                <span>
                  <IconButton
                    aria-label={strings.ask_send}
                    onClick={() => submit(draft)}
                    disabled={loading}
                    sx={{
                      width: 34,
                      height: 34,
                      borderRadius: "10px",
                      bgcolor: "primary.main",
                      color: "#FFFFFF",
                      "&:hover, &:focus, &:active": { bgcolor: "primary.dark", color: "#FFFFFF" },
                      "&.Mui-disabled": { bgcolor: "rgba(7, 21, 34, 0.12)", color: "#FFFFFF" },
                    }}
                  >
                    <KeyboardReturnRoundedIcon fontSize="small" />
                  </IconButton>
                </span>
              </Tooltip>
            )}
          </Stack>
        </Box>
        <Box sx={{ mt: 0.5, px: 1, textAlign: "right" }}>
          <ButtonDialog
            title={strings.ask_privacy_title}
            closeLabel={strings.ask_dialog_close}
            button={(open) => (
              <Link
                component="button"
                type="button"
                onClick={open}
                variant="caption"
                underline="always"
                sx={{
                  color: "text.secondary",
                  textDecorationColor: "currentColor",
                  textUnderlineOffset: "0.18em",
                  "&:visited, &:hover, &:focus, &:active": { color: "text.secondary" },
                }}
              >
                {strings.ask_privacy}
              </Link>
            )}
          >
            {() => (
              <Typography variant="body2" color="text.secondary">
                {surface === "wp-admin" ? strings.ask_notice : strings.ask_notice_website}
              </Typography>
            )}
          </ButtonDialog>
        </Box>
      </Box>

      {placed && litHandle && <ResizeHighlight handle={litHandle} />}
      {placed &&
        HANDLES.map((handle) => (
          <ResizeHandle
            key={handle}
            handle={handle}
            onPointerDown={floating.onResizeStart(handle)}
            onPointerEnter={() => setHoveredHandle(handle)}
            onPointerLeave={() => setHoveredHandle((current) => (current === handle ? null : current))}
          />
        ))}

      <ImageViewer src={viewing} onClose={() => setViewing(null)} />
      <TextViewer file={viewingFile} onClose={() => setViewingFile(null)} />
    </Box>
  );
}

/** Size of the grab area along an edge, and of a corner square, in px. */
const EDGE = 6;
const CORNER = 14;

/** Where each handle sits on the floating panel. */
function handlePosition(handle: Handle) {
  const vertical = handle.includes("n") ? { top: 0 } : handle.includes("s") ? { bottom: 0 } : { top: CORNER, bottom: CORNER };
  const horizontal = handle.includes("w") ? { left: 0 } : handle.includes("e") ? { right: 0 } : { left: CORNER, right: CORNER };
  const corner = handle.length === 2;
  return {
    ...vertical,
    ...horizontal,
    width: corner ? CORNER : handle === "e" || handle === "w" ? EDGE : undefined,
    height: corner ? CORNER : handle === "n" || handle === "s" ? EDGE : undefined,
  };
}

/** One of the 8 invisible grab areas that resize the floating panel. */
function ResizeHandle({
  handle,
  onPointerDown,
  onPointerEnter,
  onPointerLeave,
}: {
  handle: Handle;
  onPointerDown: (event: React.PointerEvent) => void;
  onPointerEnter: () => void;
  onPointerLeave: () => void;
}) {
  return (
    <Box
      aria-hidden
      onPointerDown={onPointerDown}
      onPointerEnter={onPointerEnter}
      onPointerLeave={onPointerLeave}
      sx={{ position: "absolute", zIndex: 3, touchAction: "none", cursor: HANDLE_CURSOR[handle], ...handlePosition(handle) }}
    />
  );
}

/** Blue used to light up the border sides being resized. */
const RESIZE_BLUE = "#2F80ED";

/**
 * Lights up the border sides a handle resizes: one side for an edge, the two sides that meet for a
 * corner. It is a rounded border laid over the panel's own, so the blue follows the corner curves.
 */
function ResizeHighlight({ handle }: { handle: Handle }) {
  const blue = (side: "n" | "e" | "s" | "w") => (handle.includes(side) ? RESIZE_BLUE : "transparent");
  return (
    <Box
      aria-hidden
      sx={{
        position: "absolute",
        inset: 0,
        zIndex: 2,
        pointerEvents: "none",
        // Inside the panel's 1px border, so one less than its 16px radius.
        borderRadius: "15px",
        border: "2px solid transparent",
        borderTopColor: blue("n"),
        borderRightColor: blue("e"),
        borderBottomColor: blue("s"),
        borderLeftColor: blue("w"),
      }}
    />
  );
}
