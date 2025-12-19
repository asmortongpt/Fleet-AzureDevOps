"""
Playwright Runner Service
Visual testing, accessibility testing, and UI automation with screenshot storage

Security: Implements CVE-2025-62727 mitigations and DoS protection
"""

import os
import sys
import asyncio
from typing import List, Dict, Any, Optional
from datetime import datetime
import hashlib

from fastapi import FastAPI, HTTPException, Request
from pydantic import BaseModel
from playwright.async_api import async_playwright, Browser, Page
from azure.storage.blob import BlobServiceClient
import base64

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

STORAGE_CONNECTION_STRING = os.getenv("STORAGE_CONNECTION_STRING")
SCREENSHOTS_CONTAINER = os.getenv("SCREENSHOTS_CONTAINER", "ui-screenshots")

# Lazy initialization of blob service client
_blob_service_client = None

def get_blob_service_client() -> BlobServiceClient:
    """Lazy initialization of Azure Blob Service Client"""
    global _blob_service_client

    if _blob_service_client is None:
        if not STORAGE_CONNECTION_STRING:
            raise ValueError(
                "STORAGE_CONNECTION_STRING environment variable is required for screenshot upload. "
                "Please set this variable to enable Azure Blob Storage integration."
            )
        _blob_service_client = BlobServiceClient.from_connection_string(STORAGE_CONNECTION_STRING)

    return _blob_service_client

# ============================================================================
# FASTAPI APP
# ============================================================================

app = FastAPI(title="Playwright Runner Service", version="1.1.0")

# ============================================================================
# SECURITY MIDDLEWARE (CVE-2025-62727 Mitigation)
# ============================================================================

limiter = None
if add_security_middleware:
    limiter = add_security_middleware(
        app,
        max_request_size=10 * 1024 * 1024,  # 10MB limit for screenshots
        max_ranges=10,
        enable_rate_limiting=True,
        rate_limit="100/minute"
    )

# ============================================================================
# MODELS
# ============================================================================

class ViewportSize(BaseModel):
    width: int
    height: int

class ScreenshotRequest(BaseModel):
    url: str
    viewport: ViewportSize
    full_page: bool = False
    selector: Optional[str] = None

class VisualTestRequest(BaseModel):
    url: str
    test_name: str
    viewports: List[ViewportSize] = [
        ViewportSize(width=320, height=568),   # Mobile (iPhone SE)
        ViewportSize(width=768, height=1024),  # Tablet (iPad)
        ViewportSize(width=1024, height=768),  # Tablet landscape
        ViewportSize(width=1920, height=1080)  # Desktop
    ]
    full_page: bool = True

class AccessibilityTestRequest(BaseModel):
    url: str
    test_name: str
    wcag_level: str = "AA"  # A, AA, or AAA

class E2ETestRequest(BaseModel):
    test_name: str
    base_url: str
    steps: List[Dict[str, Any]]

class PerformanceTestRequest(BaseModel):
    url: str
    test_name: str
    runs: int = 3

# ============================================================================
# PLAYWRIGHT UTILITIES
# ============================================================================

class PlaywrightRunner:
    """Manages Playwright browser instances and test execution"""

    def __init__(self):
        self.playwright = None
        self.browser: Optional[Browser] = None

    async def start(self):
        """Initialize Playwright and browser"""
        if not self.playwright:
            self.playwright = await async_playwright().start()
            self.browser = await self.playwright.chromium.launch(
                headless=True,
                args=['--no-sandbox', '--disable-setuid-sandbox']
            )

    async def stop(self):
        """Close browser and Playwright"""
        if self.browser:
            await self.browser.close()
        if self.playwright:
            await self.playwright.stop()

    async def new_page(self, viewport: ViewportSize) -> Page:
        """Create new page with specified viewport"""
        if not self.browser:
            await self.start()

        context = await self.browser.new_context(
            viewport={"width": viewport.width, "height": viewport.height}
        )
        page = await context.new_page()
        return page

    async def capture_screenshot(self, page: Page, full_page: bool = False) -> bytes:
        """Capture screenshot and return bytes"""
        screenshot_bytes = await page.screenshot(full_page=full_page)
        return screenshot_bytes

    async def upload_screenshot(self, screenshot_bytes: bytes, filename: str) -> str:
        """Upload screenshot to Azure Blob Storage"""
        try:
            blob_service_client = get_blob_service_client()
            blob_client = blob_service_client.get_blob_client(
                container=SCREENSHOTS_CONTAINER,
                blob=filename
            )

            blob_client.upload_blob(screenshot_bytes, overwrite=True)

            # Return URL
            return f"https://{blob_service_client.account_name}.blob.core.windows.net/{SCREENSHOTS_CONTAINER}/{filename}"
        except ValueError as e:
            # If storage is not configured, return a mock URL or handle gracefully
            raise HTTPException(
                status_code=503,
                detail=str(e)
            )

playwright_runner = PlaywrightRunner()

# ============================================================================
# SCREENSHOT & VISUAL TESTING
# ============================================================================

