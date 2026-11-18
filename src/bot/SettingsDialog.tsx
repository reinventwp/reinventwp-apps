import OpenWithRoundedIcon from "@mui/icons-material/OpenWithRounded";
import { Box, Link, Stack, Typography } from "@mui/material";
import strings from "../strings";
import type { HubApp } from "../types";
import { agentLink } from "./agentLink";
import DialogBlur from "./DialogBlur";
import { LINK_SX } from "./linkStyle";
import { PANEL_MODES, PLACEMENTS, type PanelMode, type Placement } from "./placement";
import { DisplayPreview, OptionCard, PanelModePreview, PlacementPreview } from "./SettingsPreview";
import type { BotConfig } from "./types";
import type { BotDisplay, DisplaySetting } from "./useDisplay";

const DISPLAYS: BotDisplay[] = ["everywhere", "reinventwp"];

interface SettingsDialogProps {
  open: boolean;
  onClose: () => void;
  surface: BotConfig["surface"];
  apps: HubApp[];
  display: DisplaySetting;
  panelMode: PanelMode;
  onPanelModeChange: (mode: PanelMode) => void;
  placement: Placement;
  onPlacementChange: (placement: Placement) => void;
}

/**
 * The assistant's settings: where it shows in wp-admin (AI Agent's site setting), how the chat panel
 * opens and where the closed assistant sits (both kept in this browser). Opened by the gear in the
 * panel's header, or by a host page (AI Agent's admin, through embed.ts openSettings()).
 */
export default function SettingsDialog({ open, onClose, surface, apps, display, panelMode, onPanelModeChange, placement, onPlacementChange }: SettingsDialogProps) {
  const link = agentLink(apps);

  return (
    <DialogBlur title={strings.ask_settings_title} open={open} onClose={onClose} closeLabel={strings.ask_dialog_close} maxWidth="sm">
      {open && (
        <>
          {surface !== "website" && (
            <>
              <Typography variant="subtitle2" component="p" sx={{ mb: 1 }}>
                {strings.ask_display}
              </Typography>
              <Box role="radiogroup" aria-label={strings.ask_display} sx={{ display: "grid", gap: 1.25, gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" } }}>
                {DISPLAYS.map((option) => (
                  <OptionCard
                    key={option}
                    selected={display.value === option}
                    disabled={(option === "everywhere" && !display.available) || display.saving}
                    onSelect={() => display.change(option)}
                    preview={<DisplayPreview display={option} />}
                    label={strings.ask_display_options[option].label}
                    help={strings.ask_display_options[option].help}
                  />
                ))}
              </Box>
              {display.available ? (
                <Typography variant="caption" color={display.error ? "error" : "text.secondary"} component="p" sx={{ mt: 1, mb: 2.5 }}>
                  {display.error ? strings.ask_display_error : strings.ask_display_saved}
                </Typography>
              ) : (
                // Without AI Agent: say what it takes to show it everywhere, with the link that gets it going.
                <Typography variant="caption" component="p" sx={{ mt: 1.25, mb: 2.5, px: 1.25, py: 1, borderRadius: "10px", bgcolor: "rgba(2, 136, 209, 0.07)", color: "info.dark", lineHeight: 1.5 }}>
                  {strings.ask_display_needs_agent}{" "}
                  <Link href={link.href} target={link.external ? "_blank" : undefined} rel={link.external ? "noopener" : undefined} underline="always" sx={LINK_SX}>
                    {link.label}
                  </Link>
                  .
                </Typography>
              )}
            </>
          )}

          <Typography variant="subtitle2" component="p" sx={{ mb: 1 }}>
            {strings.ask_panel_mode}
          </Typography>
          <Box role="radiogroup" aria-label={strings.ask_panel_mode} sx={{ display: "grid", gap: 1.25, gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" } }}>
            {PANEL_MODES.map((option) => (
              <OptionCard
                key={option}
                selected={panelMode === option}
                onSelect={() => onPanelModeChange(option)}
                preview={<PanelModePreview mode={option} />}
                label={strings.ask_panel_mode_options[option].label}
                help={strings.ask_panel_mode_options[option].help}
              />
            ))}
          </Box>
          <Stack direction="row" spacing={1} alignItems="flex-start" sx={{ mt: 1.25, mb: 2.5, px: 1.25, py: 1, borderRadius: "10px", bgcolor: "rgba(2, 136, 209, 0.07)" }}>
            <OpenWithRoundedIcon fontSize="small" sx={{ color: "info.dark", mt: "1px" }} />
            <Typography variant="caption" sx={{ color: "info.dark", lineHeight: 1.5 }}>
              {strings.ask_drag_tip}
            </Typography>
          </Stack>
          <Typography variant="subtitle2" component="p" sx={{ mb: 1 }}>
            {strings.ask_placement}
          </Typography>
          <Box role="radiogroup" aria-label={strings.ask_placement} sx={{ display: "grid", gap: 1.25, gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr 1fr" } }}>
            {PLACEMENTS.map((option) => (
              <OptionCard
                key={option}
                selected={placement === option}
                onSelect={() => onPlacementChange(option)}
                preview={<PlacementPreview placement={option} />}
                label={strings.ask_placement_options[option]}
              />
            ))}
          </Box>
          <Typography variant="caption" color="text.secondary" component="p" sx={{ mt: 1.5 }}>
            {strings.ask_settings_saved}
          </Typography>
        </>
      )}
    </DialogBlur>
  );
}
