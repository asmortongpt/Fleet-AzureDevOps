/**
 * Accessibility Audit Script
 *
 * Runs a comprehensive WCAG 2.1 AA accessibility audit on the application
 * Can be run manually or integrated into CI/CD pipelines
 */

import { runAccessibilityAudit, generateAccessibilityReport, logAccessibilityViolations } from '../lib/accessibility/axe-init';
import logger from '@/utils/logger';

/**
 * Run accessibility audit and generate report
 */
export async function runAudit() {
  logger.info('🔍 Starting WCAG 2.1 AA Accessibility Audit...\n');

  try {
    // Wait for the page to be fully loaded
    if (document.readyState !== 'complete') {
      await new Promise((resolve) => {
        window.addEventListener('load', resolve);
      });
    }

    // Run the audit
    const results = await runAccessibilityAudit();

    // Log violations to console
    logAccessibilityViolations(results.violations);

    // Generate markdown report
    const report = generateAccessibilityReport(results);

    // Log summary
    logger.info('\n📊 Audit Summary:');
    logger.info(`   Total Violations: ${results.summary.total}`);
    logger.info(`   Critical: ${results.summary.critical}`);
    logger.info(`   Serious: ${results.summary.serious}`);
    logger.info(`   Moderate: ${results.summary.moderate}`);
    logger.info(`   Minor: ${results.summary.minor}`);
    logger.info(`   Passed Checks: ${results.passes.length}`);
    logger.info(`   Needs Review: ${results.incomplete.length}\n`);

    // Save report to localStorage for easy access
    if (typeof window !== 'undefined') {
      localStorage.setItem('accessibility-audit-report', report);
      localStorage.setItem('accessibility-audit-date', new Date().toISOString());
      logger.info('💾 Full report saved to localStorage (key: "accessibility-audit-report")');
    }

    // Return results for programmatic access
    return {
      passed: results.summary.total === 0,
      results,
      report,
    };
  } catch (error) {
    logger.error('❌ Accessibility audit failed:', error);
    throw error;
  }
}

/**
 * Export report to file (for browser download)
 */
export function downloadAuditReport() {
  const report = localStorage.getItem('accessibility-audit-report');
  if (!report) {
    logger.error('No audit report found. Run audit first.');
    return;
  }

  const blob = new Blob([report], { type: 'text/markdown' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `accessibility-audit-${new Date().toISOString().split('T')[0]}.md`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  logger.info('📥 Report downloaded');
}

/**
 * Make audit functions available in browser console
 */
if (typeof window !== 'undefined' && import.meta.env.DEV) {
  (window as any).runAccessibilityAudit = runAudit;
  (window as any).downloadAuditReport = downloadAuditReport;

  logger.info(
    '%c🔍 Accessibility Audit Available',
    'color: #3b82f6; font-weight: bold; font-size: 12px;'
  );
  logger.info(
    '%cRun: window.runAccessibilityAudit()',
    'color: #6b7280; font-size: 11px;'
  );
  logger.info(
    '%cDownload Report: window.downloadAuditReport()',
    'color: #6b7280; font-size: 11px;'
  );
}

// Export for use in tests
export default runAudit;
