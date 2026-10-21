// The class name prefix must be set before any MUI component loads, so it's the first import:
// the bot's MUI classes (rwpbot-MuiButton-root) never collide with the page's own MUI.
import "./classNames";
import createCache from "@emotion/cache";
import { CacheProvider } from "@emotion/react";
import { createRoot } from "react-dom/client";
import Bot from "./Bot";
import type { BotConfig } from "./types";

declare global {
  interface Window {
    reinventwpBot?: BotConfig;
  }
}

const config = window.reinventwpBot;
if (config && !document.getElementById("reinventwp-bot")) {
  const root = document.createElement("div");
  root.id = "reinventwp-bot";
  document.body.appendChild(root);
  // Its own style cache too, so the page's styles and the bot's never overwrite each other.
  const cache = createCache({ key: "rwpbot" });
  createRoot(root).render(
    <CacheProvider value={cache}>
      <Bot config={config} />
    </CacheProvider>,
  );
}
