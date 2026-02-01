/**
 * Axe-Core Accessibility Testing Configuration
 *
 * Initializes axe-core for automated accessibility testing in development mode
 * Provides real-time WCAG 2.1 AA compliance checking
 */

import React from 'react';
import ReactDOM from 'react-dom';
import logger from '@/utils/logger';

let axeInitialized = false;

/**
 * Initialize axe-core in development mode
 * Runs automated accessibility checks on every render
 */
export async function initializeAxe() {
  if (
    import.meta.env.DEV &&
    !axeInitialized &&
    typeof window !== 'undefined'
  ) {
    try {
      const axe = await import('@axe-core/react');

      // Configure axe-core - Run rules that match WCAG 2.1 Level AA
      await axe.default(React, ReactDOM, 1000, {
        runOnly: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice'],
      });

      axeInitialized = true;
      logger.info(
        '%c[Accessibility] Axe-core initialized - WCAG 2.1 AA compliance checking enabled',
        'color: #16a34a; font-weight: bold;'
      );
    } catch (error) {
      logger.error('[Accessibility] Failed to initialize axe-core:', error);
    }
  }
}

/**
 * Run axe-core audit manually on a specific element
 */
export async function runAccessibilityAudit(
  element: HTMLElement = document.body
): Promise<{
  violations: any[];
  passes: any[];
  incomplete: any[];
  summary: {
    total: number;
    critical: number;
    serious: number;
    moderate: number;
    minor: number;
  };
}> {
  try {
    const axe = await import('axe-core');

    const results = await axe.default.run(element, {
      runOnly: {
        type: 'tag',
        values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'],
      },
    });

    // Calculate summary
    const summary = {
      total: results.violations.length,
      critical: results.violations.filter((v) => v.impact === 'critical').length,
      serious: results.violations.filter((v) => v.impact === 'serious').length,
      moderate: results.violations.filter((v) => v.impact === 'moderate').length,
      minor: results.violations.filter((v) => v.impact === 'minor').length,
    };

    return {
      violations: results.violations,
      passes: results.passes,
      incomplete: results.incomplete,
      summary,
    };
  } catch (error) {
    logger.error('[Accessibility] Audit failed:', error);
    throw error;
  }
}

/**
 * Generate a detailed accessibility report
 */
export function generateAccessibilityReport(auditResults: Awaited<ReturnType<typeof runAccessibilityAudit>>): string {
  const { violations, passes, incomplete, summary } = auditResults;

  let report = `# WCAG 2.1 AA Accessibility Audit Report\n\n`;
  report += `Generated: ${new Date().toISOString()}\n\n`;
  report += `## Summary\n\n`;
  report += `- **Total Violations:** ${summary.total}\n`;
  report += `- **Critical:** ${summary.critical}\n`;
  report += `- **Serious:** ${summary.serious}\n`;
  report += `- **Moderate:** ${summary.moderate}\n`;
  report += `- **Minor:** ${summary.minor}\n`;
  report += `- **Passes:** ${passes.length}\n`;
  report += `- **Needs Review:** ${incomplete.length}\n\n`;

  if (summary.total === 0) {
    report += `## ✅ No Violations Found\n\n`;
    report += `Congratulations! Your application meets WCAG 2.1 AA standards.\n\n`;
  } else {
    report += `## ❌ Violations\n\n`;

    // Group by impact
    const byImpact = {
      critical: violations.filter((v) => v.impact === 'critical'),
      serious: violations.filter((v) => v.impact === 'serious'),
      moderate: violations.filter((v) => v.impact === 'moderate'),
      minor: violations.filter((v) => v.impact === 'minor'),
    };

    for (const [impact, items] of Object.entries(byImpact)) {
      if (items.length === 0) continue;

      report += `### ${impact.toUpperCase()} (${items.length})\n\n`;

      for (const violation of items) {
        report += `#### ${violation.id}: ${violation.help}\n\n`;
        report += `- **Description:** ${violation.description}\n`;
        report += `- **WCAG:** ${violation.tags.filter((t: string) => t.startsWith('wcag')).join(', ')}\n`;
        report += `- **Affected Elements:** ${violation.nodes.length}\n`;
        report += `- **Learn More:** ${violation.helpUrl}\n\n`;

        // Show first 3 affected elements
        const nodesToShow = violation.nodes.slice(0, 3);
        report += `**Examples:**\n\n`;
        for (const node of nodesToShow) {
          report += `\`\`\`html\n${node.html}\n\`\`\`\n\n`;
          if (node.failureSummary) {
            report += `*Issue:* ${node.failureSummary}\n\n`;
          }
        }

        if (violation.nodes.length > 3) {
          report += `*...and ${violation.nodes.length - 3} more*\n\n`;
        }

        report += `---\n\n`;
      }
    }
  }

  if (incomplete.length > 0) {
    report += `## ⚠️ Needs Manual Review (${incomplete.length})\n\n`;
    report += `These items require manual testing to determine compliance:\n\n`;

    for (const item of incomplete) {
      report += `- **${item.id}:** ${item.help}\n`;
      report += `  - ${item.description}\n`;
      report += `  - Affected elements: ${item.nodes.length}\n\n`;
    }
  }

  report += `## ✅ Passed Checks (${passes.length})\n\n`;
  report += `The following accessibility rules passed:\n\n`;

  const passedByCategory = new Set(
    passes.flatMap((p: any) => p.tags.filter((t: string) => t.startsWith('wcag')))
  );
  for (const tag of Array.from(passedByCategory).sort()) {
    report += `- ${tag}\n`;
  }

  return report;
}

/**
 * Log accessibility violations to console with formatting
 */
export function logAccessibilityViolations(violations: any[]) {
  if (violations.length === 0) {
    logger.info(
      '%c✅ No accessibility violations found',
      'color: #16a34a; font-weight: bold; font-size: 14px;'
    );
    return;
  }

  console.group(
    `%c⚠️ ${violations.length} Accessibility Violations Found`,
    'color: #dc2626; font-weight: bold; font-size: 14px;'
  );

  for (const violation of violations) {
    console.group(
      `%c${violation.impact.toUpperCase()}: ${violation.help}`,
      `color: ${violation.impact === 'critical' || violation.impact === 'serious' ? '#dc2626' : '#f59e0b'}; font-weight: bold;`
    );

    logger.info('Description:', violation.description);
    logger.info('WCAG Tags:', violation.tags.filter((t: string) => t.startsWith('wcag')));
    logger.info('Affected Elements:', violation.nodes.length);
    logger.info('Help:', violation.helpUrl);

    console.groupCollapsed('Affected Elements');
    for (const node of violation.nodes) {
      logger.info(node.html);
      if (node.failureSummary) {
        logger.info('Issue:', node.failureSummary);
      }
    }
    console.groupEnd();

    console.groupEnd();
  }

  console.groupEnd();
}
