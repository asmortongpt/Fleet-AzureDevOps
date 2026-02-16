#!/usr/bin/env node

/**
 * Load Test Results Analyzer
 * Parses K6 JSON results and provides summary statistics
 */

const fs = require('fs');
const path = require('path');

// ANSI Colors
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function colorize(text, color) {
  return `${colors[color]}${text}${colors.reset}`;
}

function analyzeResults(filePath) {
  if (!fs.existsSync(filePath)) {
    console.error(colorize(`Error: File not found: ${filePath}`, 'red'));
    process.exit(1);
  }

  console.log(colorize('\n=== Load Test Results Analysis ===\n', 'bright'));
  console.log(`File: ${filePath}`);
  console.log(`Date: ${new Date(fs.statSync(filePath).mtime).toISOString()}\n`);

  try {
    const data = fs.readFileSync(filePath, 'utf8');
    const lines = data.split('\n').filter((line) => line.trim());

    if (lines.length === 0) {
      console.error(colorize('Error: Empty results file', 'red'));
      process.exit(1);
    }

    // Parse K6 metrics
    const metrics = {
      'http_req_duration': [],
      'http_req_failed': [],
      'http_errors': [],
    };

    for (const line of lines) {
      try {
        const obj = JSON.parse(line);

        // Extract metric data
        if (obj.type === 'Point') {
          if (obj.metric === 'http_req_duration') {
            metrics['http_req_duration'].push(obj.data.value);
          } else if (obj.metric === 'http_req_failed') {
            metrics['http_req_failed'].push(obj.data.value);
          }
        }
      } catch (e) {
        // Ignore non-JSON lines
      }
    }

    // Calculate statistics
    if (metrics['http_req_duration'].length > 0) {
      const durations = metrics['http_req_duration'].sort(
        (a, b) => a - b
      );
      const count = durations.length;
      const min = Math.min(...durations);
      const max = Math.max(...durations);
      const avg = durations.reduce((a, b) => a + b) / count;
      const p50 = durations[Math.floor(count * 0.5)];
      const p95 = durations[Math.floor(count * 0.95)];
      const p99 = durations[Math.floor(count * 0.99)];

      console.log(colorize('Response Time Metrics (ms):', 'bright'));
      console.log(`  Min:  ${colorize(min.toFixed(2), 'green')}`);
      console.log(`  Max:  ${colorize(max.toFixed(2), 'red')}`);
      console.log(`  Avg:  ${avg.toFixed(2)}`);
      console.log(`  p50:  ${colorize(p50.toFixed(2), p50 < 200 ? 'green' : p50 < 500 ? 'yellow' : 'red')}`);
      console.log(`  p95:  ${colorize(p95.toFixed(2), p95 < 500 ? 'green' : p95 < 1000 ? 'yellow' : 'red')}`);
      console.log(`  p99:  ${colorize(p99.toFixed(2), p99 < 1000 ? 'green' : p99 < 2000 ? 'yellow' : 'red')}`);
      console.log(`  Count: ${count}\n`);

      // Performance assessment
      console.log(colorize('Performance Assessment:', 'bright'));
      if (p95 < 500 && p99 < 1000) {
        console.log(colorize('✓ EXCELLENT - System performing well', 'green'));
      } else if (p95 < 1000 && p99 < 2000) {
        console.log(colorize('⚠ ACCEPTABLE - Minor performance concerns', 'yellow'));
      } else {
        console.log(colorize('✗ POOR - Significant performance issues', 'red'));
      }
    }

    if (metrics['http_req_failed'].length > 0) {
      const failures = metrics['http_req_failed'].filter((v) => v);
      const failureRate = (failures.length / metrics['http_req_failed'].length * 100).toFixed(2);

      console.log(`\n${colorize('Error Metrics:', 'bright')}`);
      console.log(`  Failed Requests: ${failures.length}`);
      console.log(`  Failure Rate: ${colorize(
        `${failureRate}%`,
        failureRate < 0.1 ? 'green' : failureRate < 1 ? 'yellow' : 'red'
      )}`);
    }

    console.log(`\n${colorize('Recommendations:', 'bright')}`);
    if (
      metrics['http_req_duration'].length > 0
    ) {
      const p95 = metrics['http_req_duration'].sort((a, b) => a - b)[
        Math.floor(metrics['http_req_duration'].length * 0.95)
      ];

      if (p95 > 1000) {
        console.log('  • Response times are degraded');
        console.log('  • Check database query performance');
        console.log('  • Review Redis cache effectiveness');
        console.log('  • Verify connection pool size');
        console.log('  • Check CPU and memory usage');
      } else if (p95 > 500) {
        console.log('  • Response times acceptable but could be optimized');
        console.log('  • Review slow query logs');
        console.log('  • Consider query optimization');
      }
    }

    console.log('');
  } catch (error) {
    console.error(colorize(`Error parsing results: ${error.message}`, 'red'));
    process.exit(1);
  }
}

// Main
const args = process.argv.slice(2);

if (args.length === 0) {
  // Find latest results file
  const resultsDir = path.join(__dirname, 'results');

  if (!fs.existsSync(resultsDir)) {
    console.error(
      colorize('Error: Results directory not found', 'red')
    );
    process.exit(1);
  }

  const files = fs
    .readdirSync(resultsDir)
    .filter((f) => f.endsWith('.json'))
    .map((f) => ({
      name: f,
      path: path.join(resultsDir, f),
      mtime: fs.statSync(path.join(resultsDir, f)).mtime,
    }))
    .sort((a, b) => b.mtime - a.mtime);

  if (files.length === 0) {
    console.error(
      colorize('Error: No results files found in results directory', 'red')
    );
    process.exit(1);
  }

  console.log(
    colorize(`Analyzing latest results file: ${files[0].name}\n`, 'cyan')
  );
  analyzeResults(files[0].path);
} else {
  const filePath = args[0];
  analyzeResults(filePath);
}
