import strings from "./strings";
import type { SuitePass } from "./types";

/** A date like "12 Dec 2026" (the page is English only). */
const day = (iso: string) => new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

/**
 * The badge's status after "Suite Pass": active with its end date or none, or expired.
 *
 * @example
 * suitePassStatus({ expires_at: null, expired: false, sites: 1 }); // "Active · no end date"
 * suitePassStatus({ expires_at: "2026-12-12T00:00:00+00:00", expired: false, sites: 1 }); // "Active until 12 Dec 2026"
 */
export function suitePassStatus(pass: SuitePass): string {
  if (pass.expired && pass.expires_at) return strings.suite_pass_expired.replace("%s", day(pass.expires_at));
  if (!pass.expires_at) return strings.suite_pass_lifetime;
  return strings.suite_pass_until.replace("%s", day(pass.expires_at));
}

/** The badge's tooltip: what it means and how many sites it covers. */
export function suitePassHint(pass: SuitePass): string {
  if (pass.expired) return strings.suite_pass_hint_expired;
  const sites = pass.sites && pass.sites > 0 ? strings.suite_pass_sites.replace("%d", String(pass.sites)).replace("%s", pass.sites === 1 ? "" : "s") : "";
  return [strings.suite_pass_hint, sites].filter(Boolean).join(" ");
}
