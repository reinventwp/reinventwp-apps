import ChatRoundedIcon from "@mui/icons-material/ChatRounded";
import OpenInFullRoundedIcon from "@mui/icons-material/OpenInFullRounded";
import { Box, ButtonBase, IconButton, Tooltip } from "@mui/material";
import { NEUTRAL_BORDER } from "../theme";

interface ChatLauncherProps {
  label: string;
  restoreLabel: string;
  onOpen: () => void;
  onRestore: () => void;
}

/** The minimized assistant: a chat icon at the bottom right that opens the panel. */
export default function ChatLauncher({ label, restoreLabel, onOpen, onRestore }: ChatLauncherProps) {
  return (
    <Box
      sx={{
        position: "fixed",
        right: 20,
        bottom: 20,
        zIndex: 9988,
        "& .rwp-restore": { opacity: 0, transition: "opacity 0.15s ease" },
        "&:hover .rwp-restore, &:focus-within .rwp-restore": { opacity: 1 },
        "@media (hover: none)": { "& .rwp-restore": { opacity: 1 } },
      }}
    >
      <Tooltip title={label} placement="left">
        <ButtonBase
          onClick={onOpen}
          aria-haspopup="dialog"
          aria-label={label}
          sx={{
            width: 52,
            height: 52,
            borderRadius: "50%",
            bgcolor: "primary.main",
            color: "#FFFFFF",
            boxShadow: "0 8px 24px rgba(7, 21, 34, 0.18)",
            "&:hover, &:focus-visible": { bgcolor: "primary.dark" },
          }}
        >
          <ChatRoundedIcon />
        </ButtonBase>
      </Tooltip>
      <Tooltip title={restoreLabel} placement="left">
        <IconButton
          className="rwp-restore"
          size="small"
          aria-label={restoreLabel}
          onClick={onRestore}
          sx={{
            position: "absolute",
            top: -10,
            left: -10,
            width: 24,
            height: 24,
            bgcolor: "#FFFFFF",
            border: NEUTRAL_BORDER,
            color: "text.secondary",
            "&:hover": { bgcolor: "#FFFFFF", color: "primary.main" },
          }}
        >
          <OpenInFullRoundedIcon sx={{ fontSize: 14 }} />
        </IconButton>
      </Tooltip>
    </Box>
  );
}
