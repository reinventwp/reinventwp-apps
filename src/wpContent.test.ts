import { describe, expect, it } from "vitest";
import wpContent from "./wpContent";

/** A stand-in for a direct child of #wpbody-content (the hub has no DOM test environment). */
function child({ id = "", className = "", tagName = "DIV", holdsRoot = false, freemius = false } = {}): Element {
  return {
    id,
    tagName,
    classList: { contains: (name: string) => className.split(" ").includes(name) },
    contains: () => holdsRoot,
    matches: () => freemius,
  } as unknown as Element;
}

describe("wpContent.keepsChild", () => {
  const root = child({ id: "reinventwp-apps-root" });

  it("keeps the hub, Screen Options, Freemius, layout helpers, styles and scripts", () => {
    expect(wpContent.keepsChild(root, root)).toBe(true);
    expect(wpContent.keepsChild(child({ holdsRoot: true }), root)).toBe(true);
    expect(wpContent.keepsChild(child({ id: "screen-meta" }), root)).toBe(true);
    expect(wpContent.keepsChild(child({ className: "fs-notice", freemius: true }), root)).toBe(true);
    expect(wpContent.keepsChild(child({ className: "clear" }), root)).toBe(true);
    expect(wpContent.keepsChild(child({ tagName: "STYLE" }), root)).toBe(true);
    expect(wpContent.keepsChild(child({ tagName: "SCRIPT" }), root)).toBe(true);
  });

  it("drops WordPress' and other plugins' notices", () => {
    expect(wpContent.keepsChild(child({ className: "update-nag notice" }), root)).toBe(false);
    expect(wpContent.keepsChild(child({ className: "notice notice-info is-dismissible" }), root)).toBe(false);
  });
});
