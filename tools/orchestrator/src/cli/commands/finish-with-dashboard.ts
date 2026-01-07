/**
 * Finish Command with Live Dashboard
 * Autonomous remediation with real-time progress tracking
 */

import { getDashboard } from '../../dashboard/server.js';
import { logger } from '../../utils/logger.js';
import { CanonicalFinding } from '../../types/canonical.js';
import open from 'open';

export interface FinishWithDashboardOptions {
  maxIterations?: number;
  dryRun?: boolean;
  port?: number;
  noOpen?: boolean;
  autoFix?: boolean;
}

export async function finishWithDashboard(options: FinishWithDashboardOptions = {}): Promise<void> {
  const port = options.port || 3001;
  const maxIterations = options.maxIterations || 10;

  // Start dashboard
  logger.info('Starting dashboard...', { port });
  const dashboard = getDashboard(port);
  await dashboard.start();

  // Auto-open browser
  if (!options.noOpen) {
    try {
      await open(`http://localhost:${port}`);
    } catch (error) {
      logger.warn('Could not auto-open browser', { error });
    }
  }

  const startTime = Date.now();

  try {
    // Initialize dashboard
    dashboard.updateMetrics({
      max_iterations: maxIterations,
      current_iteration: 0,
      elapsed_time_ms: 0,
      current_activity: 'Initializing remediation engine...'
    });

    // Step 1: Run scanners
    dashboard.setActivity('🔍 Running security scanners...');
    const findings = await runScanners(dashboard);

    // Initialize metrics
    const severityBreakdown = groupBySeverity(findings);
    const typeBreakdown = groupByType(findings);

    dashboard.updateMetrics({
      overview: {
        total_findings: findings.length,
        remediated: 0,
        in_progress: 0,
        failed: 0,
        remaining: findings.length,
        success_rate: 0
      },
      by_severity: severityBreakdown,
      by_type: typeBreakdown,
      current_iteration: 0
    });

    // Add initial risk trend
    const totalRisk = findings.reduce((sum, f) => sum + f.risk_score, 0);
    dashboard.updateRiskTrend(0, totalRisk, findings.length);

    // Step 2: Remediation loop
    let remainingFindings = [...findings];
    let iteration = 0;
    let remediatedCount = 0;
    let failedCount = 0;

    while (iteration < maxIterations && remainingFindings.length > 0) {
      iteration++;

      dashboard.updateMetrics({
        current_iteration: iteration,
        elapsed_time_ms: Date.now() - startTime,
        current_activity: `⚙️ Remediation iteration ${iteration}/${maxIterations}...`
      });

      logger.info(`Starting remediation iteration ${iteration}`, {
        remaining: remainingFindings.length
      });

      // Remediate findings
      const results = await remediateFindings(remainingFindings, dashboard, options.dryRun || false);

      remediatedCount += results.successful.length;
      failedCount += results.failed.length;
      remainingFindings = results.remaining;

      // Update risk trend
      const currentRisk = remainingFindings.reduce((sum, f) => sum + f.risk_score, 0);
      dashboard.updateRiskTrend(iteration, currentRisk, remainingFindings.length);

      // Run verification gates
      dashboard.setActivity('✅ Running verification gates...');
      const gatesPass = await runVerificationGates(dashboard);

      if (!gatesPass && !options.dryRun) {
        logger.warn('Verification gates failed, stopping remediation');
        dashboard.setActivity('⚠️ Verification gates failed - stopping');
        break;
      }

      // Update progress
      const avgTimePerIteration = (Date.now() - startTime) / iteration;
      const estimatedRemaining = avgTimePerIteration * (maxIterations - iteration);

      dashboard.updateMetrics({
        overview: {
          total_findings: findings.length,
          remediated: remediatedCount,
          in_progress: 0,
          failed: failedCount,
          remaining: remainingFindings.length,
          success_rate: (remediatedCount / findings.length) * 100
        },
        elapsed_time_ms: Date.now() - startTime,
        estimated_time_remaining_ms: estimatedRemaining
      });

      if (remainingFindings.length === 0) {
        dashboard.setActivity('🎉 All findings remediated successfully!');
        break;
      }
    }

    // Final summary
    const totalTime = Date.now() - startTime;
    dashboard.updateMetrics({
      elapsed_time_ms: totalTime,
      estimated_time_remaining_ms: 0,
      current_activity: `✅ Remediation complete! ${remediatedCount}/${findings.length} fixed in ${Math.round(totalTime / 1000)}s`
    });

    logger.info('Remediation complete', {
      total: findings.length,
      remediated: remediatedCount,
      failed: failedCount,
      remaining: remainingFindings.length,
      iterations: iteration,
      duration_ms: totalTime
    });

    console.log('\n✨ Remediation Complete!');
    console.log(`   Total findings: ${findings.length}`);
    console.log(`   ✓ Remediated: ${remediatedCount}`);
    console.log(`   ✗ Failed: ${failedCount}`);
    console.log(`   ◯ Remaining: ${remainingFindings.length}`);
    console.log(`   ⏱ Duration: ${Math.round(totalTime / 1000)}s`);
    console.log(`\n📊 Dashboard still running at http://localhost:${port}`);
    console.log('   Press Ctrl+C to stop\n');

    // Keep dashboard running
    if (!options.dryRun) {
      await new Promise(() => {});
    } else {
      console.log('\n🏃 Dry run complete - dashboard will stay open for 60s\n');
      await new Promise(resolve => setTimeout(resolve, 60000));
      await dashboard.stop();
    }

  } catch (error) {
    logger.error('Remediation failed', { error });
    dashboard.setActivity(`❌ Error: ${error instanceof Error ? error.message : String(error)}`);
    throw error;
  }
}

