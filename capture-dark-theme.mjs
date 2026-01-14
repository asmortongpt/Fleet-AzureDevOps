import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  console.log('🌙 Capturing BOLD NEW DARK THEME design...');
  await page.goto('http://localhost:5173/fleet-hub', { waitUntil: 'networkidle', timeout: 30000 });

  console.log('⏳ Waiting for animations and data to load...');
  await page.waitForTimeout(12000);

  console.log('📸 Taking screenshot of the completely refreshed design...');
  await page.screenshot({
    path: 'test-results/fleet-hub-DARK-THEME-FINAL.png',
    fullPage: true
  });

  console.log('✅ DARK THEME screenshot saved!');
  await browser.close();
})();
