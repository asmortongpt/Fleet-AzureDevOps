/**
 * Console Errors Gate
 *
 * Production Mode: Only fails on CRITICAL console errors
 * - SecurityError, CORS, Authentication failures, Database errors
 * - Ignores warnings, 404s, and minor issues
 */

import { test, expect, Page } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import {
  Severity,
  Finding,
  GateConfig,
  classifyConsoleFinding,
  shouldFailGate,
  calculateGateScore
} from '../lib/severity.js';

const PRODUCTION_MODE = process.env.PRODUCTION_MODE === 'true';
const CRITICAL_ONLY = process.env.CRITICAL_ONLY === 'true';

const config: GateConfig = {
  productionMode: PRODUCTION_MODE,
  passThreshold: parseInt(process.env.PASS_THRESHOLD || '80', 10),
  criticalOnly: CRITICAL_ONLY
};

interface ConsoleError {
  type: string;
  message: string;
  url?: string;
  timestamp: string;
  severity: Severity;
}

export async function runConsoleErrorsGate(page: Page): Promise<{
  passed: boolean;
  score: number;
  findings: Finding[];
}> {
  const consoleErrors: ConsoleError[] = [];

  // Capture console errors
  page.on('console', msg => {
    if (msg.type() === 'error') {
      const severity = classifyConsoleFinding(msg.type(), msg.text());
      consoleErrors.push({
        type: msg.type(),
        message: msg.text(),
        url: msg.location()?.url,
        timestamp: new Date().toISOString(),
        severity
      });
    }
  });

  page.on('pageerror', error => {
    const severity = classifyConsoleFinding('PageError', error.message);
    consoleErrors.push({
      type: 'PageError',
      message: error.message,
      timestamp: new Date().toISOString(),
      severity
    });
  });

  // Navigate and wait for errors to surface
  await page.goto(process.env.BASE_URL || 'http://localhost:5173');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000); // Allow time for errors to manifest

  // Filter benign errors
  const filteredErrors = consoleErrors.filter(err =>
    !err.message.includes('favicon') &&
    !err.message.includes('404') &&
    !(err.message.includes('net::ERR_') && !err.message.includes('REFUSED')) &&
    !err.message.includes('Failed to load resource: the server responded with a status of 404')
  );

  // Convert to findings
  const findings: Finding[] = filteredErrors.map(err => ({
    severity: err.severity,
    category: 'Console Error',
    message: `[${err.type}] ${err.message.substring(0, 200)}`,
    location: err.url,
    requiredForProduction: err.severity === Severity.CRITICAL,
    recommendation: err.severity === Severity.CRITICAL ?
      'CRITICAL: This error must be fixed before production deployment' :
      err.severity === Severity.HIGH ?
      'RECOMMENDED: Fix this error for better reliability' :
      'OPTIONAL: Consider addressing this for improved quality'
  }));

  // In production mode, only show CRITICAL/HIGH
  const displayFindings = config.productionMode && config.criticalOnly ?
    findings.filter(f => f.severity === Severity.CRITICAL) :
    config.productionMode ?
    findings.filter(f => f.severity === Severity.CRITICAL || f.severity === Severity.HIGH) :
    findings;

  const maxScore = 10;
  const score = calculateGateScore(displayFindings, maxScore, config);
  const passed = !shouldFailGate(displayFindings, config);

  // Log results
  console.log(`\n📊 Console Errors Gate:`);
  console.log(`   Total errors: ${filteredErrors.length}`);
  console.log(`   CRITICAL: ${findings.filter(f => f.severity === Severity.CRITICAL).length}`);
  console.log(`   HIGH: ${findings.filter(f => f.severity === Severity.HIGH).length}`);

  if (PRODUCTION_MODE) {
    console.log(`   Mode: Production (showing ${displayFindings.length} blocking issues)`);
  }

  console.log(`   Score: ${score}/${maxScore}`);
  console.log(`   Status: ${passed ? '✅ PASS' : '❌ FAIL'}`);

  return { passed, score, findings: displayFindings };
}

// Playwright test wrapper
test.describe('Console Errors Gate', () => {
  test('No critical console errors', async ({ page }) => {
    const result = await runConsoleErrorsGate(page);

    // In production mode, only fail on CRITICAL
    if (PRODUCTION_MODE && CRITICAL_ONLY) {
      const criticalErrors = result.findings.filter(f => f.severity === Severity.CRITICAL);
      expect(criticalErrors.length).toBe(0);
    } else {
      expect(result.passed).toBe(true);
    }
  });
});
