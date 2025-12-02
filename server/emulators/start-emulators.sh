#!/bin/bash
# Start all WebSocket emulators

cd "$(dirname "$0")"

echo "Starting Fleet Management WebSocket Emulators..."
echo ""
echo "OBD2 Emulator: http://localhost:8081"
echo "Radio Emulator: http://localhost:8082"
echo "Dispatch Emulator: http://localhost:8083"
echo ""

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
  echo "Installing dependencies..."
  npm install
fi

# Start all emulators concurrently
npm run start:all
