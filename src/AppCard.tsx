import DownloadRoundedIcon from "@mui/icons-material/DownloadRounded";
import OpenInNewRoundedIcon from "@mui/icons-material/OpenInNewRounded";
import { Box, Button, Chip, Link, Stack, Typography } from "@mui/material";
import { useContext, useState, type MouseEvent } from "react";
import hubApps from "./apps";
import { switchApp, UpdateAppContext } from "./appSwitch";
import appStories from "./story";
import { NEUTRAL_BORDER } from "./theme";
import strings from "./strings";
import type { HubApp } from "./types";

interface AppCardProps {
  app: HubApp;
}

/** One app, styled like the plugin cards on reinventwp.com/plugins. */
export default function AppCard({ app }: AppCardProps) {
  const action = hubApps.action(app);
  const updateApp = useContext(UpdateAppContext);
  const [busy, setBusy] = useState<"activate" | "deactivate" | null>(null);

  /** Activate and Deactivate run in the background and change this card; if that fails, the link runs as before. */
  const runSwitch = (kind: "activate" | "deactivate", url: string) => async (event: MouseEvent) => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || busy) return;
    event.preventDefault();
    setBusy(kind);
    const result = await switchApp(url);
    if (result && "app" in result) {
      updateApp(result.app);
      setBusy(null);
    } else {
      window.location.href = result?.reload ?? url;
    }
  };
  const activating = app.state === "inactive" && action?.href === app.activate_url;

  const Story = appStories[app.slug];

  return (
    <Box
      component="article"
      sx={{
        display: "flex",
        flexDirection: "column",
        gap: 2,
        p: 3,
        borderRadius: 2,
        border: NEUTRAL_BORDER,
        backgroundColor: "#FFFFFF",
        transition: "border-color 0.2s ease",
        "&:hover": { borderColor: "primary.main" },
        "@media (prefers-reduced-motion: reduce)": { transition: "none" },
      }}
    >
      {Story && (
        <Box sx={{ mx: -1, mb: 1 }}>
          <Story />
        </Box>
      )}

      <Box>
        <Typography variant="h6" component="h3" sx={{ lineHeight: 1.3 }}>
          {app.learn_url ? (
            <Link
              href={hubApps.siteLink(app.learn_url, "apps_hub", app.slug)}
              target="_blank"
              rel="noopener noreferrer"
              color="inherit"
              underline="always"
              sx={{ textUnderlineOffset: "0.18em", textDecorationThickness: "1px" }}
            >
              {app.name}
            </Link>
          ) : (
            app.name
          )}
        </Typography>
        {app.category && <Chip label={app.category} size="small" variant="outlined" sx={{ mt: 0.75 }} />}
      </Box>

      <Typography variant="body2" color="text.secondary" sx={{ flexGrow: 1 }}>
        {app.description}
      </Typography>

      {(action || app.coming_soon || app.deactivate_url) && (
        <Stack direction="row" spacing={1} alignItems="center" useFlexGap flexWrap="wrap">
          {app.coming_soon && (
            <Button variant="outlined" disabled>
              {strings.coming_soon}
            </Button>
          )}
          {action && !action.external && (
            <Button
              variant={action.variant}
              disableElevation
              href={action.href}
              onClick={activating ? runSwitch("activate", action.href) : undefined}
              disabled={busy !== null}
              startIcon={action.install ? <DownloadRoundedIcon /> : undefined}
            >
              {busy === "activate" ? strings.activating : action.label}
            </Button>
          )}
          {/* Not on WordPress.org yet: a link to the plugin's page on reinventwp.com, which offers the zip; the hub never downloads or installs it. */}
          {action?.external && (
            <Button
              variant={action.variant}
              disableElevation
              href={action.href}
              target="_blank"
              rel="noopener noreferrer"
              endIcon={<OpenInNewRoundedIcon />}
            >
              {action.label}
            </Button>
          )}
          {/* Active apps: a quiet Deactivate next to Open; it runs in the background and the card shows Activate again. */}
          {app.deactivate_url && (
            <Button
              size="small"
              color="inherit"
              href={app.deactivate_url}
              onClick={runSwitch("deactivate", app.deactivate_url)}
              disabled={busy !== null}
              sx={{ color: "text.secondary", ml: "auto", "&:hover": { color: "text.primary" } }}
            >
              {busy === "deactivate" ? strings.deactivating : strings.deactivate}
            </Button>
          )}
        </Stack>
      )}
    </Box>
  );
}
