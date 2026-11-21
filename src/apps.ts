import type { HubApp } from "./types";
import strings from "./strings";

export interface AppAction {
  href: string;
  label: string;
  variant: "contained" | "outlined";
  install: boolean;
  /** Opens a page on reinventwp.com in a new tab (Download), instead of a WordPress admin link. */
  external: boolean;
}

/** Installed apps (active or not) and the ones the site doesn't have yet, in catalog order. */
function group(apps: HubApp[]): { installed: HubApp[]; more: HubApp[] } {
  return {
    installed: apps.filter((app) => app.state !== "missing"),
    more: apps.filter((app) => app.state === "missing"),
  };
}

/** Fills the "%1$d of %2$d" placeholders of the summary line. */
function summary(template: string, apps: HubApp[]): string {
  const active = apps.filter((app) => app.state === "active").length;
  const installed = apps.filter((app) => app.state !== "missing").length;
  return template.replace("%1$d", String(active)).replace("%2$d", String(installed));
}

/**
 * The next useful action: Open (main) for an active app with an admin page, Activate or
 * Install (secondary) otherwise, or Download for an app that isn't on WordPress.org yet but has
 * a zip (its reinventwp.com page in a new tab; the hub never downloads or installs it itself).
 * Null when there is nothing to do, like an active app that works without settings.
 */
function action(app: HubApp): AppAction | null {
  if (app.state === "active" && app.open_url) return { href: app.open_url, label: strings.open, variant: "contained", install: false, external: false };
  if (app.state === "inactive" && app.activate_url) return { href: app.activate_url, label: strings.activate, variant: "outlined", install: false, external: false };
  if (app.state === "missing" && app.install_url && !app.coming_soon) return { href: app.install_url, label: strings.install, variant: "outlined", install: true, external: false };
  if (app.state === "missing" && app.download_url && !app.coming_soon)
    return { href: siteLink(app.download_url, "apps_hub", app.slug), label: strings.download, variant: "outlined", install: false, external: true };
  return null;
}

/** An active app's settings page opened at one setting, highlighted; empty when the app isn't active. */
function settingUrl(app: HubApp, path: string): string {
  if (app.state !== "active" || !app.open_url) return "";
  const separator = app.open_url.includes("?") ? "&" : "?";
  return `${app.open_url}${separator}path=${encodeURIComponent(path)}&spotlight=1`;
}

/** The catalog category whose apps get their own section above the rest. */
const MUST_HAVE = "must have";

/**
 * The page's three groups, in catalog order: apps the site has (active or not), every app in the catalog's
 * "Must have" category (the ones the site doesn't have first, then the installed ones, which are in both lists), and the other apps the site doesn't have.
 */
function sections(apps: HubApp[]): { installed: HubApp[]; mustHave: HubApp[]; more: HubApp[] } {
  const { installed, more: missing } = group(apps);
  const isMustHave = (app: HubApp) => (app.categories ?? []).some((name) => name.trim().toLowerCase() === MUST_HAVE);
  return { installed, mustHave: [...missing.filter(isMustHave), ...installed.filter(isMustHave)], more: missing.filter((app) => !isMustHave(app)) };
}

/** The catalog's extra category whose apps get the first chip. */
const POPULAR = "Popular";

/** Whether the catalog marks an app as popular (an extra category, next to its main one). */
function isPopular(app: HubApp): boolean {
  return (app.categories ?? []).some((name) => name.trim().toLowerCase() === POPULAR.toLowerCase());
}

/**
 * The category chips over a list, with counts: "Popular" first when the list has popular apps, then each main
 * category in the order it first appears, then "All" last.
 */
function chips(apps: HubApp[], allLabel: string): { label: string; value: string; count: number }[] {
  const counts = new Map<string, number>();
  apps.forEach((app) => {
    if (app.category) counts.set(app.category, (counts.get(app.category) ?? 0) + 1);
  });
  const popular = apps.filter(isPopular).length;
  return [
    ...(popular ? [{ label: POPULAR, value: POPULAR, count: popular }] : []),
    ...[...counts].filter(([name]) => name !== POPULAR).map(([name, count]) => ({ label: name, value: name, count })),
    { label: allLabel, value: "", count: apps.length },
  ];
}

/** The apps of one chip: the popular ones for "Popular", one main category, or all of them for "". */
function inCategory(apps: HubApp[], category: string): HubApp[] {
  if (category === POPULAR) return apps.filter(isPopular);
  return category ? apps.filter((app) => app.category === category) : apps;
}

/**
 * The chip that is on: the one the user picked while it still exists, else the first chip (a category; "All" is last).
 *
 * @example
 * selectedCategory(chips, null); // "Content" (the first chip)
 * selectedCategory(chips, ""); // "" (the user picked "All")
 */
function selectedCategory(chipList: { value: string }[], picked: string | null): string {
  if (picked !== null && chipList.some((chip) => chip.value === picked)) return picked;
  return chipList[0]?.value ?? "";
}

/** "Your apps" gets category chips from this many apps on; a shorter list is easier to scan without them. */
const CATEGORIZE_FROM = 4;

/**
 * Whether a list is worth filtering by category: at least CATEGORIZE_FROM apps, in more than one category.
 *
 * @example
 * categorized(threeApps); // false
 * categorized(fourAppsInTwoCategories); // true
 */
function categorized(apps: HubApp[]): boolean {
  return apps.length >= CATEGORIZE_FROM && new Set(apps.map((app) => app.category).filter(Boolean)).size > 1;
}


const SITE_HOSTS = ["reinventwp.com", "www.reinventwp.com"];

/**
 * A reinventwp.com link tagged with where in WordPress admin it was clicked, so the visit is credited to the plugin
 * (utm_source=wp_admin, like the plugins' own links). Links to other sites, and links already tagged, stay as they are.
 *
 * @example
 * siteLink("https://reinventwp.com/text-to-speech", "apps_hub", "natural-text-to-speech");
 * // https://reinventwp.com/text-to-speech?utm_source=wp_admin&utm_medium=apps_hub&utm_campaign=reinventwp_apps&utm_content=natural-text-to-speech
 */
function siteLink(url: string, medium: "apps_hub" | "assistant", content?: string): string {
  try {
    const parsed = new URL(url);
    if (!SITE_HOSTS.includes(parsed.hostname) || [...parsed.searchParams.keys()].some((key) => key.startsWith("utm_"))) return url;
    parsed.searchParams.set("utm_source", "wp_admin");
    parsed.searchParams.set("utm_medium", medium);
    parsed.searchParams.set("utm_campaign", "reinventwp_apps");
    if (content) parsed.searchParams.set("utm_content", content);
    return parsed.toString();
  } catch {
    return url;
  }
}

const hubApps = { action, categorized, chips, group, inCategory, sections, selectedCategory, siteLink, summary, settingUrl };

export default hubApps;
