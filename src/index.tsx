import { createRoot } from "react-dom/client";
import App from "./App";
import type { HubData } from "./types";

declare global {
  interface Window {
    reinventwpApps?: HubData;
  }
}

const root = document.getElementById("reinventwp-apps-root");
if (root && window.reinventwpApps) {
  createRoot(root).render(<App data={window.reinventwpApps} />);
}
