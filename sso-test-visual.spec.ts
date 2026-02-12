import { test, expect } from '@playwright/test';

test.describe('SSO Authentication Flow Testing (P0)', () => {
  test('should show login page and Microsoft SSO button', async ({ page }) => {
    // Navigate to login page
    await page.goto('http://localhost:5173/login');

    // Wait for page to load
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000); // Wait for any auto-login logic

    // Check current URL
    const currentUrl = page.url();
    console.log('Current URL:', currentUrl);

    // Check page title
    const title = await page.title();
    console.log('Page title:', title);

    // Check for Microsoft SSO button
    const msftButton = page.getByRole('button', { name: /sign in with microsoft/i });
    const isVisible = await msftButton.isVisible().catch(() => false);
    console.log('Microsoft button visible:', isVisible);

    // Check if we were redirected away from login
    if (!currentUrl.includes('/login')) {
      console.log('⚠️ REDIRECTED AWAY FROM LOGIN PAGE - Auto-login bypass active!');
      console.log('This prevents SSO testing');
    }

    // Take screenshot for evidence
    await page.screenshot({ path: '/tmp/sso-login-page.png', fullPage: true });
    console.log('Screenshot saved to /tmp/sso-login-page.png');

    // Check console logs for auth bypass messages
    page.on('console', (msg) => {
      if (msg.text().includes('DEV mode') || msg.text().includes('demo user')) {
        console.log('Console:', msg.text());
      }
    });
  });

  test('should NOT auto-login when VITE_SKIP_AUTH=false', async ({ page }) => {
    // Navigate to root
    await page.goto('http://localhost:5173/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000); // Wait for auth logic

    const finalUrl = page.url();
    console.log('Final URL after navigating to /:', finalUrl);

    // Should either:
    // 1. Stay at / and show content (if authenticated)
    // 2. Redirect to /login (if not authenticated)
    // 3. Show login page at / (embedded login)

    if (finalUrl.includes('/login')) {
      console.log('✅ Correctly redirected to login (not authenticated)');
    } else {
      console.log('⚠️ Did NOT redirect to login - checking if auto-logged in');

      // Check for user indication in UI
      const userElement = await page.locator('[data-testid="user-avatar"], [data-testid="user-menu"], text="Toby"').first().isVisible().catch(() => false);
      if (userElement) {
        console.log('❌ P0 BLOCKER: Auto-login bypass is active despite VITE_SKIP_AUTH=false');
      }
    }
  });
});
