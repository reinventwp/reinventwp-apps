import type { HubApp } from "../types";

/**
 * window.reinventwpBot: where bot.js runs and what it knows. Printed by the PHP hub class on the
 * Reinvent WP Apps page and the approved plugins' own pages, and by reinventwp.com.
 */
export interface BotConfig {
  /** A WordPress admin page of the site, or reinventwp.com (a visitor, not a site owner). */
  surface: "wp-admin" | "website";
  /** The page it's on: "apps" (the Apps page), a plugin slug (that plugin's own page), or a website path. */
  page: string;
  /** Reinvent WP Services assistant endpoint. */
  url: string;
  /** The site's Reinvent WP apps (wp-admin). On the website, read from `catalogUrl` instead. */
  apps?: HubApp[];
  /** Public plugin catalog (website). */
  catalogUrl?: string;
  /** Element narrowed to make room for the open panel, e.g. "#wpcontent"; the bar centres over it. */
  shift?: string;
  /**
   * Where the chat's feedback form sends (Services /feedback). In WordPress it also carries the
   * admin's email and the site's hostname to prefill; on reinventwp.com the visitor types them.
   */
  feedback?: { url: string; email?: string; origin?: string };
}
