import { chromium } from 'playwright';

const PRODUCTION_URL = 'https://gray-flower-03a2a730f.3.azurestaticapps.net';

(async () => {
  console.log('\n🔍 SSO VISUAL TEST - Production\n');
  console.log('═'.repeat(60));

  const browser = await chromium.launch({
    headless: false,
    slowMo: 1000
  });
  const context = await browser.newContext();
  const page = await context.newPage();

  const cspViolations = [];
  const consoleErrors = [];

  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('CSP') || text.includes('Content Security Policy') || text.includes('violates')) {
      cspViolations.push(text);
    }
    if (msg.type() === 'error') {
      consoleErrors.push(text);
    }
  });

  try {
    console.log(`\n📍 Step 1: Navigate to ${PRODUCTION_URL}/login`);
    const response = await page.goto(`${PRODUCTION_URL}/login`, { waitUntil: 'networkidle' });

    const headers = response.headers();
    const csp = headers['content-security-policy'];

    console.log(`\n📋 Response Status: ${response.status()}`);
    console.log(`📋 CSP Header Present: ${csp ? 'YES' : 'NO'}`);
    if (csp) {
      const hasUnsafeInline = csp.includes("'unsafe-inline'");
      console.log(`📋 Has 'unsafe-inline': ${hasUnsafeInline ? '✅ YES' : '❌ NO'}`);
    }

    console.log(`\n📍 Step 2: Check for page elements`);

    const title = await page.title();
    console.log(`   Page title: ${title}`);

    const branding = await page.getByText('Capital Tech Alliance').isVisible().catch(() => false);
    console.log(`   ✅ Branding visible: ${branding}`);

    const microsoftBtn = page.getByRole('button', { name: /sign in with microsoft/i });
    const btnVisible = await microsoftBtn.isVisible().catch(() => false);
    console.log(`   ✅ Microsoft SSO button visible: ${btnVisible}`);

    await page.screenshot({ path: '/tmp/sso-login-page.png', fullPage: true });
    console.log(`\n📸 Screenshot saved: /tmp/sso-login-page.png`);

    console.log(`\n📍 Step 3: Click Microsoft SSO button`);

    const navigationPromise = page.waitForNavigation({ timeout: 10000 }).catch(() => null);
    await microsoftBtn.click().catch(e => console.log(`   ⚠️  Click failed: ${e.message}`));

    await new Promise(r => setTimeout(r, 3000));

    const currentUrl = page.url();
    console.log(`   Current URL: ${currentUrl}`);

    if (currentUrl.includes('login.microsoftonline.com')) {
      console.log(`   ✅ Redirected to Microsoft login`);
      await page.screenshot({ path: '/tmp/sso-microsoft-page.png', fullPage: true });
      console.log(`   📸 Screenshot saved: /tmp/sso-microsoft-page.png`);
    } else if (currentUrl.includes('/auth/callback')) {
      console.log(`   ✅ Redirected to callback`);
    } else {
      console.log(`   ⚠️  No redirect detected`);
    }

    console.log(`\n═`.repeat(60));
    console.log('📊 SUMMARY');
    console.log(`═`.repeat(60));
    console.log(`CSP Violations: ${cspViolations.length}`);
    if (cspViolations.length > 0) {
      cspViolations.forEach((v, i) => console.log(`  ${i + 1}. ${v.substring(0, 100)}...`));
    }
    console.log(`Console Errors: ${consoleErrors.length}`);
    if (consoleErrors.length > 0) {
      consoleErrors.slice(0, 5).forEach((e, i) => console.log(`  ${i + 1}. ${e.substring(0, 100)}...`));
    }
    console.log(`═`.repeat(60));

    console.log(`\n⏸️  Browser will close in 10 seconds...`);
    await new Promise(r => setTimeout(r, 10000));

  } catch (error) {
    console.error(`\n❌ Error: ${error.message}`);
    await page.screenshot({ path: '/tmp/sso-error.png', fullPage: true });
  } finally {
    await browser.close();
  }
})();
