# UI Completeness Orchestrator (10-Agent Multi-Spider System)

A comprehensive framework for analyzing UI/product completeness and generating test plans for the Fleet application using a 10-agent collaborative AI system.

## Overview

The Enhanced UI Completeness Orchestrator uses RAG (Retrieval-Augmented Generation) and LLM technology with **10 specialized agents** to:

1. Analyze your codebase, UI routes, API endpoints, database schema, security, and integrations
2. Generate comprehensive product completeness specifications with deep drilldowns
3. Identify coverage gaps, security vulnerabilities, performance issues, and risks
4. Create executable test plans with dependencies and priorities
5. Verify deployment readiness and mobile compatibility

## 10-Agent System

The orchestrator employs 10 specialized AI agents working collaboratively (internal deliberation only):

1. **Agent U (UX & Information Architecture)**: Site maps, page taxonomy, navigation flows, drilldown depth analysis
2. **Agent F (Frontend/Component Engineer)**: Component inventory, state handling, control-to-handler mapping
3. **Agent A (Analytics & Instrumentation)**: Event tracking, PII governance, funnels, retention metrics
4. **Agent R (Realtime/Reactive & Data)**: WebSocket/SSE channels, cache strategies, data drilldowns (L1→L4)
5. **Agent Q (Quality/Perf/A11y)**: Core Web Vitals, bundle analysis, WCAG 2.2 AA, i18n/l10n
6. **Agent S (Security & Authorization)**: Auth flows, CSRF, XSS, RBAC, secrets management, security headers
7. **Agent D (Data & Database Integrity)**: Schema validation, referential integrity, indexes, backup/recovery
8. **Agent M (Mobile & Cross-Platform)**: Responsive design, touch interactions, offline mode, PWA/native features
9. **Agent I (Integration & Third-Party Services)**: External APIs, circuit breakers, rate limiting, SLA compliance
10. **Agent T (Testing & Test Coverage)**: Unit/integration/E2E tests, CI/CD gates, regression suites

## Components

### Core Files

- **`ui_completeness_orchestrator.py`**: Main orchestrator class with 10-agent multi-spider prompt
- **`rag_client.py`**: RAG document storage and retrieval (base + in-memory implementation)
- **`test_models.py`**: Test plan and task data models
- **`fleet_ui_completeness_example.py`**: Original example implementation (schema v0.9)
- **`fleet_ui_completeness_example_v2.py`**: **Enhanced 10-agent example (schema v1.0)** ⭐

### Generated Files

- **`fleet_ui_completeness_spec.json`**: Generated specification (legacy schema)
- **`fleet_ui_completeness_spec_v2.json`**: **Enhanced specification with 10-agent analysis** ⭐

## Quick Start

### 1. Run the Enhanced Example (Recommended)

```bash
cd /home/user/Fleet/mobile-apps/ios-native/test_framework
python3 fleet_ui_completeness_example_v2.py
```

This will:
- Initialize RAG and LLM clients
- Seed the RAG with Fleet app context
- Run **10-agent multi-spider analysis**
- Generate a comprehensive product completeness specification (schema v1.0)
- Create an executable test plan with priorities
- Save results to `fleet_ui_completeness_spec_v2.json`

### 2. Review the Output

The enhanced specification (schema v1.0) includes:

#### Core Analysis
- **Site Map**: Complete page taxonomy with auth requirements, feature flags, and entry points
- **Page Audits**: Component-level analysis with state handling, actions, drilldowns (L1→L4), and reactivity specs
- **Reactive Components**: WebSocket/SSE configurations, heartbeats, reconnect strategies, observability
- **Analytics Spec**: Versioned events, properties, PII classes, funnels, governance policies

#### Quality & Performance
- **Perf/A11y Report**: Core Web Vitals, bundle sizes, WCAG findings, visual regression risks

#### Security & Data
- **Security Audit**: Auth flows, CSRF/XSS protection, API authorization, RBAC coverage, secrets management
- **Data Integrity**: Schema validation, referential integrity, indexes, backup/recovery procedures

#### Platform & Integration
- **Mobile Compatibility**: Responsive design, touch interactions, offline mode, native features, PWA readiness
- **Integration Audit**: External services, circuit breakers, rate limiting, webhook handlers, SLA compliance

#### Testing & Deployment
- **Testing Coverage**: Unit/integration/E2E test metrics, CI/CD gates, untested paths
- **Deployment Verification**: Synthetic tests, feature flag matrix, smoke endpoints

#### Actionable Outputs
- **Test Plan**: Prioritized tasks across ui/api/data/perf/security/architecture/docs categories
- **CSV Exports**: Page-component-control matrix for automated test generation
- **Unknowns**: Flagged questions requiring follow-up
- **Executive Summary**: ≤200 words on completeness, risks, and readiness

### 3. Customize for Your Needs

#### Replace Mock LLM with Real Implementation

```python
from openai import OpenAI  # or anthropic, etc.

class RealLLMClient(LLMClient):
    def __init__(self, api_key: str):
        self.client = OpenAI(api_key=api_key)

    def complete(self, prompt: str) -> str:
        response = self.client.chat.completions.create(
            model="gpt-4",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.2
        )
        return response.choices[0].message.content
```

#### Expand RAG Data Sources

```python
def seed_from_codebase(rag: RAGClient):
    # Scan actual source files
    for file in Path("src/components").rglob("*.tsx"):
        rag.add_documents([
            RAGDocument(
                id=new_id("CODE"),
                namespace="code",
                title=f"Component: {file.stem}",
                kind="component",
                content=file.read_text(),
                metadata={"path": str(file)}
            )
        ])
```

