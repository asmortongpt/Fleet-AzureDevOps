#!/bin/bash

echo "=== Fleet Local Connectivity Test ==="
echo ""
echo "Date: $(date)"
echo ""

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 1. Frontend Test
echo "1. Testing Frontend (http://localhost:5173)..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:5173)
if [ "$HTTP_CODE" = "200" ]; then
    echo -e "   ${GREEN}✅ Frontend: Running (HTTP $HTTP_CODE)${NC}"
    FRONTEND_STATUS="PASS"
else
    echo -e "   ${RED}✗ Frontend: Not responding (HTTP $HTTP_CODE)${NC}"
    FRONTEND_STATUS="FAIL"
fi

# 2. API Health Check
echo "2. Testing API Health (http://localhost:3000/api/health)..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/health 2>/dev/null)
if [ "$HTTP_CODE" = "200" ]; then
    echo -e "   ${GREEN}✅ API Health: Running (HTTP $HTTP_CODE)${NC}"
    API_HEALTH_STATUS="PASS"
else
    echo -e "   ${RED}✗ API Health: Not running (HTTP $HTTP_CODE)${NC}"
    API_HEALTH_STATUS="FAIL"
fi

# 3. API Vehicles Endpoint
echo "3. Testing API Vehicles (http://localhost:3000/api/vehicles)..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_CODE}" http://localhost:3000/api/vehicles 2>/dev/null)
if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "401" ]; then
    echo -e "   ${GREEN}✅ API Vehicles: Responding (HTTP $HTTP_CODE)${NC}"
    API_VEHICLES_STATUS="PASS"
else
    echo -e "   ${RED}✗ API Vehicles: Not responding (HTTP $HTTP_CODE)${NC}"
    API_VEHICLES_STATUS="FAIL"
fi

# 4. Emulator Status Test
echo "4. Testing Emulator Status (http://localhost:3000/api/emulator/status)..."
RESPONSE=$(curl -s http://localhost:3000/api/emulator/status 2>/dev/null)
if echo "$RESPONSE" | grep -q "success"; then
    echo -e "   ${GREEN}✅ Emulator: Responding${NC}"
    echo "   Response: $RESPONSE" | head -c 100
    EMULATOR_STATUS="PASS"
else
    echo -e "   ${RED}✗ Emulator: Not responding${NC}"
    EMULATOR_STATUS="FAIL"
fi

# 5. Google Maps Key Check
echo "5. Checking Google Maps Configuration..."
if grep -q "VITE_GOOGLE_MAPS_API_KEY=AIza" .env 2>/dev/null; then
    echo -e "   ${GREEN}✅ Google Maps API Key: Configured${NC}"
    MAPS_CONFIG="PASS"
else
    echo -e "   ${RED}✗ Google Maps API Key: Missing${NC}"
    MAPS_CONFIG="FAIL"
fi

# 6. API URL Check
echo "6. Checking API URL Configuration..."
if grep -q "VITE_API_URL" .env 2>/dev/null; then
    API_URL=$(grep "VITE_API_URL" .env | cut -d'=' -f2)
    if [ -n "$API_URL" ]; then
        echo -e "   ${GREEN}✅ API URL: Configured ($API_URL)${NC}"
        API_URL_CONFIG="PASS"
    else
        echo -e "   ${YELLOW}⚠️  API URL: Empty (should be http://localhost:3000)${NC}"
        API_URL_CONFIG="WARN"
    fi
else
    echo -e "   ${RED}✗ API URL: Not found in .env${NC}"
    API_URL_CONFIG="FAIL"
fi

# 7. Process Check
echo "7. Checking Running Processes..."
if ps aux | grep -v grep | grep -q "vite"; then
    echo -e "   ${GREEN}✅ Vite Dev Server: Running${NC}"
    VITE_PROCESS="PASS"
else
    echo -e "   ${RED}✗ Vite Dev Server: Not running${NC}"
    VITE_PROCESS="FAIL"
fi

if ps aux | grep -v grep | grep -q "tsx.*server.ts"; then
    echo -e "   ${GREEN}✅ API Server: Running${NC}"
    API_PROCESS="PASS"
else
    echo -e "   ${RED}✗ API Server: Not running${NC}"
    API_PROCESS="FAIL"
fi

# 8. Port Check
echo "8. Checking Ports..."
if lsof -i :5173 -t >/dev/null 2>&1; then
    echo -e "   ${GREEN}✅ Port 5173: In use (Frontend)${NC}"
    PORT_5173="PASS"
else
    echo -e "   ${RED}✗ Port 5173: Not in use${NC}"
    PORT_5173="FAIL"
fi

if lsof -i :3000 -t >/dev/null 2>&1; then
    echo -e "   ${GREEN}✅ Port 3000: In use (API)${NC}"
    PORT_3000="PASS"
else
    echo -e "   ${RED}✗ Port 3000: Not in use${NC}"
    PORT_3000="FAIL"
fi

# Summary
echo ""
echo "=== Summary ==="
echo ""

TOTAL=0
PASSED=0

for status in "$FRONTEND_STATUS" "$API_HEALTH_STATUS" "$API_VEHICLES_STATUS" "$EMULATOR_STATUS" "$MAPS_CONFIG" "$VITE_PROCESS" "$API_PROCESS" "$PORT_5173" "$PORT_3000"; do
    TOTAL=$((TOTAL + 1))
    if [ "$status" = "PASS" ]; then
        PASSED=$((PASSED + 1))
    fi
done

PERCENTAGE=$((PASSED * 100 / TOTAL))

echo "Tests Passed: $PASSED / $TOTAL ($PERCENTAGE%)"

if [ $PERCENTAGE -eq 100 ]; then
    echo -e "${GREEN}Status: ALL SYSTEMS OPERATIONAL ✅${NC}"
elif [ $PERCENTAGE -ge 70 ]; then
    echo -e "${YELLOW}Status: PARTIAL - Some services need attention ⚠️${NC}"
else
    echo -e "${RED}Status: CRITICAL - Multiple services down ✗${NC}"
fi

echo ""
echo "=== Recommendations ==="
echo ""

if [ "$API_PROCESS" = "FAIL" ]; then
    echo -e "${YELLOW}• Start API server: cd api && npm run dev${NC}"
fi

if [ "$VITE_PROCESS" = "FAIL" ]; then
    echo -e "${YELLOW}• Start Frontend: npm run dev${NC}"
fi

if [ "$API_URL_CONFIG" = "WARN" ] || [ "$API_URL_CONFIG" = "FAIL" ]; then
    echo -e "${YELLOW}• Update .env: echo 'VITE_API_URL=http://localhost:3000' >> .env${NC}"
fi

if [ "$EMULATOR_STATUS" = "FAIL" ] && [ "$API_PROCESS" = "PASS" ]; then
    echo -e "${YELLOW}• Start emulators: curl -X POST http://localhost:3000/api/emulator/start${NC}"
fi

echo ""
echo "=== Test Complete ===$(date)${NC}"
