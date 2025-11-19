# Fleet Management API - Production Dockerfile
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install ALL dependencies (including devDependencies for build)
RUN npm install

# Copy source code
COPY src ./src

# Build TypeScript - fail on errors
RUN npm run build

# Production image
FROM node:20-alpine

WORKDIR /app

# Install build dependencies for native modules (bcrypt)
RUN apk add --no-cache python3 make g++

# Install production dependencies only
COPY package*.json ./
RUN npm install --only=production && \
    rm -rf ~/.npm

# Copy built artifacts from builder
COPY --from=builder /app/dist ./dist

# Copy emulator configuration files (JSON not compiled by TypeScript)
COPY --from=builder /app/src/emulators/config ./dist/emulators/config

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Create logs directory with proper permissions
RUN mkdir -p /app/logs && \
    chown -R nodejs:nodejs /app

USER nodejs

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

CMD ["node", "dist/server.js"]
