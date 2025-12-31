# ============================================================================
# Stage 1: Dependencies
# ============================================================================
FROM node:20-alpine AS dependencies

# Install build dependencies
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    git

WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./

# Install dependencies with clean npm ci
RUN npm ci --production=false --prefer-offline --no-audit

# ============================================================================
# Stage 2: Builder
# ============================================================================
FROM node:20-alpine AS builder

WORKDIR /app

# Copy dependencies from previous stage
COPY --from=dependencies /app/node_modules ./node_modules

# Copy application source
COPY . .

# Build arguments
ARG NODE_ENV=production
ARG BUILD_DATE
ARG VCS_REF

ENV NODE_ENV=${NODE_ENV}

# Build the application
RUN npm run build

# Remove dev dependencies after build
RUN npm prune --production

# ============================================================================
# Stage 3: Production
# ============================================================================
FROM nginx:1.25-alpine AS production

# Install runtime dependencies
RUN apk add --no-cache \
    curl \
    ca-certificates \
    tzdata

# Create non-root user for nginx
RUN addgroup -g 101 -S nginx-app && \
    adduser -S -D -H -u 101 -h /var/cache/nginx -s /sbin/nologin -G nginx-app -g nginx-app nginx-app

# Copy custom nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Copy built application from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Set proper permissions
RUN chown -R nginx-app:nginx-app /usr/share/nginx/html && \
    chown -R nginx-app:nginx-app /var/cache/nginx && \
    chown -R nginx-app:nginx-app /var/log/nginx && \
    chown -R nginx-app:nginx-app /etc/nginx/conf.d && \
    touch /var/run/nginx.pid && \
    chown -R nginx-app:nginx-app /var/run/nginx.pid

# Create health check endpoint
RUN echo 'healthy' > /usr/share/nginx/html/health.txt

# Add metadata labels
LABEL maintainer="Capital Tech Alliance" \
      version="1.0.0" \
      description="Fleet Management System - Production Ready" \
      org.opencontainers.image.created="${BUILD_DATE}" \
      org.opencontainers.image.revision="${VCS_REF}" \
      org.opencontainers.image.source="https://github.com/asmortongpt/fleet-local"

# Security: Run as non-root user
USER nginx-app

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8080/health.txt || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]

# ============================================================================
# Stage 4: Development (optional)
# ============================================================================
FROM node:20-alpine AS development

WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./

# Install all dependencies (including dev)
RUN npm ci

# Copy source code
COPY . .

# Expose dev server port
EXPOSE 5173

# Start development server
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
