import DownloadRoundedIcon from "@mui/icons-material/DownloadRounded";
import { Box, Button, Chip, Link, Stack, Typography } from "@mui/material";
import hubApps from "./apps";
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
              href={app.learn_url}
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

      {(action || app.coming_soon) && (
        <Stack direction="row" spacing={1} alignItems="center" useFlexGap flexWrap="wrap">
          {app.coming_soon && (
            <Button variant="outlined" disabled>
              {strings.coming_soon}
            </Button>
          )}
          {action && (
            <Button
              variant={action.variant}
              disableElevation
              href={action.href}
              startIcon={action.install ? <DownloadRoundedIcon /> : undefined}
            >
              {action.label}
            </Button>
          )}
        </Stack>
      )}
    </Box>
  );
}
