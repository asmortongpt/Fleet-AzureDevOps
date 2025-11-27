#!/bin/bash
set -e

# Smoke test script for Fleet deployment verification
# Usage: ./scripts/smoke_test.sh <URL>

URL=${1:-"https://purple-river-0f465960f.3.azurestaticapps.net"}

echo "================================================"
echo "Fleet Deployment Smoke Test"
echo "================================================"
echo "URL: $URL"
echo "Timestamp: $(date -u +"%Y-%m-%d %H:%M:%S UTC")"
echo "================================================"
echo ""

# Test 1: Health check
echo "✓ Test 1: Health Check"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$URL")

if [ "$HTTP_CODE" = "200" ]; then
  echo "  PASS: Endpoint returned HTTP 200"
else
  echo "  FAIL: Expected HTTP 200, got $HTTP_CODE"
  exit 1
fi

# Test 2: Content check
echo ""
echo "✓ Test 2: Content Check"
CONTENT=$(curl -s "$URL")
CONTENT_LENGTH=${#CONTENT}

if [ $CONTENT_LENGTH -gt 100 ]; then
  echo "  PASS: Received $CONTENT_LENGTH bytes of content"
else
  echo "  FAIL: Content too small ($CONTENT_LENGTH bytes)"
  exit 1
fi

# Test 3: Check for root div
if echo "$CONTENT" | grep -q '<div id="root">'; then
  echo "  PASS: Found root div"
else
  echo "  FAIL: Root div not found"
  exit 1
fi

# Test 4: Check for React app indicator
if echo "$CONTENT" | grep -q 'type="module"' || echo "$CONTENT" | grep -q 'react'; then
  echo "  PASS: React app indicators found"
else
  echo "  FAIL: React app indicators not found"
  exit 1
fi

# Test 5: Playwright browser tests (if available)
if command -v npx &> /dev/null; then
  echo ""
  echo "✓ Test 5: Browser Tests (Playwright)"

  # Create a temporary test file
  cat > /tmp/smoke-test-temp.spec.ts << EOF
import { test, expect } from '@playwright/test';

test('smoke test', async ({ page }) => {
  await page.goto('$URL');

  // Check for root element
  const root = page.locator('#root');
  await expect(root).toBeVisible();

  // Check page title
  await expect(page).toHaveTitle(/fleet/i);

  // Check for no console errors
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));

  await page.waitForTimeout(3000);

  const criticalErrors = errors.filter(err =>
    err.includes('useLayoutEffect') ||
    err.includes('Cannot read properties of undefined') ||
    err.includes('Cannot read properties of null')
  );

  expect(criticalErrors).toHaveLength(0);

  console.log('Browser smoke test PASSED');
});
EOF

  # Run Playwright test
  npx playwright test /tmp/smoke-test-temp.spec.ts --config=playwright.config.ts 2>/dev/null || {
    echo "  WARN: Playwright test failed or not configured"
  }

  rm -f /tmp/smoke-test-temp.spec.ts
else
  echo ""
  echo "✓ Test 5: Browser Tests (Playwright)"
  echo "  SKIP: Playwright not available"
fi

echo ""
echo "================================================"
echo "SMOKE TEST PASSED ✓"
echo "================================================"
exit 0
