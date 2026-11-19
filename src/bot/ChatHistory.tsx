import ArchiveOutlinedIcon from "@mui/icons-material/ArchiveOutlined";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import DriveFileRenameOutlineRoundedIcon from "@mui/icons-material/DriveFileRenameOutlineRounded";
import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";
import HistoryRoundedIcon from "@mui/icons-material/HistoryRounded";
import MoreHorizRoundedIcon from "@mui/icons-material/MoreHorizRounded";
import UnarchiveOutlinedIcon from "@mui/icons-material/UnarchiveOutlined";
import { Box, Button, ButtonBase, IconButton, InputBase, ListItemIcon, ListItemText, Menu, MenuItem, Stack, Tooltip, Typography } from "@mui/material";
import { useCallback, useEffect, useState, type FormEvent, type MouseEvent } from "react";
import strings from "../strings";
import { NEUTRAL_BORDER } from "../theme";
import ButtonDialog from "./ButtonDialog";
import { chatsApi, type ChatsConfig, type SavedChat } from "./chats";
import { relativeTime, useNow } from "./time";

interface ChatHistoryProps {
  config: ChatsConfig;
  /** The chat open in the assistant now. */
  activeId: number | null;
  /** Changes after each save, so an open list refreshes. */
  savedAt: number;
  onOpen: (id: number) => void;
  /** The open chat was archived or deleted: the assistant starts a new one. */
  onActiveGone: () => void;
}

type RowState = { id: number; mode: "rename" | "delete" } | null;

/** Long titles fade out at the right edge instead of an ellipsis (AI Agent's chat list does the same). */
const FADE = "linear-gradient(to right, #000 calc(100% - 28px), transparent)";

