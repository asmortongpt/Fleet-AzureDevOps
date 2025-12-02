#!/usr/bin/env bash
#
# SSO Diagnostics Script
# Identifies why "Failed to initiate authentication" error is occurring
#

set -euo pipefail

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "SSO DIAGNOSTICS - Fleet Management System"
echo "═══════════════════════════════════════════════════════════"
echo ""

# Check 1: Environment file exists
echo -e "${BLUE}[CHECK 1]${NC} .env file existence"
if [ -f ".env" ]; then
    echo -e "${GREEN}✓ PASS${NC} - .env file exists"
else
    echo -e "${RED}✗ FAIL${NC} - .env file not found"
fi
echo ""

# Check 2: Frontend environment variables
echo -e "${BLUE}[CHECK 2]${NC} Frontend Azure AD configuration"
if grep -q "VITE_AZURE_AD_CLIENT_ID=" .env 2>/dev/null; then
    CLIENT_ID=$(grep "VITE_AZURE_AD_CLIENT_ID=" .env | cut -d'=' -f2)
    if [ -n "$CLIENT_ID" ] && [ "$CLIENT_ID" != "YOUR_CLIENT_ID_HERE" ]; then
        echo -e "${GREEN}✓ PASS${NC} - VITE_AZURE_AD_CLIENT_ID is set"
        echo "  Value: $CLIENT_ID"
    else
        echo -e "${RED}✗ FAIL${NC} - VITE_AZURE_AD_CLIENT_ID is placeholder or empty"
    fi
else
    echo -e "${RED}✗ FAIL${NC} - VITE_AZURE_AD_CLIENT_ID not found in .env"
fi

if grep -q "VITE_AZURE_AD_TENANT_ID=" .env 2>/dev/null; then
    TENANT_ID=$(grep "VITE_AZURE_AD_TENANT_ID=" .env | cut -d'=' -f2)
    if [ -n "$TENANT_ID" ] && [ "$TENANT_ID" != "YOUR_TENANT_ID_HERE" ]; then
        echo -e "${GREEN}✓ PASS${NC} - VITE_AZURE_AD_TENANT_ID is set"
        echo "  Value: $TENANT_ID"
    else
        echo -e "${RED}✗ FAIL${NC} - VITE_AZURE_AD_TENANT_ID is placeholder or empty"
    fi
else
    echo -e "${RED}✗ FAIL${NC} - VITE_AZURE_AD_TENANT_ID not found in .env"
fi
echo ""

# Check 3: Backend environment variables
echo -e "${BLUE}[CHECK 3]${NC} Backend Azure AD configuration"
if grep -q "AZURE_AD_CLIENT_SECRET=" .env 2>/dev/null; then
    CLIENT_SECRET=$(grep "AZURE_AD_CLIENT_SECRET=" .env | cut -d'=' -f2)
    if [ -n "$CLIENT_SECRET" ] && [ "$CLIENT_SECRET" != "YOUR_CLIENT_SECRET_HERE" ]; then
        echo -e "${GREEN}✓ PASS${NC} - AZURE_AD_CLIENT_SECRET is set"
        echo "  Value: [REDACTED]"
    else
        echo -e "${YELLOW}⚠ WARN${NC} - AZURE_AD_CLIENT_SECRET is placeholder"
        echo "  This is needed for production but not DEV mode"
    fi
else
    echo -e "${YELLOW}⚠ WARN${NC} - AZURE_AD_CLIENT_SECRET not found in .env"
fi
echo ""

# Check 4: Database configuration
echo -e "${BLUE}[CHECK 4]${NC} Database configuration"
if grep -q "DATABASE_URL=" .env 2>/dev/null; then
    DB_URL=$(grep "DATABASE_URL=" .env | cut -d'=' -f2)
    if [ -n "$DB_URL" ] && [ "$DB_URL" != "YOUR_DB_URL_HERE" ]; then
        echo -e "${GREEN}✓ PASS${NC} - DATABASE_URL is set"
        # Extract just the hostname for security
        DB_HOST=$(echo "$DB_URL" | sed 's/.*@\([^:]*\).*/\1/')
        echo "  Host: $DB_HOST"
    else
        echo -e "${RED}✗ FAIL${NC} - DATABASE_URL is placeholder or empty"
        echo "  Backend requires database for tenant lookup"
    fi
else
    echo -e "${RED}✗ FAIL${NC} - DATABASE_URL not found in .env"
fi
echo ""

