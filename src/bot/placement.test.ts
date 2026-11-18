import { describe, expect, it } from "vitest";
import { PANEL_MODE_KEY, PLACEMENT_KEY, readPanelMode, readPlacement, writePanelMode, writePlacement } from "./placement";
import { MINIMIZED_KEY } from "./storedFlag";

const memoryStorage = (initial: Record<string, string> = {}) => {
  const data = new Map<string, string>(Object.entries(initial));
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

describe("readPlacement", () => {
  it("defaults to the bar", () => {
    expect(readPlacement(memoryStorage())).toBe("bar");
    expect(readPlacement(undefined)).toBe("bar");
  });

  it("reads a saved placement", () => {
    expect(readPlacement(memoryStorage({ [PLACEMENT_KEY]: "left" }))).toBe("left");
  });

  it("treats the old minimized flag as the right button", () => {
    expect(readPlacement(memoryStorage({ [MINIMIZED_KEY]: "1" }))).toBe("right");
  });

  it("prefers the saved placement over the old flag", () => {
    expect(readPlacement(memoryStorage({ [PLACEMENT_KEY]: "bar", [MINIMIZED_KEY]: "1" }))).toBe("bar");
  });

  it("ignores unknown values and blocked storage", () => {
    expect(readPlacement(memoryStorage({ [PLACEMENT_KEY]: "top" }))).toBe("bar");
    expect(readPlacement(blockedStorage)).toBe("bar");
  });
});

describe("writePlacement", () => {
  it("saves the placement and drops the old flag", () => {
    const storage = memoryStorage({ [MINIMIZED_KEY]: "1" });
    writePlacement(storage, "left");
    expect(storage.data.get(PLACEMENT_KEY)).toBe("left");
    expect(storage.data.has(MINIMIZED_KEY)).toBe(false);
  });

  it("does not throw when storage is blocked", () => {
    expect(() => writePlacement(blockedStorage, "right")).not.toThrow();
  });
});

describe("panel mode", () => {
  it("defaults to beside the page", () => {
    expect(readPanelMode(memoryStorage())).toBe("beside");
    expect(readPanelMode(memoryStorage({ [PANEL_MODE_KEY]: "sideways" }))).toBe("beside");
    expect(readPanelMode(blockedStorage)).toBe("beside");
  });

  it("saves and reads over the page", () => {
    const storage = memoryStorage();
    writePanelMode(storage, "over");
    expect(readPanelMode(storage)).toBe("over");
    expect(() => writePanelMode(blockedStorage, "over")).not.toThrow();
  });
});
