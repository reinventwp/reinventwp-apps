#!/bin/bash
# Saves the Apps page data of the local WordPress site (localhost:8000) to dev/data.js,
# so `npm run dev` shows the real cards. Re-run it after changing the catalog.
set -e
cd "$(dirname "$0")/.."
WP_PATH="${WP_PATH:-../../wordpress}"
DATA=$(wp --path="$WP_PATH" eval-file "$PWD/scripts/dev-data.php" 2>/dev/null | grep "^window.reinventwp")
if [[ "$DATA" != window.reinventwpApps* ]]; then
  echo "❌ Couldn't read the Apps page data from $WP_PATH (is an approved plugin with hub 2.0.0 active?)"
  exit 1
fi
mkdir -p dev
echo "$DATA" > dev/data.js
echo "✅ dev/data.js written from $WP_PATH"
