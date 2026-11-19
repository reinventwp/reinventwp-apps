import { describe, expect, it } from "vitest";
import { suitePassHint, suitePassStatus } from "./suitePass";

describe("Suite Pass badge", () => {
  it("says active, until when, or expired", () => {
    expect(suitePassStatus({ expires_at: null, expired: false, sites: 1 })).toBe("Active · no end date");
    expect(suitePassStatus({ expires_at: "2026-12-12T00:00:00+00:00", expired: false, sites: 1 })).toBe("Active until 12 Dec 2026");
    expect(suitePassStatus({ expires_at: "2026-10-01T00:00:00+00:00", expired: true, sites: 1 })).toBe("Expired 1 Oct 2026");
  });

  it("explains it, with the number of sites", () => {
    expect(suitePassHint({ expires_at: null, expired: false, sites: 1 })).toBe("PRO is on in every Reinvent WP plugin on this site. Covers 1 site.");
    expect(suitePassHint({ expires_at: null, expired: false, sites: 3 })).toBe("PRO is on in every Reinvent WP plugin on this site. Covers 3 sites.");
    expect(suitePassHint({ expires_at: null, expired: false, sites: null })).toBe("PRO is on in every Reinvent WP plugin on this site.");
    expect(suitePassHint({ expires_at: "2026-10-01T00:00:00+00:00", expired: true, sites: 1 })).toContain("Renew");
  });
});
