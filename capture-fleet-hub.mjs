import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  console.log('Navigating to http://localhost:5173/fleet-hub...');
  await page.goto('http://localhost:5173/fleet-hub', { waitUntil: 'networkidle' });

  console.log('Waiting 25 seconds for Google Maps API to load...');
  await page.waitForTimeout(25000);

  console.log('Taking screenshot...');
  await page.screenshot({ path: 'test-results/fleet-hub-with-map.png', fullPage: true });

  console.log('Screenshot saved!');
  await browser.close();
})();
