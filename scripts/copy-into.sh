#!/bin/bash
# Copy the built Reinvent WP Apps page and the assistant (bot.js) into one plugin: its hub class, written from the
# template, and public/hub/. It never builds: install-into.sh (a release) and sync-published.sh (after a build) call it.
#
#   ./scripts/copy-into.sh <plugin dir> <hub php path> <class> <text domain> <package>
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
for file in reinventwp-apps.js bot.js hub-3d.js; do
  if [ ! -f "build/$file" ]; then
    echo "❌ build/$file is missing: run npm run build first"
    exit 1
  fi
done

NEW_HUB="$(mktemp)"
trap 'rm -f "$NEW_HUB"' EXIT
sed -e "s/{{CLASS}}/$CLASS/g" -e "s/{{TEXT_DOMAIN}}/$TEXT_DOMAIN/g" -e "s/{{PACKAGE}}/$PACKAGE/g" php/class-hub.php > "$NEW_HUB"
if grep -q "{{" "$NEW_HUB"; then
  echo "❌ A placeholder was left in $HUB_FILE"
  exit 1
fi
# Only rewritten when it changed, so an unchanged class keeps its file time.
if ! cmp -s "$NEW_HUB" "$PLUGIN_DIR/$HUB_FILE"; then
  cat "$NEW_HUB" > "$PLUGIN_DIR/$HUB_FILE"
fi

rm -rf "$PLUGIN_DIR/public/hub"
mkdir -p "$PLUGIN_DIR/public/hub"
cp build/reinventwp-apps.js build/bot.js build/hub-3d.js "$PLUGIN_DIR/public/hub/"
