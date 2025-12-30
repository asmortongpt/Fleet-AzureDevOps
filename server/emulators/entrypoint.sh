#!/bin/sh
# ============================================================================
# Fleet Emulators Entrypoint Script
# ============================================================================
# Starts all three emulators (OBD2, Radio, Dispatch) in background
# Handles graceful shutdown on SIGTERM/SIGINT
# ============================================================================

set -e

echo "================================================================"
echo "Starting Fleet Management Emulators"
echo "================================================================"

# Start OBD2 emulator in background
echo "[$(date '+%Y-%m-%d %H:%M:%S')] Starting OBD2 emulator on port 8081..."
node obd2-emulator.js &
OBD2_PID=$!
echo "[$(date '+%Y-%m-%d %H:%M:%S')] OBD2 emulator started (PID: $OBD2_PID)"

# Start Radio emulator in background
echo "[$(date '+%Y-%m-%d %H:%M:%S')] Starting Radio emulator on port 8082..."
node radio-emulator.js &
RADIO_PID=$!
echo "[$(date '+%Y-%m-%d %H:%M:%S')] Radio emulator started (PID: $RADIO_PID)"

# Start Dispatch emulator in background
echo "[$(date '+%Y-%m-%d %H:%M:%S')] Starting Dispatch emulator on port 8083..."
node dispatch-emulator.js &
DISPATCH_PID=$!
echo "[$(date '+%Y-%m-%d %H:%M:%S')] Dispatch emulator started (PID: $DISPATCH_PID)"

echo "================================================================"
echo "All emulators started successfully"
echo "================================================================"
echo "OBD2 Emulator:     ws://localhost:8081 (PID: $OBD2_PID)"
echo "Radio Emulator:    ws://localhost:8082 (PID: $RADIO_PID)"
echo "Dispatch Emulator: ws://localhost:8083 (PID: $DISPATCH_PID)"
echo "================================================================"

# Function to handle shutdown signals (SIGTERM, SIGINT)
shutdown() {
  echo ""
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] Shutdown signal received, stopping emulators..."

  # Send TERM signal to all background processes
  kill -TERM $OBD2_PID $RADIO_PID $DISPATCH_PID 2>/dev/null || true

  # Wait for all processes to terminate gracefully
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] Waiting for processes to stop..."
  wait $OBD2_PID $RADIO_PID $DISPATCH_PID 2>/dev/null || true

  echo "[$(date '+%Y-%m-%d %H:%M:%S')] All emulators stopped successfully"
  exit 0
}

# Trap SIGTERM (Docker/K8s stop) and SIGINT (Ctrl+C)
trap shutdown SIGTERM SIGINT

# Wait for any of the background processes to exit
# If one crashes, the container should restart (restart-policy in deployment)
wait -n

# If we get here, one of the emulators crashed
echo "[$(date '+%Y-%m-%d %H:%M:%S')] ERROR: One or more emulators crashed!"
echo "[$(date '+%Y-%m-%d %H:%M:%S')] Shutting down remaining processes..."
shutdown
