/**
 * SSO PRODUCTION VERIFICATION - BOTH URLs
 * Tests P0 blocker: SSO must work on gray-flower AND fleet.capitaltechalliance.com
 */

import { chromium } from 'playwright';

const URLS_TO_TEST = [
  {
    name: 'Azure Static Web App (Direct)',
    url: 'https://gray-flower-03a2a730f.3.azurestaticapps.net'
  },
  {
    name: 'Custom Domain',
    url: 'https://fleet.capitaltechalliance.com'
  }
];

(async () => {
  console.log('\n🧪 SSO PRODUCTION VERIFICATION - BOTH URLs\n');
  console.log('═'.repeat(80));

  const browser = await chromium.launch({ headless: false, slowMo: 300 });
  const results = [];

  for (const site of URLS_TO_TEST) {
    console.log(`\n📍 Testing: ${site.name}`);
    console.log(`   URL: ${site.url}/login`);
    console.log('─'.repeat(80));

    const page = await browser.newPage();
    const testResult = {
      name: site.name,
      url: site.url,
      pageLoads: false,
      ssoButtonVisible: false,
      redirectsToMicrosoft: false,
      oauthParamsCorrect: false,
      error: null
    };

    try {
      // Navigate to login page
      const response = await page.goto(`${site.url}/login`, { waitUntil: 'networkidle', timeout: 30000 });
      testResult.pageLoads = response?.status() === 200;
      console.log(`   ✅ Page loaded: HTTP ${response?.status()}`);

      // Check for SSO button
      const ssoButton = page.getByRole('button', { name: /sign in with microsoft/i });
      testResult.ssoButtonVisible = await ssoButton.isVisible().catch(() => false);
      console.log(`   ${testResult.ssoButtonVisible ? '✅' : '❌'} Microsoft SSO button visible: ${testResult.ssoButtonVisible}`);

      if (testResult.ssoButtonVisible) {
        // Click SSO button and wait for redirect
        const [redirectPage] = await Promise.all([
          page.waitForEvent('popup', { timeout: 10000 }).catch(() => null),
          ssoButton.click()
        ]);

        // If no popup, check if current page redirected
        const targetPage = redirectPage || page;
        await targetPage.waitForLoadState('domcontentloaded', { timeout: 10000 }).catch(() => {});

        const finalUrl = targetPage.url();
        testResult.redirectsToMicrosoft = finalUrl.includes('login.microsoftonline.com');
        console.log(`   ${testResult.redirectsToMicrosoft ? '✅' : '❌'} Redirected to Microsoft: ${testResult.redirectsToMicrosoft}`);

        if (testResult.redirectsToMicrosoft) {
          // Verify OAuth parameters
          const urlObj = new URL(finalUrl);
          const clientId = urlObj.searchParams.get('client_id');
          const responseType = urlObj.searchParams.get('response_type');
          const redirectUri = urlObj.searchParams.get('redirect_uri');

          testResult.oauthParamsCorrect =
            clientId === 'baae0851-0c24-4214-8587-e3fabc46bd4a' &&
            responseType === 'code' &&
            redirectUri?.includes('auth/callback');

          console.log(`   ${testResult.oauthParamsCorrect ? '✅' : '❌'} OAuth parameters correct`);
          console.log(`      client_id: ${clientId?.substring(0, 20)}...`);
          console.log(`      redirect_uri: ${redirectUri}`);
        }

        if (redirectPage) await redirectPage.close();
      }

      await page.screenshot({ path: `/tmp/sso-${site.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}.png`, fullPage: true });
      console.log(`   📸 Screenshot: /tmp/sso-${site.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}.png`);

    } catch (error) {
      testResult.error = error.message;
      console.log(`   ❌ Error: ${error.message}`);
    }

    await page.close();
    results.push(testResult);
  }

  // Summary
  console.log('\n' + '═'.repeat(80));
  console.log('📊 SSO TEST RESULTS SUMMARY');
  console.log('═'.repeat(80));

  console.log('\n╔════════════════════════════════════╦═══════════════╦═══════════════╗');
  console.log('║ Test                               ║ Azure Direct  ║ Custom Domain ║');
  console.log('╠════════════════════════════════════╬═══════════════╬═══════════════╣');
  console.log(`║ Page loads (HTTP 200)              ║ ${results[0].pageLoads ? '✅ YES        ' : '❌ NO         '}║ ${results[1].pageLoads ? '✅ YES        ' : '❌ NO         '}║`);
  console.log(`║ Microsoft SSO button visible       ║ ${results[0].ssoButtonVisible ? '✅ YES        ' : '❌ NO         '}║ ${results[1].ssoButtonVisible ? '✅ YES        ' : '❌ NO         '}║`);
  console.log(`║ Redirects to Microsoft login       ║ ${results[0].redirectsToMicrosoft ? '✅ YES        ' : '❌ NO         '}║ ${results[1].redirectsToMicrosoft ? '✅ YES        ' : '❌ NO         '}║`);
  console.log(`║ OAuth parameters correct           ║ ${results[0].oauthParamsCorrect ? '✅ YES        ' : '❌ NO         '}║ ${results[1].oauthParamsCorrect ? '✅ YES        ' : '❌ NO         '}║`);
  console.log('╚════════════════════════════════════╩═══════════════╩═══════════════╝');

  const allPass = results.every(r =>
    r.pageLoads && r.ssoButtonVisible && r.redirectsToMicrosoft && r.oauthParamsCorrect
  );

  console.log(`\n${allPass ? '✅ P0 BLOCKER CLEARED' : '❌ P0 BLOCKER FAILED'}: SSO works on ${allPass ? 'BOTH' : 'some'} production URLs`);
  console.log('   - gray-flower-03a2a730f.3.azurestaticapps.net: ' + (results[0].oauthParamsCorrect ? '✅ WORKING' : '❌ FAILED'));
  console.log('   - fleet.capitaltechalliance.com: ' + (results[1].oauthParamsCorrect ? '✅ WORKING' : '❌ FAILED'));
  console.log('═'.repeat(80));

  console.log('\n⏸️  Browser will close in 10 seconds...');
  await new Promise(r => setTimeout(r, 10000));

  await browser.close();
  process.exit(allPass ? 0 : 1);
})();
