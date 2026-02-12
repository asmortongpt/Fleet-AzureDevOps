/**
 * Accessibility Fix Verification Script
 * Verifies that source code fixes eliminated the violations identified in certification
 */
const { chromium } = require('playwright');

async function verifyAccessibilityFixes() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
  const page = await context.newPage();

  console.log('🔍 Verifying accessibility fixes...\n');

  const pages = [
    { id: 'dashboard', url: 'http://localhost:5173/' },
    { id: 'fleet-hub', url: 'http://localhost:5173/fleet' },
    { id: 'drivers-hub', url: 'http://localhost:5173/drivers' },
    { id: 'compliance-hub', url: 'http://localhost:5173/compliance' },
    { id: 'maintenance-hub', url: 'http://localhost:5173/maintenance' },
    { id: 'analytics-hub', url: 'http://localhost:5173/analytics' },
    { id: 'charging-hub', url: 'http://localhost:5173/charging' },
  ];

  const results = [];

  for (const testPage of pages) {
    console.log(`Testing: ${testPage.id}...`);
    await page.goto(testPage.url, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(2000);

    // Inject axe-core
    await page.evaluate(`
      var script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/axe-core/4.7.2/axe.min.js';
      document.head.appendChild(script);
    `);
    await page.waitForTimeout(2000);

    // Run axe scan
    const axeResults = await page.evaluate(async () => {
      const results = await axe.run();
      return {
        violations: results.violations.length,
        passes: results.passes.length,
        details: results.violations.map(v => ({
          id: v.id,
          impact: v.impact,
          description: v.description,
          help: v.help,
          nodes: v.nodes.length,
          selectors: v.nodes.slice(0, 3).map(n => n.target.join(' '))
        }))
      };
    });

    const score = Math.max(0, 1000 - (axeResults.violations * 50));
    const status = score >= 1000 ? '✅ PASS' : score >= 900 ? '⚠️  WARN' : '❌ FAIL';

    results.push({
      page: testPage.id,
      violations: axeResults.violations,
      passes: axeResults.passes,
      score,
      status,
      details: axeResults.details
    });

    console.log(`  Violations: ${axeResults.violations}, Passes: ${axeResults.passes}, Score: ${score}/1000 ${status}`);
    if (axeResults.details.length > 0) {
      axeResults.details.forEach(v => {
        console.log(`    - ${v.id} (${v.impact}): ${v.nodes} nodes`);
        console.log(`      Selectors: ${v.selectors.join(', ')}`);
      });
    }
    console.log('');
  }

  await browser.close();

  // Summary
  console.log('\n📊 Summary:');
  console.log('='.repeat(60));
  const passing = results.filter(r => r.score >= 1000).length;
  const warnings = results.filter(r => r.score >= 900 && r.score < 1000).length;
  const failing = results.filter(r => r.score < 900).length;
  console.log(`✅ PASS (1000): ${passing}/7`);
  console.log(`⚠️  WARN (900-999): ${warnings}/7`);
  console.log(`❌ FAIL (<900): ${failing}/7`);
  console.log('='.repeat(60));

  // Comparison with previous run
  console.log('\n📈 Comparison with previous certification (Feb 1, 22:42):');
  console.log('Before fixes: 6 pages @ 900 (989 weighted), 1 page @ 850 (984 weighted)');
  console.log(`After fixes:  ${results.filter(r => r.score === 1000).length} pages @ 1000, ${results.filter(r => r.score === 900).length} pages @ 900`);

  const improved = results.every(r => r.violations <= 2);
  if (improved && passing >= 6) {
    console.log('\n🎉 IMPROVEMENTS CONFIRMED! Most/all violations eliminated.');
  } else if (warnings === 7) {
    console.log('\n⚠️  No improvement detected - violations persist despite source fixes.');
  }

  return results;
}

verifyAccessibilityFixes().catch(console.error);
