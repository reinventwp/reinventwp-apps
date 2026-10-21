import { describe, expect, it } from "vitest";
import { isTextFile, keepTail, maskPrivate, MAX_TEXT } from "./textFile";

describe("bot text files", () => {
  it("takes logs and text files by extension, not other files", () => {
    expect(isTextFile({ name: "debug.log", type: "" })).toBe(true);
    expect(isTextFile({ name: "settings.JSON", type: "" })).toBe(true);
    expect(isTextFile({ name: "notes", type: "text/plain" })).toBe(true);
    expect(isTextFile({ name: "backup.zip", type: "application/zip" })).toBe(false);
    expect(isTextFile({ name: "invoice.pdf", type: "application/pdf" })).toBe(false);
  });

  it("keeps the newest lines, cut at a line start", () => {
    const lines = Array.from({ length: 5000 }, (_, n) => `[21-Oct-2026 10:00:${n}] PHP Notice: line ${n}`).join("\n");
    const { text, trimmed } = keepTail(lines);
    expect(trimmed).toBe(true);
    expect(text.length).toBeLessThanOrEqual(MAX_TEXT);
    expect(text.startsWith("[21-Oct-2026")).toBe(true);
    expect(text.endsWith("line 4999")).toBe(true);
    expect(keepTail("short log").trimmed).toBe(false);
  });

  it("hides secrets, keys, emails and IP addresses but keeps the log readable", () => {
    const { text, masked } = maskPrivate(
      [
        "define( 'DB_PASSWORD', 'hunter2' ); password=hunter2&user=admin",
        '"api_key": "abc123XYZ", Authorization: Bearer eyJhbGciOiJIUzI1NiJ9.abc.def',
        "OpenAI key sk-proj-AbCdEf0123456789xyz failed for admin@example.com from 203.0.113.7",
        "nonce 3f9a1c2b7d10a41f09c3e2b1a41f09c3e2b1 in /var/www/html/wp-content/plugins/x.php on line 42",
      ].join("\n"),
    );
    expect(text).not.toMatch(/hunter2|abc123XYZ|eyJhbGci|sk-proj|admin@example\.com|203\.0\.113\.7|3f9a1c2b7d10a41f/);
    expect(text).toContain("password=[hidden]");
    expect(text).toContain('"api_key": "[hidden]"');
    expect(text).toContain("/wp-content/plugins/x.php on line 42");
    expect(maskPrivate("Access denied (using password: YES)").text).toBe("Access denied (using password: [hidden])");
    expect(masked).toBeGreaterThanOrEqual(7);
  });
});
