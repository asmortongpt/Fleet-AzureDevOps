import { test } from '@playwright/test';

const pages = [
  { name: '01-dashboard', path: '/', wait: 2000 },
  { name: '02-fleet', path: '/fleet', wait: 3000 },
  { name: '03-drivers', path: '/drivers', wait: 3000 },
  { name: '04-maintenance', path: '/maintenance', wait: 3000 },
  { name: '05-operations', path: '/operations', wait: 2000 },
  { name: '06-assets', path: '/assets', wait: 2000 },
  { name: '07-compliance', path: '/compliance', wait: 2000 },
  { name: '08-analytics', path: '/analytics', wait: 2000 },
  { name: '09-reports', path: '/reports', wait: 2000 },
  { name: '10-settings', path: '/settings', wait: 2000 },
  { name: '11-fuel', path: '/fuel', wait: 2000 },
  { name: '12-safety', path: '/safety', wait: 2000 },
  { name: '13-geofencing', path: '/geofencing', wait: 2000 },
  { name: '14-dispatch', path: '/dispatch', wait: 2000 },
  { name: '15-work-orders', path: '/work-orders', wait: 2000 },
];

test.describe('Visual Inspection - All Pages', () => {
  for (const pg of pages) {
    test(`screenshot ${pg.name} (${pg.path})`, async ({ page }) => {
      test.setTimeout(45000);
      const errors: string[] = [];
      page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });
      
      await page.goto(`http://localhost:5173${pg.path}`, { waitUntil: 'domcontentloaded', timeout: 20000 });
      await page.waitForTimeout(pg.wait);
      
      await page.screenshot({ path: `/tmp/ui-verify/${pg.name}.png`, fullPage: false });
      
      const title = await page.title();
      const bodyText = await page.evaluate(() => document.body.innerText.substring(0, 200));
      console.log(`[${pg.name}] title="${title}" errors=${errors.length} preview="${bodyText.replace(/\\n/g, ' ').substring(0, 100)}"`);
    });
  }
});
