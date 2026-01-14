import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  console.log('Navigating to Fleet Hub (correct route: /fleet-hub)...');
  await page.goto('http://localhost:8080/fleet-hub', { waitUntil: 'networkidle', timeout: 30000 });

  console.log('Waiting for page to fully render and load data...');
  await page.waitForTimeout(10000);

  console.log('Taking screenshot of the modern redesigned Fleet Hub...');
  await page.screenshot({ path: 'test-results/fleet-hub-modern-redesign.png', fullPage: true });

  console.log('✓ Screenshot saved to test-results/fleet-hub-modern-redesign.png');
  await browser.close();
})();
