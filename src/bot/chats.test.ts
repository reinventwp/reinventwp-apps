import { describe, expect, it } from "vitest";
import { chatRoute, chatsConfig } from "./chats";

describe("chatRoute", () => {
  it("adds the id to the path with pretty permalinks", () => {
    expect(chatRoute("http://site.test/wp-json/ai-agent/v1/chats", 12)).toBe("http://site.test/wp-json/ai-agent/v1/chats/12");
  });

  it("adds the id to rest_route with plain permalinks", () => {
    expect(chatRoute("http://site.test/?rest_route=/ai-agent/v1/chats", 12)).toBe("http://site.test/?rest_route=/ai-agent/v1/chats/12");
  });

  it("adds query values with ? or &", () => {
    expect(chatRoute("/wp-json/ai-agent/v1/chats", null, { archived: "1" })).toBe("/wp-json/ai-agent/v1/chats?archived=1");
    expect(chatRoute("/?rest_route=/ai-agent/v1/chats", null, { archived: "1" })).toBe("/?rest_route=/ai-agent/v1/chats&archived=1");
  });
});

describe("chatsConfig", () => {
  it("is null without AI Agent's chats route", () => {
    expect(chatsConfig(undefined)).toBeNull();
    expect(chatsConfig({ tools: "t", run: "r", nonce: "n" })).toBeNull();
    expect(chatsConfig({ tools: "t", run: "r", nonce: "n", chats: "/c" })).toEqual({ chats: "/c", nonce: "n" });
  });
});
