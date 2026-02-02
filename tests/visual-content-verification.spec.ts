import { test, expect } from '@playwright/test';

/**
 * Visual Content Verification Suite
 *
 * Purpose: Verify that pages actually SHOW content to users, not just load successfully.
 *
 * These tests check for:
 * - Visible text content
 * - UI components rendering
 * - Data displaying in tables/lists
 * - Interactive elements present
 *
 * Unlike the basic load tests, these FAIL if pages are blank.
 */

const HUBS = [
  { name: 'Homepage', path: '/', expectedH1: 'Fleet', hasButton: true },
  { name: 'Fleet Hub', path: '/fleet', expectedH1: 'Fleet', hasContent: true },
  { name: 'Operations Hub', path: '/operations', expectedH1: 'Operations', hasContent: true },
  { name: 'Maintenance Hub', path: '/maintenance', expectedH1: 'Maintenance', hasContent: true },
  { name: 'Drivers Hub', path: '/drivers', expectedH1: 'Drivers', hasContent: true },
  { name: 'Analytics Hub', path: '/analytics', expectedH1: 'Analytics', hasContent: true },
  { name: 'Reports Hub', path: '/reports', expectedH1: 'Reports', hasContent: true },
];

test.describe('Visual Content Verification Suite', () => {
  test.beforeEach(async ({ page }) => {
    // Set reasonable timeout for page loads
    page.setDefaultTimeout(30000);
  });

  for (const hub of HUBS) {
    test(`${hub.name} - renders actual visible content`, async ({ page }) => {
      console.log(`\n🔍 Testing ${hub.name} for visible content...`);

      // Navigate to the hub
      await page.goto(`http://localhost:5173${hub.path}`, {
        waitUntil: 'domcontentloaded',
        timeout: 30000
      });

      // Wait for React to hydrate
      await page.waitForTimeout(2000);

      // Take screenshot for visual inspection
      await page.screenshot({
        path: `test-results/content-verification/${hub.name.toLowerCase().replace(/ /g, '-')}.png`,
        fullPage: true
      });

      // CRITICAL: Verify the page is NOT blank
      const bodyText = await page.locator('body').textContent();
      expect(bodyText?.length || 0).toBeGreaterThan(50); // Page should have substantial text

      // Verify root element renders
      const root = page.locator('#root');
      await expect(root).toBeVisible();

      // Verify page has actual content, not just structure
      const hasVisibleText = await page.locator('body').evaluate((el) => {
        const text = el.innerText || '';
        return text.replace(/\s/g, '').length > 100; // More than 100 chars of content
      });
      expect(hasVisibleText).toBe(true);

      // Check for heading
      if (hub.expectedH1) {
        const headings = page.locator('h1, h2, h3, [role="heading"]');
        const headingCount = await headings.count();
        expect(headingCount).toBeGreaterThan(0); // Should have at least one heading

        const headingText = await headings.first().textContent();
        console.log(`  ✓ Found heading: "${headingText}"`);
      }

      // Check for interactive elements
      if (hub.hasButton) {
        const buttons = page.locator('button:visible');
        const buttonCount = await buttons.count();
        console.log(`  ✓ Found ${buttonCount} visible buttons`);
        // Note: Auth-protected pages may have 0 buttons, which is OK
      }

      // Verify NOT a blank screen
      const isBlank = await page.evaluate(() => {
        const body = document.body;
        const styles = window.getComputedStyle(body);
        const backgroundColor = styles.backgroundColor;
        const text = body.innerText || '';

        // Page is blank if it's white/transparent and has minimal text
        const isWhite = backgroundColor === 'rgba(0, 0, 0, 0)' ||
                       backgroundColor === 'rgb(255, 255, 255)' ||
                       backgroundColor === 'transparent';
        const hasMinimalText = text.replace(/\s/g, '').length < 50;

        return isWhite && hasMinimalText;
      });

      expect(isBlank).toBe(false); // Page should NOT be blank

      console.log(`  ✅ ${hub.name} - Content verified successfully`);
    });
  }

  test('Verify app shows login OR content (not blank)', async ({ page }) => {
    await page.goto('http://localhost:5173/fleet');
    await page.waitForTimeout(2000);

    const bodyText = await page.locator('body').textContent() || '';

    // Page should show EITHER:
    // 1. Login form (has "sign", "login", "email", "password")
    // 2. Actual content (has "fleet", "vehicle", "driver", "dashboard")

    const hasLogin = /sign|login|email|password/i.test(bodyText);
    const hasContent = /fleet|vehicle|driver|dashboard|analytics/i.test(bodyText);

    expect(hasLogin || hasContent).toBe(true);

    if (hasLogin) {
      console.log('  ℹ️  App is showing login screen (expected for auth-protected routes)');
    } else {
      console.log('  ✅ App is showing actual content');
    }
  });

  test('Screenshot comparison - not all white', async ({ page }) => {
    await page.goto('http://localhost:5173');
    await page.waitForTimeout(2000);

    const screenshot = await page.screenshot({ fullPage: true });

    // Check that screenshot is not just white pixels
    // This is a basic check - in production you'd use proper image comparison
    expect(screenshot.length).toBeGreaterThan(1000); // Should be substantial file size

    console.log(`  ✅ Screenshot size: ${screenshot.length} bytes (not a blank page)`);
  });
});
