import { describe, expect, it } from "vitest";
import type { HubApp } from "../types";
import { AGENT_PLUGIN_URL, agentLink, suitePassStep } from "./agentLink";

const agent = (state: HubApp["state"]) => ({ slug: "ai-agent", state, activate_url: "/activate", install_url: "/install", open_url: "/open" }) as HubApp;

describe("AI Agent steps", () => {
  it("installs, activates or links to WordPress.org", () => {
    expect(agentLink([agent("missing")])).toMatchObject({ href: "/install", external: false });
    expect(agentLink([agent("inactive")])).toMatchObject({ href: "/activate", external: false });
    expect(agentLink([])).toMatchObject({ href: AGENT_PLUGIN_URL, external: true });
  });

  it("asks for the Suite Pass key in AI Agent when it's already active", () => {
    expect(suitePassStep([agent("active")])).toEqual({ href: "/open", label: "enter your Suite Pass key in AI Agent", external: false });
    expect(suitePassStep([agent("inactive")])).toMatchObject({ href: "/activate", label: "activate the AI Agent plugin" });
  });
});
