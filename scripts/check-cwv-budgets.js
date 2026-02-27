#!/usr/bin/env node

/**
 * Check Core Web Vitals Budgets
 * Validates that Core Web Vitals metrics meet targets
 */

const fs = require('fs');
const path = require('path');

const CWV_BUDGETS = {
  'first-contentful-paint': 2500,    // 2.5 seconds
  'largest-contentful-paint': 4000,  // 4 seconds
  'cumulative-layout-shift': 0.1,    // 0.1
  'first-input-delay': 300,          // 300 ms
  'total-blocking-time': 300,        // 300 ms
  'speed-index': 4000,               // 4 seconds
  'time-to-interactive': 5000,       // 5 seconds
};

const reportPath = path.join(process.cwd(), '.lighthouse', 'report-latest.json');

if (!fs.existsSync(reportPath)) {
  console.log('⚠️  Lighthouse report not found');
  process.exit(0);
}

try {
  const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
  const audits = report.audits || {};

  console.log('📊 Core Web Vitals Budget Check\n');

  let hasExceeded = false;

  Object.entries(CWV_BUDGETS).forEach(([metric, budget]) => {
    const audit = audits[metric];
    if (!audit) {
      console.log(`⚠️  ${metric}: Not found in report`);
      return;
    }

    const value = audit.numericValue;
    const unit = metric === 'cumulative-layout-shift' ? '' : 'ms';
    let exceeded = false;

    if (metric === 'cumulative-layout-shift') {
      exceeded = value > budget;
    } else {
      exceeded = value > budget;
    }

    if (exceeded) hasExceeded = true;

    const status = exceeded ? '❌' : '✅';
    const displayValue = typeof value === 'number' ? value.toFixed(value < 10 ? 3 : 0) : 'N/A';
    const displayBudget = typeof budget === 'number' ? budget.toFixed(budget < 10 ? 3 : 0) : 'N/A';

    console.log(`${status} ${metric}`);
    console.log(`   Current: ${displayValue}${unit}`);
    console.log(`   Budget: ${displayBudget}${unit}`);
    console.log(`   Status: ${exceeded ? '⚠️  EXCEEDED' : '✅ OK'}\n`);
  });

  if (hasExceeded) {
    console.log('⚠️  Some Core Web Vitals exceeded budgets!');
    console.log('Recommendations:');
    console.log('  - Profile your app using Chrome DevTools');
    console.log('  - Identify JavaScript causing long tasks (>50ms)');
    console.log('  - Optimize images and consider lazy loading');
    console.log('  - Reduce CSS blocking time with critical CSS inlining');
    console.log('  - Consider code splitting for large bundles');
    process.exit(0);
  } else {
    console.log('✅ All Core Web Vitals are within budget!');
    process.exit(0);
  }

} catch (error) {
  console.error('Error parsing Lighthouse report:', error.message);
  process.exit(0);
}
