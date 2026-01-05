import { chromium } from '@playwright/test';

async function captureVisualInspection() {
  console.log('🎬 Starting Visual Inspection with Proper Loading...\n');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  const page = await context.newPage();

  const pages = [
    { name: 'homepage', url: 'http://localhost:5174', path: '/tmp/homepage-visual-final.png' },
    { name: 'operations-hub', url: 'http://localhost:5174/operations', path: '/tmp/operations-hub-visual-final.png' },
    { name: 'fleet-hub', url: 'http://localhost:5174/fleet', path: '/tmp/fleet-hub-visual-final.png' },
    { name: 'work-hub', url: 'http://localhost:5174/work', path: '/tmp/work-hub-visual-final.png' },
    { name: 'people-hub', url: 'http://localhost:5174/people', path: '/tmp/people-hub-visual-final.png' },
    { name: 'insights-hub', url: 'http://localhost:5174/insights', path: '/tmp/insights-hub-visual-final.png' }
  ];

  for (const pageInfo of pages) {
    try {
      console.log(`📸 Capturing ${pageInfo.name}...`);

      // Navigate to page
      await page.goto(pageInfo.url, {
        waitUntil: 'networkidle',
        timeout: 60000
      });

      // Wait additional time for React hydration and rendering
      await page.waitForTimeout(5000);

      // Wait for main content to be visible (not error overlay)
      await page.waitForSelector('body', { state: 'visible', timeout: 10000 });

      // Take full page screenshot
      await page.screenshot({
        path: pageInfo.path,
        fullPage: true,
        timeout: 30000
      });

      console.log(`  ✅ Saved to ${pageInfo.path}`);
    } catch (error) {
      console.error(`  ❌ Failed to capture ${pageInfo.name}: ${error}`);
    }
  }

  await browser.close();
  console.log('\n✅ Visual Inspection Complete!\n');
}

captureVisualInspection().catch(console.error);
