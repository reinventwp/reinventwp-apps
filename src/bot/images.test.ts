import { describe, expect, it } from "vitest";
import { fitWithin, MAX_EDGE } from "./images";

describe("bot image size", () => {
  it("shrinks the long edge to the limit and keeps the shape", () => {
    expect(fitWithin(3840, 2160, MAX_EDGE)).toEqual({ width: 1280, height: 720 });
    expect(fitWithin(1170, 2532, MAX_EDGE)).toEqual({ width: 591, height: 1280 });
  });

  it("never enlarges a small image", () => {
    expect(fitWithin(800, 600, MAX_EDGE)).toEqual({ width: 800, height: 600 });
  });
});
