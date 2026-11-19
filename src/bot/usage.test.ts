import { describe, expect, it } from "vitest";
import { level, percent, readUsage, ringShare, usageRequest } from "./usage";

const usage = {
  plan: "pro",
  hour: { used: 18_000, limit: 200_000, resets_at: "2026-11-19T14:00:00.000Z" },
  month: { used: 388_084, limit: 2_000_000, resets_at: "2026-12-01T00:00:00.000Z" },
};

describe("usage ring", () => {
  it("reads Services' usage and refuses anything else", () => {
    expect(readUsage(usage)).toEqual(usage);
    expect(readUsage({ ...usage, plan: "enterprise" })?.plan).toBe("free");
    expect(readUsage({ plan: "pro", hour: { used: 1, limit: 0 }, month: usage.month })).toBeNull();
    expect(readUsage(null)).toBeNull();
  });

  it("fills with the window closest to its limit", () => {
    const read = readUsage(usage)!;
    expect(ringShare(read)).toBeCloseTo(0.194, 3);
    expect(ringShare({ ...read, hour: { ...read.hour, used: 190_000 } })).toBeCloseTo(0.95, 3);
    expect(level(0.5)).toBe("ok");
    expect(level(0.85)).toBe("near");
    expect(level(1)).toBe("full");
  });

  it("shows whole percents, at least 1% once anything is used", () => {
    expect(percent({ used: 18_000, limit: 200_000, resets_at: "" })).toBe("9%");
    expect(percent({ used: 100, limit: 2_000_000, resets_at: "" })).toBe("1%");
    expect(percent({ used: 0, limit: 2_000_000, resets_at: "" })).toBe("0%");
  });

  it("reads through AI Agent when it's there, else straight from Services", () => {
    const config = { url: "https://services.example/api/reinvent/plugins/assistant" };
    expect(usageRequest(config)).toEqual(["https://services.example/api/reinvent/plugins/assistant/usage", {}]);
    const agent = { tools: "/t", run: "/r", nonce: "n1", usage: "/wp-json/ai-agent/v1/bot/usage" };
    expect(usageRequest(config, agent)).toEqual(["/wp-json/ai-agent/v1/bot/usage", { credentials: "include", headers: { "X-WP-Nonce": "n1" } }]);
  });
});
