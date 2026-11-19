import { useEffect, useState } from "react";
import { APP_CHANGED } from "../appSwitch";
import type { HubApp } from "../types";
import type { BotConfig } from "./types";

const WORDPRESS_ORG = "https://wordpress.org/plugins";

interface CatalogPlugin {
  slug: string;
  title: string;
  short_title?: string;
  description: string;
  category: string;
  href?: string;
  released?: boolean;
}

/**
 * Catalog plugins as apps a visitor doesn't have: released ones link to WordPress.org to install;
 * unreleased ones are left out, so their cards say "Coming soon".
 */
function fromCatalog(plugins: CatalogPlugin[]): HubApp[] {
  return plugins
    .filter((plugin) => plugin.released)
    .map((plugin) => ({
      slug: plugin.slug,
      name: plugin.short_title || plugin.title,
      description: plugin.description,
      category: plugin.category,
      state: "missing",
      version: "",
      open_url: "",
      activate_url: "",
      coming_soon: false,
      install_url: `${WORDPRESS_ORG}/${plugin.slug}/`,
      learn_url: plugin.href ?? "",
    }));
}

/** The apps the bot's cards use: the site's own (wp-admin), or the public catalog (website). */
export default function useApps(config: BotConfig): HubApp[] {
  const [apps, setApps] = useState<HubApp[]>(config.apps ?? []);

  useEffect(() => {
    if (config.apps || !config.catalogUrl) return undefined;
    const controller = new AbortController();
    fetch(config.catalogUrl, { signal: controller.signal })
      .then((response) => (response.ok ? response.json() : null))
      .then((body) => Array.isArray(body?.data?.plugins) && setApps(fromCatalog(body.data.plugins)))
      .catch(() => undefined);
    return () => controller.abort();
  }, [config.apps, config.catalogUrl]);

  // The hub activated or deactivated an app without a reload (appSwitch.ts): keep its state current.
  useEffect(() => {
    const changed = (event: Event) => {
      const app = (event as CustomEvent<HubApp>).detail;
      if (app?.slug) setApps((current) => current.map((item) => (item.slug === app.slug ? { ...item, ...app } : item)));
    };
    window.addEventListener(APP_CHANGED, changed);
    return () => window.removeEventListener(APP_CHANGED, changed);
  }, []);

  return apps;
}

export { fromCatalog };
