#!/bin/bash
# After a build: copy the Reinvent WP Apps page and the assistant (bot.js) into every plugin the Company Dashboard
# marks as published (/products), so they all carry the same, newest copy on the dev site.
#
# - The list comes from the dashboard, never from a guess: when it can't be read, nothing is copied and the build
#   still succeeds. Each plugin's release step (install-into.sh) installs the hub anyway.
# - A plugin gets it only when it already has a hub 2.x class (installed once with install-into.sh, at approval).
#   The class name and package are read from that file; the text domain is the WordPress.org slug.
# - Only the hub class and public/hub/ are written. source/dashboard/ is a release matter (install-into.sh).
#
#   SKIP_PLUGIN_SYNC=1 npm run build     # build without copying
set -e
cd "$(dirname "$0")/.."

if [ -n "$SKIP_PLUGIN_SYNC" ]; then
  exit 0
fi

PLUGINS_DIR="${PLUGINS_PATH:-../../wordpress/wp-content/plugins}"
PRODUCTS_URL="${DASHBOARD_PRODUCTS_URL:-http://localhost:3014/api/products}"
NOT_COPIED="hub not copied into the plugins (each plugin's prep / deliver still installs it)"

if [ ! -d "$PLUGINS_DIR" ]; then
  echo "⚠️  $PLUGINS_DIR not found; $NOT_COPIED"
  exit 0
fi
if ! PRODUCTS="$(curl -fsS -m 5 "$PRODUCTS_URL" 2>/dev/null)"; then
  echo "⚠️  Company Dashboard not reachable at $PRODUCTS_URL; $NOT_COPIED"
  exit 0
fi
# Published products with a WordPress.org slug, one per line.
if ! SLUGS="$(printf '%s' "$PRODUCTS" | node -e '
  let text = "";
  process.stdin.on("data", (chunk) => (text += chunk));
  process.stdin.on("end", () => {
    const data = JSON.parse(text);
    const products = Array.isArray(data) ? data : data.products;
    if (!Array.isArray(products)) process.exit(1);
    for (const product of products) {
      const slug = typeof product.wpSlug === "string" ? product.wpSlug : "";
      if (product.status === "published" && /^[a-z0-9-]+$/.test(slug)) console.log(slug);
    }
  });
')"; then
  echo "⚠️  The product list from $PRODUCTS_URL could not be read; $NOT_COPIED"
  exit 0
fi

COPIED=0
for SLUG in $SLUGS; do
  DIR="$PLUGINS_DIR/$SLUG"
  if [ ! -d "$DIR" ]; then
    echo "•  $SLUG: not in $PLUGINS_DIR, skipped"
    continue
  fi
  HUB="$(find "$DIR/includes" "$DIR/components" -maxdepth 1 -name 'class-*-hub.php' 2>/dev/null | head -n 1)"
  # Only a copy this template generated (hub 2.x): a plugin still on the PHP hub 1.0.x gets its first install by hand.
  if [ -z "$HUB" ] || ! grep -q "Generated from plugins/dashboard/php/class-hub.php" "$HUB"; then
    echo "•  $SLUG: no hub 2.x class yet, skipped (install it once with install-into.sh)"
    continue
  fi
  CLASS="$(grep -m 1 -oE '^class [A-Za-z_][A-Za-z0-9_]*' "$HUB" | cut -d ' ' -f 2)"
  PACKAGE="$(grep -m 1 -oE '@package [A-Za-z0-9]+' "$HUB" | cut -d ' ' -f 2)"
  if [ -z "$CLASS" ] || [ -z "$PACKAGE" ]; then
    echo "•  $SLUG: class or package not found in ${HUB#"$DIR"/}, skipped"
    continue
  fi
  ./scripts/copy-into.sh "$DIR" "${HUB#"$DIR"/}" "$CLASS" "$SLUG" "$PACKAGE"
  echo "✅ $SLUG: hub and bot.js copied"
  COPIED=$((COPIED + 1))
done
echo "Reinvent WP Apps $(node -p "require('./package.json').version") is in $COPIED published plugin(s)"
