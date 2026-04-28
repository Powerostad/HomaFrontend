# Multi-stage build for React application
FROM docker.arvancloud.ir/node:18-alpine AS builder

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

# Copy custom nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Copy built application from builder stage (Vite outputs to dist/)
COPY --from=builder /app/dist /usr/share/nginx/html

# Generate /config.js from runtime container environment before Nginx starts.
# This keeps one built image deployable across Dokploy environments.
COPY docker-entrypoint.sh /docker-entrypoint.d/40-runtime-config.sh

# Create a non-root user for the application files
RUN addgroup -g 1001 -S appgroup && \
    adduser -S appuser -u 1001 -G appgroup && \
    chmod +x /docker-entrypoint.d/40-runtime-config.sh

# Change ownership of application files
RUN chown -R appuser:appgroup /usr/share/nginx/html

# Expose port
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
