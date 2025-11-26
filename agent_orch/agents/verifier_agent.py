#!/usr/bin/env python3
"""
Verifier Agent - Validates deployment health and checks for errors.
This agent hits the deployment URL, checks for console errors using Playwright,
and runs smoke tests to ensure the app loads correctly.
"""

import os
import logging
import json
import time
import requests
from typing import Dict, List, Tuple, Optional
from playwright.sync_api import sync_playwright, Browser, Page, Error as PlaywrightError

logger = logging.getLogger(__name__)


class VerifierAgent:
    """Agent responsible for deployment verification and health checks."""

    def __init__(self, timeout: int = 30):
        """
        Initialize the Verifier Agent.

        Args:
            timeout: Default timeout for HTTP requests in seconds
        """
        self.timeout = timeout
        self.playwright = None
        self.browser = None
        logger.info(f"Initialized VerifierAgent with timeout={timeout}s")

    def check_health(self, url: str, expected_status: int = 200) -> Tuple[bool, Dict[str, any]]:
        """
        Perform a basic HTTP health check.

        Args:
            url: URL to check
            expected_status: Expected HTTP status code

        Returns:
            (is_healthy, metrics) tuple
        """
        logger.info(f"Performing health check on {url}")

        try:
            start_time = time.time()
            response = requests.get(url, timeout=self.timeout, allow_redirects=True)
            response_time = time.time() - start_time

            is_healthy = response.status_code == expected_status

            metrics = {
                "url": url,
                "status_code": response.status_code,
                "response_time_ms": round(response_time * 1000, 2),
                "content_length": len(response.content),
                "headers": dict(response.headers),
                "is_healthy": is_healthy
            }

            if is_healthy:
                logger.info(f"Health check passed: {url} returned {response.status_code}")
            else:
                logger.warning(f"Health check failed: expected {expected_status}, got {response.status_code}")

            return is_healthy, metrics

        except requests.exceptions.Timeout:
            logger.error(f"Health check timed out after {self.timeout}s")
            return False, {"error": "Timeout", "url": url}
        except requests.exceptions.RequestException as e:
            logger.error(f"Health check failed: {str(e)}")
            return False, {"error": str(e), "url": url}

    def check_console_errors(
        self,
        url: str,
        fail_patterns: List[str],
        timeout: int = 60000
    ) -> Tuple[bool, List[Dict[str, str]]]:
        """
        Check for console errors using Playwright.

        Args:
            url: URL to check
            fail_patterns: List of error patterns that indicate failure
            timeout: Page load timeout in milliseconds

        Returns:
            (has_errors, console_logs) tuple
        """
        logger.info(f"Checking console errors on {url}")

        console_logs = []
        has_errors = False

        try:
            if not self.playwright:
                self.playwright = sync_playwright().start()
                self.browser = self.playwright.chromium.launch(headless=True)

            context = self.browser.new_context(
                viewport={"width": 1920, "height": 1080},
                user_agent="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36"
            )

            page = context.new_page()

            # Capture console messages
            def on_console(msg):
                log_entry = {
                    "type": msg.type,
                    "text": msg.text,
                    "location": msg.location if hasattr(msg, 'location') else {}
                }
                console_logs.append(log_entry)

                # Check if this is an error we care about
                if msg.type in ["error", "warning"]:
                    for pattern in fail_patterns:
                        if pattern.lower() in msg.text.lower():
                            logger.error(f"Found error pattern '{pattern}': {msg.text}")
                            nonlocal has_errors
                            has_errors = True

            page.on("console", on_console)

            # Capture page errors
            def on_page_error(error):
                log_entry = {
                    "type": "pageerror",
                    "text": str(error),
                    "location": {}
                }
                console_logs.append(log_entry)

                # Check against fail patterns
                for pattern in fail_patterns:
                    if pattern.lower() in str(error).lower():
                        logger.error(f"Found page error pattern '{pattern}': {error}")
                        nonlocal has_errors
                        has_errors = True

            page.on("pageerror", on_page_error)

            # Navigate and wait for page to be fully loaded
            logger.info("Navigating to page...")
            page.goto(url, wait_until="networkidle", timeout=timeout)

            # Wait a bit more to catch any delayed errors
            page.wait_for_timeout(3000)

            context.close()

            if has_errors:
                logger.error(f"Found {len([l for l in console_logs if l['type'] in ['error', 'pageerror']])} console errors")
            else:
                logger.info("No console errors detected")

            return has_errors, console_logs

        except PlaywrightError as e:
            logger.error(f"Playwright error: {str(e)}")
            return True, [{"type": "error", "text": f"Playwright error: {str(e)}", "location": {}}]
        except Exception as e:
            logger.error(f"Error checking console: {str(e)}")
            return True, [{"type": "error", "text": str(e), "location": {}}]

    def run_smoke_test(self, url: str) -> Tuple[bool, Dict[str, any]]:
        """
        Run a comprehensive smoke test on the deployment.

        Args:
            url: URL to test

        Returns:
            (passed, results) tuple
        """
        logger.info(f"Running smoke test on {url}")

        results = {
            "url": url,
            "timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
            "checks": {}
        }

        try:
            if not self.playwright:
                self.playwright = sync_playwright().start()
                self.browser = self.playwright.chromium.launch(headless=True)

            context = self.browser.new_context()
            page = context.new_page()

            # Check 1: Page loads
            try:
                page.goto(url, wait_until="networkidle", timeout=30000)
                results["checks"]["page_loads"] = {"passed": True, "message": "Page loaded successfully"}
            except Exception as e:
                results["checks"]["page_loads"] = {"passed": False, "message": str(e)}
                context.close()
                return False, results

            # Check 2: No white screen (root div has content)
            try:
                root_element = page.query_selector("#root")
                if root_element:
                    inner_html = root_element.inner_html()
                    has_content = len(inner_html.strip()) > 0
                    results["checks"]["no_white_screen"] = {
                        "passed": has_content,
                        "message": f"Root element has {len(inner_html)} characters"
                    }
                else:
                    results["checks"]["no_white_screen"] = {
                        "passed": False,
                        "message": "Root element not found"
                    }
            except Exception as e:
                results["checks"]["no_white_screen"] = {"passed": False, "message": str(e)}

            # Check 3: No React errors
            react_error_patterns = [
                "Cannot read properties of undefined",
                "Cannot read properties of null",
                "useLayoutEffect",
                "Invalid hook call",
                "Uncaught TypeError"
            ]

            has_errors, console_logs = self.check_console_errors(url, react_error_patterns, timeout=10000)
            results["checks"]["no_react_errors"] = {
                "passed": not has_errors,
                "message": f"Found {len(console_logs)} console messages",
                "errors": [log for log in console_logs if log["type"] in ["error", "pageerror"]]
            }

            # Check 4: Critical elements present
            try:
                # Check for common app elements (adjust selectors as needed)
                selectors = {
                    "navigation": "nav, [role='navigation']",
                    "main_content": "main, [role='main'], .app",
                    "header": "header, [role='banner']"
                }

                elements_found = {}
                for name, selector in selectors.items():
                    element = page.query_selector(selector)
                    elements_found[name] = element is not None

                all_found = all(elements_found.values())
                results["checks"]["critical_elements"] = {
                    "passed": any(elements_found.values()),  # At least one element should be present
                    "message": f"Found elements: {elements_found}"
                }
            except Exception as e:
                results["checks"]["critical_elements"] = {"passed": False, "message": str(e)}

            context.close()

            # Overall pass/fail
            passed = all(check["passed"] for check in results["checks"].values())
            results["overall_passed"] = passed

            if passed:
                logger.info("Smoke test PASSED")
            else:
                logger.error("Smoke test FAILED")
                logger.error(f"Failed checks: {[name for name, check in results['checks'].items() if not check['passed']]}")

            return passed, results

        except Exception as e:
            logger.error(f"Smoke test error: {str(e)}")
            results["checks"]["smoke_test"] = {"passed": False, "message": str(e)}
            results["overall_passed"] = False
            return False, results

    def cleanup(self):
        """Clean up Playwright resources."""
        try:
            if self.browser:
                self.browser.close()
            if self.playwright:
                self.playwright.stop()
            logger.info("Cleaned up Playwright resources")
        except Exception as e:
            logger.warning(f"Error during cleanup: {str(e)}")

    def __enter__(self):
        """Context manager entry."""
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        """Context manager exit."""
        self.cleanup()


if __name__ == "__main__":
    # Test the agent
    import sys
    logging.basicConfig(level=logging.INFO)

    url = "https://purple-river-0f465960f.3.azurestaticapps.net"

    with VerifierAgent() as agent:
        # Test health check
        print("\n=== Health Check ===")
        is_healthy, metrics = agent.check_health(url)
        print(json.dumps(metrics, indent=2))

        # Test smoke test
        print("\n=== Smoke Test ===")
        passed, results = agent.run_smoke_test(url)
        print(json.dumps(results, indent=2))
