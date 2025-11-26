#!/bin/bash
# Comprehensive Connectivity Verification for Fleet Management System
# Checks: Maps, Emulators, Mobile App, Endpoints, AI Services

set -e

echo "🔍 Fleet Management - Complete Connectivity Verification"
echo "=========================================================="
echo ""

DOMAIN="https://fleet.capitaltechalliance.com"
RESULTS_FILE="connectivity-report-$(date +%Y%m%d-%H%M%S).txt"

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

check_endpoint() {
    local name="$1"
    local url="$2"
    local expected_code="${3:-200}"
    
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$url" 2>&1 || echo "000")
    
    if [ "$HTTP_CODE" == "$expected_code" ]; then
        echo -e "${GREEN}✅ $name${NC} - $url (HTTP $HTTP_CODE)"
        echo "✅ $name - $url (HTTP $HTTP_CODE)" >> "$RESULTS_FILE"
        return 0
    else
        echo -e "${RED}❌ $name${NC} - $url (HTTP $HTTP_CODE, expected $expected_code)"
        echo "❌ $name - $url (HTTP $HTTP_CODE, expected $expected_code)" >> "$RESULTS_FILE"
        return 1
    fi
}

# Initialize results
echo "Fleet Management Connectivity Report" > "$RESULTS_FILE"
echo "Generated: $(date)" >> "$RESULTS_FILE"
echo "========================================" >> "$RESULTS_FILE"
echo "" >> "$RESULTS_FILE"

PASS=0
FAIL=0

# 1. FRONTEND CHECKS
echo "📱 1. Frontend Application"
echo "-------------------------"
check_endpoint "Main Site" "$DOMAIN" "200" && ((PASS++)) || ((FAIL++))
check_endpoint "Runtime Config" "$DOMAIN/runtime-config.js" "200" && ((PASS++)) || ((FAIL++))
check_endpoint "Service Worker" "$DOMAIN/sw.js" "200" && ((PASS++)) || ((FAIL++))
check_endpoint "Manifest" "$DOMAIN/manifest.json" "200" && ((PASS++)) || ((FAIL++))
echo ""

# 2. API ENDPOINTS
echo "🔌 2. API Endpoints"
echo "------------------"
check_endpoint "API Health" "$DOMAIN/api/health" "200" && ((PASS++)) || ((FAIL++))
check_endpoint "API Vehicles" "$DOMAIN/api/vehicles" "401,200" && ((PASS++)) || ((FAIL++))
check_endpoint "API Drivers" "$DOMAIN/api/drivers" "401,200" && ((PASS++)) || ((FAIL++))
check_endpoint "API Maintenance" "$DOMAIN/api/maintenance" "401,200" && ((PASS++)) || ((FAIL++))
echo ""

# 3. AZURE MAPS
echo "🗺️  3. Azure Maps Integration"
echo "-----------------------------"
check_endpoint "Azure Maps SDK" "https://atlas.microsoft.com/sdk/javascript/mapcontrol/2/atlas.min.css" "200" && ((PASS++)) || ((FAIL++))
echo ""

# 4. MOBILE APP ENDPOINTS
echo "📲 4. Mobile App Endpoints"
echo "-------------------------"
check_endpoint "Mobile API" "$DOMAIN/api/mobile/status" "401,200,404" && ((PASS++)) || ((FAIL++))
check_endpoint "Mobile Auth" "$DOMAIN/api/mobile/auth" "401,200,404" && ((PASS++)) || ((FAIL++))
echo ""

# 5. EMULATOR SERVICES
echo "🎮 5. Emulator Services"
echo "----------------------"
check_endpoint "Azure Emulator" "$DOMAIN/emulator" "200,404" && ((PASS++)) || ((FAIL++))
check_endpoint "Storage Emulator" "$DOMAIN/api/storage" "401,200,404" && ((PASS++)) || ((FAIL++))
echo ""

# 6. AI SERVICES
echo "🤖 6. AI Services"
echo "----------------"
check_endpoint "AI Agent Endpoint" "$DOMAIN/api/ai/agents" "401,200,404" && ((PASS++)) || ((FAIL++))
check_endpoint "Predictive Maintenance AI" "$DOMAIN/api/ai/predictive" "401,200,404" && ((PASS++)) || ((FAIL++))
check_endpoint "Video Analytics AI" "$DOMAIN/api/ai/video" "401,200,404" && ((PASS++)) || ((FAIL++))
echo ""

# 7. AUTHENTICATION
echo "🔐 7. Authentication"
echo "-------------------"
check_endpoint "Auth Callback" "$DOMAIN/auth/callback" "200,404" && ((PASS++)) || ((FAIL++))
check_endpoint "Azure AD Login" "https://login.microsoftonline.com/0ec14b81-7b82-45ee-8f3d-cbc31ced5347" "200" && ((PASS++)) || ((FAIL++))
echo ""

# Summary
echo "========================================" >> "$RESULTS_FILE"
echo "Summary:" >> "$RESULTS_FILE"
echo "  ✅ Passed: $PASS" >> "$RESULTS_FILE"
echo "  ❌ Failed: $FAIL" >> "$RESULTS_FILE"
echo "" >> "$RESULTS_FILE"

echo ""
echo "📊 Summary"
echo "=========="
echo -e "${GREEN}✅ Passed: $PASS${NC}"
echo -e "${RED}❌ Failed: $FAIL${NC}"
echo ""
echo "📄 Full report saved to: $RESULTS_FILE"
echo ""

if [ $FAIL -gt 0 ]; then
    echo -e "${YELLOW}⚠️  Some endpoints failed. Review the report above.${NC}"
    exit 1
else
    echo -e "${GREEN}🎉 All connectivity checks passed!${NC}"
    exit 0
fi
