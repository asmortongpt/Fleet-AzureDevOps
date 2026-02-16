#!/usr/bin/env node

/**
 * Check Bundle Budgets
 * Validates that bundle sizes are within defined budgets
 */

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const BUDGETS = {
  'dist/index.js': 250 * 1024,           // 250 KB
  'dist/main.js': 300 * 1024,            // 300 KB
  'dist/vendor.js': 500 * 1024,          // 500 KB
  'dist/styles.css': 100 * 1024,         // 100 KB
};

const distDir = path.join(process.cwd(), 'dist');

if (!fs.existsSync(distDir)) {
  console.log('dist directory not found');
  process.exit(1);
}

console.log('📦 Checking Bundle Budgets\n');

let hasExceeded = false;

// Get all JS and CSS files
const files = fs.readdirSync(distDir)
  .filter(f => /\.(js|css)$/.test(f))
  .map(f => ({ name: f, path: path.join(distDir, f) }));

const results = files.map(file => {
  const stats = fs.statSync(file.path);
  const sizeBytes = stats.size;
  const sizeKB = sizeBytes / 1024;

  // Calculate gzip size
  const content = fs.readFileSync(file.path);
  const gzipped = zlib.gzipSync(content);
  const gzipSizeKB = gzipped.length / 1024;

  // Find budget
  const budget = BUDGETS[`dist/${file.name}`] || (file.name.endsWith('.js') ? 300 * 1024 : 100 * 1024);
  const budgetKB = budget / 1024;

  const exceeded = sizeBytes > budget;
  if (exceeded) hasExceeded = true;

  const status = exceeded ? '❌' : '✅';
  const percentage = ((sizeBytes / budget) * 100).toFixed(0);

  console.log(`${status} ${file.name}`);
  console.log(`   Size: ${sizeKB.toFixed(1)} KB (${percentage}% of budget)`);
  console.log(`   Gzip: ${gzipSizeKB.toFixed(1)} KB`);
  console.log(`   Budget: ${budgetKB.toFixed(1)} KB\n`);

  return { file: file.name, size: sizeKB, gzip: gzipSizeKB, budget: budgetKB, exceeded };
});

// Summary
console.log('Summary:');
console.log(`Total files: ${results.length}`);
console.log(`Exceeded budget: ${results.filter(r => r.exceeded).length}`);

if (hasExceeded) {
  console.log('\n⚠️  Some bundles exceeded their budget!');
  console.log('Consider:');
  console.log('  - Code splitting to reduce bundle size');
  console.log('  - Tree shaking unused code');
  console.log('  - Using dynamic imports for large libraries');
  console.log('  - Removing unused dependencies');
  process.exit(1);
} else {
  console.log('\n✅ All bundles are within budget!');
  process.exit(0);
}
