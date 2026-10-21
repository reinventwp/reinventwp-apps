import { useEffect, useState } from "react";

/** Whether the page lets the bot show: a page can switch it off with <body data-reinventwp-bot="off">. */
const allowed = () => document.body.dataset.reinventwpBot !== "off";

/**
 * Follows the page's on/off switch. reinventwp.com navigates without reloading, so the bot stays
 * mounted and the site turns it off on private pages instead.
 */
export default function usePageAllows(): boolean {
  const [on, setOn] = useState(allowed);

  useEffect(() => {
    const observer = new MutationObserver(() => setOn(allowed()));
    observer.observe(document.body, { attributes: true, attributeFilter: ["data-reinventwp-bot"] });
    return () => observer.disconnect();
  }, []);

  return on;
}
