import { test } from '@playwright/test';

test('diagnose white screen issue', async ({ page }) => {
  // Capture console errors
  const consoleErrors: string[] = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });

  // Capture page errors
  const pageErrors: Error[] = [];
  page.on('pageerror', error => {
    pageErrors.push(error);
  });

  // Navigate to the app
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });

  // Wait a bit for React to render
  await page.waitForTimeout(3000);

  // Take screenshot
  await page.screenshot({ path: '/tmp/white-screen-debug.png', fullPage: true });

  // Get page content
  const bodyText = await page.locator('body').textContent();
  const html = await page.content();

  // Check for React root
  const rootElement = await page.locator('#root').count();

  console.log('=== WHITE SCREEN DIAGNOSIS ===');
  console.log('Root element found:', rootElement > 0);
  console.log('Body text length:', bodyText?.length || 0);
  console.log('Body text preview:', bodyText?.substring(0, 200) || 'EMPTY');
  console.log('\n=== CONSOLE ERRORS ===');
  consoleErrors.forEach(err => console.log('ERROR:', err));
  console.log('\n=== PAGE ERRORS ===');
  pageErrors.forEach(err => console.log('PAGE ERROR:', err.message));

  // Check if any visible text
  const visibleText = await page.locator('body').isVisible();
  console.log('\nBody visible:', visibleText);

  // List all visible elements
  const visibleElements = await page.locator('body *').evaluateAll(elements => {
    return elements.filter(el => {
      const style = window.getComputedStyle(el);
      return style.display !== 'none' && style.visibility !== 'hidden';
    }).map(el => ({
      tag: el.tagName,
      text: el.textContent?.substring(0, 50)
    })).slice(0, 20);
  });

  console.log('\n=== VISIBLE ELEMENTS ===');
  console.log(JSON.stringify(visibleElements, null, 2));
});
