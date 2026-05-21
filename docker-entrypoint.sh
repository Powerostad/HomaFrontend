#!/bin/sh
set -eu

CONFIG_FILE=/usr/share/nginx/html/config.js
CSP_FILE=/etc/nginx/conf.d/runtime-csp.conf

json_string() {
  # Escape values as JavaScript/JSON strings so quotes, backslashes, tabs, and
  # carriage returns cannot break the generated config.js syntax.
  printf '"'
  printf '%s' "${1:-}" \
    | sed \
      -e 's/\\/\\\\/g' \
      -e 's/"/\\"/g' \
      -e 's/	/\\t/g' \
      -e 's/\r/\\r/g' \
      -e ':a;N;$!ba;s/\n/\\n/g'
  printf '"'
}

write_config_value() {
  key=$1
  value=$2
  comma=${3:-,}
  printf '  %s: %s%s\n' "$key" "$(json_string "$value")" "$comma" >> "$CONFIG_FILE"
}

cat > "$CONFIG_FILE" <<'EOF'
// Runtime configuration generated when the container starts.
// Vite import.meta.env values are build-time only; use this file for Dokploy
// Compose environment variables that must change without rebuilding the image.
window.__APP_CONFIG__ = {
EOF

write_config_value VITE_API_BASE_URL "${VITE_API_BASE_URL:-}"
write_config_value VITE_API_TIMEOUT "${VITE_API_TIMEOUT:-}"
write_config_value VITE_API_IMAGE_PROCESSING_TIMEOUT "${VITE_API_IMAGE_PROCESSING_TIMEOUT:-}"
write_config_value VITE_UMAMI_SRC "${VITE_UMAMI_SRC:-}"
write_config_value VITE_UMAMI_WEBSITE_ID "${VITE_UMAMI_WEBSITE_ID:-}"
write_config_value VITE_AUTH_MODE "${VITE_AUTH_MODE:-}"
write_config_value VITE_ENABLE_UMAMI_IN_DEV "${VITE_ENABLE_UMAMI_IN_DEV:-}" ""

cat >> "$CONFIG_FILE" <<'EOF'
};
EOF

origin_from_url() {
  printf '%s' "${1:-}" \
    | sed -n 's#^\(https\{0,1\}://[A-Za-z0-9._:-][A-Za-z0-9._:-]*\).*#\1#p'
}

API_ORIGIN=$(origin_from_url "${VITE_API_BASE_URL:-https://api.myhoma.ir}")
# Umami needs its origin in script-src (to load script.js) AND connect-src
# (the tracker POSTs collected data to {origin}/api/send).
UMAMI_ORIGIN=$(origin_from_url "${VITE_UMAMI_SRC:-https://analytics.myhoma.ir}")

CONNECT_SRC="'self'"
if [ -n "$API_ORIGIN" ]; then
  CONNECT_SRC="$CONNECT_SRC $API_ORIGIN"
fi
if [ -n "$UMAMI_ORIGIN" ]; then
  CONNECT_SRC="$CONNECT_SRC $UMAMI_ORIGIN"
fi

SCRIPT_SRC="'self' 'unsafe-inline'"
if [ -n "$UMAMI_ORIGIN" ]; then
  SCRIPT_SRC="$SCRIPT_SRC $UMAMI_ORIGIN"
fi

cat > "$CSP_FILE" <<EOF
# Runtime CSP generated from public environment variables.
add_header Content-Security-Policy "default-src 'self'; script-src $SCRIPT_SRC; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https:; font-src 'self' data:; connect-src $CONNECT_SRC; worker-src 'self' blob:; frame-src 'self'; object-src 'none'; base-uri 'self';" always;
EOF
