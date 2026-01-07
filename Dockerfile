# Multi-stage build for React application
FROM node:18-alpine AS builder

# Accept build argument for API URL
ARG VITE_API_BASE_URL
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}

# Accept other environment variables
ARG VITE_API_TIMEOUT
ARG VITE_API_IMAGE_PROCESSING_TIMEOUT
ENV VITE_API_TIMEOUT=${VITE_API_TIMEOUT}
ENV VITE_API_IMAGE_PROCESSING_TIMEOUT=${VITE_API_IMAGE_PROCESSING_TIMEOUT}

# PostHog environment variables
ARG VITE_PUBLIC_POSTHOG_KEY
ARG VITE_PUBLIC_POSTHOG_HOST
ENV VITE_PUBLIC_POSTHOG_KEY=${VITE_PUBLIC_POSTHOG_KEY}
ENV VITE_PUBLIC_POSTHOG_HOST=${VITE_PUBLIC_POSTHOG_HOST}

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including devDependencies for build)
RUN npm ci

# Copy source code
COPY . .

# Print environment for debugging
RUN echo "=== Build Environment ===" && \
    echo "VITE_API_BASE_URL: $VITE_API_BASE_URL" && \
    echo "VITE_API_TIMEOUT: $VITE_API_TIMEOUT"

# Build the application (outputs to dist/ per vite.config.ts)
RUN npm run build

# Verify build output - fail if index.html is missing
RUN echo "=== Build output ===" && \
    ls -la dist/ && \
    test -f dist/index.html || (echo "ERROR: dist/index.html not found!" && exit 1)

# Production stage with Nginx
FROM nginx:alpine AS production

# Copy custom nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Copy built application from builder stage (Vite outputs to dist/)
COPY --from=builder /app/dist /usr/share/nginx/html

# Create a non-root user for the application files
RUN addgroup -g 1001 -S appgroup && \
    adduser -S appuser -u 1001 -G appgroup

# Change ownership of application files
RUN chown -R appuser:appgroup /usr/share/nginx/html

# Expose port
EXPOSE 80

# Health check using wget (available in Alpine)
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost/ || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
