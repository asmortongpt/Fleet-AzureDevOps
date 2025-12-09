import { test } from '@playwright/test';

test('HONEST DIAGNOSTIC - What is actually visible', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });

  await page.goto('http://localhost:5173/');
  await page.waitForTimeout(5000);

  const diagnostic = await page.evaluate(() => {
    const sidebar = document.querySelector('aside');
    const mainWrapper = document.querySelector('aside + div, aside ~ div');
    const header = document.querySelector('header');
    const mainContent = document.querySelector('main');
    const root = document.getElementById('root');

    const getBox = (el: Element | null) => {
      if (!el) return null;
      const rect = el.getBoundingClientRect();
      const styles = window.getComputedStyle(el);
      return {
        rect: { x: rect.x, y: rect.y, width: rect.width, height: rect.height },
        position: styles.position,
        zIndex: styles.zIndex,
        display: styles.display,
        visibility: styles.visibility,
        overflow: styles.overflow,
        marginLeft: styles.marginLeft,
        className: el.className,
      };
    };

    return {
      viewport: { width: window.innerWidth, height: window.innerHeight },
      root: getBox(root),
      sidebar: getBox(sidebar),
      mainWrapper: getBox(mainWrapper),
      header: getBox(header),
      mainContent: getBox(mainContent),
      sidebarOpen: sidebar?.classList.contains('w-64') || sidebar?.className.includes('w-64'),
    };
  });

  console.log('\n' + '='.repeat(80));
  console.log('HONEST DIAGNOSTIC - ACTUAL ELEMENT POSITIONS');
  console.log('='.repeat(80));
  console.log('\nVIEWPORT:', diagnostic.viewport);
  console.log('\nROOT:', JSON.stringify(diagnostic.root, null, 2));
  console.log('\nSIDEBAR:', JSON.stringify(diagnostic.sidebar, null, 2));
  console.log('\nSIDEBAR OPEN?:', diagnostic.sidebarOpen);
  console.log('\nMAIN WRAPPER (div after sidebar):', JSON.stringify(diagnostic.mainWrapper, null, 2));
  console.log('\nHEADER:', JSON.stringify(diagnostic.header, null, 2));
  console.log('\nMAIN CONTENT:', JSON.stringify(diagnostic.mainContent, null, 2));
  console.log('\n' + '='.repeat(80));

  // Take screenshot
  await page.screenshot({
    path: '/tmp/honest-diagnostic.png',
    fullPage: false
  });
  console.log('\n📸 Screenshot saved: /tmp/honest-diagnostic.png');
});
