/**
 * Gitleaks Scanner - Secret detection
 */

import { execa } from 'execa';
import { BaseScanner } from './base-scanner.js';
import { CanonicalFinding } from '../types/canonical.js';
import { logger } from '../utils/logger.js';

export interface GitleaksConfig {
  enabled: boolean;
  config?: string;
  baseline?: string;
  timeout_ms?: number;
}

export class GitleaksScanner extends BaseScanner {
  constructor(config: GitleaksConfig) {
    super('gitleaks', config);
  }

  async scan(targetPath: string): Promise<any> {
    logger.info(`Running Gitleaks scan on ${targetPath}`);

    try {
      const { stdout } = await execa('gitleaks', [
        'detect',
        '--no-git',
        '--report-format', 'json',
        '--report-path', '/dev/stdout',
        '--source', targetPath
      ], {
        timeout: this.config.timeout_ms || 180000,
        reject: false,
      });

      return JSON.parse(stdout || '[]');
    } catch (error) {
      logger.warn('Gitleaks not available, skipping scan');
      return [];
    }
  }

  normalize(rawOutput: any[]): CanonicalFinding[] {
    const findings: CanonicalFinding[] = [];

    for (const leak of Array.isArray(rawOutput) ? rawOutput : []) {
      const finding: CanonicalFinding = {
        id: `gitleaks-${leak.RuleID}-${leak.File}-${leak.StartLine}`,
        fingerprint: this.generateFingerprint({
          type: 'security',
          location: { file: leak.File, line: leak.StartLine },
          title: leak.RuleID,
        }),
        type: 'security',
        severity: 'critical',
        title: `Secret Detected: ${leak.RuleID}`,
        description: leak.Description || 'Hardcoded secret detected',
        location: {
          file: leak.File,
          line: leak.StartLine,
          column: leak.StartColumn,
          endLine: leak.EndLine,
          endColumn: leak.EndColumn,
          snippet: leak.Secret ? '***REDACTED***' : undefined,
        },
        blast_radius: 0,
        risk_score: 10, // Secrets are always high risk
        affected_components: [],
        remediation: {
          strategy: 'manual',
          effort: 'medium',
          confidence: 'high',
          automated: false,
          description: 'Move secret to environment variable or Azure Key Vault',
          steps: [
            'Remove hardcoded secret from code',
            'Add secret to .env file (local) or Azure Key Vault (production)',
            'Update code to read from environment variable',
            'Add file to .gitignore if needed',
            'Review git history and rotate the exposed secret',
          ],
        },
        evidence: this.createEvidence(leak),
      };
      findings.push(finding);
    }

    logger.info(`Gitleaks found ${findings.length} secrets`);
    return findings;
  }

  protected getVersion(): string {
    return 'gitleaks-cli';
  }
}
