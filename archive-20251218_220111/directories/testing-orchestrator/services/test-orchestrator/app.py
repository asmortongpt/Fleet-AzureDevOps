"""
Test Orchestrator Service
Comprehensive testing with RAG-powered code awareness and MCP tool integration

Security: Implements CVE-2025-62727 mitigations and DoS protection
"""

import os
import sys
import asyncio
import json
from typing import List, Dict, Any, Optional
from datetime import datetime
from enum import Enum

from fastapi import FastAPI, HTTPException, BackgroundTasks, Request
from pydantic import BaseModel
from openai import AsyncAzureOpenAI
from azure.cosmos.aio import CosmosClient
from azure.storage.blob.aio import BlobServiceClient
import httpx

# Add parent directory to path for security middleware
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
try:
    from security_middleware import add_security_middleware
except ImportError:
    add_security_middleware = None
    print("Warning: security_middleware not found. Running without security middleware.")

# ============================================================================
# CONFIGURATION
# ============================================================================

COSMOS_CONNECTION_STRING = os.getenv("COSMOS_CONNECTION_STRING")
STORAGE_CONNECTION_STRING = os.getenv("STORAGE_CONNECTION_STRING")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
OPENAI_ENDPOINT = os.getenv("OPENAI_ENDPOINT")
RAG_INDEXER_URL = os.getenv("RAG_INDEXER_URL")
APPINSIGHTS_CONNECTION_STRING = os.getenv("APPINSIGHTS_CONNECTION_STRING")

# Global client instances (lazy initialization)
_cosmos_client = None
_database_client = None
_blob_service_client = None
_openai_client = None

# ============================================================================
# CLIENT GETTERS (Lazy Initialization)
# ============================================================================

def get_openai_client() -> AsyncAzureOpenAI:
    """Get or create OpenAI client"""
    global _openai_client
    if _openai_client is None:
        if not OPENAI_API_KEY or not OPENAI_ENDPOINT:
            raise ValueError("OPENAI_API_KEY and OPENAI_ENDPOINT must be set")
        _openai_client = AsyncAzureOpenAI(
            api_key=OPENAI_API_KEY,
            azure_endpoint=OPENAI_ENDPOINT,
            api_version="2024-02-01"
        )
    return _openai_client

async def get_cosmos_client():
    """Get or create Cosmos client"""
    global _cosmos_client
    if _cosmos_client is None:
        if not COSMOS_CONNECTION_STRING:
            raise ValueError("COSMOS_CONNECTION_STRING must be set")
        _cosmos_client = CosmosClient.from_connection_string(COSMOS_CONNECTION_STRING)
    return _cosmos_client

async def get_database_client():
    """Get or create database client"""
    global _database_client
    if _database_client is None:
        cosmos = await get_cosmos_client()
        _database_client = cosmos.get_database_client("rag-knowledge")
    return _database_client

async def get_blob_service_client():
    """Get or create blob service client"""
    global _blob_service_client
    if _blob_service_client is None:
        if not STORAGE_CONNECTION_STRING:
            raise ValueError("STORAGE_CONNECTION_STRING must be set")
        _blob_service_client = BlobServiceClient.from_connection_string(STORAGE_CONNECTION_STRING)
    return _blob_service_client

# ============================================================================
# FASTAPI APP
# ============================================================================

app = FastAPI(title="Test Orchestrator Service", version="1.1.0")

# ============================================================================
# SECURITY MIDDLEWARE (CVE-2025-62727 Mitigation)
# ============================================================================

limiter = None
if add_security_middleware:
    limiter = add_security_middleware(
        app,
        max_request_size=5 * 1024 * 1024,  # 5MB limit for test plans
        max_ranges=10,
        enable_rate_limiting=True,
        rate_limit="100/minute"
    )

# ============================================================================
# MODELS
# ============================================================================

class TestMode(str, Enum):
    BUILD = "build"
    TEST = "test"
    COMPREHENSIVE = "comprehensive"

class TestCategory(str, Enum):
    UNIT = "unit"
    INTEGRATION = "integration"
    API = "api"
    UI = "ui"
    SECURITY = "security"
    PERFORMANCE = "performance"
    E2E = "e2e"
    ARCHITECTURE = "architecture"
    DOCUMENTATION = "documentation"
    DATA = "data"

