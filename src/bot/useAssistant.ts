import { useCallback, useEffect, useState } from "react";
import type { HubApp } from "../types";
import { imageSrc, type PreparedImage } from "./images";
import { fileSummary, type PreparedFile } from "./textFile";
import type { BotConfig } from "./types";

/** A settings screen of a suggested app; its card links straight to it. */
export interface AssistantSetting {
  id: string;
  name: string;
  /** "Podcast & Export Audio › Podcast RSS" */
  location: string;
  /** The app's settings page `path` parameter. */
  path: string;
}

export interface AssistantSuggestion {
  slug: string;
  title: string;
  reason: string;
  setting?: AssistantSetting;
}

/** A reinventwp.com section the answer is based on; Services builds the title and link. */
export interface AssistantSource {
  id: string;
  title: string;
  url: string;
}

/** One website search behind an answer: the user's question first, then the assistant's own keywords. */
export interface AssistantSearch {
  /** reinventwp.com (pages and readmes), or an installed app's settings screens. */
  where: "website" | "settings";
  plugin?: string;
  by: "question" | "assistant";
  query: string;
  /** Sections this search found first (ids into `AssistantResearch.sections`). */
  sections: string[];
  /** Sections it returned in total, including ones already read. */
  found: number;
}

/** What the assistant searched and read before answering. */
export interface AssistantResearch {
  searches: AssistantSearch[];
  /** A setting has no url; its link is built from the app's settings page and `path`. */
  sections: Array<{ id: string; page: string; heading: string; url: string; plugin?: string; path?: string }>;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  /** When it was sent (ms); chats from before times were kept have none. */
  at?: number;
  /** Small previews of the screenshots the user attached (kept in sessionStorage). */
  images?: string[];
  /** The shrunk screenshots, for viewing full size; in memory only, so not after a reload. */
  full?: string[];
  /** A text file the user attached: its name and what was sent ("newest 400 lines · 3 private values hidden"). */
  file?: { name: string; summary: string };
  /** The text that was sent, in memory only. */
  fileText?: string;
  /** The answer asks for the feedback form under it; `feedbackSent` once it was sent. */
  form?: "feedback";
  feedbackSent?: boolean;
  suggestions?: AssistantSuggestion[];
  sources?: AssistantSource[];
  research?: AssistantResearch;
  /** An error shown in the chat; never sent back as history. */
  failed?: boolean;
}

const STORAGE_KEY = "reinventwp_apps_assistant";
/** Turns sent with each question (the service keeps at most 6). */
const HISTORY_TURNS = 6;

function load(): ChatMessage[] {
  try {
    const saved = JSON.parse(sessionStorage.getItem(STORAGE_KEY) || "[]");
    return Array.isArray(saved) ? saved : [];
  } catch {
    return [];
  }
}

/**
 * The assistant conversation. It lives only in this tab (sessionStorage); each question
 * sends the last few turns, where it was asked (surface and page) and, in WordPress, this
 * site's Reinvent WP apps (slug, state, version) to Reinvent WP Services, which stores nothing.
 */
export default function useAssistant(config: BotConfig, errorText: string, apps: HubApp[]) {
  const { url, surface, page } = config;
  const [messages, setMessages] = useState<ChatMessage[]>(load);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    try {
      // Full-size screenshots stay in memory; storage keeps the small previews only.
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(messages.map(({ full: _full, fileText: _fileText, ...message }) => message)));
    } catch {
      // Private mode or full storage: the chat still works for this page view.
    }
  }, [messages]);

  const send = useCallback(
    async (text: string, images: PreparedImage[] = [], file: PreparedFile | null = null) => {
      const question = text.trim();
      if ((!question && !images.length && !file) || loading) return;
      // Earlier screenshots and files aren't sent again; the history only says one was there.
      const history = messages
        .filter((message) => !message.failed)
        .slice(-HISTORY_TURNS)
        .map(({ role, content, images: attached, file: sent }) => ({
          role,
          content: [content, attached?.length ? "(image)" : "", sent ? `(file: ${sent.name})` : ""].filter(Boolean).join(" "),
        }));
      setMessages((current) => [
        ...current,
        {
          role: "user",
          content: question,
          at: Date.now(),
          ...(images.length && { images: images.map((image) => image.preview), full: images.map(imageSrc) }),
          ...(file && { file: { name: file.name, summary: fileSummary(file) }, fileText: file.text }),
        },
      ]);
      setLoading(true);
      try {
        const response = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            question,
            history,
            ...(images.length && { images: images.map(({ media_type, data }) => ({ media_type, data })) }),
            ...(file && { files: [{ name: file.name, text: file.text }] }),
            surface,
            // reinventwp.com navigates without reloading, so read the page the question is asked on.
            page: surface === "website" ? window.location.pathname : page,
            ...(surface === "wp-admin" && { site: { apps: apps.map(({ slug, state, version }) => ({ slug, state, version })) } }),
          }),
        });
        const body = await response.json().catch(() => null);
        if (!response.ok || !body?.data) throw new Error(body?.message || errorText);
        setMessages((current) => [...current, { role: "assistant", content: body.data.answer, at: Date.now(), form: body.data.form === "feedback" ? "feedback" : undefined, suggestions: body.data.suggestions, sources: body.data.sources, research: body.data.research }]);
      } catch (error) {
        const content = error instanceof Error && error.message ? error.message : errorText;
        setMessages((current) => [...current, { role: "assistant", content, at: Date.now(), failed: true }]);
      } finally {
        setLoading(false);
      }
    },
    [apps, errorText, loading, messages, page, surface, url],
  );

  const reset = useCallback(() => setMessages([]), []);

  /** Marks a message's feedback form as sent, so it shows "sent" even after a reload. */
  const markFeedbackSent = useCallback((index: number) => {
    setMessages((current) => current.map((message, at) => (at === index ? { ...message, feedbackSent: true } : message)));
  }, []);

  return { messages, loading, send, reset, markFeedbackSent };
}
