import { chromium } from 'playwright';

const browser = await chromium.launch();
const page = await browser.newPage();

await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });
await page.waitForTimeout(2000);

const status = await page.evaluate(() => ({
  htmlClass: document.documentElement.className,
  bodyBg: window.getComputedStyle(document.body).backgroundColor,
  bodyColor: window.getComputedStyle(document.body).color,
  title: document.title,
  hasContent: document.body.textContent.length > 0
}));

console.log(JSON.stringify(status, null, 2));

await page.screenshot({ path: '/tmp/playwright-now.png', fullPage: true });
console.log('\nScreenshot: /tmp/playwright-now.png');

await browser.close();
