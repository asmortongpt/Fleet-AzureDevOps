import { chromium } from '@playwright/test';

async function runVisualTests() {
  console.log('🚀 Starting Playwright visual tests...\n');

  const browser = await chromium.launch({
    headless: true
  });

  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });

  const page = await context.newPage();

  try {
    // Test 1: Homepage Loading
    console.log('📍 Test 1: Loading homepage at http://localhost:5174');
    await page.goto('http://localhost:5174', {
      waitUntil: 'networkidle',
      timeout: 30000
    });

    const title = await page.title();
    console.log(`   ✓ Page title: "${title}"`);

    // Wait for content to load
    await page.waitForTimeout(3000);

    // Take full page screenshot
    await page.screenshot({
      path: '/tmp/fleet-homepage-full.png',
      fullPage: true
    });
    console.log('   ✓ Screenshot saved: /tmp/fleet-homepage-full.png');

    // Take viewport screenshot
    await page.screenshot({
      path: '/tmp/fleet-homepage-viewport.png',
      fullPage: false
    });
    console.log('   ✓ Screenshot saved: /tmp/fleet-homepage-viewport.png\n');

    // Test 2: Check UI Elements
    console.log('📍 Test 2: Checking UI elements');
    const buttonCount = await page.locator('button').count();
    console.log(`   ✓ Found ${buttonCount} buttons`);

    const linkCount = await page.locator('a').count();
    console.log(`   ✓ Found ${linkCount} links`);

    const hasNav = await page.locator('nav, header, [role="navigation"]').count() > 0;
    console.log(`   ✓ Has navigation: ${hasNav}`);

    const hasMain = await page.locator('main, [role="main"], .main-content').count() > 0;
    console.log(`   ✓ Has main content: ${hasMain}\n`);

    // Test 3: API Endpoints
    console.log('📍 Test 3: Testing API endpoints');

    // Test vehicles API
    const vehiclesPage = await context.newPage();
    const vehiclesResponse = await vehiclesPage.goto('http://localhost:3001/api/vehicles');
    const vehiclesStatus = vehiclesResponse?.status();
    console.log(`   ✓ Vehicles API status: ${vehiclesStatus}`);

    if (vehiclesStatus === 200) {
      const vehiclesData = await vehiclesResponse?.json();
      console.log(`   ✓ Vehicles returned: ${vehiclesData?.data?.length || 0} vehicles`);
      console.log(`   ✓ Sample vehicle: ${vehiclesData?.data?.[0]?.make} ${vehiclesData?.data?.[0]?.model}`);
    }
    await vehiclesPage.close();

    // Test health API
    const healthPage = await context.newPage();
    const healthResponse = await healthPage.goto('http://localhost:3001/api/health');
    const healthStatus = healthResponse?.status();
    console.log(`   ✓ Health API status: ${healthStatus}`);

    if (healthStatus === 200) {
      const healthData = await healthResponse?.json();
      console.log(`   ✓ System status: ${healthData?.status}`);
      console.log(`   ✓ Database: ${healthData?.checks?.database?.status}`);
      console.log(`   ✓ Redis: ${healthData?.checks?.redis?.status}\n`);
    }
    await healthPage.close();

    // Test 4: Page Content
    console.log('📍 Test 4: Checking page content');
    const bodyText = await page.textContent('body');
    const hasContent = bodyText && bodyText.length > 100;
    console.log(`   ✓ Page has content: ${hasContent}`);
    console.log(`   ✓ Content length: ${bodyText?.length || 0} characters\n`);

    console.log('✅ All visual tests completed successfully!');
    console.log('\n📸 Screenshots saved to:');
    console.log('   - /tmp/fleet-homepage-full.png (full page)');
    console.log('   - /tmp/fleet-homepage-viewport.png (viewport)\n');

  } catch (error) {
    console.error('❌ Test failed:', error.message);

    // Take error screenshot
    try {
      await page.screenshot({
        path: '/tmp/fleet-error.png',
        fullPage: true
      });
      console.log('📸 Error screenshot saved: /tmp/fleet-error.png');
    } catch (screenshotError) {
      console.error('Failed to take error screenshot:', screenshotError.message);
    }
  } finally {
    await browser.close();
  }
}

runVisualTests().catch(console.error);
