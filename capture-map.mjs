import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  console.log('Navigating to http://localhost:5173...');
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });

  console.log('Waiting for page to fully load...');
  await page.waitForTimeout(20000); // Wait 20 seconds for lazy loading and Google Maps API

  console.log('Taking screenshot...');
  await page.screenshot({ path: 'test-results/map-final.png', fullPage: true });

  console.log('Screenshot saved to test-results/map-final.png');
  await browser.close();
})();
