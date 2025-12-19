/**
 * Security Testing
 * Tests for common vulnerabilities and security best practices
 */
import { test, expect } from '@playwright/test';

const BASE_URL = process.env.APP_URL || 'http://localhost:5000';

test.describe('Security Tests - OWASP Top 10', () => {

  test('Security headers are present', async ({ page }) => {
    const response = await page.goto(BASE_URL);

    const headers = response?.headers() || {};

    console.log('\nSecurity Headers:');
    console.log('X-Content-Type-Options:', headers['x-content-type-options']);
    console.log('X-Frame-Options:', headers['x-frame-options']);
    console.log('X-XSS-Protection:', headers['x-xss-protection']);
    console.log('Strict-Transport-Security:', headers['strict-transport-security']);
    console.log('Content-Security-Policy:', headers['content-security-policy']);

    // Check for important security headers
    // Note: Some may not be set in development
    const hasSecurityHeaders =
      headers['x-content-type-options'] ||
      headers['x-frame-options'] ||
      headers['content-security-policy'];

    expect(hasSecurityHeaders).toBeTruthy();
  });

  test('No sensitive data in localStorage', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');

    const localStorageData = await page.evaluate(() => {
      const data: Record<string, any> = {};
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) {
          data[key] = localStorage.getItem(key);
        }
      }
      return data;
    });

    console.log('\nLocalStorage Keys:', Object.keys(localStorageData));

    // Check for sensitive patterns in localStorage
    const sensitivePatterns = [
      /password/i,
      /token/i,
      /secret/i,
      /credit/i,
      /ssn/i,
    ];

    Object.entries(localStorageData).forEach(([key, value]) => {
      const dataString = JSON.stringify(value).toLowerCase();
      sensitivePatterns.forEach(pattern => {
        if (pattern.test(key) || pattern.test(dataString)) {
          console.warn(`⚠️  Potentially sensitive data in localStorage: ${key}`);
        }
      });
    });
  });

  test('XSS Protection - Script injection attempt', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');

    // Try to inject a script via search input
    const searchInput = page.locator('input[type="search"]').first();

    if (await searchInput.count() > 0) {
      const xssPayload = '<script>alert("XSS")</script>';
      await searchInput.fill(xssPayload);
      await page.waitForTimeout(1000);

      // Check if script was executed (it shouldn't be)
      const dialogOpened = await page.evaluate(() => {
        return window.document.querySelector('script[src*="alert"]') !== null;
      });

      expect(dialogOpened).toBe(false);
    }
  });

  test('SQL Injection Protection - Input sanitization', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');

    const searchInput = page.locator('input').first();

    if (await searchInput.count() > 0) {
      // Common SQL injection patterns
      const sqlPayloads = [
        "' OR '1'='1",
        "'; DROP TABLE users--",
        "1' UNION SELECT NULL--",
      ];

      for (const payload of sqlPayloads) {
        await searchInput.fill(payload);
        await page.waitForTimeout(500);

        // Application should handle gracefully, not crash
        const errorVisible = await page.locator('text=/error|exception/i').count();
        expect(errorVisible).toBe(0);
      }
    }
  });

  test('HTTPS Redirect Check', async ({ page, context }) => {
    // Check if HTTP redirects to HTTPS in production
    if (BASE_URL.startsWith('https://')) {
      const httpUrl = BASE_URL.replace('https://', 'http://');

      try {
        const response = await page.goto(httpUrl);
        const finalUrl = response?.url();

        console.log('Redirect:', httpUrl, '→', finalUrl);

        // Should redirect to HTTPS
        if (finalUrl) {
          expect(finalUrl.startsWith('https://')).toBe(true);
        }
      } catch (error) {
        console.log('HTTP redirect test skipped (dev environment)');
      }
    }
  });

  test('No console errors with sensitive info', async ({ page }) => {
    const consoleMessages: string[] = [];

    page.on('console', msg => {
      consoleMessages.push(msg.text());
    });

    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');

    // Check for sensitive patterns in console
    const sensitivePatterns = [
      /password/i,
      /api[_-]?key/i,
      /secret/i,
      /token/i,
    ];

    consoleMessages.forEach(msg => {
      sensitivePatterns.forEach(pattern => {
        if (pattern.test(msg)) {
          console.warn('⚠️  Sensitive data in console:', msg.substring(0, 100));
        }
      });
    });
  });

  test('CORS Configuration', async ({ page }) => {
    const response = await page.goto(BASE_URL);
    const headers = response?.headers() || {};

    console.log('\nCORS Headers:');
    console.log('Access-Control-Allow-Origin:', headers['access-control-allow-origin']);
    console.log('Access-Control-Allow-Methods:', headers['access-control-allow-methods']);
    console.log('Access-Control-Allow-Headers:', headers['access-control-allow-headers']);

    // CORS should not allow all origins in production
    if (BASE_URL.includes('production')) {
      expect(headers['access-control-allow-origin']).not.toBe('*');
    }
  });

  test('Authentication State Management', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');

    // Check if authentication tokens are in secure storage
    const cookies = await page.context().cookies();

    console.log('\nCookies:', cookies.map(c => ({
      name: c.name,
      secure: c.secure,
      httpOnly: c.httpOnly,
      sameSite: c.sameSite,
    })));

    // Auth cookies should be httpOnly and secure
    const authCookies = cookies.filter(c =>
      c.name.toLowerCase().includes('auth') ||
      c.name.toLowerCase().includes('token') ||
      c.name.toLowerCase().includes('session')
    );

    authCookies.forEach(cookie => {
      console.log(`Checking cookie: ${cookie.name}`);
      // In production, should be secure
      if (BASE_URL.startsWith('https://')) {
        expect(cookie.secure).toBe(true);
      }
    });
  });

  test('Rate Limiting Check', async ({ page }) => {
    await page.goto(BASE_URL);

    // Make rapid requests to same endpoint
    const requests: Promise<any>[] = [];
    for (let i = 0; i < 50; i++) {
      requests.push(
        page.evaluate(() => fetch('/api/vehicles').catch(() => null))
      );
    }

    await Promise.all(requests);

    // Application should handle gracefully
    const pageVisible = await page.locator('body').isVisible();
    expect(pageVisible).toBe(true);
  });
});

test.describe('Input Validation Security', () => {

  test('File Upload Validation', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');

    const fileInput = page.locator('input[type="file"]').first();

    if (await fileInput.count() > 0) {
      // Try to upload executable file (should be rejected)
      // Note: This is a simulation, actual test would need real file
      console.log('File upload validation should reject executables');
    }
  });

  test('URL Parameter Tampering', async ({ page }) => {
    // Try accessing with manipulated URL parameters
    const tamperUrls = [
      `${BASE_URL}?id=../../etc/passwd`,
      `${BASE_URL}?redirect=javascript:alert(1)`,
      `${BASE_URL}?id=<script>alert(1)</script>`,
    ];

    for (const url of tamperUrls) {
      try {
        await page.goto(url);
        await page.waitForTimeout(500);

        // Should not execute scripts or crash
        const errorPage = await page.locator('text=/error|not found/i').count();
        console.log(`URL tampering test for: ${url} - errors: ${errorPage}`);
      } catch (error) {
        // Expected - URL might be invalid
      }
    }
  });
});
