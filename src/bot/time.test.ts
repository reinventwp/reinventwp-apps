import { describe, expect, it } from "vitest";
import { relativeTime } from "./time";

describe("bot message times", () => {
  const now = Date.UTC(2026, 9, 21, 12, 0, 0);
  const ago = (ms: number) => relativeTime(now - ms, now);

  it("reads like a chat", () => {
    expect(ago(10_000)).toBe("just now");
    expect(ago(60_000)).toBe("1 minute ago");
    expect(ago(4 * 60_000)).toBe("4 minutes ago");
    expect(ago(2 * 3_600_000)).toBe("2 hours ago");
    expect(ago(30 * 3_600_000)).toBe("yesterday");
    expect(ago(5 * 86_400_000)).toBe("16 Oct");
  });
});
