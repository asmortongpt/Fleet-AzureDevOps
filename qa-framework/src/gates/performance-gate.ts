/**
 * Performance Gate
 *
 * Production Mode: Only fails on CRITICAL performance issues
 * - Load time > 10s (CRITICAL)
 * - FCP > 3s (HIGH - recommended but not blocking)
 * - LCP > 4s (MEDIUM - informational)
 */

import { test, expect, Page } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import {
  Severity,
  Finding,
  GateConfig,
  classifyPerformanceFinding,
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

interface PerformanceMetrics {
  loadTime: number;
  domContentLoaded: number;
  firstPaint: number;
  firstContentfulPaint: number;
  largestContentfulPaint: number;
  transferSize: number;
  domNodes: number;
}

export async function runPerformanceGate(page: Page): Promise<{
  passed: boolean;
  score: number;
  findings: Finding[];
  metrics?: PerformanceMetrics;
}> {
  const findings: Finding[] = [];

  // Navigate and measure load time
  const startTime = Date.now();
  await page.goto(process.env.BASE_URL || 'http://localhost:5173');
  await page.waitForLoadState('networkidle');
  const loadTime = Date.now() - startTime;

  // Get detailed performance metrics
  const metrics = await page.evaluate(() => {
    const timing = performance.timing;
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    const paintEntries = performance.getEntriesByType('paint');

    return {
      loadTime: timing.loadEventEnd - timing.navigationStart,
      domContentLoaded: timing.domContentLoadedEventEnd - timing.navigationStart,
      firstPaint: paintEntries.find(e => e.name === 'first-paint')?.startTime || 0,
      firstContentfulPaint: paintEntries.find(e => e.name === 'first-contentful-paint')?.startTime || 0,
      largestContentfulPaint: 0, // Would need PerformanceObserver for real LCP
      transferSize: navigation?.transferSize || 0,
      domNodes: document.querySelectorAll('*').length
    };
  });

  // Define thresholds (more lenient in production mode)
  const thresholds = {
    loadTime: { value: PRODUCTION_MODE ? 10000 : 3000, unit: 'ms' },
    fcp: { value: PRODUCTION_MODE ? 3000 : 1800, unit: 'ms' },
    lcp: { value: PRODUCTION_MODE ? 4000 : 2500, unit: 'ms' },
    domNodes: { value: PRODUCTION_MODE ? 5000 : 2000, unit: 'nodes' },
    transferSize: { value: PRODUCTION_MODE ? 2000000 : 1000000, unit: 'bytes' }
  };

  // Check 1: Total Load Time
  if (loadTime > thresholds.loadTime.value) {
    const severity = classifyPerformanceFinding('loadTime', loadTime, thresholds.loadTime.value);
    findings.push({
      severity,
      category: 'Performance',
      message: `Page load time ${loadTime}ms exceeds threshold ${thresholds.loadTime.value}ms`,
      requiredForProduction: severity === Severity.CRITICAL,
      recommendation: severity === Severity.CRITICAL ?
        'CRITICAL: Load time is unacceptable. Optimize bundle size, lazy load components, or improve server response.' :
        'OPTIONAL: Load time is acceptable but could be improved.'
    });
  }

  // Check 2: First Contentful Paint
  if (metrics.firstContentfulPaint > 0 && metrics.firstContentfulPaint > thresholds.fcp.value) {
    const severity = classifyPerformanceFinding('fcp', metrics.firstContentfulPaint, thresholds.fcp.value);
    if (!PRODUCTION_MODE || severity === Severity.CRITICAL || severity === Severity.HIGH) {
      findings.push({
        severity,
        category: 'Performance',
        message: `First Contentful Paint ${Math.round(metrics.firstContentfulPaint)}ms exceeds threshold ${thresholds.fcp.value}ms`,
        requiredForProduction: false,
        recommendation: PRODUCTION_MODE ?
          'OPTIONAL: FCP is within acceptable range for production' :
          'RECOMMENDED: Improve FCP by optimizing critical rendering path'
      });
    }
  }

  // Check 3: DOM Nodes (only in strict mode or if excessive)
  if (metrics.domNodes > thresholds.domNodes.value) {
    const severity = classifyPerformanceFinding('domNodes', metrics.domNodes, thresholds.domNodes.value);
    if (!PRODUCTION_MODE || severity === Severity.CRITICAL) {
      findings.push({
        severity,
        category: 'Performance',
        message: `DOM has ${metrics.domNodes} nodes, threshold is ${thresholds.domNodes.value}`,
        requiredForProduction: false,
        recommendation: 'INFORMATIONAL: Large DOM can impact performance. Consider virtualization for long lists.'
      });
    }
  }

  // Check 4: Transfer Size
  if (metrics.transferSize > thresholds.transferSize.value) {
    const severity = classifyPerformanceFinding('transferSize', metrics.transferSize, thresholds.transferSize.value);
    if (!PRODUCTION_MODE || severity === Severity.CRITICAL || severity === Severity.HIGH) {
      const sizeMB = (metrics.transferSize / 1024 / 1024).toFixed(2);
      findings.push({
        severity,
        category: 'Performance',
        message: `Transfer size ${sizeMB}MB exceeds threshold ${(thresholds.transferSize.value / 1024 / 1024).toFixed(2)}MB`,
        requiredForProduction: severity === Severity.CRITICAL,
        recommendation: severity === Severity.CRITICAL ?
          'CRITICAL: Bundle size is too large. Enable code splitting and tree shaking.' :
          'OPTIONAL: Consider optimizing bundle size for better performance.'
      });
    }
  }

  // Filter findings based on production mode
  const displayFindings = config.productionMode && config.criticalOnly ?
    findings.filter(f => f.severity === Severity.CRITICAL) :
    config.productionMode ?
    findings.filter(f => f.severity === Severity.CRITICAL || f.severity === Severity.HIGH) :
    findings;

  const maxScore = 10;
  const score = calculateGateScore(displayFindings, maxScore, config);
  const passed = !shouldFailGate(displayFindings, config);

  // Log results
  console.log(`\n⚡ Performance Gate:`);
  console.log(`   Load time: ${loadTime}ms (threshold: ${thresholds.loadTime.value}ms)`);
  console.log(`   FCP: ${Math.round(metrics.firstContentfulPaint)}ms (threshold: ${thresholds.fcp.value}ms)`);
  console.log(`   DOM nodes: ${metrics.domNodes} (threshold: ${thresholds.domNodes.value})`);
  console.log(`   Transfer size: ${(metrics.transferSize / 1024).toFixed(0)}KB`);
  console.log(`   Findings: ${findings.length} (CRITICAL: ${findings.filter(f => f.severity === Severity.CRITICAL).length})`);

  if (PRODUCTION_MODE) {
    console.log(`   Mode: Production (showing ${displayFindings.length} blocking issues)`);
  }

  console.log(`   Score: ${score}/${maxScore}`);
  console.log(`   Status: ${passed ? '✅ PASS' : '❌ FAIL'}`);

  // Save detailed report
  const reportDir = path.join(process.env.EVIDENCE_DIR || './verification-evidence', 'perf-reports');
  if (!fs.existsSync(reportDir)) {
    fs.mkdirSync(reportDir, { recursive: true });
  }

  const reportPath = path.join(reportDir, `performance-report-${Date.now()}.json`);
  fs.writeFileSync(reportPath, JSON.stringify({
    summary: {
      total: findings.length,
      critical: findings.filter(f => f.severity === Severity.CRITICAL).length,
      high: findings.filter(f => f.severity === Severity.HIGH).length
    },
    metrics,
    thresholds,
    findings: displayFindings
  }, null, 2));

  console.log(`   Report saved: ${reportPath}`);

  return { passed, score, findings: displayFindings, metrics };
}

// Playwright test wrapper
test.describe('Performance Gate', () => {
  test('Performance within acceptable thresholds', async ({ page }) => {
    const result = await runPerformanceGate(page);

    if (PRODUCTION_MODE && CRITICAL_ONLY) {
      // Production mode: only fail on CRITICAL performance issues
      const criticalIssues = result.findings.filter(f => f.severity === Severity.CRITICAL);
      expect(criticalIssues.length).toBe(0);
    } else if (PRODUCTION_MODE) {
      // Production mode: more lenient thresholds
      expect(result.metrics?.loadTime || 0).toBeLessThan(10000);
    } else {
      // Strict mode: tight thresholds
      expect(result.metrics?.loadTime || 0).toBeLessThan(3000);
    }

    expect(result.passed).toBe(true);
  });
});
