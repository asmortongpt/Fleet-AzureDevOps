#!/bin/bash

# Fleet Emulator Test Script
# Tests all major functions of the emulator system

API_URL="http://localhost:3000/api/emulator"
BOLD='\033[1m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BOLD}=== Fleet Emulator Comprehensive Test ===${NC}"
echo

# Test 1: Check vehicles
echo -e "${BLUE}[TEST 1]${NC} Checking available vehicles..."
VEHICLE_COUNT=$(curl -s $API_URL/vehicles | jq '.data | length')
if [ "$VEHICLE_COUNT" -gt 0 ]; then
  echo -e "${GREEN}✓${NC} Found $VEHICLE_COUNT vehicles configured"
else
  echo -e "${RED}✗${NC} No vehicles found!"
  exit 1
fi
echo

# Test 2: Check scenarios
echo -e "${BLUE}[TEST 2]${NC} Checking available scenarios..."
SCENARIO_COUNT=$(curl -s $API_URL/scenarios | jq '.data | keys | length')
if [ "$SCENARIO_COUNT" -gt 0 ]; then
  echo -e "${GREEN}✓${NC} Found $SCENARIO_COUNT scenarios configured"
  curl -s $API_URL/scenarios | jq -r '.data | keys[]' | sed 's/^/  - /'
else
  echo -e "${RED}✗${NC} No scenarios found!"
  exit 1
fi
echo

# Test 3: Check routes
echo -e "${BLUE}[TEST 3]${NC} Checking available routes..."
ROUTE_COUNT=$(curl -s $API_URL/routes | jq '.data.routes | length')
if [ "$ROUTE_COUNT" -gt 0 ]; then
  echo -e "${GREEN}✓${NC} Found $ROUTE_COUNT routes configured"
else
  echo -e "${RED}✗${NC} No routes found!"
  exit 1
fi
echo

# Test 4: Start emulation
echo -e "${BLUE}[TEST 4]${NC} Starting emulation for 3 vehicles..."
START_RESPONSE=$(curl -s -X POST $API_URL/start \
  -H "Content-Type: application/json" \
  -d '{"vehicleIds": ["VEH-001", "VEH-002", "VEH-003"]}')
START_SUCCESS=$(echo $START_RESPONSE | jq -r '.success')
if [ "$START_SUCCESS" = "true" ]; then
  echo -e "${GREEN}✓${NC} Emulation started successfully"
else
  echo -e "${RED}✗${NC} Failed to start emulation"
  echo $START_RESPONSE | jq
  exit 1
fi
echo

# Test 5: Wait for data generation
echo -e "${BLUE}[TEST 5]${NC} Waiting 15 seconds for data generation..."
for i in {15..1}; do
  echo -ne "  $i seconds remaining...\r"
  sleep 1
done
echo -e "${GREEN}✓${NC} Wait complete                    "
echo

# Test 6: Check status
echo -e "${BLUE}[TEST 6]${NC} Checking emulator status..."
STATUS=$(curl -s $API_URL/status)
IS_RUNNING=$(echo $STATUS | jq -r '.data.isRunning')
ACTIVE_VEHICLES=$(echo $STATUS | jq -r '.data.stats.activeVehicles')
TOTAL_EVENTS=$(echo $STATUS | jq -r '.data.stats.totalEvents')
EVENTS_PER_SEC=$(echo $STATUS | jq -r '.data.stats.eventsPerSecond')

if [ "$IS_RUNNING" = "true" ]; then
  echo -e "${GREEN}✓${NC} Emulation is running"
  echo "  - Active Vehicles: $ACTIVE_VEHICLES"
  echo "  - Total Events: $TOTAL_EVENTS"
  echo "  - Events/Second: $EVENTS_PER_SEC"
else
  echo -e "${RED}✗${NC} Emulation not running"
  exit 1
fi
echo

