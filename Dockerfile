# Multi-stage build for React application
# Node 24 / npm 11 — matches local dev and satisfies deps that require node >=20
# (vite-plugin-pwa -> workbox-build@7, glob@11).
FROM docker.arvancloud.ir/node:24-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including devDependencies for build)
# Use Runflare npm mirror for reliable access from Iran
#RUN #npm config set registry https://mirror-npm.runflare.com && \
#    npm ci
RUN npm ci

# Copy source code
COPY . .

# Build the application (outputs to dist/ per vite.config.ts)
RUN npm run build

# Verify build output - fail if index.html is missing
RUN echo "=== Build output ===" && \
    ls -la dist/ && \
    test -f dist/index.html || (echo "ERROR: dist/index.html not found!" && exit 1)

# Production stage with Nginx
FROM docker.arvancloud.ir/nginx:alpine AS production

# Node runtime for the crawler meta-injection sidecar (render-bot.mjs).
# No npm needed — the sidecar has zero dependencies (built-in http + fetch).
RUN apk add --no-cache nodejs

# Copy custom nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Copy built application from builder stage (Vite outputs to dist/)
COPY --from=builder /app/dist /usr/share/nginx/html

# Crawler meta-injection sidecar + its launcher (started before nginx).
COPY render-bot.mjs /render-bot.mjs
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
CMD ["nginx", "-g", "daemon off;"]
