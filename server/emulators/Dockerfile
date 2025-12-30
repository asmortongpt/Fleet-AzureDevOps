# ============================================================================
# Fleet Management Emulators - Production Dockerfile
# ============================================================================
# Runs OBD2, Radio, and Dispatch emulators in a single container
# Lightweight Socket.IO servers for real-time WebSocket communication
# ============================================================================

FROM node:20-alpine

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

WORKDIR /app

# Create minimal package.json for emulators
RUN echo '{ \
  "name": "fleet-emulators", \
  "version": "1.0.0", \
  "description": "Fleet Management Emulators (OBD2, Radio, Dispatch)", \
  "main": "index.js", \
  "scripts": { \
    "start": "./entrypoint.sh" \
  }, \
  "dependencies": { \
    "socket.io": "^4.6.1" \
  } \
}' > package.json

# Install socket.io (only production dependency)
RUN npm install --production

# Copy emulator files
COPY --chown=nodejs:nodejs obd2-emulator.js ./
COPY --chown=nodejs:nodejs radio-emulator.js ./
COPY --chown=nodejs:nodejs dispatch-emulator.js ./

# Copy entrypoint script
COPY --chown=nodejs:nodejs entrypoint.sh ./

# Make entrypoint executable
RUN chmod +x entrypoint.sh

# Switch to non-root user
USER nodejs

# Expose all emulator ports
EXPOSE 8081 8082 8083

# Health check (checks if OBD2 emulator is responding on port 8081)
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "require('http').get('http://localhost:8081', () => process.exit(0)).on('error', () => process.exit(1));"

# Use dumb-init to handle signals
ENTRYPOINT ["dumb-init", "--"]

# Start all emulators via entrypoint script
CMD ["./entrypoint.sh"]

# ============================================================================
# Port Mapping:
# ============================================================================
# 8081 - OBD2 Emulator (vehicle telemetry)
# 8082 - Radio Emulator (radio communications)
# 8083 - Dispatch Emulator (dispatch messages)
# ============================================================================

# ============================================================================
# Build Instructions:
# ============================================================================
# cd /Users/andrewmorton/Documents/GitHub/fleet-local/server/emulators
# docker build -t fleetacr.azurecr.io/fleet-emulators:latest .
# docker push fleetacr.azurecr.io/fleet-emulators:latest
# ============================================================================
