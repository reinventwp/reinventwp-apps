import { describe, expect, it } from "vitest";
import hubApps from "./apps";
import type { HubApp } from "./types";

const app = (slug: string, state: HubApp["state"]): HubApp => ({
  slug,
  name: slug,
  description: "",
  category: "Media",
  state,
  version: "",
  open_url: "",
  activate_url: "",
  coming_soon: false,
  install_url: "",
  learn_url: "",
});

describe("hubApps", () => {
  const apps = [app("a", "missing"), app("b", "active"), app("c", "inactive"), app("d", "active")];

  it("puts installed apps first and keeps catalog order inside each group", () => {
    const { installed, more } = hubApps.group(apps);
    expect(installed.map((item) => item.slug)).toEqual(["b", "c", "d"]);
    expect(more.map((item) => item.slug)).toEqual(["a"]);
  });

  it("counts active out of installed apps", () => {
    expect(hubApps.summary("%1$d of %2$d apps active on this site.", apps)).toBe("2 of 3 apps active on this site.");
  });
});

describe("hubApps.action", () => {

  it("opens active apps, and activates or installs the others as secondary actions", () => {
    expect(hubApps.action({ ...app("a", "active"), open_url: "/open" })).toMatchObject({ label: "Open", variant: "contained" });
    expect(hubApps.action({ ...app("b", "inactive"), activate_url: "/act" })).toMatchObject({ label: "Activate", variant: "outlined", install: false });
    expect(hubApps.action({ ...app("c", "missing"), install_url: "/inst" })).toMatchObject({ label: "Install", variant: "outlined", install: true });
  });

  it("never offers Install for an app that isn't on WordPress.org yet", () => {
    expect(hubApps.action({ ...app("e", "missing"), coming_soon: true, install_url: "/inst" })).toBeNull();
  });

  it("offers nothing when there is no link, like an active app without settings", () => {
    expect(hubApps.action(app("d", "active"))).toBeNull();
  });
});

describe("hubApps.settingUrl", () => {
  it("opens an active app's settings page at one setting, highlighted", () => {
    const active = { ...app("natural-text-to-speech", "active"), open_url: "http://x.test/wp-admin/admin.php?page=natuteto-settings" };
    expect(hubApps.settingUrl(active, "tabs_main>tab_audio>podcast")).toBe(
      "http://x.test/wp-admin/admin.php?page=natuteto-settings&path=tabs_main%3Etab_audio%3Epodcast&spotlight=1",
    );
  });

  it("has no link for an app that isn't active", () => {
    expect(hubApps.settingUrl({ ...app("reinvent-watermark", "inactive"), activate_url: "/act" }, "tabs_main")).toBe("");
  });
});
