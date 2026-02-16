#!/usr/bin/env node

/**
 * Generate Performance Trends
 * Generates trend analysis from historical Lighthouse metrics
 */

const fs = require('fs');
const path = require('path');

const historyDir = path.join(process.cwd(), '.lighthouse', 'history');
const csvPath = path.join(historyDir, 'metrics-history.csv');
const reportPath = path.join(historyDir, 'trends-report.md');

if (!fs.existsSync(csvPath)) {
  console.log('No metrics history found');
  process.exit(0);
}

try {
  const csvContent = fs.readFileSync(csvPath, 'utf8');
  const lines = csvContent.trim().split('\n');
  const headers = lines[0].split(',');

  if (lines.length < 2) {
    console.log('Insufficient data for trend analysis');
    process.exit(0);
  }

  const rows = lines.slice(1).map(line => {
    const values = line.split(',');
    const entry = {};
    headers.forEach((header, i) => {
      entry[header] = values[i];
    });
    return entry;
  });

  // Calculate trends
  const latest = rows[rows.length - 1];
  const previous = rows.length > 1 ? rows[rows.length - 2] : null;

  const metrics = [
    { name: 'Performance', key: 'performance', unit: '%' },
    { name: 'Accessibility', key: 'accessibility', unit: '%' },
    { name: 'Best Practices', key: 'bestPractices', unit: '%' },
    { name: 'SEO', key: 'seo', unit: '%' },
    { name: 'LCP', key: 'lcp', unit: 'ms' },
    { name: 'FCP', key: 'fcp', unit: 'ms' },
    { name: 'TBT', key: 'tbt', unit: 'ms' },
    { name: 'CLS', key: 'cls', unit: '' },
  ];

  // Generate report
  let report = '# Performance Trends Report\n\n';
  report += `Generated: ${new Date().toISOString()}\n\n`;

  report += '## Latest Metrics\n\n';
  report += '| Metric | Current | Change | Trend |\n';
  report += '|--------|---------|--------|-------|\n';

  metrics.forEach(metric => {
    const currentValue = latest[metric.key];
    const previousValue = previous ? previous[metric.key] : null;

    let changeStr = 'N/A';
    let trendEmoji = '➡️';

    if (previousValue !== null && previousValue !== undefined) {
      const current = parseFloat(currentValue);
      const prev = parseFloat(previousValue);
      const change = current - prev;

      if (metric.unit === '%' || metric.name.includes('Performance') || metric.name.includes('Accessibility')) {
        // Higher is better
        if (change > 0) {
          trendEmoji = '📈';
          changeStr = `+${change.toFixed(1)}`;
        } else if (change < 0) {
          trendEmoji = '📉';
          changeStr = `${change.toFixed(1)}`;
        }
      } else {
        // Lower is better
        if (change < 0) {
          trendEmoji = '📈';
          changeStr = `${change.toFixed(1)}`;
        } else if (change > 0) {
          trendEmoji = '📉';
          changeStr = `+${change.toFixed(1)}`;
        }
      }
    }

    const displayValue = `${currentValue}${metric.unit}`;
    report += `| ${metric.name} | ${displayValue} | ${changeStr} | ${trendEmoji} |\n`;
  });

  // Historical data (last 10 records)
  report += '\n## Historical Data (Last 10 Runs)\n\n';
  report += '| Date | Branch | Performance | Accessibility | Best Practices | SEO |\n';
  report += '|------|--------|-------------|----------------|----------------|-----|\n';

  const recentRows = rows.slice(-10);
  recentRows.forEach(row => {
    const date = row.timestamp?.split('T')[0] || 'Unknown';
    const branch = row.branch?.substring(0, 20) || 'Unknown';
    const perf = row.performance || '—';
    const a11y = row.accessibility || '—';
    const bp = row.bestPractices || '—';
    const seo = row.seo || '—';

    report += `| ${date} | ${branch} | ${perf} | ${a11y} | ${bp} | ${seo} |\n`;
  });

  // Statistics
  report += '\n## Statistics\n\n';

  const perfValues = rows.map(r => parseFloat(r.performance)).filter(v => !isNaN(v));
  const a11yValues = rows.map(r => parseFloat(r.accessibility)).filter(v => !isNaN(v));
  const bpValues = rows.map(r => parseFloat(r.bestPractices)).filter(v => !isNaN(v));
  const seoValues = rows.map(r => parseFloat(r.seo)).filter(v => !isNaN(v));

  report += `### Performance Score\n`;
  report += `- Average: ${(perfValues.reduce((a, b) => a + b) / perfValues.length).toFixed(1)}\n`;
  report += `- Min: ${Math.min(...perfValues)}\n`;
  report += `- Max: ${Math.max(...perfValues)}\n\n`;

  report += `### Accessibility Score\n`;
  report += `- Average: ${(a11yValues.reduce((a, b) => a + b) / a11yValues.length).toFixed(1)}\n`;
  report += `- Min: ${Math.min(...a11yValues)}\n`;
  report += `- Max: ${Math.max(...a11yValues)}\n\n`;

  report += `### Best Practices Score\n`;
  report += `- Average: ${(bpValues.reduce((a, b) => a + b) / bpValues.length).toFixed(1)}\n`;
  report += `- Min: ${Math.min(...bpValues)}\n`;
  report += `- Max: ${Math.max(...bpValues)}\n\n`;

  report += `### SEO Score\n`;
  report += `- Average: ${(seoValues.reduce((a, b) => a + b) / seoValues.length).toFixed(1)}\n`;
  report += `- Min: ${Math.min(...seoValues)}\n`;
  report += `- Max: ${Math.max(...seoValues)}\n`;

  // Write report
  fs.writeFileSync(reportPath, report);

  console.log('✅ Performance trends report generated');
  console.log(`Saved to: ${reportPath}`);

} catch (error) {
  console.error('Error generating trends:', error.message);
  process.exit(0);
}
