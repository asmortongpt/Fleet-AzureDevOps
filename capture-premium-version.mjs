import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  console.log('📸 Capturing current premium design...');
  await page.goto('http://localhost:5173/fleet-hub', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(8000);

  await page.screenshot({ path: 'test-results/fleet-hub-premium.png', fullPage: true });
  console.log('✅ Current design captured');

  await browser.close();
})();
