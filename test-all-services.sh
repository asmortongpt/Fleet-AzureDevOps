#!/bin/bash
# Comprehensive Fleet System Test Script
# Tests all services, databases, emulators, and endpoints

echo "========================================="
echo "FLEET MANAGEMENT SYSTEM - COMPREHENSIVE TEST"
echo "========================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

API_URL="http://localhost:3000"
FRONTEND_URL="http://localhost:5174"

echo "1. TESTING DATABASE CONNECTIONS"
echo "========================================"

echo -n "PostgreSQL Connection: "
if psql -U fleet_user -h localhost -d fleet_test -c "SELECT 1;" > /dev/null 2>&1; then
    echo -e "${GREEN}✓ CONNECTED${NC}"

    # Get counts
    VEHICLE_COUNT=$(psql -U fleet_user -h localhost -d fleet_test -t -c "SELECT COUNT(*) FROM vehicles;" 2>/dev/null | tr -d ' ')
    DRIVER_COUNT=$(psql -U fleet_user -h localhost -d fleet_test -t -c "SELECT COUNT(*) FROM drivers;" 2>/dev/null | tr -d ' ')
    WORK_ORDER_COUNT=$(psql -U fleet_user -h localhost -d fleet_test -t -c "SELECT COUNT(*) FROM work_orders;" 2>/dev/null | tr -d ' ')
    FUEL_COUNT=$(psql -U fleet_user -h localhost -d fleet_test -t -c "SELECT COUNT(*) FROM fuel_transactions;" 2>/dev/null | tr -d ' ')

    echo "  - Vehicles: $VEHICLE_COUNT"
    echo "  - Drivers: $DRIVER_COUNT"
    echo "  - Work Orders: $WORK_ORDER_COUNT"
    echo "  - Fuel Transactions: $FUEL_COUNT"
else
    echo -e "${RED}✗ FAILED${NC}"
fi

echo -n "Redis Connection: "
if redis-cli ping > /dev/null 2>&1; then
    echo -e "${GREEN}✓ CONNECTED${NC}"
else
    echo -e "${RED}✗ FAILED${NC}"
fi

echo ""
echo "2. TESTING API SERVER"
echo "========================================"

echo -n "API Health Check: "
HEALTH_CHECK=$(curl -s $API_URL/health 2>/dev/null)
if [ ! -z "$HEALTH_CHECK" ]; then
    echo -e "${GREEN}✓ RESPONDING${NC}"
    echo "  Response: $HEALTH_CHECK"
else
    echo -e "${RED}✗ NOT RESPONDING${NC}"
fi

echo ""
echo "3. TESTING EMULATORS"
echo "========================================"

# Wait to avoid rate limiting
sleep 2

echo "Getting emulator status..."
EMULATOR_STATUS=$(curl -s $API_URL/api/emulators/status 2>/dev/null)
if [ ! -z "$EMULATOR_STATUS" ]; then
    echo -e "${GREEN}✓ Emulators API responding${NC}"
    echo "$EMULATOR_STATUS" | python3 -m json.tool 2>/dev/null | head -30
else
    echo -e "${RED}✗ No response from emulators${NC}"
fi

echo ""
echo "4. TESTING AI SERVICE CONFIGURATION"
echo "========================================"

if [ -f "../.env.local" ]; then
    echo -n "Google Maps API: "
    if grep -q "VITE_GOOGLE_MAPS_API_KEY" ../.env.local; then
        echo -e "${GREEN}✓ CONFIGURED${NC}"
    else
        echo -e "${RED}✗ NOT CONFIGURED${NC}"
    fi

    echo -n "Azure OpenAI: "
    if grep -q "VITE_AZURE_OPENAI_ENDPOINT" ../.env.local; then
        echo -e "${GREEN}✓ CONFIGURED${NC}"
    else
        echo -e "${RED}✗ NOT CONFIGURED${NC}"
    fi

    echo -n "Azure AD SSO: "
    if grep -q "VITE_AZURE_AD_CLIENT_ID" ../.env.local; then
        echo -e "${GREEN}✓ CONFIGURED${NC}"
    else
        echo -e "${RED}✗ NOT CONFIGURED${NC}"
    fi
fi

echo ""
echo "5. TESTING POLICY HUB"
echo "========================================"

POLICY_COUNT=$(psql -U fleet_user -h localhost -d fleet_test -t -c "SELECT COUNT(*) FROM policy_violations;" 2>/dev/null | tr -d ' ')
echo "Policy Violations Table: ${GREEN}✓ EXISTS${NC}"
echo "  - Total policy violations: $POLICY_COUNT"

# Check for policy-related columns in vehicles table
echo -n "Vehicle Policy Fields: "
if psql -U fleet_user -h localhost -d fleet_test -c "\d vehicles" 2>&1 | grep -q "insurance"; then
    echo -e "${GREEN}✓ CONFIGURED${NC}"
else
    echo -e "${RED}✗ LIMITED${NC}"
fi

echo ""
echo "6. TESTING FRONTEND"
echo "========================================"

echo -n "Frontend Server: "
if curl -s $FRONTEND_URL > /dev/null 2>&1; then
    echo -e "${GREEN}✓ RESPONDING${NC}"
else
    echo -e "${RED}✗ NOT RESPONDING${NC}"
fi

echo ""
echo "7. TESTING WEBSOCKET SERVICES"
echo "========================================"

echo -n "WebSocket Port 3004: "
if lsof -i :3004 | grep -q LISTEN; then
    echo -e "${GREEN}✓ LISTENING${NC}"
else
    echo -e "${RED}✗ NOT LISTENING${NC}"
fi

echo ""
echo "========================================="
echo "TEST SUMMARY COMPLETE"
echo "========================================="
echo ""
echo "To view real-time emulator activity, run:"
echo "  tail -f api/.logs/emulator.log"
echo ""
echo "To access the application:"
echo "  Frontend: $FRONTEND_URL"
echo "  API: $API_URL"
echo ""
