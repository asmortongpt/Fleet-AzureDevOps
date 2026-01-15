import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  console.log('Navigating to Fleet Hub...');
  await page.goto('http://localhost:5173/fleet', { waitUntil: 'networkidle' });

  console.log('Waiting for page to fully render...');
  await page.waitForTimeout(5000);

  console.log('Taking screenshot of final redesigned UI...');
  await page.screenshot({ path: 'test-results/fleet-final-redesign.png', fullPage: true });

  console.log('Screenshot saved to test-results/fleet-final-redesign.png');
  await browser.close();
})();