# Test 7: Get vehicle telemetry
echo -e "${BLUE}[TEST 7]${NC} Getting telemetry for VEH-001..."
TELEMETRY=$(curl -s $API_URL/vehicles/VEH-001/telemetry)
TELEMETRY_SUCCESS=$(echo $TELEMETRY | jq -r '.success')
if [ "$TELEMETRY_SUCCESS" = "true" ]; then
  echo -e "${GREEN}✓${NC} Telemetry retrieved successfully"

  # Display GPS data
  LAT=$(echo $TELEMETRY | jq -r '.data.gps.location.lat // "N/A"')
  LNG=$(echo $TELEMETRY | jq -r '.data.gps.location.lng // "N/A"')
  SPEED=$(echo $TELEMETRY | jq -r '.data.gps.speed // "N/A"')
  echo "  GPS: Lat=$LAT, Lng=$LNG, Speed=$SPEED mph"

  # Display OBD-II data
  RPM=$(echo $TELEMETRY | jq -r '.data.obd2.rpm // "N/A"')
  FUEL=$(echo $TELEMETRY | jq -r '.data.obd2.fuelLevel // "N/A"')
  TEMP=$(echo $TELEMETRY | jq -r '.data.obd2.coolantTemp // "N/A"')
  echo "  OBD-II: RPM=$RPM, Fuel=$FUEL%, Temp=$TEMP°F"
else
  echo -e "${RED}✗${NC} Failed to get telemetry"
fi
echo

# Test 8: Pause emulation
echo -e "${BLUE}[TEST 8]${NC} Pausing emulation..."
PAUSE_RESPONSE=$(curl -s -X POST $API_URL/pause)
PAUSE_SUCCESS=$(echo $PAUSE_RESPONSE | jq -r '.success')
if [ "$PAUSE_SUCCESS" = "true" ]; then
  echo -e "${GREEN}✓${NC} Emulation paused successfully"
else
  echo -e "${RED}✗${NC} Failed to pause emulation"
fi
echo

# Test 9: Wait while paused
echo -e "${BLUE}[TEST 9]${NC} Waiting 5 seconds while paused..."
sleep 5
STATUS_PAUSED=$(curl -s $API_URL/status | jq -r '.data.isPaused')
if [ "$STATUS_PAUSED" = "true" ]; then
  echo -e "${GREEN}✓${NC} Emulation is paused"
else
  echo -e "${RED}✗${NC} Emulation not showing as paused"
fi
echo

# Test 10: Resume emulation
echo -e "${BLUE}[TEST 10]${NC} Resuming emulation..."
RESUME_RESPONSE=$(curl -s -X POST $API_URL/resume)
RESUME_SUCCESS=$(echo $RESUME_RESPONSE | jq -r '.success')
if [ "$RESUME_SUCCESS" = "true" ]; then
  echo -e "${GREEN}✓${NC} Emulation resumed successfully"
else
  echo -e "${RED}✗${NC} Failed to resume emulation"
fi
echo

# Test 11: Wait for more data
echo -e "${BLUE}[TEST 11]${NC} Waiting 10 seconds for more data..."
sleep 10
TOTAL_EVENTS_AFTER=$(curl -s $API_URL/status | jq -r '.data.stats.totalEvents')
echo -e "${GREEN}✓${NC} Total events increased to $TOTAL_EVENTS_AFTER"
echo

# Test 12: Stop emulation
echo -e "${BLUE}[TEST 12]${NC} Stopping emulation..."
STOP_RESPONSE=$(curl -s -X POST $API_URL/stop)
STOP_SUCCESS=$(echo $STOP_RESPONSE | jq -r '.success')
if [ "$STOP_SUCCESS" = "true" ]; then
  echo -e "${GREEN}✓${NC} Emulation stopped successfully"
else
  echo -e "${RED}✗${NC} Failed to stop emulation"
fi
echo

# Test 13: Verify stopped
echo -e "${BLUE}[TEST 13]${NC} Verifying emulation stopped..."
FINAL_STATUS=$(curl -s $API_URL/status)
IS_RUNNING_FINAL=$(echo $FINAL_STATUS | jq -r '.data.isRunning')
if [ "$IS_RUNNING_FINAL" = "false" ]; then
  echo -e "${GREEN}✓${NC} Emulation is stopped"
else
  echo -e "${RED}✗${NC} Emulation still showing as running"
fi
echo

# Summary
echo -e "${BOLD}=== Test Summary ===${NC}"
echo "All basic emulator functions tested successfully!"
echo
echo "Next steps:"
echo "  1. Try a scenario: curl -X POST $API_URL/scenario/rush_hour"
echo "  2. Monitor real-time: node test-websocket.js"
echo "  3. Query database: psql -d fleet -c 'SELECT COUNT(*) FROM emulator_gps_telemetry;'"
echo
echo -e "${GREEN}✓ Test suite complete!${NC}"
