#!/usr/bin/env node

/**
 * Coverage Trends Tracking Script
 *
 * Tracks coverage metrics over time and generates trend analysis.
 * Maintains a CSV file of historical coverage data for charting and analysis.
 */

const fs = require('fs');
const path = require('path');

const COVERAGE_HISTORY_FILE = path.join(
  __dirname,
  '../coverage-reports/coverage-history.csv'
);
const OUTPUT_DIR = path.join(__dirname, '../coverage-reports');
const FRONTEND_COVERAGE_PATH = path.join(
  __dirname,
  '../coverage/coverage-summary.json'
);
const BACKEND_COVERAGE_PATH = path.join(
  __dirname,
  '../api/coverage/coverage-summary.json'
);

/**
 * Ensure output directory exists
 */
function ensureOutputDir() {
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }
}

/**
 * Read coverage summary
 */
function readCoverageSummary(filePath) {
  try {
    if (!fs.existsSync(filePath)) {
      return null;
    }
    const content = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    console.error(`Error reading coverage file: ${filePath}`, error.message);
    return null;
  }
}

/**
 * Extract coverage metrics
 */
function extractMetrics(coverage) {
  if (!coverage || !coverage.total) {
    return null;
  }

  return {
    lines: coverage.total.lines.pct,
    branches: coverage.total.branches.pct,
    functions: coverage.total.functions.pct,
    statements: coverage.total.statements.pct,
  };
}

/**
 * Initialize CSV header
 */
function initializeCSV() {
  const header = `timestamp,date,frontend_lines,frontend_branches,frontend_functions,frontend_statements,backend_lines,backend_branches,backend_functions,backend_statements\n`;
  fs.writeFileSync(COVERAGE_HISTORY_FILE, header);
}

/**
 * Append coverage data to CSV
 */
function appendToCSV(frontendMetrics, backendMetrics) {
  const now = new Date();
  const timestamp = now.toISOString();
  const dateStr = now.toLocaleDateString('en-US');

  const frontendData = frontendMetrics
    ? `${frontendMetrics.lines.toFixed(2)},${frontendMetrics.branches.toFixed(2)},${frontendMetrics.functions.toFixed(2)},${frontendMetrics.statements.toFixed(2)}`
    : ',,,,';

  const backendData = backendMetrics
    ? `${backendMetrics.lines.toFixed(2)},${backendMetrics.branches.toFixed(2)},${backendMetrics.functions.toFixed(2)},${backendMetrics.statements.toFixed(2)}`
    : ',,,,';

  const row = `${timestamp},${dateStr},${frontendData},${backendData}\n`;

  // Append to CSV, creating file if it doesn't exist
  if (!fs.existsSync(COVERAGE_HISTORY_FILE)) {
    initializeCSV();
  }

  fs.appendFileSync(COVERAGE_HISTORY_FILE, row);
  console.log(`✅ Coverage data recorded: ${timestamp}`);
}

/**
 * Calculate trend statistics
 */
function calculateTrends() {
  if (!fs.existsSync(COVERAGE_HISTORY_FILE)) {
    console.log('ℹ️  No coverage history available yet.');
    return null;
  }

  const data = fs.readFileSync(COVERAGE_HISTORY_FILE, 'utf8').split('\n');

  // Skip header and empty lines
  const records = data.slice(1).filter((line) => line.trim() !== '');

  if (records.length < 2) {
    console.log('ℹ️  Not enough data for trend analysis (need at least 2 records).');
    return null;
  }

  // Parse latest 10 records
  const recent = records
    .slice(-10)
    .map((line) => {
      const [
        timestamp,
        date,
        fe_lines,
        fe_branches,
        fe_functions,
        fe_statements,
        be_lines,
        be_branches,
        be_functions,
        be_statements,
      ] = line.split(',');
      return {
        timestamp,
        date,
        frontend: {
          lines: parseFloat(fe_lines),
          branches: parseFloat(fe_branches),
          functions: parseFloat(fe_functions),
          statements: parseFloat(fe_statements),
        },
        backend: {
          lines: parseFloat(be_lines),
          branches: parseFloat(be_branches),
          functions: parseFloat(be_functions),
          statements: parseFloat(be_statements),
        },
      };
    });

  // Calculate averages and trends
  const latestRecord = recent[recent.length - 1];
  const previousRecord = recent[0];

  const calculateDelta = (current, previous) => {
    if (isNaN(current) || isNaN(previous)) return 0;
    return (current - previous).toFixed(2);
  };

  return {
    latest: latestRecord,
    previous: previousRecord,
    recordCount: records.length,
    trends: {
      frontend: {
        lines: calculateDelta(latestRecord.frontend.lines, previousRecord.frontend.lines),
        branches: calculateDelta(
          latestRecord.frontend.branches,
          previousRecord.frontend.branches
        ),
        functions: calculateDelta(
          latestRecord.frontend.functions,
          previousRecord.frontend.functions
        ),
      },
      backend: {
        lines: calculateDelta(latestRecord.backend.lines, previousRecord.backend.lines),
        branches: calculateDelta(
          latestRecord.backend.branches,
          previousRecord.backend.branches
        ),
        functions: calculateDelta(
          latestRecord.backend.functions,
          previousRecord.backend.functions
        ),
      },
    },
  };
}

