const { chromium } = require('playwright');
const fs = require('fs');

async function visualInspection() {
  console.log('📸 Visual Inspection of Fleet CTA Application\n');
  console.log('=' .repeat(70));

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
  const page = await context.newPage();

  try {
    // Navigate to main app
    console.log('\n🌐 Navigating to http://localhost:5173...');
    await page.goto('http://localhost:5173', { waitUntil: 'domcontentloaded', timeout: 10000 });

    // Wait a moment for rendering
    await page.waitForTimeout(2000);

    // Capture screenshot
    const screenshotPath = '/tmp/fleet-cta-main-page.png';
    await page.screenshot({ path: screenshotPath, fullPage: true });
    console.log(`✅ Screenshot saved: ${screenshotPath}`);

    // Check what's visible
    console.log('\n📋 Visual Elements Found:');
    console.log('-'.repeat(70));

    // Check for text content
    const bodyText = await page.textContent('body');
    const hasText = bodyText && bodyText.trim().length > 0;
    console.log(`  • Body text present: ${hasText ? '✅ Yes' : '❌ No'}`);

    // Check for specific elements
    const checks = [
      { selector: 'h1', name: 'Heading (h1)' },
      { selector: 'button', name: 'Buttons' },
      { selector: 'input', name: 'Input fields' },
      { selector: 'nav', name: 'Navigation' },
      { selector: 'header', name: 'Header' },
      { selector: '[class*="sidebar"]', name: 'Sidebar' },
      { selector: 'canvas', name: 'Canvas (maps/charts)' },
      { selector: 'img', name: 'Images' },
    ];

    for (const check of checks) {
      const count = await page.locator(check.selector).count();
      console.log(`  • ${check.name}: ${count > 0 ? `✅ ${count} found` : '❌ None'}`);
    }

    // Check current URL
    const currentUrl = page.url();
    console.log(`\n🔗 Current URL: ${currentUrl}`);

    // Check page title
    const title = await page.title();
    console.log(`📄 Page Title: ${title}`);

    // Check console errors
    const errors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    await page.waitForTimeout(2000);

    if (errors.length > 0) {
      console.log(`\n⚠️  Console Errors (${errors.length}):`);
      errors.slice(0, 5).forEach((err, i) => {
        console.log(`  ${i + 1}. ${err.substring(0, 100)}`);
      });
    } else {
      console.log('\n✅ No console errors detected');
    }

    // Now check map diagnostic page
    console.log('\n' + '='.repeat(70));
    console.log('\n🗺️  Checking Map Diagnostic Page...');

    try {
      await page.goto('http://localhost:5173/#/map-diagnostic', { waitUntil: 'domcontentloaded', timeout: 10000 });
      await page.waitForTimeout(3000);

      const mapScreenshot = '/tmp/fleet-cta-map-diagnostic.png';
      await page.screenshot({ path: mapScreenshot, fullPage: true });
      console.log(`✅ Map diagnostic screenshot: ${mapScreenshot}`);

      const canvasCount = await page.locator('canvas').count();
      console.log(`  • Canvas elements: ${canvasCount > 0 ? `✅ ${canvasCount} found` : '❌ None'}`);

      const mapText = await page.textContent('body');
      const hasApiKey = mapText && mapText.includes('API Key Present');
      console.log(`  • API key check visible: ${hasApiKey ? '✅ Yes' : '❌ No'}`);

    } catch (err) {
      console.log(`❌ Map diagnostic page error: ${err.message}`);
    }

    console.log('\n' + '='.repeat(70));
    console.log('\n✅ Visual inspection complete');
    console.log('\nKeeping browser open for 30 seconds for manual inspection...');
    await page.waitForTimeout(30000);

  } catch (error) {
    console.error(`\n❌ Error during inspection: ${error.message}`);
  } finally {
    await browser.close();
  }
}

visualInspection().catch(console.error);
