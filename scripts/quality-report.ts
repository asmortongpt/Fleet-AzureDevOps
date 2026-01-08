#!/usr/bin/env tsx
/**
 * Quality Report Generator
 * Generates an HTML report of code quality metrics
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs/promises';
import * as path from 'path';

const execAsync = promisify(exec);

async function runCommand(cmd: string): Promise<{ stdout: string; success: boolean }> {
  try {
    const { stdout } = await execAsync(cmd, { maxBuffer: 10 * 1024 * 1024 });
    return { stdout, success: true };
  } catch (error: any) {
    return { stdout: error.stdout || '', success: false };
  }
}

async function main() {
  console.log('📊 Fleet Quality Report Generator\n');

  const timestamp = new Date().toLocaleString();
  let tsErrors = 0;
  let eslintErrors = 0;
  let coverage = 0;

  // Check TypeScript
  console.log('🔍 Checking TypeScript...');
  const tsResult = await runCommand('npm run typecheck 2>&1');
  tsErrors = (tsResult.stdout.match(/error TS\d+/g) || []).length;

  // Check ESLint
  console.log('🔍 Checking ESLint...');
  const eslintResult = await runCommand('npm run lint 2>&1');
  const errorMatch = eslintResult.stdout.match(/(\d+) error/);
  eslintErrors = errorMatch ? parseInt(errorMatch[1]) : 0;

  // Check Coverage
  console.log('📊 Checking coverage...');
  try {
    const summaryPath = path.join(process.cwd(), 'coverage', 'coverage-summary.json');
    const summary = JSON.parse(await fs.readFile(summaryPath, 'utf-8'));
    coverage = summary.total?.lines?.pct || 0;
  } catch {
    console.warn('⚠️ No coverage data found');
  }

  const html = `
<!DOCTYPE html>
<html>
<head>
  <title>Fleet Quality Report</title>
  <style>
    body { font-family: Arial; margin: 2rem; background: #f5f5f5; }
    .container { max-width: 1200px; margin: 0 auto; background: white; padding: 2rem; border-radius: 8px; }
    h1 { color: #333; }
    .metrics { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1.5rem; margin-top: 2rem; }
    .metric { background: #f8f9fa; padding: 1.5rem; border-radius: 8px; border-left: 4px solid #667eea; }
    .metric.pass { border-left-color: #10b981; }
    .metric.fail { border-left-color: #ef4444; }
    .metric-value { font-size: 2rem; font-weight: bold; color: #667eea; }
    .metric-label { color: #6b7280; margin-top: 0.5rem; }
  </style>
</head>
<body>
  <div class="container">
    <h1>Fleet Quality Report</h1>
    <p>Generated: ${timestamp}</p>
    <div class="metrics">
      <div class="metric ${tsErrors === 0 ? 'pass' : 'fail'}">
        <div class="metric-value">${tsErrors}</div>
        <div class="metric-label">TypeScript Errors</div>
      </div>
      <div class="metric ${eslintErrors === 0 ? 'pass' : 'fail'}">
        <div class="metric-value">${eslintErrors}</div>
        <div class="metric-label">ESLint Errors</div>
      </div>
      <div class="metric ${coverage >= 60 ? 'pass' : 'fail'}">
        <div class="metric-value">${coverage.toFixed(1)}%</div>
        <div class="metric-label">Test Coverage</div>
      </div>
    </div>
  </div>
</body>
</html>
  `;

  await fs.writeFile('quality-report.html', html);
  console.log('\n✅ Report generated: quality-report.html');
  console.log(`   TypeScript: ${tsErrors} errors`);
  console.log(`   ESLint: ${eslintErrors} errors`);
  console.log(`   Coverage: ${coverage.toFixed(1)}%\n`);
}

main().catch(console.error);
