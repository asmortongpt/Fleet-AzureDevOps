/**
 * Comprehensive SSO Final Test
 *
 * This test validates the complete SSO authentication flow including:
 * - Clean browser state (no cached auth)
 * - Login page UI elements
 * - Microsoft SSO redirect
 * - Post-authentication state
 * - No redirect loops
 * - MSAL token storage
 * - Console error checking
 *
 * IMPORTANT: This test requires manual authentication during the Microsoft login step
 * Run with: npx playwright test e2e/sso-final-test.spec.ts --headed --project=chromium
 */

import { test, expect, Page } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

interface TestReport {
  testName: string;
  status: 'PASS' | 'FAIL';
  duration: number;
  timestamp: string;
  findings: string[];
  consoleErrors: string[];
  consoleWarnings: string[];
  screenshots: string[];
  sessionStorage: Record<string, string>;
  error?: string;
}

const testReports: TestReport[] = [];
const screenshotDir = path.join(process.cwd(), 'test-results', 'sso-final-test');

// Ensure screenshot directory exists
if (!fs.existsSync(screenshotDir)) {
  fs.mkdirSync(screenshotDir, { recursive: true });
}

/**
 * Helper: Capture screenshot with proper naming
 */
async function captureScreenshot(page: Page, name: string): Promise<string> {
  const filename = `${Date.now()}-${name}.png`;
  const filepath = path.join(screenshotDir, filename);
  await page.screenshot({ path: filepath, fullPage: true });
  return filepath;
}

/**
 * Helper: Get all sessionStorage keys and values
 */
async function getSessionStorage(page: Page): Promise<Record<string, string>> {
  return await page.evaluate(() => {
    const storage: Record<string, string> = {};
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (key) {
        storage[key] = sessionStorage.getItem(key) || '';
      }
    }
    return storage;
  });
}

/**
 * Helper: Check for MSAL tokens in sessionStorage
 */
async function checkMSALTokens(page: Page): Promise<{ found: boolean; keys: string[] }> {
  const storage = await getSessionStorage(page);
  const msalKeys = Object.keys(storage).filter(key =>
    key.includes('msal') ||
    key.includes('login.windows.net') ||
    key.includes('login.microsoftonline.com')
  );
  return {
    found: msalKeys.length > 0,
    keys: msalKeys
  };
}

