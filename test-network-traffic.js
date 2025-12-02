import { chromium } from 'playwright';

(async () => {
  const PRODUCTION_URL = 'https://fleet.capitaltechalliance.com';

  console.log('🚀 Launching Chromium browser...');
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  const page = await context.newPage();

  // Track all network activity
  const apiRequests = [];
  const apiResponses = [];
  const failedRequests = [];

  page.on('request', request => {
    const url = request.url();
    if (url.includes('/api/')) {
      const requestInfo = {
        method: request.method(),
        url: url,
        headers: request.headers(),
        timestamp: new Date().toISOString()
      };
      apiRequests.push(requestInfo);
      console.log(`📤 API Request: ${request.method()} ${url}`);
    }
  });

  page.on('response', async response => {
    const url = response.url();
    if (url.includes('/api/')) {
      let body = null;
      try {
        const contentType = response.headers()['content-type'] || '';
        if (contentType.includes('application/json')) {
          body = await response.json();
        } else {
          body = await response.text();
        }
      } catch (e) {
        body = `[Could not parse body: ${e.message}]`;
      }

      const responseInfo = {
        status: response.status(),
        statusText: response.statusText(),
        url: url,
        headers: response.headers(),
        body: body,
        timestamp: new Date().toISOString()
      };
      apiResponses.push(responseInfo);

      const emoji = response.status() >= 200 && response.status() < 300 ? '✅' : '❌';
      console.log(`${emoji} API Response: ${response.status()} ${url}`);
    }
  });

  page.on('requestfailed', request => {
    const url = request.url();
    if (url.includes('/api/')) {
      const failureInfo = {
        url: url,
        failure: request.failure(),
        timestamp: new Date().toISOString()
      };
      failedRequests.push(failureInfo);
      console.error(`❌ Failed Request: ${url} - ${request.failure().errorText}`);
    }
  });

  console.log(`📡 Navigating to ${PRODUCTION_URL}...`);
  await page.goto(PRODUCTION_URL, { waitUntil: 'networkidle', timeout: 60000 });

  console.log('⏳ Waiting for content to load and API calls to complete...');
  await page.waitForTimeout(5000);

  console.log('📸 Taking screenshot...');
  await page.screenshot({
    path: '/tmp/fleet-network-test.png',
    fullPage: true
  });

  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('🌐 NETWORK TRAFFIC ANALYSIS');
  console.log('═══════════════════════════════════════════════════════════\n');

  console.log(`📊 Total API Requests: ${apiRequests.length}`);
  console.log(`📊 Total API Responses: ${apiResponses.length}`);
  console.log(`❌ Failed Requests: ${failedRequests.length}\n`);

  if (apiRequests.length === 0) {
    console.log('⚠️  WARNING: No API requests detected!');
    console.log('This suggests the frontend is NOT calling the backend API.');
    console.log('The dashboard may be showing static/hardcoded data.\n');
  }

  if (failedRequests.length > 0) {
    console.log('🔴 FAILED REQUESTS:');
    failedRequests.forEach((req, i) => {
      console.log(`  ${i + 1}. ${req.url}`);
      console.log(`     Error: ${req.failure.errorText}`);
    });
    console.log('');
  }

  if (apiRequests.length > 0) {
    console.log('📋 API REQUESTS MADE:');
    apiRequests.forEach((req, i) => {
      console.log(`  ${i + 1}. ${req.method} ${req.url}`);
    });
    console.log('');
  }

  if (apiResponses.length > 0) {
    console.log('📋 API RESPONSES RECEIVED:');
    apiResponses.forEach((res, i) => {
      console.log(`  ${i + 1}. ${res.status} ${res.statusText} - ${res.url}`);
      if (res.body && typeof res.body === 'object') {
        console.log(`     Body: ${JSON.stringify(res.body).substring(0, 200)}...`);
      }
    });
    console.log('');
  }

  // Check what the frontend thinks its API URL is
  const apiConfig = await page.evaluate(() => {
    // Check various possible API configuration locations
    const checks = {
      windowVars: {
        VITE_API_URL: window.VITE_API_URL,
        API_URL: window.API_URL,
        REACT_APP_API_URL: window.REACT_APP_API_URL
      },
      metaTags: Array.from(document.querySelectorAll('meta[name*="api"]')).map(m => ({
        name: m.getAttribute('name'),
        content: m.getAttribute('content')
      })),
      localStorage: Object.keys(localStorage).filter(k => k.toLowerCase().includes('api')).map(k => ({
        key: k,
        value: localStorage.getItem(k)
      }))
    };
    return checks;
  });

  console.log('🔍 FRONTEND API CONFIGURATION:');
  console.log(JSON.stringify(apiConfig, null, 2));
  console.log('');

  console.log('✅ Screenshot saved to: /tmp/fleet-network-test.png');

  const verdict = apiRequests.length === 0
    ? '❌ FRONTEND NOT CALLING API (Static Data)'
    : failedRequests.length > 0
      ? '⚠️  API CALLS FAILING'
      : '✅ API CONNECTIVITY OK';

  console.log(`\n🎯 VERDICT: ${verdict}`);

  await browser.close();
  console.log('✅ Test complete!');
})();
