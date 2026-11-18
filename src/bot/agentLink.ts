import strings from "../strings";
import type { HubApp } from "../types";

/** AI Agent on WordPress.org. */
export const AGENT_PLUGIN_URL = "https://wordpress.org/plugins/ai-agent/";

/**
 * The link that gets AI Agent going on this site: activate it when it's installed, install it when it
 * isn't (both inside wp-admin), else its page on WordPress.org.
 */
export function agentLink(apps: HubApp[]): { href: string; label: string; external: boolean } {
  const agent = apps.find((app) => app.slug === "ai-agent");
  if (agent?.state === "inactive" && agent.activate_url) return { href: agent.activate_url, label: strings.ask_notice_activate_agent, external: false };
  if (agent?.state === "missing" && agent.install_url) return { href: agent.install_url, label: strings.ask_notice_install_agent, external: false };
  return { href: AGENT_PLUGIN_URL, label: strings.ask_notice_get_agent, external: true };
}
