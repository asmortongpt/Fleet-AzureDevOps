# Multi-stage build for production-ready container

# Stage 1: Build stage
FROM node:20-alpine@sha256:6178e78b972f79c335df281f4b7674a2d85071aae2af020ffa39f0a770265435 AS builder

# Set working directory
WORKDIR /app

# Install dependencies for native modules
RUN apk add --no-cache python3 make g++

# Increase Node.js memory limit BEFORE any npm operations (4GB max for ACR agents)
ENV NODE_OPTIONS="--max-old-space-size=3072"

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
ENV VITE_ENVIRONMENT=production
ENV VITE_API_URL=""

# Generate build version from git commit or timestamp
RUN BUILD_VERSION=$(date +%s) && \
    echo $BUILD_VERSION > /tmp/build_version.txt && \
    export VITE_BUILD_VERSION=$BUILD_VERSION

# Build application with increased memory
RUN npm run build:production || npm run build

# Inject build version into HTML for cache busting
RUN BUILD_VERSION=$(cat /tmp/build_version.txt || date +%s) && \
    sed -i "/<head>/a \ \ \ \ <!-- BUILD_VERSION: $BUILD_VERSION -->" /app/dist/index.html && \
    echo "Build version: $BUILD_VERSION"

# Stage 2: Production stage with nginx
FROM nginx:alpine@sha256:2140dad235c130ac861018a4e13a6bc8aea3a35f3a40e20c1b060d51a7efd250 AS production

# Copy complete nginx config (replaces default)
COPY nginx.conf /etc/nginx/nginx.conf

# CRITICAL FIX: Remove default nginx config that conflicts with our custom config
# The default.conf listens on port 80 and doesn't have try_files for SPA routing
RUN rm -f /etc/nginx/conf.d/default.conf

# Copy built application from builder
COPY --from=builder /app/dist /usr/share/nginx/html

# REMOVED: Runtime configuration script (not needed - using build-time env vars)
# COPY scripts/runtime-config.sh /docker-entrypoint.d/01-runtime-config.sh
# RUN chmod +x /docker-entrypoint.d/01-runtime-config.sh

# Expose port 8080 (matches Kubernetes service and health probes)
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8080/health || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]

# Labels for better image management
LABEL maintainer="Fleet Management Team"
LABEL version="1.0.0"
LABEL description="Production-ready Fleet Management Application"
LABEL org.opencontainers.image.source="https://github.com/asmortongpt/Fleet"
