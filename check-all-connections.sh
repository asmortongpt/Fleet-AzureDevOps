#!/bin/bash

# Fleet Management System - Comprehensive Connection Check
# This script checks all connections, endpoints, AI services, and emulators

echo "=================================="
echo "Fleet Connection Health Check"
echo "=================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

check_endpoint() {
    local name=$1
    local url=$2
    local expected_code=${3:-200}

    response=$(curl -s -o /dev/null -w "%{http_code}" "$url" 2>/dev/null)

    if [ "$response" == "$expected_code" ]; then
        echo -e "${GREEN}✓${NC} $name: OK (HTTP $response)"
        return 0
    else
        echo -e "${RED}✗${NC} $name: FAILED (HTTP $response, expected $expected_code)"
        return 1
    fi
}

check_json_endpoint() {
    local name=$1
    local url=$2

    response=$(curl -s "$url" 2>/dev/null)

    if echo "$response" | python3 -m json.tool >/dev/null 2>&1; then
        echo -e "${GREEN}✓${NC} $name: OK"
        echo "  Response: $(echo $response | head -c 100)..."
        return 0
    else
        echo -e "${RED}✗${NC} $name: FAILED (Invalid JSON or no response)"
        return 1
    fi
}

# Counter for results
total=0
passed=0
failed=0

echo "1. API Server Health"
echo "-------------------"
check_json_endpoint "API Health" "http://localhost:3000/api/health"
((total++)); [ $? -eq 0 ] && ((passed++)) || ((failed++))

check_json_endpoint "System Health" "http://localhost:3000/api/health/system"
((total++)); [ $? -eq 0 ] && ((passed++)) || ((failed++))

echo ""
echo "2. Emulator Endpoints"
echo "--------------------"
check_json_endpoint "Emulator Status" "http://localhost:3000/api/emulator/status"
((total++)); [ $? -eq 0 ] && ((passed++)) || ((failed++))

check_json_endpoint "Video Library" "http://localhost:3000/api/emulator/video/library"
((total++)); [ $? -eq 0 ] && ((passed++)) || ((failed++))

check_json_endpoint "Video Streams" "http://localhost:3000/api/emulator/video/streams"
((total++)); [ $? -eq 0 ] && ((passed++)) || ((failed++))

check_json_endpoint "Radio Channels" "http://localhost:3000/api/emulator/radio/channels"
((total++)); [ $? -eq 0 ] && ((passed++)) || ((failed++))

check_json_endpoint "OBD2 PIDs" "http://localhost:3000/api/emulator/obd2/pids"
((total++)); [ $? -eq 0 ] && ((passed++)) || ((failed++))

echo ""
echo "3. Frontend Servers"
echo "------------------"
check_endpoint "Frontend Dev Server" "http://localhost:5173" 200
((total++)); [ $? -eq 0 ] && ((passed++)) || ((failed++))

echo ""
echo "4. Database Connection"
echo "---------------------"
if [ -f "api/src/config/database.ts" ]; then
    echo -e "${GREEN}✓${NC} Database config exists"
    ((total++)); ((passed++))
else
    echo -e "${RED}✗${NC} Database config missing"
    ((total++)); ((failed++))
fi

echo ""
echo "5. Environment Variables"
echo "-----------------------"
# Check for critical env vars
env_vars=("ANTHROPIC_API_KEY" "OPENAI_API_KEY" "AZURE_CLIENT_ID")
for var in "${env_vars[@]}"; do
    if [ -n "${!var}" ]; then
        echo -e "${GREEN}✓${NC} $var is set"
        ((total++)); ((passed++))
    else
        echo -e "${YELLOW}⚠${NC} $var not set in current environment"
        ((total++))
    fi
done

echo ""
echo "6. Service Availability"
echo "----------------------"
# Check if services are running
if lsof -i :3000 >/dev/null 2>&1; then
    echo -e "${GREEN}✓${NC} API Server (port 3000): Running"
    ((total++)); ((passed++))
else
    echo -e "${RED}✗${NC} API Server (port 3000): Not running"
    ((total++)); ((failed++))
fi

if lsof -i :5173 >/dev/null 2>&1; then
    echo -e "${GREEN}✓${NC} Frontend Server (port 5173): Running"
    ((total++)); ((passed++))
else
    echo -e "${RED}✗${NC} Frontend Server (port 5173): Not running"
    ((total++)); ((failed++))
fi

echo ""
echo "=================================="
echo "Summary"
echo "=================================="
echo "Total Checks: $total"
echo -e "${GREEN}Passed: $passed${NC}"
echo -e "${RED}Failed: $failed${NC}"

if [ $failed -eq 0 ]; then
    echo -e "\n${GREEN}All systems operational!${NC}"
    exit 0
else
    echo -e "\n${YELLOW}Some systems need attention${NC}"
    exit 1
fi
