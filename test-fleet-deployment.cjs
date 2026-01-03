const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    ignoreHTTPSErrors: true
  });
  const page = await context.newPage();

  // Collect console messages
  const consoleMessages = [];
  page.on('console', msg => {
    const type = msg.type();
    const text = msg.text();
    consoleMessages.push(`[${type}] ${text}`);
  });

  // Collect errors
  const errors = [];
  page.on('pageerror', error => {
    errors.push(`Page Error: ${error.message}`);
  });

  // Collect failed requests
  const failedRequests = [];
  page.on('requestfailed', request => {
    const url = request.url();
    const failure = request.failure();
    failedRequests.push(`Failed: ${url} - ${failure ? failure.errorText : 'Unknown'}`);
  });

  console.log('🌐 Testing Fleet deployment at http://20.161.96.87/');

  try {
    // Navigate to the page
    await page.goto('http://20.161.96.87/', { waitUntil: 'networkidle', timeout: 30000 });

    // Wait a bit for React to render
    await page.waitForTimeout(3000);

    // Check page title
    const title = await page.title();
    console.log(`\n✅ Page Title: ${title}`);

    // Check if root div has content
    const rootContent = await page.$eval('#root', el => el.innerHTML);
    console.log(`\n📦 Root div content length: ${rootContent.length} characters`);
    if (rootContent.length > 0) {
      console.log('✅ React app rendered content to #root');
      console.log('First 200 chars:', rootContent.substring(0, 200));
    } else {
      console.log('❌ Root div is empty - React app did not render');
    }

    // Check for specific elements
    const hasHeader = await page.$('header') !== null;
    const hasNav = await page.$('nav') !== null;
    const hasMain = await page.$('main') !== null;

    console.log('\n🔍 Page Structure:');
    console.log(`  Header: ${hasHeader ? '✅' : '❌'}`);
    console.log(`  Nav: ${hasNav ? '✅' : '❌'}`);
    console.log(`  Main: ${hasMain ? '✅' : '❌'}`);

    // Take screenshot
    await page.screenshot({ path: '/tmp/fleet-screenshot.png', fullPage: true });
    console.log('\n📸 Screenshot saved to /tmp/fleet-screenshot.png');

    // Print console messages
    if (consoleMessages.length > 0) {
      console.log('\n📋 Console Messages:');
      consoleMessages.forEach(msg => console.log(`  ${msg}`));
    }

    // Print errors
    if (errors.length > 0) {
      console.log('\n❌ JavaScript Errors:');
      errors.forEach(err => console.log(`  ${err}`));
    } else {
      console.log('\n✅ No JavaScript errors detected');
    }

    // Print failed requests
    if (failedRequests.length > 0) {
      console.log('\n❌ Failed Requests:');
      failedRequests.forEach(req => console.log(`  ${req}`));
    } else {
      console.log('\n✅ No failed requests');
    }

    // Test API health endpoint
    console.log('\n🏥 Testing API endpoints:');
    try {
      const healthResponse = await page.goto('http://20.161.96.87/api/health', { timeout: 10000 });
      const status = healthResponse.status();
      const statusText = healthResponse.statusText();
      console.log(`  /api/health: ${status} ${statusText}`);
      if (healthResponse.ok()) {
        const healthData = await healthResponse.text();
        console.log(`  Response: ${healthData.substring(0, 200)}`);
      }
    } catch (e) {
      console.log(`  /api/health: Failed - ${e.message}`);
    }

  } catch (error) {
    console.error('\n💥 Test failed:', error.message);
  } finally {
    await browser.close();
  }
})();
