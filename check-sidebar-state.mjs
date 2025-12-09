import { chromium } from 'playwright';

const browser = await chromium.launch();
const page = await browser.newPage();

await page.goto('http://localhost:5173');
await page.waitForTimeout(2000);

const state = await page.evaluate(() => {
  return {
    localStorage: { ...localStorage },
    sidebarVisible: !!document.querySelector('[data-testid="mobile-nav"]')?.offsetWidth,
    sidebarWidth: document.querySelector('[data-testid="mobile-nav"]')?.offsetWidth,
    sidebarClasses: document.querySelector('[data-testid="mobile-nav"]')?.className
  };
});

console.log(JSON.stringify(state, null, 2));
await browser.close();
