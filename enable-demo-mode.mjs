import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  await page.goto('http://localhost:5173');
  
  // Enable demo mode
  await page.evaluate(() => {
    localStorage.setItem('demo_mode', 'true');
    localStorage.setItem('theme', 'dark');
  });
  
  console.log('✅ Demo mode enabled');
  console.log('✅ Dark theme set in localStorage');
  
  await browser.close();
})();
