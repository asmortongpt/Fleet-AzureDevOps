import { test } from '@playwright/test';

test.describe('Fleet Management UI Review', () => {
  test('should load homepage and identify issues', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    await page.goto('https://fleet.capitaltechalliance.com');
    await page.waitForLoadState('networkidle');

    // Take screenshot
    await page.screenshot({ path: '/tmp/fleet-homepage.png', fullPage: true });

    // Check page title
    const title = await page.title();
    console.log('Page Title:', title);

    // Check for console errors
    console.log('Console Errors:', errors);

    // Check for main navigation
    const nav = await page.locator('nav').count();
    console.log('Navigation elements:', nav);

    // Check for broken images
    const images = await page.locator('img').all();
    for (const img of images) {
      const src = await img.getAttribute('src');
      const naturalWidth = await img.evaluate((el: HTMLImageElement) => el.naturalWidth);
      if (naturalWidth === 0) {
        console.log('Broken image:', src);
      }
    }

    // Check body dimensions
    const body = await page.locator('body').boundingBox();
    console.log('Body dimensions:', body);

    // Check for overlapping elements with negative margins
    const overlaps = await page.evaluate(() => {
      const elements = Array.from(document.querySelectorAll('*'));
      const issues: string[] = [];

      elements.forEach((el) => {
        const style = window.getComputedStyle(el);
        if (parseFloat(style.marginTop) < -50 || parseFloat(style.marginLeft) < -50) {
          const className = (el as HTMLElement).className || '';
          issues.push(`Negative margin on ${el.tagName}.${className}`);
        }
      });

      return issues;
    });
    console.log('Layout issues:', overlaps);

    // Report findings
    const report = {
      title,
      consoleErrors: errors,
      navigationCount: nav,
      layoutIssues: overlaps,
      url: page.url()
    };

    console.log('=== UI REVIEW REPORT ===');
    console.log(JSON.stringify(report, null, 2));
  });

  test('should check responsive design', async ({ page }) => {
    const sizes = [
      { width: 375, height: 667, name: 'Mobile' },
      { width: 768, height: 1024, name: 'Tablet' },
      { width: 1920, height: 1080, name: 'Desktop' }
    ];

    for (const size of sizes) {
      await page.setViewportSize({ width: size.width, height: size.height });
      await page.goto('https://fleet.capitaltechalliance.com');
      await page.waitForLoadState('networkidle');

      await page.screenshot({
        path: `/tmp/fleet-${size.name.toLowerCase()}.png`,
        fullPage: true
      });

      console.log(`${size.name} (${size.width}x${size.height}): Screenshot saved`);
    }
  });
});
