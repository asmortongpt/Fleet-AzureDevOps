#!/usr/bin/env node

/**
 * Store Lighthouse Metrics
 * Stores Lighthouse metrics in CSV for historical tracking
 */

const fs = require('fs');
const path = require('path');

const reportPath = path.join(process.cwd(), '.lighthouse', 'report-latest.json');
const historyDir = path.join(process.cwd(), '.lighthouse', 'history');
const csvPath = path.join(historyDir, 'metrics-history.csv');

if (!fs.existsSync(historyDir)) {
  fs.mkdirSync(historyDir, { recursive: true });
}

if (!fs.existsSync(reportPath)) {
  console.log('Lighthouse report not found');
  process.exit(0);
}

try {
  const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
  const audits = report.audits || {};
  const categories = report.categories || {};
  const timestamp = new Date().toISOString();
  const gitCommit = process.env.GITHUB_SHA || 'unknown';
  const gitBranch = process.env.GITHUB_REF_NAME || 'unknown';

  // Extract metrics
  const metrics = {
    timestamp,
    commit: gitCommit.substring(0, 7),
    branch: gitBranch,
    performance: Math.round((categories.performance?.score || 0) * 100),
    accessibility: Math.round((categories.accessibility?.score || 0) * 100),
    bestPractices: Math.round((categories['best-practices']?.score || 0) * 100),
    seo: Math.round((categories.seo?.score || 0) * 100),
    lcp: Math.round(audits['largest-contentful-paint']?.numericValue || 0),
    fcp: Math.round(audits['first-contentful-paint']?.numericValue || 0),
    fid: Math.round(audits['first-input-delay']?.numericValue || 0),
    cls: Math.round((audits['cumulative-layout-shift']?.numericValue || 0) * 1000) / 1000,
    tbt: Math.round(audits['total-blocking-time']?.numericValue || 0),
    si: Math.round(audits['speed-index']?.numericValue || 0),
  };

  // Check if CSV exists and has headers
  let csvContent = '';
  const headers = [
    'timestamp',
    'commit',
    'branch',
    'performance',
    'accessibility',
    'bestPractices',
    'seo',
    'lcp',
    'fcp',
    'fid',
    'cls',
    'tbt',
    'si',
  ];

  if (!fs.existsSync(csvPath)) {
    csvContent = headers.join(',') + '\n';
  } else {
    csvContent = fs.readFileSync(csvPath, 'utf8');
  }

  // Add new row
  const values = headers.map(h => metrics[h] || '');
  csvContent += values.join(',') + '\n';

  // Write CSV
  fs.writeFileSync(csvPath, csvContent);

  console.log('✅ Metrics stored successfully');
  console.log(`Saved to: ${csvPath}`);

  // Also create a JSON version for easier parsing
  const jsonPath = path.join(historyDir, `report-${timestamp.split('T')[0]}.json`);
  fs.writeFileSync(jsonPath, JSON.stringify(metrics, null, 2));

} catch (error) {
  console.error('Error storing metrics:', error.message);
  process.exit(0);
}
