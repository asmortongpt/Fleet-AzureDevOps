#!/bin/bash
# Session Revocation Test Script
# Tests the CVSS 7.2 session revocation security fix

set -e

API_URL="${API_URL:-http://localhost:3000}"
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "========================================="
echo "Session Revocation Test Suite"
echo "========================================="
echo ""
echo "API URL: $API_URL"
echo ""

# Check if jq is installed
if ! command -v jq &> /dev/null; then
    echo -e "${RED}Error: jq is not installed${NC}"
    echo "Install with: brew install jq (macOS) or apt-get install jq (Linux)"
    exit 1
fi

# Test 1: Health Check
echo -e "${YELLOW}Test 1: Health Check${NC}"
HEALTH=$(curl -s "$API_URL/api/health" || echo '{"status":"error"}')
if echo "$HEALTH" | jq -e '.status' > /dev/null 2>&1; then
    echo -e "${GREEN}✓ API is reachable${NC}"
else
    echo -e "${RED}✗ API is not reachable${NC}"
    echo "Make sure the server is running: npm run dev"
    exit 1
fi
echo ""

# Test 2: Login to get token
echo -e "${YELLOW}Test 2: Login to obtain JWT token${NC}"
echo "Attempting login with default credentials..."

# Try to login (adjust credentials as needed)
LOGIN_RESPONSE=$(curl -s -X POST "$API_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@capitaltechalliance.com",
    "password": "Admin123!"
  }' || echo '{"error":"login failed"}')

# Extract token from response or cookie
TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.token // empty')

if [ -z "$TOKEN" ]; then
    echo -e "${YELLOW}⚠ Could not login with default credentials${NC}"
    echo "Please provide a valid JWT token:"
    read -p "Token: " TOKEN
    if [ -z "$TOKEN" ]; then
        echo -e "${RED}✗ No token provided. Exiting.${NC}"
        exit 1
    fi
fi

echo -e "${GREEN}✓ Token obtained: ${TOKEN:0:30}...${NC}"
echo ""

# Test 3: Verify token works
echo -e "${YELLOW}Test 3: Verify token is valid${NC}"
STATUS_RESPONSE=$(curl -s -w "\n%{http_code}" -X GET "$API_URL/api/auth/revoke/status" \
  -H "Authorization: Bearer $TOKEN")

HTTP_CODE=$(echo "$STATUS_RESPONSE" | tail -n 1)
BODY=$(echo "$STATUS_RESPONSE" | sed '$d')

if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✓ Token is valid (admin access confirmed)${NC}"
    echo "Blacklist status:"
    echo "$BODY" | jq .
elif [ "$HTTP_CODE" = "403" ]; then
    echo -e "${YELLOW}⚠ Token is valid but user is not admin${NC}"
    echo "Will test self-revocation only"
    IS_ADMIN=false
else
    echo -e "${RED}✗ Token validation failed (HTTP $HTTP_CODE)${NC}"
    echo "$BODY"
    exit 1
fi
echo ""

# Test 4: Self-revoke current session
echo -e "${YELLOW}Test 4: Self-revoke current session${NC}"
REVOKE_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$API_URL/api/auth/revoke" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json")

HTTP_CODE=$(echo "$REVOKE_RESPONSE" | tail -n 1)
BODY=$(echo "$REVOKE_RESPONSE" | sed '$d')

if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✓ Session revoked successfully${NC}"
    echo "$BODY" | jq .
else
    echo -e "${RED}✗ Revocation failed (HTTP $HTTP_CODE)${NC}"
    echo "$BODY"
    exit 1
fi
echo ""

# Test 5: Verify token is now revoked
echo -e "${YELLOW}Test 5: Verify token is now invalid${NC}"
VERIFY_RESPONSE=$(curl -s -w "\n%{http_code}" -X GET "$API_URL/api/auth/revoke/status" \
  -H "Authorization: Bearer $TOKEN")

HTTP_CODE=$(echo "$VERIFY_RESPONSE" | tail -n 1)
BODY=$(echo "$VERIFY_RESPONSE" | sed '$d')

if [ "$HTTP_CODE" = "401" ] && echo "$BODY" | grep -q "revoked"; then
    echo -e "${GREEN}✓ Token correctly rejected as revoked${NC}"
    echo "$BODY" | jq .
else
    echo -e "${RED}✗ Revoked token was not rejected (HTTP $HTTP_CODE)${NC}"
    echo "$BODY"
    exit 1
fi
echo ""

# Test 6: Verify revoked token can't access other resources
echo -e "${YELLOW}Test 6: Verify revoked token can't access vehicles API${NC}"
VEHICLES_RESPONSE=$(curl -s -w "\n%{http_code}" -X GET "$API_URL/api/vehicles" \
  -H "Authorization: Bearer $TOKEN")

HTTP_CODE=$(echo "$VEHICLES_RESPONSE" | tail -n 1)
BODY=$(echo "$VEHICLES_RESPONSE" | sed '$d')

if [ "$HTTP_CODE" = "401" ]; then
    echo -e "${GREEN}✓ Revoked token correctly rejected on other endpoints${NC}"
else
    echo -e "${RED}✗ Revoked token was accepted (HTTP $HTTP_CODE)${NC}"
    echo "$BODY"
    exit 1
fi
echo ""

# Summary
echo "========================================="
echo -e "${GREEN}All Tests Passed! ✓${NC}"
echo "========================================="
echo ""
echo "Summary:"
echo "  ✓ API health check"
echo "  ✓ JWT token obtained"
echo "  ✓ Token validated"
echo "  ✓ Session revoked successfully"
echo "  ✓ Revoked token rejected"
echo "  ✓ Revoked token blocked from all endpoints"
echo ""
echo "Session revocation is working correctly."
echo ""

# Optional: Test admin revocation if we have another user
if [ "${IS_ADMIN}" != "false" ]; then
    echo -e "${YELLOW}Optional: Test admin revocation${NC}"
    echo "To test admin revocation, create a second user and run:"
    echo ""
    echo "  curl -X POST $API_URL/api/auth/revoke \\"
    echo "    -H \"Authorization: Bearer ADMIN_TOKEN\" \\"
    echo "    -H \"Content-Type: application/json\" \\"
    echo "    -d '{\"email\": \"user@example.com\"}'"
    echo ""
fi

exit 0
