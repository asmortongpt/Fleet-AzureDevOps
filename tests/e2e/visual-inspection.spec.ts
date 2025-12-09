import { test, expect } from '@playwright/test';

test('Fleet Production - Visual Inspection with Chromium', async ({ page, browser }) => {
  console.log('========================================');
  console.log('🔍 VISUAL INSPECTION - FLEET PRODUCTION');
  console.log('========================================');
  console.log('Frontend URL: https://gray-flower-03a2a730f.3.azurestaticapps.net');
  console.log('Browser: Chromium');
  console.log('');

  // Capture all console messages
  const consoleMessages: Array<{ type: string; text: string; timestamp: Date }> = [];
  page.on('console', msg => {
    const entry = {
      type: msg.type(),
      text: msg.text(),
      timestamp: new Date()
    };
    consoleMessages.push(entry);

    const icon = msg.type() === 'error' ? '❌' :
                 msg.type() === 'warning' ? '⚠️' :
                 msg.type() === 'info' ? 'ℹ️' : '📝';
    console.log(`${icon} [${msg.type()}] ${msg.text()}`);
  });

  // Capture network activity
  const networkRequests: Array<{ url: string; status: number; method: string }> = [];
  page.on('response', response => {
    networkRequests.push({
      url: response.url(),
      status: response.status(),
      method: response.request().method()
    });

    if (response.status() >= 400) {
      console.log(`❌ HTTP ${response.status()}: ${response.url()}`);
    }
  });

  console.log('📡 Navigating to production site...');
  const navigationStart = Date.now();

  try {
    await page.goto('https://gray-flower-03a2a730f.3.azurestaticapps.net', {
      waitUntil: 'networkidle',
      timeout: 60000
    });
    const navigationTime = Date.now() - navigationStart;
    console.log(`✅ Page loaded in ${navigationTime}ms`);
  } catch (error: any) {
    console.log(`⚠️ Navigation completed with: ${error.message}`);
  }

  // Wait for initial rendering
  await page.waitForTimeout(3000);

  console.log('');
  console.log('========================================');
  console.log('📊 PAGE STATE ANALYSIS');
  console.log('========================================');

  // Basic page info
  const title = await page.title();
  const url = page.url();
  console.log(`Page Title: ${title}`);
  console.log(`Current URL: ${url}`);
  console.log('');

  // React application check
  console.log('🔧 React Application:');
  const reactRoot = await page.locator('#root').count();
  const rootContent = await page.locator('#root').innerHTML().catch(() => '');
  console.log(`  ${reactRoot > 0 ? '✅' : '❌'} React root element: ${reactRoot > 0 ? 'FOUND' : 'NOT FOUND'}`);
  console.log(`  ${rootContent.length > 0 ? '✅' : '❌'} Root has content: ${rootContent.length} characters`);
  console.log('');

  // UI Component Analysis
  console.log('🎨 UI Components:');
  const components = {
    navigation: await page.locator('[role="navigation"], nav').count(),
    mainContent: await page.locator('main, [role="main"]').count(),
    buttons: await page.locator('button').count(),
    links: await page.locator('a').count(),
    headings: await page.locator('h1, h2, h3, h4, h5, h6').count(),
    forms: await page.locator('form').count(),
    tables: await page.locator('table').count(),
    images: await page.locator('img').count()
  };

  for (const [component, count] of Object.entries(components)) {
    const icon = count > 0 ? '✅' : '❌';
    console.log(`  ${icon} ${component}: ${count}`);
  }
  console.log('');

  // Fleet-specific elements
  console.log('🚗 Fleet Application Elements:');
  const fleetElements = {
    'Fleet text': await page.getByText(/fleet/i).count(),
    'Vehicle text': await page.getByText(/vehicle/i).count(),
    'Dashboard text': await page.getByText(/dashboard/i).count(),
    'Driver text': await page.getByText(/driver/i).count()
  };

  for (const [element, count] of Object.entries(fleetElements)) {
    const icon = count > 0 ? '✅' : '⚠️';
    console.log(`  ${icon} ${element}: ${count} occurrences`);
  }
  console.log('');

  // Get visible text sample
  const bodyText = await page.textContent('body') || '';
  const visibleText = bodyText.replace(/\s+/g, ' ').trim();
  console.log('📝 Visible Text Content:');
  console.log(`  Total length: ${visibleText.length} characters`);
  if (visibleText.length > 0) {
    console.log(`  Sample: ${visibleText.substring(0, 200)}...`);
  }
  console.log('');

  // CSS and Styling
  console.log('🎨 Styling:');
  const styles = await page.evaluate(() => {
    return {
      stylesheets: document.styleSheets.length,
      inlineStyles: document.querySelectorAll('[style]').length,
      computedBackgroundColor: window.getComputedStyle(document.body).backgroundColor
    };
  });
  console.log(`  ✅ Stylesheets loaded: ${styles.stylesheets}`);
  console.log(`  ✅ Elements with inline styles: ${styles.inlineStyles}`);
  console.log(`  ✅ Body background color: ${styles.computedBackgroundColor}`);
  console.log('');

  // JavaScript execution
  console.log('⚙️ JavaScript Execution:');
  const jsCheck = await page.evaluate(() => {
    return {
      reactPresent: !!(window as any).React || !!document.querySelector('[data-reactroot]'),
      windowLoaded: document.readyState === 'complete',
      scriptsLoaded: document.scripts.length
    };
  });
  console.log(`  ${jsCheck.reactPresent ? '✅' : '❌'} React detected: ${jsCheck.reactPresent}`);
  console.log(`  ${jsCheck.windowLoaded ? '✅' : '⚠️'} Window load state: ${jsCheck.windowLoaded ? 'complete' : 'loading'}`);
  console.log(`  ✅ Script tags: ${jsCheck.scriptsLoaded}`);
  console.log('');

  // Network Analysis
  console.log('========================================');
  console.log('🌐 NETWORK ANALYSIS');
  console.log('========================================');

  const successfulRequests = networkRequests.filter(r => r.status >= 200 && r.status < 300);
  const failedRequests = networkRequests.filter(r => r.status >= 400);
  const jsRequests = networkRequests.filter(r => r.url.includes('.js'));
  const cssRequests = networkRequests.filter(r => r.url.includes('.css'));
  const apiRequests = networkRequests.filter(r => r.url.includes('/api/'));

  console.log(`Total requests: ${networkRequests.length}`);
  console.log(`  ✅ Successful (2xx): ${successfulRequests.length}`);
  console.log(`  ❌ Failed (4xx/5xx): ${failedRequests.length}`);
  console.log(`  📜 JavaScript files: ${jsRequests.length}`);
  console.log(`  🎨 CSS files: ${cssRequests.length}`);
  console.log(`  🔌 API calls: ${apiRequests.length}`);
  console.log('');

  if (failedRequests.length > 0) {
    console.log('❌ Failed Requests:');
    failedRequests.slice(0, 10).forEach(req => {
      console.log(`  ${req.status} ${req.method} ${req.url}`);
    });
    console.log('');
  }

  // Console Messages Summary
  console.log('========================================');
  console.log('📋 CONSOLE MESSAGES SUMMARY');
  console.log('========================================');

  const errorMessages = consoleMessages.filter(m => m.type === 'error');
  const warningMessages = consoleMessages.filter(m => m.type === 'warning');
  const websocketErrors = errorMessages.filter(m => m.text.includes('WebSocket'));

  console.log(`Total console messages: ${consoleMessages.length}`);
  console.log(`  ❌ Errors: ${errorMessages.length}`);
  console.log(`  ⚠️ Warnings: ${warningMessages.length}`);
  console.log(`  🔌 WebSocket errors: ${websocketErrors.length}`);
  console.log('');

  if (websocketErrors.length > 0) {
    console.log('🔌 WebSocket Connection Status:');
    websocketErrors.forEach(err => {
      console.log(`  ❌ ${err.text}`);
    });
    console.log('  ℹ️ Analysis: Frontend trying to connect to backend API');
    console.log('  ℹ️ Expected: Will resolve once API container is running');
    console.log('');
  }

  // Take screenshots
  console.log('========================================');
  console.log('📸 CAPTURING SCREENSHOTS');
  console.log('========================================');

  await page.screenshot({
    path: '/tmp/fleet-visual-full.png',
    fullPage: true
  });
  console.log('✅ Full page: /tmp/fleet-visual-full.png');

  await page.screenshot({
    path: '/tmp/fleet-visual-viewport.png',
    fullPage: false
  });
  console.log('✅ Viewport: /tmp/fleet-visual-viewport.png');

  // Try to capture specific elements if they exist
  const mainElement = page.locator('main').first();
  if (await mainElement.count() > 0) {
    await mainElement.screenshot({
      path: '/tmp/fleet-visual-main.png'
    });
    console.log('✅ Main content: /tmp/fleet-visual-main.png');
  }
  console.log('');

  // Final Assessment
  console.log('========================================');
  console.log('🎯 VISUAL INSPECTION SUMMARY');
  console.log('========================================');

  const isReactWorking = reactRoot > 0 && rootContent.length > 0;
  const hasUI = components.buttons > 0 || components.navigation > 0;
  const hasContent = visibleText.length > 100;
  const hasStyles = styles.stylesheets > 0;
  const frontendWorking = isReactWorking && hasUI && hasContent && hasStyles;

  console.log(`Frontend Status: ${frontendWorking ? '✅ WORKING' : '❌ ISSUES'}`);
  console.log(`  React rendering: ${isReactWorking ? '✅' : '❌'}`);
  console.log(`  UI components: ${hasUI ? '✅' : '❌'}`);
  console.log(`  Content visible: ${hasContent ? '✅' : '❌'}`);
  console.log(`  Styles loaded: ${hasStyles ? '✅' : '❌'}`);
  console.log('');
  console.log(`Backend API: ${apiRequests.length > 0 && successfulRequests.some(r => r.url.includes('/api/')) ? '✅ RESPONDING' : '❌ NOT RESPONDING'}`);
  console.log(`  API requests attempted: ${apiRequests.length}`);
  console.log(`  WebSocket errors: ${websocketErrors.length} (expected while API is down)`);
  console.log('');
  console.log('========================================');

  // Assertions
  expect(title).toBeTruthy();
  expect(reactRoot).toBeGreaterThan(0);
  expect(visibleText.length).toBeGreaterThan(0);
});
