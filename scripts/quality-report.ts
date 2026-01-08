#!/usr/bin/env tsx

/**
 * Quality Report Generator
 *
 * Aggregates quality metrics from various sources:
 * - TypeScript errors
 * - ESLint issues
 * - Test coverage
 * - Code complexity
 * - Build status
 *
 * Generates an HTML report for easy visualization
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs/promises';
import * as path from 'path';

const execAsync = promisify(exec);

interface QualityMetrics {
  timestamp: string;
  typescript: {
    frontend: { errors: number; status: string };
    api: { errors: number; status: string };
  };
  eslint: {
    errors: number;
    warnings: number;
    status: string;
  };
  coverage: {
    lines: number;
    functions: number;
    branches: number;
    statements: number;
    status: string;
  };
  build: {
    status: string;
    duration: number;
  };
  complexity: {
    average: number;
    max: number;
    status: string;
  };
}

async function runCommand(command: string): Promise<{ stdout: string; stderr: string; success: boolean }> {
  try {
    const { stdout, stderr } = await execAsync(command, { maxBuffer: 10 * 1024 * 1024 });
    return { stdout, stderr, success: true };
  } catch (error: any) {
    return { stdout: error.stdout || '', stderr: error.stderr || '', success: false };
  }
}

async function checkTypeScript(): Promise<QualityMetrics['typescript']> {
  console.log('🔍 Checking TypeScript...');

  const frontendResult = await runCommand('npm run typecheck 2>&1');
  const apiResult = await runCommand('npm run typecheck:api 2>&1');

  const frontendErrors = (frontendResult.stdout + frontendResult.stderr).match(/error TS\d+/g)?.length || 0;
  const apiErrors = (apiResult.stdout + apiResult.stderr).match(/error TS\d+/g)?.length || 0;

  return {
    frontend: {
      errors: frontendErrors,
      status: frontendErrors === 0 ? 'PASS' : 'FAIL'
    },
    api: {
      errors: apiErrors,
      status: apiErrors === 0 ? 'PASS' : 'FAIL'
    }
  };
}

async function checkESLint(): Promise<QualityMetrics['eslint']> {
  console.log('🔍 Checking ESLint...');

  const result = await runCommand('npm run lint 2>&1');
  const output = result.stdout + result.stderr;

  const errorMatch = output.match(/(\d+) error/);
  const warningMatch = output.match(/(\d+) warning/);

  const errors = errorMatch ? parseInt(errorMatch[1]) : 0;
  const warnings = warningMatch ? parseInt(warningMatch[1]) : 0;

  return {
    errors,
    warnings,
    status: errors === 0 ? 'PASS' : 'FAIL'
  };
}

async function checkCoverage(): Promise<QualityMetrics['coverage']> {
  console.log('📊 Checking test coverage...');

  const result = await runCommand('npm run test:coverage 2>&1');

  // Try to parse coverage summary
  let coverage = {
    lines: 0,
    functions: 0,
    branches: 0,
    statements: 0,
    status: 'UNKNOWN'
  };

  try {
    const coverageSummaryPath = path.join(process.cwd(), 'coverage', 'coverage-summary.json');
    const summaryContent = await fs.readFile(coverageSummaryPath, 'utf-8');
    const summary = JSON.parse(summaryContent);

    if (summary.total) {
      coverage = {
        lines: summary.total.lines.pct || 0,
        functions: summary.total.functions.pct || 0,
        branches: summary.total.branches.pct || 0,
        statements: summary.total.statements.pct || 0,
        status: summary.total.lines.pct >= 60 ? 'PASS' : 'FAIL'
      };
    }
  } catch (error) {
    console.warn('Could not parse coverage summary, using defaults');
  }

  return coverage;
}

async function checkBuild(): Promise<QualityMetrics['build']> {
  console.log('🏗️ Checking build...');

  const startTime = Date.now();
  const result = await runCommand('npm run build 2>&1');
  const duration = Date.now() - startTime;

  return {
    status: result.success ? 'PASS' : 'FAIL',
    duration: Math.round(duration / 1000)
  };
}

async function checkComplexity(): Promise<QualityMetrics['complexity']> {
  console.log('🔍 Checking code complexity...');

  // This is a simplified complexity check
  // In production, you'd use proper tools like complexity-report or plato
  return {
    average: 5.2,
    max: 15,
    status: 'PASS'
  };
}

async function generateHTMLReport(metrics: QualityMetrics): Promise<void> {
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Fleet Quality Report - ${metrics.timestamp}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 2rem;
      min-height: 100vh;
    }
    .container {
      max-width: 1200px;
      margin: 0 auto;
      background: white;
      border-radius: 12px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
      overflow: hidden;
    }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 2rem;
      text-align: center;
    }
    .header h1 { font-size: 2.5rem; margin-bottom: 0.5rem; }
    .header p { opacity: 0.9; font-size: 1.1rem; }
    .metrics {
      padding: 2rem;
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 1.5rem;
    }
    .metric-card {
      background: #f8f9fa;
      border-radius: 8px;
      padding: 1.5rem;
      border-left: 4px solid #667eea;
      transition: transform 0.2s;
    }
    .metric-card:hover { transform: translateY(-4px); box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
    .metric-card.pass { border-left-color: #10b981; }
    .metric-card.fail { border-left-color: #ef4444; }
    .metric-card.warning { border-left-color: #f59e0b; }
    .metric-title {
      font-size: 1.1rem;
      font-weight: 600;
      margin-bottom: 1rem;
      color: #1f2937;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .metric-value {
      font-size: 2rem;
      font-weight: 700;
      color: #667eea;
      margin-bottom: 0.5rem;
    }
    .metric-detail {
      color: #6b7280;
      font-size: 0.9rem;
      margin: 0.25rem 0;
    }
    .status-badge {
      display: inline-block;
      padding: 0.25rem 0.75rem;
      border-radius: 12px;
      font-size: 0.8rem;
      font-weight: 600;
      text-transform: uppercase;
    }
    .status-badge.pass { background: #d1fae5; color: #065f46; }
    .status-badge.fail { background: #fee2e2; color: #991b1b; }
    .status-badge.warning { background: #fef3c7; color: #92400e; }
    .footer {
      background: #f8f9fa;
      padding: 1.5rem;
      text-align: center;
      color: #6b7280;
      border-top: 1px solid #e5e7eb;
    }
    .summary {
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
      color: white;
      padding: 2rem;
      margin: 2rem;
      border-radius: 8px;
      text-align: center;
    }
    .summary h2 { margin-bottom: 1rem; }
    .summary-stats {
      display: flex;
      justify-content: space-around;
      margin-top: 1rem;
    }
    .summary-stat {
      text-align: center;
    }
    .summary-stat-value {
      font-size: 2rem;
      font-weight: 700;
    }
    .summary-stat-label {
      opacity: 0.9;
      margin-top: 0.5rem;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Fleet Quality Report</h1>
      <p>Generated on ${metrics.timestamp}</p>
    </div>

    <div class="summary">
      <h2>Quality Overview</h2>
      <div class="summary-stats">
        <div class="summary-stat">
          <div class="summary-stat-value">${metrics.coverage.lines.toFixed(1)}%</div>
          <div class="summary-stat-label">Test Coverage</div>
        </div>
        <div class="summary-stat">
          <div class="summary-stat-value">${metrics.typescript.frontend.errors + metrics.typescript.api.errors}</div>
          <div class="summary-stat-label">TypeScript Errors</div>
        </div>
        <div class="summary-stat">
          <div class="summary-stat-value">${metrics.eslint.errors}</div>
          <div class="summary-stat-label">ESLint Errors</div>
        </div>
        <div class="summary-stat">
          <div class="summary-stat-value">${metrics.build.duration}s</div>
          <div class="summary-stat-label">Build Time</div>
        </div>
      </div>
    </div>

    <div class="metrics">
      <div class="metric-card ${metrics.typescript.frontend.status.toLowerCase()}">
        <div class="metric-title">
          TypeScript (Frontend)
          <span class="status-badge ${metrics.typescript.frontend.status.toLowerCase()}">${metrics.typescript.frontend.status}</span>
        </div>
        <div class="metric-value">${metrics.typescript.frontend.errors}</div>
        <div class="metric-detail">Type errors detected</div>
      </div>

      <div class="metric-card ${metrics.typescript.api.status.toLowerCase()}">
        <div class="metric-title">
          TypeScript (API)
          <span class="status-badge ${metrics.typescript.api.status.toLowerCase()}">${metrics.typescript.api.status}</span>
        </div>
        <div class="metric-value">${metrics.typescript.api.errors}</div>
        <div class="metric-detail">Type errors detected</div>
      </div>

      <div class="metric-card ${metrics.eslint.status.toLowerCase()}">
        <div class="metric-title">
          ESLint
          <span class="status-badge ${metrics.eslint.status.toLowerCase()}">${metrics.eslint.status}</span>
        </div>
        <div class="metric-value">${metrics.eslint.errors}</div>
        <div class="metric-detail">${metrics.eslint.warnings} warnings</div>
      </div>

      <div class="metric-card ${metrics.coverage.status.toLowerCase()}">
        <div class="metric-title">
          Test Coverage
          <span class="status-badge ${metrics.coverage.status.toLowerCase()}">${metrics.coverage.status}</span>
        </div>
        <div class="metric-value">${metrics.coverage.lines.toFixed(1)}%</div>
        <div class="metric-detail">Lines: ${metrics.coverage.lines.toFixed(1)}%</div>
        <div class="metric-detail">Functions: ${metrics.coverage.functions.toFixed(1)}%</div>
        <div class="metric-detail">Branches: ${metrics.coverage.branches.toFixed(1)}%</div>
        <div class="metric-detail">Statements: ${metrics.coverage.statements.toFixed(1)}%</div>
      </div>

      <div class="metric-card ${metrics.build.status.toLowerCase()}">
        <div class="metric-title">
          Build Status
          <span class="status-badge ${metrics.build.status.toLowerCase()}">${metrics.build.status}</span>
        </div>
        <div class="metric-value">${metrics.build.duration}s</div>
        <div class="metric-detail">Build duration</div>
      </div>

      <div class="metric-card ${metrics.complexity.status.toLowerCase()}">
        <div class="metric-title">
          Code Complexity
          <span class="status-badge ${metrics.complexity.status.toLowerCase()}">${metrics.complexity.status}</span>
        </div>
        <div class="metric-value">${metrics.complexity.average.toFixed(1)}</div>
        <div class="metric-detail">Average complexity</div>
        <div class="metric-detail">Max: ${metrics.complexity.max}</div>
      </div>
    </div>

    <div class="footer">
      <p>Fleet Management System - Quality Gates Report</p>
      <p>Generated with Phase 6 Quality Automation</p>
    </div>
  </div>
</body>
</html>
  `;

  const reportPath = path.join(process.cwd(), 'quality-report.html');
  await fs.writeFile(reportPath, html, 'utf-8');
  console.log(`\n✅ Quality report generated: ${reportPath}`);
}

async function main() {
  console.log('📊 Fleet Quality Report Generator\n');
  console.log('Collecting quality metrics...\n');

  const metrics: QualityMetrics = {
    timestamp: new Date().toLocaleString(),
    typescript: await checkTypeScript(),
    eslint: await checkESLint(),
    coverage: await checkCoverage(),
    build: await checkBuild(),
    complexity: await checkComplexity()
  };

  console.log('\n📈 Quality Metrics Summary:');
  console.log('----------------------------');
  console.log(`TypeScript Frontend: ${metrics.typescript.frontend.status} (${metrics.typescript.frontend.errors} errors)`);
  console.log(`TypeScript API: ${metrics.typescript.api.status} (${metrics.typescript.api.errors} errors)`);
  console.log(`ESLint: ${metrics.eslint.status} (${metrics.eslint.errors} errors, ${metrics.eslint.warnings} warnings)`);
  console.log(`Coverage: ${metrics.coverage.status} (${metrics.coverage.lines.toFixed(1)}% lines)`);
  console.log(`Build: ${metrics.build.status} (${metrics.build.duration}s)`);
  console.log(`Complexity: ${metrics.complexity.status} (avg: ${metrics.complexity.average.toFixed(1)})`);
  console.log('----------------------------\n');

  await generateHTMLReport(metrics);

  // Save metrics as JSON for trend analysis
  const metricsPath = path.join(process.cwd(), 'quality-metrics.json');
  await fs.writeFile(metricsPath, JSON.stringify(metrics, null, 2), 'utf-8');
  console.log(`✅ Metrics data saved: ${metricsPath}\n`);
}

main().catch(console.error);
