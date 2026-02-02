import { chromium } from 'playwright';

async function testBothSites() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });

  console.log('\n=== Testing Production (fleet.capitaltechalliance.com) ===\n');

  const prodPage = await context.newPage();

  try {
    console.log('Navigating to production...');
    const response = await prodPage.goto('https://fleet.capitaltechalliance.com', {
      waitUntil: 'networkidle',
      timeout: 30000
    });

    console.log(`Response status: ${response.status()}`);
    console.log(`Response headers:`, response.headers());

    await prodPage.screenshot({ path: 'prod-screenshot.png', fullPage: true });
    console.log('Screenshot saved: prod-screenshot.png');

    const title = await prodPage.title();
    console.log(`Page title: "${title}"`);

    const html = await prodPage.content();
    console.log(`HTML length: ${html.length} characters`);

    // Check for root element
    const rootElement = await prodPage.$('#root');
    console.log(`Root element found: ${rootElement !== null}`);

    if (rootElement) {
      const innerHTML = await rootElement.innerHTML();
      console.log(`Root innerHTML length: ${innerHTML.length}`);
      console.log(`Root innerHTML preview: ${innerHTML.substring(0, 200)}...`);
    }

    // Wait a bit for React to render
    await prodPage.waitForTimeout(3000);

    // Take another screenshot after waiting
    await prodPage.screenshot({ path: 'prod-screenshot-after-wait.png', fullPage: true });
    console.log('Screenshot after wait saved: prod-screenshot-after-wait.png');

    // Check console errors
    const consoleMessages = [];
    prodPage.on('console', msg => consoleMessages.push(msg.text()));

    // Check for any error messages
    const errors = await prodPage.evaluate(() => {
      return {
        jsErrors: window.__errors || [],
        consoleErrors: []
      };
    });

    console.log(`Console messages: ${consoleMessages.length}`);
    if (consoleMessages.length > 0) {
      console.log('Console output:');
      consoleMessages.forEach((msg, i) => console.log(`  ${i + 1}. ${msg}`));
    }

  } catch (error) {
    console.error('Error testing production:', error.message);
    await prodPage.screenshot({ path: 'prod-error-screenshot.png' });
  }

  console.log('\n=== Testing Static Web App (green-pond...) ===\n');

  const staticPage = await context.newPage();

  try {
    console.log('Navigating to static web app...');
    const response = await staticPage.goto('https://green-pond-0f040980f.3.azurestaticapps.net', {
      waitUntil: 'networkidle',
      timeout: 30000
    });

    console.log(`Response status: ${response.status()}`);

    await staticPage.screenshot({ path: 'static-screenshot.png', fullPage: true });
    console.log('Screenshot saved: static-screenshot.png');

    const title = await staticPage.title();
    console.log(`Page title: "${title}"`);

    const html = await staticPage.content();
    console.log(`HTML length: ${html.length} characters`);

    const rootElement = await staticPage.$('#root');
    console.log(`Root element found: ${rootElement !== null}`);

    if (rootElement) {
      const innerHTML = await rootElement.innerHTML();
      console.log(`Root innerHTML length: ${innerHTML.length}`);
      console.log(`Root innerHTML preview: ${innerHTML.substring(0, 200)}...`);
    }

    await staticPage.waitForTimeout(3000);
    await staticPage.screenshot({ path: 'static-screenshot-after-wait.png', fullPage: true });
    console.log('Screenshot after wait saved: static-screenshot-after-wait.png');

  } catch (error) {
    console.error('Error testing static:', error.message);
    await staticPage.screenshot({ path: 'static-error-screenshot.png' });
  }

  await browser.close();

  console.log('\n=== Testing Complete ===');
  console.log('Check the screenshot files to see what actually rendered.');
}

testBothSites().catch(console.error);
