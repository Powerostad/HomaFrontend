# Multi-stage build for React application
# Node 24 / npm 11 — matches local dev and satisfies deps that require node >=20
# (vite-plugin-pwa -> workbox-build@7, glob@11).
ARG NODE_IMAGE=node:24-alpine
ARG NGINX_IMAGE=nginx:alpine
FROM ${NODE_IMAGE} AS builder

# Use the official npm registry for JavaScript dependencies
ENV NPM_CONFIG_REGISTRY=https://registry.npmjs.org/

# Set working directory
WORKDIR /app

# Use upstream Alpine repositories so missing/stale mirror packages cannot break releases
RUN ALPINE_VERSION="$(cut -d. -f1,2 /etc/alpine-release)" && \
    printf 'https://dl-cdn.alpinelinux.org/alpine/v%s/main\nhttps://dl-cdn.alpinelinux.org/alpine/v%s/community\n' "$ALPINE_VERSION" "$ALPINE_VERSION" > /etc/apk/repositories

# Copy package files
COPY package*.json ./

# Install all dependencies (including devDependencies for build)
RUN npm ci

# Copy source code
COPY . .

# Build the application (outputs to dist/ per vite.config.ts)
ARG SOURCE_REV=unversioned
ENV SOURCE_REV=${SOURCE_REV}
RUN npm run build

# Verify build output - fail if index.html is missing
RUN echo "=== Build output ===" && \
    ls -la dist/ && \
    test -f dist/index.html || (echo "ERROR: dist/index.html not found!" && exit 1)

# Production stage with Nginx
FROM ${NGINX_IMAGE} AS production
ARG SOURCE_REV=unversioned
LABEL org.opencontainers.image.revision=${SOURCE_REV}
LABEL ir.myhoma.release-contract="nginx-public-documents-blog-v1"

# Use upstream Alpine repositories for runtime packages
RUN ALPINE_VERSION="$(cut -d. -f1,2 /etc/alpine-release)" && \
    printf 'https://dl-cdn.alpinelinux.org/alpine/v%s/main\nhttps://dl-cdn.alpinelinux.org/alpine/v%s/community\n' "$ALPINE_VERSION" "$ALPINE_VERSION" > /etc/apk/repositories

# Node runtime for the crawler meta-injection sidecar (render-bot.mjs).
# No npm needed — the sidecar has zero dependencies (built-in http + fetch).
RUN apk add --no-cache nodejs

# Copy custom nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Copy built application from builder stage (Vite outputs to dist/)
COPY --from=builder /app/dist /usr/share/nginx/html

# Crawler meta-injection sidecar + its launcher (started before nginx).
COPY render-bot.mjs /render-bot.mjs
COPY blog-http.mjs public-documents.mjs /
COPY --from=builder /app/dist-blog-server/blog-render.mjs /blog-render.mjs
COPY render-bot-entrypoint.sh /docker-entrypoint.d/45-render-bot.sh

# Generate /config.js from runtime container environment before Nginx starts.
# This keeps one built image deployable across Dokploy environments.
COPY docker-entrypoint.sh /docker-entrypoint.d/40-runtime-config.sh

# Create a non-root user for the application files
RUN addgroup -g 1001 -S appgroup && \
    adduser -S appuser -u 1001 -G appgroup && \
    chmod +x /docker-entrypoint.d/40-runtime-config.sh \
            /docker-entrypoint.d/45-render-bot.sh

# Change ownership of application files
RUN chown -R appuser:appgroup /usr/share/nginx/html

# Expose port
EXPOSE 80

# Start nginx
HEALTHCHECK --interval=30s --timeout=8s --start-period=20s --retries=3 CMD wget -q -O /dev/null http://127.0.0.1/health && node -e "fetch('http://127.0.0.1:8081/').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["nginx", "-g", "daemon off;"]