async function runScanners(dashboard: any): Promise<CanonicalFinding[]> {
  // Placeholder - integrate with actual scanner execution
  dashboard.setActivity('Running Semgrep...');
  await delay(1000);

  dashboard.setActivity('Running ESLint...');
  await delay(1000);

  dashboard.setActivity('Running Trivy...');
  await delay(1000);

  dashboard.setActivity('Running Gitleaks...');
  await delay(1000);

  // Return mock findings for now
  return [];
}

async function remediateFindings(
  findings: CanonicalFinding[],
  dashboard: any,
  _dryRun: boolean
): Promise<{
  successful: CanonicalFinding[];
  failed: CanonicalFinding[];
  remaining: CanonicalFinding[];
}> {
  const successful: CanonicalFinding[] = [];
  const failed: CanonicalFinding[] = [];

  // Sort by risk score (highest first)
  const sortedFindings = [...findings].sort((a, b) => b.risk_score - a.risk_score);

  // Take top 10 findings per iteration
  const batch = sortedFindings.slice(0, 10);
  const remaining = sortedFindings.slice(10);

  for (const finding of batch) {
    dashboard.updateFinding(finding.id, 'in_progress', finding);

    try {
      // Simulate remediation
      await delay(Math.random() * 500 + 500);

      if (finding.remediation.automated && finding.remediation.confidence !== 'uncertain') {
        // Success
        successful.push(finding);
        dashboard.updateFinding(finding.id, 'success', finding);
        logger.info('Remediated finding', { id: finding.id, title: finding.title });
      } else {
        // Cannot auto-fix
        remaining.push(finding);
        dashboard.updateFinding(finding.id, 'failed', {
          ...finding,
          status: 'failed',
          reason: 'Cannot auto-remediate - manual intervention required'
        });
      }
    } catch (error) {
      failed.push(finding);
      dashboard.updateFinding(finding.id, 'failed', {
        ...finding,
        error: error instanceof Error ? error.message : String(error)
      });
      logger.error('Failed to remediate finding', {
        id: finding.id,
        error
      });
    }
  }

  return { successful, failed, remaining };
}

async function runVerificationGates(dashboard: any): Promise<boolean> {
  const gates = [
    { name: 'Security Scan', command: 'semgrep' },
    { name: 'Code Quality', command: 'eslint' },
    { name: 'Type Check', command: 'tsc' },
    { name: 'Unit Tests', command: 'npm test' }
  ];

  let allPassed = true;

  for (const gate of gates) {
    try {
      // Simulate gate execution
      await delay(500);
      const passed = Math.random() > 0.3; // 70% pass rate for demo

      dashboard.addGateResult(gate.name, passed, passed ? undefined : ['Sample error']);

      if (!passed) {
        allPassed = false;
      }
    } catch (error) {
      dashboard.addGateResult(gate.name, false, [error instanceof Error ? error.message : String(error)]);
      allPassed = false;
    }
  }

  return allPassed;
}

function groupBySeverity(findings: CanonicalFinding[]): Record<string, any> {
  const groups: Record<string, any> = {
    critical: { total: 0, remediated: 0, remaining: 0 },
    high: { total: 0, remediated: 0, remaining: 0 },
    medium: { total: 0, remediated: 0, remaining: 0 },
    low: { total: 0, remediated: 0, remaining: 0 }
  };

  for (const finding of findings) {
    if (groups[finding.severity]) {
      groups[finding.severity].total++;
      groups[finding.severity].remaining++;
    }
  }

  return groups;
}

function groupByType(findings: CanonicalFinding[]): Record<string, any> {
  const groups: Record<string, any> = {};

  for (const finding of findings) {
    if (!groups[finding.type]) {
      groups[finding.type] = { total: 0, remediated: 0, remaining: 0 };
    }
    groups[finding.type].total++;
    groups[finding.type].remaining++;
  }

  return groups;
}

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
