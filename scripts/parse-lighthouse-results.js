#!/usr/bin/env node

/**
 * Parse Lighthouse Results
 * Extracts key metrics from Lighthouse JSON report and outputs markdown
 */

const fs = require('fs');
const path = require('path');

const reportPath = path.join(process.cwd(), '.lighthouse', 'report-latest.json');

if (!fs.existsSync(reportPath)) {
  console.log('No Lighthouse report found');
  process.exit(0);
}

try {
  const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
  const audits = report.audits || {};
  const categories = report.categories || {};

  // Score mapping
  const scores = {
    Performance: Math.round((categories.performance?.score || 0) * 100),
    Accessibility: Math.round((categories.accessibility?.score || 0) * 100),
    'Best Practices': Math.round((categories['best-practices']?.score || 0) * 100),
    SEO: Math.round((categories.seo?.score || 0) * 100),
  };

  // Core Web Vitals
  const cwv = {
    LCP: formatMetric(audits['largest-contentful-paint']?.numericValue, 'ms'),
    FID: formatMetric(audits['first-input-delay']?.numericValue, 'ms'),
    CLS: formatMetric(audits['cumulative-layout-shift']?.numericValue, ''),
    FCP: formatMetric(audits['first-contentful-paint']?.numericValue, 'ms'),
    TTI: formatMetric(audits['interactive']?.numericValue, 'ms'),
    TBT: formatMetric(audits['total-blocking-time']?.numericValue, 'ms'),
    SI: formatMetric(audits['speed-index']?.numericValue, 'ms'),
  };

  // Output as markdown table
  console.log('### Performance Scores\n');
  console.log('| Category | Score |');
  console.log('|----------|-------|');

  Object.entries(scores).forEach(([category, score]) => {
    const emoji = getScoreEmoji(score);
    console.log(`| ${emoji} ${category} | ${score} |`);
  });

  console.log('\n### Core Web Vitals\n');
  console.log('| Metric | Value |');
  console.log('|--------|-------|');

  Object.entries(cwv).forEach(([metric, value]) => {
    console.log(`| ${metric} | ${value} |`);
  });

  // Opportunities and diagnostics
  console.log('\n### Opportunities for Improvement\n');

  const opportunities = Object.entries(audits)
    .filter(([_, audit]) => audit.score === 0 && audit.details?.type === 'opportunity')
    .slice(0, 5)
    .map(([_, audit]) => audit.title);

  if (opportunities.length > 0) {
    opportunities.forEach(title => {
      console.log(`- ${title}`);
    });
  } else {
    console.log('No major opportunities found!');
  }

  // Diagnostics
  console.log('\n### Diagnostics\n');

  const diagnostics = Object.entries(audits)
    .filter(([_, audit]) => audit.score < 0.5 && audit.details?.type === 'diagnostic')
    .slice(0, 5)
    .map(([_, audit]) => audit.title);

  if (diagnostics.length > 0) {
    diagnostics.forEach(title => {
      console.log(`- ${title}`);
    });
  } else {
    console.log('No major diagnostics issues found!');
  }

} catch (error) {
  console.error('Error parsing Lighthouse results:', error.message);
  process.exit(1);
}

function getScoreEmoji(score) {
  if (score >= 90) return '🟢';
  if (score >= 80) return '🟡';
  return '🔴';
}

function formatMetric(value, unit) {
  if (value === undefined || value === null) {
    return 'N/A';
  }
  return `${Math.round(value * 10) / 10}${unit}`;
}
