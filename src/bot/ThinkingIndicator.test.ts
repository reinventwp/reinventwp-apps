import { describe, expect, it } from "vitest";
import { thinkingSteps } from "./ThinkingIndicator";

describe("bot thinking steps", () => {
  it("start with what was attached and end on one that waits for the answer", () => {
    expect(thinkingSteps({ image: true, file: false, wpAdmin: true })).toEqual([
      "Reading your screenshot…",
      "Searching reinventwp.com…",
      "Reading the plugin docs…",
      "Checking the plugins on your site…",
      "Writing the answer…",
      "Almost there…",
    ]);
  });

  it("don't mention the site's plugins on reinventwp.com", () => {
    expect(thinkingSteps({ image: false, file: true, wpAdmin: false })).toEqual([
      "Reading your log file…",
      "Searching reinventwp.com…",
      "Reading the plugin docs…",
      "Writing the answer…",
      "Almost there…",
    ]);
  });
});
