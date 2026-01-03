/**
 * Production React Diagnostic Test (No Gemini)
 * Tests https://fleet.capitaltechalliance.com for React initialization
 */

const { chromium } = require('playwright');

const PROD_URL = 'https://fleet.capitaltechalliance.com';

async function diagnoseProdSite() {
  console.log('🔍 Testing Production Site...\n');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
  });

  const page = await context.newPage();

  const consoleMessages = [];
  page.on('console', msg => {
    consoleMessages.push({
      type: msg.type(),
      text: msg.text(),
    });
  });

  const jsErrors = [];
  page.on('pageerror', error => {
    jsErrors.push({
      message: error.message,
      stack: error.stack,
      name: error.name
    });
  });

  try {
    console.log(`📡 Loading ${PROD_URL}...`);
    await page.goto(PROD_URL, {
      waitUntil: 'networkidle',
      timeout: 30000
    });

    await page.waitForTimeout(5000);

    const reactRootInfo = await page.evaluate(() => {
      const root = document.getElementById('root');
      return {
        exists: !!root,
        innerHTML: root ? root.innerHTML.substring(0, 500) : null,
        childElementCount: root ? root.childElementCount : 0,
      };
    });

    console.log('\n📊 RESULTS:\n');
    console.log('React Root Status:');
    console.log(`  - Exists: ${reactRootInfo.exists}`);
    console.log(`  - Child Elements: ${reactRootInfo.childElementCount}`);
    console.log(`  - Has Content: ${reactRootInfo.innerHTML ? 'YES' : 'NO'}\n`);

    if (jsErrors.length > 0) {
      console.log('❌ JAVASCRIPT ERRORS:\n');
      jsErrors.forEach((err, i) => {
        console.log(`  ${i + 1}. ${err.name}: ${err.message}`);
      });
      console.log('');
    }

    const errorMessages = consoleMessages.filter(m => m.type === 'error' && !m.text.includes('X-Frame-Options') && !m.text.includes('Content Security Policy'));
    if (errorMessages.length > 0) {
      console.log('⚠️  CONSOLE ERRORS:\n');
      errorMessages.forEach((msg, i) => {
        console.log(`  ${i + 1}. ${msg.text}`);
      });
      console.log('');
    }

    if (jsErrors.length === 0 && reactRootInfo.childElementCount > 0) {
      console.log('✅ SUCCESS: React is rendering correctly!');
      console.log(`   Loaded ${reactRootInfo.childElementCount} top-level elements\n`);
      process.exit(0);
    } else if (jsErrors.length === 0) {
      console.log('⚠️  No JavaScript errors, but React did not render');
      console.log('   This may indicate an initialization issue\n');
      process.exit(1);
    } else {
      console.log('❌ FAILED: JavaScript errors preventing React from rendering\n');
      process.exit(1);
    }

  } catch (error) {
    console.error('❌ Diagnostic failed:', error.message);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

diagnoseProdSite();
