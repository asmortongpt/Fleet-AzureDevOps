import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: false });
const page = await browser.newPage();

console.log('1. Loading page...');
await page.goto('http://localhost:5173');
await page.waitForTimeout(1000);

console.log('\n2. Current localStorage theme:', await page.evaluate(() => localStorage.getItem('ctafleet-theme')));

console.log('\n3. Setting theme to dark...');
await page.evaluate(() => {
  localStorage.setItem('ctafleet-theme', 'dark');
});

console.log('\n4. Reloading page...');
await page.reload({ waitUntil: 'networkidle' });
await page.waitForTimeout(2000);

const result = await page.evaluate(() => ({
  theme: localStorage.getItem('ctafleet-theme'),
  htmlClass: document.documentElement.className,
  bodyBg: window.getComputedStyle(document.body).backgroundColor,
  bodyColor: window.getComputedStyle(document.body).color
}));

console.log('\n5. After fix:');
console.log(JSON.stringify(result, null, 2));

await page.screenshot({ path: '/tmp/fleet-dark-theme-fixed.png', fullPage: true });
console.log('\n✅ Screenshot saved to /tmp/fleet-dark-theme-fixed.png');

console.log('\nKeeping browser open for 10 seconds...');
await page.waitForTimeout(10000);

await browser.close();