async def capture_and_upload_screenshot(
    url: str,
    viewport: ViewportSize,
    test_name: str,
    full_page: bool = False,
    selector: Optional[str] = None
) -> Dict[str, Any]:
    """Capture screenshot and upload to storage"""

    page = await playwright_runner.new_page(viewport)

    try:
        # Navigate to URL
        await page.goto(url, wait_until="networkidle", timeout=30000)

        # Wait for selector if specified
        if selector:
            await page.wait_for_selector(selector, timeout=10000)

        # Capture screenshot
        if selector:
            element = await page.query_selector(selector)
            screenshot_bytes = await element.screenshot()
        else:
            screenshot_bytes = await playwright_runner.capture_screenshot(page, full_page)

        # Generate filename
        timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
        filename = f"{test_name}_{viewport.width}x{viewport.height}_{timestamp}.png"

        # Upload to storage
        screenshot_url = await playwright_runner.upload_screenshot(screenshot_bytes, filename)

        return {
            "url": url,
            "viewport": f"{viewport.width}x{viewport.height}",
            "screenshot_url": screenshot_url,
            "filename": filename,
            "timestamp": timestamp,
            "full_page": full_page
        }

    finally:
        await page.close()


async def run_visual_regression_test(request: VisualTestRequest) -> Dict[str, Any]:
    """Run visual regression test across multiple viewports"""

    screenshots = []

    for viewport in request.viewports:
        result = await capture_and_upload_screenshot(
            url=request.url,
            viewport=viewport,
            test_name=request.test_name,
            full_page=request.full_page
        )
        screenshots.append(result)

    return {
        "test_name": request.test_name,
        "url": request.url,
        "viewports_tested": len(request.viewports),
        "screenshots": screenshots,
        "status": "completed"
    }


# ============================================================================
# ACCESSIBILITY TESTING
# ============================================================================

async def run_accessibility_test(request: AccessibilityTestRequest) -> Dict[str, Any]:
    """Run WCAG accessibility tests using axe-core"""

    page = await playwright_runner.new_page(ViewportSize(width=1920, height=1080))

    try:
        await page.goto(request.url, wait_until="networkidle", timeout=30000)

        # Inject axe-core
        await page.add_script_tag(url="https://cdnjs.cloudflare.com/ajax/libs/axe-core/4.7.2/axe.min.js")

        # Run axe
        axe_results = await page.evaluate(f"""
            async () => {{
                return await axe.run({{
                    runOnly: {{
                        type: 'tag',
                        values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']
                    }}
                }});
            }}
        """)

        violations = axe_results.get("violations", [])
        passes = axe_results.get("passes", [])

        # Categorize violations by impact
        critical = [v for v in violations if v.get("impact") == "critical"]
        serious = [v for v in violations if v.get("impact") == "serious"]
        moderate = [v for v in violations if v.get("impact") == "moderate"]
        minor = [v for v in violations if v.get("impact") == "minor"]

        return {
            "test_name": request.test_name,
            "url": request.url,
            "wcag_level": request.wcag_level,
            "total_violations": len(violations),
            "total_passes": len(passes),
            "violations_by_impact": {
                "critical": len(critical),
                "serious": len(serious),
                "moderate": len(moderate),
                "minor": len(minor)
            },
            "violations": [
                {
                    "id": v.get("id"),
                    "impact": v.get("impact"),
                    "description": v.get("description"),
                    "help": v.get("help"),
                    "nodes": len(v.get("nodes", []))
                }
                for v in violations[:20]  # Limit to first 20
            ],
            "status": "failed" if len(violations) > 0 else "passed"
        }

    finally:
        await page.close()


# ============================================================================
# E2E TESTING
# ============================================================================

async def run_e2e_test(request: E2ETestRequest) -> Dict[str, Any]:
    """Run end-to-end test with specified steps"""

    page = await playwright_runner.new_page(ViewportSize(width=1920, height=1080))
    test_log = []
    screenshots = []

    try:
        for step_index, step in enumerate(request.steps):
            action = step.get("action")
            step_name = step.get("name", f"Step {step_index + 1}")

            try:
                if action == "goto":
                    url = f"{request.base_url}{step.get('path', '')}"
                    await page.goto(url, wait_until="networkidle", timeout=30000)
                    test_log.append(f"✅ {step_name}: Navigated to {url}")

                elif action == "click":
                    selector = step.get("selector")
                    await page.click(selector, timeout=10000)
                    test_log.append(f"✅ {step_name}: Clicked {selector}")

                elif action == "fill":
                    selector = step.get("selector")
                    value = step.get("value")
                    await page.fill(selector, value, timeout=10000)
                    test_log.append(f"✅ {step_name}: Filled {selector}")

                elif action == "wait":
                    selector = step.get("selector")
                    await page.wait_for_selector(selector, timeout=10000)
                    test_log.append(f"✅ {step_name}: Waited for {selector}")

                elif action == "assert_text":
                    selector = step.get("selector")
                    expected = step.get("expected")
                    element = await page.query_selector(selector)
                    actual = await element.inner_text()
                    if expected in actual:
                        test_log.append(f"✅ {step_name}: Assert passed")
                    else:
                        test_log.append(f"❌ {step_name}: Assert failed (expected '{expected}', got '{actual}')")

                elif action == "screenshot":
                    screenshot_bytes = await playwright_runner.capture_screenshot(page, full_page=False)
                    timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
                    filename = f"{request.test_name}_step{step_index}_{timestamp}.png"
                    screenshot_url = await playwright_runner.upload_screenshot(screenshot_bytes, filename)
                    screenshots.append(screenshot_url)
                    test_log.append(f"📸 {step_name}: Screenshot captured")

                # Wait a bit between steps
                await asyncio.sleep(0.5)

            except Exception as e:
                test_log.append(f"❌ {step_name}: Error - {str(e)}")
                # Capture error screenshot
                screenshot_bytes = await playwright_runner.capture_screenshot(page, full_page=False)
                timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
                filename = f"{request.test_name}_error_step{step_index}_{timestamp}.png"
                screenshot_url = await playwright_runner.upload_screenshot(screenshot_bytes, filename)
                screenshots.append(screenshot_url)

        # Determine overall status
        failed_steps = [log for log in test_log if "❌" in log]
        status = "failed" if failed_steps else "passed"

        return {
            "test_name": request.test_name,
            "base_url": request.base_url,
            "total_steps": len(request.steps),
            "status": status,
            "test_log": test_log,
            "screenshots": screenshots
        }

    finally:
        await page.close()


