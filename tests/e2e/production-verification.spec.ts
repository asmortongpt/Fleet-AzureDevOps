import { test, expect } from '@playwright/test';

test.use({
  contextOptions: {
    ignoreHTTPSErrors: false
  }
});

test.describe('Production Deployment Verification', () => {
  test('Production site loads without white screen', async ({ browser }) => {
    console.log('\n=== STARTING PRODUCTION VERIFICATION ===\n');

    const context = await browser.newContext();
    const page = await context.newPage();

    const errors = [];
    const warnings = [];
    const networkErrors = [];

    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
        console.error('Browser Error:', msg.text());
      } else if (msg.type() === 'warning') {
        warnings.push(msg.text());
      }
    });

    page.on('pageerror', error => {
      const errorMsg = 'PAGE ERROR: ' + error.message;
      errors.push(errorMsg);
      console.error(errorMsg);
    });

    page.on('requestfailed', request => {
      const failureText = request.failure() ? request.failure().errorText : 'Unknown';
      const failMsg = 'FAILED REQUEST: ' + request.url() + ' - ' + failureText;
      networkErrors.push(failMsg);
      console.error(failMsg);
    });

    console.log('Navigating to https://fleet.capitaltechalliance.com...');

    const response = await page.goto('https://fleet.capitaltechalliance.com', {
      waitUntil: 'networkidle',
      timeout: 60000
    });

    console.log('Response status: ' + response?.status());
    expect(response?.status()).toBe(200);

    await page.waitForTimeout(5000);

    const rootAnalysis = await page.evaluate(() => {
      const root = document.getElementById('root');
      const body = document.body;

      return {
        exists: !!root,
        hasChildren: root ? root.children.length > 0 : false,
        childCount: root ? root.children.length : 0,
        innerHTML: root ? root.innerHTML.substring(0, 500) : '',
        bodyText: body.innerText.substring(0, 300),
        bodyBackgroundColor: window.getComputedStyle(body).backgroundColor,
        hasWhiteScreen: body.innerText.trim().length === 0
      };
    });

    console.log('\n=== ROOT ELEMENT ANALYSIS ===');
    console.log('Root exists:', rootAnalysis.exists);
    console.log('Has children:', rootAnalysis.hasChildren);
    console.log('Child count:', rootAnalysis.childCount);
    console.log('Body background:', rootAnalysis.bodyBackgroundColor);
    console.log('Has white screen:', rootAnalysis.hasWhiteScreen);
    console.log('Body text preview:', rootAnalysis.bodyText);
    console.log('HTML preview:', rootAnalysis.innerHTML);

    console.log('\n=== ERROR SUMMARY ===');
    console.log('JavaScript errors:', errors.length);
    console.log('Network failures:', networkErrors.length);
    console.log('Warnings:', warnings.length);

    if (errors.length > 0) {
      console.log('\n=== JAVASCRIPT ERRORS ===');
      errors.forEach((err, idx) => console.log((idx + 1) + '. ' + err));
    }

    if (networkErrors.length > 0) {
      console.log('\n=== NETWORK ERRORS ===');
      networkErrors.forEach((err, idx) => console.log((idx + 1) + '. ' + err));
    }

    await page.screenshot({
      path: 'test-results/production-verification.png',
      fullPage: true
    });
    console.log('\nScreenshot saved to test-results/production-verification.png');

    expect(rootAnalysis.exists, 'Root element should exist').toBe(true);
    expect(rootAnalysis.hasChildren, 'Root should have children').toBe(true);
    expect(rootAnalysis.childCount, 'Root should have at least 1 child').toBeGreaterThan(0);
    expect(rootAnalysis.hasWhiteScreen, 'Should not be a white screen').toBe(false);

    console.log('\n=== TEST PASSED ===');
    console.log('✅ Production site loads correctly');
    console.log('✅ React app mounted successfully');
    console.log('✅ Content visible in DOM');
    console.log('✅ No white screen detected');

    await context.close();
  });

  test('Check bundle files load correctly', async ({ page }) => {
    console.log('\n=== CHECKING BUNDLE FILES ===\n');

    const bundleChecks = [
      'https://fleet.capitaltechalliance.com/assets/js/index-BCpoTbnw.js',
      'https://fleet.capitaltechalliance.com/assets/css/index-HOHb1uoF.css'
    ];

    for (const url of bundleChecks) {
      console.log('Checking: ' + url);
      const response = await page.goto(url);
      const status = response?.status() || 0;
      console.log('Status: ' + status);
      expect(status).toBe(200);
    }

    console.log('\n✅ All bundle files load correctly');
  });
});
