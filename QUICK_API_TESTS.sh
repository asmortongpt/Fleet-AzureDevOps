#!/bin/bash
# Fleet Manager - Quick API Tests for Demo
# Run these during the demo to show live functionality

BASE_URL="https://fleet.capitaltechalliance.com"
API_URL="${BASE_URL}/api"

echo "🚀 Fleet Manager API - Live Demo Tests"
echo "========================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 1. Health Check
echo -e "${BLUE}1. API Health Check${NC}"
echo "GET ${API_URL}/health"
curl -s "${API_URL}/health" | jq '.'
echo ""
echo "---"
echo ""

# 2. List Telematics Providers
echo -e "${BLUE}2. List Telematics Providers${NC}"
echo "GET ${API_URL}/telematics/providers"
echo "Note: Remove -H Authorization if endpoint is public"
# curl -s "${API_URL}/telematics/providers" \
#   -H "Authorization: Bearer YOUR_TOKEN_HERE" | jq '.'
echo "Expected: Samsara, Geotab, Verizon, Motive, Smartcar"
echo ""
echo "---"
echo ""

# 3. Get API Documentation
echo -e "${BLUE}3. API Documentation${NC}"
echo "Open in browser: ${API_URL}/docs"
echo ""
echo "---"
echo ""

# 4. Smartcar OAuth URL
echo -e "${BLUE}4. Smartcar OAuth URL (Example)${NC}"
echo "GET ${API_URL}/smartcar/connect?vehicle_id=1"
echo "Returns: OAuth authorization URL for connecting vehicle"
echo ""
echo "---"
echo ""

# 5. Test Samsara Sync (Admin only)
echo -e "${BLUE}5. Manual Samsara Sync${NC}"
echo "POST ${API_URL}/telematics/sync"
echo "Body: {\"sync_type\": \"full\"}"
echo "Note: Requires admin JWT token"
echo ""
echo "---"
echo ""

# 6. Dashboard Data
echo -e "${BLUE}6. Fleet Dashboard Data${NC}"
echo "GET ${API_URL}/telematics/dashboard"
echo "Returns: Latest vehicle locations, safety events, diagnostics"
echo ""
echo "---"
echo ""

echo ""
echo -e "${GREEN}✅ All endpoints are documented at: ${API_URL}/docs${NC}"
echo ""
echo "🔑 To get a JWT token for authenticated requests:"
echo "   1. Login with Microsoft SSO at ${BASE_URL}/login"
echo "   2. Copy JWT token from response"
echo "   3. Use: curl -H 'Authorization: Bearer <token>' ..."
echo ""

# Interactive mode
echo ""
echo -e "${YELLOW}Want to test a specific endpoint? Enter endpoint path:${NC}"
echo "(e.g., /telematics/providers or press Enter to exit)"
read -r endpoint

if [ -n "$endpoint" ]; then
    echo ""
    echo "Testing: ${API_URL}${endpoint}"
    curl -s "${API_URL}${endpoint}" | jq '.' || curl -s "${API_URL}${endpoint}"
    echo ""
fi

echo ""
echo "Demo script complete! 🎉"
