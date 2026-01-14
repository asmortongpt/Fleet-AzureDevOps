import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  console.log('Navigating to Fleet Hub with new design...');
  await page.goto('http://localhost:5173/fleet-hub', { waitUntil: 'networkidle' });

  console.log('Waiting for page to fully render...');
  await page.waitForTimeout(10000);

  console.log('Taking screenshot of new UI...');
  await page.screenshot({ path: 'test-results/ui-redesign-complete.png', fullPage: true });

  console.log('Screenshot saved!');
  await browser.close();
})();
