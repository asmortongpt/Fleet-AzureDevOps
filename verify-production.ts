#!/usr/bin/env tsx
import { chromium } from 'playwright';

const PRODUCTION_URL = 'https://fleet.capitaltechalliance.com';

const PAGES = [
  { path: '/', name: 'Homepage' },
  { path: '/fleet', name: 'Fleet Hub' },
  { path: '/operations', name: 'Operations Hub' },
  { path: '/maintenance', name: 'Maintenance Hub' },
  { path: '/drivers', name: 'Drivers Hub' },
  { path: '/safety', name: 'Safety Hub' },
  { path: '/analytics', name: 'Analytics Hub' },
  { path: '/compliance', name: 'Compliance Hub' },
  { path: '/procurement', name: 'Procurement Hub' },
  { path: '/assets', name: 'Assets Hub' },
];

async function verifyProduction() {
  console.log('\n🚀 Fleet Production Verification\n');
  console.log(`Target: ${PRODUCTION_URL}\n`);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    ignoreHTTPSErrors: true
  });

  let totalPassed = 0;
  let totalFailed = 0;

  for (const pageInfo of PAGES) {
    const page = await context.newPage();
    const url = `${PRODUCTION_URL}${pageInfo.path}`;

    try {
      console.log(`📄 Testing: ${pageInfo.name}`);
      console.log(`   URL: ${url}`);

      const response = await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });

      if (!response || response.status() !== 200) {
        console.log(`   ❌ FAIL: HTTP ${response?.status()}`);
        totalFailed++;
        await page.close();
        continue;
      }

      await page.waitForTimeout(3000);

      const bodyText = await page.textContent('body');
      const buttons = await page.locator('button').count();
      const links = await page.locator('a').count();

      const hasMaps = await page.evaluate(() => {
        return typeof (window as any).google !== 'undefined';
      });

      const envConfig = await page.evaluate(() => {
        return (window as any)._env_;
      });

      console.log(`   ✅ HTTP 200 OK`);
      console.log(`   📝 Content: ${bodyText?.length || 0} chars`);
      console.log(`   🔘 Elements: ${buttons} buttons, ${links} links`);
      console.log(`   🗺️ Google Maps: ${hasMaps ? 'Loaded' : 'Not loaded'}`);
      console.log(`   ⚙️ Env Config: ${envConfig ? 'Present' : 'Missing'}`);

      if (envConfig?.VITE_GOOGLE_MAPS_API_KEY) {
        console.log(`   🔑 Maps API Key: ${envConfig.VITE_GOOGLE_MAPS_API_KEY.substring(0, 20)}...`);
      }

      await page.screenshot({
        path: `/tmp/prod-${pageInfo.name.toLowerCase().replace(/\s+/g, '-')}.png`,
        fullPage: false
      });

      totalPassed++;
      console.log('');

    } catch (error) {
      console.log(`   ❌ FAIL: ${error.message}`);
      totalFailed++;
      console.log('');
    } finally {
      await page.close();
    }
  }

  // Test API endpoints
  console.log('🔌 Testing API Endpoints\n');

  const apiEndpoints = [
    '/api/health',
    '/api/v1/vehicles',
    '/api/v1/drivers',
  ];

  for (const endpoint of apiEndpoints) {
    try {
      const response = await fetch(`${PRODUCTION_URL}${endpoint}`);
      console.log(`   ${endpoint}: HTTP ${response.status} ${response.ok ? '✅' : '❌'}`);

      if (response.ok) {
        const data = await response.json();
        console.log(`      Response: ${JSON.stringify(data).substring(0, 100)}...`);
      }
    } catch (error) {
      console.log(`   ${endpoint}: ❌ ${error.message}`);
    }
  }

  await browser.close();

  console.log('\n📊 Summary\n');
  console.log(`   ✅ Passed: ${totalPassed}`);
  console.log(`   ❌ Failed: ${totalFailed}`);
  console.log(`   📁 Screenshots: /tmp/prod-*.png\n`);

  process.exit(totalFailed > 0 ? 1 : 0);
}

verifyProduction().catch(console.error);
