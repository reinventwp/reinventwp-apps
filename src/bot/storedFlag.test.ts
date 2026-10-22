import { describe, expect, it } from "vitest";
import { MINIMIZED_KEY, OPEN_KEY, readFlag, writeFlag } from "./storedFlag";

const memoryStorage = () => {
  const data = new Map<string, string>();
  return {
    data,
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => void data.set(key, value),
    removeItem: (key: string) => void data.delete(key),
  };
};

const blockedStorage = {
  getItem: () => {
    throw new Error("blocked");
  },
  setItem: () => {
    throw new Error("blocked");
  },
  removeItem: () => {
    throw new Error("blocked");
  },
};

describe("bot stored flags", () => {
  it("starts off: the full field, panel closed", () => {
    expect(readFlag(memoryStorage(), MINIMIZED_KEY)).toBe(false);
    expect(readFlag(memoryStorage(), OPEN_KEY)).toBe(false);
    expect(readFlag(undefined, OPEN_KEY)).toBe(false);
  });

  it("remembers a flag and forgets it when turned off", () => {
    const storage = memoryStorage();
    writeFlag(storage, OPEN_KEY, true);
    expect(storage.data.get(OPEN_KEY)).toBe("1");
    expect(readFlag(storage, OPEN_KEY)).toBe(true);

    writeFlag(storage, OPEN_KEY, false);
    expect(storage.data.has(OPEN_KEY)).toBe(false);
    expect(readFlag(storage, OPEN_KEY)).toBe(false);
  });

  it("keeps the two flags apart", () => {
    const storage = memoryStorage();
    writeFlag(storage, MINIMIZED_KEY, true);
    expect(readFlag(storage, OPEN_KEY)).toBe(false);
  });

  it("keeps working when storage is blocked", () => {
    expect(readFlag(blockedStorage, MINIMIZED_KEY)).toBe(false);
    expect(() => writeFlag(blockedStorage, OPEN_KEY, true)).not.toThrow();
  });
});
