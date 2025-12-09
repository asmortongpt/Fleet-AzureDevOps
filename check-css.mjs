import { chromium } from 'playwright';

const browser = await chromium.launch();
const page = await browser.newPage();

await page.goto('http://localhost:5173');
await page.waitForTimeout(2000);

// Check if CSS is loaded
const cssInfo = await page.evaluate(() => {
  const stylesheets = Array.from(document.styleSheets);
  const bodyStyles = window.getComputedStyle(document.body);
  const rootStyles = window.getComputedStyle(document.documentElement);
  
  return {
    stylesheetCount: stylesheets.length,
    stylesheetUrls: stylesheets.map(s => s.href).filter(Boolean),
    bodyBackground: bodyStyles.backgroundColor,
    bodyColor: bodyStyles.color,
    htmlClasses: document.documentElement.className,
    bodyClasses: document.body.className,
    darkModeDetected: document.documentElement.classList.contains('dark') || 
                     document.body.classList.contains('dark'),
    cssVariables: {
      background: rootStyles.getPropertyValue('--background'),
      foreground: rootStyles.getPropertyValue('--foreground'),
      card: rootStyles.getPropertyValue('--card')
    }
  };
});

console.log(JSON.stringify(cssInfo, null, 2));
