/**
 * Playwright Test - Verify CTAFleet Application is Running
 */
const { chromium } = require('playwright');

async function testApp() {
  console.log('🎭 Starting Playwright Test for CTAFleet\n');
  console.log('=' .repeat(70));

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
  const page = await context.newPage();

  const results = {
    serverStatus: {},
    pageTests: [],
    screenshots: [],
    errors: []
  };

  try {
    // Test 1: Check API Server
    console.log('\n📡 Test 1: API Server Health Check');
    console.log('-'.repeat(70));
    try {
      const apiResponse = await fetch('http://localhost:3001/api/health');
      const apiHealth = await apiResponse.json();
      results.serverStatus.api = {
        status: apiResponse.ok ? 'RUNNING ✅' : 'ERROR ❌',
        port: 3001,
        response: apiHealth
      };
      console.log(`  API Server: ${results.serverStatus.api.status}`);
      console.log(`  Port: ${results.serverStatus.api.port}`);
      console.log(`  Health: ${JSON.stringify(apiHealth).substring(0, 100)}...`);
    } catch (error) {
      results.serverStatus.api = { status: 'OFFLINE ❌', error: error.message };
      console.log(`  API Server: OFFLINE ❌`);
      console.log(`  Error: ${error.message}`);
    }

    // Test 2: Check Frontend Server
    console.log('\n🌐 Test 2: Frontend Server Check');
    console.log('-'.repeat(70));
    let frontendUrl = null;
    for (const port of [5173, 5180, 5174]) {
      try {
        const response = await fetch(`http://localhost:${port}`);
        if (response.ok) {
          frontendUrl = `http://localhost:${port}`;
          results.serverStatus.frontend = { status: 'RUNNING ✅', port, url: frontendUrl };
          console.log(`  Frontend Server: RUNNING ✅`);
          console.log(`  Port: ${port}`);
          console.log(`  URL: ${frontendUrl}`);
          break;
        }
      } catch (e) {
        // Try next port
      }
    }

    if (!frontendUrl) {
      results.serverStatus.frontend = { status: 'OFFLINE ❌' };
      console.log(`  Frontend Server: OFFLINE ❌`);
      throw new Error('Frontend server not running on any expected port');
    }

    // Test 3: Load Dashboard Page
    console.log('\n📄 Test 3: Loading Dashboard Page');
    console.log('-'.repeat(70));
    await page.goto(frontendUrl, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(2000);

    const title = await page.title();
    console.log(`  Page Title: "${title}"`);

    // Take screenshot
    const screenshotPath = '/tmp/ctafleet-dashboard-test.png';
    await page.screenshot({ path: screenshotPath, fullPage: false });
    results.screenshots.push(screenshotPath);
    console.log(`  Screenshot: ${screenshotPath}`);

    // Test 4: Check for Critical Elements
    console.log('\n🔍 Test 4: Checking Critical UI Elements');
    console.log('-'.repeat(70));

    const checks = {
      header: await page.locator('header').count() > 0,
      sidebar: await page.locator('[aria-label*="sidebar" i]').count() > 0 ||
               await page.locator('nav').count() > 0,
      mainContent: await page.locator('main, [role="main"]').count() > 0 ||
                   await page.locator('#root').count() > 0,
      ctaBranding: await page.locator('text=/CTA|ArchonY/i').count() > 0
    };

    console.log(`  Header exists: ${checks.header ? '✅' : '❌'}`);
    console.log(`  Sidebar exists: ${checks.sidebar ? '✅' : '❌'}`);
    console.log(`  Main content exists: ${checks.mainContent ? '✅' : '❌'}`);
    console.log(`  CTA Branding visible: ${checks.ctaBranding ? '✅' : '❌'}`);

    results.pageTests.push({ name: 'Dashboard', url: frontendUrl, checks, pass: Object.values(checks).every(v => v) });

    // Test 5: Check Console Errors
    console.log('\n📋 Test 5: Console Errors Check');
    console.log('-'.repeat(70));
    const consoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    await page.waitForTimeout(2000);
    console.log(`  Console Errors: ${consoleErrors.length === 0 ? '✅ None' : `❌ ${consoleErrors.length} errors`}`);
    if (consoleErrors.length > 0) {
      consoleErrors.slice(0, 3).forEach(err => console.log(`    - ${err.substring(0, 100)}`));
    }

    // Test 6: Check Page Readability
    console.log('\n👁️  Test 6: Readability Check');
    console.log('-'.repeat(70));
    const textElements = await page.$$eval('*', elements => {
      const texts = [];
      elements.forEach(el => {
        const style = window.getComputedStyle(el);
        if (el.textContent && el.textContent.trim() && style.fontSize) {
          const fontSize = parseFloat(style.fontSize);
          if (fontSize < 12 && el.textContent.length > 5) {
            texts.push({
              text: el.textContent.trim().substring(0, 50),
              fontSize: fontSize,
              element: el.tagName
            });
          }
        }
      });
      return texts.slice(0, 5);
    });

    console.log(`  Text elements < 12px: ${textElements.length === 0 ? '✅ None found' : `⚠️  ${textElements.length} found`}`);
    textElements.forEach(t => {
      console.log(`    - ${t.fontSize}px: "${t.text}"`);
    });

  } catch (error) {
    console.log(`\n❌ ERROR: ${error.message}`);
    results.errors.push(error.message);
    await page.screenshot({ path: '/tmp/ctafleet-error.png' });
  } finally {
    await browser.close();
  }

  // Summary
  console.log('\n' + '='.repeat(70));
  console.log('📊 TEST SUMMARY');
  console.log('='.repeat(70));
  console.log(`API Server: ${results.serverStatus.api?.status || 'NOT TESTED'}`);
  console.log(`Frontend Server: ${results.serverStatus.frontend?.status || 'NOT TESTED'}`);
  console.log(`Page Tests: ${results.pageTests.length > 0 && results.pageTests[0].pass ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Errors: ${results.errors.length === 0 ? '✅ None' : `❌ ${results.errors.length}`}`);
  console.log(`Screenshots: ${results.screenshots.join(', ')}`);
  console.log('='.repeat(70));

  if (results.serverStatus.frontend?.url) {
    console.log(`\n🌐 Open in browser: ${results.serverStatus.frontend.url}`);
  }

  return results;
}

testApp().catch(console.error);
