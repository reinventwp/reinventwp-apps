import WorkspacePremiumRoundedIcon from "@mui/icons-material/WorkspacePremiumRounded";
import { Box, Tooltip } from "@mui/material";
import strings from "./strings";
import suiteTone from "./suite/suiteTone";
import { suitePassHint, suitePassStatus } from "./suitePass";
import type { SuitePass } from "./types";

/**
 * "Suite Pass · Active until …" next to the page title, for a site with a Suite Pass, in the Suite's own tone (the
 * Suite Pass card and reinventwp.com/suite: cream glow, gold line, deep brown text). An ended pass keeps the tone but
 * goes quieter.
 */
export default function SuitePassBadge({ pass }: { pass: SuitePass }) {
  const { color, gradient } = suiteTone;
  return (
    <Tooltip title={suitePassHint(pass)}>
      <Box
        tabIndex={0}
        sx={{
          display: "inline-flex",
          alignItems: "center",
          gap: 0.75,
          pl: 1,
          pr: 1.25,
          py: 0.375,
          borderRadius: 999,
          border: `1px solid ${pass.expired ? color.line : color.lineStrong}`,
          background: pass.expired ? color.cream : gradient.band,
          fontSize: "0.8rem",
          lineHeight: 1.4,
          whiteSpace: "nowrap",
          cursor: "default",
          opacity: pass.expired ? 0.85 : 1,
          "&:focus-visible": { outline: `2px solid ${color.gold}`, outlineOffset: 2 },
        }}
      >
        <WorkspacePremiumRoundedIcon sx={{ fontSize: 16, color: pass.expired ? color.goldText : color.goldDeep }} />
        <Box component="span" sx={{ fontWeight: 700, color: color.brown }}>
          {strings.suite_pass}
        </Box>
        <Box component="span" sx={{ fontWeight: 500, color: pass.expired ? color.goldText : color.brownSoft }}>
          {suitePassStatus(pass)}
        </Box>
      </Box>
    </Tooltip>
  );
}
