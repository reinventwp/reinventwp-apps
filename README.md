# Reinvent WP Apps page

The **Reinvent WP → Dashboard** page, shared by every WordPress.org-approved Reinvent WP plugin. One source here; each plugin gets its own copy, so plugins stay self-contained.

## How it fits

- Every Reinvent WP plugin ships a hub class (`class-<prefix>-hub.php`) with a `HUB_VERSION`. The highest version on a site registers the menu and the page; the others only add their submenu.
- Unapproved plugins keep the old PHP hub (1.0.x). This one is **2.0.0**, so on any site with an approved plugin the React page wins.
- The app list comes from Reinvent WP Services, `GET /api/reinvent/plugins/catalog` (edited at reinventwp.com `/dashboard/admin/plugins`). PHP reads it at most once a day (transient `reinventwp_hub_catalog_v2`, one hour after a failure), validates every field, and falls back to the built-in list in `php/class-hub.php`. Local sites (`localhost`) read `http://localhost:3005`; filter `reinventwp_hub_catalog_url` overrides it.
- Same stack as the Text to Speech and Media Cleanup admin screens: React 19 + MUI 7 (Emotion), in two standalone bundles: `reinventwp-apps.js` (the app cards, this page only) and `bot.js` (the assistant, `src/bot/`). The page text is English only, in `src/strings.ts`.
- `bot.js` runs on this page, on the own page of every plugin that ships hub 2.x (each registers itself in `$GLOBALS['reinventwp_bot_plugins']`), and on reinventwp.com. It reads `window.reinventwpBot` (`src/bot/types.ts`), uses its own MUI class prefix and emotion cache (`rwpbot`), and `npm run build` copies it to `reinventwp-next/public/bot/bot.js` (commit it there). Spec: `reinventwp-services/docs/SPECS/CHATBOT.md`.
- The page isn't wrapped in `.wrap`: WordPress's `.wrap h1` rules would override MUI's typography. Old PHP hubs still print `.rwp-hub-*` CSS on this page; MUI's generated classes don't collide with it.

## Files

| Path | What |
|---|---|
| `src/` | React + TypeScript + MUI page. `theme.ts` is the brand palette from the plugins' admin theme; `apps.ts` holds the logic (tested in `apps.test.ts`). |
| `php/class-hub.php` | Hub class template: `{{CLASS}}`, `{{TEXT_DOMAIN}}`, `{{PACKAGE}}` are filled per plugin. |
| `scripts/install-into.sh` | Type-checks, tests, builds, then writes the plugin's hub class, `public/hub/reinventwp-apps.js` and `source/dashboard/`. |

## Develop with live reload

```bash
npm run dev   # http://localhost:3017, reloads on every change in src/
```

It first saves the local site's real page data (`wp eval-file scripts/dev-data.php` on `../../wordpress`) to `dev/data.js`, so the cards match localhost:8000. Re-run `npm run dev:data` after changing the catalog. Buttons link to localhost:8000. In the Claude desktop app it's also the `reinventwp-apps-dev` preview. When the page looks right, run `install-into.sh` for each plugin below.

## Add it to a plugin (approved plugins only)

```bash
./scripts/install-into.sh ../reinvent-media-cleanup/plugin includes/class-rwpmc-hub.php Rwpmc_Hub reinvent-media-cleanup MediaCleanup
./scripts/install-into.sh ../natural-text-to-speech/plugin components/class-natuteto-hub.php Natuteto_Hub natural-text-to-speech NaturalTextToSpeech
```

Installed in: Media Cleanup, Text to Speech. Both release preps (`npm run prep`) re-run it. When two copies share the same `HUB_VERSION`, the plugin WordPress loads first serves the page, so same version must mean same code.

Then in that plugin: git-ignore `public/hub/`, call the script from its release prep, check `public/hub/*` exists before delivering, keep `public/hub/*` and `source/*` out of phpcs, and disclose the catalog download under **External services** in `readme.txt` (copy Media Cleanup's item 3). Bump the plugin version; the hub version only changes when this page changes.

## Change the page

Edit here, bump `HUB_VERSION` in `php/class-hub.php` and `version` in `package.json`, run `npm test && npm run type`, then re-run `install-into.sh` for every approved plugin and release them.
