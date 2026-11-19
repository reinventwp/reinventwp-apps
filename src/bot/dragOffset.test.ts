import { describe, expect, it } from "vitest";
import { clampOffset, dragLimits, readOffset, writeOffset } from "./dragOffset";

/** An in-memory stand-in for localStorage. */
function memoryStorage(initial: Record<string, string> = {}) {
  const data = { ...initial };
  return { getItem: (key: string) => data[key] ?? null, setItem: (key: string, value: string) => void (data[key] = value), data };
}

describe("dragOffset", () => {
  const viewport = { width: 1440, height: 800, top: 32 };

  it("keeps a 52px chat icon in the bottom-right corner fully on screen, below the admin bar", () => {
    const rect = { left: 1368, top: 728, right: 1420, bottom: 780 };
    const limits = dragLimits(rect, { dx: 0, dy: 0 }, viewport);
    expect(limits).toEqual({ minDx: -1360, maxDx: 12, minDy: -688, maxDy: 12 });
    expect(clampOffset({ dx: -5000, dy: -5000 }, limits)).toEqual({ dx: -1360, dy: -688 });
    expect(clampOffset({ dx: 300, dy: 300 }, limits)).toEqual({ dx: 12, dy: 12 });
  });

  it("measures from where the element is now, including its current offset", () => {
    const moved = { left: 768, top: 428, right: 820, bottom: 480 };
    expect(dragLimits(moved, { dx: -600, dy: -300 }, viewport)).toEqual({ minDx: -1360, maxDx: 12, minDy: -688, maxDy: 12 });
  });

  it("remembers the spot, and ignores broken or missing values", () => {
    const storage = memoryStorage();
    writeOffset(storage, "k", { dx: -120.4, dy: -36.6 });
    expect(readOffset(storage, "k")).toEqual({ dx: -120, dy: -37 });
    expect(readOffset(memoryStorage({ k: "{not json" }), "k")).toEqual({ dx: 0, dy: 0 });
    expect(readOffset(memoryStorage({ k: '{"dx":"a","dy":2}' }), "k")).toEqual({ dx: 0, dy: 0 });
    expect(readOffset(undefined, "k")).toEqual({ dx: 0, dy: 0 });
  });
});
