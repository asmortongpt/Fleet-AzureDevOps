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
  const screenshotDir = './screenshots';

  // Navigate to hub by clicking in the sidebar
  const navigateToHub = async (page, hubName) => {
    try {
      // Look for the hub link in the navigation sidebar
      await page.click(`text="${hubName}"`, { timeout: 5000 });
      await page.waitForTimeout(2000);
      return true;
    } catch (e) {
      console.log(`  ⚠️  Could not navigate to ${hubName}`);
      return false;
    }
  };

  const screenshots = [
    {
      name: 'operations-hub-dispatch',
      hubName: 'Operations Hub',
      description: 'Operations Hub - Dispatch Tab (Default)',
      waitFor: 2000,
    },
    {
      name: 'operations-hub-routes',
      hubName: 'Operations Hub',
      description: 'Operations Hub - Routes Tab',
      waitFor: 2000,
      action: async (page) => {
        try {
          await page.click('[data-testid="hub-tab-routes"]', { timeout: 5000 });
          await page.waitForTimeout(1500);
        } catch (e) {
          console.log('  ⚠️  Routes tab not found');
        }
      },
    },
    {
      name: 'operations-hub-tasks',
      hubName: 'Operations Hub',
      description: 'Operations Hub - Tasks Tab',
      waitFor: 2000,
      action: async (page) => {
        try {
          await page.click('[data-testid="hub-tab-tasks"]', { timeout: 5000 });
          await page.waitForTimeout(1500);
        } catch (e) {
          console.log('  ⚠️  Tasks tab not found');
        }
      },
    },
    {
      name: 'assets-hub-assets',
      hubName: 'Assets Hub',
      description: 'Assets Hub - Assets Tab (Default)',
      waitFor: 2000,
    },
    {
      name: 'assets-hub-equipment',
      hubName: 'Assets Hub',
      description: 'Assets Hub - Equipment Tab',
      waitFor: 2000,
      action: async (page) => {
        try {
          await page.click('[data-testid="hub-tab-equipment"]', { timeout: 5000 });
          await page.waitForTimeout(1500);
        } catch (e) {
          console.log('  ⚠️  Equipment tab not found');
        }
      },
    },
    {
      name: 'maintenance-hub-garage',
      hubName: 'Maintenance Hub',
      description: 'Maintenance Hub - Garage Tab (Default)',
      waitFor: 2000,
    },
    {
      name: 'maintenance-hub-predictive',
      hubName: 'Maintenance Hub',
      description: 'Maintenance Hub - Predictive Tab',
      waitFor: 2000,
      action: async (page) => {
        try {
          await page.click('[data-testid="hub-tab-predictive"]', { timeout: 5000 });
          await page.waitForTimeout(1500);
        } catch (e) {
          console.log('  ⚠️  Predictive tab not found');
        }
      },
    },
    {
      name: 'compliance-hub-dashboard',
      hubName: 'Compliance Hub',
      description: 'Compliance Hub - Dashboard Tab (Default)',
      waitFor: 2000,
    },
    {
      name: 'compliance-hub-dot',
      hubName: 'Compliance Hub',
      description: 'Compliance Hub - DOT Tab',
      waitFor: 2000,
      action: async (page) => {
        try {
          await page.click('[data-testid="hub-tab-dot"]', { timeout: 5000 });
          await page.waitForTimeout(1500);
        } catch (e) {
          console.log('  ⚠️  DOT tab not found');
        }
      },
    },
  ];

  // Navigate to app first
  await page.goto(baseUrl, { waitUntil: 'networkidle' });
  await page.waitForTimeout(3000);

  let currentHub = null;

  for (const screenshot of screenshots) {
    try {
      console.log(`📸 Capturing: ${screenshot.description}`);

      // Navigate to hub if it's different from current
      if (currentHub !== screenshot.hubName) {
        const success = await navigateToHub(page, screenshot.hubName);
        if (!success) {
          console.log(`   ⚠️  Skipping ${screenshot.name} - navigation failed\n`);
          continue;
        }
        currentHub = screenshot.hubName;
      }

      // Wait for hub to load
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
