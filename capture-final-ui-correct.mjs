import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  console.log('Navigating to Fleet Hub on correct port (8080)...');
  await page.goto('http://localhost:8080/fleet', { waitUntil: 'networkidle', timeout: 30000 });

  console.log('Waiting for page to fully render...');
  await page.waitForTimeout(8000);

  console.log('Taking screenshot of redesigned UI with data...');
  await page.screenshot({ path: 'test-results/fleet-redesign-with-data.png', fullPage: true });

  console.log('Screenshot saved to test-results/fleet-redesign-with-data.png');
  await browser.close();
})();
