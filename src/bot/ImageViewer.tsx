import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import { Box, Dialog, IconButton, Tooltip } from "@mui/material";
import strings from "../strings";

/** A screenshot shown full size; closes on the button, Escape or a click outside. */
export default function ImageViewer({ src, onClose }: { src: string | null; onClose: () => void }) {
  return (
    <Dialog open={Boolean(src)} onClose={onClose} maxWidth={false} PaperProps={{ sx: { m: 2, bgcolor: "transparent", boxShadow: "none", overflow: "visible" } }}>
      <Tooltip title={strings.ask_close}>
        <IconButton
          aria-label={strings.ask_close}
          onClick={onClose}
          size="small"
          sx={{ position: "absolute", top: -14, right: -14, bgcolor: "#FFFFFF", boxShadow: 2, "&:hover, &:focus": { bgcolor: "#FFFFFF", color: "primary.main" } }}
        >
          <CloseRoundedIcon fontSize="small" />
        </IconButton>
      </Tooltip>
      {src && <Box component="img" src={src} alt="" sx={{ display: "block", maxWidth: "calc(100vw - 64px)", maxHeight: "calc(100vh - 96px)", borderRadius: 2, bgcolor: "#FFFFFF" }} />}
    </Dialog>
  );
}
