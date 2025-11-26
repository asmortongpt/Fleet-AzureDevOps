import { test, expect } from '@playwright/test';

test('diagnose production white screen', async ({ page }) => {
  // Capture all console messages
  const consoleLogs: string[] = [];
  page.on('console', msg => {
    const text = `[${msg.type()}] ${msg.text()}`;
    console.log('BROWSER:', text);
    consoleLogs.push(text);
  });

  // Capture page errors
  const pageErrors: string[] = [];
  page.on('pageerror', error => {
    const text = `ERROR: ${error.message}\n${error.stack}`;
    console.log('PAGE ERROR:', text);
    pageErrors.push(text);
  });

  // Capture failed requests
  const failedRequests: string[] = [];
  page.on('requestfailed', request => {
    const text = `FAILED: ${request.url()} - ${request.failure()?.errorText}`;
    console.log('REQUEST FAILED:', text);
    failedRequests.push(text);
  });

  console.log('\n=== NAVIGATING TO PRODUCTION ===');
  await page.goto('https://fleet.capitaltechalliance.com', {
    waitUntil: 'networkidle',
    timeout: 30000
  });

  // Wait a bit
  await page.waitForTimeout(3000);

  // Check root div
  const rootContent = await page.evaluate(() => {
    const root = document.getElementById('root');
    return {
      exists: !!root,
      innerHTML: root?.innerHTML?.substring(0, 500) || 'NO CONTENT',
      childCount: root?.children.length || 0,
      hasErrorBoundary: root?.innerHTML?.includes('runtime error') || false
    };
  });

  console.log('\n=== ROOT DIV STATE ===');
  console.log(JSON.stringify(rootContent, null, 2));

  // Check if runtime config loaded
  const runtimeConfig = await page.evaluate(() => {
    return (window as any).__RUNTIME_CONFIG__;
  });

  console.log('\n=== RUNTIME CONFIG ===');
  console.log(JSON.stringify(runtimeConfig, null, 2));

  // Take screenshot
  await page.screenshot({ path: '/tmp/production-white-screen.png', fullPage: true });
  console.log('\nScreenshot saved to /tmp/production-white-screen.png');

  // Print summary
  console.log('\n=== DIAGNOSTIC SUMMARY ===');
  console.log(`Console Logs: ${consoleLogs.length}`);
  console.log(`Page Errors: ${pageErrors.length}`);
  console.log(`Failed Requests: ${failedRequests.length}`);

  if (pageErrors.length > 0) {
    console.log('\n=== ALL PAGE ERRORS ===');
    pageErrors.forEach(err => console.log(err));
  }

  if (failedRequests.length > 0) {
    console.log('\n=== ALL FAILED REQUESTS ===');
    failedRequests.forEach(req => console.log(req));
  }

  // Keep browser open
  await page.waitForTimeout(10000);
});
