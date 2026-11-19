import strings from "../strings";
import type { HubApp } from "../types";

/** AI Agent on WordPress.org. */
export const AGENT_PLUGIN_URL = "https://wordpress.org/plugins/ai-agent/";

/**
 * The link that gets AI Agent going on this site: activate it when it's installed, install it when it
 * isn't (both inside wp-admin), else its page on WordPress.org.
 */
export function agentLink(apps: HubApp[]): { href: string; label: string; external: boolean } {
  return agentStep(apps, false);
}

/**
 * The next step to have the Suite Pass confirmed through AI Agent: like agentLink, and when AI Agent is already
 * active (so no key is entered yet), its own page to enter the key.
 */
export function suitePassStep(apps: HubApp[]): { href: string; label: string; external: boolean } {
  return agentStep(apps, true);
}

function agentStep(apps: HubApp[], keyWhenActive: boolean): { href: string; label: string; external: boolean } {
  const agent = apps.find((app) => app.slug === "ai-agent");
  if (keyWhenActive && agent?.state === "active" && agent.open_url) return { href: agent.open_url, label: strings.ask_usage_enter_key, external: false };
  if (agent?.state === "inactive" && agent.activate_url) return { href: agent.activate_url, label: strings.ask_notice_activate_agent, external: false };
  if (agent?.state === "missing" && agent.install_url) return { href: agent.install_url, label: strings.ask_notice_install_agent, external: false };
  return { href: AGENT_PLUGIN_URL, label: strings.ask_notice_get_agent, external: true };
}
