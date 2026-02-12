import { test, expect } from '@playwright/test';

const HUBS = [
  { name: 'Command Center', path: '/', selector: '[data-testid="command-center"]' },
  { name: 'Fleet Status', path: '/?module=fleet-status', selector: 'text=/Fleet Status|Vehicle Status/i' },
  { name: 'Driver Management', path: '/?module=driver-management', selector: 'text=/Driver Management|Drivers/i' },
  { name: 'Maintenance Hub', path: '/?module=maintenance-hub', selector: 'text=/Maintenance Hub|Maintenance/i' },
  { name: 'Fuel & Emissions', path: '/?module=fuel-emissions', selector: 'text=/Fuel.*Emissions|Fuel Management/i' },
  { name: 'Route Optimization', path: '/?module=route-optimization', selector: 'text=/Route Optimization|Routes/i' },
  { name: 'Compliance Center', path: '/?module=compliance-center', selector: 'text=/Compliance Center|Compliance/i' },
  { name: 'Cost Management', path: '/?module=cost-management', selector: 'text=/Cost Management|Costs/i' },
  { name: 'Analytics & Reporting', path: '/?module=analytics-reporting', selector: 'text=/Analytics.*Reporting|Analytics/i' },
  { name: 'Settings & Admin', path: '/?module=settings-admin', selector: 'text=/Settings|Administration/i' }
];

test.describe('Fleet Management Hub Tests - All 10 Hubs', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173/login');
    await page.waitForLoadState('networkidle');
    
    const emailInput = page.getByLabel(/email/i).or(page.locator('input[type="email"]')).first();
    const passwordInput = page.getByLabel(/password/i).or(page.locator('input[type="password"]')).first();
    
    await emailInput.fill('admin@example.com');
    await passwordInput.fill('Fleet@2026');
    
    await page.getByRole('button', { name: /sign in|login/i }).click();
    await page.waitForURL('**/');
    await page.waitForLoadState('networkidle');
  });

  for (const hub of HUBS) {
    test('Hub: ' + hub.name + ' - Should load with real data', async ({ page }) => {
      console.log('Testing ' + hub.name);
      
      await page.goto('http://localhost:5173' + hub.path);
      await page.waitForLoadState('networkidle');
      
      const screenshotName = hub.name.replace(/\s+/g, '-').toLowerCase();
      await page.screenshot({ 
        path: '/Users/andrewmorton/Documents/GitHub/Fleet/test-results/' + screenshotName + '-initial.png',
        fullPage: true 
      });
      
      const currentUrl = page.url();
      expect(currentUrl).not.toContain('/login');
      console.log('No login redirect - URL: ' + currentUrl);
      
      await expect(page.locator(hub.selector).first()).toBeVisible({ timeout: 10000 });
      console.log('Hub content visible');
      
      const dataElements = await page.locator('table, [role="grid"], [data-testid*="card"], .vehicle-card, .driver-card').count();
      console.log('Found ' + dataElements + ' data elements');
      expect(dataElements).toBeGreaterThan(0);
    });

    test('Hub: ' + hub.name + ' - Drilldown functionality', async ({ page }) => {
      console.log('Testing drilldowns for ' + hub.name);
      
      await page.goto('http://localhost:5173' + hub.path);
      await page.waitForLoadState('networkidle');
      
      const clickableElements = await page.locator('button:not([disabled]), a[href], [role="button"]').all();
      
      console.log('Found ' + clickableElements.length + ' clickable elements');
      
      if (clickableElements.length > 0) {
        for (let i = 0; i < Math.min(3, clickableElements.length); i++) {
          const element = clickableElements[i];
          const text = await element.textContent();
          
          if (text && text.trim() && !text.toLowerCase().includes('logout')) {
            try {
              await element.click({ timeout: 2000 });
              await page.waitForTimeout(500);
              
              const modalOrDrawer = await page.locator('[role="dialog"], .modal, .drawer').count();
              console.log('Clicked element - Modals/Drawers: ' + modalOrDrawer);
              
              const closeButton = page.locator('[aria-label*="close"], button:has-text("Close")').first();
              if (await closeButton.isVisible().catch(() => false)) {
                await closeButton.click();
                await page.waitForTimeout(300);
              }
              
              const screenshotName = hub.name.replace(/\s+/g, '-').toLowerCase();
              await page.screenshot({ 
                path: '/Users/andrewmorton/Documents/GitHub/Fleet/test-results/' + screenshotName + '-drilldown-' + i + '.png',
                fullPage: true 
              });
            } catch (error) {
              console.log('Could not interact with element');
            }
          }
        }
      }
    });
  }
});
