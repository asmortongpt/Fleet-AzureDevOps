/**
 * Review Command - Run all scanners and generate reports
 */

import path from 'path';
import fs from 'fs/promises';
import ora from 'ora';
import chalk from 'chalk';
import { loadConfig } from '../../utils/config.js';
import { logger } from '../../utils/logger.js';
import { SemgrepScanner } from '../../scanners/semgrep-scanner.js';
import { ESLintScanner } from '../../scanners/eslint-scanner.js';
import { TypeScriptScanner } from '../../scanners/typescript-scanner.js';
import { TrivyScanner } from '../../scanners/trivy-scanner.js';
import { GitleaksScanner } from '../../scanners/gitleaks-scanner.js';
import { TestScanner } from '../../scanners/test-scanner.js';
import { deduplicateFindings } from '../../normalizer/deduplicator.js';
import { buildDependencyGraph } from '../../correlator/graph-builder.js';
import { calculateBlastRadius } from '../../correlator/blast-radius.js';
import { calculateRiskScores, clusterFindings } from '../../correlator/risk-scorer.js';
import { generateChiefArchitectReport } from '../../reporter/chief-architect.js';
import { CanonicalFinding } from '../../types/canonical.js';

export async function runReview(options: { config?: string; output?: string }): Promise<void> {
  const spinner = ora('Loading configuration...').start();

  try {
    // Load configuration
    const config = await loadConfig(options.config);
    const projectRoot = config.project.root;
    const outputDir = options.output || path.join(projectRoot, config.project.output_dir);

    spinner.succeed('Configuration loaded');

    // Run scanners
    const allFindings: CanonicalFinding[] = [];

    if (config.scanners.semgrep.enabled) {
      spinner.start('Running Semgrep...');
      const scanner = new SemgrepScanner(config.scanners.semgrep);
      const result = await scanner.execute(projectRoot);
      allFindings.push(...result.findings);
      spinner.succeed(`Semgrep: ${result.findings.length} findings`);
    }

    if (config.scanners.eslint.enabled) {
      spinner.start('Running ESLint...');
      const scanner = new ESLintScanner(config.scanners.eslint);
      const result = await scanner.execute(projectRoot);
      allFindings.push(...result.findings);
      spinner.succeed(`ESLint: ${result.findings.length} findings`);
    }

    if (config.scanners.typescript.enabled) {
      spinner.start('Running TypeScript...');
      const scanner = new TypeScriptScanner(config.scanners.typescript);
      const result = await scanner.execute(projectRoot);
      allFindings.push(...result.findings);
      spinner.succeed(`TypeScript: ${result.findings.length} findings`);
    }

    if (config.scanners.trivy.enabled) {
      spinner.start('Running Trivy...');
      const scanner = new TrivyScanner(config.scanners.trivy);
      const result = await scanner.execute(projectRoot);
      allFindings.push(...result.findings);
      spinner.succeed(`Trivy: ${result.findings.length} findings`);
    }

    if (config.scanners.gitleaks.enabled) {
      spinner.start('Running Gitleaks...');
      const scanner = new GitleaksScanner(config.scanners.gitleaks);
      const result = await scanner.execute(projectRoot);
      allFindings.push(...result.findings);
      spinner.succeed(`Gitleaks: ${result.findings.length} findings`);
    }

    if (config.scanners.tests.enabled) {
      spinner.start('Analyzing tests...');
      const scanner = new TestScanner(config.scanners.tests);
      const result = await scanner.execute(projectRoot);
      allFindings.push(...result.findings);
      spinner.succeed(`Tests: ${result.findings.length} issues`);
    }

    // Deduplicate findings
    spinner.start('Deduplicating findings...');
    const { unique_findings } = deduplicateFindings(allFindings);
    spinner.succeed(`Deduplicated: ${allFindings.length} → ${unique_findings.length}`);

    // Build dependency graph
    spinner.start('Building dependency graph...');
    const graph = await buildDependencyGraph(projectRoot);
    spinner.succeed(`Dependency graph: ${Object.keys(graph.nodes).length} nodes`);

    // Calculate blast radius
    spinner.start('Calculating blast radius...');
    const findingsWithBlastRadius = calculateBlastRadius(unique_findings, graph);
    spinner.succeed('Blast radius calculated');

    // Calculate risk scores
    spinner.start('Calculating risk scores...');
    const findingsWithRisk = calculateRiskScores(findingsWithBlastRadius);
    spinner.succeed('Risk scores calculated');

    // Cluster findings
    spinner.start('Clustering findings...');
    const clusters = clusterFindings(findingsWithRisk);
    spinner.succeed(`Created ${clusters.length} risk clusters`);

    // Generate reports
    spinner.start('Generating Chief Architect Report...');
    await fs.mkdir(outputDir, { recursive: true });
    await generateChiefArchitectReport(
      findingsWithRisk,
      clusters,
      path.join(outputDir, 'chief_architect_report.md')
    );
    spinner.succeed('Chief Architect Report generated');

    spinner.start('Generating remediation backlog...');
    await fs.writeFile(
      path.join(outputDir, 'remediation_backlog.json'),
      JSON.stringify(
        {
          version: '1.0',
          timestamp: new Date().toISOString(),
          total_findings: findingsWithRisk.length,
          by_severity: countBySeverity(findingsWithRisk),
          by_type: countByType(findingsWithRisk),
          clusters,
          findings: findingsWithRisk.sort((a, b) => b.risk_score - a.risk_score),
        },
        null,
        2
      )
    );
    spinner.succeed('Remediation backlog generated');

    // Summary
    console.log('\n' + chalk.bold.green('✓ Review Complete\n'));
    console.log(chalk.cyan('Summary:'));
    console.log(`  Total Findings: ${findingsWithRisk.length}`);
    console.log(`  Critical: ${findingsWithRisk.filter((f) => f.severity === 'critical').length}`);
    console.log(`  High: ${findingsWithRisk.filter((f) => f.severity === 'high').length}`);
    console.log(`  Medium: ${findingsWithRisk.filter((f) => f.severity === 'medium').length}`);
    console.log(`  Low: ${findingsWithRisk.filter((f) => f.severity === 'low').length}`);
    console.log(`\n  Risk Clusters: ${clusters.length}`);
    console.log(`  Auto-Fixable: ${findingsWithRisk.filter((f) => f.remediation.automated).length}`);
    console.log(`\n  Reports: ${outputDir}`);

    logger.info('Review completed successfully', {
      total_findings: findingsWithRisk.length,
      clusters: clusters.length,
    });
  } catch (error) {
    spinner.fail('Review failed');
    throw error;
  }
}

function countBySeverity(findings: CanonicalFinding[]): Record<string, number> {
  return findings.reduce(
    (acc, f) => {
      acc[f.severity] = (acc[f.severity] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );
}

function countByType(findings: CanonicalFinding[]): Record<string, number> {
  return findings.reduce(
    (acc, f) => {
      acc[f.type] = (acc[f.type] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );
}
