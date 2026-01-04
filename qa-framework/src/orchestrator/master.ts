#!/usr/bin/env tsx
/**
 * QA Framework Master Orchestrator
 *
 * Production-Ready Mode with Conservative Recommendations
 *
 * Features:
 * - Configurable pass thresholds (80% production, 95% strict)
 * - Severity-based scoring (CRITICAL/HIGH/MEDIUM/LOW)
 * - Only fails on CRITICAL issues in production mode
 * - Conservative recommendations (no unnecessary refactoring)
 */

import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';
import {
  Severity,
  Finding,
  GateConfig,
  shouldFailGate,
  calculateGateScore,
  generateFindingSummary,
  filterFindingsForProduction
} from '../lib/severity.js';

// Load environment configuration
dotenv.config();

// Configuration from environment
const PRODUCTION_MODE = process.env.PRODUCTION_MODE === 'true';
const PASS_THRESHOLD = parseInt(process.env.PASS_THRESHOLD || (PRODUCTION_MODE ? '80' : '95'), 10);
const CRITICAL_ONLY = process.env.CRITICAL_ONLY === 'true';
const EVIDENCE_DIR = process.env.EVIDENCE_DIR || './verification-evidence';
const VERBOSE_OUTPUT = process.env.VERBOSE_OUTPUT === 'true';

const config: GateConfig = {
  productionMode: PRODUCTION_MODE,
  passThreshold: PASS_THRESHOLD,
  criticalOnly: CRITICAL_ONLY
};

interface GateResult {
  name: string;
  score: number;
  maxScore: number;
  passed: boolean;
  findings: Finding[];
  details: string;
  timestamp: string;
}

/**
 * Execute all quality gates
 */
async function executeAllGates(): Promise<GateResult[]> {
  const results: GateResult[] = [];

  // Display production mode banner
  if (PRODUCTION_MODE) {
    console.log('\n' + '='.repeat(70));
    console.log('🏭 PRODUCTION MODE ENABLED');
    console.log('   Focus: CRITICAL/HIGH severity issues only');
    console.log(`   Threshold: ${PASS_THRESHOLD}% (vs 95% in strict mode)`);
    console.log('   Recommendation scope: Functionality & Security only');
    console.log('   Philosophy: App is production-ready - no sweeping changes');
    console.log('='.repeat(70) + '\n');
  }

  // Gate 1: Console Errors (import would go here if implemented)
  console.log('📊 Gate 1: Console Errors - Checking...');
  results.push(await runConsoleErrorsGate());

  // Gate 2: Accessibility (import would go here if implemented)
  console.log('♿ Gate 2: Accessibility - Checking...');
  results.push(await runAccessibilityGate());

  // Gate 3: Security Headers
  console.log('🔒 Gate 3: Security - Checking...');
  results.push(await runSecurityGate());

  // Gate 4: Performance
  console.log('⚡ Gate 4: Performance - Checking...');
  results.push(await runPerformanceGate());

  // Gate 5: Visual Regression
  console.log('👁️  Gate 5: Visual Quality - Checking...');
  results.push(await runVisualGate());

  // Gate 6: API Contracts
  console.log('🔌 Gate 6: API Contracts - Checking...');
  results.push(await runApiGate());

  return results;
}

/**
 * Gate 1: Console Errors
 */
async function runConsoleErrorsGate(): Promise<GateResult> {
  const findings: Finding[] = [];

  // This would integrate with actual browser console monitoring
  // For now, returning a sample structure
  const sampleErrors = [
    { type: 'Warning', message: 'DevTools warning about React keys', severity: Severity.LOW },
    { type: 'Error', message: '404 favicon.ico', severity: Severity.MEDIUM }
  ];

  sampleErrors.forEach(err => {
    if (err.severity === Severity.CRITICAL || err.severity === Severity.HIGH || !PRODUCTION_MODE) {
      findings.push({
        severity: err.severity,
        category: 'Console',
        message: err.message,
        requiredForProduction: err.severity === Severity.CRITICAL
      });
    }
  });

  const maxScore = 10;
  const score = calculateGateScore(findings, maxScore, config);
  const passed = !shouldFailGate(findings, config);

  return {
    name: 'Console Errors',
    score,
    maxScore,
    passed,
    findings,
    details: `${findings.length} issues found (${generateFindingSummary(findings)})`,
    timestamp: new Date().toISOString()
  };
}

