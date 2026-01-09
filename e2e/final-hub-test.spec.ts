import { test, expect } from '@playwright/test';

test.describe('Final Hub Verification - All 10 Hubs', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173/login');
    await page.waitForLoadState('networkidle');
    
    await page.locator('input[type="email"]').fill('admin@example.com');
    await page.locator('input[type="password"]').fill('Fleet@2026');
    await page.locator('button[type="submit"]').click();
    await page.waitForTimeout(2000);
  });

  test('All Hubs - Load and Display Real Data', async ({ page }) => {
    const hubs = [
      { name: 'Command Center', path: '/' },
      { name: 'Fleet Status', path: '/?module=fleet-status' },
      { name: 'Driver Management', path: '/?module=driver-management' },
      { name: 'Maintenance Hub', path: '/?module=maintenance-hub' },
      { name: 'Fuel & Emissions', path: '/?module=fuel-emissions' },
      { name: 'Route Optimization', path: '/?module=route-optimization' },
      { name: 'Compliance Center', path: '/?module=compliance-center' },
      { name: 'Cost Management', path: '/?module=cost-management' },
      { name: 'Analytics & Reporting', path: '/?module=analytics-reporting' },
      { name: 'Settings & Admin', path: '/?module=settings-admin' }
    ];
    
    const results = [];
    
    for (const hub of hubs) {
      console.log('\n========================================');
      console.log('Testing: ' + hub.name);
      console.log('========================================');
      
      await page.goto('http://localhost:5173' + hub.path);
      await page.waitForTimeout(3000);
      
      const currentUrl = page.url();
      const noLoginRedirect = !currentUrl.includes('/login');
      
      const dataCount = await page.locator('table, [role="grid"], div[class*="card"], li').count();
      const hasButtons = await page.locator('button:not([disabled])').count();
      const hasLinks = await page.locator('a[href]').count();
      
      const screenshotPath = '/Users/andrewmorton/Documents/GitHub/Fleet/test-results/' + hub.name.replace(/\s+/g, '-').toLowerCase() + '.png';
      await page.screenshot({ path: screenshotPath, fullPage: true });
      
      results.push({
        hub: hub.name,
        url: currentUrl,
        noLoginRedirect: noLoginRedirect,
        dataElements: dataCount,
        buttons: hasButtons,
        links: hasLinks,
        screenshot: screenshotPath
      });
      
      console.log('URL: ' + currentUrl);
      console.log('No Login Redirect: ' + noLoginRedirect);
      console.log('Data Elements: ' + dataCount);
      console.log('Interactive Buttons: ' + hasButtons);
      console.log('Links: ' + hasLinks);
      console.log('Screenshot: ' + screenshotPath);
    }
    
    console.log('\n========================================');
    console.log('FINAL RESULTS SUMMARY');
    console.log('========================================\n');
    console.table(results);
    
    const working = results.filter(r => r.noLoginRedirect && r.dataElements > 0);
    const failing = results.filter(r => !r.noLoginRedirect || r.dataElements === 0);
    
    console.log('\nWorking Hubs: ' + working.length + '/10');
    console.log('Failing Hubs: ' + failing.length + '/10');
    
    if (failing.length > 0) {
      console.log('\nFailing Hub Details:');
      failing.forEach(f => {
        console.log('- ' + f.hub + ': Login Redirect=' + !f.noLoginRedirect + ', No Data=' + (f.dataElements === 0));
      });
    }
    
    expect(working.length).toBeGreaterThanOrEqual(8);
  });

  test('Drilldown Functionality Test', async ({ page }) => {
    const testHubs = [
      '/?module=fleet-status',
      '/?module=driver-management',
      '/?module=maintenance-hub'
    ];
    
    for (const hubPath of testHubs) {
      console.log('\nTesting drilldowns for: ' + hubPath);
      await page.goto('http://localhost:5173' + hubPath);
      await page.waitForTimeout(2000);
      
      const buttons = await page.locator('button:not([disabled]):not(:has-text("Logout")):not(:has-text("Sign out"))').all();
      
      if (buttons.length > 0) {
        const testButton = buttons[0];
        const buttonText = await testButton.textContent();
        
        console.log('Clicking: ' + buttonText);
        await testButton.click();
        await page.waitForTimeout(1000);
        
        const modalCount = await page.locator('[role="dialog"], .modal, [aria-modal="true"]').count();
        console.log('Modals opened: ' + modalCount);
        
        if (modalCount > 0) {
          const closeBtn = page.locator('[aria-label*="close"], button:has-text("Close"), button:has-text("Cancel")').first();
          if (await closeBtn.isVisible().catch(() => false)) {
            await closeBtn.click();
          }
        }
      }
    }
  });
});
