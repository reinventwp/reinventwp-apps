import { describe, expect, it } from "vitest";
import { cleanReferrer, randomId, readUtm } from "./visitor";

describe("website visitor session", () => {
  it("makes random ids Services accepts", () => {
    expect(randomId("s")).toMatch(/^s_[A-Za-z0-9]{14}$/);
    expect(randomId("c")).toMatch(/^c_[A-Za-z0-9]{14}$/);
    expect(randomId("s")).not.toBe(randomId("s"));
  });

  it("keeps a referrer without its query, and only web addresses", () => {
    expect(cleanReferrer("https://www.google.com/search?q=wordpress+lightbox#x")).toBe("https://www.google.com/search");
    expect(cleanReferrer("android-app://com.google.android.gm/")).toBe("");
    expect(cleanReferrer("")).toBe("");
  });

  it("reads the utm parameters and nothing else", () => {
    expect(readUtm("?utm_source=tiktok&utm_campaign=lightbox&ref=x&utm_medium=")).toEqual({ source: "tiktok", campaign: "lightbox" });
    expect(readUtm("")).toEqual({});
  });
});
