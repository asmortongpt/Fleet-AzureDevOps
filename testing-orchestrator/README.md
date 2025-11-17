# Azure Testing Orchestrator

Comprehensive testing infrastructure with RAG-powered code awareness and MCP tool integration.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    Azure Testing Orchestrator                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐       │
│  │  RAG Indexer  │  │     Test      │  │  Playwright   │       │
│  │   Service     │  │ Orchestrator  │  │    Runner     │       │
│  │   (Port 8000) │  │ (Port 8001)   │  │  (Port 8002)  │       │
│  └───────┬───────┘  └───────┬───────┘  └───────┬───────┘       │
│          │                  │                  │                 │
│          └──────────────────┴──────────────────┘                 │
│                             │                                     │
├─────────────────────────────┼─────────────────────────────────────┤
│                             ▼                                     │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │              Multi-Layer RAG Knowledge Base               │   │
│  ├──────────────────────────────────────────────────────────┤   │
│  │ • code_files        - Complete source code files          │   │
│  │ • code_symbols      - Functions, classes, methods         │   │
│  │ • code_components   - LLM-generated component summaries   │   │
│  │ • code_flows        - End-to-end flow narratives         │   │
│  │ • requirements      - Requirements and user stories       │   │
│  │ • architecture      - System architecture docs           │   │
│  │ • test_specs        - Test plans and specifications      │   │
│  │ • test_runs         - Historical test execution results  │   │
│  │ • defects           - Bug reports and fixes              │   │
│  │ • data_rules        - Data quality and business rules    │   │
│  │ • ui_snapshots      - UI screenshot metadata             │   │
│  └──────────────────────────────────────────────────────────┘   │
│                             │                                     │
├─────────────────────────────┼─────────────────────────────────────┤
│                             ▼                                     │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                  Azure Infrastructure                     │   │
│  ├──────────────────────────────────────────────────────────┤   │
│  │ • Cosmos DB           - RAG document store                │   │
│  │ • Azure AI Search     - Vector search                     │   │
│  │ • Azure OpenAI        - Embeddings + GPT-4                │   │
│  │ • Container Apps      - Microservices                     │   │
│  │ • Storage Account     - Artifacts, screenshots            │   │
│  │ • Application Insights - Telemetry                        │   │
│  │ • Key Vault           - Secrets management                │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

## Services

### 1. RAG Indexer Service (Port 8000)

Multi-layer knowledge extraction and indexing for code, architecture, and testing.

**Capabilities:**
- Tree-sitter code parsing for Python and TypeScript
- Symbol extraction (functions, classes, methods with docstrings)
- Azure OpenAI embeddings (text-embedding-3-large)
- GPT-4 component summaries
- End-to-end flow narratives
- Cosmos DB storage + Azure AI Search vector indexing

**API Endpoints:**
- `POST /index/file` - Index single code file
- `POST /index/repository` - Index entire repository (background task)
- `POST /search` - Search RAG with vector similarity

### 2. Test Orchestrator Service (Port 8001)

Comprehensive testing with RAG-powered code awareness and MCP tool integration.

**Capabilities:**
- BUILD MODE: Analyze targets and generate implementation plans
- TEST MODE: Execute comprehensive test plans
- MCP tool integration (Git, DevOps, Azure, Playwright, runners)
- GPT-4 test plan generation
- Multi-category testing (unit, integration, API, UI, security, performance, E2E)
- Automated test report generation with recommendations

**API Endpoints:**
- `POST /generate-test-plan` - Generate comprehensive test plan
- `POST /execute-test-plan` - Execute test plan (background)
- `GET /test-report/{test_id}` - Get test report
- `POST /build-mode` - BUILD MODE analysis

### 3. Playwright Runner Service (Port 8002)

Visual testing, accessibility testing, and UI automation.

**Capabilities:**
- Multi-viewport screenshot capture (mobile, tablet, desktop)
- Visual regression testing
- WCAG 2.1 accessibility testing (axe-core)
- End-to-end flow automation
- Performance testing (Core Web Vitals)
- Azure Blob Storage for screenshots

**API Endpoints:**
- `POST /screenshot` - Capture single screenshot
- `POST /visual-test` - Visual regression test
- `POST /accessibility-test` - WCAG accessibility test
- `POST /e2e-test` - End-to-end flow test
- `POST /performance-test` - Performance metrics test

## Quick Start

### Prerequisites

- Azure subscription
- Azure CLI installed and authenticated
- Docker installed (for local development)
- Python 3.11+

