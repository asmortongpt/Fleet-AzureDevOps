/**
 * Test Scanner - Extract test results and coverage
 */

import fs from 'fs/promises';
import path from 'path';

import { execa } from 'execa';


import { CanonicalFinding } from '../types/canonical.js';
import { logger } from '../utils/logger.js';

import { BaseScanner } from './base-scanner.js';

export interface TestConfig {
  enabled: boolean;
  frameworks: string[];
  coverage_threshold: number;
  timeout_ms?: number;
}

export class TestScanner extends BaseScanner {
  private coverageThreshold: number;

  constructor(config: TestConfig) {
    super('tests', config);
    this.coverageThreshold = config.coverage_threshold;
  }

  async scan(targetPath: string): Promise<any> {
    logger.info(`Running test scan on ${targetPath}`);

    const results = {
      playwright: await this.runPlaywright(targetPath),
      vitest: await this.runVitest(targetPath),
      coverage: await this.readCoverage(targetPath),
    };

    return results;
  }

  normalize(rawOutput: any): CanonicalFinding[] {
    const findings: CanonicalFinding[] = [];

    // Check test failures
    if (rawOutput.playwright?.failed > 0) {
      findings.push({
        id: 'tests-playwright-failures',
        fingerprint: 'test-failures-playwright',
        type: 'test',
        severity: 'high',
        title: 'Playwright test failures',
        description: `${rawOutput.playwright.failed} Playwright tests failing`,
        location: { file: 'tests/' },
        blast_radius: 0,
        risk_score: 5,
        affected_components: [],
        remediation: {
          strategy: 'manual',
          effort: 'medium',
          confidence: 'high',
          automated: false,
          description: 'Fix failing Playwright tests',
        },
        evidence: this.createEvidence(rawOutput.playwright),
      });
    }

    // Check coverage
    if (rawOutput.coverage && rawOutput.coverage.total < this.coverageThreshold) {
      findings.push({
        id: 'tests-low-coverage',
        fingerprint: 'test-coverage-low',
        type: 'test',
        severity: 'medium',
        title: 'Test coverage below threshold',
        description: `Code coverage ${rawOutput.coverage.total}% is below ${this.coverageThreshold}%`,
        location: { file: 'coverage/' },
        blast_radius: 0,
        risk_score: 3,
        affected_components: [],
        remediation: {
          strategy: 'manual',
          effort: 'high',
          confidence: 'medium',
          automated: false,
          description: 'Add tests to increase coverage',
        },
        evidence: this.createEvidence(rawOutput.coverage),
      });
    }

    logger.info(`Test scanner found ${findings.length} issues`);
    return findings;
  }

  protected getVersion(): string {
    return '1.0.0';
  }

  private async runPlaywright(targetPath: string): Promise<any> {
    try {
      const { stdout } = await execa('npx', ['playwright', 'test', '--reporter=json'], {
        cwd: targetPath,
        timeout: this.config.timeout_ms || 600000,
        reject: false,
      });
      const result = JSON.parse(stdout || '{}');
      return {
        passed: result.stats?.expected || 0,
        failed: result.stats?.unexpected || 0,
        skipped: result.stats?.skipped || 0,
      };
    } catch (error) {
      logger.warn('Playwright tests not available');
      return { passed: 0, failed: 0, skipped: 0 };
    }
  }

  private async runVitest(targetPath: string): Promise<any> {
    try {
      const { stdout } = await execa('npx', ['vitest', 'run', '--reporter=json'], {
        cwd: targetPath,
        timeout: this.config.timeout_ms || 300000,
        reject: false,
      });
      const result = JSON.parse(stdout || '{}');
      return {
        passed: result.numPassedTests || 0,
        failed: result.numFailedTests || 0,
      };
    } catch (error) {
      logger.warn('Vitest tests not available');
      return { passed: 0, failed: 0 };
    }
  }

  private async readCoverage(targetPath: string): Promise<any> {
    try {
      const coveragePath = path.join(targetPath, 'coverage', 'coverage-summary.json');
      const data = await fs.readFile(coveragePath, 'utf-8');
      const coverage = JSON.parse(data);
      return {
        total: coverage.total?.lines?.pct || 0,
        lines: coverage.total?.lines?.pct || 0,
        branches: coverage.total?.branches?.pct || 0,
        functions: coverage.total?.functions?.pct || 0,
        statements: coverage.total?.statements?.pct || 0,
      };
    } catch (error) {
      logger.warn('Coverage data not available');
      return { total: 0 };
    }
  }
}
