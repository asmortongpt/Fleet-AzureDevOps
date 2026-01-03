#!/bin/bash
cd /Users/andrewmorton/Documents/GitHub/Fleet/api

echo "Starting server..."
npx tsx src/server.ts > /tmp/fleet-server.log 2>&1 &
SERVER_PID=$!

echo "Waiting 8 seconds for startup..."
sleep 8

if kill -0 $SERVER_PID 2>/dev/null; then
  echo "✅ SERVER IS RUNNING (PID: $SERVER_PID)"
  echo "Testing health endpoint..."
  curl -s http://localhost:3001/health || echo "Health check failed"
  kill $SERVER_PID
  echo "✅ Server test complete"
  exit 0
else
  echo "❌ Server died during startup"
  echo "Last 50 lines of log:"
  tail -50 /tmp/fleet-server.log
  exit 1
fi
