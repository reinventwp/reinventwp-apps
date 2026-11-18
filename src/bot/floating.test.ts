import { describe, expect, it } from "vitest";
import {
  clampGeometry,
  defaultGeometry,
  dragGeometry,
  GEOMETRY_KEY,
  MIN_HEIGHT,
  MIN_WIDTH,
  readGeometry,
  resizeGeometry,
  writeGeometry,
  type Geometry,
} from "./floating";

const bounds = { width: 1280, height: 800, top: 32 };
const start: Geometry = { x: 800, y: 100, width: 400, height: 500 };

describe("defaultGeometry", () => {
  it("docks on the right, inset, below the admin bar", () => {
    expect(defaultGeometry(bounds)).toEqual({ x: 1280 - 400 - 12, y: 44, width: 400, height: 800 - 32 - 24 });
  });
});

describe("clampGeometry", () => {
  it("keeps the panel inside the window and below the admin bar", () => {
    expect(clampGeometry({ x: -50, y: 0, width: 400, height: 500 }, bounds)).toEqual({ x: 0, y: 32, width: 400, height: 500 });
    expect(clampGeometry({ x: 1200, y: 700, width: 400, height: 500 }, bounds)).toEqual({ x: 880, y: 300, width: 400, height: 500 });
  });

  it("keeps the minimum size", () => {
    expect(clampGeometry({ x: 0, y: 40, width: 100, height: 100 }, bounds)).toMatchObject({ width: MIN_WIDTH, height: MIN_HEIGHT });
  });
});

describe("dragGeometry", () => {
  it("moves by the pointer offset and stops at the edges", () => {
    expect(dragGeometry(start, -100, 50, bounds)).toEqual({ ...start, x: 700, y: 150 });
    expect(dragGeometry(start, 500, 500, bounds)).toEqual({ ...start, x: 880, y: 300 });
  });
});

describe("resizeGeometry", () => {
  it("grows from the right and bottom edges", () => {
    expect(resizeGeometry(start, "se", 50, 60, bounds)).toEqual({ ...start, width: 450, height: 560 });
  });

  it("keeps the right edge when resizing from the left", () => {
    const next = resizeGeometry(start, "w", -100, 0, bounds);
    expect(next.x + next.width).toBe(start.x + start.width);
    expect(next.width).toBe(500);
  });

  it("keeps the bottom edge when resizing from the top, and stops at the admin bar", () => {
    const next = resizeGeometry(start, "n", 0, -500, bounds);
    expect(next.y).toBe(32);
    expect(next.y + next.height).toBe(start.y + start.height);
  });

  it("never goes below the minimum size", () => {
    expect(resizeGeometry(start, "nw", 400, 400, bounds)).toMatchObject({ width: MIN_WIDTH, height: MIN_HEIGHT });
  });

  it("stops at the window edge", () => {
    expect(resizeGeometry(start, "e", 1000, 0, bounds).width).toBe(1280 - 800);
  });
});

describe("saved geometry", () => {
  const memory = () => {
    const data = new Map<string, string>();
    return { data, getItem: (key: string) => data.get(key) ?? null, setItem: (key: string, value: string) => void data.set(key, value) };
  };

  it("round-trips and rejects broken values", () => {
    const storage = memory();
    writeGeometry(storage, start);
    expect(readGeometry(storage)).toEqual(start);
    storage.data.set(GEOMETRY_KEY, '{"x":"a"}');
    expect(readGeometry(storage)).toBeNull();
    storage.data.set(GEOMETRY_KEY, "not json");
    expect(readGeometry(storage)).toBeNull();
    expect(readGeometry(undefined)).toBeNull();
  });
});
