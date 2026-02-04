#!/bin/bash
###############################################################################
# SSO Health Check Script
#
# This script verifies all dependencies required for SSO authentication:
# - PostgreSQL database connectivity
# - API server health
# - Frontend server availability
# - SSO exchange endpoint functionality
#
# Usage: ./check-sso-health.sh
# Exit codes: 0 = healthy, 1 = unhealthy
###############################################################################

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔍 SSO AUTHENTICATION HEALTH CHECK"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

FAILED=0
WARNINGS=0

# Function to check if a service is running
check_service() {
    local name=$1
    local port=$2
    local url=$3

    echo -n "📍 Checking $name (port $port)... "

    if lsof -ti:$port > /dev/null 2>&1; then
        if [ -n "$url" ]; then
            if curl -sf "$url" > /dev/null 2>&1; then
                echo -e "${GREEN}✅ Running and responding${NC}"
                return 0
            else
                echo -e "${YELLOW}⚠️  Running but not responding${NC}"
                WARNINGS=$((WARNINGS + 1))
                return 1
            fi
        else
            echo -e "${GREEN}✅ Running${NC}"
            return 0
        fi
    else
        echo -e "${RED}❌ Not running${NC}"
        FAILED=$((FAILED + 1))
        return 1
    fi
}

# Function to check database
check_database() {
    echo -n "📍 Checking PostgreSQL database... "

    if PGPASSWORD=fleet_test_pass psql -h localhost -U fleet_user -d fleet_test -c "SELECT 1;" > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Connected${NC}"

        # Check if SSO columns exist
        echo -n "   Checking SSO schema... "
        COLUMNS=$(PGPASSWORD=fleet_test_pass psql -h localhost -U fleet_user -d fleet_test -t -c "SELECT COUNT(*) FROM information_schema.columns WHERE table_name='users' AND column_name IN ('provider', 'provider_user_id', 'azure_tenant_id');" 2>/dev/null | tr -d ' ')

        if [ "$COLUMNS" = "3" ]; then
            echo -e "${GREEN}✅ SSO columns present${NC}"
            return 0
        else
            echo -e "${RED}❌ SSO columns missing (found $COLUMNS/3)${NC}"
            FAILED=$((FAILED + 1))
            return 1
        fi
    else
        echo -e "${RED}❌ Cannot connect${NC}"
        FAILED=$((FAILED + 1))
        return 1
    fi
}

# Function to check SSO endpoint
check_sso_endpoint() {
    echo -n "📍 Checking SSO exchange endpoint... "

    # Test with invalid token (should return 400, not 500)
    RESPONSE=$(curl -s -w "%{http_code}" -o /tmp/sso-test-response.json \
        -X POST http://localhost:3001/api/auth/microsoft/exchange \
        -H "Content-Type: application/json" \
        -d '{"idToken":"invalid"}' 2>/dev/null)

    if [ "$RESPONSE" = "400" ]; then
        echo -e "${GREEN}✅ Responding correctly${NC}"
        return 0
    elif [ "$RESPONSE" = "500" ]; then
        echo -e "${RED}❌ Server error (likely database connection issue)${NC}"
        FAILED=$((FAILED + 1))
        return 1
    elif [ -z "$RESPONSE" ]; then
        echo -e "${RED}❌ No response${NC}"
        FAILED=$((FAILED + 1))
        return 1
    else
        echo -e "${YELLOW}⚠️  Unexpected response: $RESPONSE${NC}"
        WARNINGS=$((WARNINGS + 1))
        return 1
    fi
}

# Function to check Docker
check_docker() {
    echo -n "📍 Checking Docker... "

    if docker ps > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Running${NC}"
        return 0
    else
        echo -e "${YELLOW}⚠️  Docker not running (may be using local PostgreSQL)${NC}"
        WARNINGS=$((WARNINGS + 1))
        return 1
    fi
}

# Run all checks
echo "🔧 Checking Dependencies"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
check_docker
check_database
echo ""

echo "🌐 Checking Services"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
check_service "API Server" 3001 ""
check_service "Frontend Server" 5174 "http://localhost:5174"
echo ""

echo "🔐 Checking SSO Authentication"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
check_sso_endpoint
echo ""

# Summary
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if [ $FAILED -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    echo -e "${GREEN}✅ ALL CHECKS PASSED - SSO is healthy${NC}"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    exit 0
elif [ $FAILED -eq 0 ]; then
    echo -e "${YELLOW}⚠️  PASSED WITH $WARNINGS WARNING(S) - SSO should work but review warnings${NC}"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    exit 0
else
    echo -e "${RED}❌ FAILED - $FAILED critical issue(s), $WARNINGS warning(s)${NC}"
    echo ""
    echo "💡 Troubleshooting:"
    echo "   • Start Docker: open -a Docker"
    echo "   • Start PostgreSQL: docker start fleet-orchestration-db (if using Docker)"
    echo "   • Start API: cd api && npm run dev"
    echo "   • Start Frontend: npm run dev"
    echo "   • Check database: psql -h localhost -U fleet_user -d fleet_test"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    exit 1
fi