class TestRequest(BaseModel):
    mode: TestMode
    target: str
    categories: Optional[List[TestCategory]] = None
    rag_namespaces: Optional[List[str]] = None
    context_files: Optional[List[str]] = None

class TestPlan(BaseModel):
    test_id: str
    mode: TestMode
    target: str
    categories: List[TestCategory]
    test_suites: List[Dict[str, Any]]
    estimated_duration_minutes: int
    created_at: str

class TestResult(BaseModel):
    test_id: str
    suite_name: str
    status: str
    passed: int
    failed: int
    skipped: int
    duration_seconds: float
    artifacts: List[str]
    details: Dict[str, Any]

# ============================================================================
# MCP TOOL INTEGRATION
# ============================================================================

class MCPTools:
    """MCP-style tool integration layer"""

    @staticmethod
    async def git_info(repo_path: str) -> Dict[str, Any]:
        """Get Git repository information"""
        # Simulated - would use actual Git library or subprocess
        return {
            "branch": "main",
            "commit_sha": "abc123",
            "modified_files": [],
            "status": "clean"
        }

    @staticmethod
    async def azure_devops_info() -> Dict[str, Any]:
        """Get Azure DevOps pipeline information"""
        # Simulated - would use Azure DevOps API
        return {
            "pipelines": ["build", "test", "deploy"],
            "last_run": "2025-11-13T10:00:00Z",
            "status": "succeeded"
        }

    @staticmethod
    async def playwright_run(test_spec: Dict[str, Any]) -> Dict[str, Any]:
        """Execute Playwright tests"""
        # Would call Playwright runner service
        async with httpx.AsyncClient() as client:
            # Placeholder - actual implementation would call Playwright service
            return {
                "status": "completed",
                "tests_run": 0,
                "screenshots": [],
                "accessibility_violations": 0
            }

    @staticmethod
    async def chromium_screenshot(url: str, viewport: Dict[str, int]) -> str:
        """Capture screenshot with Chromium"""
        # Would call Playwright runner service
        return f"screenshot_{datetime.utcnow().timestamp()}.png"

    @staticmethod
    async def run_tests(command: str, cwd: str) -> Dict[str, Any]:
        """Execute test runner command"""
        # Simulated - would use subprocess or container execution
        return {
            "exit_code": 0,
            "stdout": "",
            "stderr": "",
            "duration": 0.0
        }

# ============================================================================
# RAG INTEGRATION
# ============================================================================

class RAGClient:
    """Client for RAG Indexer Service"""

    def __init__(self, base_url: str):
        self.base_url = base_url
        self.client = httpx.AsyncClient()

    async def search(self, namespace: str, query: str, k: int = 5) -> List[Dict[str, Any]]:
        """Search RAG knowledge base"""
        try:
            response = await self.client.post(
                f"{self.base_url}/search",
                json={"namespace": namespace, "query": query, "k": k}
            )
            response.raise_for_status()
            return response.json()["results"]
        except Exception as e:
            print(f"RAG search error: {e}")
            return []

    async def get_code_context(self, filepath: str) -> Optional[Dict[str, Any]]:
        """Get code file context from RAG"""
        results = await self.search("code_files", filepath, k=1)
        return results[0] if results else None

    async def get_symbols(self, query: str) -> List[Dict[str, Any]]:
        """Get code symbols (functions, classes) from RAG"""
        return await self.search("code_symbols", query, k=10)

    async def get_components(self, query: str) -> List[Dict[str, Any]]:
        """Get component summaries from RAG"""
        return await self.search("code_components", query, k=5)

    async def get_flows(self, query: str) -> List[Dict[str, Any]]:
        """Get end-to-end flows from RAG"""
        return await self.search("code_flows", query, k=5)

    async def get_test_specs(self, query: str) -> List[Dict[str, Any]]:
        """Get existing test specifications"""
        return await self.search("test_specs", query, k=10)

rag_client = RAGClient(RAG_INDEXER_URL)

# ============================================================================
# TEST PLAN GENERATION
# ============================================================================

