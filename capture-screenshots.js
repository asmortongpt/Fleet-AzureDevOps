/**
 * Playwright Screenshot Capture Script
 * Captures screenshots of all Fleet Hub pages for demo presentation
 */

import { chromium } from 'playwright';

async function captureScreenshots() {
  console.log('🚀 Starting screenshot capture...\n');

  const browser = await chromium.launch({
    headless: false, // Show browser so we can see what's happening
  });

  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
  });

  const page = await context.newPage();

  const baseUrl = 'http://localhost:5174';
  const screenshotDir = './docs/presentations/screenshots';

  const screenshots = [
    {
      name: '01-fleet-hub-dashboard',
      url: `${baseUrl}/fleet`,
      description: 'Fleet Hub - Dashboard Overview',
      waitFor: 2000,
    },
    {
      name: '02-fleet-hub-virtual-garage',
      url: `${baseUrl}/fleet`,
      description: 'Fleet Hub - Virtual Garage 3D View',
      waitFor: 2000,
      action: async (page) => {
        // Click Virtual Garage tab
        try {
          await page.click('text=Virtual Garage', { timeout: 5000 });
          await page.waitForTimeout(3000); // Wait for 3D model to load
        } catch (e) {
          console.log('  ⚠️  Virtual Garage tab not found, using default view');
        }
      },
    },
    {
      name: '03-operations-hub-dispatch',
      url: `${baseUrl}/operations`,
      description: 'Operations Hub - Dispatch Console',
      waitFor: 2000,
    },
    {
      name: '04-operations-hub-routes',
      url: `${baseUrl}/operations`,
      description: 'Operations Hub - Route Optimization',
      waitFor: 2000,
      action: async (page) => {
        try {
          await page.click('text=Routes', { timeout: 5000 });
          await page.waitForTimeout(2000);
        } catch (e) {
          console.log('  ⚠️  Routes tab not found');
        }
      },
    },
    {
      name: '05-maintenance-hub-predictive',
      url: `${baseUrl}/maintenance`,
      description: 'Maintenance Hub - Predictive Maintenance',
      waitFor: 2000,
      action: async (page) => {
        try {
          await page.click('text=Predictive Maintenance', { timeout: 5000 });
          await page.waitForTimeout(2000);
        } catch (e) {
          console.log('  ⚠️  Predictive Maintenance tab not found, using default view');
        }
      },
    },
    {
      name: '06-maintenance-hub-garage',
      url: `${baseUrl}/maintenance`,
      description: 'Maintenance Hub - Garage & Service',
      waitFor: 2000,
      action: async (page) => {
        try {
          await page.click('text=Garage & Service', { timeout: 5000 });
          await page.waitForTimeout(2000);
        } catch (e) {
          console.log('  ⚠️  Garage & Service tab not found');
        }
      },
    },
    {
      name: '07-compliance-hub-dot',
      url: `${baseUrl}/compliance`,
      description: 'Compliance Hub - DOT Compliance',
      waitFor: 2000,
    },
    {
      name: '08-compliance-hub-ifta',
      url: `${baseUrl}/compliance`,
      description: 'Compliance Hub - IFTA Reporting',
      waitFor: 2000,
      action: async (page) => {
        try {
          await page.click('text=IFTA', { timeout: 5000 });
          await page.waitForTimeout(2000);
        } catch (e) {
          console.log('  ⚠️  IFTA tab not found');
        }
      },
    },
    {
      name: '09-safety-hub-incidents',
      url: `${baseUrl}/safety`,
      description: 'Safety Hub - Incidents',
      waitFor: 2000,
    },
    {
      name: '10-safety-hub-video',
      url: `${baseUrl}/safety`,
      description: 'Safety Hub - Video Telematics',
      waitFor: 2000,
      action: async (page) => {
        try {
          await page.click('text=Video', { timeout: 5000 });
          await page.waitForTimeout(2000);
        } catch (e) {
          console.log('  ⚠️  Video tab not found');
        }
      },
    },
    {
      name: '11-drivers-hub',
      url: `${baseUrl}/drivers`,
      description: 'Drivers Hub - Driver Management',
      waitFor: 2000,
    },
    {
      name: '12-procurement-hub',
      url: `${baseUrl}/procurement`,
      description: 'Procurement Hub - Vendors & Parts',
      waitFor: 2000,
    },
    {
      name: '13-assets-hub',
      url: `${baseUrl}/assets`,
      description: 'Assets Hub - Asset Tracking',
      waitFor: 2000,
    },
  ];

  for (const screenshot of screenshots) {
    try {
      console.log(`📸 Capturing: ${screenshot.description}`);

      // Navigate to page
      await page.goto(screenshot.url, { waitUntil: 'networkidle' });

      // Wait for initial load
      await page.waitForTimeout(screenshot.waitFor);

      // Execute custom action if provided (e.g., click tab)
      if (screenshot.action) {
        await screenshot.action(page);
      }

      // Take screenshot
      await page.screenshot({
        path: `${screenshotDir}/${screenshot.name}.png`,
        fullPage: false, // Capture viewport only (not full scrollable page)
      });

      console.log(`   ✅ Saved: ${screenshot.name}.png\n`);

    } catch (error) {
      console.error(`   ❌ Error capturing ${screenshot.name}:`, error.message);
      console.log('');
    }
  }

  await browser.close();
  console.log('✨ Screenshot capture complete!\n');
  console.log(`📁 Screenshots saved to: ${screenshotDir}/\n`);
}

captureScreenshots().catch(console.error);
