const { chromium } = require('playwright');

async function testEnvVars() {
  console.log('🔍 Checking Environment Variables\n');

  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  await page.goto('http://localhost:5180');
  await page.waitForTimeout(2000);

  const envCheck = await page.evaluate(() => {
    return {
      viteGoogleMapsKey: typeof import.meta !== 'undefined' ? 'import.meta available' : 'import.meta NOT available',
      windowEnv: typeof (window as any)._env_ !== 'undefined' ? 'window._env_ available' : 'window._env_ NOT available',
      processEnv: typeof process !== 'undefined' ? 'process available' : 'process NOT available',
      // Check if VITE variables are in window object
      windowKeys: Object.keys(window).filter(k => k.includes('VITE') || k.includes('MAP')),
    };
  });

  console.log('Environment Check:');
  console.log(JSON.stringify(envCheck, null, 2));

  await browser.close();
}

testEnvVars();
