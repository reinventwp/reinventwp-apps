import { describe, expect, it } from "vitest";
import { QUESTION_MAX, QUOTE_MAX, quoteText, roomFor, splitQuote, withQuote } from "./quote";

describe("quote", () => {
  it("makes a short one-line quote", () => {
    expect(quoteText("  Old revisions:\n 31 rows  ")).toBe("Old revisions: 31 rows");
    const long = quoteText("word ".repeat(100));
    expect(long.length).toBeLessThanOrEqual(QUOTE_MAX);
    expect(long.endsWith("…")).toBe(true);
  });

  it("sends the quote on top and reads it back", () => {
    const sent = withQuote("31 rows", "what are these?");
    expect(sent).toBe("> 31 rows\n\nwhat are these?");
    expect(splitQuote(sent)).toEqual({ quote: "31 rows", text: "what are these?" });
    expect(splitQuote("plain question")).toEqual({ quote: "", text: "plain question" });
    expect(withQuote("", "plain")).toBe("plain");
  });

  it("keeps the whole question inside the limit", () => {
    const quote = quoteText("x".repeat(400));
    expect(withQuote(quote, "y".repeat(roomFor(quote))).length).toBe(QUESTION_MAX);
    expect(roomFor("")).toBe(QUESTION_MAX);
  });
});
