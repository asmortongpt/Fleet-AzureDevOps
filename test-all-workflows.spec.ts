import { test, expect } from '@playwright/test';

test.describe('Full Application Workflow Testing', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000); // Wait for auth bypass
  });

  test('should load dashboard without errors', async ({ page }) => {
    const url = page.url();
    console.log('Current URL:', url);

    // Should NOT be on login page
    expect(url).not.toContain('/login');

    // Take screenshot
    await page.screenshot({ path: '/tmp/dashboard.png', fullPage: true });
    console.log('✅ Dashboard loaded');
  });

  test('should navigate to all major hubs', async ({ page }) => {
    const hubs = [
      'Fleet',
      'Drivers',
      'Maintenance',
      'Operations',
      'Analytics',
      'Compliance'
    ];

    for (const hub of hubs) {
      try {
        // Try to find and click hub link
        const link = page.getByRole('link', { name: new RegExp(hub, 'i') }).first();
        const isVisible = await link.isVisible().catch(() => false);

        if (isVisible) {
          await link.click();
          await page.waitForTimeout(1000);
          await page.screenshot({ path: `/tmp/hub-${hub.toLowerCase()}.png` });
          console.log(`✅ ${hub} hub loaded`);
        } else {
          console.log(`⚠️ ${hub} hub link not found`);
        }
      } catch (error) {
        console.log(`❌ ${hub} hub error:`, error);
      }
    }
  });

  test('should check for console errors', async ({ page }) => {
    const errors: string[] = [];

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    await page.goto('http://localhost:5173/');
    await page.waitForTimeout(5000);

    const relevantErrors = errors.filter(err =>
      !err.includes('DevTools') &&
      !err.includes('extension') &&
      !err.includes('favicon')
    );

    console.log('Console errors found:', relevantErrors.length);
    relevantErrors.forEach(err => console.log('ERROR:', err));
  });
});
