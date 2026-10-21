import { describe, expect, it } from "vitest";
import { hostnameOf } from "./FeedbackForm";

describe("bot feedback form", () => {
  it("turns what the visitor types into a hostname", () => {
    expect(hostnameOf("https://www.Example.com/blog?x=1")).toBe("www.example.com");
    expect(hostnameOf("example.com")).toBe("example.com");
    expect(hostnameOf("  ")).toBe("");
    expect(hostnameOf("not a site")).toBe("");
  });
});
