import { describe, expect, it } from "vitest";
import { fromCatalog } from "./useApps";

describe("bot apps on the website", () => {
  it("offers released plugins from WordPress.org and leaves unreleased ones out", () => {
    const apps = fromCatalog([
      { slug: "natural-text-to-speech", title: "Reinvent WP Text to Speech", short_title: "Text to Speech", description: "Audio.", category: "Content", href: "/text-to-speech", released: true },
      { slug: "reinvent-watermark", title: "Reinvent Watermark", description: "Logo.", category: "Media", released: false },
    ]);
    expect(apps).toEqual([
      {
        slug: "natural-text-to-speech",
        name: "Text to Speech",
        description: "Audio.",
        category: "Content",
        state: "missing",
        version: "",
        open_url: "",
        activate_url: "",
        coming_soon: false,
        install_url: "https://wordpress.org/plugins/natural-text-to-speech/",
        learn_url: "/text-to-speech",
      },
    ]);
  });
});
