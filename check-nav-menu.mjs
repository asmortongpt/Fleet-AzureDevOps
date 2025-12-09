import { chromium } from 'playwright';

const browser = await chromium.launch();
const page = await browser.newPage();

await page.goto('http://localhost:5173');
await page.waitForTimeout(2000);

// Check if the navigation menu buttons are visible
const navButtons = await page.evaluate(() => {
  const buttons = Array.from(document.querySelectorAll('[data-testid="mobile-nav"] button'));
  return {
    count: buttons.length,
    visible: buttons.filter(btn => {
      const rect = btn.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0;
    }).length,
    labels: buttons.slice(0, 10).map(btn => btn.textContent.trim())
  };
});

console.log('=== NAVIGATION BUTTONS ===');
console.log(JSON.stringify(navButtons, null, 2));

// Check sidebar visibility in viewport
const sidebarVisibility = await page.evaluate(() => {
  const sidebar = document.querySelector('[data-testid="mobile-nav"]');
  if (!sidebar) return 'NOT FOUND';
  
  const rect = sidebar.getBoundingClientRect();
  const styles = window.getComputedStyle(sidebar);
  
  return {
    boundingBox: {
      left: rect.left,
      width: rect.width,
      inViewport: rect.left < window.innerWidth
    },
    computedStyles: {
      width: styles.width,
      left: styles.left,
      position: styles.position
    }
  };
});

console.log('\n=== SIDEBAR VISIBILITY ===');
console.log(JSON.stringify(sidebarVisibility, null, 2));

await browser.close();
