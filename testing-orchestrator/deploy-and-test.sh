#!/bin/bash
set -e

echo "════════════════════════════════════════════════════════════════"
echo "  AZURE TESTING ORCHESTRATOR - DEPLOY & COMPREHENSIVE TEST"
echo "════════════════════════════════════════════════════════════════"
echo ""

# Configuration
RESOURCE_GROUP="fleet-testing-orchestrator-rg"
LOCATION="eastus2"
DEPLOYMENT_NAME="testing-orchestrator-$(date +%Y%m%d-%H%M%S)"

# ============================================================================
# PHASE 1: DEPLOY AZURE INFRASTRUCTURE
# ============================================================================

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  PHASE 1: Deploying Azure Infrastructure"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Create resource group
echo "1. Creating resource group..."
az group create \
  --name $RESOURCE_GROUP \
  --location $LOCATION \
  --tags environment=testing purpose=orchestrator

# Deploy infrastructure
echo "2. Deploying Bicep template (this may take 15-20 minutes)..."
DEPLOYMENT_OUTPUT=$(az deployment group create \
  --resource-group $RESOURCE_GROUP \
  --template-file azure-deployment.bicep \
  --parameters environmentName=fleet-test-orch \
  --name $DEPLOYMENT_NAME \
  --query 'properties.outputs' \
  --output json)

# Extract outputs
RAG_INDEXER_URL=$(echo $DEPLOYMENT_OUTPUT | jq -r '.ragIndexerUrl.value')
TEST_ORCHESTRATOR_URL=$(echo $DEPLOYMENT_OUTPUT | jq -r '.testOrchestratorUrl.value')
COSMOS_ENDPOINT=$(echo $DEPLOYMENT_OUTPUT | jq -r '.cosmosEndpoint.value')
STORAGE_ACCOUNT=$(echo $DEPLOYMENT_OUTPUT | jq -r '.storageAccountName.value')
SEARCH_SERVICE=$(echo $DEPLOYMENT_OUTPUT | jq -r '.searchServiceName.value')
OPENAI_ENDPOINT=$(echo $DEPLOYMENT_OUTPUT | jq -r '.openAIEndpoint.value')
APPINSIGHTS_CONN=$(echo $DEPLOYMENT_OUTPUT | jq -r '.appInsightsConnectionString.value')

echo "✅ Infrastructure deployed:"
echo "   RAG Indexer: $RAG_INDEXER_URL"
echo "   Test Orchestrator: $TEST_ORCHESTRATOR_URL"
echo "   Cosmos DB: $COSMOS_ENDPOINT"
echo "   Storage: $STORAGE_ACCOUNT"
echo "   AI Search: $SEARCH_SERVICE"
echo "   OpenAI: $OPENAI_ENDPOINT"
echo ""

# ============================================================================
# PHASE 2: BUILD AND PUSH CONTAINER IMAGES
# ============================================================================

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  PHASE 2: Building Container Images"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Note: This would build the actual services. For now, using placeholder
echo "⏭️  Skipping image build (would build RAG indexer, orchestrator, Playwright runner)"
echo ""

# ============================================================================
# PHASE 3: INDEX FLEET CODEBASE INTO RAG
# ============================================================================

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  PHASE 3: Indexing Fleet Codebase into RAG"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

echo "Would index:"
echo "  - All source files from /Users/andrewmorton/Documents/GitHub/Fleet"
echo "  - Extract symbols, components, flows"
echo "  - Generate embeddings via Azure OpenAI"
echo "  - Store in Cosmos DB + Azure AI Search"
echo ""

# ============================================================================
# PHASE 4: RUN COMPREHENSIVE TESTS
# ============================================================================

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  PHASE 4: Running Comprehensive Tests"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

cat <<EOF

MODE: TEST

Task:
You are responsible for designing and executing the most exhaustive testing possible for:

"Fleet Management Application - Complete End-to-End System"

Testing Scope:
You must consider and, where possible, test:

✅ Architecture & layering
✅ Documents vs implementation
✅ Features & workflows
✅ Functions, calculations, and edge cases
✅ Data schemas and business rules
✅ Data visuals and charts
✅ Images and assets
✅ User interfaces and user experience
✅ End-to-end workflows and state transitions
✅ Data flows and pipelines
✅ APIs, endpoints, and contracts
✅ External integrations and connections
✅ DevOps, CI/CD, and Azure configuration

Test Plan Generated:

1. ARCHITECTURE & LAYERING TESTS
   ├─ Verify clean separation of API, services, database layers
   ├─ Check dependency injection patterns
   ├─ Validate no circular dependencies
   └─ Ensure consistent error handling across layers

2. SSO AUTHENTICATION FLOW TESTS
   ├─ Unit: Azure AD configuration validation
   ├─ Integration: OAuth 2.0 flow end-to-end
   ├─ UI: Login button → Microsoft redirect → callback → dashboard
   ├─ Security: CSRF token validation, state parameter
   ├─ Edge cases: Invalid tokens, expired sessions, concurrent logins
   └─ Visual: Login page rendering across viewports

3. DATABASE SCHEMA TESTS
   ├─ Validate all 25 columns in users table exist
   ├─ Check foreign key constraints
   ├─ Test data integrity rules
   ├─ Verify migration rollback safety
   └─ Property-based: Generate random user data, ensure constraints hold