test.describe('SSO Final Test - Comprehensive Validation', () => {
  let currentReport: TestReport;
  let startTime: number;
  let consoleMessages: string[] = [];

  test.beforeEach(async ({ page, context }) => {
    startTime = Date.now();
    consoleMessages = [];

    currentReport = {
      testName: '',
      status: 'PASS',
      duration: 0,
      timestamp: new Date().toISOString(),
      findings: [],
      consoleErrors: [],
      consoleWarnings: [],
      screenshots: [],
      sessionStorage: {}
    };

    // Clear all browser storage to ensure clean state
    await context.clearCookies();
    await page.goto('http://localhost:5173');
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });

    // Capture console messages
    page.on('console', (msg) => {
      const text = msg.text();
      const type = msg.type();

      // Store all console messages for debugging
      consoleMessages.push(`[${type.toUpperCase()}] ${text}`);

      // Filter out known acceptable messages
      const isAxeMessage = text.includes('axe-core') || text.includes('Fix any of the following');
      const isDevMessage = text.includes('[HMR]') || text.includes('[vite]');

      if (type === 'error' && !isAxeMessage && !isDevMessage) {
        currentReport.consoleErrors.push(text);
        console.log(`❌ [CONSOLE ERROR] ${text}`);
      } else if (type === 'warning' && !isAxeMessage && !isDevMessage) {
        currentReport.consoleWarnings.push(text);
      }

      // Check for MSAL login success
      if (text.includes('[MSAL] Active account set after login')) {
        currentReport.findings.push('✅ MSAL login success detected in console');
      }
    });

    // Capture page errors
    page.on('pageerror', (error) => {
      currentReport.consoleErrors.push(`Page Error: ${error.message}`);
      console.error('❌ [PAGE ERROR]', error.message);
    });
  });

  test.afterEach(async ({ page }, testInfo) => {
    currentReport.duration = Date.now() - startTime;
    currentReport.testName = testInfo.title;
    currentReport.status = testInfo.status === 'passed' ? 'PASS' : 'FAIL';

    if (testInfo.error) {
      currentReport.error = testInfo.error.message;
    }

    // Capture final sessionStorage state
    try {
      currentReport.sessionStorage = await getSessionStorage(page);
    } catch (e) {
      console.log('Could not capture sessionStorage:', e);
    }

    testReports.push({ ...currentReport });

    // Print summary
    console.log(`\n${'='.repeat(80)}`);
    console.log(`TEST: ${currentReport.testName}`);
    console.log(`STATUS: ${currentReport.status}`);
    console.log(`DURATION: ${(currentReport.duration / 1000).toFixed(2)}s`);
    console.log(`FINDINGS: ${currentReport.findings.length}`);
    currentReport.findings.forEach(f => console.log(`  ${f}`));
    if (currentReport.consoleErrors.length > 0) {
      console.log(`CONSOLE ERRORS: ${currentReport.consoleErrors.length}`);
      currentReport.consoleErrors.slice(0, 3).forEach(e => console.log(`  ${e}`));
    }
    console.log(`${'='.repeat(80)}\n`);
  });

  test('Complete SSO Authentication Flow', async ({ page }) => {
    console.log('\n🚀 Starting Comprehensive SSO Test\n');

    // ===================================================================
    // STEP 1: Load Login Page with Clean State
    // ===================================================================
    console.log('📋 STEP 1: Loading login page with clean browser state...');
    await page.goto('http://localhost:5173/login');
    await page.waitForLoadState('networkidle');

    const step1Screenshot = await captureScreenshot(page, 'step1-login-page');
    currentReport.screenshots.push(step1Screenshot);
    currentReport.findings.push('✅ Step 1: Login page loaded');

    // ===================================================================
    // STEP 2: Verify Login Page UI Elements
    // ===================================================================
    console.log('📋 STEP 2: Verifying login page UI elements...');

    // Wait a bit longer for the page to fully render
    await page.waitForTimeout(2000);

    // Check for main heading with more specific selector
    const heading = page.locator('h1, h2, h3').filter({ hasText: /Welcome Back/i });
    const headingVisible = await heading.isVisible().catch(() => false);

    if (headingVisible) {
      currentReport.findings.push('✅ Step 2: Login page heading visible');
    } else {
      currentReport.findings.push('⚠️  Step 2: Login page heading not found');
      // Take a debug screenshot
      const debugScreenshot = await captureScreenshot(page, 'step2-debug-heading');
      currentReport.screenshots.push(debugScreenshot);
    }

    // Check for Microsoft SSO button
    const microsoftButton = page.getByRole('button', { name: /Sign in with Microsoft/i });
    const buttonVisible = await microsoftButton.isVisible({ timeout: 5000 }).catch(() => false);

    if (buttonVisible) {
      currentReport.findings.push('✅ Step 2: Microsoft SSO button visible');
    } else {
      currentReport.findings.push('⚠️  Step 2: Microsoft SSO button not found');
      // Try to find any buttons
      const allButtons = await page.locator('button').allTextContents();
      console.log('All buttons found:', allButtons);
    }

    // Check for email/password form
    const emailInput = page.getByLabel(/Email/i);
    const passwordInput = page.getByLabel(/Password/i);
    const emailVisible = await emailInput.isVisible().catch(() => false);
    const passwordVisible = await passwordInput.isVisible().catch(() => false);

    if (emailVisible && passwordVisible) {
      currentReport.findings.push('✅ Step 2: Email/password form visible');
    } else {
      currentReport.findings.push('⚠️  Step 2: Email/password form partially visible');
    }

    console.log('✅ Login page verification complete\n');

    // Only proceed with SSO test if button is visible
    if (!buttonVisible) {
      throw new Error('Microsoft SSO button not visible - cannot proceed with test');
    }

    // ===================================================================
    // STEP 3: Click Microsoft SSO Button and Verify Redirect
    // ===================================================================
    console.log('📋 STEP 3: Clicking Microsoft SSO button...');

    const step3BeforeScreenshot = await captureScreenshot(page, 'step3-before-click');
    currentReport.screenshots.push(step3BeforeScreenshot);

    // Click and wait for redirect to Microsoft
    try {
      await Promise.race([
        page.waitForURL(/login\.microsoftonline\.com/, { timeout: 15000 }),
        microsoftButton.click()
      ]);

      // Give it a moment to fully load
      await page.waitForLoadState('networkidle');

      const currentUrl = page.url();
      console.log(`✅ Redirected to: ${currentUrl}`);

      const step3AfterScreenshot = await captureScreenshot(page, 'step3-microsoft-login');
      currentReport.screenshots.push(step3AfterScreenshot);

      // Verify URL contains expected parameters
      expect(currentUrl).toContain('login.microsoftonline.com');
      currentReport.findings.push('✅ Step 3: Redirected to Microsoft login');

      if (currentUrl.includes('0ec14b81-7b82-45ee-8f3d-cbc31ced5347')) {
        currentReport.findings.push('✅ Step 3: Correct tenant ID in URL');
      }
      if (currentUrl.includes('baae0851-0c24-4214-8587-e3fabc46bd4a')) {
        currentReport.findings.push('✅ Step 3: Correct client ID in URL');
      }
    } catch (error) {
      currentReport.findings.push('❌ Step 3: Failed to redirect to Microsoft');
      throw error;
    }

    // ===================================================================
    // STEP 4: Manual Authentication Required
    // ===================================================================
    console.log('\n📋 STEP 4: Manual authentication required');
    console.log('╔════════════════════════════════════════════════════════════════╗');
    console.log('║  PLEASE COMPLETE MICROSOFT AUTHENTICATION:                    ║');
    console.log('║  1. Enter your @capitaltechalliance.com email                  ║');
    console.log('║  2. Enter your password                                        ║');
    console.log('║  3. Complete MFA if prompted                                   ║');
    console.log('║  4. Accept consent if prompted                                 ║');
    console.log('║  5. Wait for redirect back to localhost:5173                   ║');
    console.log('╚════════════════════════════════════════════════════════════════╝\n');

    // Pause for manual authentication
    console.log('⏸️  Test paused - Press RESUME in Playwright Inspector after login\n');
    await page.pause();

    // ===================================================================
    // STEP 5: Verify Post-Authentication State
    // ===================================================================
    console.log('\n📋 STEP 5: Verifying post-authentication state...');

    // Wait a moment for any redirects to complete
    await page.waitForTimeout(3000);

    const finalUrl = page.url();
    console.log(`Current URL: ${finalUrl}`);

    const step5Screenshot = await captureScreenshot(page, 'step5-after-auth');
    currentReport.screenshots.push(step5Screenshot);

    // Should be back at localhost (not Microsoft domain)
    const isBackAtApp = !finalUrl.includes('microsoftonline.com') && finalUrl.includes('localhost:5173');
    expect(isBackAtApp).toBeTruthy();
    currentReport.findings.push('✅ Step 5: Redirected back to application');

    // ===================================================================
    // STEP 6: Check for Redirect Loop
    // ===================================================================
    console.log('\n📋 STEP 6: Checking for redirect loops...');

    const initialUrl = page.url();
    console.log(`Initial URL: ${initialUrl}`);

    // Wait and check if URL changes (indicating a redirect loop)
    await page.waitForTimeout(3000);
    const urlAfterWait = page.url();
    console.log(`URL after 3s: ${urlAfterWait}`);

    // Should stay on the same page (no redirect loop)
    const noRedirectLoop = initialUrl === urlAfterWait;
    expect(noRedirectLoop).toBeTruthy();

    if (noRedirectLoop) {
      currentReport.findings.push('✅ Step 6: No redirect loop detected');
    } else {
      currentReport.findings.push('❌ Step 6: Redirect loop detected');
    }

    // Check that we're NOT on login page
    const isOnLogin = urlAfterWait.includes('/login');
    if (!isOnLogin) {
      currentReport.findings.push('✅ Step 6: User stayed on dashboard (not redirected to login)');
    } else {
      currentReport.findings.push('⚠️  Step 6: User redirected back to login page');
    }

    // ===================================================================
    // STEP 7: Verify MSAL Tokens in sessionStorage
    // ===================================================================
    console.log('\n📋 STEP 7: Checking for MSAL tokens in sessionStorage...');

    const tokenCheck = await checkMSALTokens(page);
    console.log(`MSAL tokens found: ${tokenCheck.found}`);
    console.log(`MSAL keys: ${tokenCheck.keys.length}`);

    if (tokenCheck.found) {
      currentReport.findings.push(`✅ Step 7: MSAL tokens found (${tokenCheck.keys.length} keys)`);
      tokenCheck.keys.slice(0, 3).forEach(key => {
        console.log(`  - ${key}`);
      });
    } else {
      currentReport.findings.push('⚠️  Step 7: No MSAL tokens found in sessionStorage');
    }

    // ===================================================================
    // STEP 8: Verify MSAL Console Logs
    // ===================================================================
    console.log('\n📋 STEP 8: Checking console for MSAL messages...');

    const msalLoginSuccess = consoleMessages.some(msg =>
      msg.includes('[MSAL] Active account set after login')
    );

    if (msalLoginSuccess) {
      currentReport.findings.push('✅ Step 8: MSAL login success message found in console');
    } else {
      currentReport.findings.push('⚠️  Step 8: MSAL login success message NOT found in console');
      console.log('Console messages:');
      consoleMessages.filter(m => m.includes('MSAL') || m.includes('Auth')).forEach(m => {
        console.log(`  ${m}`);
      });
    }

    // ===================================================================
    // STEP 9: Check for Console Errors
    // ===================================================================
    console.log('\n📋 STEP 9: Checking for console errors...');

    if (currentReport.consoleErrors.length === 0) {
      currentReport.findings.push('✅ Step 9: No console errors detected');
    } else {
      currentReport.findings.push(`⚠️  Step 9: ${currentReport.consoleErrors.length} console errors found`);
      console.log('Console errors:');
      currentReport.consoleErrors.forEach(err => {
        console.log(`  ❌ ${err}`);
      });
    }

    // ===================================================================
    // STEP 10: Verify User is Authenticated
    // ===================================================================
    console.log('\n📋 STEP 10: Verifying user authentication state...');

    // Try to access a protected route
    await page.goto('http://localhost:5173/fleet');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    const protectedUrl = page.url();
    console.log(`Protected route URL: ${protectedUrl}`);

    const step10Screenshot = await captureScreenshot(page, 'step10-protected-route');
    currentReport.screenshots.push(step10Screenshot);

    const canAccessProtectedRoute = !protectedUrl.includes('/login');
    if (canAccessProtectedRoute) {
      currentReport.findings.push('✅ Step 10: Can access protected route (authenticated)');
    } else {
      currentReport.findings.push('❌ Step 10: Cannot access protected route (not authenticated)');
    }

    // ===================================================================
    // FINAL SUMMARY
    // ===================================================================
    console.log('\n' + '='.repeat(80));
    console.log('FINAL TEST SUMMARY');
    console.log('='.repeat(80));
    console.log(`Total Findings: ${currentReport.findings.length}`);
    console.log(`Console Errors: ${currentReport.consoleErrors.length}`);
    console.log(`Console Warnings: ${currentReport.consoleWarnings.length}`);
    console.log(`Screenshots: ${currentReport.screenshots.length}`);
    console.log('\nFindings:');
    currentReport.findings.forEach(f => console.log(`  ${f}`));
    console.log('='.repeat(80) + '\n');

    // Test assertions
    expect(tokenCheck.found).toBeTruthy();
    expect(noRedirectLoop).toBeTruthy();
    expect(canAccessProtectedRoute).toBeTruthy();
    expect(currentReport.consoleErrors.length).toBeLessThan(3);
  });
});

