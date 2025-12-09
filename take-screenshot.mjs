import { chromium } from 'playwright';

const browser = await chromium.launch();
const page = await browser.newPage();

await page.goto('http://localhost:5173');
await page.waitForTimeout(3000);

await page.screenshot({ path: '/tmp/current-broken-state.png', fullPage: true });

console.log('Screenshot saved to /tmp/current-broken-state.png');

await browser.close();
