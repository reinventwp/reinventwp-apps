import BlockRoundedIcon from "@mui/icons-material/BlockRounded";
import CheckRoundedIcon from "@mui/icons-material/CheckRounded";
import ErrorOutlineRoundedIcon from "@mui/icons-material/ErrorOutlineRounded";
import { Box, Button, Stack, Typography } from "@mui/material";
import strings from "../strings";
import { NEUTRAL_BORDER } from "../theme";
import type { StepView } from "./agent";

const ICONS = {
  done: <CheckRoundedIcon sx={{ fontSize: 15, color: "success.main" }} />,
  failed: <ErrorOutlineRoundedIcon sx={{ fontSize: 15, color: "error.main" }} />,
  declined: <BlockRoundedIcon sx={{ fontSize: 15, color: "text.disabled" }} />,
};

/** What the assistant did on the site, one short line per tool: "✓ Listed 12 unused files". */
export function StepLines({ steps }: { steps: StepView[] }) {
  return (
    <Stack spacing={0.25} component="ul" sx={{ listStyle: "none", m: 0, p: 0 }}>
      {steps.map((step) => (
        <Stack key={step.id} component="li" direction="row" spacing={0.75} alignItems="flex-start" sx={{ color: "text.secondary", m: 0 }}>
          <Box sx={{ display: "flex", pt: "2px", flexShrink: 0 }}>{ICONS[step.status]}</Box>
          <Typography variant="body2" sx={{ fontSize: "0.85rem", overflowWrap: "anywhere" }}>
            {step.text}
          </Typography>
        </Stack>
      ))}
    </Stack>
  );
}

/** A change waiting for the admin: what will happen, with Approve and Decline. */
export function ApprovalCard({ text, onAnswer }: { text: string; onAnswer: (approved: boolean) => void }) {
  return (
    <Box role="group" aria-label={strings.ask_agent_wants} sx={{ border: NEUTRAL_BORDER, borderRadius: 2, p: 1.5, bgcolor: "#FFFFFF" }}>
      <Typography variant="caption" color="text.secondary" component="p" sx={{ fontWeight: 600 }}>
        {strings.ask_agent_wants}
      </Typography>
      <Typography variant="body2" sx={{ mt: 0.25, fontSize: "0.95rem", whiteSpace: "pre-line" }}>
        {text}
      </Typography>
      <Stack direction="row" spacing={1} sx={{ mt: 1.25 }}>
        <Button size="small" variant="contained" disableElevation onClick={() => onAnswer(true)}>
          {strings.ask_agent_approve}
        </Button>
        <Button size="small" variant="outlined" onClick={() => onAnswer(false)}>
          {strings.ask_agent_decline}
        </Button>
      </Stack>
    </Box>
  );
}
