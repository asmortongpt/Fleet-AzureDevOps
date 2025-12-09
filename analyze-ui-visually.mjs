import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: false });
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });

await page.goto('http://localhost:5173');
await page.waitForTimeout(3000);

// Take full page screenshot
await page.screenshot({ path: '/tmp/fleet-full-layout.png', fullPage: true });

// Get detailed DOM structure
const structure = await page.evaluate(() => {
  const getElementInfo = (el) => {
    if (!el) return null;
    const rect = el.getBoundingClientRect();
    const styles = window.getComputedStyle(el);
    return {
      tag: el.tagName,
      classes: el.className,
      text: el.innerText?.substring(0, 50),
      position: { x: rect.x, y: rect.y, width: rect.width, height: rect.height },
      display: styles.display,
      visibility: styles.visibility,
      zIndex: styles.zIndex
    };
  };

  return {
    html: getElementInfo(document.documentElement),
    body: getElementInfo(document.body),
    sidebar: getElementInfo(document.querySelector('[data-testid="mobile-nav"]')),
    dashboard: getElementInfo(document.querySelector('[data-testid="dashboard-container"]')),
    mainContent: getElementInfo(document.querySelector('main'))
  };
});

console.log('\n=== DOM STRUCTURE ANALYSIS ===');
console.log(JSON.stringify(structure, null, 2));

// Wait so user can see
console.log('\n✅ Screenshot saved to /tmp/fleet-full-layout.png');
console.log('Keeping browser open for 5 seconds...');
await page.waitForTimeout(5000);

await browser.close();