# Check 5: JWT Secret
echo -e "${BLUE}[CHECK 5]${NC} JWT Secret configuration"
if grep -q "JWT_SECRET=" .env 2>/dev/null; then
    JWT_SECRET=$(grep "JWT_SECRET=" .env | cut -d'=' -f2)
    if [ -n "$JWT_SECRET" ] && [ "$JWT_SECRET" != "YOUR_JWT_SECRET_HERE" ]; then
        echo -e "${GREEN}✓ PASS${NC} - JWT_SECRET is set"
        echo "  Length: ${#JWT_SECRET} characters (minimum 32 required)"
        if [ ${#JWT_SECRET} -ge 32 ]; then
            echo -e "${GREEN}✓${NC} Secret length is sufficient"
        else
            echo -e "${RED}✗${NC} Secret is too short (< 32 characters)"
        fi
    else
        echo -e "${RED}✗ FAIL${NC} - JWT_SECRET is placeholder or empty"
    fi
else
    echo -e "${RED}✗ FAIL${NC} - JWT_SECRET not found in .env"
fi
echo ""

# Check 6: Backend server status
echo -e "${BLUE}[CHECK 6]${NC} Backend server status"
API_PORT=${API_PORT:-5000}
if lsof -i :$API_PORT &> /dev/null; then
    echo -e "${GREEN}✓ PASS${NC} - Backend server is running on port $API_PORT"
else
    echo -e "${RED}✗ FAIL${NC} - Backend server is NOT running on port $API_PORT"
    echo "  You need to start the backend: npm run dev:api"
fi
echo ""

# Check 7: Frontend build mode
echo -e "${BLUE}[CHECK 7]${NC} Build mode detection"
if grep -q "NODE_ENV=production" .env 2>/dev/null; then
    echo -e "${YELLOW}⚠ INFO${NC} - NODE_ENV=production (SSO required)"
    echo "  In production mode, SSO must be fully configured"
else
    echo -e "${BLUE}ℹ INFO${NC} - NODE_ENV not set to production (likely DEV mode)"
    echo "  In DEV mode, authentication is bypassed"
    echo "  To test SSO, set NODE_ENV=production temporarily"
fi
echo ""

# Check 8: Test backend endpoint
echo -e "${BLUE}[CHECK 8]${NC} Backend SSO endpoint accessibility"
API_URL="${VITE_API_URL:-http://localhost:5000}"
HEALTH_URL="$API_URL/api/health"

if curl -sf "$HEALTH_URL" &> /dev/null; then
    echo -e "${GREEN}✓ PASS${NC} - Backend health endpoint accessible"
    echo "  URL: $HEALTH_URL"
else
    echo -e "${RED}✗ FAIL${NC} - Backend health endpoint not accessible"
    echo "  URL: $HEALTH_URL"
    echo "  Backend may not be running or misconfigured"
fi
echo ""

# Summary
echo "═══════════════════════════════════════════════════════════"
echo "SUMMARY & RECOMMENDATIONS"
echo "═══════════════════════════════════════════════════════════"
echo ""

echo -e "${BLUE}Likely Issues:${NC}"
echo ""
echo "1. Backend server not running"
echo "   ${YELLOW}→${NC} Start with: npm run dev:api"
echo ""
echo "2. Database not provisioned"
echo "   ${YELLOW}→${NC} Run: ./scripts/provision-database.sh production"
echo ""
echo "3. Testing in wrong mode"
echo "   ${YELLOW}→${NC} DEV mode bypasses SSO (check console logs)"
echo "   ${YELLOW}→${NC} To test SSO: temporarily set NODE_ENV=production in .env"
echo ""

echo -e "${BLUE}To Fix 'Failed to initiate authentication':${NC}"
echo ""
echo "OPTION A - Use DEV Mode (Recommended for local testing):"
echo "  1. Don't set NODE_ENV=production in .env"
echo "  2. Start backend: npm run dev:api"
echo "  3. Start frontend: npm run dev"
echo "  4. App will bypass SSO authentication"
echo ""
echo "OPTION B - Test Real SSO (Production simulation):"
echo "  1. Provision database: ./scripts/provision-database.sh production"
echo "  2. Register Azure AD app (if not done)"
echo "  3. Update .env with real Azure AD client secret"
echo "  4. Set NODE_ENV=production in .env"
echo "  5. Start backend: npm run dev:api"
echo "  6. Start frontend: npm run dev"
echo ""

echo "═══════════════════════════════════════════════════════════"
echo ""
