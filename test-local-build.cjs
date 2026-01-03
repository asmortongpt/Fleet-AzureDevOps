/**
 * Local Build Test - Verify chart-vendor bundle doesn't have TDZ errors
 */

const { chromium } = require('playwright');
const path = require('path');

async function testLocalBuild() {
  console.log('🧪 Testing local build for TDZ errors...\n');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  const jsErrors = [];
  page.on('pageerror', error => {
    jsErrors.push({
      message: error.message,
      stack: error.stack,
      name: error.name
    });
  });

  const consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });

  try {
    // Serve the dist folder
    const distPath = path.join(__dirname, 'dist', 'index.html');
    const fileUrl = `file://${distPath}`;

    console.log(`📂 Loading: ${fileUrl}\n`);
    await page.goto(fileUrl, { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);

    // Check React initialization
    const reactStatus = await page.evaluate(() => {
      const root = document.getElementById('root');
      return {
        rootExists: !!root,
        hasChildren: root ? root.childElementCount > 0 : false,
        innerHTML: root ? root.innerHTML.substring(0, 200) : null
      };
    });

    console.log('React Status:');
    console.log(`  - Root exists: ${reactStatus.rootExists}`);
    console.log(`  - Has children: ${reactStatus.hasChildren}`);
    console.log(`  - First 200 chars: ${reactStatus.innerHTML || 'EMPTY'}\n`);

    if (jsErrors.length > 0) {
      console.log('❌ JAVASCRIPT ERRORS FOUND:\n');
      jsErrors.forEach((err, i) => {
        console.log(`  ${i + 1}. ${err.name}: ${err.message}`);
      });
      process.exit(1);
    }

    if (consoleErrors.length > 0) {
      console.log('⚠️  CONSOLE ERRORS:\n');
      consoleErrors.forEach((err, i) => {
        console.log(`  ${i + 1}. ${err}`);
      });
    }

    if (reactStatus.hasChildren) {
      console.log('✅ SUCCESS: React initialized and rendered content!');
      process.exit(0);
    } else {
      console.log('⚠️  WARNING: No TDZ errors, but React did not render');
      console.log('   This might be expected for file:// protocol (needs API server)');
      process.exit(0);
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

testLocalBuild();
