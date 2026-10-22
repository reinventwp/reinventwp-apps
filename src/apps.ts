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

const hubApps = { action, group, summary, settingUrl };

export default hubApps;
