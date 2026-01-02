import puppeteer from 'puppeteer';

const routes = [
  { path: '/analytics', name: 'Analytics' },
  { path: '/fleet', name: 'Fleet Dashboard' },
  { path: '/compliance', name: 'Compliance' }
];

(async () => {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const results = [];

  for (const route of routes) {
    const page = await browser.newPage();
    const errors = [];

    page.on('pageerror', error => {
      errors.push(error.message);
    });

    try {
      console.log(`\n📍 Testing ${route.name} (${route.path})...`);
      await page.goto(`http://localhost:5175${route.path}`, {
        waitUntil: 'networkidle2',
        timeout: 15000
      });

      await new Promise(resolve => setTimeout(resolve, 2000));

      const pageContent = await page.evaluate(() => document.body.innerText);
      const hasErrorBoundary = pageContent.toLowerCase().includes('something went wrong') ||
                               pageContent.toLowerCase().includes('error boundary');

      results.push({
        route: route.name,
        path: route.path,
        success: !hasErrorBoundary && errors.length === 0,
        errorCount: errors.length,
        errors: errors.slice(0, 3) // First 3 errors only
      });

      if (!hasErrorBoundary && errors.length === 0) {
        console.log(`   ✅ ${route.name} loaded successfully`);
      } else {
        console.log(`   ❌ ${route.name} has errors`);
        if (hasErrorBoundary) console.log(`      - Error boundary detected`);
        if (errors.length > 0) console.log(`      - ${errors.length} page errors`);
      }

    } catch (e) {
      console.log(`   ❌ ${route.name} failed to load: ${e.message}`);
      results.push({
        route: route.name,
        path: route.path,
        success: false,
        errorCount: 1,
        errors: [e.message]
      });
    }

    await page.close();
  }

  await browser.close();

  console.log('\n' + '='.repeat(60));
  console.log('FINAL TEST RESULTS');
  console.log('='.repeat(60));

  const passed = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;

  results.forEach(r => {
    const status = r.success ? '✅ PASS' : '❌ FAIL';
    console.log(`${status} - ${r.route} (${r.path})`);
    if (!r.success && r.errors.length > 0) {
      console.log(`   Errors: ${r.errors.join(', ')}`);
    }
  });

  console.log('\n' + '='.repeat(60));
  console.log(`Summary: ${passed} passed, ${failed} failed out of ${results.length} routes`);
  console.log('='.repeat(60));

  process.exit(failed > 0 ? 1 : 0);
})();
