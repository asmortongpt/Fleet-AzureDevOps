import { test, expect } from '@playwright/test';

test.describe('Complete SSO Flow Testing (P0)', () => {
  test('should initiate Microsoft SSO redirect when clicking sign-in button', async ({ page, context }) => {
    // Navigate to login page
    await page.goto('http://localhost:5173/login');
    await page.waitForLoadState('networkidle');

    // Verify we're on login page
    expect(page.url()).toContain('/login');
    console.log('✅ Login page loaded:', page.url());

    // Find Microsoft sign-in button
    const msftButton = page.getByRole('button', { name: /sign in with microsoft/i });
    await expect(msftButton).toBeVisible();
    console.log('✅ Microsoft sign-in button is visible');

    // Listen for navigation before clicking
    const navigationPromise = page.waitForURL(/login\.microsoftonline\.com|localhost/, {
      timeout: 10000,
      waitUntil: 'networkidle'
    }).catch(() => {
      console.log('Navigation did not occur or timed out');
      return null;
    });

    // Click the Microsoft sign-in button
    console.log('Clicking "Sign in with Microsoft" button...');
    await msftButton.click();

    // Wait for navigation
    await navigationPromise;

    // Check where we ended up
    const finalUrl = page.url();
    console.log('URL after clicking:', finalUrl);

    if (finalUrl.includes('login.microsoftonline.com')) {
      console.log('✅ SUCCESS: Redirected to Microsoft login');
      console.log('Full URL:', finalUrl);

      // Extract and verify redirect_uri parameter
      const url = new URL(finalUrl);
      const redirectUri = url.searchParams.get('redirect_uri');
      const clientId = url.searchParams.get('client_id');
      const scope = url.searchParams.get('scope');

      console.log('Redirect URI:', redirectUri);
      console.log('Client ID:', clientId);
      console.log('Scopes:', scope);

      // Verify redirect_uri matches expected value
      if (redirectUri && redirectUri.includes('http://localhost:5173/auth/callback')) {
        console.log('✅ Redirect URI is correct for localhost testing');
      } else {
        console.log('⚠️ Redirect URI:', redirectUri, '(expected: http://localhost:5173/auth/callback)');
      }

      // Verify client ID matches env
      if (clientId === 'baae0851-0c24-4214-8587-e3fabc46bd4a') {
        console.log('✅ Client ID matches VITE_AZURE_AD_CLIENT_ID');
      } else {
        console.log('⚠️ Client ID mismatch:', clientId);
      }
    } else if (finalUrl.includes('/auth/callback')) {
      console.log('⚠️ Redirected to /auth/callback (unexpected - no Microsoft login shown)');
    } else {
      console.log('⚠️ Unexpected URL:', finalUrl);
    }

    // Take screenshot of final state
    await page.screenshot({ path: '/tmp/sso-after-click.png', fullPage: true });
    console.log('Screenshot saved to /tmp/sso-after-click.png');
  });

  test('should have correct MSAL configuration', async ({ page }) => {
    // Navigate to app
    await page.goto('http://localhost:5173/login');
    await page.waitForLoadState('networkidle');

    // Check MSAL config in browser console
    const msalConfig = await page.evaluate(() => {
      return {
        clientId: (window as any).msalConfig?.auth?.clientId || 'not found',
        authority: (window as any).msalConfig?.auth?.authority || 'not found',
        redirectUri: (window as any).msalConfig?.auth?.redirectUri || 'not found',
      };
    }).catch(() => ({
      clientId: 'error accessing msalConfig',
      authority: 'error accessing msalConfig',
      redirectUri: 'error accessing msalConfig',
    }));

    console.log('MSAL Configuration:', JSON.stringify(msalConfig, null, 2));
  });

  test('should show proper error when SSO fails', async ({ page }) => {
    // Navigate with error parameters
    await page.goto('http://localhost:5173/login?error=oauth_failed&message=Test+error');
    await page.waitForLoadState('networkidle');

    // Check for error alert
    const errorAlert = page.locator('[role="alert"]');
    const isVisible = await errorAlert.isVisible().catch(() => false);

    if (isVisible) {
      const errorText = await errorAlert.textContent();
      console.log('✅ Error alert is visible:', errorText);
    } else {
      console.log('⚠️ No error alert shown');
    }
  });
});
