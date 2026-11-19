/**
 * The admin page around the hub, like the plugins' own admin apps (Text to Speech's index.tsx): WordPress and other
 * plugins print notices ("WordPress 7.1.5 is available", promos) into #wpbody-content above the page. The hub keeps
 * only its own root, the Screen Options panel, Freemius' admin UI, and styles and scripts.
 */

/** Freemius' admin UI (opt-in, licence and account screens), copied from Text to Speech's freemiusAdmin.ts. */
const FREEMIUS_ELEMENT_SELECTOR = '[id*="fs_"], [class*="fs_"], [class*="fs-"]';

/** Whether a direct child of #wpbody-content stays: the hub itself, Screen Options, Freemius, layout helpers. */
function keepsChild(child: Element, root: Element): boolean {
  return (
    child === root ||
    child.contains(root) ||
    child.id === "screen-meta" ||
    child.matches(FREEMIUS_ELEMENT_SELECTOR) ||
    child.classList.contains("clear") ||
    child.tagName === "STYLE" ||
    child.tagName === "SCRIPT"
  );
}

/**
 * Removes the notices other code printed into #wpbody-content, keeping the hub's root and what the page needs.
 *
 * @example
 * wpContent.clearNotices(document.getElementById("reinventwp-apps-root"));
 */
function clearNotices(root: Element | null): void {
  const content = document.getElementById("wpbody-content");
  if (!content || !root) return;

  Array.from(content.children).forEach((child) => {
    if (!keepsChild(child, root)) child.remove();
  });
}

const wpContent = {
  clearNotices,
  keepsChild,
};

export default wpContent;
