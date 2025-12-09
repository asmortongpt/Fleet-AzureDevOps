import { chromium } from 'playwright';

const browser = await chromium.launch();
const page = await browser.newPage();

await page.goto('http://localhost:5173');
await page.waitForTimeout(2000);

// Get all applied styles for the sidebar
const sidebarStyles = await page.evaluate(() => {
  const sidebar = document.querySelector('[data-testid="mobile-nav"]');
  if (!sidebar) return 'NOT FOUND';
  
  // Get all computed styles
  const computed = window.getComputedStyle(sidebar);
  
  // Get className
  const classes = sidebar.className;
  
  // Check for inline styles
  const inlineStyle = sidebar.getAttribute('style');
  
  // Get all CSS rules that might apply
  const matchingRules = [];
  for (let sheet of document.styleSheets) {
    try {
      for (let rule of sheet.cssRules) {
        if (rule.selectorText && rule.selectorText.includes('aside')) {
          matchingRules.push({
            selector: rule.selectorText,
            cssText: rule.style.cssText
          });
        }
      }
    } catch (e) {
      // Cross-origin stylesheet, skip
    }
  }
  
  return {
    className: classes,
    inlineStyle: inlineStyle,
    computedWidth: computed.width,
    computedMaxWidth: computed.maxWidth,
    computedMinWidth: computed.minWidth,
    matchingCSSRules: matchingRules
  };
});

console.log(JSON.stringify(sidebarStyles, null, 2));

await browser.close();