## Architecture

### Workflow

```
┌─────────────────┐
│  RAG Documents  │
│  (Code, UI,     │
│   API, DB)      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Orchestrator   │◄──── LLM Client
│  builds prompt  │      (OpenAI, etc.)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Completeness    │
│ Specification   │
│ (JSON)          │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Test Plan      │
│  (Executable)   │
└─────────────────┘
```

### Key Concepts

**RAG Namespaces**: Different types of context
- `code`: Source code and repository structure
- `ui`: UI routes, components, navigation
- `api`: API endpoints and contracts
- `database`: Database schema and queries
- `design_system`: Design tokens and components
- `authz`: Authorization and permissions
- `nfr`: Non-functional requirements
- `analytics`: Analytics and tracking

**Test Categories**:
- `ui`: User interface testing
- `api`: API integration testing
- `data`: Data validation and integrity
- `perf`: Performance testing
- `security`: Security testing
- `architecture`: Architecture validation
- `docs`: Documentation completeness

## Specification Format

The generated JSON specification includes:

```json
{
  "system": "Fleet",
  "base_url": "https://fleet.example.com",
  "coverage_areas": [
    {
      "area": "Area name",
      "routes": ["/route1", "/route2"],
      "components": ["Component1", "Component2"],
      "api_endpoints": ["/api/endpoint"],
      "priority": "critical|high|medium|low",
      "estimated_effort": "time estimate"
    }
  ],
  "user_roles": [
    {
      "role": "role_name",
      "permissions": ["permission1"],
      "critical_flows": ["flow description"]
    }
  ],
  "test_plan": [
    {
      "description": "Test task description",
      "category": "ui|api|data|perf|security|architecture|docs",
      "depends_on": ["prerequisite descriptions"],
      "priority": "critical|high|medium|low",
      "estimated_duration": "time estimate",
      "coverage_areas": ["covered areas"]
    }
  ],
  "gaps_and_risks": [
    {
      "gap": "Description",
      "severity": "critical|high|medium|low",
      "mitigation": "Mitigation strategy"
    }
  ],
  "metrics": {
    "total_routes": 35,
    "total_components": 45,
    "total_api_endpoints": 28,
    "estimated_total_effort": "18 days",
    "coverage_percentage": 85
  }
}
```

## Integration with Fleet App

### Current Coverage

The example demonstrates coverage for:

✓ Authentication & Authorization
✓ Vehicle Management
✓ Dashboard & Analytics
✓ Dispatch & Radio Communication
✓ Maintenance Management
✓ Driver Management
✓ Procurement & Inventory
✓ Damage Detection & 3D Visualization
✓ Maps & Route Optimization

### Extending Coverage

To add new areas:

1. Update `seed_fleet_rag_data()` with new context
2. Add coverage area to mock response (or let LLM discover)
3. Define test tasks for the new area
4. Update metrics calculations

## Best Practices

1. **Start with Mock LLM**: Understand the flow before adding real API costs
2. **Seed Comprehensive Data**: More context = better specifications
3. **Validate Generated Tests**: Review and adjust before executing
4. **Track Dependencies**: Ensure tests run in correct order
5. **Prioritize Critical Paths**: Focus on high-impact areas first
6. **Iterate and Refine**: Use feedback to improve prompts and specs

## Production Deployment

### Prerequisites

- Python 3.8+
- LLM API access (OpenAI, Anthropic, etc.)
- RAG storage backend (optional: Pinecone, Weaviate, etc.)

### Environment Variables

```bash
export OPENAI_API_KEY="your-key-here"
export RAG_BACKEND_URL="your-rag-url"
export FLEET_BASE_URL="https://your-fleet-instance.com"
```

### Running in Production

```python
from ui_completeness_orchestrator import UICompletenessOrchestrator
from your_llm_client import ProductionLLMClient
from your_rag_client import ProductionRAGClient

llm = ProductionLLMClient(api_key=os.getenv("OPENAI_API_KEY"))
rag = ProductionRAGClient(url=os.getenv("RAG_BACKEND_URL"))

orchestrator = UICompletenessOrchestrator(llm=llm, rag=rag)
spec = orchestrator.build_completeness_spec(
    system_name="Fleet",
    base_url=os.getenv("FLEET_BASE_URL")
)

# Execute tests based on spec
test_plan = orchestrator.plan_from_spec(spec)
# ... run your test execution framework
```

## Troubleshooting

### Common Issues

**Issue**: "Module not found: rag_client"
**Solution**: Ensure you're in the test_framework directory

**Issue**: "JSON decode error"
**Solution**: LLM returned non-JSON. Adjust prompt or add retry logic

**Issue**: "No documents found in RAG"
**Solution**: Run seed_fleet_rag_data() before building spec

## Next Steps

1. ✓ Basic orchestrator implementation
2. ✓ Fleet app example with mock LLM
3. ✓ Comprehensive test plan generation
4. → Integrate real LLM API
5. → Automated codebase scanning for RAG
6. → Test execution framework integration
7. → CI/CD pipeline integration
8. → Results tracking and reporting

## License

Part of the Fleet application. See main LICENSE file.

## Support

For issues or questions:
- Review generated `fleet_ui_completeness_spec.json`
- Check the example script for usage patterns
- Consult the main Fleet documentation