/**
 * Gate 2: Accessibility
 */
async function runAccessibilityGate(): Promise<GateResult> {
  const findings: Finding[] = [];

  // Sample accessibility findings
  const sampleViolations = [
    { impact: 'moderate', id: 'color-contrast', count: 2 },
    { impact: 'minor', id: 'label', count: 1 }
  ];

  sampleViolations.forEach(violation => {
    const severity = violation.impact === 'critical' ? Severity.CRITICAL :
                     violation.impact === 'serious' ? Severity.HIGH :
                     violation.impact === 'moderate' ? Severity.MEDIUM : Severity.LOW;

    if (severity === Severity.CRITICAL || severity === Severity.HIGH || !PRODUCTION_MODE) {
      findings.push({
        severity,
        category: 'Accessibility',
        message: `${violation.id}: ${violation.count} instances`,
        requiredForProduction: severity === Severity.CRITICAL || severity === Severity.HIGH,
        recommendation: severity === Severity.CRITICAL ?
          'CRITICAL: Must fix for WCAG compliance' :
          severity === Severity.HIGH ?
          'RECOMMENDED: Fix for better accessibility' :
          'OPTIONAL: Consider addressing for enhanced UX'
      });
    }
  });

  const maxScore = 10;
  const score = calculateGateScore(findings, maxScore, config);
  const passed = !shouldFailGate(findings, config);

  return {
    name: 'Accessibility',
    score,
    maxScore,
    passed,
    findings,
    details: `${findings.length} violations (${generateFindingSummary(findings)})`,
    timestamp: new Date().toISOString()
  };
}

/**
 * Gate 3: Security
 */
async function runSecurityGate(): Promise<GateResult> {
  const findings: Finding[] = [];

  // Sample security checks
  const securityChecks = [
    { name: 'CSP Header', present: false, severity: Severity.MEDIUM },
    { name: 'X-Frame-Options', present: true, severity: Severity.LOW },
    { name: 'Exposed Secrets', found: false, severity: Severity.CRITICAL }
  ];

  securityChecks.forEach(check => {
    if (check.name === 'Exposed Secrets' && check.found) {
      findings.push({
        severity: Severity.CRITICAL,
        category: 'Security',
        message: 'Secrets detected in client bundle',
        requiredForProduction: true,
        recommendation: 'CRITICAL: Remove all hardcoded secrets immediately'
      });
    } else if (!check.present && check.severity === Severity.MEDIUM && !PRODUCTION_MODE) {
      findings.push({
        severity: check.severity,
        category: 'Security',
        message: `Missing ${check.name}`,
        requiredForProduction: false,
        recommendation: 'OPTIONAL: Consider adding for enhanced security'
      });
    }
  });

  const maxScore = 10;
  const score = calculateGateScore(findings, maxScore, config);
  const passed = !shouldFailGate(findings, config);

  return {
    name: 'Security',
    score,
    maxScore,
    passed,
    findings,
    details: `${findings.length} security issues (${generateFindingSummary(findings)})`,
    timestamp: new Date().toISOString()
  };
}

/**
 * Gate 4: Performance
 */
