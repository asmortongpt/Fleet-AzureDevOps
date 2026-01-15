import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  console.log('✓ Navigating to Fleet Hub on CORRECT port 5173...');
  await page.goto('http://localhost:5173/fleet-hub', { waitUntil: 'networkidle', timeout: 30000 });

  console.log('✓ Waiting for data to load (10 seconds)...');
  await page.waitForTimeout(10000);

  console.log('✓ Capturing screenshot of the modern Fleet Hub redesign...');
  await page.screenshot({ path: 'test-results/fleet-hub-redesign-FINAL.png', fullPage: true });

  console.log('✅ SUCCESS! Screenshot saved to: test-results/fleet-hub-redesign-FINAL.png');
  await browser.close();
})();
