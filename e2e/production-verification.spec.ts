import { test, expect, Page } from '@playwright/test';

const PRODUCTION_URL = 'https://fleet.capitaltechalliance.com';

test.describe('Production Deployment Verification', () => {
  let consoleErrors: string[] = [];
  let consoleWarnings: string[] = [];
  let pageErrors: Error[] = [];

  test.beforeEach(async ({ page }) => {
    consoleErrors = [];
    consoleWarnings = [];
    pageErrors = [];

    // Capture console errors
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      } else if (msg.type() === 'warning') {
        consoleWarnings.push(msg.text());
      }
    });

    // Capture page errors
    page.on('pageerror', error => {
      pageErrors.push(error);
    });
  });

  test('should load production URL without errors', async ({ page }) => {
    const response = await page.goto(PRODUCTION_URL, {
      waitUntil: 'networkidle',
      timeout: 30000
    });

    // Check HTTP status
    expect(response?.status()).toBe(200);
    console.log('✓ Production URL returns HTTP 200');

    // Wait for root element
    await page.waitForSelector('#root', { timeout: 10000 });
    console.log('✓ Root element found');

    // Take screenshot
    await page.screenshot({
      path: 'test-results/production-screenshot.png',
      fullPage: true
    });
    console.log('✓ Screenshot captured');
  });

  test('should verify NO React.Children errors', async ({ page }) => {
    await page.goto(PRODUCTION_URL, {
      waitUntil: 'networkidle',
      timeout: 30000
    });

    // Wait a bit for React to initialize
    await page.waitForTimeout(3000);

    const reactChildrenErrors = consoleErrors.filter(
      error => error.includes('React.Children') || error.includes('Children')
    );

    console.log('\n=== React.Children Error Check ===');
    if (reactChildrenErrors.length > 0) {
      console.log('❌ Found React.Children errors:');
      reactChildrenErrors.forEach(err => console.log('  -', err));
    } else {
      console.log('✓ NO React.Children errors found');
    }

    expect(reactChildrenErrors.length).toBe(0);
  });

  test('should verify NO spark framework errors', async ({ page }) => {
    await page.goto(PRODUCTION_URL, {
      waitUntil: 'networkidle',
      timeout: 30000
    });

    await page.waitForTimeout(3000);

    const sparkErrors = consoleErrors.filter(
      error => error.toLowerCase().includes('spark')
    );

    console.log('\n=== Spark Framework Error Check ===');
    if (sparkErrors.length > 0) {
      console.log('❌ Found spark framework errors:');
      sparkErrors.forEach(err => console.log('  -', err));
    } else {
      console.log('✓ NO spark framework errors found');
    }

    expect(sparkErrors.length).toBe(0);
  });

  test('should verify NO useAuth provider errors', async ({ page }) => {
    await page.goto(PRODUCTION_URL, {
      waitUntil: 'networkidle',
      timeout: 30000
    });

    await page.waitForTimeout(3000);

    const authErrors = consoleErrors.filter(
      error => error.includes('useAuth') || error.includes('AuthProvider')
    );

    console.log('\n=== useAuth Provider Error Check ===');
    if (authErrors.length > 0) {
      console.log('❌ Found useAuth/AuthProvider errors:');
      authErrors.forEach(err => console.log('  -', err));
    } else {
      console.log('✓ NO useAuth/AuthProvider errors found');
    }

    expect(authErrors.length).toBe(0);
  });

  test('should verify application loads properly (no white screen)', async ({ page }) => {
    await page.goto(PRODUCTION_URL, {
      waitUntil: 'networkidle',
      timeout: 30000
    });

    // Check if the root element has content
    const rootElement = await page.locator('#root');
    await expect(rootElement).toBeVisible();

    // Check if there's actual content rendered
    const rootContent = await rootElement.innerHTML();
    expect(rootContent.length).toBeGreaterThan(100);

    console.log('\n=== Application Load Check ===');
    console.log('✓ Application loaded successfully');
    console.log(`✓ Root content length: ${rootContent.length} characters`);

    // Check for common UI elements
    const hasNavigation = await page.locator('nav').count() > 0;
    const hasButtons = await page.locator('button').count() > 0;
    const hasDivs = await page.locator('div').count() > 10;

    console.log(`✓ Has navigation: ${hasNavigation}`);
    console.log(`✓ Has buttons: ${hasButtons}`);
    console.log(`✓ Has content divs: ${hasDivs}`);

    expect(hasDivs).toBe(true);
  });

  test('should test basic functionality', async ({ page }) => {
    await page.goto(PRODUCTION_URL, {
      waitUntil: 'networkidle',
      timeout: 30000
    });

    await page.waitForTimeout(2000);

    console.log('\n=== Basic Functionality Test ===');

    // Check for interactive elements
    const buttons = await page.locator('button').count();
    const links = await page.locator('a').count();
    const inputs = await page.locator('input').count();

    console.log(`✓ Found ${buttons} buttons`);
    console.log(`✓ Found ${links} links`);
    console.log(`✓ Found ${inputs} input fields`);

    // Try to interact with the page
    if (buttons > 0) {
      const firstButton = page.locator('button').first();
      const isVisible = await firstButton.isVisible();
      console.log(`✓ First button is visible: ${isVisible}`);
    }

    expect(buttons + links + inputs).toBeGreaterThan(0);
  });

  test('should display all console errors and warnings', async ({ page }) => {
    await page.goto(PRODUCTION_URL, {
      waitUntil: 'networkidle',
      timeout: 30000
    });

    await page.waitForTimeout(5000);

    console.log('\n=== COMPLETE ERROR REPORT ===');
    console.log('\n--- Console Errors ---');
    if (consoleErrors.length > 0) {
      consoleErrors.forEach((error, i) => {
        console.log(`${i + 1}. ${error}`);
      });
    } else {
      console.log('✓ NO console errors found');
    }

    console.log('\n--- Console Warnings ---');
    if (consoleWarnings.length > 0) {
      consoleWarnings.forEach((warning, i) => {
        console.log(`${i + 1}. ${warning}`);
      });
    } else {
      console.log('✓ NO console warnings found');
    }

    console.log('\n--- Page Errors ---');
    if (pageErrors.length > 0) {
      pageErrors.forEach((error, i) => {
        console.log(`${i + 1}. ${error.message}`);
        console.log(`   Stack: ${error.stack}`);
      });
    } else {
      console.log('✓ NO page errors found');
    }

    console.log('\n=== END OF REPORT ===\n');
  });

  test.afterAll(async () => {
    console.log('\n=== FINAL SUMMARY ===');
    console.log(`Total Console Errors: ${consoleErrors.length}`);
    console.log(`Total Console Warnings: ${consoleWarnings.length}`);
    console.log(`Total Page Errors: ${pageErrors.length}`);
    console.log('===================\n');
  });
});
