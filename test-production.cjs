const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Capture console messages
  page.on('console', msg => {
    console.log(`BROWSER ${msg.type()}: ${msg.text()}`);
  });

  // Capture errors
  page.on('pageerror', error => {
    console.error(`PAGE ERROR: ${error.message}`);
    console.error(error.stack);
  });

  console.log('Navigating to https://fleet.capitaltechalliance.com');
  await page.goto('https://fleet.capitaltechalliance.com', { waitUntil: 'networkidle' });

  // Wait a bit for React to mount
  await page.waitForTimeout(5000);

  // Check if root has content
  const rootContent = await page.evaluate(() => {
    const root = document.querySelector('#root');
    return {
      exists: !!root,
      hasChildren: root?.children.length > 0,
      innerHTML: root?.innerHTML?.substring(0, 200)
    };
  });

  console.log('ROOT STATUS:', JSON.stringify(rootContent, null, 2));

  // Take screenshot
  await page.screenshot({ path: '/tmp/fleet-error.png', fullPage: true });
  console.log('Screenshot saved to /tmp/fleet-error.png');

  await page.waitForTimeout(60000); // Keep open for manual inspection

  await browser.close();
})();
