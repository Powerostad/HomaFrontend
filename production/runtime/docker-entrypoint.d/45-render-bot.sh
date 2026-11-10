#!/bin/sh
# Launch the public document router in the background.
# Runs via the official nginx /docker-entrypoint.d mechanism, BEFORE nginx is
# exec'd as PID 1. The backgrounded node process is then reparented to nginx and
# keeps running for the container's lifetime.
#
# Document rendering is required for both browsers and crawlers. Verify startup
# before accepting traffic; the image health check also monitors this process.
set -eu

echo "[45-render-bot] starting public document router"
nohup node /render-bot.mjs >/var/log/render-bot.log 2>&1 &
node -e 'let n=0;async function ready(){try{const r=await fetch("http://127.0.0.1:8081/",{signal:AbortSignal.timeout(1000)});if(r.ok)process.exit(0)}catch{}if(++n>=20)process.exit(1);setTimeout(ready,250)}ready()'
