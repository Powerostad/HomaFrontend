#!/bin/sh
# Supervise both required services: a dead renderer must fail the container.
set -eu
# The upstream Nginx entrypoint only runs its hooks for a `nginx` command.
# Our supervisor is the command, so initialize runtime config explicitly.
/docker-entrypoint.d/40-runtime-config.sh
nginx -t
node /app/server.mjs &
renderer=$!
nginx -g 'daemon off;' &
web=$!
stop() { kill "$renderer" "$web" 2>/dev/null || true; wait "$renderer" "$web" 2>/dev/null || true; }
trap 'stop; exit 0' TERM INT
while kill -0 "$renderer" 2>/dev/null && kill -0 "$web" 2>/dev/null; do sleep 1; done
stop
exit 1
