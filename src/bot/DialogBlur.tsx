import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import { Box, Dialog, DialogContent, IconButton, Toolbar, Typography, useMediaQuery, useTheme } from "@mui/material";
import type { ReactNode } from "react";

interface DialogBlurProps {
  title: string;
  open: boolean;
  /** Called by the close button and Escape; a click beside the dialog does not close it. */
  onClose: () => void;
  maxWidth?: "xs" | "sm" | "md";
  closeLabel: string;
  children: ReactNode;
}

/**
 * The Reinvent WP dialog (same look as DialogBlur in the Text to Speech admin and the Company
 * Dashboard): frosted glass over the page without a dark backdrop, near the top, a title row with a
 * close button, full screen on phones. Copied here so bot.js stays self-contained.
 */
export default function DialogBlur({ title, open, onClose, maxWidth = "xs", closeLabel, children }: DialogBlurProps) {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down("sm"));

  return (
    <Dialog
      fullScreen={fullScreen}
      fullWidth
      maxWidth={maxWidth}
      open={open}
      onClose={(_event, reason) => {
        if (reason !== "backdropClick") onClose();
      }}
      disableScrollLock
      hideBackdrop
      aria-label={title}
      sx={{ zIndex: 99999 }}
      slotProps={{
        // Near the top, like DialogBlur in the Text to Speech admin. Set on the container slot, not with a
        // ".MuiDialog-container" selector: the bot's classes are prefixed (rwpbot-MuiDialog-container).
        container: { sx: { alignItems: "flex-start" } },
        paper: {
          sx: {
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            backgroundColor: "rgba(255, 255, 255, 0.8)",
            borderRadius: fullScreen ? 0 : "16px",
          },
        },
      }}
    >
      <Toolbar disableGutters sx={{ minHeight: "0 !important", p: 1, pl: 2, pt: 2 }}>
        <Typography variant="h6" component="h2" sx={{ fontWeight: 600 }}>
          {title}
        </Typography>
        <Box sx={{ flexGrow: 1 }} />
        <IconButton onClick={onClose} aria-label={closeLabel} title={closeLabel}>
          <CloseRoundedIcon />
        </IconButton>
      </Toolbar>
      <DialogContent sx={{ backgroundColor: "transparent", pt: 0 }}>
        <Box sx={{ pt: 1 }}>{children}</Box>
      </DialogContent>
    </Dialog>
  );
}
