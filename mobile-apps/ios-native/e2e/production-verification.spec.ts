import { test, expect } from '@playwright/test';

const PRODUCTION_URL = 'https://fleet.capitaltechalliance.com';

test.describe('Production Verification Tests', () => {
  
  test('Homepage loads successfully', async ({ page }) => {
    await page.goto(PRODUCTION_URL);
    await expect(page).toHaveTitle(/Fleet/i);
    
    // Check for no console errors
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    await page.waitForLoadState('networkidle');
    expect(errors).toHaveLength(0);
  });

  test('API health endpoint responds', async ({ request }) => {
    const response = await request.get(`${PRODUCTION_URL}/api/status`);
    expect(response.ok()).toBeTruthy();
    
    const data = await response.json();
    expect(data).toHaveProperty('status', 'operational');
    expect(data.services).toHaveProperty('database', 'connected');
    expect(data.services).toHaveProperty('redis', 'connected');
  });

  test('Static assets load correctly', async ({ page }) => {
    await page.goto(PRODUCTION_URL);
    
    // Wait for all network activity to settle
    await page.waitForLoadState('networkidle');
    
    // Check that JavaScript bundles loaded
    const scripts = await page.$$eval('script[src]', scripts => 
      scripts.map(s => s.getAttribute('src'))
    );
    
    expect(scripts.length).toBeGreaterThan(0);
    
    // Verify at least one React/app script loaded
    const hasAppScript = scripts.some(src => 
      src?.includes('index') || src?.includes('main') || src?.includes('app')
    );
    expect(hasAppScript).toBeTruthy();
  });

  test('Authentication redirects work', async ({ page }) => {
    await page.goto(`${PRODUCTION_URL}/dashboard`);
    
    // Should redirect to login or show auth requirement
    await page.waitForLoadState('networkidle');
    
    const url = page.url();
    const hasAuthFlow = url.includes('login') || 
                        url.includes('auth') || 
                        await page.locator('text=/login|sign in/i').count() > 0;
    
    expect(hasAuthFlow).toBeTruthy();
  });

  test('Protected API endpoints return 401', async ({ request }) => {
    const response = await request.get(`${PRODUCTION_URL}/api/vehicles`);
    expect(response.status()).toBe(401);
  });

  test('HTTPS and security headers present', async ({ request }) => {
    const response = await request.get(PRODUCTION_URL);
    
    expect(response.url()).toContain('https://');
    
    const headers = response.headers();
    expect(headers).toHaveProperty('strict-transport-security');
  });

  test('No JavaScript errors on load', async ({ page }) => {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    page.on('console', msg => {
      if (msg.type() === 'error') errors.push(msg.text());
      if (msg.type() === 'warning') warnings.push(msg.text());
    });
    
    page.on('pageerror', err => {
      errors.push(err.message);
    });
    
    await page.goto(PRODUCTION_URL);
    await page.waitForLoadState('networkidle');
    
    console.log(`Errors: ${errors.length}, Warnings: ${warnings.length}`);
    if (errors.length > 0) {
      console.log('Errors found:', errors);
    }
    
    expect(errors).toHaveLength(0);
  });

  test('All critical routes are accessible', async ({ page }) => {
    const routes = ['/', '/login', '/dashboard'];
    
    for (const route of routes) {
      const response = await page.goto(`${PRODUCTION_URL}${route}`);
      expect(response?.status()).toBeLessThan(400);
    }
  });

  test('Performance: Page loads under 3 seconds', async ({ page }) => {
    const startTime = Date.now();
    await page.goto(PRODUCTION_URL);
    await page.waitForLoadState('domcontentloaded');
    const loadTime = Date.now() - startTime;
    
    console.log(`Page load time: ${loadTime}ms`);
    expect(loadTime).toBeLessThan(3000);
  });
});
