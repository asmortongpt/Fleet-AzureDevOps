#!/bin/bash
###############################################################################
# Fleet Management Startup Script with SSO Health Checks
#
# This script ensures all dependencies are running before starting the application.
# It prevents SSO authentication failures by verifying:
# 1. Docker is running
# 2. PostgreSQL database is accessible
# 3. Database schema includes SSO columns
# 4. API server starts successfully
# 5. Frontend server starts successfully
#
# Usage: ./start-with-sso.sh
###############################################################################

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🚀 Fleet Management Startup - SSO Enabled"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Check if Docker is running
echo -e "${BLUE}📍 Step 1: Checking Docker...${NC}"
if ! docker ps > /dev/null 2>&1; then
    echo -e "${YELLOW}⚠️  Docker is not running. Starting Docker Desktop...${NC}"
    open -a Docker
    echo "   Waiting for Docker to start (30 seconds)..."
    sleep 30

    # Verify Docker started
    if ! docker ps > /dev/null 2>&1; then
        echo -e "${RED}❌ Failed to start Docker. Please start Docker Desktop manually.${NC}"
        exit 1
    fi
fi
echo -e "${GREEN}✅ Docker is running${NC}"
echo ""

# Check PostgreSQL
echo -e "${BLUE}📍 Step 2: Checking PostgreSQL...${NC}"
if ! PGPASSWORD=fleet_test_pass psql -h localhost -U fleet_user -d fleet_test -c "SELECT 1;" > /dev/null 2>&1; then
    echo -e "${YELLOW}⚠️  PostgreSQL not accessible. Checking for Docker container...${NC}"

    # Check if container exists
    if docker ps -a | grep -q fleet-orchestration-db; then
        echo "   Starting existing PostgreSQL container..."
        docker start fleet-orchestration-db
        sleep 5
    else
        echo -e "${RED}❌ PostgreSQL container not found.${NC}"
        echo ""
        echo "Please create a PostgreSQL container with:"
        echo "  docker run -d --name fleet-orchestration-db \\"
        echo "    -e POSTGRES_DB=fleet_test \\"
        echo "    -e POSTGRES_USER=fleet_user \\"
        echo "    -e POSTGRES_PASSWORD=fleet_test_pass \\"
        echo "    -p 5432:5432 \\"
        echo "    postgres:16-alpine"
        exit 1
    fi

    # Verify PostgreSQL is now accessible
    sleep 3
    if ! PGPASSWORD=fleet_test_pass psql -h localhost -U fleet_user -d fleet_test -c "SELECT 1;" > /dev/null 2>&1; then
        echo -e "${RED}❌ PostgreSQL still not accessible${NC}"
        exit 1
    fi
fi
echo -e "${GREEN}✅ PostgreSQL is accessible${NC}"

# Verify SSO schema
echo "   Checking SSO schema..."
COLUMNS=$(PGPASSWORD=fleet_test_pass psql -h localhost -U fleet_user -d fleet_test -t -c "SELECT COUNT(*) FROM information_schema.columns WHERE table_name='users' AND column_name IN ('provider', 'provider_user_id', 'azure_tenant_id');" 2>/dev/null | tr -d ' ')

if [ "$COLUMNS" != "3" ]; then
    echo -e "${RED}❌ SSO columns missing in database (found $COLUMNS/3)${NC}"
    echo ""
    echo "Please run the SSO migration:"
    echo "  PGPASSWORD=fleet_test_pass psql -h localhost -U fleet_user -d fleet_test < api/add_sso_columns.sql"
    exit 1
fi
echo -e "${GREEN}✅ SSO schema is correct${NC}"
echo ""

# Kill existing servers
echo -e "${BLUE}📍 Step 3: Stopping existing servers...${NC}"
pkill -f "tsx.*src/server.ts" 2>/dev/null || true
pkill -f "vite.*5174" 2>/dev/null || true
sleep 2
echo -e "${GREEN}✅ Existing servers stopped${NC}"
echo ""

# Start API server
echo -e "${BLUE}📍 Step 4: Starting API server...${NC}"
cd "$(dirname "$0")/api"
npm run dev > /tmp/fleet-api-server.log 2>&1 &
API_PID=$!
cd ..
echo "   API server starting (PID: $API_PID)"
echo "   Waiting for API to be ready..."

# Wait for API to be ready (max 30 seconds)
for i in {1..30}; do
    if lsof -ti:3001 > /dev/null 2>&1; then
        echo -e "${GREEN}✅ API server is running on port 3001${NC}"
        break
    fi
    sleep 1
    if [ $i -eq 30 ]; then
        echo -e "${RED}❌ API server failed to start. Check logs: tail -f /tmp/fleet-api-server.log${NC}"
        exit 1
    fi
done
echo ""

# Test SSO endpoint
echo -e "${BLUE}📍 Step 5: Testing SSO endpoint...${NC}"
sleep 3
RESPONSE=$(curl -s -w "%{http_code}" -o /dev/null \
    -X POST http://localhost:3001/api/auth/microsoft/exchange \
    -H "Content-Type: application/json" \
    -d '{"idToken":"invalid"}' 2>/dev/null)

if [ "$RESPONSE" = "400" ]; then
    echo -e "${GREEN}✅ SSO endpoint responding correctly${NC}"
elif [ "$RESPONSE" = "500" ]; then
    echo -e "${RED}❌ SSO endpoint returning server error (database connection issue?)${NC}"
    echo "   Check logs: tail -f /tmp/fleet-api-server.log"
    exit 1
else
    echo -e "${YELLOW}⚠️  Unexpected SSO response: $RESPONSE (continuing anyway)${NC}"
fi
echo ""

# Start Frontend server
echo -e "${BLUE}📍 Step 6: Starting Frontend server...${NC}"
npm run dev > /tmp/fleet-frontend-server.log 2>&1 &
FRONTEND_PID=$!
echo "   Frontend server starting (PID: $FRONTEND_PID)"
echo "   Waiting for Frontend to be ready..."

# Wait for Frontend to be ready (max 30 seconds)
for i in {1..30}; do
    if lsof -ti:5174 > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Frontend server is running on port 5174${NC}"
        break
    fi
    sleep 1
    if [ $i -eq 30 ]; then
        echo -e "${RED}❌ Frontend server failed to start. Check logs: tail -f /tmp/fleet-frontend-server.log${NC}"
        exit 1
    fi
done
echo ""

# Final health check
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${GREEN}🎉 ALL SERVICES STARTED SUCCESSFULLY${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📍 Service URLs:"
echo "   • Frontend:  http://localhost:5174"
echo "   • API:       http://localhost:3001"
echo "   • Database:  postgresql://fleet_user@localhost:5432/fleet_test"
echo ""
echo "📍 Logs:"
echo "   • API:       tail -f /tmp/fleet-api-server.log"
echo "   • Frontend:  tail -f /tmp/fleet-frontend-server.log"
echo ""
echo "📍 Health Check:"
echo "   • Run:       ./check-sso-health.sh"
echo ""
echo "🔐 SSO Authentication is ready!"
echo ""
echo "Press Ctrl+C to stop all servers"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Wait for Ctrl+C
trap 'echo ""; echo "Stopping servers..."; kill $API_PID $FRONTEND_PID 2>/dev/null; exit 0' INT
wait
