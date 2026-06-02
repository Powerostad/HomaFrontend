#!/bin/sh
# Launch the crawler meta-injection sidecar (render-bot.mjs) in the background.
# Runs via the official nginx /docker-entrypoint.d mechanism, BEFORE nginx is
# exec'd as PID 1. The backgrounded node process is then reparented to nginx and
# keeps running for the container's lifetime.
#
# Fail-open by design: if node fails to start, this script still exits 0 so nginx
# comes up and serves the static SPA. Crawlers would just get generic meta — the
# site stays fully functional.
set -eu

echo "[45-render-bot] starting meta-injection sidecar"
nohup node /render-bot.mjs >/var/log/render-bot.log 2>&1 &