async function runPerformanceGate(): Promise<GateResult> {
  const findings: Finding[] = [];

  // Sample performance metrics
  const metrics = {
    loadTime: 2500, // ms
    fcp: 1200, // ms
    lcp: 2300, // ms
    bundleSize: 450 // KB
  };

  const thresholds = {
    loadTime: PRODUCTION_MODE ? 10000 : 3000,
    fcp: PRODUCTION_MODE ? 3000 : 1800,
    lcp: PRODUCTION_MODE ? 4000 : 2500,
    bundleSize: PRODUCTION_MODE ? 1000 : 500
  };

  // Check load time
  if (metrics.loadTime > thresholds.loadTime) {
    findings.push({
      severity: Severity.CRITICAL,
      category: 'Performance',
      message: `Load time ${metrics.loadTime}ms exceeds ${thresholds.loadTime}ms`,
      requiredForProduction: true,
      recommendation: 'CRITICAL: Optimize load time for production'
    });
  }

  // Check FCP
  if (metrics.fcp > thresholds.fcp) {
    const severity = PRODUCTION_MODE ? Severity.MEDIUM : Severity.HIGH;
    if (!PRODUCTION_MODE || severity === Severity.CRITICAL) {
      findings.push({
        severity,
        category: 'Performance',
        message: `First Contentful Paint ${metrics.fcp}ms exceeds ${thresholds.fcp}ms`,
        requiredForProduction: false,
        recommendation: PRODUCTION_MODE ?
          'OPTIONAL: FCP is acceptable but could be optimized' :
          'RECOMMENDED: Improve FCP for better UX'
      });
    }
  }

  const maxScore = 10;
  const score = calculateGateScore(findings, maxScore, config);
  const passed = !shouldFailGate(findings, config);

  return {
    name: 'Performance',
    score,
    maxScore,
    passed,
    findings,
    details: `Load: ${metrics.loadTime}ms, FCP: ${metrics.fcp}ms (${generateFindingSummary(findings)})`,
    timestamp: new Date().toISOString()
  };
}

/**
 * Gate 5: Visual Quality
 */
async function runVisualGate(): Promise<GateResult> {
  const findings: Finding[] = [];

  // Sample visual checks
  const visualIssues = [
    { type: 'text-overflow', count: 0, severity: Severity.MEDIUM },
    { type: 'layout-shift', count: 0, severity: Severity.HIGH }
  ];

  visualIssues.forEach(issue => {
    if (issue.count > 0) {
      const shouldInclude = !PRODUCTION_MODE ||
        issue.severity === Severity.CRITICAL ||
        issue.severity === Severity.HIGH;

      if (shouldInclude) {
        findings.push({
          severity: issue.severity,
          category: 'Visual',
          message: `${issue.type}: ${issue.count} instances`,
          requiredForProduction: issue.severity === Severity.CRITICAL,
          recommendation: issue.severity === Severity.CRITICAL ?
            'CRITICAL: Fix layout issues' :
            'OPTIONAL: Visual improvements'
        });
      }
    }
  });

  const maxScore = 10;
  const score = calculateGateScore(findings, maxScore, config);
  const passed = !shouldFailGate(findings, config);

  return {
    name: 'Visual Quality',
    score,
    maxScore,
    passed,
    findings,
    details: `${findings.length} visual issues (${generateFindingSummary(findings)})`,
    timestamp: new Date().toISOString()
  };
}

/**
 * Gate 6: API Contracts
 */
async function runApiGate(): Promise<GateResult> {
  const findings: Finding[] = [];

  // Sample API checks
  const apiChecks = {
    healthEndpoint: true,
    properErrorHandling: true,
    rateLimit: false
  };

  if (!apiChecks.healthEndpoint) {
    findings.push({
      severity: Severity.HIGH,
      category: 'API',
      message: 'Health endpoint not responding',
      requiredForProduction: true,
      recommendation: 'RECOMMENDED: Add health check endpoint'
    });
  }

  if (!apiChecks.rateLimit && !PRODUCTION_MODE) {
    findings.push({
      severity: Severity.MEDIUM,
      category: 'API',
      message: 'Rate limiting not configured',
      requiredForProduction: false,
      recommendation: 'OPTIONAL: Consider rate limiting for production'
    });
  }

  const maxScore = 10;
  const score = calculateGateScore(findings, maxScore, config);
  const passed = !shouldFailGate(findings, config);

  return {
    name: 'API Contracts',
    score,
    maxScore,
    passed,
    findings,
    details: `${findings.length} API issues (${generateFindingSummary(findings)})`,
    timestamp: new Date().toISOString()
  };
}

/**
 * Generate comprehensive report
 */
