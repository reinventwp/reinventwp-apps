import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, Typography } from "@mui/material";
import strings from "../strings";

/** Exactly the text a file sends (its newest part, masked), so the user can check it. */
export default function TextViewer({ file, onClose }: { file: { name: string; summary: string; text: string } | null; onClose: () => void }) {
  return (
    <Dialog open={Boolean(file)} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ pb: 0.5 }}>{file?.name}</DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
          {file?.summary}. {strings.ask_file_note}
        </Typography>
        <Box
          component="pre"
          sx={{
            m: 0,
            p: 1.5,
            maxHeight: "60vh",
            overflow: "auto",
            bgcolor: "rgba(7, 21, 34, 0.04)",
            borderRadius: 2,
            fontFamily: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
            fontSize: "0.78rem",
            lineHeight: 1.5,
            whiteSpace: "pre-wrap",
            overflowWrap: "anywhere",
          }}
        >
          {file?.text}
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose}>{strings.ask_close}</Button>
      </DialogActions>
    </Dialog>
  );
}
