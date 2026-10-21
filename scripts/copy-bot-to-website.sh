#!/bin/bash
# Copies the built assistant (build/bot.js) into reinventwp-next/public/bot, so reinventwp.com
# serves the same bundle the plugins load. Vercel can't see this folder, so the copy is committed
# in reinventwp-next. Skipped when the website repo isn't next to this one.
set -e
cd "$(dirname "$0")/.."
WEBSITE="${WEBSITE_PATH:-../../reinventwp-next}"
if [ ! -d "$WEBSITE/public" ]; then
  echo "⚠️  $WEBSITE not found; bot.js not copied to the website"
  exit 0
fi
mkdir -p "$WEBSITE/public/bot"
cp build/bot.js "$WEBSITE/public/bot/bot.js"
echo "✅ bot.js copied to $WEBSITE/public/bot/bot.js"
