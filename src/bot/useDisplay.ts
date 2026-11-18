import { useState } from "react";

/** Where the assistant shows in wp-admin (AI Agent's setting, components/bot-display.php in AI Agent). */
export type BotDisplay = "everywhere" | "reinventwp";

/** What AI Agent prints as `window.reinventwpBotDisplay` on pages that show the assistant. */
export interface BotDisplayConfig {
  value: BotDisplay;
  /** AI Agent REST `bot-display` (GET / POST { display }). */
  url: string;
  /** wp_rest nonce, sent as X-WP-Nonce. */
  nonce: string;
}

declare global {
  interface Window {
    reinventwpBotDisplay?: BotDisplayConfig;
  }
}

export interface DisplaySetting {
  /** The saved choice; without AI Agent the assistant only shows on Reinvent WP pages. */
  value: BotDisplay;
  /** False without AI Agent: then only "Reinvent WP pages" is possible. */
  available: boolean;
  saving: boolean;
  error: boolean;
  change: (next: BotDisplay) => void;
}

/**
 * The "where it shows" setting. It is saved in WordPress by AI Agent (one choice for the site), so
 * it only works with AI Agent active; it takes effect on the next page that opens.
 */
export default function useDisplay(): DisplaySetting {
  // Read on every render: AI Agent's dev page sets it after bot.js has loaded.
  const config = typeof window === "undefined" ? undefined : window.reinventwpBotDisplay;
  /** The choice made here, until the page reloads (the printed value is the one from page load). */
  const [chosen, setChosen] = useState<BotDisplay | null>(null);
  const value: BotDisplay = !config ? "reinventwp" : (chosen ?? (config.value === "reinventwp" ? "reinventwp" : "everywhere"));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(false);

  const change = (next: BotDisplay) => {
    if (!config || next === value || saving) return;
    const before = chosen;
    setChosen(next);
    setSaving(true);
    setError(false);
    fetch(config.url, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json", "X-WP-Nonce": config.nonce },
      body: JSON.stringify({ display: next }),
    })
      .then((response) => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
      })
      .catch((reason: unknown) => {
        console.error("Reinvent WP Assistant: saving where it shows failed", reason);
        setChosen(before);
        setError(true);
      })
      .finally(() => setSaving(false));
  };

  return { value, available: Boolean(config), saving, error, change };
}
