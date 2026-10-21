#!/bin/bash
# Build the Reinvent WP Apps page and the assistant (bot.js) and copy them into one plugin, so the plugin stays
# self-contained (no shared package at runtime). Only for WordPress.org-approved plugins.
#
#   ./scripts/install-into.sh <plugin dir> <hub php path> <class> <text domain> <package>
#   ./scripts/install-into.sh ../reinvent-media-cleanup/plugin includes/class-rwpmc-hub.php Rwpmc_Hub reinvent-media-cleanup MediaCleanup
#
# Writes: <hub php path> (generated), public/hub/reinventwp-apps.js, public/hub/bot.js, source/dashboard/ (readable source).
set -e
cd "$(dirname "$0")/.."

PLUGIN_DIR="$1"
HUB_FILE="$2"
CLASS="$3"
TEXT_DOMAIN="$4"
PACKAGE="$5"
if [ -z "$PACKAGE" ] || [ ! -f "$PLUGIN_DIR/$HUB_FILE" ]; then
  echo "Usage: $0 <plugin dir> <hub php path> <class> <text domain> <package> (the hub file must already exist)"
  exit 1
fi
if ! [[ "$CLASS" =~ ^[A-Za-z_][A-Za-z0-9_]*$ && "$TEXT_DOMAIN" =~ ^[a-z0-9-]+$ && "$PACKAGE" =~ ^[A-Za-z0-9]+$ ]]; then
  echo "❌ Class, text domain or package has unexpected characters"
  exit 1
fi

npx tsc -p tsconfig.json --noEmit
npx vitest --run
npm run build

sed -e "s/{{CLASS}}/$CLASS/g" -e "s/{{TEXT_DOMAIN}}/$TEXT_DOMAIN/g" -e "s/{{PACKAGE}}/$PACKAGE/g" php/class-hub.php > "$PLUGIN_DIR/$HUB_FILE"
if grep -q "{{" "$PLUGIN_DIR/$HUB_FILE"; then
  echo "❌ A placeholder was left in $HUB_FILE"
  exit 1
fi

rm -rf "$PLUGIN_DIR/public/hub"
mkdir -p "$PLUGIN_DIR/public/hub"
cp build/reinventwp-apps.js build/bot.js "$PLUGIN_DIR/public/hub/"

# WordPress.org requires the human-readable source for built JS.
rm -rf "$PLUGIN_DIR/source/dashboard"
mkdir -p "$PLUGIN_DIR/source/dashboard"
rsync -a --exclude "*.test.ts" --exclude ".DS_Store" src/ "$PLUGIN_DIR/source/dashboard/src/"
cp package.json tsconfig.json webpack.config.js "$PLUGIN_DIR/source/dashboard/"

echo "✅ Reinvent WP Apps $(node -p "require('./package.json').version") installed into $PLUGIN_DIR"