// Generate HTML report after all tests
test.afterAll(async () => {
  console.log('\n📊 Generating test report...\n');

  const reportPath = path.join(screenshotDir, 'sso-final-test-report.html');

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>SSO Final Test Report</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 20px;
      min-height: 100vh;
    }
    .container {
      max-width: 1400px;
      margin: 0 auto;
      background: white;
      padding: 40px;
      border-radius: 12px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
    }
    h1 {
      color: #2c3e50;
      margin-bottom: 10px;
      font-size: 32px;
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .meta {
      color: #7f8c8d;
      margin-bottom: 30px;
      font-size: 14px;
      line-height: 1.6;
    }
    .summary {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 20px;
      margin-bottom: 40px;
    }
    .stat-card {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 25px;
      border-radius: 12px;
      color: white;
      text-align: center;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    }
    .stat-card.pass { background: linear-gradient(135deg, #56ab2f 0%, #a8e063 100%); }
    .stat-card.fail { background: linear-gradient(135deg, #eb3349 0%, #f45c43 100%); }
    .stat-card h3 { font-size: 14px; opacity: 0.95; margin-bottom: 10px; text-transform: uppercase; letter-spacing: 1px; }
    .stat-card .value { font-size: 48px; font-weight: bold; }
    .test-result {
      border: 2px solid #e1e8ed;
      border-radius: 12px;
      padding: 30px;
      margin-bottom: 30px;
      background: #f8f9fa;
    }
    .test-result.PASS { border-left: 6px solid #56ab2f; }
    .test-result.FAIL { border-left: 6px solid #eb3349; }
    .test-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
    }
    .test-name { font-weight: 700; color: #2c3e50; font-size: 20px; }
    .test-status {
      padding: 8px 20px;
      border-radius: 20px;
      font-size: 14px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    .test-status.PASS { background: #56ab2f; color: white; }
    .test-status.FAIL { background: #eb3349; color: white; }
    .findings { margin-top: 20px; }
    .findings h4 {
      color: #2c3e50;
      margin-bottom: 15px;
      font-size: 16px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .findings ul {
      list-style: none;
      padding-left: 0;
    }
    .findings li {
      padding: 10px 15px;
      margin-bottom: 8px;
      background: white;
      border-radius: 6px;
      border-left: 3px solid #3498db;
      font-size: 14px;
      line-height: 1.5;
    }
    .findings li:before {
      margin-right: 10px;
    }
    .error-section {
      background: #fff5f5;
      border: 2px solid #feb2b2;
      padding: 20px;
      border-radius: 8px;
      margin-top: 20px;
    }
    .error-section h4 { color: #c53030; margin-bottom: 10px; }
    .error-section ul { list-style: none; padding-left: 0; }
    .error-section li {
      color: #c53030;
      font-size: 13px;
      padding: 8px 0;
      border-bottom: 1px solid #fed7d7;
      font-family: 'Courier New', monospace;
    }
    .screenshots {
      margin-top: 25px;
      padding: 20px;
      background: white;
      border-radius: 8px;
    }
    .screenshots h4 {
      color: #2c3e50;
      margin-bottom: 15px;
      font-size: 16px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .screenshots a {
      display: inline-block;
      margin: 5px 10px 5px 0;
      color: #3498db;
      text-decoration: none;
      padding: 8px 15px;
      background: #e8f4fd;
      border-radius: 6px;
      font-size: 13px;
      transition: all 0.2s;
    }
    .screenshots a:hover {
      background: #3498db;
      color: white;
      transform: translateY(-2px);
    }
    footer {
      margin-top: 50px;
      padding-top: 30px;
      border-top: 2px solid #e1e8ed;
      text-align: center;
      color: #7f8c8d;
      font-size: 13px;
    }
    .session-storage {
      margin-top: 20px;
      padding: 15px;
      background: #f8f9fa;
      border-radius: 6px;
      font-family: 'Courier New', monospace;
      font-size: 12px;
      max-height: 200px;
      overflow-y: auto;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>
      <span>🔒</span>
      SSO Final Test Report
    </h1>
    <div class="meta">
      <strong>Generated:</strong> ${new Date().toLocaleString()}<br>
      <strong>Test Environment:</strong> http://localhost:5173<br>
      <strong>Azure AD Tenant:</strong> 0ec14b81-7b82-45ee-8f3d-cbc31ced5347<br>
      <strong>Client ID:</strong> baae0851-0c24-4214-8587-e3fabc46bd4a<br>
      <strong>Redirect URI:</strong> http://localhost:5173/auth/callback
    </div>

    <div class="summary">
      <div class="stat-card">
        <h3>Total Tests</h3>
        <div class="value">${testReports.length}</div>
      </div>
      <div class="stat-card pass">
        <h3>Passed</h3>
        <div class="value">${testReports.filter(r => r.status === 'PASS').length}</div>
      </div>
      <div class="stat-card fail">
        <h3>Failed</h3>
        <div class="value">${testReports.filter(r => r.status === 'FAIL').length}</div>
      </div>
      <div class="stat-card">
        <h3>Duration</h3>
        <div class="value">${(testReports.reduce((sum, r) => sum + r.duration, 0) / 1000).toFixed(1)}s</div>
      </div>
    </div>

    <h2 style="color: #2c3e50; margin-bottom: 25px; font-size: 24px;">📋 Test Results</h2>
    ${testReports.map(result => `
      <div class="test-result ${result.status}">
        <div class="test-header">
          <div class="test-name">${result.testName}</div>
          <div class="test-status ${result.status}">${result.status}</div>
        </div>
        <div style="color: #7f8c8d; font-size: 14px; margin-bottom: 15px;">
          ⏱️ Duration: ${(result.duration / 1000).toFixed(2)}s |
          🕐 ${new Date(result.timestamp).toLocaleTimeString()}
        </div>

        ${result.findings.length > 0 ? `
          <div class="findings">
            <h4>🔍 Findings (${result.findings.length})</h4>
            <ul>
              ${result.findings.map(finding => `<li>${finding}</li>`).join('')}
            </ul>
          </div>
        ` : ''}

        ${result.error ? `
          <div class="error-section">
            <h4>❌ Error Details</h4>
            <pre style="color: #c53030; white-space: pre-wrap;">${result.error}</pre>
          </div>
        ` : ''}

        ${result.consoleErrors.length > 0 ? `
          <div class="error-section">
            <h4>⚠️  Console Errors (${result.consoleErrors.length})</h4>
            <ul>
              ${result.consoleErrors.map(err => `<li>${err}</li>`).join('')}
            </ul>
          </div>
        ` : ''}

        ${result.screenshots.length > 0 ? `
          <div class="screenshots">
            <h4>📸 Screenshots (${result.screenshots.length})</h4>
            ${result.screenshots.map(path => {
              const filename = path.split('/').pop();
              return `<a href="${path}" target="_blank">🖼️ ${filename}</a>`;
            }).join('')}
          </div>
        ` : ''}

        ${Object.keys(result.sessionStorage).length > 0 ? `
          <div class="session-storage">
            <strong>📦 SessionStorage Keys (${Object.keys(result.sessionStorage).length}):</strong><br>
            ${Object.keys(result.sessionStorage).filter(k => k.includes('msal')).slice(0, 5).map(key =>
              `<div style="margin-top: 5px;">• ${key}</div>`
            ).join('')}
          </div>
        ` : ''}
      </div>
    `).join('')}

    <footer>
      <strong>Fleet Management System - SSO Authentication Test</strong><br>
      Capital Tech Alliance © 2026<br>
      <em>Comprehensive SSO validation with infinite loop detection</em>
    </footer>
  </div>
</body>
</html>
  `;

  fs.writeFileSync(reportPath, html);
  console.log(`✅ HTML report generated: ${reportPath}\n`);

  // Also generate JSON report
  const jsonPath = path.join(screenshotDir, 'sso-final-test-report.json');
  fs.writeFileSync(jsonPath, JSON.stringify({
    generated: new Date().toISOString(),
    environment: {
      baseUrl: 'http://localhost:5173',
      tenantId: '0ec14b81-7b82-45ee-8f3d-cbc31ced5347',
      clientId: 'baae0851-0c24-4214-8587-e3fabc46bd4a'
    },
    summary: {
      total: testReports.length,
      passed: testReports.filter(r => r.status === 'PASS').length,
      failed: testReports.filter(r => r.status === 'FAIL').length,
      totalDuration: testReports.reduce((sum, r) => sum + r.duration, 0)
    },
    results: testReports
  }, null, 2));
  console.log(`✅ JSON report generated: ${jsonPath}\n`);
});
