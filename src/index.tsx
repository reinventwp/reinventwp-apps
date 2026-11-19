import { createRoot } from "react-dom/client";
import App from "./App";
import type { HubData } from "./types";
import wpContent from "./wpContent";

declare global {
  interface Window {
    reinventwpApps?: HubData;
  }
}

const root = document.getElementById("reinventwp-apps-root");
if (root && window.reinventwpApps) {
  // Notices printed above the page ("WordPress 7.1.5 is available", other plugins' promos) go, like in the plugins' own admin apps.
  wpContent.clearNotices(root);
  createRoot(root).render(<App data={window.reinventwpApps} />);
}
