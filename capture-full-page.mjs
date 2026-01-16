import { chromium } from '@playwright/test';

async function captureFullPage() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });

  try {
    console.log('Navigating to FleetHub...');
    await page.goto('http://localhost:5174/fleet-hub', {
      waitUntil: 'networkidle',
      timeout: 30000
    });

    // Wait for React Query to load data
    await page.waitForTimeout(8000);

    // Capture full page screenshot
    await page.screenshot({
      path: 'test-results/fleet-hub-full-page.png',
      fullPage: true
    });

    console.log('✅ Full page screenshot saved');

    // Also capture viewport screenshot
    await page.screenshot({
      path: 'test-results/fleet-hub-viewport.png',
      fullPage: false
    });

    console.log('✅ Viewport screenshot saved');

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await browser.close();
  }
}

captureFullPage();
