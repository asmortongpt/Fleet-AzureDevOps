/**
 * ESLint Scanner
 * Code quality and JavaScript/TypeScript linting
 */

import { execa } from 'execa';

import { CanonicalFinding, Severity, Location } from '../types/canonical.js';
import { logger } from '../utils/logger.js';

import { BaseScanner } from './base-scanner.js';

export interface ESLintConfig {
  enabled: boolean;
  config: string;
  ext: string[];
  timeout_ms?: number;
}

interface ESLintResult {
  filePath: string;
  messages: Array<{
    ruleId: string | null;
    severity: number;
    message: string;
    line: number;
    column: number;
    endLine?: number;
    endColumn?: number;
    fix?: {
      range: [number, number];
      text: string;
    };
  }>;
  errorCount: number;
  warningCount: number;
  fixableErrorCount: number;
  fixableWarningCount: number;
  source?: string;
}

export class ESLintScanner extends BaseScanner {
  private extensions: string[];
  private configFile: string;

  constructor(config: ESLintConfig) {
    super('eslint', config);
    this.extensions = config.ext;
    this.configFile = config.config;
  }

  async scan(targetPath: string): Promise<ESLintResult[]> {
    logger.info(`Running ESLint scan on ${targetPath}`);

    // Use absolute path for config if it's relative
    const configPath = this.configFile.startsWith('/')
      ? this.configFile
      : `${targetPath}/${this.configFile}`;

    const args = [
      '.',
      '--format=json',
      '--ext',
      this.extensions.join(','),
      '--config',
      configPath,
      '--no-error-on-unmatched-pattern',
    ];

    try {
      const { stdout, stderr } = await execa('npx', ['eslint', ...args], {
        cwd: targetPath,
        timeout: this.config.timeout_ms || 180000, // 3 minutes
        reject: false,
      });

      if (stderr && stderr.includes('Error')) {
        logger.error('ESLint stderr output', { stderr: stderr.substring(0, 500) });
      }

      if (!stdout || stdout.length === 0) {
        logger.warn('ESLint produced no output, returning empty array');
        return [];
      }

      return JSON.parse(stdout);
    } catch (error) {
      if (error instanceof Error && 'stdout' in error) {
        try {
          const stdout = (error as { stdout: string }).stdout;
          if (stdout) {
            return JSON.parse(stdout);
          }
        } catch {
          // Fall through
        }
      }

      logger.error('ESLint execution failed', { error });
      throw new Error(
        `ESLint failed: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  normalize(rawOutput: ESLintResult[]): CanonicalFinding[] {
    const findings: CanonicalFinding[] = [];

    for (const fileResult of rawOutput) {
      for (const message of fileResult.messages) {
        if (!message.ruleId) continue;

        const location: Location = {
          file: fileResult.filePath,
          line: message.line,
          column: message.column,
          endLine: message.endLine,
          endColumn: message.endColumn,
        };

        const severity = this.mapSeverity(message.severity);
        const isSecurityRule = this.isSecurityRule(message.ruleId);

        const finding: CanonicalFinding = {
          id: `eslint-${message.ruleId}-${fileResult.filePath}-${message.line}`,
          fingerprint: this.generateFingerprint({
            type: isSecurityRule ? 'security' : 'quality',
            location,
            title: message.ruleId,
          }),
          type: isSecurityRule ? 'security' : 'quality',
          severity,
          title: `ESLint: ${message.ruleId}`,
          description: message.message,
          location,
          blast_radius: 0,
          risk_score: 0,
          affected_components: [],
          remediation: {
            strategy: message.fix ? 'auto' : 'assisted',
            effort: message.fix ? 'trivial' : 'low',
            confidence: message.fix ? 'certain' : 'high',
            automated: Boolean(message.fix),
            description: message.fix
              ? 'Auto-fixable with ESLint --fix'
              : `Manual fix required for ${message.ruleId}`,
            steps: this.generateRemediationSteps(message),
            code_changes: message.fix
              ? [
                  {
                    file: fileResult.filePath,
                    operation: 'replace',
                    oldContent: '', // Would need source context
                    newContent: message.fix.text,
                    line: message.line,
                  },
                ]
              : undefined,
          },
          evidence: this.createEvidence(fileResult),
        };

        findings.push(finding);
      }
    }

    logger.info(`ESLint found ${findings.length} issues`);
    return findings;
  }

  protected getVersion(): string {
    return 'eslint-cli';
  }

  private mapSeverity(eslintSeverity: number): Severity {
    // ESLint: 1 = warning, 2 = error
    return eslintSeverity === 2 ? 'medium' : 'low';
  }

  private isSecurityRule(ruleId: string): boolean {
    const securityRules = [
      'security/',
      'no-eval',
      'no-implied-eval',
      'no-new-func',
      'no-script-url',
      '@typescript-eslint/no-implied-eval',
    ];

    return securityRules.some((pattern) => ruleId.includes(pattern));
  }

  private generateRemediationSteps(message: any): string[] {
    if (message.fix) {
      return [
        'Run: npm run lint:fix',
        'Verify the automatic fix is correct',
        'Run tests to ensure no regressions',
      ];
    }

    return [
      `Review ESLint rule: ${message.ruleId}`,
      'Apply recommended fix manually',
      'Run: npm run lint to verify',
      'Run tests to ensure no regressions',
    ];
  }
}