### 1. Deploy Infrastructure

```bash
cd testing-orchestrator
./deploy-and-test.sh
```

This will:
1. Create resource group
2. Deploy Bicep template (Cosmos DB, OpenAI, AI Search, Container Apps, etc.)
3. Extract deployment outputs

### 2. Build and Push Container Images

```bash
# Set your Azure Container Registry name
ACR_NAME="your-acr-name"

# Login to ACR
az acr login --name $ACR_NAME

# Build and push RAG Indexer
cd services/rag-indexer
docker build -t $ACR_NAME.azurecr.io/rag-indexer:latest .
docker push $ACR_NAME.azurecr.io/rag-indexer:latest

# Build and push Test Orchestrator
cd ../test-orchestrator
docker build -t $ACR_NAME.azurecr.io/test-orchestrator:latest .
docker push $ACR_NAME.azurecr.io/test-orchestrator:latest

# Build and push Playwright Runner
cd ../playwright-runner
docker build -t $ACR_NAME.azurecr.io/playwright-runner:latest .
docker push $ACR_NAME.azurecr.io/playwright-runner:latest
```

### 3. Index Your Codebase

```bash
RAG_INDEXER_URL="https://your-rag-indexer-url"

curl -X POST "$RAG_INDEXER_URL/index/repository" \
  -H "Content-Type: application/json" \
  -d '{
    "repository_path": "/path/to/your/repo",
    "commit_sha": "abc123",
    "namespaces": [
      "code_files",
      "code_symbols",
      "code_components",
      "code_flows"
    ]
  }'
```

### 4. Run Comprehensive Tests

```bash
TEST_ORCHESTRATOR_URL="https://your-test-orchestrator-url"

curl -X POST "$TEST_ORCHESTRATOR_URL/execute-test-plan" \
  -H "Content-Type: application/json" \
  -d '{
    "mode": "comprehensive",
    "target": "fleet-application",
    "categories": [
      "unit",
      "integration",
      "api",
      "ui",
      "security",
      "performance",
      "e2e",
      "architecture",
      "documentation",
      "data"
    ]
  }'
```

### 5. Get Test Report

```bash
curl "$TEST_ORCHESTRATOR_URL/test-report/{test_id}"
```

## Test Categories

### 1. Unit Tests
- Individual functions and classes
- Edge cases and error handling
- Mock external dependencies

### 2. Integration Tests
- Service interactions
- Database operations
- External API integrations

### 3. API Tests
- All endpoints with various payloads
- Authentication and authorization
- Rate limiting and error responses
- Load testing (1000+ concurrent users)

### 4. UI Tests (Playwright)
- User flows and interactions
- Responsive layouts (320px, 768px, 1024px, 1920px)
- Accessibility (WCAG 2.1 AA)
- Visual regression with screenshots

### 5. Security Tests
- SQL injection, XSS, CSRF
- Authentication bypass attempts
- Authorization boundary tests
- Secrets scanning

### 6. Performance Tests
- API response times under load
- Database query optimization
- Frontend bundle size
- Core Web Vitals (TTFB, LCP, CLS)

### 7. E2E Tests
- Complete user journeys
- Multi-step workflows
- State transitions

### 8. Architecture Tests
- Layer separation
- Dependency injection
- No circular dependencies

### 9. Documentation Tests
- API docs match implementation
- README instructions work
- Architecture diagrams are current

### 10. Data Tests
- Schema validation
- Business rules
- Data quality checks

## BUILD MODE vs TEST MODE

### BUILD MODE

Analyze targets and generate implementation plans:

```bash
curl -X POST "$TEST_ORCHESTRATOR_URL/build-mode?target=user-authentication" \
  -H "Content-Type: application/json"
```

Returns:
- What needs to be built
- Architecture decisions
- Step-by-step implementation plan
- Dependencies and integration points
- Testing strategy
- Effort estimates

### TEST MODE

Execute comprehensive test plans:

```bash
curl -X POST "$TEST_ORCHESTRATOR_URL/execute-test-plan" \
  -H "Content-Type: application/json" \
  -d '{
    "mode": "test",
    "target": "user-authentication",
    "categories": ["unit", "integration", "security", "e2e"]
  }'
```

Returns:
- Test plan ID
- Execution status
- Background task initiated

## RAG Namespaces

The system maintains 11 distinct knowledge namespaces:

| Namespace | Purpose | Examples |
|-----------|---------|----------|
| `code_files` | Complete source code files | Python, TypeScript files |
| `code_symbols` | Functions, classes, methods | `async def login()`, `class User` |
| `code_components` | Component summaries | "Authentication service manages..." |
| `code_flows` | End-to-end flows | "User login flow: 1. Enter creds..." |
| `requirements` | Requirements docs | User stories, feature specs |
| `architecture` | System architecture | Architecture diagrams, ADRs |
| `test_specs` | Test specifications | Test plans, test cases |
| `test_runs` | Test execution history | Previous test results |
| `defects` | Bug reports | GitHub issues, bug fixes |
| `data_rules` | Business rules | Data validation, constraints |
| `ui_snapshots` | UI screenshots | Visual regression baselines |

## Example: Complete Testing Workflow

```bash
# 1. Index the codebase
curl -X POST "$RAG_INDEXER_URL/index/repository" \
  -H "Content-Type: application/json" \
  -d '{"repository_path": "/app", "commit_sha": "abc123"}'

# 2. Search for authentication code
curl -X POST "$RAG_INDEXER_URL/search" \
  -H "Content-Type: application/json" \
  -d '{"namespace": "code_symbols", "query": "authentication", "k": 10}'

# 3. Generate test plan
curl -X POST "$TEST_ORCHESTRATOR_URL/generate-test-plan" \
  -H "Content-Type: application/json" \
  -d '{
    "mode": "comprehensive",
    "target": "authentication",
    "categories": ["unit", "integration", "security", "e2e"]
  }'

# 4. Execute tests
curl -X POST "$TEST_ORCHESTRATOR_URL/execute-test-plan" \
  -H "Content-Type: application/json" \
  -d '{
    "mode": "test",
    "target": "authentication",
    "categories": ["unit", "integration", "security", "e2e"]
  }'

# 5. Run visual tests
curl -X POST "$PLAYWRIGHT_URL/visual-test" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://app.example.com/login",
    "test_name": "login-page",
    "viewports": [
      {"width": 320, "height": 568},
      {"width": 1920, "height": 1080}
    ]
  }'

# 6. Run accessibility test
curl -X POST "$PLAYWRIGHT_URL/accessibility-test" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://app.example.com/login",
    "test_name": "login-accessibility",
    "wcag_level": "AA"
  }'

# 7. Get final report
curl "$TEST_ORCHESTRATOR_URL/test-report/{test_id}"
```

## Test Report Structure

```json
{
  "test_id": "test_1234567890",
  "generated_at": "2025-11-13T10:00:00Z",
  "overall_status": "PASSED",
  "summary": {
    "total_suites": 10,
    "total_tests": 147,
    "passed": 145,
    "failed": 2,
    "success_rate": "98.64%",
    "total_duration_minutes": "42.50"
  },
  "suite_results": [
    {
      "suite": "Unit Tests - Authentication",
      "status": "passed",
      "passed": 25,
      "failed": 0,
      "duration": "2.50s"
    }
  ],
  "artifacts": [
    "https://storage.blob.core.windows.net/screenshots/login_320x568.png",
    "https://storage.blob.core.windows.net/reports/accessibility_report.json"
  ],
  "recommendations": [
    "Fix CSRF token validation in login endpoint",
    "Improve mobile viewport layout for login form"
  ]
}
```

## Cost Optimization

### Serverless Architecture
- Cosmos DB: Serverless mode (pay per request)
- Container Apps: Scale to zero when idle
- Azure OpenAI: Pay per token

### Estimated Monthly Costs
- Small project (< 1000 files): ~$50-100/month
- Medium project (1000-5000 files): ~$200-400/month
- Large project (> 5000 files): ~$500-1000/month

## Monitoring

All services send telemetry to Application Insights:
- Request rates and response times
- Error rates and exceptions
- Custom metrics (tests run, coverage %)
- Distributed tracing across services

## Security

- All secrets stored in Azure Key Vault
- RBAC authorization on all Azure resources
- TLS/HTTPS enforcement
- No credentials in code or logs
- Soft delete enabled (90-day retention)

## Troubleshooting

### Service not responding
```bash
# Check health endpoints
curl https://your-rag-indexer-url/health
curl https://your-test-orchestrator-url/health
curl https://your-playwright-runner-url/health
```

### Container logs
```bash
az containerapp logs show \
  --name testing-orchestrator-rag-indexer \
  --resource-group fleet-testing-orchestrator-rg
```

### RAG search returns no results
- Ensure repository has been indexed
- Check Cosmos DB for documents
- Verify Azure AI Search index exists

## License

MIT

## Support

For issues and questions, please open a GitHub issue.
