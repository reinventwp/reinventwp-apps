import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import { Box, Button, Typography } from "@mui/material";
import hubApps from "../apps";
import strings from "../strings";
import SilkBackdrop from "./SilkBackdrop";
import SuiteHeroStory from "./SuiteHeroStory";
import suiteTone from "./suiteTone";

/** The Suite Pass page on reinventwp.com. */
const SUITE_URL = "https://reinventwp.com/suite";

/**
 * The Suite Pass offer, laid out like the /suite page's hero: the headline and one button on the left, the looping
 * story (a new PRO plugin joins the pass, the price stays) on frosted glass on the right, over the silk waves that
 * follow the pointer. Shown only on sites without a paid licence.
 */
export default function SuitePassCard() {
  const { color } = suiteTone;
  return (
    <Box
      component="section"
      aria-labelledby="rwp-suite-title"
      sx={{
        alignItems: "center",
        border: `1px solid ${color.line}`,
        borderRadius: 2,
        display: "grid",
        gap: { xs: 3, md: 4 },
        gridTemplateColumns: { xs: "1fr", md: "minmax(0, 7fr) minmax(0, 5fr)" },
        isolation: "isolate",
        overflow: "hidden",
        p: { xs: 2.5, md: 5 },
        position: "relative",
      }}
    >
      <Box sx={{ inset: 0, position: "absolute", zIndex: -1 }}>
        <SilkBackdrop />
      </Box>

      <Box sx={{ minWidth: 0 }}>
        <Typography component="p" sx={{ color: color.goldDeep, fontSize: 12, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" }}>
          {strings.suite_eyebrow}
        </Typography>
        <Typography
          id="rwp-suite-title"
          variant="h4"
          component="h2"
          // The title's line break is a "\n" in the string.
          sx={{ color: color.brown, fontWeight: 700, letterSpacing: "-0.02em", mt: 0.5, whiteSpace: "pre-line" }}
        >
          {strings.suite_title}
        </Typography>
        <Button
          disableElevation
          variant="contained"
          size="large"
          href={hubApps.siteLink(SUITE_URL, "apps_hub", "suite_pass")}
          target="_blank"
          rel="noopener"
          endIcon={<ArrowForwardRoundedIcon />}
          sx={{ bgcolor: color.goldDeep, color: "#FFFFFF", fontWeight: 700, mt: 3, px: 4, "&:hover, &:focus, &:active": { bgcolor: "#6F4E12", color: "#FFFFFF" } }}
        >
          {strings.suite_cta}
        </Button>
      </Box>

      {/* The story on frosted glass over the silk, as on /suite. */}
      <Box
        sx={{
          backdropFilter: "blur(18px) saturate(1.15)",
          bgcolor: "rgba(255, 251, 244, 0.6)",
          border: "1px solid rgba(255, 255, 255, 0.7)",
          boxShadow: "0 24px 60px rgba(61, 42, 20, 0.18)",
          px: { xs: 2.5, md: 4 },
          py: { xs: 3, md: 4 },
        }}
      >
        <SuiteHeroStory />
      </Box>
    </Box>
  );
}
