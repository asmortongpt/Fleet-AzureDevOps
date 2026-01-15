# Fleet API Production Dockerfile
# Multi-stage build for optimized production image

# ============================================================================
# Stage 1: Builder
# ============================================================================
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies first (layer caching)
COPY package*.json ./
RUN npm ci --ignore-scripts --legacy-peer-deps

# Copy source code
COPY . .

# ============================================================================
# Stage 2: Production
# ============================================================================
FROM node:20-alpine AS production

WORKDIR /app

# Install only production dependencies + tsx for TypeScript execution
COPY package*.json ./
RUN npm ci --only=production --ignore-scripts --legacy-peer-deps && \
    npm install tsx ws --legacy-peer-deps && \
    npm cache clean --force

# Copy source code and tsconfig (tsx needs tsconfig for decorators)
COPY --from=builder /app/src ./src
COPY --from=builder /app/tsconfig.json ./tsconfig.json

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 && \
    chown -R nodejs:nodejs /app

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/health', (r) => { process.exit(r.statusCode === 200 ? 0 : 1) })"

# Start server using tsx with tsconfig to enable decorators
CMD ["npx", "tsx", "--tsconfig", "tsconfig.json", "src/server.ts"]
