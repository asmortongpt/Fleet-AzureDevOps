const { chromium } = require('playwright');

async function checkMapErrors() {
  console.log('🔍 Checking Map Loading Errors\n');

  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  const consoleMessages = [];
  const networkErrors = [];

  // Capture console messages
  page.on('console', msg => {
    const text = msg.text();
    consoleMessages.push({ type: msg.type(), text });
    if (msg.type() === 'error' || msg.type() === 'warning') {
      console.log(`[${msg.type().toUpperCase()}] ${text}`);
    }
  });

  // Capture network failures
  page.on('requestfailed', request => {
    networkErrors.push({
      url: request.url(),
      error: request.failure()?.errorText
    });
    console.log(`[NETWORK FAILED] ${request.url()}`);
    console.log(`  Error: ${request.failure()?.errorText}`);
  });

  try {
    console.log('Loading dashboard...\n');
    await page.goto('http://localhost:5180', { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(5000);

    // Check if Google Maps script loaded
    const googleMapsLoaded = await page.evaluate(() => {
      return typeof window.google !== 'undefined' && typeof window.google.maps !== 'undefined';
    });

    console.log(`\n📊 Results:`);
    console.log(`Google Maps API loaded: ${googleMapsLoaded ? '✅' : '❌'}`);
    console.log(`Total console messages: ${consoleMessages.length}`);
    console.log(`Errors: ${consoleMessages.filter(m => m.type === 'error').length}`);
    console.log(`Warnings: ${consoleMessages.filter(m => m.type === 'warning').length}`);
    console.log(`Network failures: ${networkErrors.length}`);

    if (!googleMapsLoaded) {
      console.log('\n⚠️  Google Maps API DID NOT LOAD');
      console.log('Checking for API key issues...\n');

      // Check environment variable
      const apiKeyInPage = await page.evaluate(() => {
        return document.documentElement.innerHTML.includes('AIzaSy');
      });
      console.log(`API key present in page: ${apiKeyInPage ? '✅' : '❌'}`);
    }

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await browser.close();
  }
}

checkMapErrors();
