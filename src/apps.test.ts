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

  it("offers Get it for an app that isn't on WordPress.org yet but has a zip, as a tagged link to its reinventwp.com page", () => {
    const download = hubApps.action({ ...app("reinvent-lightbox", "missing"), download_url: "https://reinventwp.com/lightbox" });
    expect(download).toEqual({
      href: "https://reinventwp.com/lightbox?utm_source=wp_admin&utm_medium=apps_hub&utm_campaign=reinventwp_apps&utm_content=reinvent-lightbox",
      label: "Get it",
      variant: "outlined",
      install: false,
      external: true,
    });
  });

  it("keeps Install, Open and Activate as internal links, and Coming soon apps without a zip get nothing", () => {
    expect(hubApps.action({ ...app("c", "missing"), install_url: "/inst" })).toMatchObject({ external: false });
    expect(hubApps.action({ ...app("a", "active"), open_url: "/open" })).toMatchObject({ external: false });
    expect(hubApps.action({ ...app("f", "missing"), coming_soon: true })).toBeNull();
    expect(hubApps.action({ ...app("g", "missing"), coming_soon: true, download_url: "https://reinventwp.com/download/g" })).toBeNull();
  });

  it("offers Get it only for apps the site doesn't have", () => {
    expect(hubApps.action({ ...app("h", "inactive"), download_url: "https://reinventwp.com/download/h" })).toBeNull();
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

describe("reinventwp.com links", () => {
  it("tags our own links with where they were clicked", () => {
    const link = new URL(hubApps.siteLink("https://reinventwp.com/text-to-speech", "apps_hub", "natural-text-to-speech"));
    expect(Object.fromEntries(link.searchParams)).toEqual({
      utm_campaign: "reinventwp_apps",
      utm_content: "natural-text-to-speech",
      utm_medium: "apps_hub",
      utm_source: "wp_admin",
    });
  });

  it("keeps the hash and leaves other sites and tagged links alone", () => {
    expect(hubApps.siteLink("https://reinventwp.com/text-to-speech#pricing", "assistant")).toBe(
      "https://reinventwp.com/text-to-speech?utm_source=wp_admin&utm_medium=assistant&utm_campaign=reinventwp_apps#pricing",
    );
    expect(hubApps.siteLink("https://wordpress.org/plugins/x/", "apps_hub")).toBe("https://wordpress.org/plugins/x/");
    expect(hubApps.siteLink("https://reinventwp.com/x?utm_source=bot", "apps_hub")).toBe("https://reinventwp.com/x?utm_source=bot");
  });
});

describe("page sections", () => {
  const withCategories = (slug: string, state: HubApp["state"], category: string, categories: string[] = []): HubApp => ({ ...app(slug, state), category, categories });
  const apps = [
    withCategories("natural-text-to-speech", "active", "Content", ["Popular"]),
    withCategories("reinvent-media-cleanup", "active", "Media", ["Popular", "Must have"]),
    withCategories("reinvent-database-cleaner", "missing", "Performance", ["Must have"]),
    withCategories("reinvent-lightbox", "missing", "Media"),
    withCategories("ai-agent", "missing", "AI"),
    withCategories("reinvent-image-links", "missing", "Media"),
  ];

  it("puts every Must have app in its own section, the installed ones last", () => {
    const { installed, mustHave, more } = hubApps.sections(apps);
    expect(installed.map((item) => item.slug)).toEqual(["natural-text-to-speech", "reinvent-media-cleanup"]);
    expect(mustHave.map((item) => item.slug)).toEqual(["reinvent-database-cleaner", "reinvent-media-cleanup"]);
    expect(more.map((item) => item.slug)).toEqual(["reinvent-lightbox", "ai-agent", "reinvent-image-links"]);
  });

  it("counts the main categories for the chips and filters by them", () => {
    const { more } = hubApps.sections(apps);
    expect(hubApps.chips(more, "All")).toEqual([
      { label: "Media", value: "Media", count: 2 },
      { label: "AI", value: "AI", count: 1 },
      { label: "All", value: "", count: 3 },
    ]);
    expect(hubApps.inCategory(more, "Media").map((item) => item.slug)).toEqual(["reinvent-lightbox", "reinvent-image-links"]);
    expect(hubApps.inCategory(more, "")).toHaveLength(3);
  });

  it("treats apps from older hubs without categories as not Must have", () => {
    const { mustHave } = hubApps.sections([{ ...app("x", "missing"), category: "Media" }]);
    expect(mustHave).toEqual([]);
  });
});

describe("hubApps.categorized", () => {
  const inCategory = (slug: string, category: string): HubApp => ({ ...app(slug, "active"), category });

  it("starts at 4 apps in more than one category", () => {
    const three = [inCategory("a", "Content"), inCategory("b", "AI"), inCategory("c", "Media")];
    expect(hubApps.categorized(three)).toBe(false);
    expect(hubApps.categorized([...three, inCategory("d", "Media")])).toBe(true);
  });

  it("stays off when every app is in the same category", () => {
    expect(hubApps.categorized(["a", "b", "c", "d"].map((slug) => inCategory(slug, "Media")))).toBe(false);
  });
});

describe("hubApps.selectedCategory", () => {
  const chipList = [{ value: "Content" }, { value: "Media" }, { value: "" }];

  it("starts on the first chip, and keeps what the user picked, All included", () => {
    expect(hubApps.selectedCategory(chipList, null)).toBe("Content");
    expect(hubApps.selectedCategory(chipList, "Media")).toBe("Media");
    expect(hubApps.selectedCategory(chipList, "")).toBe("");
  });

  it("goes back to the first chip when the picked category is gone", () => {
    expect(hubApps.selectedCategory(chipList, "AI")).toBe("Content");
    expect(hubApps.selectedCategory([], null)).toBe("");
  });
});

describe("Popular chip", () => {
  const list: HubApp[] = [
    { ...app("natural-text-to-speech", "active"), category: "Content", categories: ["Popular"] },
    { ...app("ai-agent", "active"), category: "AI", categories: [] },
    { ...app("reinvent-media-cleanup", "active"), category: "Media", categories: ["popular", "Must have"] },
    { ...app("reinvent-watermark", "inactive"), category: "Media" },
  ];

  it("comes first when the list has popular apps, with All last", () => {
    expect(hubApps.chips(list, "All").map((chip) => `${chip.label} ${chip.count}`)).toEqual(["Popular 2", "Content 1", "AI 1", "Media 2", "All 4"]);
    expect(hubApps.selectedCategory(hubApps.chips(list, "All"), null)).toBe("Popular");
  });

  it("shows the apps the catalog marks as popular, whatever their main category", () => {
    expect(hubApps.inCategory(list, "Popular").map((item) => item.slug)).toEqual(["natural-text-to-speech", "reinvent-media-cleanup"]);
  });

  it("is left out when no app is popular", () => {
    expect(hubApps.chips([list[1], list[3]], "All").map((chip) => chip.label)).toEqual(["AI", "Media", "All"]);
  });
});
