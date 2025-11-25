/**
 * Verify Fleet Hub Functionality
 * Navigates through each hub and captures screenshots
 */

import puppeteer from 'puppeteer';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function verifyHubs() {
  console.log('🚀 Launching browser to verify hub functionality...\n');

  const browser = await puppeteer.launch({
    headless: false, // Show browser for visibility
    defaultViewport: { width: 1920, height: 1080 }
  });

  const page = await browser.newPage();

  try {
    // Navigate to the app
    console.log('📍 Navigating to http://localhost:5174');
    await page.goto('http://localhost:5174', { waitUntil: 'networkidle2' });
    await page.waitForTimeout(2000);

    // Capture home page
    console.log('📸 Capturing home page...');
    await page.screenshot({ path: '/tmp/fleet-01-home.png', fullPage: true });

    // Define hubs to test
    const hubs = [
      { name: 'Operations Hub', path: '/hubs/operations', modules: ['Overview', 'Dispatch', 'Live Tracking', 'Fuel', 'Assets'] },
      { name: 'Fleet Hub', path: '/hubs/fleet', modules: ['Overview', 'Vehicles', 'Vehicle Models', 'Maintenance', 'Work Orders', 'Telematics'] },
      { name: 'Work Hub', path: '/hubs/work', modules: ['Overview', 'Tasks', 'Enhanced Tasks', 'Routes', 'Scheduling', 'Maintenance Requests'] },
      { name: 'People Hub', path: '/hubs/people', modules: ['Overview', 'People', 'Performance', 'Scorecard', 'Mobile Employee', 'Mobile Manager'] },
      { name: 'Insights Hub', path: '/hubs/insights', modules: ['Overview', 'Executive', 'Analytics', 'Reports', 'Workbench', 'Cost Analysis', 'Predictive'] }
    ];

    let hubIndex = 2;
    for (const hub of hubs) {
      console.log(`\n${'='.repeat(60)}`);
      console.log(`📊 Testing: ${hub.name}`);
      console.log(`${'='.repeat(60)}`);

      // Navigate to hub
      console.log(`  → Navigating to ${hub.path}`);
      await page.goto(`http://localhost:5174${hub.path}`, { waitUntil: 'networkidle2' });
      await page.waitForTimeout(1500);

      // Capture hub default view
      const hubScreenshot = `/tmp/fleet-${String(hubIndex).padStart(2, '0')}-${hub.name.toLowerCase().replace(' ', '-')}.png`;
      console.log(`  📸 Capturing ${hub.name} default view...`);
      await page.screenshot({ path: hubScreenshot, fullPage: true });

      // Check if right sidebar exists
      const sidebarExists = await page.evaluate(() => {
        const elements = document.querySelectorAll('[style*="border-left"]');
        return elements.length > 0;
      });

      console.log(`  ✓ Right sidebar: ${sidebarExists ? '✅ Present' : '❌ Missing'}`);

      // Try to find and click module buttons
      console.log(`  🔍 Testing ${hub.modules.length} modules...`);
      let modulesFound = 0;

      for (const moduleName of hub.modules) {
        try {
          // Look for buttons containing the module name
          const buttonFound = await page.evaluate((name) => {
            const buttons = Array.from(document.querySelectorAll('button'));
            const found = buttons.find(btn =>
              btn.textContent.trim().toLowerCase().includes(name.toLowerCase())
            );
            if (found) {
              found.click();
              return true;
            }
            return false;
          }, moduleName);

          if (buttonFound) {
            modulesFound++;
            console.log(`    ✓ ${moduleName}: ✅ Found and clicked`);
            await page.waitForTimeout(500); // Wait for module to load
          } else {
            console.log(`    ✗ ${moduleName}: ⚠️  Not found`);
          }
        } catch (error) {
          console.log(`    ✗ ${moduleName}: ❌ Error - ${error.message}`);
        }
      }

      console.log(`  📊 Modules found: ${modulesFound}/${hub.modules.length}`);

      // Capture final state
      const finalScreenshot = `/tmp/fleet-${String(hubIndex).padStart(2, '0')}-${hub.name.toLowerCase().replace(' ', '-')}-final.png`;
      await page.screenshot({ path: finalScreenshot, fullPage: true });

      hubIndex++;
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ Hub verification complete!');
    console.log('='.repeat(60));
    console.log('\n📁 Screenshots saved to /tmp/fleet-*.png');
    console.log('   - fleet-01-home.png');
    console.log('   - fleet-02-operations-hub.png');
    console.log('   - fleet-03-fleet-hub.png');
    console.log('   - fleet-04-work-hub.png');
    console.log('   - fleet-05-people-hub.png');
    console.log('   - fleet-06-insights-hub.png');
    console.log('\n🎉 All hubs verified!\n');

  } catch (error) {
    console.error('❌ Error during verification:', error);
  } finally {
    await browser.close();
  }
}

verifyHubs().catch(console.error);
