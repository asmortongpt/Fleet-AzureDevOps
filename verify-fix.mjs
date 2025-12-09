import { chromium } from 'playwright';

const browser = await chromium.launch();
const page = await browser.newPage();

await page.goto('http://localhost:5173');
await page.waitForTimeout(2000);

// Take new screenshot
await page.screenshot({ path: '/tmp/sidebar-fixed.png', fullPage: true });

// Check sidebar state
const sidebarState = await page.evaluate(() => {
  const sidebar = document.querySelector('[data-testid="mobile-nav"]');
  if (!sidebar) return 'NOT FOUND';
  const styles = window.getComputedStyle(sidebar);
  return {
    width: styles.width,
    visibility: styles.visibility,
    inlineStyle: sidebar.getAttribute('style')
  };
});

console.log('=== SIDEBAR AFTER FIX ===');
console.log(JSON.stringify(sidebarState, null, 2));

//Check if navigation buttons are still visible
const buttonsVisible = await page.evaluate(() => {
  const buttons = Array.from(document.querySelectorAll('[data-testid="mobile-nav"] button'));
  return buttons.filter(btn => {
    const rect = btn.getBoundingClientRect();
    return rect.width > 0;
  }).length;
});

console.log(`\nVisible navigation buttons: ${buttonsVisible}`);

await browser.close();
