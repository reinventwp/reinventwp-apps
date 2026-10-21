import { describe, expect, it } from "vitest";
import { nextStep, type TypewriterState } from "./useTypewriter";

describe("bot typewriter", () => {
  const phrases = ["Hi", "Yo"];
  const run = (steps: number) => {
    let state: TypewriterState = { index: 0, length: 0, erasing: false };
    const seen: string[] = [];
    for (let i = 0; i < steps; i += 1) {
      state = nextStep(state, phrases).state;
      seen.push(`${phrases[state.index].slice(0, state.length)}${state.erasing ? "<" : ""}`);
    }
    return seen;
  };

  it("types, holds, erases, then types the next phrase and loops", () => {
    expect(run(10)).toEqual(["H", "Hi", "Hi<", "H<", "<", "", "Y", "Yo", "Yo<", "Y<"]);
  });

  it("holds the full phrase longer than it takes to type a letter", () => {
    expect(nextStep({ index: 0, length: 2, erasing: false }, phrases).wait).toBeGreaterThan(nextStep({ index: 0, length: 0, erasing: false }, phrases).wait * 10);
  });
});