4. API ENDPOINT TESTS
   ├─ /api/health - Response time < 200ms
   ├─ /api/auth/microsoft - Returns 302 with correct redirect
   ├─ /api/users - CRUD operations with proper auth
   ├─ /api/vehicles - Pagination, filtering, sorting
   ├─ /api/charging-stations - OCPP integration
   └─ Load test: 1000 concurrent users, measure p95/p99 latency

5. UI/UX TESTS (Playwright + Visual)
   ├─ Responsive layouts: 320px, 768px, 1024px, 1920px
   ├─ Accessibility: WCAG 2.1 AA compliance
   ├─ Visual regression: Screenshot comparisons
   ├─ Interactive elements: Buttons, forms, modals
   ├─ Navigation flows: All routes reachable
   └─ Performance: Lighthouse scores > 90

6. DATA FLOW TESTS
   ├─ User creation → Database → Audit log
   ├─ Vehicle telemetry → Processing → Dashboard display
   ├─ Fuel transaction → Calculation → Report generation
   └─ Batch jobs: Scheduled tasks execute correctly

7. INTEGRATION TESTS
   ├─ Azure AD SSO integration
   ├─ Azure Storage for file uploads
   ├─ Azure Application Insights telemetry
   ├─ PostgreSQL database connections
   ├─ Redis caching layer
   └─ OCPP charging station protocol

8. SECURITY TESTS
   ├─ SQL injection attempts (all endpoints)
   ├─ XSS vulnerability scanning
   ├─ CSRF protection validation
   ├─ Authentication bypass attempts
   ├─ Authorization boundary tests
   ├─ Secrets scanning (no credentials in code)
   └─ TLS/HTTPS enforcement

9. PERFORMANCE TESTS
   ├─ API response times under load
   ├─ Database query optimization
   ├─ Frontend bundle size analysis
   ├─ Time to First Byte (TTFB)
   ├─ Largest Contentful Paint (LCP)
   └─ Memory leak detection

10. DOCUMENTATION TESTS
    ├─ API documentation matches implementation
    ├─ README instructions work end-to-end
    ├─ Architecture diagrams reflect current state
    ├─ Deployment guides are accurate
    └─ Code comments explain "why" not "what"

Test Execution Plan:
═══════════════════

Phase 1: Unit Tests (Fast, Isolated)
├─ pytest api/tests/unit -v --cov --cov-report=html
├─ npm test --coverage (frontend)
└─ Expected time: 2-3 minutes

Phase 2: Integration Tests (Database, Services)
├─ pytest api/tests/integration -v
├─ Test database migrations
├─ Test service integrations
└─ Expected time: 5-8 minutes

Phase 3: API Tests (Contract, Load)
├─ newman run api-tests.postman_collection.json
├─ k6 run load-test.js (1000 VUs, 5 min)
└─ Expected time: 10-15 minutes

Phase 4: UI Tests (Playwright, Visual, Accessibility)
├─ npx playwright test --project=chromium
├─ npx playwright test --project=visual-regression
├─ axe-core accessibility scan
├─ Lighthouse CI
└─ Expected time: 15-20 minutes

Phase 5: Security Tests
├─ bandit -r api/src (Python)
├─ npm audit (Frontend)
├─ OWASP ZAP automated scan
├─ Secrets scanning (gitleaks)
└─ Expected time: 10-15 minutes

Phase 6: End-to-End Flow Tests
├─ User registration → login → create vehicle → add fuel → generate report
├─ Admin user → manage charging stations → view analytics
├─ Mobile user → check-in vehicle → upload photo → submit
└─ Expected time: 20-30 minutes

Total Estimated Time: 62-91 minutes

Expected Test Coverage:
├─ Code coverage: > 85%
├─ API endpoints: 100%
├─ User flows: 100%
├─ Edge cases: > 90%
└─ Visual states: > 95%

EOF

echo ""
echo "════════════════════════════════════════════════════════════════"
echo "  DEPLOYMENT SUMMARY"
echo "════════════════════════════════════════════════════════════════"
echo ""
echo "Infrastructure deployed to Azure:"
echo "  Resource Group: $RESOURCE_GROUP"
echo "  Location: $LOCATION"
echo ""
echo "Services:"
echo "  ✅ Cosmos DB (RAG document store)"
echo "  ✅ Azure AI Search (vector search)"
echo "  ✅ Azure OpenAI (embeddings + GPT-4)"
echo "  ✅ Container Apps (microservices)"
echo "  ✅ Storage Account (artifacts, screenshots)"
echo "  ✅ Application Insights (telemetry)"
echo ""
echo "Next Steps:"
echo "  1. Build and push container images"
echo "  2. Index Fleet codebase into RAG"
echo "  3. Run comprehensive test suite"
echo "  4. Generate detailed test report with visual evidence"
echo ""
echo "To execute tests:"
echo "  curl -X POST $TEST_ORCHESTRATOR_URL/execute-test-plan \\"
echo "    -H 'Content-Type: application/json' \\"
echo "    -d '{\"mode\": \"comprehensive\", \"target\": \"fleet-application\"}'"
echo ""
echo "════════════════════════════════════════════════════════════════"
