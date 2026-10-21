import strings from "../strings";

/** Characters of a text file sent to the assistant: its newest lines, about 8,000 tokens. */
export const MAX_TEXT = 30_000;
/** Bytes read from the end of a file; a 100 MB log never has to fit in memory. */
const READ_BYTES = 256 * 1024;
export const TEXT_EXTENSIONS = [".log", ".txt", ".json", ".csv", ".md"];

/** A text file ready to send: its last part, with private data masked. */
export interface PreparedFile {
  name: string;
  /** What is sent: the newest lines, masked. */
  text: string;
  /** Whether older lines were left out. */
  trimmed: boolean;
  /** Lines in `text`. */
  lines: number;
  /** Values replaced by [hidden]. */
  masked: number;
  /** The file's full size in bytes. */
  size: number;
}

/** Whether the file is a text file the assistant takes (by extension, since logs often have no type). */
export function isTextFile(file: { name: string; type: string }): boolean {
  const name = file.name.toLowerCase();
  return TEXT_EXTENSIONS.some((extension) => name.endsWith(extension)) || file.type === "text/plain" || file.type === "application/json";
}

/**
 * Private data that shouldn't leave the site, replaced by [hidden]: secrets after a key name
 * (password=…, "api_key": "…", Authorization: Bearer …, wp-config.php define( 'DB_PASSWORD', … )), API keys (sk-…), long hex or base64
 * strings, email addresses and IP addresses. The key name stays so the log still makes sense.
 */
const MASKS: Array<[RegExp, string]> = [
  // wp-config.php: define( 'DB_PASSWORD', '…' ), AUTH_KEY, SECURE_AUTH_SALT, …
  [/((?:PASSWORD|_KEY|_SALT|SECRET|TOKEN)['"]\s*,\s*['"])[^'"]*/gi, "$1[hidden]"],
  [/((?:pass(?:word|wd)?|pwd|secret|token|api[_-]?key|access[_-]?key|private[_-]?key|auth(?:orization)?|cookie|nonce|salt)["']?\s*[:=]\s*["']?)(?:Bearer\s+)?[^\s"',;&()]+/gi, "$1[hidden]"],
  [/\bBearer\s+[A-Za-z0-9._~+/=-]{8,}/g, "Bearer [hidden]"],
  [/\b(?:sk|pk|rk|key|tok)[-_][A-Za-z0-9_-]{16,}\b/g, "[hidden]"],
  [/\b[A-Fa-f0-9]{32,}\b/g, "[hidden]"],
  [/\b[A-Za-z0-9+/]{40,}={0,2}(?![A-Za-z0-9+/=])/g, "[hidden]"],
  [/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g, "[hidden]"],
  [/\b(?:\d{1,3}\.){3}\d{1,3}\b/g, "[hidden]"],
  [/\b(?:[A-Fa-f0-9]{1,4}:){4,7}[A-Fa-f0-9]{1,4}\b/g, "[hidden]"],
];

/** Masks private data; returns the text and how many values were hidden. */
export function maskPrivate(text: string): { text: string; masked: number } {
  let masked = 0;
  const result = MASKS.reduce(
    (current, [pattern, replacement]) =>
      current.replace(pattern, (...args) => {
        masked += 1;
        return replacement.replace("$1", typeof args[1] === "string" ? args[1] : "");
      }),
    text,
  );
  return { text: result, masked };
}

/** The newest lines of `text` that fit in MAX_TEXT, cut at a line start. */
export function keepTail(text: string): { text: string; trimmed: boolean } {
  if (text.length <= MAX_TEXT) return { text, trimmed: false };
  const tail = text.slice(-MAX_TEXT);
  const lineStart = tail.indexOf("\n");
  return { text: lineStart > -1 && lineStart < tail.length - 1 ? tail.slice(lineStart + 1) : tail, trimmed: true };
}

/** What a prepared file sends, in a few words: "newest 412 lines · 3 private values hidden". */
export function fileSummary(file: PreparedFile): string {
  const lines = (file.trimmed ? strings.ask_file_newest : strings.ask_file_lines).replace("%d", String(file.lines));
  return file.masked ? `${lines} · ${strings.ask_file_masked.replace("%d", String(file.masked))}` : lines;
}

/** Reads a text file in the browser: only its end, the newest lines kept, private data masked. */
export async function prepareTextFile(file: File): Promise<PreparedFile> {
  if (!isTextFile(file)) throw new Error("not a text file");
  const startsLate = file.size > READ_BYTES;
  const raw = await file.slice(startsLate ? file.size - READ_BYTES : 0).text();
  const tail = keepTail(raw.replace(/\r\n?/g, "\n").replace(/\u0000/g, ""));
  const { text, masked } = maskPrivate(tail.text);
  return { name: file.name.slice(0, 100), text, trimmed: tail.trimmed || startsLate, lines: text.split("\n").length, masked, size: file.size };
}
