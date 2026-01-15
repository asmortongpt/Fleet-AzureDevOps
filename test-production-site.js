const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    ignoreHTTPSErrors: true
  });
  const page = await context.newPage();

  const consoleMessages = [];
  const errors = [];
  const networkErrors = [];

  page.on('console', msg => {
    const text = msg.text();
    consoleMessages.push(`${msg.type()}: ${text}`);
    if (msg.type() === 'error') {
      console.log(`❌ Console Error: ${text}`);
    }
  });

  page.on('pageerror', error => {
    errors.push(error.message);
    console.log(`❌ Page Error: ${error.message}`);
  });

  page.on('requestfailed', request => {
    networkErrors.push(`${request.url()} - ${request.failure().errorText}`);
  });

  try {
    console.log('🌐 Testing https://fleet.capitaltechalliance.com\n');

    await page.goto('https://fleet.capitaltechalliance.com/', {
      waitUntil: 'networkidle',
      timeout: 45000
    });

    console.log('✅ Page loaded');

    // Check page title
    const title = await page.title();
    console.log(`📄 Title: ${title}`);

    // Check if root div is populated
    const rootContent = await page.$eval('#root', el => el.innerHTML).catch(() => '');
    const populated = rootContent.length > 100;

    console.log(`\n📦 Root div: ${populated ? `✅ POPULATED (${rootContent.length} chars)` : '❌ EMPTY'}`);

    if (!populated && rootContent.length > 0 && rootContent.length < 200) {
      console.log(`Root content: "${rootContent}"`);
    }

    // Check script loading
    const scripts = await page.$$eval('script[src]', scripts =>
      scripts.map(s => ({ src: s.src, type: s.type }))
    );
    console.log(`\n📜 Script tags: ${scripts.length}`);
    scripts.slice(0, 3).forEach((s, i) => {
      console.log(`  ${i + 1}. ${s.src.split('/').pop()} (${s.type || 'text/javascript'})`);
    });

    // Check for React
    const hasReact = await page.evaluate(() => {
      return {
        hasReact: typeof window.React !== 'undefined',
        hasReactDOM: typeof window.ReactDOM !== 'undefined',
        hasRoot: !!document.getElementById('root')
      };
    });
    console.log(`\n⚛️  React detection:`, hasReact);

    // Wait a bit more for React to initialize
    await page.waitForTimeout(3000);

    const rootContentAfterWait = await page.$eval('#root', el => el.innerHTML).catch(() => '');
    if (rootContentAfterWait.length > 100) {
      console.log(`\n✅ React initialized after 3s wait (${rootContentAfterWait.length} chars)`);
    }

    // Display errors
    if (errors.length > 0) {
      console.log(`\n❌ JavaScript Errors (${errors.length}):`);
      errors.slice(0, 5).forEach((err, i) => console.log(`  ${i + 1}. ${err}`));
    } else {
      console.log('\n✅ No JavaScript errors detected');
    }

    // Display console messages
    if (consoleMessages.length > 0) {
      console.log(`\n📋 Console Messages (last 15):`);
      consoleMessages.slice(-15).forEach(msg => console.log(`  ${msg}`));
    }

    // Network errors
    if (networkErrors.length > 0) {
      console.log(`\n🌐 Network Errors (${networkErrors.length}):`);
      networkErrors.forEach(err => console.log(`  ${err}`));
    }

    // Screenshot for debugging
    await page.screenshot({ path: '/tmp/fleet-production-screenshot.png', fullPage: false });
    console.log('\n📸 Screenshot saved to /tmp/fleet-production-screenshot.png');

    const exitCode = errors.length > 0 || !populated ? 1 : 0;
    await browser.close();
    process.exit(exitCode);

  } catch (error) {
    console.error(`\n❌ Test failed: ${error.message}`);
    await browser.close();
    process.exit(1);
  }
})();
