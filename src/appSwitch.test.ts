import { describe, expect, it } from "vitest";
import { jsonUrl, readSwitch } from "./appSwitch";
import type { HubApp } from "./types";

const app = { slug: "reinvent-watermark", state: "active" } as HubApp;

describe("appSwitch", () => {
  it("adds format=json to the link", () => {
    expect(jsonUrl("/wp-admin/admin-post.php?action=a&app=b&_wpnonce=c")).toBe(
      "/wp-admin/admin-post.php?action=a&app=b&_wpnonce=c&format=json",
    );
    expect(jsonUrl("/x")).toBe("/x?format=json");
  });

  it("reads the new card, a page to go to, or nothing", () => {
    expect(readSwitch({ success: true, data: { app } })).toEqual({ app });
    expect(
      readSwitch({
        success: true,
        data: { reload: "/wp-admin/plugins.php?deactivate=true" },
      }),
    ).toEqual({ reload: "/wp-admin/plugins.php?deactivate=true" });
    expect(readSwitch({ success: false, data: { message: "No" } })).toBeNull();
    expect(readSwitch({ success: true, data: { app: null } })).toBeNull();
    expect(readSwitch(null)).toBeNull();
  });
});
