/** Whether the app is installed and active on this site. */
export type AppState = "active" | "inactive" | "missing";

/** One card, prepared by the PHP hub class (URLs already carry their nonces). */
export interface HubApp {
  slug: string;
  name: string;
  description: string;
  category: string;
  /** The catalog's extra categories, like "Must have" or "Popular" (older hubs send none). */
  categories?: string[];
  state: AppState;
  /** Installed version; empty when not installed. */
  version: string;
  /** Admin page of an active app; empty when it has none. */
  open_url: string;
  /** Activation link for an installed app, when the user may activate plugins. */
  activate_url: string;
  /** Deactivation link for an active app (hub 2.3.0+), when the user may deactivate it; it comes back to the dashboard. */
  deactivate_url?: string;
  /** Not on WordPress.org yet: the card says "Coming soon" instead of Install. */
  coming_soon: boolean;
  /** WordPress.org install screen, when the user may install plugins. */
  install_url: string;
  /**
   * Not on WordPress.org yet but has a zip (hub 2.5.0+): its download page on reinventwp.com, opened in a new tab.
   * The hub never downloads or installs the zip itself (WordPress.org guideline 8).
   */
  download_url?: string;
  /** Product page on reinventwp.com. */
  learn_url: string;
}

/** window.reinventwpApps, printed by the PHP hub class. */
export interface HubData {
  apps: HubApp[];
  /** This page with a nonce that makes PHP read the list from Reinvent WP Services again. */
  refresh_url: string;
  /** This page without the refresh parameters. */
  page_url: string;
  /** False when a Reinvent WP plugin on the site has a paid licence: then the Suite Pass offer stays hidden. */
  show_suite?: boolean;
  /** The site's Suite Pass (from reinventwp_suite_pass), or null/missing when it has none. */
  suite_pass?: SuitePass | null;
}

/** A Suite Pass on this site: when it ends (null: no end date) and how many sites it covers. */
export interface SuitePass {
  expires_at: string | null;
  expired: boolean;
  sites: number | null;
}
