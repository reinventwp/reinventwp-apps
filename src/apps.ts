import type { HubApp } from "./types";
import strings from "./strings";

export interface AppAction {
  href: string;
  label: string;
  variant: "contained" | "outlined";
  install: boolean;
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
 * Install (secondary) otherwise. Null when there is nothing to do, like an active app that
 * works without settings.
 */
function action(app: HubApp): AppAction | null {
  if (app.state === "active" && app.open_url) return { href: app.open_url, label: strings.open, variant: "contained", install: false };
  if (app.state === "inactive" && app.activate_url) return { href: app.activate_url, label: strings.activate, variant: "outlined", install: false };
  if (app.state === "missing" && app.install_url && !app.coming_soon) return { href: app.install_url, label: strings.install, variant: "outlined", install: true };
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

/** The category chips over a list: "All" first, then each main category in the order it first appears, with counts. */
function chips(apps: HubApp[], allLabel: string): { label: string; value: string; count: number }[] {
  const counts = new Map<string, number>();
  apps.forEach((app) => {
    if (app.category) counts.set(app.category, (counts.get(app.category) ?? 0) + 1);
  });
  return [{ label: allLabel, value: "", count: apps.length }, ...[...counts].map(([name, count]) => ({ label: name, value: name, count }))];
}

/** The apps of one main category; all of them for "". */
function inCategory(apps: HubApp[], category: string): HubApp[] {
  return category ? apps.filter((app) => app.category === category) : apps;
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

const hubApps = { action, chips, group, inCategory, sections, siteLink, summary, settingUrl };

export default hubApps;