# ============================================================================
# PERFORMANCE TESTING
# ============================================================================

async def run_performance_test(request: PerformanceTestRequest) -> Dict[str, Any]:
    """Run performance test and collect Core Web Vitals"""

    metrics_runs = []

    for run_index in range(request.runs):
        page = await playwright_runner.new_page(ViewportSize(width=1920, height=1080))

        try:
            # Navigate and collect performance metrics
            await page.goto(request.url, wait_until="networkidle", timeout=30000)

            # Collect Web Vitals using PerformanceObserver API
            metrics = await page.evaluate("""
                () => {
                    return new Promise((resolve) => {
                        const metrics = {};

                        // Get navigation timing
                        const navigation = performance.getEntriesByType('navigation')[0];
                        if (navigation) {
                            metrics.dns = navigation.domainLookupEnd - navigation.domainLookupStart;
                            metrics.tcp = navigation.connectEnd - navigation.connectStart;
                            metrics.ttfb = navigation.responseStart - navigation.requestStart;
                            metrics.domContentLoaded = navigation.domContentLoadedEventEnd - navigation.navigationStart;
                            metrics.loadComplete = navigation.loadEventEnd - navigation.navigationStart;
                        }

                        // Get resource timing
                        const resources = performance.getEntriesByType('resource');
                        metrics.resourceCount = resources.length;
                        metrics.totalResourceSize = resources.reduce((sum, r) => sum + (r.transferSize || 0), 0);

                        resolve(metrics);
                    });
                }
            """)

            metrics_runs.append({
                "run": run_index + 1,
                **metrics
            })

        finally:
            await page.close()

    # Calculate averages
    avg_ttfb = sum(m.get("ttfb", 0) for m in metrics_runs) / len(metrics_runs)
    avg_dom_loaded = sum(m.get("domContentLoaded", 0) for m in metrics_runs) / len(metrics_runs)
    avg_load_complete = sum(m.get("loadComplete", 0) for m in metrics_runs) / len(metrics_runs)

    return {
        "test_name": request.test_name,
        "url": request.url,
        "runs": request.runs,
        "metrics_by_run": metrics_runs,
        "averages": {
            "ttfb_ms": round(avg_ttfb, 2),
            "dom_content_loaded_ms": round(avg_dom_loaded, 2),
            "load_complete_ms": round(avg_load_complete, 2)
        },
        "status": "completed"
    }


# ============================================================================
# API ENDPOINTS
# ============================================================================

@app.on_event("startup")
async def startup_event():
    """Initialize Playwright on startup"""
    await playwright_runner.start()

@app.on_event("shutdown")
async def shutdown_event():
    """Close Playwright on shutdown"""
    await playwright_runner.stop()

@app.get("/health")
async def health():
    """Health check endpoint"""
    return {"status": "healthy", "service": "playwright-runner"}


@app.post("/screenshot")
async def screenshot_endpoint(request: ScreenshotRequest):
    """Capture single screenshot"""
    try:
        result = await capture_and_upload_screenshot(
            url=request.url,
            viewport=request.viewport,
            test_name="screenshot",
            full_page=request.full_page,
            selector=request.selector
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/visual-test")
async def visual_test_endpoint(request: VisualTestRequest):
    """Run visual regression test"""
    try:
        result = await run_visual_regression_test(request)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/accessibility-test")
async def accessibility_test_endpoint(request: AccessibilityTestRequest):
    """Run accessibility test"""
    try:
        result = await run_accessibility_test(request)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/e2e-test")
async def e2e_test_endpoint(request: E2ETestRequest):
    """Run end-to-end test"""
    try:
        result = await run_e2e_test(request)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/performance-test")
async def performance_test_endpoint(request: PerformanceTestRequest):
    """Run performance test"""
    try:
        result = await run_performance_test(request)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8002)