/** The chats in the dialog: open one, or rename, archive or delete it from its "…" menu. */
function HistoryList({ config, activeId, savedAt, onOpen, onActiveGone, close }: ChatHistoryProps & { close: () => void }) {
  const [chats, setChats] = useState<SavedChat[] | null>(null);
  const [archived, setArchived] = useState<SavedChat[] | null>(null);
  const [showArchived, setShowArchived] = useState(false);
  const [menu, setMenu] = useState<{ anchor: HTMLElement; chat: SavedChat } | null>(null);
  const [row, setRow] = useState<RowState>(null);
  const [title, setTitle] = useState("");
  const [error, setError] = useState<string | null>(null);
  const now = useNow();

  const refresh = useCallback(async () => {
    try {
      setChats(await chatsApi.list(config));
      if (showArchived) setArchived(await chatsApi.list(config, true));
      setError(null);
    } catch {
      setError(strings.ask_history_error);
    }
  }, [config, showArchived]);

  useEffect(() => {
    void refresh();
  }, [refresh, savedAt]);

  const act = async (work: () => Promise<unknown>, gone?: number) => {
    try {
      await work();
      if (gone && gone === activeId) onActiveGone();
      setRow(null);
      await refresh();
    } catch {
      setError(strings.ask_history_error);
    }
  };

  const rename = (event: FormEvent, chat: SavedChat) => {
    event.preventDefault();
    if (title.trim()) void act(() => chatsApi.update(config, chat.id, { title: title.trim() }));
  };

  const item = (chat: SavedChat) => {
    if (row?.id === chat.id && row.mode === "rename") {
      return (
        <Box key={chat.id} component="form" onSubmit={(event: FormEvent) => rename(event, chat)} sx={{ display: "flex", gap: 1, alignItems: "center", px: 1, py: 0.5 }}>
          <InputBase
            autoFocus
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            inputProps={{ maxLength: 80, "aria-label": strings.ask_history_rename }}
            sx={{ flex: 1, px: 1, py: 0.25, border: NEUTRAL_BORDER, borderRadius: "8px", fontSize: "0.9rem", bgcolor: "#FFFFFF" }}
          />
          <Button type="submit" size="small" variant="contained" disableElevation disabled={!title.trim()}>
            {strings.ask_history_save}
          </Button>
          <Button size="small" onClick={() => setRow(null)}>
            {strings.ask_cancel}
          </Button>
        </Box>
      );
    }
    if (row?.id === chat.id && row.mode === "delete") {
      return (
        <Box key={chat.id} sx={{ px: 1.25, py: 0.75, borderRadius: "10px", bgcolor: "rgba(211, 47, 47, 0.06)" }}>
          <Typography variant="body2" sx={{ mb: 0.75 }}>
            {strings.ask_history_delete_confirm}
          </Typography>
          <Stack direction="row" spacing={1}>
            <Button size="small" color="error" variant="contained" disableElevation onClick={() => void act(() => chatsApi.remove(config, chat.id), chat.id)}>
              {strings.ask_history_delete}
            </Button>
            <Button size="small" onClick={() => setRow(null)}>
              {strings.ask_cancel}
            </Button>
          </Stack>
        </Box>
      );
    }
    const selected = chat.id === activeId;
    return (
      <Box
        key={chat.id}
        sx={{
          position: "relative",
          borderRadius: "10px",
          bgcolor: selected ? "rgba(7, 21, 34, 0.07)" : "transparent",
          "&:hover": { bgcolor: "rgba(7, 21, 34, 0.05)" },
          "& .history-more": { opacity: 0 },
          "&:hover .history-more, & .history-more[aria-expanded='true'], & .history-more:focus-visible": { opacity: 1 },
          "@media (hover: none)": { "& .history-more": { opacity: 1 } },
        }}
      >
        <ButtonBase
          onClick={() => {
            onOpen(chat.id);
            close();
          }}
          sx={{ width: "100%", display: "block", textAlign: "left", pl: 1.25, pr: 5, py: 0.875, borderRadius: "10px" }}
        >
          <Typography variant="body2" sx={{ fontWeight: selected ? 600 : 500, overflow: "hidden", whiteSpace: "nowrap", maskImage: FADE, WebkitMaskImage: FADE }}>
            {chat.title}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {relativeTime(new Date(chat.updated).getTime(), now)}
          </Typography>
        </ButtonBase>
        <IconButton
          className="history-more"
          size="small"
          aria-label={`${strings.ask_history_more} ${chat.title}`}
          aria-haspopup="menu"
          aria-expanded={menu?.chat.id === chat.id}
          onClick={(event: MouseEvent<HTMLElement>) => setMenu({ anchor: event.currentTarget, chat })}
          sx={{ position: "absolute", right: 6, top: "50%", transform: "translateY(-50%)" }}
        >
          <MoreHorizRoundedIcon fontSize="small" />
        </IconButton>
      </Box>
    );
  };

  return (
    <Box>
      {error && (
        <Typography variant="body2" color="error.main" sx={{ mb: 1 }}>
          {error}
        </Typography>
      )}
      {chats === null ? (
        <Typography variant="body2" color="text.secondary">
          {strings.ask_history_loading}
        </Typography>
      ) : chats.length ? (
        <Box sx={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr)", gap: 0.25 }}>{chats.map(item)}</Box>
      ) : (
        <Typography variant="body2" color="text.secondary">
          {strings.ask_history_empty}
        </Typography>
      )}

      <ButtonBase
        onClick={() => {
          setShowArchived((value) => !value);
          if (!showArchived) void chatsApi.list(config, true).then(setArchived, () => setError(strings.ask_history_error));
        }}
        aria-expanded={showArchived}
        sx={{ mt: 2, gap: 0.5, px: 0.5, borderRadius: "8px", color: "text.secondary", fontSize: "0.8rem", fontWeight: 600, "&:hover": { color: "text.primary" } }}
      >
        {strings.ask_history_archived}
        <ExpandMoreRoundedIcon sx={{ fontSize: 18, transform: showArchived ? "rotate(180deg)" : "none", transition: "transform 0.15s ease" }} />
      </ButtonBase>
      {showArchived &&
        archived !== null &&
        (archived.length ? (
          <Box sx={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr)", gap: 0.25, mt: 0.5, opacity: 0.85 }}>{archived.map(item)}</Box>
        ) : (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            {strings.ask_history_none_archived}
          </Typography>
        ))}

      <Menu
        anchorEl={menu?.anchor}
        open={Boolean(menu)}
        onClose={() => setMenu(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        // Above the dialog the list sits in.
        sx={{ zIndex: 100000 }}
        slotProps={{ paper: { sx: { borderRadius: "12px", minWidth: 180 } } }}
      >
        <MenuItem
          onClick={() => {
            if (!menu) return;
            setTitle(menu.chat.title);
            setRow({ id: menu.chat.id, mode: "rename" });
            setMenu(null);
          }}
        >
          <ListItemIcon>
            <DriveFileRenameOutlineRoundedIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary={strings.ask_history_rename} />
        </MenuItem>
        <MenuItem
          onClick={() => {
            if (!menu) return;
            const { chat } = menu;
            setMenu(null);
            void act(() => chatsApi.update(config, chat.id, { archived: !chat.archived }), chat.archived ? undefined : chat.id);
          }}
        >
          <ListItemIcon>{menu?.chat.archived ? <UnarchiveOutlinedIcon fontSize="small" /> : <ArchiveOutlinedIcon fontSize="small" />}</ListItemIcon>
          <ListItemText primary={menu?.chat.archived ? strings.ask_history_unarchive : strings.ask_history_archive} />
        </MenuItem>
        <MenuItem
          onClick={() => {
            if (!menu) return;
            setRow({ id: menu.chat.id, mode: "delete" });
            setMenu(null);
          }}
          sx={{ color: "error.main" }}
        >
          <ListItemIcon>
            <DeleteOutlineRoundedIcon fontSize="small" color="error" />
          </ListItemIcon>
          <ListItemText primary={strings.ask_history_delete} />
        </MenuItem>
      </Menu>
    </Box>
  );
}

/** The history button in the assistant's header and the dialog with the chats saved in WordPress (AI Agent). */
export default function ChatHistory(props: ChatHistoryProps) {
  return (
    <ButtonDialog
      title={strings.ask_history_title}
      closeLabel={strings.ask_dialog_close}
      button={(open) => (
        <Tooltip title={strings.ask_history_title}>
          <IconButton aria-label={strings.ask_history_title} onClick={open} size="small">
            <HistoryRoundedIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      )}
    >
      {(close) => <HistoryList {...props} close={close} />}
    </ButtonDialog>
  );
}
