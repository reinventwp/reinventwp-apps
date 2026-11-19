# Agent Instructions: Reinvent WP Apps hub

The **Reinvent WP → Dashboard** page and the assistant (`bot.js`), shared by every WordPress.org-approved Reinvent WP
plugin. Read [README.md](./README.md) first: how the hub fits, the files, live reload and installing it into a plugin.

## Versioning

`HUB_VERSION` in `php/class-hub.php` and `version` in `package.json` always match. Every published plugin carries
its own copy of the hub, and on a site with several Reinvent WP plugins **the copy with the highest `HUB_VERSION`
serves the page**. So:

- Bump the version on every change to the page, `bot.js` or the hub class, or older copies keep winning.
- Same version must mean same code: when two copies share a version, whichever plugin WordPress loads first serves it.
- Semver, `MAJOR.MINOR.PATCH`:
  - **Patch** (2.3.0 → 2.3.1): a fix or a small change of behaviour, no new feature. Example: clearing other code's
    notices above the page, like the plugins' own admin pages do.
  - **Minor** (2.3.x → 2.4.0): a new feature or section that still works next to older copies.
  - **Major** (2.x → 3.0.0): a change that older copies or the plugins can't live with, for example a different
    page data shape (`window.reinventwpApps`, `window.reinventwpBot`) or a renamed hook or option.
- A hub change doesn't bump the plugins' own versions; the plugins bump theirs when they release.

## After a change

```bash
npm test && npm run type
npm run build
```

`npm run build` builds, copies `bot.js` to `reinventwp-next/public/bot/bot.js` and copies the hub into every plugin
the Company Dashboard marks as published (`scripts/sync-published.sh`). Then commit:

- this repo (the source);
- the `wordpress` repo (each plugin's hub class and `public/hub/` files, where tracked);
- `reinventwp-next` (`public/bot/bot.js`).

## Rules

- **Copy, don't share.** Code taken from a plugin's admin app (for example `src/wpContent.ts`, from Text to Speech's
  notice clean-up and `freemiusAdmin.ts`) is copied here, never imported across plugins or moved to a shared package.
- **The page owns `#wpbody-content`.** `src/wpContent.ts` removes the notices WordPress and other plugins print above
  the page and keeps only the hub root, Screen Options, Freemius' screens, `.clear`, styles and scripts. Keep that
  list in step with the plugins' admin apps.
- **English only.** Page text lives in `src/strings.ts`; no PHP `__()` strings for the page.
- **Never market to paying users.** The Suite Pass card shows only when no plugin reports a paid licence
  (`reinventwp_hub_has_paid_license`).
- **Approved plugins only.** Unapproved plugins keep the old PHP hub (1.0.x); install this one only after a plugin is
  approved on WordPress.org.
