#!/usr/bin/env node

/**
 * Coverage Analysis Script
 *
 * Analyzes test coverage reports and generates insights.
 * Supports:
 * - Line, branch, function, and statement coverage
 * - Frontend vs backend comparison
 * - Coverage trend analysis
 * - Regression detection
 * - HTML report generation
 */

const fs = require('fs');
const path = require('path');

// Configuration
const FRONTEND_COVERAGE_PATH = path.join(
  __dirname,
  '../coverage/coverage-summary.json'
);
const BACKEND_COVERAGE_PATH = path.join(
  __dirname,
  '../api/coverage/coverage-summary.json'
);
const OUTPUT_DIR = path.join(__dirname, '../coverage-reports');
const BASELINE_FILE = path.join(OUTPUT_DIR, 'coverage-baseline.json');

// Coverage targets
const TARGETS = {
  frontend: {
    lines: 70,
    branches: 70,
    functions: 70,
    statements: 70,
  },
  backend: {
    lines: 60,
    branches: 55,
    functions: 60,
    statements: 60,
  },
};

/**
 * Read coverage summary JSON file
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
 * Calculate coverage metrics
 */
function calculateMetrics(coverage) {
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
 * Compare coverage against targets
 */
function compareToTargets(metrics, targets) {
  const results = {};

  for (const [metric, value] of Object.entries(metrics)) {
    const target = targets[metric];
    const status = value >= target ? 'PASS' : 'FAIL';
    const delta = (value - target).toFixed(1);

    results[metric] = {
      actual: value,
      target,
      status,
      delta,
    };
  }

  return results;
}

/**
 * Detect coverage regression
 */
function detectRegression(current, baseline) {
  if (!baseline) {
    return null;
  }

  const regressions = {};
  let hasRegression = false;

  for (const [metric, value] of Object.entries(current)) {
    const baselineValue = baseline[metric];
    if (baselineValue && value < baselineValue - 2) {
      // 2% tolerance
      regressions[metric] = {
        current: value,
        baseline: baselineValue,
        change: (value - baselineValue).toFixed(1),
      };
      hasRegression = true;
    }
  }

  return hasRegression ? regressions : null;
}

/**
 * Get status badge
 */
function getStatusBadge(value, target) {
  if (value >= target) return '✅ PASS';
  if (value >= target - 10) return '⚠️  WARN';
  return '❌ FAIL';
}

/**
 * Generate text report
 */
function generateTextReport(frontendMetrics, backendMetrics, analysis) {
  let report = '\n';
  report += '═══════════════════════════════════════════════════════════\n';
  report += '  TEST COVERAGE ANALYSIS REPORT\n';
  report += '═══════════════════════════════════════════════════════════\n\n';

  // Frontend Coverage
  report += '📱 FRONTEND COVERAGE\n';
  report += '─────────────────────────────────────────────────────────\n';
  if (frontendMetrics) {
    const frontendAnalysis = analysis.frontend;
    report += `Lines:       ${frontendMetrics.lines.toFixed(1)}% (target: ${TARGETS.frontend.lines}%) ${getStatusBadge(
      frontendMetrics.lines,
      TARGETS.frontend.lines
    )}\n`;
    report += `Branches:    ${frontendMetrics.branches.toFixed(1)}% (target: ${
      TARGETS.frontend.branches
    }%) ${getStatusBadge(frontendMetrics.branches, TARGETS.frontend.branches)}\n`;
    report += `Functions:   ${frontendMetrics.functions.toFixed(1)}% (target: ${
      TARGETS.frontend.functions
    }%) ${getStatusBadge(
      frontendMetrics.functions,
      TARGETS.frontend.functions
    )}\n`;
    report += `Statements:  ${frontendMetrics.statements.toFixed(1)}% (target: ${
      TARGETS.frontend.statements
    }%) ${getStatusBadge(
      frontendMetrics.statements,
      TARGETS.frontend.statements
    )}\n`;

    if (frontendAnalysis.regression) {
      report += `\n⚠️  Regression detected in: ${Object.keys(frontendAnalysis.regression).join(', ')}\n`;
    }
  } else {
    report += '⚠️  Coverage data not available\n';
  }

  report += '\n';

  // Backend Coverage
  report += '🔧 BACKEND COVERAGE\n';
  report += '─────────────────────────────────────────────────────────\n';
  if (backendMetrics) {
    const backendAnalysis = analysis.backend;
    report += `Lines:       ${backendMetrics.lines.toFixed(1)}% (target: ${TARGETS.backend.lines}%) ${getStatusBadge(
      backendMetrics.lines,
      TARGETS.backend.lines
    )}\n`;
    report += `Branches:    ${backendMetrics.branches.toFixed(1)}% (target: ${
      TARGETS.backend.branches
    }%) ${getStatusBadge(backendMetrics.branches, TARGETS.backend.branches)}\n`;
    report += `Functions:   ${backendMetrics.functions.toFixed(1)}% (target: ${
      TARGETS.backend.functions
    }%) ${getStatusBadge(
      backendMetrics.functions,
      TARGETS.backend.functions
    )}\n`;
    report += `Statements:  ${backendMetrics.statements.toFixed(1)}% (target: ${
      TARGETS.backend.statements
    }%) ${getStatusBadge(
      backendMetrics.statements,
      TARGETS.backend.statements
    )}\n`;

    if (backendAnalysis.regression) {
      report += `\n⚠️  Regression detected in: ${Object.keys(backendAnalysis.regression).join(', ')}\n`;
    }
  } else {
    report += '⚠️  Coverage data not available\n';
  }

  report += '\n';

  // Summary
  report += '📊 SUMMARY\n';
  report += '─────────────────────────────────────────────────────────\n';
  const frontendPassed =
    frontendMetrics &&
    frontendMetrics.lines >= TARGETS.frontend.lines &&
    frontendMetrics.branches >= TARGETS.frontend.branches;
  const backendPassed =
    backendMetrics &&
    backendMetrics.lines >= TARGETS.backend.lines &&
    backendMetrics.branches >= TARGETS.backend.branches;

  report += `Frontend Status: ${frontendPassed ? '✅ PASS' : '❌ FAIL'}\n`;
  report += `Backend Status:  ${backendPassed ? '✅ PASS' : '❌ FAIL'}\n`;
  report += `Overall Status:  ${frontendPassed && backendPassed ? '✅ PASS' : '❌ FAIL'}\n`;

  report += '\n═══════════════════════════════════════════════════════════\n';

  return report;
}

/**
 * Save baseline for future regression detection
 */
function saveBaseline(frontend, backend) {
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  const baseline = {
    timestamp: new Date().toISOString(),
    frontend: frontend || {},
    backend: backend || {},
  };

  fs.writeFileSync(BASELINE_FILE, JSON.stringify(baseline, null, 2));
  console.log(`✅ Baseline saved to ${BASELINE_FILE}`);
}

/**
 * Save JSON report
 */
function saveJsonReport(analysis) {
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  const reportFile = path.join(OUTPUT_DIR, 'coverage-analysis.json');
  fs.writeFileSync(reportFile, JSON.stringify(analysis, null, 2));
  console.log(`✅ JSON report saved to ${reportFile}`);

  return reportFile;
}

/**
 * Main analysis function
 */
function analyzeCoverage() {
  console.log('🔍 Analyzing test coverage...\n');

  // Read coverage data
  const frontendCoverage = readCoverageSummary(FRONTEND_COVERAGE_PATH);
  const backendCoverage = readCoverageSummary(BACKEND_COVERAGE_PATH);

  // Calculate metrics
  const frontendMetrics = calculateMetrics(frontendCoverage);
  const backendMetrics = calculateMetrics(backendCoverage);

  // Compare to targets
  const frontendComparison = frontendMetrics
    ? compareToTargets(frontendMetrics, TARGETS.frontend)
    : null;
  const backendComparison = backendMetrics
    ? compareToTargets(backendMetrics, TARGETS.backend)
    : null;

  // Load baseline for regression detection
  let baseline = null;
  if (fs.existsSync(BASELINE_FILE)) {
    const baselineData = JSON.parse(fs.readFileSync(BASELINE_FILE, 'utf8'));
    baseline = baselineData;
  }

  // Detect regressions
  const frontendRegression = frontendMetrics
    ? detectRegression(frontendMetrics, baseline?.frontend)
    : null;
  const backendRegression = backendMetrics
    ? detectRegression(backendMetrics, baseline?.backend)
    : null;

  // Prepare analysis
  const analysis = {
    timestamp: new Date().toISOString(),
    frontend: {
      metrics: frontendMetrics,
      comparison: frontendComparison,
      regression: frontendRegression,
    },
    backend: {
      metrics: backendMetrics,
      comparison: backendComparison,
      regression: backendRegression,
    },
  };

  // Generate and print report
  const textReport = generateTextReport(frontendMetrics, backendMetrics, analysis);
  console.log(textReport);

  // Save reports
  saveJsonReport(analysis);
  saveBaseline(frontendMetrics, backendMetrics);

  // Determine exit code
  const hasFrontendRegression = frontendRegression !== null;
  const hasBackendRegression = backendRegression !== null;

  if (hasFrontendRegression || hasBackendRegression) {
    console.log(
      '\n⚠️  Coverage regression detected. Please review and add tests.\n'
    );
    process.exit(1);
  }

  process.exit(0);
}

// Run analysis
analyzeCoverage();
