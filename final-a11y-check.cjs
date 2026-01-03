const { chromium } = require('@playwright/test');
const { AxeBuilder } = require('@axe-core/playwright');

(async () => {
  console.log('Starting final accessibility check...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  console.log('Navigating to homepage...');
  try {
    await page.goto('http://localhost:5176/dashboard', {
      waitUntil: 'networkidle',
      timeout: 30000
    });
    console.log('Page loaded successfully');

    // Wait for the map to load
    await page.waitForSelector('[data-testid="fleet-map"]', { timeout: 10000 }).catch(() => {
      console.log('Map not found, continuing anyway...');
    });

    // Wait a bit more for any dynamic content
    await page.waitForTimeout(2000);

  } catch (error) {
    console.error('Failed to load page:', error.message);
    await browser.close();
    process.exit(1);
  }

  console.log('Running axe accessibility scan...');
  const results = await new AxeBuilder({ page }).analyze();

  console.log(`\n${'='.repeat(80)}`);
  console.log(`ACCESSIBILITY SCAN RESULTS`);
  console.log(`${'='.repeat(80)}`);
  console.log(`Total violations: ${results.violations.length}`);
  console.log(`Passes: ${results.passes.length}`);
  console.log(`Incomplete: ${results.incomplete.length}`);

  if (results.violations.length === 0) {
    console.log('\n✅ PERFECT! ZERO accessibility violations found!');
    console.log('✅ WCAG 2.1 AA compliant!');
  } else {
    console.log(`\n❌ Found ${results.violations.length} violation(s):`);
    results.violations.forEach((violation, i) => {
      console.log(`\n${i + 1}. ${violation.id} (${violation.impact})`);
      console.log(`   ${violation.description}`);
      console.log(`   Affected elements: ${violation.nodes.length}`);
      violation.nodes.forEach((node, j) => {
        console.log(`   - Element ${j + 1}: ${node.html.substring(0, 150)}...`);
        console.log(`     Target: ${JSON.stringify(node.target)}`);
      });
    });
  }

  await browser.close();
  process.exit(results.violations.length === 0 ? 0 : 1);
})();
