import { chromium } from 'playwright';

(async () => {
  console.log('🧪 Testing Fleet Dashboard After Fix...\n');

  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  const errors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  page.on('pageerror', err => errors.push(`PAGE ERROR: ${err.message}`));

  console.log('Loading http://localhost:5173...');
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle', timeout: 20000 });
  await page.waitForTimeout(5000);

  // Check dark theme
  const htmlClass = await page.evaluate(() => document.documentElement.className);
  console.log('Theme:', htmlClass.includes('dark') ? '✅ DARK' : '❌ LIGHT');

  // Check if React rendered
  const rootContent = await page.evaluate(() => {
    const root = document.getElementById('root');
    return {
      hasContent: root && root.children.length > 0,
      childCount: root?.children.length || 0,
      firstChildTag: root?.children[0]?.tagName
    };
  });
  console.log('Root div:', rootContent.hasContent ? `✅ HAS ${rootContent.childCount} children` : '❌ EMPTY');

  // Check for Fleet Dashboard
  const headerExists = await page.locator('text=/Fleet Dashboard/i').count();
  console.log('Header:', headerExists > 0 ? '✅ FOUND' : '❌ NOT FOUND');

  // Check for table
  const tableExists = await page.locator('table').count();
  console.log('Table:', tableExists > 0 ? `✅ FOUND (${await page.locator('table tbody tr').count()} rows)` : '❌ NOT FOUND');

  // Screenshot
  await page.screenshot({ path: '/tmp/fleet-FINAL-test.png', fullPage: true });
  console.log('\n📸 Screenshot: /tmp/fleet-FINAL-test.png');

  if (errors.length > 0) {
    console.log('\n⚠️  Console Errors:');
    errors.forEach(e => console.log('  ', e));
  } else {
    console.log('\n✅ NO CONSOLE ERRORS!');
  }

  console.log('\n🎉 Test complete! Browser will close in 10 seconds...');
  await page.waitForTimeout(10000);
  await browser.close();
})();
