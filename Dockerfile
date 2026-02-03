# Multi-stage build for React application
FROM docker.arvancloud.ir/node:18-alpine AS builder

# Accept build argument for API URL
ARG VITE_API_BASE_URL
ARG TEST_VAR
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}
ENV TEST_VAR=${TEST_VAR}

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
    echo "VITE_API_BASE_URL from ENV: [$VITE_API_BASE_URL]" && \
    echo "VITE_API_TIMEOUT from ENV: [$VITE_API_TIMEOUT]" && \
    echo "TEST_VAR from ENV: [$TEST_VAR]" && \
    echo "=== Raw printenv for VITE vars ===" && \
    printenv | grep -E "^VITE_|^TEST_" && \
    echo "=== Checking for .env files ===" && \
    ls -la .env* 2>/dev/null || echo "No .env files found" && \
    echo "=== Content of .env.production (if exists) ===" && \
    cat .env.production 2>/dev/null || echo "No .env.production file"

# Build the application (outputs to dist/ per vite.config.ts)
RUN npm run build

# Verify the baked-in API URL in built files
RUN echo "=== Checking built JS for API URL ===" && \
    grep -o 'http://[^"]*' /app/dist/assets/*.js | head -5 || echo "Could not extract URLs"

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

# Create a non-root user for the application files
RUN addgroup -g 1001 -S appgroup && \
    adduser -S appuser -u 1001 -G appgroup

# Change ownership of application files
RUN chown -R appuser:appgroup /usr/share/nginx/html

# Expose port
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
