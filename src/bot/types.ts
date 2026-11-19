import type { HubApp } from "../types";

/**
 * window.reinventwpBot: where bot.js runs and what it knows. Printed by the PHP hub class on the
 * Reinvent WP Apps page and the approved plugins' own pages, and by reinventwp.com.
 */
export interface BotConfig {
  /** A WordPress admin page of the site, or reinventwp.com (a visitor, not a site owner). */
  surface: "wp-admin" | "website";
  /** The page it's on: "apps" (the Apps page), a plugin slug (that plugin's own page), or a website path. */
  page: string;
  /** Reinvent WP Services assistant endpoint. */
  url: string;
  /** The site's Reinvent WP apps (wp-admin). On the website, read from `catalogUrl` instead. */
  apps?: HubApp[];
  /** Public plugin catalog (website). */
  catalogUrl?: string;
  /** Element narrowed to make room for the open panel, e.g. "#wpcontent"; the bar centres over it. */
  shift?: string;
  /**
   * Where the chat's feedback form sends (Services /feedback). In WordPress it also carries the
   * admin's email and the site's hostname to prefill; on reinventwp.com the visitor types them.
   */
  feedback?: { url: string; email?: string; origin?: string };
}

/**
 * window.reinventwpBotAgent: printed by AI Agent next to bot.js on wp-admin pages, so the
 * assistant can run the site's Reinvent WP tools (WordPress abilities) for an admin.
 */
export interface BotAgentConfig {
  /** AI Agent REST `GET bot/tools`. */
  tools: string;
  /** AI Agent REST `POST bot/run`. */
  run: string;
  /** wp_rest nonce, sent as X-WP-Nonce. */
  nonce: string;
  /** AI Agent REST `chats`: where chats are saved (AI Agent 1.0.5+); without it chats aren't saved. */
  chats?: string;
  /**
   * AI Agent REST `POST bot/ask`: the assistant's questions go here instead of straight to Services. AI Agent forwards
   * the body unchanged, signed with the site's Suite Pass, so Services can give PRO limits; the answer has the same
   * shape as Services'. Without it (older AI Agent) the questions go to Services directly.
   */
  ask?: string;
}

/** A site tool from `GET bot/tools`: one WordPress ability. */
export interface AgentTool {
  /** Ability name, e.g. "reinvent-media-cleanup/list-unused". */
  name: string;
  label: string;
  description: string;
  input_schema: Record<string, unknown> | null;
  /** Read-only tools run at once; every other tool waits for the admin's Approve. */
  readonly: boolean;
  destructive: boolean;
}

/**
 * A tool an admin page gives the assistant while the page is open (embed.ts registerPage), for
 * example Text to Speech's "change settings". It runs in the page, through the page's own state and
 * save, so a plugin doesn't need one WordPress ability per setting.
 */
export interface PageTool extends AgentTool {
  run: (input: Record<string, unknown> | null) => unknown;
  /** What the Approve card says will happen ("Auto Embed: post, page → post"); else the label and input. */
  approval?: (input: Record<string, unknown> | null) => string;
}

/** An admin page that works with the assistant: its tools, while it's open. */
export interface BotPage {
  /** The plugin's slug, e.g. "natural-text-to-speech". */
  app: string;
  tools: PageTool[];
}

/** A tool the model wants to run, from Services' `tool_calls`. */
export interface AgentToolCall {
  id: string;
  /** The ability name. */
  name: string;
  input: Record<string, unknown> | null;
}

/** A tool call and how it went, sent back to Services as `agent.steps`. */
export interface AgentStep {
  id: string;
  name: string;
  input: Record<string, unknown> | null;
  result: unknown;
  error?: string;
  declined?: true;
}
