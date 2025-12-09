import { test } from '@playwright/test';

test('INSPECT CURRENT STATE - What is actually rendering', async ({ page }) => {
  console.log('\n====================================================================================================');
  console.log('🔍 INSPECTING ACTUAL CURRENT STATE');
  console.log('====================================================================================================\n');

  // Capture ALL console messages
  const consoleMessages: string[] = [];
  page.on('console', msg => {
    const text = `[${msg.type()}] ${msg.text()}`;
    consoleMessages.push(text);
    console.log(text);
  });

  // Capture page errors
  page.on('pageerror', error => {
    console.log(`❌ PAGE ERROR: ${error.message}`);
    consoleMessages.push(`[pageerror] ${error.message}`);
  });

  console.log('📍 Navigating to http://localhost:5173/');
  await page.goto('http://localhost:5173/', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(5000); // Wait for everything to load

  console.log('\n📸 Taking screenshot of current state...');
  await page.screenshot({ path: 'test-results/ACTUAL-CURRENT-STATE.png', fullPage: true });
  console.log('✅ Screenshot saved: test-results/ACTUAL-CURRENT-STATE.png');

  console.log('\n🔍 Analyzing DOM...');
  const analysis = await page.evaluate(() => {
    const body = document.body;
    const root = document.getElementById('root');

    return {
      bodyText: body.textContent?.substring(0, 500) || '',
      rootExists: !!root,
      rootHTML: root?.innerHTML.substring(0, 1000) || '',
      rootChildren: root?.children.length || 0,
      hasFleetLogo: !!document.querySelector('[class*="fleet"]'),
      hasSidebar: !!document.querySelector('nav, aside, [class*="sidebar"]'),
      hasTable: !!document.querySelector('table'),
      hasMap: !!document.querySelector('[class*="map"], #map'),
      visibleText: Array.from(document.querySelectorAll('h1, h2, h3, p, div'))
        .map(el => el.textContent?.trim())
        .filter(t => t && t.length > 0)
        .slice(0, 20)
    };
  });

  console.log('\n📊 DOM ANALYSIS:');
  console.log('  Root exists:', analysis.rootExists ? '✅' : '❌');
  console.log('  Root children:', analysis.rootChildren);
  console.log('  Has Fleet logo:', analysis.hasFleetLogo ? '✅' : '❌');
  console.log('  Has sidebar:', analysis.hasSidebar ? '✅' : '❌');
  console.log('  Has table:', analysis.hasTable ? '✅' : '❌');
  console.log('  Has map:', analysis.hasMap ? '✅' : '❌');
  console.log('\n  Visible text on page:');
  analysis.visibleText.forEach(text => {
    if (text.length < 100) console.log('    -', text);
  });

  console.log('\n  Root HTML (first 1000 chars):');
  console.log(analysis.rootHTML);

  console.log('\n  Body text (first 500 chars):');
  console.log(analysis.bodyText);

  console.log('\n📋 CONSOLE MESSAGES CAPTURED:');
  console.log('  Total messages:', consoleMessages.length);
  if (consoleMessages.length > 0) {
    consoleMessages.forEach((msg, i) => {
      console.log(`  ${i + 1}. ${msg}`);
    });
  } else {
    console.log('  No console messages captured');
  }

  console.log('\n====================================================================================================');
  console.log('📸 SCREENSHOT SAVED: test-results/ACTUAL-CURRENT-STATE.png');
  console.log('====================================================================================================\n');
});
