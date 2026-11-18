#!/bin/bash
# Build the Reinvent WP Apps page and the assistant (bot.js) and copy them into one plugin, so the plugin stays
# self-contained (no shared package at runtime). Only for WordPress.org-approved plugins.
#
#   ./scripts/install-into.sh <plugin dir> <hub php path> <class> <text domain> <package>
#   ./scripts/install-into.sh ../reinvent-media-cleanup/plugin includes/class-rwpmc-hub.php Rwpmc_Hub reinvent-media-cleanup MediaCleanup
#
# Writes: <hub php path> (generated), public/hub/reinventwp-apps.js, public/hub/bot.js, public/hub/hub-3d.js, source/dashboard/ (readable source).
# A plain `npm run build` also copies the first two into every published plugin (sync-published.sh); this script is
# the release step, which checks and tests first and adds the source.
set -e
cd "$(dirname "$0")/.."

PLUGIN_DIR="$1"
PACKAGE="$5"
if [ -z "$PACKAGE" ] || [ ! -f "$PLUGIN_DIR/$2" ]; then
  echo "Usage: $0 <plugin dir> <hub php path> <class> <text domain> <package> (the hub file must already exist)"
  exit 1
fi

# Type-check, test and build once per source state: several plugins are released in a row, and each one calls this.
# build/.verified is written after all three pass. The build is reused while nothing it is made from is newer than
# that file; FORCE_BUILD=1 rebuilds anyway.
STAMP="build/.verified"
INPUTS="src package.json package-lock.json tsconfig.json webpack.config.js"
fresh_build() {
  [ -z "$FORCE_BUILD" ] && [ -f "$STAMP" ] || return 1
  for file in reinventwp-apps.js bot.js hub-3d.js; do
    [ -f "build/$file" ] || return 1
  done
  # shellcheck disable=SC2086 # A list of paths on purpose.
  [ -z "$(find $INPUTS -newer "$STAMP" -print -quit)" ]
}

if fresh_build; then
  echo "♻️  Reinvent WP Apps build is up to date (checked and built $(date -r "$STAMP" '+%d %b %H:%M')), reusing it"
else
  rm -f "$STAMP"
  npx tsc -p tsconfig.json --noEmit
  npx vitest --run
  npm run build
  touch "$STAMP"
fi

# The hub class and public/hub/ (checks the class, text domain and package too).
./scripts/copy-into.sh "$@"

# WordPress.org requires the human-readable source for built JS.
rm -rf "$PLUGIN_DIR/source/dashboard"
mkdir -p "$PLUGIN_DIR/source/dashboard"
rsync -a --exclude "*.test.ts" --exclude ".DS_Store" src/ "$PLUGIN_DIR/source/dashboard/src/"
cp package.json tsconfig.json webpack.config.js "$PLUGIN_DIR/source/dashboard/"

echo "✅ Reinvent WP Apps $(node -p "require('./package.json').version") installed into $PLUGIN_DIR"
