import { test, expect } from '@playwright/test';

test.describe('White Screen Fix Verification', () => {
  test('should load application without white screen', async ({ page }) => {
    const consoleErrors: string[] = [];
    const pageErrors: string[] = [];

    // Capture console errors
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    // Capture page errors
    page.on('pageerror', (error) => {
      pageErrors.push(error.message);
    });

    // Navigate to the application
    await page.goto('http://localhost:4173/', { waitUntil: 'networkidle' });

    // Wait for React to mount
    await page.waitForTimeout(2000);

    // Check if root element has content
    const rootElement = page.locator('#root');
    await expect(rootElement).toBeVisible();

    const rootContent = await rootElement.innerHTML();
    console.log('Root element has content:', rootContent.length > 0);

    // Count child elements
    const childCount = await rootElement.locator('> *').count();
    console.log('Root children count:', childCount);

    // Verify no white screen
    expect(childCount).toBeGreaterThan(0);

    // Check for critical errors
    const criticalErrors = consoleErrors.filter(
      (error) =>
        error.includes('Cannot set properties of undefined') ||
        error.includes('Activity') ||
        error.includes('Failed to fetch') ||
        error.includes('404')
    );

    console.log('Console errors:', consoleErrors.length);
    console.log('Critical errors:', criticalErrors.length);
    console.log('Page errors:', pageErrors.length);

    if (criticalErrors.length > 0) {
      console.log('Critical errors found:', criticalErrors);
    }

    // Verify no critical errors that would cause white screen
    expect(criticalErrors.length).toBe(0);

    // Take a screenshot for verification
    await page.screenshot({ path: 'test-results/fix-verification.png', fullPage: true });

    // Check if navigation elements are present
    const nav = page.locator('nav');
    await expect(nav).toBeVisible();

    console.log('✅ Application loaded successfully without white screen!');
  });

  test('should load icons without errors', async ({ page }) => {
    const consoleErrors: string[] = [];

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    await page.goto('http://localhost:4173/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    // Check for icon-related errors
    const iconErrors = consoleErrors.filter(
      (error) =>
        error.includes('phosphor-icons') ||
        error.includes('lucide-react') ||
        error.includes('Activity') ||
        error.includes('Cannot set properties')
    );

    console.log('Icon-related errors:', iconErrors.length);
    if (iconErrors.length > 0) {
      console.log('Icon errors:', iconErrors);
    }

    expect(iconErrors.length).toBe(0);
    console.log('✅ All icons loaded successfully!');
  });

  test('should have React properly initialized', async ({ page }) => {
    await page.goto('http://localhost:4173/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    // Check if React is loaded
    const reactLoaded = await page.evaluate(() => {
      return typeof (window as any).React !== 'undefined' ||
             document.querySelector('#root')?.children.length > 0;
    });

    console.log('React loaded:', reactLoaded);
    expect(reactLoaded).toBe(true);
    console.log('✅ React initialized successfully!');
  });
});
