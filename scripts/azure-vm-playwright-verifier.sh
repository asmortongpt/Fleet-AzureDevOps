#!/bin/bash
# Azure VM Playwright Verification Script
# This script tests the production deployment in a clean environment

set -e

echo "=================================="
echo "AZURE VM PLAYWRIGHT VERIFICATION"
echo "=================================="
echo ""

# Install Playwright if not already installed
echo "[1/5] Installing Playwright..."
npm install -D @playwright/test 2>/dev/null || true
npx playwright install chromium --with-deps 2>/dev/null || true

# Create test file
echo "[2/5] Creating verification test..."
cat > /tmp/production-final-test.spec.ts << 'EOF'
import { test, expect } from '@playwright/test';

test.describe('Production Deployment Verification', () => {
  test.beforeEach(async ({ context }) => {
    // Clear all storage before each test
    await context.clearCookies();
    await context.clearPermissions();
  });

  test('should load production site without white screen', async ({ page }) => {
    console.log('\n=== STARTING PRODUCTION TEST ===\n');

    const errors: string[] = [];
    const consoleMessages: string[] = [];

    // Capture console messages
    page.on('console', msg => {
      const text = msg.text();
      consoleMessages.push(`[${msg.type()}] ${text}`);
      if (msg.type() === 'error') {
        errors.push(text);
      }
    });

    // Capture page errors
    page.on('pageerror', error => {
      const errorMsg = `PAGE ERROR: ${error.message}\n${error.stack}`;
      errors.push(errorMsg);
      console.error(errorMsg);
    });

    // Capture failed requests
    page.on('requestfailed', request => {
      const failMsg = `FAILED REQUEST: ${request.url()} - ${request.failure()?.errorText}`;
      errors.push(failMsg);
      console.error(failMsg);
    });

    // Navigate to production
    console.log('Navigating to https://fleet.capitaltechalliance.com...');

    try {
      const response = await page.goto('https://fleet.capitaltechalliance.com', {
        waitUntil: 'networkidle',
        timeout: 60000
      });

      console.log(`Response status: ${response?.status()}`);
      expect(response?.status()).toBe(200);

      // Wait for React to mount
      await page.waitForTimeout(10000);

      // Check if root div has content
      const rootExists = await page.locator('#root').count();
      console.log(`Root element exists: ${rootExists > 0}`);
      expect(rootExists).toBeGreaterThan(0);

      const rootContent = await page.evaluate(() => {
        const root = document.getElementById('root');
        if (!root) return { hasChildren: false, childCount: 0, innerHTML: '' };

        return {
          hasChildren: root.children.length > 0,
          childCount: root.children.length,
          innerHTML: root.innerHTML.substring(0, 500),
          bodyText: document.body.innerText.substring(0, 300)
        };
      });

      console.log('\n=== ROOT ELEMENT ANALYSIS ===');
      console.log('Has children:', rootContent.hasChildren);
      console.log('Child count:', rootContent.childCount);
      console.log('Body text preview:', rootContent.bodyText);
      console.log('HTML preview:', rootContent.innerHTML);

      // Take screenshot
      await page.screenshot({
        path: '/tmp/production-verification.png',
        fullPage: true
      });
      console.log('\nScreenshot saved to /tmp/production-verification.png');

      // Print all errors
      if (errors.length > 0) {
        console.log('\n=== ERRORS FOUND ===');
        errors.forEach((err, idx) => {
          console.log(`${idx + 1}. ${err}`);
        });
      } else {
        console.log('\n✅ No JavaScript errors detected');
      }

      // Print some console messages
      console.log('\n=== CONSOLE MESSAGES (first 20) ===');
      consoleMessages.slice(0, 20).forEach(msg => {
        console.log(msg);
      });

      // Main assertion
      expect(rootContent.hasChildren).toBe(true);
      expect(rootContent.childCount).toBeGreaterThan(0);

      console.log('\n=== TEST PASSED ===');
      console.log('✅ Production site loads without white screen');
      console.log('✅ React app mounted successfully');
      console.log('✅ Content visible in DOM');

    } catch (error) {
      console.error('\n=== TEST FAILED ===');
      console.error(error);

      // Take error screenshot
      await page.screenshot({
        path: '/tmp/production-error.png',
        fullPage: true
      });

      throw error;
    }
  });
});
EOF

# Run the test
echo "[3/5] Running Playwright test..."
npx playwright test /tmp/production-final-test.spec.ts --project=chromium --reporter=list

echo ""
echo "[4/5] Checking screenshot..."
if [ -f "/tmp/production-verification.png" ]; then
    echo "✅ Screenshot created: /tmp/production-verification.png"
    ls -lh /tmp/production-verification.png
else
    echo "❌ Screenshot not found"
fi

echo ""
echo "[5/5] Final verification..."
echo "Testing direct curl to production..."
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://fleet.capitaltechalliance.com)
echo "HTTP Status: $HTTP_STATUS"

if [ "$HTTP_STATUS" = "200" ]; then
    echo "✅ Production HTTP 200 OK"
else
    echo "❌ Production HTTP $HTTP_STATUS"
    exit 1
fi

echo ""
echo "=================================="
echo "VERIFICATION COMPLETE"
echo "=================================="
