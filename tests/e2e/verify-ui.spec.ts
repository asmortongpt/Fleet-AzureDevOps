import { test, expect } from '@playwright/test';

test.describe('UI Verification - Morton-Tech Fleet', () => {
  test('verify homepage loads with CTA branding', async ({ page }) => {
    // Collect console errors
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') errors.push(msg.text());
    });

    await page.goto('http://localhost:5173', { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(3000);

    // Screenshot full page
    await page.screenshot({ path: '/tmp/ui-verify/01-homepage.png', fullPage: false });

    // Check header - should have CTA Navy background
    const header = page.locator('header').first();
    const headerVisible = await header.isVisible().catch(() => false);
    console.log('Header visible:', headerVisible);
    if (headerVisible) {
      await header.screenshot({ path: '/tmp/ui-verify/02-header.png' });
    }

    // Check for CTA logo images
    const logoImgs = page.locator('img[alt*="CTA"]');
    const logoCount = await logoImgs.count();
    console.log('CTA logo images found:', logoCount);
    for (let i = 0; i < Math.min(logoCount, 3); i++) {
      const img = logoImgs.nth(i);
      const src = await img.getAttribute('src');
      const naturalWidth = await img.evaluate((el: HTMLImageElement) => el.naturalWidth).catch(() => 0);
      console.log(`  Logo ${i}: src=${src}, naturalWidth=${naturalWidth}, rendered=${naturalWidth > 0}`);
    }

    // Check sidebar/icon rail navigation
    const nav = page.locator('nav[aria-label="Main Navigation"]').first();
    const navVisible = await nav.isVisible().catch(() => false);
    console.log('Sidebar nav visible:', navVisible);
    if (navVisible) {
      await nav.screenshot({ path: '/tmp/ui-verify/03-sidebar.png' });
    }

    // Check for AI chatbot FAB button
    const chatbot = page.locator('#cta-ai-fab').first();
    const chatbotVisible = await chatbot.isVisible().catch(() => false);
    console.log('AI Chatbot FAB visible:', chatbotVisible);

    // Check for broken images
    const brokenImages = await page.evaluate(() => {
      const imgs = Array.from(document.querySelectorAll('img'));
      return imgs.filter(img => !img.complete || img.naturalWidth === 0).map(img => ({
        src: img.src,
        alt: img.alt
      }));
    });
    console.log('Broken images:', JSON.stringify(brokenImages));

    // Check the map area
    const mapContainer = page.locator('[class*="map"], [id*="map"], .gm-style').first();
    const mapVisible = await mapContainer.isVisible().catch(() => false);
    console.log('Map container visible:', mapVisible);

    // Check for data in the dashboard
    const statCards = page.locator('[class*="stat"], [class*="card"]');
    const cardCount = await statCards.count();
    console.log('Dashboard cards found:', cardCount);

    // Console errors summary
    console.log('Console errors count:', errors.length);
    if (errors.length > 0) {
      console.log('First 5 errors:', errors.slice(0, 5).join('\n'));
    }
  });

  test('verify fleet page with vehicle data', async ({ page }) => {
    await page.goto('http://localhost:5173/fleet', { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(8000); // Wait for React Query to settle
    await page.screenshot({ path: '/tmp/ui-verify/04-fleet-page.png', fullPage: false });

    // Check for stat card data
    const statCards = page.locator('text=/\\d+/');
    const statCount = await statCards.count();
    console.log('Stat elements with numbers on fleet page:', statCount);

    // Check for skeleton cards (should be 0 after data loads)
    const skeletons = page.locator('[class*="skeleton"], [data-slot="skeleton"]');
    const skeletonCount = await skeletons.count();
    console.log('Remaining skeleton elements:', skeletonCount);
  });

  test('verify drivers page', async ({ page }) => {
    await page.goto('http://localhost:5173/drivers', { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(8000);
    await page.screenshot({ path: '/tmp/ui-verify/05-drivers-page.png', fullPage: false });
  });

  test('verify maintenance page', async ({ page }) => {
    await page.goto('http://localhost:5173/maintenance', { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(8000);
    await page.screenshot({ path: '/tmp/ui-verify/06-maintenance-page.png', fullPage: false });
  });
});
