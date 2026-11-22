import { beforeAll, describe, expect, it, vi } from "vitest";
import { embedStore, installEmbedApi } from "./embed";

beforeAll(() => {
  // A bare window: the API is published on it and announces itself with an event.
  vi.stubGlobal("window", Object.assign(new EventTarget(), {}));
  installEmbedApi();
});

describe("embed API for host pages", () => {
  it("hands a conversation loaded before the chat subscribed to it, and a read-only host only while mounted", () => {
    const api = window.reinventwpBotApi!;
    const host = {} as HTMLElement;
    const unmount = api.mount(host, { readOnly: true });
    expect(embedStore.readOnly()).toBe(true);
    // bot.js published the API, but the chat hasn't subscribed yet.
    api.load([{ role: "user", content: "hi" }]);
    const seen: unknown[][] = [];
    const stop = embedStore.onLoad((messages) => seen.push(messages));
    expect(seen).toEqual([[{ role: "user", content: "hi" }]]);
    api.load([{ role: "user", content: "next" }]);
    expect(seen).toHaveLength(2);
    stop();
    unmount();
    expect(embedStore.readOnly()).toBe(false);
    // After the host leaves, a new subscriber gets nothing old.
    const late: unknown[][] = [];
    embedStore.onLoad((messages) => late.push(messages))();
    expect(late).toEqual([]);
  });
});
