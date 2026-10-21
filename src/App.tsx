import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import { Box, CircularProgress, IconButton, Link, Stack, Tooltip, Typography } from "@mui/material";
import { ThemeProvider } from "@mui/material/styles";
import { useEffect, useState } from "react";
import AppCard from "./AppCard";
import hubApps from "./apps";
import strings from "./strings";
import theme, { NEUTRAL_BORDER, sectionSurface } from "./theme";
import type { HubApp, HubData } from "./types";

/** Every Reinvent WP plugin, on reinventwp.com. */
const CATALOG_URL = "https://reinventwp.com/plugins";

function Group({ title, apps, data }: { title: string; apps: HubApp[]; data: HubData }) {
  if (!apps.length) return null;
  return (
    <Box component="section">
      <Typography variant="h6" component="h2" gutterBottom>
        {title}
      </Typography>
      <Box
        sx={{
          display: "grid",
          gap: 2,
          // Columns follow the space the page has, not the window: the assistant panel narrows the
          // page, so cards drop from three columns to two instead of squeezing.
          gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 300px), 1fr))",
        }}
      >
        {apps.map((app) => (
          <AppCard key={app.slug} app={app} />
        ))}
      </Box>
    </Box>
  );
}

/**
 * The "Reinvent WP Apps" page: one sharp section panel (reinventwp.com design system),
 * installed apps first, then the rest of the catalog.
 */
export default function App({ data }: { data: HubData }) {
  const { installed, more } = hubApps.group(data.apps);
  const [refreshing, setRefreshing] = useState(false);

  // After a refresh, drop the nonce from the address bar so reloading doesn't refresh again.
  useEffect(() => {
    if (window.location.search.includes("refresh=1")) window.history.replaceState(null, "", data.page_url);
  }, [data.page_url]);

  return (
    <ThemeProvider theme={theme}>
      <Box
        sx={{
          color: "text.primary",
          fontFamily: theme.typography.fontFamily,
          mr: { xs: 1.25, sm: 2.5 },
          my: 2.5,
        }}
      >
        <Box
          component="main"
          sx={{
            ...sectionSurface,
            boxSizing: "border-box",
            p: { xs: 2.5, md: 5 },
            // Fill the screen down to wp-admin's footer area (20px margin + its 85px), which also
            // leaves room for the bot's "Describe a problem…" field pinned to the bottom (bot.js).
            minHeight: "calc(100vh - var(--wp-admin--admin-bar--height, 32px) - 105px)",
          }}
        >
          <Stack direction="row" spacing={2} alignItems="flex-start" justifyContent="space-between">
            <Box>
              <Typography variant="h5" component="h1" color="primary" gutterBottom sx={{ fontWeight: 700 }}>
                <Tooltip title={strings.catalog_hint} placement="right">
                  <Link
                    href={CATALOG_URL}
                    target="_blank"
                    rel="noopener"
                    color="inherit"
                    underline="hover"
                    // wp-admin's "a:hover, a:focus { color }" outranks MUI's classes.
                    sx={{ "&:hover, &:focus": { color: "primary.main" } }}
                  >
                    {strings.title}
                  </Link>
                </Tooltip>
              </Typography>
              <Typography variant="body1" gutterBottom>
                {hubApps.summary(strings.summary, data.apps)}
              </Typography>
            </Box>
            <Tooltip title={strings.refresh_hint}>
              <IconButton
                aria-label={strings.refresh_hint}
                href={data.refresh_url}
                onClick={() => setRefreshing(true)}
                disabled={refreshing}
                sx={{ border: NEUTRAL_BORDER, borderRadius: 2, color: "primary.main", flexShrink: 0 }}
              >
                {refreshing ? <CircularProgress size={22} /> : <RefreshRoundedIcon />}
              </IconButton>
            </Tooltip>
          </Stack>

          <Stack spacing={5} sx={{ mt: 4 }}>
            <Group title={strings.your_apps} apps={installed} data={data} />
            <Group title={strings.more_apps} apps={more} data={data} />
          </Stack>
        </Box>
      </Box>
    </ThemeProvider>
  );
}
