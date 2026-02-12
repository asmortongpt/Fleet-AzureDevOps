import { chromium } from 'playwright';

async function checkConsoleErrors() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  const consoleErrors = [];
  const consoleWarnings = [];
  const pageErrors = [];
  const failedRequests = [];

  // Track network responses
  page.on('response', response => {
    if (response.status() >= 400) {
      failedRequests.push({
        url: response.url(),
        status: response.status(),
        statusText: response.statusText(),
      });
    }
  });

  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    } else if (msg.type() === 'warning') {
      consoleWarnings.push(msg.text());
    }
  });

  page.on('pageerror', error => {
    pageErrors.push(error.message);
  });

  console.log('🌐 Navigating to http://localhost:5173...');
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });

  // Wait a bit for any lazy-loaded content
  await page.waitForTimeout(3000);

  console.log('\n=== BROWSER CONSOLE CHECK ===\n');

  console.log(`📊 Summary:`);
  console.log(`  - Console Errors: ${consoleErrors.length}`);
  console.log(`  - Console Warnings: ${consoleWarnings.length}`);
  console.log(`  - Page Errors (Uncaught Exceptions): ${pageErrors.length}`);
  console.log(`  - Failed Network Requests: ${failedRequests.length}`);

  if (failedRequests.length > 0) {
    console.log(`\n🔴 FAILED NETWORK REQUESTS (${failedRequests.length}):`);
    failedRequests.forEach((req, i) => {
      console.log(`  ${i + 1}. ${req.status} ${req.statusText}`);
      console.log(`     ${req.url}`);
    });
  } else {
    console.log('\n✅ No failed network requests!');
  }

  if (consoleErrors.length > 0) {
    console.log(`\n❌ CONSOLE ERRORS (${consoleErrors.length}):`);
    consoleErrors.forEach((err, i) => {
      console.log(`  ${i + 1}. ${err}`);
    });
  } else {
    console.log('\n✅ No console errors found!');
  }

  if (pageErrors.length > 0) {
    console.log(`\n❌ PAGE ERRORS (${pageErrors.length}):`);
    pageErrors.forEach((err, i) => {
      console.log(`  ${i + 1}. ${err}`);
    });
  }

  if (consoleWarnings.length > 0) {
    console.log(`\n⚠️  CONSOLE WARNINGS (showing first 10 of ${consoleWarnings.length}):`);
    consoleWarnings.slice(0, 10).forEach((warn, i) => {
      console.log(`  ${i + 1}. ${warn.substring(0, 200)}`);
    });
  }

  console.log('\n💡 Browser left open for manual inspection. Press Ctrl+C when done.\n');

  // Keep browser open for manual inspection
  await new Promise(() => {});
}

checkConsoleErrors().catch(console.error);
