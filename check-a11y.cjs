const { chromium } = require('@playwright/test');
const { AxeBuilder } = require('@axe-core/playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto('http://localhost:5174', { waitUntil: 'networkidle' });

  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze();

  console.log('\n=== ACCESSIBILITY VIOLATIONS ===\n');
  console.log(`Total violations: ${results.violations.length}\n`);

  results.violations.forEach((violation, i) => {
    console.log(`${i + 1}. ${violation.id}: ${violation.description}`);
    console.log(`   Impact: ${violation.impact}`);
    console.log(`   Help: ${violation.helpUrl}`);
    console.log(`   Affected elements (${violation.nodes.length}):`);
    violation.nodes.forEach((node, j) => {
      console.log(`     ${j + 1}. ${node.html.substring(0, 150)}...`);
      console.log(`        Target: ${node.target.join(' > ')}`);
    });
    console.log('');
  });

  await browser.close();
  process.exit(results.violations.length);
})();