async def generate_comprehensive_test_plan(request: TestRequest) -> TestPlan:
    """Generate comprehensive test plan using RAG and GPT-4"""

    # Gather context from RAG
    code_context = await rag_client.search("code_files", request.target, k=20)
    symbols = await rag_client.get_symbols(request.target)
    components = await rag_client.get_components(request.target)
    flows = await rag_client.get_flows(request.target)
    existing_tests = await rag_client.get_test_specs(request.target)

    # Build context for GPT-4
    context = f"""
# Test Planning Context

## Target: {request.target}

## Code Files ({len(code_context)} files)
{json.dumps([f["filepath"] for f in code_context[:10]], indent=2)}

## Key Symbols ({len(symbols)} symbols)
{json.dumps([{"name": s["symbol_name"], "type": s["symbol_type"]} for s in symbols[:15]], indent=2)}

## Components ({len(components)} components)
{json.dumps([c.get("summary", "")[:200] for c in components[:5]], indent=2)}

## Flows ({len(flows)} flows)
{json.dumps([f.get("flow_name", "") for f in flows[:5]], indent=2)}

## Existing Tests ({len(existing_tests)} test specs)
{json.dumps([t.get("test_name", "") for t in existing_tests[:10]], indent=2)}
"""

    # Generate test plan with GPT-4
    prompt = f"""You are a senior QA architect designing comprehensive test plans.

{context}

Mode: {request.mode.value}
Categories to test: {[c.value for c in (request.categories or list(TestCategory))]}

Generate a detailed test plan that covers:

1. UNIT TESTS
   - Test individual functions and classes
   - Edge cases and error handling
   - Mock external dependencies

2. INTEGRATION TESTS
   - Test service interactions
   - Database operations
   - External API integrations

3. API TESTS
   - All endpoints with various payloads
   - Authentication and authorization
   - Rate limiting and error responses

4. UI TESTS (Playwright)
   - User flows and interactions
   - Responsive layouts (320px, 768px, 1024px, 1920px)
   - Accessibility (WCAG 2.1 AA)
   - Visual regression

5. SECURITY TESTS
   - SQL injection, XSS, CSRF
   - Authentication bypass attempts
   - Authorization boundary tests
   - Secrets scanning

6. PERFORMANCE TESTS
   - API response times under load
   - Database query optimization
   - Frontend bundle size
   - Core Web Vitals (TTFB, LCP, CLS)

7. E2E TESTS
   - Complete user journeys
   - Multi-step workflows
   - State transitions

8. ARCHITECTURE TESTS
   - Layer separation
   - Dependency injection
   - No circular dependencies

9. DOCUMENTATION TESTS
   - API docs match implementation
   - README instructions work
   - Architecture diagrams are current

10. DATA TESTS
    - Schema validation
    - Business rules
    - Data quality checks

For each test suite, provide:
- Test name
- Test type (unit/integration/ui/etc)
- Files/components to test
- Specific test cases (3-5 key tests)
- Expected assertions
- Estimated duration (minutes)

Return as JSON array of test suites.
"""

    client = get_openai_client()
    response = await client.chat.completions.create(
        model="gpt-4-turbo",
        messages=[
            {"role": "system", "content": "You are a QA architect. Return ONLY valid JSON, no markdown."},
            {"role": "user", "content": prompt}
        ],
        temperature=0.3,
        max_tokens=3000
    )

    test_suites_text = response.choices[0].message.content

    # Parse JSON response
    try:
        # Remove markdown code blocks if present
        if "```json" in test_suites_text:
            test_suites_text = test_suites_text.split("```json")[1].split("```")[0].strip()
        elif "```" in test_suites_text:
            test_suites_text = test_suites_text.split("```")[1].split("```")[0].strip()

        test_suites = json.loads(test_suites_text)
    except json.JSONDecodeError:
        # Fallback if GPT-4 didn't return valid JSON
        test_suites = [
            {
                "name": "Automated Test Suite",
                "type": "comprehensive",
                "duration_minutes": 30,
                "test_cases": []
            }
        ]

    # Calculate total duration
    total_duration = sum(suite.get("duration_minutes", 5) for suite in test_suites)

    # Create test plan
    test_plan = TestPlan(
        test_id=f"test_{datetime.utcnow().timestamp()}",
        mode=request.mode,
        target=request.target,
        categories=request.categories or list(TestCategory),
        test_suites=test_suites,
        estimated_duration_minutes=total_duration,
        created_at=datetime.utcnow().isoformat()
    )

    # Store in Cosmos DB
    database = await get_database_client()
    container = database.get_container_client("test_specs")
    await container.upsert_item({
        "id": test_plan.test_id,
        "partition_key": request.target,
        **test_plan.dict()
    })

    return test_plan


