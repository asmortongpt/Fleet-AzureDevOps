import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: false });
const page = await browser.newPage();

console.log('Navigating to http://localhost:5173...');
await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });

console.log('Waiting 3 seconds for React to render...');
await page.waitForTimeout(3000);

// Take screenshot
await page.screenshot({ path: '/tmp/fresh-state.png', fullPage: true });

// Get detailed state
const state = await page.evaluate(() => {
  return {
    title: document.title,
    bodyClasses: document.body.className,
    sidebarState: (() => {
      const sidebar = document.querySelector('[data-testid="mobile-nav"]');
      if (!sidebar) return 'SIDEBAR NOT FOUND';
      const rect = sidebar.getBoundingClientRect();
      const style = window.getComputedStyle(sidebar);
      return {
        width: style.width,
        visibility: style.visibility,
        display: style.display,
        inViewport: rect.left < window.innerWidth && rect.width > 0
      };
    })(),
    dashboardVisible: (() => {
      const dash = document.querySelector('[data-testid="dashboard-container"]');
      return !!dash && window.getComputedStyle(dash).display !== 'none';
    })(),
    tableVisible: (() => {
      const table = document.querySelector('table');
      if (!table) return false;
      const rect = table.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0;
    })(),
    vehicleCount: document.querySelectorAll('table tbody tr').length,
    consoleErrors: [] // Can't access console from evaluate
  };
});

console.log('\n=== CURRENT STATE ===');
console.log(JSON.stringify(state, null, 2));

console.log('\n✅ Screenshot saved to /tmp/fresh-state.png');
console.log('Browser window will stay open for 5 seconds...');
await page.waitForTimeout(5000);

await browser.close();
