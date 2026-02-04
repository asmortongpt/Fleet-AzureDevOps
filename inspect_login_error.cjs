const { chromium } = require('playwright');

async function inspectLoginError() {
  console.log('🔍 Inspecting Login Flow and Errors\n');
  console.log('=' .repeat(70));

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    ignoreHTTPSErrors: true
  });
  const page = await context.newPage();

  // Capture console messages and errors
  const consoleMessages = [];
  const errors = [];

  page.on('console', msg => {
    consoleMessages.push(`[${msg.type()}] ${msg.text()}`);
  });

  page.on('pageerror', error => {
    errors.push(error.message);
  });

  try {
    // Step 1: Navigate to app
    console.log('\n📍 Step 1: Navigating to http://localhost:5173...');
    await page.goto('http://localhost:5173', { waitUntil: 'domcontentloaded', timeout: 10000 });
    await page.waitForTimeout(2000);

    const step1Screenshot = '/tmp/login-step-1-initial.png';
    await page.screenshot({ path: step1Screenshot, fullPage: true });
    console.log(`✅ Screenshot: ${step1Screenshot}`);
    console.log(`   Current URL: ${page.url()}`);

    // Step 2: Check if redirected to Microsoft login
    if (page.url().includes('login.microsoftonline.com')) {
      console.log('\n📍 Step 2: Redirected to Azure AD login');
      await page.waitForTimeout(2000);

      const step2Screenshot = '/tmp/login-step-2-azure-ad.png';
      await page.screenshot({ path: step2Screenshot, fullPage: true });
      console.log(`✅ Screenshot: ${step2Screenshot}`);

      // Check for any visible errors on Microsoft login page
      const errorSelectors = [
        '[role="alert"]',
        '.error-message',
        '.alert-error',
        '#error',
        '[data-bind*="error"]',
        '.has-error'
      ];

      console.log('\n🔍 Checking for error messages...');
      for (const selector of errorSelectors) {
        const errorElements = await page.locator(selector).all();
        if (errorElements.length > 0) {
          for (const elem of errorElements) {
            const text = await elem.textContent();
            if (text && text.trim()) {
              console.log(`⚠️  Error found (${selector}): ${text.trim()}`);
            }
          }
        }
      }

      // Get any visible text that might indicate an error
      const bodyText = await page.textContent('body');
      if (bodyText.toLowerCase().includes('error') ||
          bodyText.toLowerCase().includes('invalid') ||
          bodyText.toLowerCase().includes('fail')) {
        console.log('\n⚠️  Page contains error-related text:');
        const lines = bodyText.split('\n').filter(l => {
          const lower = l.toLowerCase();
          return (lower.includes('error') || lower.includes('invalid') || lower.includes('fail'))
                 && l.trim().length > 0;
        });
        lines.slice(0, 10).forEach(line => {
          console.log(`   ${line.trim()}`);
        });
      }

      console.log('\n📋 Login form details:');
      const emailInput = await page.locator('input[type="email"]').count();
      const passwordInput = await page.locator('input[type="password"]').count();
      const submitButton = await page.locator('input[type="submit"], button[type="submit"]').count();

      console.log(`   Email field: ${emailInput > 0 ? '✅ Found' : '❌ Not found'}`);
      console.log(`   Password field: ${passwordInput > 0 ? '✅ Found' : '❌ Not found'}`);
      console.log(`   Submit button: ${submitButton > 0 ? '✅ Found' : '❌ Not found'}`);

    } else if (page.url().includes('localhost:5173')) {
      console.log('\n✅ Step 2: No redirect - already on app (possible auth token exists)');

      const step2Screenshot = '/tmp/login-step-2-app.png';
      await page.screenshot({ path: step2Screenshot, fullPage: true });
      console.log(`✅ Screenshot: ${step2Screenshot}`);

      // Check if we're seeing the actual app or an error
      const hasError = await page.locator('.error, [role="alert"], .alert-error').count();
      if (hasError > 0) {
        const errorText = await page.locator('.error, [role="alert"], .alert-error').first().textContent();
        console.log(`⚠️  Error visible on app: ${errorText}`);
      }

      const hasContent = await page.locator('header, nav, h1, main').count();
      console.log(`   App content visible: ${hasContent > 0 ? '✅ Yes' : '❌ No'}`);
    }

    // Step 3: Check auth callback if it occurs
    console.log('\n📍 Step 3: Waiting for potential auth callback...');
    await page.waitForTimeout(5000);

    if (page.url().includes('/auth/callback')) {
      console.log('✅ Auth callback detected');
      const step3Screenshot = '/tmp/login-step-3-callback.png';
      await page.screenshot({ path: step3Screenshot, fullPage: true });
      console.log(`✅ Screenshot: ${step3Screenshot}`);
      console.log(`   Callback URL: ${page.url()}`);
    }

    const finalScreenshot = '/tmp/login-step-final.png';
    await page.screenshot({ path: finalScreenshot, fullPage: true });
    console.log(`\n✅ Final screenshot: ${finalScreenshot}`);
    console.log(`   Final URL: ${page.url()}`);

    // Report console messages
    if (consoleMessages.length > 0) {
      console.log('\n📜 Console Messages:');
      consoleMessages.slice(-10).forEach((msg, i) => {
        console.log(`   ${i + 1}. ${msg}`);
      });
    }

    // Report errors
    if (errors.length > 0) {
      console.log('\n❌ JavaScript Errors:');
      errors.forEach((err, i) => {
        console.log(`   ${i + 1}. ${err}`);
      });
    }

    console.log('\n' + '='.repeat(70));
    console.log('\n✅ Inspection complete');
    console.log('\nKeeping browser open for 60 seconds for manual inspection...');
    await page.waitForTimeout(60000);

  } catch (error) {
    console.error(`\n❌ Error during inspection: ${error.message}`);

    // Take error screenshot
    try {
      const errorScreenshot = '/tmp/login-error.png';
      await page.screenshot({ path: errorScreenshot, fullPage: true });
      console.log(`📸 Error screenshot: ${errorScreenshot}`);
    } catch (e) {
      console.error('Could not capture error screenshot');
    }
  } finally {
    await browser.close();
  }
}

inspectLoginError().catch(console.error);
