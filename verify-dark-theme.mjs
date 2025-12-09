import { chromium } from 'playwright';

const browser = await chromium.launch();
const page = await browser.newPage();

await page.goto('http://localhost:5173');
await page.waitForTimeout(3000);

const themeInfo = await page.evaluate(() => {
  const rootStyles = window.getComputedStyle(document.documentElement);
  const bodyStyles = window.getComputedStyle(document.body);
  
  return {
    htmlClass: document.documentElement.className,
    isDark: document.documentElement.classList.contains('dark'),
    bodyBackground: bodyStyles.backgroundColor,
    bodyColor: bodyStyles.color,
    backgroundVar: rootStyles.getPropertyValue('--background'),
    foregroundVar: rootStyles.getPropertyValue('--foreground')
  };
});

console.log('=== THEME STATUS ===');
console.log(JSON.stringify(themeInfo, null, 2));

if (themeInfo.isDark) {
  console.log('\n✅ DARK THEME ACTIVE!');
} else {
  console.log('\n❌ Still in light mode');
}

await page.screenshot({ path: '/tmp/dark-theme-fixed.png', fullPage: true });
console.log('\nScreenshot saved to /tmp/dark-theme-fixed.png');

await browser.close();
