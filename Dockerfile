# Multi-stage build for production-ready container

# Stage 1: Build stage
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Install dependencies for native modules
RUN apk add --no-cache python3 make g++

# Increase Node.js memory limit BEFORE any npm operations (4GB max for ACR agents)
ENV NODE_OPTIONS="--max-old-space-size=4096"

# Copy package.json only (not lock file to avoid platform binding issues)
COPY package.json ./

# Cache buster MUST come after COPY to invalidate npm install layer
ARG CACHE_BUST=1
RUN echo "Cache bust: $CACHE_BUST - forcing fresh npm install"

# Install dependencies (fresh install for correct Linux platform deps)
# Use --legacy-peer-deps for React 18 compatibility with older packages
RUN npm install --legacy-peer-deps

# Copy source code (excluding node_modules via .dockerignore)
COPY . .

# Remove package-lock.json if copied to prevent node_modules conflicts
RUN rm -f package-lock.json

# Set build-time environment variables for Vite
# SECURITY: Secrets are injected at runtime, not build-time
# SECURITY FIX P1 HIGH-SEC-012: Disable debug mode in production
ENV NODE_ENV=production
ENV VITE_ENVIRONMENT=production
ENV VITE_API_URL=""

# Generate build version from git commit or timestamp
RUN BUILD_VERSION=$(date +%s) && \
    echo $BUILD_VERSION > /tmp/build_version.txt && \
    export VITE_BUILD_VERSION=$BUILD_VERSION

# Build application with increased memory
RUN npm run build

# Inject build version into HTML for cache busting
RUN BUILD_VERSION=$(cat /tmp/build_version.txt || date +%s) && \
    sed -i "/<head>/a \ \ \ \ <!-- BUILD_VERSION: $BUILD_VERSION -->" /app/dist/index.html && \
    echo "Build version: $BUILD_VERSION"

# Stage 2: Production stage with nginx
FROM nginx:alpine AS production

# Security: Create non-root user for nginx
RUN addgroup -g 1001 -S nginx-app && \
    adduser -S nginx-app -u 1001 -G nginx-app

# Copy complete nginx config (replaces default)
COPY nginx.conf /etc/nginx/nginx.conf

# CRITICAL FIX: Remove default nginx config that conflicts with our custom config
# The default.conf listens on port 80 and doesn't have try_files for SPA routing
RUN rm -f /etc/nginx/conf.d/default.conf

# Copy built application from builder
COPY --from=builder /app/dist /usr/share/nginx/html

# Security: Create necessary directories for nginx non-root operation
RUN mkdir -p /var/cache/nginx /var/log/nginx /var/run && \
    chown -R nginx-app:nginx-app /var/cache/nginx /var/log/nginx /var/run /usr/share/nginx/html && \
    chmod -R 755 /var/cache/nginx /var/log/nginx /var/run && \
    touch /var/run/nginx.pid && \
    chown nginx-app:nginx-app /var/run/nginx.pid

# Security: Switch to non-root user
USER nginx-app

# REMOVED: Runtime configuration script (not needed - using build-time env vars)
# COPY scripts/runtime-config.sh /docker-entrypoint.d/01-runtime-config.sh
# RUN chmod +x /docker-entrypoint.d/01-runtime-config.sh

# Expose port 3000
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]

# Labels for better image management
LABEL maintainer="Fleet Management Team"
LABEL version="1.0.0"
LABEL description="Production-ready Fleet Management Application"
LABEL org.opencontainers.image.source="https://github.com/asmortongpt/Fleet"