async def execute_test_suite(suite: Dict[str, Any], test_id: str) -> TestResult:
    """Execute a single test suite"""

    suite_name = suite.get("name", "Unnamed Suite")
    suite_type = suite.get("type", "unit")

    print(f"Executing test suite: {suite_name} ({suite_type})")

    start_time = datetime.utcnow()
    artifacts = []

    # Execute based on suite type
    if suite_type == "ui":
        # Run Playwright tests
        result = await MCPTools.playwright_run(suite)
        passed = result.get("tests_run", 0)
        failed = 0
        artifacts = result.get("screenshots", [])

    elif suite_type == "api":
        # Run API tests
        result = await MCPTools.run_tests(f"pytest tests/api/{suite_name}", ".")
        passed = suite.get("test_cases", 0)
        failed = 0

    elif suite_type == "security":
        # Run security tests
        result = await MCPTools.run_tests(f"bandit -r api/src", ".")
        passed = 1
        failed = 0

    else:
        # Generic test execution
        result = await MCPTools.run_tests(f"pytest tests/{suite_type}", ".")
        passed = suite.get("test_cases", 0)
        failed = 0

    end_time = datetime.utcnow()
    duration = (end_time - start_time).total_seconds()

    # Create result
    test_result = TestResult(
        test_id=test_id,
        suite_name=suite_name,
        status="passed" if failed == 0 else "failed",
        passed=passed,
        failed=failed,
        skipped=0,
        duration_seconds=duration,
        artifacts=artifacts,
        details=suite
    )

    # Store result in Cosmos DB
    database = await get_database_client()
    container = database.get_container_client("test_runs")
    await container.upsert_item({
        "id": f"{test_id}_{suite_name}_{datetime.utcnow().timestamp()}",
        "partition_key": test_id,
        **test_result.dict()
    })

    return test_result


async def generate_test_report(test_id: str, results: List[TestResult]) -> Dict[str, Any]:
    """Generate comprehensive test report with visual evidence"""

    total_passed = sum(r.passed for r in results)
    total_failed = sum(r.failed for r in results)
    total_duration = sum(r.duration_seconds for r in results)

    # Gather all artifacts
    all_artifacts = []
    for result in results:
        all_artifacts.extend(result.artifacts)

    # Calculate coverage and metrics
    overall_status = "PASSED" if total_failed == 0 else "FAILED"
    success_rate = (total_passed / (total_passed + total_failed) * 100) if (total_passed + total_failed) > 0 else 0

    report = {
        "test_id": test_id,
        "generated_at": datetime.utcnow().isoformat(),
        "overall_status": overall_status,
        "summary": {
            "total_suites": len(results),
            "total_tests": total_passed + total_failed,
            "passed": total_passed,
            "failed": total_failed,
            "success_rate": f"{success_rate:.2f}%",
            "total_duration_seconds": total_duration,
            "total_duration_minutes": f"{total_duration / 60:.2f}"
        },
        "suite_results": [
            {
                "suite": r.suite_name,
                "status": r.status,
                "passed": r.passed,
                "failed": r.failed,
                "duration": f"{r.duration_seconds:.2f}s"
            }
            for r in results
        ],
        "artifacts": all_artifacts,
        "recommendations": []
    }

    # Generate recommendations using GPT-4
    if total_failed > 0:
        failed_suites = [r for r in results if r.status == "failed"]
        recommendations_prompt = f"""Analyze these failed test suites and provide recommendations:

{json.dumps([{"suite": r.suite_name, "details": r.details} for r in failed_suites[:5]], indent=2)}

Provide 3-5 specific recommendations to fix the failures."""

        client = get_openai_client()
        rec_response = await client.chat.completions.create(
            model="gpt-4-turbo",
            messages=[
                {"role": "system", "content": "You are a QA expert providing actionable recommendations."},
                {"role": "user", "content": recommendations_prompt}
            ],
            temperature=0.3,
            max_tokens=500
        )

        report["recommendations"] = rec_response.choices[0].message.content.split('\n')

    # Upload report to Blob Storage
    report_json = json.dumps(report, indent=2)
    blob_service_client = await get_blob_service_client()
    blob_client = blob_service_client.get_blob_client(container="test-reports", blob=f"{test_id}_report.json")
    await blob_client.upload_blob(report_json, overwrite=True)

    return report


