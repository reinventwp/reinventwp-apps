# Reinvent WP Apps page

The **Reinvent WP → Dashboard** page, shared by every WordPress.org-approved Reinvent WP plugin. One source here; each plugin gets its own copy, so plugins stay self-contained.

## How it fits

- Every Reinvent WP plugin ships a hub class (`class-<prefix>-hub.php`) with a `HUB_VERSION`. The highest version on a site registers the menu and the page; the others only add their submenu.
- Unapproved plugins keep the old PHP hub (1.0.x). This one is **2.0.0**, so on any site with an approved plugin the React page wins.
- The app list comes from Reinvent WP Services, `GET /api/reinvent/plugins/catalog` (edited at reinventwp.com `/dashboard/admin/plugins`). PHP reads it at most once a day (transient `reinventwp_hub_catalog_v2`, one hour after a failure), validates every field, and falls back to the built-in list in `php/class-hub.php`. Local sites (`localhost`) read `http://localhost:3005`; filter `reinventwp_hub_catalog_url` overrides it.
- Same stack as the Text to Speech and Media Cleanup admin screens: React 19 + MUI 7 (Emotion), in two standalone bundles: `reinventwp-apps.js` (the app cards, this page only) and `bot.js` (the assistant, `src/bot/`). The page text is English only, in `src/strings.ts`.
- `bot.js` runs on this page, on the own page of every plugin that ships hub 2.x (each registers itself in `$GLOBALS['reinventwp_bot_plugins']`), and on reinventwp.com. It reads `window.reinventwpBot` (`src/bot/types.ts`), uses its own MUI class prefix and emotion cache (`rwpbot`), and `npm run build` copies it to `reinventwp-next/public/bot/bot.js` (commit it there). Spec: `reinventwp-services/docs/SPECS/CHATBOT.md`.
- The page, top to bottom: the reinventwp.com homepage hero copied as it is, as tall as the screen and run out over the grey gaps to the admin bar, the menu and the right edge (it stays under other plugins' notices when there are any), with a "Scroll down" button, and a forced scroll between the hero and the page (`src/hero/useHeroSnap.ts`: the window never rests half on the hero) (`src/hero/`, from `reinventwp-next/src/content/HomePage/sections/hero`): headline, 3D diorama on desktop (three.js + @react-three/fiber, loaded as its own file `hub-3d.js` only when shown), flat SVG scenes on phones, with reduced motion and while 3D loads, then the title, the Suite Pass card, **Must have** (every app whose catalog `extra_categories` include "Must have", the installed ones last), **More from Reinvent WP** with category chips, and **Your apps** as the same cards.
- The Suite Pass card (`src/suite/`: the /suite page's silk waves, tone and looping story, copied from `reinventwp-next/src/content/pages/suite`; the price in `suitePlans.ts` must match the website) shows only when no plugin reports a paid licence: PHP sends `show_suite = ! apply_filters( 'reinventwp_hub_has_paid_license', false )`. Text to Speech hooks it with its Freemius licence (`natuteto_hub_has_paid_license`). Never market to paying users.
- The page isn't wrapped in `.wrap`: WordPress's `.wrap h1` rules would override MUI's typography. Old PHP hubs still print `.rwp-hub-*` CSS on this page; MUI's generated classes don't collide with it.

## Files

| Path | What |
|---|---|
| `src/` | React + TypeScript + MUI page. `theme.ts` is the brand palette from the plugins' admin theme; `apps.ts` holds the logic (tested in `apps.test.ts`). |
| `php/class-hub.php` | Hub class template: `{{CLASS}}`, `{{TEXT_DOMAIN}}`, `{{PACKAGE}}` are filled per plugin. |
| `scripts/install-into.sh` | Type-checks, tests, builds, then writes the plugin's hub class, `public/hub/reinventwp-apps.js`, `public/hub/hub-3d.js` and `source/dashboard/`. |

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

Installed in: Text to Speech, Media Cleanup, Retina Images, Rename & Replace Media and Watermark. Their release steps re-run it: `admin/scripts/prepare.sh` (`npm run prep`) in the first four, `scripts/deliver.sh` in Watermark, which has no build step. A new approved plugin must call it from its release step too. When two copies share the same `HUB_VERSION`, the plugin WordPress loads first serves the page, so same version must mean same code.

Then in that plugin: git-ignore `public/hub/`, call the script from its release prep, check `public/hub/*` exists before delivering, keep `public/hub/*` and `source/*` out of phpcs, and disclose the catalog download under **External services** in `readme.txt` (copy Media Cleanup's item 3). Bump the plugin version; the hub version only changes when this page changes.

## Change the page

Edit here, bump `HUB_VERSION` in `php/class-hub.php` and `version` in `package.json`, run `npm test && npm run type`, then re-run `install-into.sh` for every approved plugin and release them.
