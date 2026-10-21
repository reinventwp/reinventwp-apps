import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined";
import { Box, ButtonBase, IconButton, Stack, Tooltip, Typography } from "@mui/material";
import strings from "../strings";
import { NEUTRAL_BORDER } from "../theme";
import type { PreparedImage } from "./images";
import { fileSummary, type PreparedFile } from "./textFile";

interface AttachmentStripProps {
  images: PreparedImage[];
  file: PreparedFile | null;
  error: string | null;
  onRemove: (index: number) => void;
  onView: (image: PreparedImage) => void;
  onRemoveFile: () => void;
  onViewFile: () => void;
}

/** A small remove (×) button on an attachment's corner. */
function RemoveButton({ onClick }: { onClick: () => void }) {
  return (
    <Tooltip title={strings.ask_remove_image}>
      <IconButton
        aria-label={strings.ask_remove_image}
        onClick={onClick}
        size="small"
        sx={{ position: "absolute", top: -8, right: -8, p: 0.25, bgcolor: "#FFFFFF", border: NEUTRAL_BORDER, "&:hover, &:focus": { bgcolor: "#FFFFFF", color: "primary.main" } }}
      >
        <CloseRoundedIcon sx={{ fontSize: 14 }} />
      </IconButton>
    </Tooltip>
  );
}

/** An attached text file: its name and what is sent; click to see the exact text. */
export function FileChip({ name, summary, onClick }: { name: string; summary: string; onClick?: () => void }) {
  return (
    <ButtonBase
      onClick={onClick}
      disabled={!onClick}
      title={onClick ? strings.ask_view_file : name}
      sx={{ alignItems: "center", gap: 1, px: 1.25, py: 0.75, maxWidth: 260, border: NEUTRAL_BORDER, borderRadius: 1.5, bgcolor: "#FFFFFF", textAlign: "left", "&:hover, &:focus-visible": { borderColor: "primary.main" } }}
    >
      <DescriptionOutlinedIcon sx={{ fontSize: 20, color: "primary.main", flexShrink: 0 }} />
      <Box sx={{ minWidth: 0 }}>
        <Typography variant="caption" component="p" noWrap sx={{ fontWeight: 600, color: "text.primary" }}>
          {name}
        </Typography>
        <Typography variant="caption" component="p" noWrap sx={{ color: "text.secondary", fontSize: "0.72rem" }}>
          {summary}
        </Typography>
      </Box>
    </ButtonBase>
  );
}

/** The screenshots waiting to be sent, each removable, and why one couldn't be added. */
export default function AttachmentStrip({ images, file, error, onRemove, onView, onRemoveFile, onViewFile }: AttachmentStripProps) {
  if (!images.length && !file && !error) return null;
  return (
    <Stack spacing={0.5} sx={{ mb: 1 }}>
      {Boolean(images.length || file) && (
        <Stack direction="row" spacing={1} alignItems="center" useFlexGap flexWrap="wrap">
          {images.map((image, index) => (
            <Box key={index} sx={{ position: "relative" }}>
              <Tooltip title={strings.ask_view_image}>
                <ButtonBase onClick={() => onView(image)} aria-label={strings.ask_view_image} sx={{ borderRadius: 1.5 }}>
                  <Box component="img" src={image.preview} alt="" sx={{ width: 64, height: 48, objectFit: "cover", borderRadius: 1.5, border: NEUTRAL_BORDER, display: "block" }} />
                </ButtonBase>
              </Tooltip>
              <RemoveButton onClick={() => onRemove(index)} />
            </Box>
          ))}
          {file && (
            <Box sx={{ position: "relative" }}>
              <FileChip name={file.name} summary={fileSummary(file)} onClick={onViewFile} />
              <RemoveButton onClick={onRemoveFile} />
            </Box>
          )}
        </Stack>
      )}
      {error && (
        <Typography variant="caption" color="error.main">
          {error}
        </Typography>
      )}
    </Stack>
  );
}
