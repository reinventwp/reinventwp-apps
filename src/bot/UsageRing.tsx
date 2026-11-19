import { Box, ButtonBase, Link, Popover, Stack, Tooltip, Typography } from "@mui/material";
import { useState, type MouseEvent } from "react";
import hubApps from "../apps";
import strings from "../strings";
import { level, percent, resetLabel, ringShare, shareOf, type AssistantUsage, type UsageWindow } from "./usage";

const SUITE_URL = "https://reinventwp.com/suite";
const COLOR = { ok: "#1976d2", near: "#b26a00", full: "#d32f2f" } as const;
const TRACK = "rgba(7, 21, 34, 0.12)";

/** The small ring: how full the window closest to its limit is. */
function Ring({ share }: { share: number }) {
  const r = 6.5;
  const length = 2 * Math.PI * r;
  return (
    <Box component="svg" viewBox="0 0 18 18" sx={{ width: 16, height: 16, display: "block", transform: "rotate(-90deg)" }}>
      <circle cx={9} cy={9} r={r} fill="none" stroke={TRACK} strokeWidth={2.5} />
      <circle
        cx={9}
        cy={9}
        r={r}
        fill="none"
        stroke={COLOR[level(share)]}
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeDasharray={`${Math.max(share * length, share > 0 ? 1 : 0)} ${length}`}
      />
    </Box>
  );
}

/** One window in the popup: "Hourly limit · Resets 21:00 · 9%" over its bar. */
function WindowRow({ label, window }: { label: string; window: UsageWindow }) {
  const share = shareOf(window);
  const resets = resetLabel(window.resets_at);
  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="baseline" spacing={2}>
        <Typography variant="body2" sx={{ fontWeight: 500 }}>
          {label}
        </Typography>
        <Typography variant="caption" color="text.secondary" noWrap>
          {[resets && strings.ask_usage_resets.replace("%s", resets), percent(window)].filter(Boolean).join("  ")}
        </Typography>
      </Stack>
      <Box sx={{ mt: 0.75, height: 4, borderRadius: 2, bgcolor: TRACK, overflow: "hidden" }}>
        <Box sx={{ height: "100%", width: `${share * 100}%`, minWidth: share > 0 ? 3 : 0, borderRadius: 2, bgcolor: COLOR[level(share)] }} />
      </Box>
    </Box>
  );
}

/**
 * The assistant's usage, like Claude's: a ring just before the privacy link that fills as this hour's or month's
 * allowance is used; it opens a popup with both windows and when they start again. Free sites without any paid
 * Reinvent WP licence also see where to get a bigger allowance.
 */
export default function UsageRing({ usage, paid = false }: { usage: AssistantUsage; paid?: boolean }) {
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const share = ringShare(usage);
  const plan = usage.plan === "pro" ? strings.ask_usage_suite : strings.ask_usage_free;
  return (
    <>
      <Tooltip title={`${strings.ask_usage_title} · ${percent(usage.hour)}`}>
        <ButtonBase
          aria-label={strings.ask_usage_title}
          aria-haspopup="dialog"
          onClick={(event: MouseEvent<HTMLElement>) => setAnchor(event.currentTarget)}
          sx={{ p: 0.5, borderRadius: "50%", "&:hover, &:focus-visible": { bgcolor: "rgba(7, 21, 34, 0.06)" } }}
        >
          <Ring share={share} />
        </ButtonBase>
      </Tooltip>
      <Popover
        open={Boolean(anchor)}
        anchorEl={anchor}
        onClose={() => setAnchor(null)}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
        transformOrigin={{ vertical: "bottom", horizontal: "right" }}
        // Above the floating panel (z-index 9989) and its dialogs.
        sx={{ zIndex: 100000 }}
        slotProps={{ paper: { sx: { borderRadius: "14px", width: 300, maxWidth: "calc(100vw - 32px)", p: 2, mt: -1, boxShadow: "0 12px 40px rgba(7, 21, 34, 0.16)" } } }}
      >
        <Stack spacing={1.75}>
          <Typography variant="body2" color="text.secondary">
            {strings.ask_usage_title} · {plan}
          </Typography>
          <WindowRow label={strings.ask_usage_hour} window={usage.hour} />
          <WindowRow label={strings.ask_usage_month} window={usage.month} />
          {usage.plan === "free" && !paid && (
            <Typography variant="caption" color="text.secondary">
              {strings.ask_usage_more}{" "}
              <Link href={hubApps.siteLink(SUITE_URL, "assistant", "usage_ring")} target="_blank" rel="noopener" underline="always">
                {strings.ask_usage_suite_link}
              </Link>
            </Typography>
          )}
        </Stack>
      </Popover>
    </>
  );
}
