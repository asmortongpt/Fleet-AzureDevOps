# ============================================================================
# Fleet Agent Worker - Multi-Stage Docker Build
# ============================================================================
# This Dockerfile creates a minimal, secure container for running autonomous
# worker agents that connect to the Fleet orchestrator and execute tasks.
# ============================================================================

# ============================================================================
# Stage 1: Builder - Install dependencies and build TypeScript
# ============================================================================
FROM node:20-alpine AS builder

WORKDIR /app

# Install build dependencies
RUN apk add --no-cache \
    git \
    python3 \
    make \
    g++

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install dependencies
RUN npm ci --production=false

# Copy source code
COPY src/ ./src/

# Build TypeScript
RUN npm run build

# ============================================================================
# Stage 2: Production - Minimal runtime image
# ============================================================================
FROM node:20-alpine

WORKDIR /workspace/Fleet

# Install runtime dependencies and tools
RUN apk add --no-cache \
    git \
    openssh-client \
    curl \
    ca-certificates

# Install Claude Code CLI (Anthropic)
RUN npm install -g @anthropic-ai/cli

# Create non-root user
RUN addgroup -g 1001 -S fleetagent && \
    adduser -u 1001 -S fleetagent -G fleetagent

# Copy built application from builder
COPY --from=builder /app/dist /app/dist
COPY --from=builder /app/node_modules /app/node_modules
COPY --from=builder /app/package.json /app/package.json

# Configure Git
RUN git config --global user.name "Fleet Agent" && \
    git config --global user.email "agent@fleet.local" && \
    git config --global init.defaultBranch main

# Create workspace directory
RUN mkdir -p /workspace/Fleet && \
    chown -R fleetagent:fleetagent /workspace /app

# Switch to non-root user
USER fleetagent

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD curl -f http://localhost:8080/health || exit 1

# Environment variables
ENV NODE_ENV=production \
    REPO_PATH=/workspace/Fleet \
    POLL_INTERVAL=30000 \
    HEARTBEAT_INTERVAL=60000

# Expose health check port
EXPOSE 8080

# Start agent
CMD ["node", "/app/dist/agent-worker.js"]
