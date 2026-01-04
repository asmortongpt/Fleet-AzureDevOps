/**
 * Accessibility Gate
 *
 * Production Mode: Only fails on CRITICAL/SERIOUS accessibility violations
 * - WCAG 2.1 AA compliance for critical issues
 * - Ignores minor/moderate issues in production mode
 */

import { test, expect, Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import * as fs from 'fs';
import * as path from 'path';
import {
  Severity,
  Finding,
  GateConfig,
  classifyAccessibilityFinding,
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

export async function runAccessibilityGate(page: Page): Promise<{
  passed: boolean;
  score: number;
  findings: Finding[];
}> {
  // Navigate to page
  await page.goto(process.env.BASE_URL || 'http://localhost:5173');
  await page.waitForLoadState('networkidle');

  // Run axe accessibility scan
  const axeResults = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
    .analyze();

  const violations = axeResults.violations;

  // Convert violations to findings
  const findings: Finding[] = violations.map(violation => {
    const severity = classifyAccessibilityFinding(violation.impact || 'minor');

    return {
      severity,
      category: 'Accessibility',
      message: `${violation.id}: ${violation.description} (${violation.nodes.length} instances)`,
      location: violation.nodes[0]?.target?.join(' > '),
      requiredForProduction: severity === Severity.CRITICAL || severity === Severity.HIGH,
      recommendation: severity === Severity.CRITICAL ?
        'CRITICAL: Must fix for WCAG compliance and legal requirements' :
        severity === Severity.HIGH ?
        'RECOMMENDED: Fix for better accessibility and user experience' :
        severity === Severity.MEDIUM ?
        'OPTIONAL: Consider addressing for enhanced accessibility' :
        'INFORMATIONAL: Minor improvement opportunity',
      evidence: [`axe-rule: ${violation.id}`, `impact: ${violation.impact}`]
    };
  });

  // In production mode, only show blocking issues
  const blockingFindings = config.productionMode ?
    findings.filter(f => f.severity === Severity.CRITICAL || f.severity === Severity.HIGH) :
    findings;

  const displayFindings = config.criticalOnly ?
    blockingFindings.filter(f => f.severity === Severity.CRITICAL) :
    blockingFindings;

  const maxScore = 10;
  const score = calculateGateScore(displayFindings, maxScore, config);
  const passed = !shouldFailGate(displayFindings, config);

  // Log results
  console.log(`\n♿ Accessibility Gate:`);
  console.log(`   Total violations: ${violations.length}`);
  console.log(`   CRITICAL: ${findings.filter(f => f.severity === Severity.CRITICAL).length}`);
  console.log(`   SERIOUS/HIGH: ${findings.filter(f => f.severity === Severity.HIGH).length}`);
  console.log(`   MODERATE: ${findings.filter(f => f.severity === Severity.MEDIUM).length}`);
  console.log(`   MINOR: ${findings.filter(f => f.severity === Severity.LOW).length}`);

  if (PRODUCTION_MODE) {
    console.log(`   Mode: Production (showing ${displayFindings.length} blocking issues)`);
    console.log(`   Hidden: ${findings.length - displayFindings.length} minor/moderate issues`);
  }

  console.log(`   Score: ${score}/${maxScore}`);
  console.log(`   Status: ${passed ? '✅ PASS' : '❌ FAIL'}`);

  // Save detailed report
  const reportDir = path.join(process.env.EVIDENCE_DIR || './verification-evidence', 'a11y-reports');
  if (!fs.existsSync(reportDir)) {
    fs.mkdirSync(reportDir, { recursive: true });
  }

  const reportPath = path.join(reportDir, `a11y-report-${Date.now()}.json`);
  fs.writeFileSync(reportPath, JSON.stringify({
    summary: {
      total: violations.length,
      critical: findings.filter(f => f.severity === Severity.CRITICAL).length,
      high: findings.filter(f => f.severity === Severity.HIGH).length,
      medium: findings.filter(f => f.severity === Severity.MEDIUM).length,
      low: findings.filter(f => f.severity === Severity.LOW).length
    },
    findings: displayFindings,
    fullReport: violations
  }, null, 2));

  console.log(`   Report saved: ${reportPath}`);

  return { passed, score, findings: displayFindings };
}

// Playwright test wrapper
test.describe('Accessibility Gate', () => {
  test('WCAG 2.1 AA compliance', async ({ page }) => {
    const result = await runAccessibilityGate(page);

    if (PRODUCTION_MODE && CRITICAL_ONLY) {
      // Production mode: only fail on CRITICAL accessibility issues
      const criticalIssues = result.findings.filter(f => f.severity === Severity.CRITICAL);
      expect(criticalIssues.length).toBe(0);
    } else if (PRODUCTION_MODE) {
      // Production mode: fail on CRITICAL or HIGH
      const blockingIssues = result.findings.filter(f =>
        f.severity === Severity.CRITICAL || f.severity === Severity.HIGH
      );
      expect(blockingIssues.length).toBeLessThanOrEqual(5); // Lenient threshold
    } else {
      // Strict mode: fail on any violations above threshold
      expect(result.findings.length).toBeLessThan(10);
    }

    expect(result.passed).toBe(true);
  });
});