/**
 * Generate trend report
 */
function generateTrendReport(trends) {
  if (!trends) {
    console.log('ℹ️  Skipping trend report (insufficient data).\n');
    return;
  }

  let report = '\n';
  report += '═══════════════════════════════════════════════════════════\n';
  report += '  COVERAGE TREND ANALYSIS\n';
  report += '═══════════════════════════════════════════════════════════\n\n';

  report += `📈 Total Records: ${trends.recordCount}\n`;
  report += `Latest Update: ${trends.latest.timestamp}\n`;
  report += `Previous Update: ${trends.previous.timestamp}\n\n`;

  report += '📱 FRONTEND TRENDS\n';
  report += '─────────────────────────────────────────────────────────\n';
  report += `Lines:       ${trends.latest.frontend.lines.toFixed(2)}% (${
    trends.trends.frontend.lines >= 0 ? '+' : ''
  }${trends.trends.frontend.lines}%)\n`;
  report += `Branches:    ${trends.latest.frontend.branches.toFixed(2)}% (${
    trends.trends.frontend.branches >= 0 ? '+' : ''
  }${trends.trends.frontend.branches}%)\n`;
  report += `Functions:   ${trends.latest.frontend.functions.toFixed(2)}% (${
    trends.trends.frontend.functions >= 0 ? '+' : ''
  }${trends.trends.frontend.functions}%)\n\n`;

  report += '🔧 BACKEND TRENDS\n';
  report += '─────────────────────────────────────────────────────────\n';
  report += `Lines:       ${trends.latest.backend.lines.toFixed(2)}% (${
    trends.trends.backend.lines >= 0 ? '+' : ''
  }${trends.trends.backend.lines}%)\n`;
  report += `Branches:    ${trends.latest.backend.branches.toFixed(2)}% (${
    trends.trends.backend.branches >= 0 ? '+' : ''
  }${trends.trends.backend.branches}%)\n`;
  report += `Functions:   ${trends.latest.backend.functions.toFixed(2)}% (${
    trends.trends.backend.functions >= 0 ? '+' : ''
  }${trends.trends.backend.functions}%)\n\n`;

  report += '═══════════════════════════════════════════════════════════\n';

  console.log(report);

  // Save trend report
  const reportFile = path.join(OUTPUT_DIR, 'coverage-trends.txt');
  fs.writeFileSync(reportFile, report);
  console.log(`✅ Trend report saved to ${reportFile}`);
}

/**
 * Generate trend JSON
 */
function generateTrendJSON(trends) {
  if (!trends) {
    return;
  }

  const trendData = {
    timestamp: new Date().toISOString(),
    recordCount: trends.recordCount,
    latest: trends.latest,
    trends: trends.trends,
  };

  const jsonFile = path.join(OUTPUT_DIR, 'coverage-trends.json');
  fs.writeFileSync(jsonFile, JSON.stringify(trendData, null, 2));
  console.log(`✅ Trend data saved to ${jsonFile}`);
}

/**
 * Main function
 */
function trackTrends() {
  console.log('📊 Tracking coverage trends...\n');

  ensureOutputDir();

  // Read coverage data
  const frontendCoverage = readCoverageSummary(FRONTEND_COVERAGE_PATH);
  const backendCoverage = readCoverageSummary(BACKEND_COVERAGE_PATH);

  // Extract metrics
  const frontendMetrics = extractMetrics(frontendCoverage);
  const backendMetrics = extractMetrics(backendCoverage);

  if (!frontendMetrics && !backendMetrics) {
    console.error('❌ No coverage data available to track');
    process.exit(1);
  }

  // Append to CSV
  appendToCSV(frontendMetrics, backendMetrics);

  // Analyze trends
  const trends = calculateTrends();

  // Generate reports
  generateTrendReport(trends);
  generateTrendJSON(trends);

  console.log(`\n✅ Coverage tracking complete. History: ${COVERAGE_HISTORY_FILE}\n`);
}

// Run tracking
trackTrends();
