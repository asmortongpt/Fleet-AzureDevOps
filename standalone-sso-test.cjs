const { chromium } = require('playwright');

async function testSSO() {
  console.log('🚀 Starting comprehensive SSO test...\n');

  const browser = await chromium.launch({
    headless: false, // Visual mode
    slowMo: 1000 // Slow down so we can see
  });

  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });

  const page = await context.newPage();

  // Track console messages
  const consoleMessages = [];
  page.on('console', msg => {
    const logEntry = {
      type: msg.type(),
      text: msg.text()
    };
    consoleMessages.push(logEntry);

    if (msg.type() === 'error') {
      console.log(`❌ Console Error: ${msg.text()}`);
    }
  });

  const environments = [
    {
      name: 'gray-flower (Azure SWA)',
      url: 'https://gray-flower-03a2a730f.3.azurestaticapps.net'
    },
    {
      name: 'fleet.capitaltechalliance.com (Custom Domain)',
      url: 'https://fleet.capitaltechalliance.com'
    }
  ];

  const results = [];

  for (const env of environments) {
    console.log(`\n${'='.repeat(80)}`);
    console.log(`Testing: ${env.name}`);
    console.log(`URL: ${env.url}`);
    console.log(`${'='.repeat(80)}\n`);

    const envResults = {
      name: env.name,
      url: env.url,
      tests: {}
    };

    try {
      // Test 1: Site loads
      console.log('📝 Test 1: Site loads without errors...');
      await page.goto(env.url, { waitUntil: 'networkidle', timeout: 30000 });
      await page.waitForTimeout(3000);

      const initialErrors = consoleMessages.filter(m => m.type === 'error');
      envResults.tests.siteLoads = {
        pass: initialErrors.length === 0,
        errors: initialErrors.length
      };

      console.log(`✅ Site loaded. Console errors: ${initialErrors.length}\n`);

      // Test 2: Check build hash
      console.log('📝 Test 2: Verify correct build deployed...');
      const content = await page.content();
      const buildHashMatch = content.match(/index-([a-zA-Z0-9_-]+)\.js/);

      if (buildHashMatch) {
        const buildHash = buildHashMatch[0];
        console.log(`   Build hash: ${buildHash}`);
        envResults.tests.buildHash = {
          pass: buildHash === 'index-kULKLFxD.js',
          actual: buildHash,
          expected: 'index-kULKLFxD.js'
        };

        if (buildHash === 'index-kULKLFxD.js') {
          console.log('   ✅ Correct build deployed!\n');
        } else {
          console.log('   ⚠️  Unexpected build hash\n');
        }
      } else {
        console.log('   ❌ Could not find build hash\n');
        envResults.tests.buildHash = { pass: false };
      }

      // Test 3: Check for infinite re-render errors
      console.log('📝 Test 3: Check for infinite re-render errors...');
      const reRenderErrors = consoleMessages.filter(m =>
        m.text.includes('Maximum update depth') || m.text.includes('Too many re-renders')
      );

      envResults.tests.noInfiniteReRender = {
        pass: reRenderErrors.length === 0,
        errors: reRenderErrors.length
      };

      if (reRenderErrors.length === 0) {
        console.log('   ✅ No infinite re-render errors\n');
      } else {
        console.log(`   ❌ Found ${reRenderErrors.length} re-render errors\n`);
      }

      // Test 4: Take screenshot
      console.log('📝 Test 4: Taking screenshot...');
      const screenshotPath = `/tmp/sso-test-${env.name.replace(/\s+/g, '-').replace(/[()]/g, '')}.png`;
      await page.screenshot({
        path: screenshotPath,
        fullPage: true
      });
      console.log(`   📸 Screenshot saved: ${screenshotPath}\n`);
      envResults.tests.screenshot = { path: screenshotPath };

      // Test 5: Find login UI
      console.log('📝 Test 5: Looking for login UI elements...');

      // Check for various login-related elements
      const loginSelectors = [
        'button:has-text("Microsoft")',
        'button:has-text("Sign in")',
        'button:has-text("Login")',
        'a:has-text("Sign in")',
        'a:has-text("Login")',
        '[data-testid="microsoft-login"]',
        '[data-testid="login"]'
      ];

      let foundLoginButton = false;
      let usedSelector = '';

      for (const selector of loginSelectors) {
        const count = await page.locator(selector).count();
        if (count > 0) {
          try {
            const isVisible = await page.locator(selector).first().isVisible();
            if (isVisible) {
              foundLoginButton = true;
              usedSelector = selector;
              const text = await page.locator(selector).first().textContent();
              console.log(`   ✅ Found login element: "${text}" (selector: ${selector})\n`);
              break;
            }
          } catch (e) {
            // Continue to next selector
          }
        }
      }

      if (!foundLoginButton) {
        console.log('   ⚠️  Login button not immediately visible');
        console.log('   📋 Listing all buttons on page:');

        const allButtons = await page.locator('button').all();
        for (let i = 0; i < Math.min(allButtons.length, 15); i++) {
          try {
            const text = await allButtons[i].textContent();
            const isVisible = await allButtons[i].isVisible();
            console.log(`      ${i + 1}. "${text?.trim()}" ${isVisible ? '(visible)' : '(hidden)'}`);
          } catch (e) {
            // Skip if error
          }
        }
        console.log('');
      }

      envResults.tests.loginButton = {
        pass: foundLoginButton,
        selector: usedSelector
      };

      // Test 6: Attempt to trigger Microsoft login
      console.log('📝 Test 6: Testing Microsoft SSO redirect...');

      if (foundLoginButton && usedSelector) {
        try {
          console.log(`   🔘 Clicking login button: ${usedSelector}`);

          // Start waiting for navigation before clicking
          const navigationPromise = page.waitForURL(
            /login\.microsoftonline\.com|login\.live\.com/,
            { timeout: 20000 }
          ).catch(() => null);

          await page.locator(usedSelector).first().click();
          await navigationPromise;

          const currentUrl = page.url();
          console.log(`   📍 Current URL: ${currentUrl}`);

          if (currentUrl.includes('microsoftonline.com') || currentUrl.includes('live.com')) {
            console.log('   ✅ Successfully redirected to Microsoft login!\n');

            // Take screenshot of Microsoft login page
            await page.screenshot({
              path: `/tmp/sso-test-${env.name.replace(/\s+/g, '-').replace(/[()]/g, '')}-microsoft-login.png`
            });

            // Check redirect URI
            try {
              const url = new URL(currentUrl);
              const redirectUri = url.searchParams.get('redirect_uri');

              if (redirectUri) {
                console.log(`   📌 Redirect URI: ${redirectUri}`);

                if (redirectUri.includes('/auth/callback')) {
                  console.log('   ✅ Redirect URI is correct!\n');
                  envResults.tests.ssoRedirect = {
                    pass: true,
                    redirectUri: redirectUri
                  };
                } else {
                  console.log('   ⚠️  Redirect URI may be incorrect\n');
                  envResults.tests.ssoRedirect = {
                    pass: false,
                    redirectUri: redirectUri,
                    issue: 'Missing /auth/callback'
                  };
                }
              }
            } catch (e) {
              console.log('   Could not parse redirect URI from URL\n');
            }

            // Navigate back for next test
            await page.goto(env.url);
            await page.waitForLoadState('networkidle');
          } else {
            console.log(`   ⚠️  Did not redirect to Microsoft. Still on: ${currentUrl}\n`);
            envResults.tests.ssoRedirect = {
              pass: false,
              currentUrl: currentUrl
            };
          }
        } catch (error) {
          console.log(`   ❌ Error during SSO test: ${error.message}\n`);
          envResults.tests.ssoRedirect = {
            pass: false,
            error: error.message
          };
        }
      } else {
        console.log('   ⏭️  Skipping SSO redirect test (no login button found)\n');
        envResults.tests.ssoRedirect = { pass: false, reason: 'No login button found' };
      }

      // Test 7: Wait and observe for stability
      console.log('📝 Test 7: Observing page for 10 seconds (checking stability)...');
      await page.waitForTimeout(10000);

      const finalErrors = consoleMessages.filter(m =>
        m.type === 'error' &&
        (m.text.includes('Maximum update depth') || m.text.includes('Failed'))
      );

      envResults.tests.stability = {
        pass: finalErrors.length === 0,
        errors: finalErrors.length
      };

      if (finalErrors.length === 0) {
        console.log('   ✅ Page is stable, no new errors\n');
      } else {
        console.log(`   ⚠️  Found ${finalErrors.length} errors during observation\n`);
      }

      results.push(envResults);

    } catch (error) {
      console.log(`\n❌ Fatal error testing ${env.name}: ${error.message}\n`);
      envResults.error = error.message;
      results.push(envResults);
    }

    // Clear console messages for next environment
    consoleMessages.length = 0;
  }

  // Print summary
  console.log('\n' + '='.repeat(80));
  console.log('SUMMARY');
  console.log('='.repeat(80) + '\n');

  for (const result of results) {
    console.log(`${result.name}:`);
    console.log(`  URL: ${result.url}`);

    if (result.error) {
      console.log(`  ❌ Fatal Error: ${result.error}`);
    } else {
      for (const [testName, testResult] of Object.entries(result.tests)) {
        const status = testResult.pass ? '✅' : '❌';
        console.log(`  ${status} ${testName}`);
      }
    }
    console.log('');
  }

  console.log('='.repeat(80));
  console.log('\n✅ Test execution complete!');
  console.log('\nScreenshots saved in /tmp/');
  console.log('\n🔍 Browser window will remain open for 30 seconds for visual inspection...');

  await page.waitForTimeout(30000);

  await browser.close();

  // Write results to file
  const fs = require('fs');
  fs.writeFileSync('/tmp/sso-test-results.json', JSON.stringify(results, null, 2));
  console.log('\n📄 Test results saved to: /tmp/sso-test-results.json');
}

// Run the test
testSSO().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
