import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: false });
const page = await browser.newPage();

console.log('Loading http://localhost:5173...');
await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });
await page.waitForTimeout(3000);

// Take screenshot
await page.screenshot({ path: '/tmp/browser-actual-state.png', fullPage: true });
console.log('✅ Screenshot saved to /tmp/browser-actual-state.png');

// Get detailed state
const state = await page.evaluate(() => {
  return {
    title: document.title,
    htmlClass: document.documentElement.className,
    bodyBackground: window.getComputedStyle(document.body).backgroundColor,
    bodyColor: window.getComputedStyle(document.body).color,
    hasTable: !!document.querySelector('table'),
    tableRows: document.querySelectorAll('table tbody tr').length,
    hasDashboard: !!document.querySelector('[data-testid="dashboard-container"]'),
    visibleText: document.body.innerText.substring(0, 500)
  };
});

console.log('\n=== BROWSER STATE ===');
console.log(JSON.stringify(state, null, 2));

console.log('\nKeeping browser open for 10 seconds so you can see it...');
await page.waitForTimeout(10000);

await browser.close();
