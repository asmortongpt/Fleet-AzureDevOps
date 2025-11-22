# Multi-stage build for production-ready container

# Stage 1: Build stage
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Install dependencies for native modules
RUN apk add --no-cache python3 make g++

# Copy package files
COPY package*.json ./

# Cache buster MUST come after COPY to invalidate npm ci layer
ARG CACHE_BUST=1
RUN echo "Cache bust: $CACHE_BUST - forcing fresh npm install"

# Install dependencies (use npm install to resolve correct platform deps)
# npm ci would fail because lock file has macOS bindings
RUN npm install

# Copy source code
COPY . .

# Set build-time environment variables for Vite
# SECURITY: Secrets are injected at runtime, not build-time
ENV VITE_ENVIRONMENT=production
ENV VITE_API_URL=""

# Generate build version from git commit or timestamp
RUN BUILD_VERSION=$(git rev-parse --short HEAD 2>/dev/null || date +%s) && \
    echo $BUILD_VERSION > /tmp/build_version.txt && \
    export VITE_BUILD_VERSION=$BUILD_VERSION

# Build application
RUN npm run build

# Inject build version into HTML for cache busting
RUN BUILD_VERSION=$(cat /tmp/build_version.txt || date +%s) && \
    sed -i "/<head>/a \ \ \ \ <!-- BUILD_VERSION: $BUILD_VERSION -->" /app/dist/index.html && \
    echo "Build version: $BUILD_VERSION"

# Stage 2: Production stage with nginx
FROM nginx:alpine AS production

# Copy custom nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built application from builder
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy runtime configuration script
COPY scripts/runtime-config.sh /docker-entrypoint.d/01-runtime-config.sh
RUN chmod +x /docker-entrypoint.d/01-runtime-config.sh

# Create fleetapp user and set permissions for nginx
RUN addgroup -g 1000 fleetapp && \
    adduser -D -u 1000 -G fleetapp fleetapp && \
    chown -R fleetapp:fleetapp /usr/share/nginx/html && \
    chown -R fleetapp:fleetapp /var/cache/nginx && \
    chown -R fleetapp:fleetapp /var/log/nginx && \
    mkdir -p /run && \
    chown -R fleetapp:fleetapp /run

# Switch to non-root user
USER fleetapp

# Expose port
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
