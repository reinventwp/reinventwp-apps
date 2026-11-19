import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import { Box, Chip, CircularProgress, IconButton, Link, Stack, Tooltip, Typography } from "@mui/material";
import { ThemeProvider } from "@mui/material/styles";
import { useCallback, useEffect, useState } from "react";
import AppCard from "./AppCard";
import { announceApp, UpdateAppContext } from "./appSwitch";
import HubHero from "./hero/HubHero";
import SuitePassCard from "./suite/SuitePassCard";
import hubApps from "./apps";
import strings from "./strings";
import theme, { NEUTRAL_BORDER, sectionSurface } from "./theme";
import type { HubApp, HubData } from "./types";

/** Every Reinvent WP plugin, on reinventwp.com. */
const CATALOG_URL = "https://reinventwp.com/plugins";

function CardGrid({ apps }: { apps: HubApp[] }) {
  return (
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
  );
}

function SectionTitle({ id, title, intro }: { id: string; title: string; intro: string }) {
  return (
    <Box sx={{ mb: 2 }}>
      <Typography id={id} variant="h6" component="h2">
        {title}
      </Typography>
      <Typography variant="body2" color="text.secondary">
        {intro}
      </Typography>
    </Box>
  );
}

/** The catalog's "Must have" apps: Install for the ones the site doesn't have, Open or Activate for the ones it has. */
function MustHave({ apps }: { apps: HubApp[] }) {
  if (!apps.length) return null;
  return (
    <Box component="section" aria-labelledby="rwp-must-have">
      <SectionTitle id="rwp-must-have" title={strings.must_have} intro={strings.must_have_intro} />
      <CardGrid apps={apps} />
    </Box>
  );
}

/** Chips that filter a list of apps by category: each category with its count, then "All" last. */
function CategoryChips({ apps, category, onChange }: { apps: HubApp[]; category: string; onChange: (category: string) => void }) {
  return (
    <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" sx={{ mb: 2 }}>
      {hubApps.chips(apps, strings.all).map((chip) => (
        <Chip
          key={chip.value || "all"}
          label={`${chip.label}  ${chip.count}`}
          clickable
          color={category === chip.value ? "primary" : "default"}
          variant={category === chip.value ? "filled" : "outlined"}
          onClick={() => onChange(chip.value)}
          aria-pressed={category === chip.value}
          sx={{ fontWeight: 600, whiteSpace: "pre" }}
        />
      ))}
    </Stack>
  );
}

/** The apps the site already has, as the same cards, with Open or Activate; from 4 apps on, with category chips. */
function YourApps({ apps }: { apps: HubApp[] }) {
  // Null until the user picks a chip: the first category is on by default.
  const [picked, setPicked] = useState<string | null>(null);
  if (!apps.length) return null;
  const active = apps.filter((app) => app.state === "active").length;
  const categorized = hubApps.categorized(apps);
  const category = hubApps.selectedCategory(hubApps.chips(apps, strings.all), picked);
  return (
    <Box component="section" aria-labelledby="rwp-your-apps">
      <Stack direction="row" spacing={1.5} alignItems="baseline" sx={{ mb: 2 }}>
        <Typography id="rwp-your-apps" variant="h6" component="h2">
          {strings.your_apps}
        </Typography>
        <Typography variant="body2" sx={{ color: "success.main", fontWeight: 600 }}>
          {strings.your_apps_active.replace("%d", String(active))}
        </Typography>
      </Stack>
      {categorized && <CategoryChips apps={apps} category={category} onChange={setPicked} />}
      <CardGrid apps={categorized ? hubApps.inCategory(apps, category) : apps} />
    </Box>
  );
}

/** The other apps the site doesn't have, with chips that filter them by category. */
function MoreApps({ apps }: { apps: HubApp[] }) {
  const [picked, setPicked] = useState<string | null>(null);
  if (!apps.length) return null;
  const chips = hubApps.chips(apps, strings.all);
  // One category only: no chips, every app shows.
  const filtered = chips.length > 2;
  const category = hubApps.selectedCategory(chips, picked);
  return (
    <Box component="section" aria-labelledby="rwp-more-apps">
      <SectionTitle id="rwp-more-apps" title={strings.more_apps} intro={strings.more_apps_intro} />
      {filtered && <CategoryChips apps={apps} category={category} onChange={setPicked} />}
      <CardGrid apps={filtered ? hubApps.inCategory(apps, category) : apps} />
    </Box>
  );
}

/** Whether wp-admin printed anything visible (other plugins' notices) above this page. */
function useNoticesAbove(): boolean {
  const [above, setAbove] = useState(false);
  useEffect(() => {
    let node = document.getElementById("reinventwp-apps-root")?.previousElementSibling;
    while (node) {
      if (node instanceof HTMLElement && node.offsetHeight > 0) {
        setAbove(true);
        return;
      }
      node = node.previousElementSibling;
    }
  }, []);
  return above;
}

/**
 * The "Reinvent WP Apps" page: one sharp section panel (reinventwp.com design system). The homepage's hero on
 * top, the title, the Suite Pass offer (sites without a paid licence only), the "Must have" apps
 * (installed or not), the rest of the catalog with category chips, and the site's own apps at the bottom.
 */
export default function App({ data }: { data: HubData }) {
  // Activate and Deactivate change a card in place (appSwitch.ts).
  const [apps, setApps] = useState(data.apps);
  const updateApp = useCallback((app: HubApp) => {
    setApps((current) => current.map((item) => (item.slug === app.slug ? app : item)));
    announceApp(app);
  }, []);
  const { installed, mustHave, more } = hubApps.sections(apps);
  const showSuite = data.show_suite !== false;
  const [refreshing, setRefreshing] = useState(false);
  const noticesAbove = useNoticesAbove();

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
          {/*
            The hero comes first and runs out of the panel: over its padding and border, and over the grey gap up to
            wp-admin's bar, its menu and the window's right edge, so nothing frames it. With notices above the page
            it stays under them, at the panel's top.
          */}
          <Box
            sx={{
              "--rwp-pad": { xs: "20px", md: "40px" },
              "--rwp-gap-right": { xs: "10px", sm: "20px" },
              // wp-admin's own left gap: 20px, and 10px on its small-screen layout.
              "--rwp-gap-left": "20px",
              "@media (max-width: 782px)": { "--rwp-gap-left": "10px" },
              mb: 3,
              ml: "calc(-1 * (var(--rwp-pad) + 1px + var(--rwp-gap-left)))",
              mr: "calc(-1 * (var(--rwp-pad) + 1px + var(--rwp-gap-right)))",
              mt: noticesAbove ? "calc(-1 * var(--rwp-pad))" : "calc(-1 * (var(--rwp-pad) + 21px))",
            }}
          >
            <HubHero flush={!noticesAbove} />
          </Box>

          <Stack direction="row" spacing={2} alignItems="flex-start" justifyContent="space-between">
            <Box>
              <Typography variant="h5" component="h1" color="primary" gutterBottom sx={{ fontWeight: 700 }}>
                <Tooltip title={strings.catalog_hint} placement="right">
                  <Link
                    href={hubApps.siteLink(CATALOG_URL, "apps_hub", "all_plugins")}
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

          <Stack spacing={5} sx={{ mt: 3 }}>
            {showSuite && <SuitePassCard />}
            <UpdateAppContext.Provider value={updateApp}>
              <MustHave apps={mustHave} />
              <MoreApps apps={more} />
              <YourApps apps={installed} />
            </UpdateAppContext.Provider>
          </Stack>
        </Box>
      </Box>
    </ThemeProvider>
  );
}