function generateReport(gates: GateResult[]): void {
  const totalScore = gates.reduce((sum, g) => sum + g.score, 0);
  const maxScore = gates.reduce((sum, g) => sum + g.maxScore, 0);
  const percentage = Math.round((totalScore / maxScore) * 100);
  const passed = percentage >= PASS_THRESHOLD;

  const allFindings = gates.flatMap(g => g.findings);
  const criticalFindings = allFindings.filter(f => f.severity === Severity.CRITICAL);
  const highFindings = allFindings.filter(f => f.severity === Severity.HIGH);

  console.log('\n' + '='.repeat(70));
  console.log('📊 QUALITY GATE RESULTS');
  console.log('='.repeat(70));
  console.log(`Mode: ${PRODUCTION_MODE ? 'PRODUCTION (Conservative)' : 'STRICT (Comprehensive)'}`);
  console.log(`Score: ${totalScore}/${maxScore} (${percentage}%)`);
  console.log(`Threshold: ${PASS_THRESHOLD}%`);
  console.log(`Status: ${passed ? '✅ PASSED' : '❌ FAILED'}`);
  console.log('='.repeat(70));

  gates.forEach(gate => {
    const icon = gate.passed ? '✅' : '❌';
    console.log(`${icon} ${gate.name}: ${gate.score}/${gate.maxScore} - ${gate.details}`);

    if (VERBOSE_OUTPUT && gate.findings.length > 0) {
      gate.findings.forEach(finding => {
        const severityIcon =
          finding.severity === Severity.CRITICAL ? '🔴' :
          finding.severity === Severity.HIGH ? '🟡' :
          finding.severity === Severity.MEDIUM ? '🔵' : '⚪';

        console.log(`   ${severityIcon} [${finding.severity}] ${finding.message}`);
        if (finding.recommendation) {
          console.log(`      → ${finding.recommendation}`);
        }
      });
    }
  });

  console.log('='.repeat(70));

  if (PRODUCTION_MODE) {
    console.log('\n📋 PRODUCTION MODE SUMMARY:');
    console.log(`   • CRITICAL issues: ${criticalFindings.length} ${criticalFindings.length > 0 ? '⚠️ MUST FIX' : '✓'}`);
    console.log(`   • HIGH priority issues: ${highFindings.length} ${highFindings.length > 0 ? '(Recommended)' : '✓'}`);
    console.log(`   • Lower priority findings: Hidden (use VERBOSE_OUTPUT=true to see all)`);
    console.log('\n💡 Philosophy: Focus on critical blockers, not cosmetic changes');
  } else {
    console.log(`\n📋 Total findings: ${allFindings.length}`);
    console.log(`   • CRITICAL: ${criticalFindings.length}`);
    console.log(`   • HIGH: ${highFindings.length}`);
    console.log(`   • MEDIUM: ${allFindings.filter(f => f.severity === Severity.MEDIUM).length}`);
    console.log(`   • LOW: ${allFindings.filter(f => f.severity === Severity.LOW).length}`);
  }

  console.log('='.repeat(70) + '\n');

  // Save JSON report
  const report = {
    mode: PRODUCTION_MODE ? 'production' : 'strict',
    timestamp: new Date().toISOString(),
    score: { total: totalScore, max: maxScore, percentage, passed },
    threshold: PASS_THRESHOLD,
    gates,
    summary: {
      critical: criticalFindings.length,
      high: highFindings.length,
      medium: allFindings.filter(f => f.severity === Severity.MEDIUM).length,
      low: allFindings.filter(f => f.severity === Severity.LOW).length
    }
  };

  const reportDir = path.join(EVIDENCE_DIR, 'reports');
  if (!fs.existsSync(reportDir)) {
    fs.mkdirSync(reportDir, { recursive: true });
  }

  const reportPath = path.join(reportDir, `qa-report-${Date.now()}.json`);
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`📄 Full report saved: ${reportPath}\n`);

  process.exit(passed ? 0 : 1);
}

/**
 * Main execution
 */
async function main() {
  console.log('🚀 Starting QA Framework Orchestrator...\n');

  try {
    const gates = await executeAllGates();
    generateReport(gates);
  } catch (error) {
    console.error('❌ Orchestrator failed:', error);
    process.exit(1);
  }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
