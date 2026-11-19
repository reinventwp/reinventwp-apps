/**
 * Replying to part of an answer, like Claude's app: select text in an answer, press Reply, and the quote goes above
 * the message box. It's sent inside the question as a Markdown quote line on top, so Services needs no change; the
 * question limit there is 500 characters, so the quote is kept short and the box allows what's left.
 */

/** Longest quote, in characters (with the closing "…"). */
export const QUOTE_MAX = 160;

/** Characters a question may have in all (Services' LIMITS.question). */
export const QUESTION_MAX = 500;

/**
 * The selected text as a one-line quote: spaces and line breaks collapsed, cut at QUOTE_MAX.
 *
 * @example
 * quoteText("  Old revisions:\n 31 rows  "); // "Old revisions: 31 rows"
 */
export function quoteText(selected: string): string {
  const flat = selected.replace(/\s+/g, " ").trim();
  return flat.length > QUOTE_MAX ? `${flat.slice(0, QUOTE_MAX - 1).trimEnd()}…` : flat;
}

/** The question as sent: the quote as a Markdown quote line, a blank line, then what the admin typed. */
export function withQuote(quote: string, text: string): string {
  return quote ? `> ${quote}\n\n${text}` : text;
}

/** How long the typed text may be next to a quote. */
export function roomFor(quote: string): number {
  return QUESTION_MAX - (quote ? withQuote(quote, "").length : 0);
}

/**
 * A sent question split back into its quote and text, for the chat bubble.
 *
 * @example
 * splitQuote("> 31 rows\n\nwhat are these?"); // { quote: "31 rows", text: "what are these?" }
 */
export function splitQuote(content: string): { quote: string; text: string } {
  const match = /^> ([^\n]*)\n\n([\s\S]*)$/.exec(content);
  return match ? { quote: match[1], text: match[2] } : { quote: "", text: content };
}