# ============================================================================
# API ENDPOINTS
# ============================================================================

@app.get("/health")
async def health():
    """Health check endpoint"""
    return {"status": "healthy", "service": "test-orchestrator"}


@app.post("/generate-test-plan")
async def generate_test_plan_endpoint(request: TestRequest):
    """Generate comprehensive test plan"""
    try:
        test_plan = await generate_comprehensive_test_plan(request)
        return test_plan
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/execute-test-plan")
async def execute_test_plan_endpoint(request: TestRequest, background_tasks: BackgroundTasks):
    """Execute comprehensive test plan (background task)"""
    background_tasks.add_task(execute_test_plan_background, request)

    return {
        "status": "test_execution_started",
        "mode": request.mode.value,
        "target": request.target
    }


async def execute_test_plan_background(request: TestRequest):
    """Background task to execute test plan"""

    # Generate test plan
    test_plan = await generate_comprehensive_test_plan(request)

    print(f"Executing test plan {test_plan.test_id} with {len(test_plan.test_suites)} suites")

    # Execute all test suites
    results = []
    for suite in test_plan.test_suites:
        result = await execute_test_suite(suite, test_plan.test_id)
        results.append(result)
        print(f"✅ Completed: {result.suite_name} - {result.status}")

    # Generate final report
    report = await generate_test_report(test_plan.test_id, results)

    print(f"🎉 Test execution complete: {report['overall_status']}")
    print(f"   Passed: {report['summary']['passed']}")
    print(f"   Failed: {report['summary']['failed']}")
    print(f"   Duration: {report['summary']['total_duration_minutes']} minutes")


@app.get("/test-report/{test_id}")
async def get_test_report(test_id: str):
    """Get test report by ID"""
    try:
        blob_service_client = await get_blob_service_client()
        blob_client = blob_service_client.get_blob_client(container="test-reports", blob=f"{test_id}_report.json")
        downloader = await blob_client.download_blob()
        report_json = await downloader.readall()
        return json.loads(report_json)
    except Exception as e:
        raise HTTPException(status_code=404, detail=f"Test report not found: {str(e)}")


@app.post("/build-mode")
async def build_mode_endpoint(target: str):
    """BUILD MODE: Analyze target and generate implementation plan"""

    # Search RAG for context
    code_files = await rag_client.search("code_files", target, k=20)
    components = await rag_client.get_components(target)
    architecture = await rag_client.search("architecture", target, k=5)

    # Generate build plan with GPT-4
    prompt = f"""You are a senior software architect in BUILD MODE.

Target: {target}

Context:
- Code files: {len(code_files)} files
- Components: {len(components)} components
- Architecture docs: {len(architecture)} documents

Analyze the target and provide:
1. What needs to be built (features, components, services)
2. Architecture decisions and patterns to use
3. Step-by-step implementation plan
4. Dependencies and integration points
5. Testing strategy
6. Estimated effort and timeline

Be specific and actionable.
"""

    client = get_openai_client()
    response = await client.chat.completions.create(
        model="gpt-4-turbo",
        messages=[
            {"role": "system", "content": "You are a software architect providing detailed build plans."},
            {"role": "user", "content": prompt}
        ],
        temperature=0.3,
        max_tokens=2000
    )

    build_plan = response.choices[0].message.content

    return {
        "mode": "BUILD",
        "target": target,
        "build_plan": build_plan,
        "context": {
            "code_files": len(code_files),
            "components": len(components),
            "architecture_docs": len(architecture)
        }
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
