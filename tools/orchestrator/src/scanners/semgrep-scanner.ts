/**
 * Semgrep Scanner
 * SAST scanning with security rule enforcement
 */

import { execa } from 'execa';
import { BaseScanner } from './base-scanner.js';
import { CanonicalFinding, Severity, FindingType, Location } from '../types/canonical.js';
import { logger } from '../utils/logger.js';

export interface SemgrepConfig {
  enabled: boolean;
  rules: string[];
  exclude?: string[];
  timeout_ms?: number;
}

interface SemgrepResult {
  results: Array<{
    check_id: string;
    path: string;
    start: { line: number; col: number };
    end: { line: number; col: number };
    extra: {
      message: string;
      severity: string;
      metadata: {
        cwe?: string[];
        owasp?: string[];
        confidence?: string;
        impact?: string;
        likelihood?: string;
      };
      lines: string;
    };
  }>;
  errors: Array<{
    message: string;
    path?: string;
  }>;
}

export class SemgrepScanner extends BaseScanner {
  private rules: string[];
  private exclude: string[];

  constructor(config: SemgrepConfig) {
    super('semgrep', config);
    this.rules = config.rules;
    this.exclude = config.exclude || [];
  }

  async scan(targetPath: string): Promise<SemgrepResult> {
    logger.info(`Running Semgrep scan on ${targetPath}`);

    const args = [
      '--json',
      '--config',
      this.rules.join(','),
      '--metrics=off',
      '--quiet',
    ];

    // Add exclusions
    for (const pattern of this.exclude) {
      args.push('--exclude', pattern);
    }

    args.push(targetPath);

    try {
      const { stdout } = await execa('semgrep', args, {
        timeout: this.config.timeout_ms || 300000, // 5 minute default
        reject: false, // Don't throw on non-zero exit (findings present)
      });

      return JSON.parse(stdout);
    } catch (error) {
      if (error instanceof Error && 'stdout' in error) {
        // Try to parse partial output
        try {
          return JSON.parse((error as { stdout: string }).stdout);
        } catch {
          // Fall through to error
        }
      }

      logger.error('Semgrep execution failed', { error });
      throw new Error(
        `Semgrep failed: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  normalize(rawOutput: SemgrepResult): CanonicalFinding[] {
    const findings: CanonicalFinding[] = [];

    for (const result of rawOutput.results) {
      const location: Location = {
        file: result.path,
        line: result.start.line,
        column: result.start.col,
        endLine: result.end.line,
        endColumn: result.end.col,
        snippet: result.extra.lines,
      };

      const severity = this.mapSeverity(result.extra.severity);
      const type = this.inferType(result.check_id, result.extra.metadata);

      // Check for SQL injection and parameterized queries
      const isParamCheckRequired =
        result.check_id.includes('sql') ||
        result.extra.message.toLowerCase().includes('sql') ||
        result.extra.metadata.cwe?.includes('CWE-89');

      const finding: CanonicalFinding = {
        id: `semgrep-${result.check_id}-${result.path}-${result.start.line}`,
        fingerprint: this.generateFingerprint({
          type,
          location,
          title: result.check_id,
        }),
        type,
        severity,
        title: result.check_id,
        description: result.extra.message,
        location,
        cwe: result.extra.metadata.cwe?.[0],
        owasp: result.extra.metadata.owasp,
        blast_radius: 0, // Calculated by correlator
        risk_score: 0, // Calculated by correlator
        affected_components: [],
        remediation: {
          strategy: this.determineStrategy(severity, type, isParamCheckRequired),
          effort: this.estimateEffort(result.extra.metadata),
          confidence: this.mapConfidence(result.extra.metadata.confidence),
          automated: this.isAutomatable(result.check_id, type),
          description: this.generateRemediationGuidance(result, isParamCheckRequired || false),
          steps: this.generateRemediationSteps(result, isParamCheckRequired || false),
        },
        evidence: this.createEvidence(result),
      };

      findings.push(finding);
    }

    logger.info(`Semgrep found ${findings.length} issues`);
    return findings;
  }

  protected getVersion(): string {
    return 'semgrep-cli';
  }

  private mapSeverity(semgrepSeverity: string): Severity {
    const severityMap: Record<string, Severity> = {
      ERROR: 'high',
      WARNING: 'medium',
      INFO: 'low',
    };
    return severityMap[semgrepSeverity.toUpperCase()] || 'medium';
  }

  private inferType(checkId: string, metadata: any): FindingType {
    if (checkId.includes('security') || metadata.cwe) {
      return 'security';
    }
    if (checkId.includes('performance')) {
      return 'performance';
    }
    return 'quality';
  }

  private determineStrategy(
    severity: Severity,
    type: FindingType,
    requiresParamCheck?: boolean
  ): 'auto' | 'assisted' | 'manual' {
    if (requiresParamCheck === true) {
      return 'manual'; // SQL injection requires careful manual review
    }
    if (severity === 'critical' || severity === 'high') {
      return 'assisted';
    }
    if (type === 'quality') {
      return 'auto';
    }
    return 'manual';
  }

  private estimateEffort(metadata: any): 'trivial' | 'low' | 'medium' | 'high' | 'extreme' {
    const impact = metadata.impact?.toLowerCase() || '';
    const likelihood = metadata.likelihood?.toLowerCase() || '';

    if (impact === 'high' && likelihood === 'high') {
      return 'extreme';
    }
    if (impact === 'high' || likelihood === 'high') {
      return 'high';
    }
    if (impact === 'medium') {
      return 'medium';
    }
    return 'low';
  }

  private mapConfidence(confidence?: string): 'certain' | 'high' | 'medium' | 'low' | 'uncertain' {
    if (!confidence) return 'medium';
    const conf = confidence.toLowerCase();
    if (conf === 'high') return 'high';
    if (conf === 'medium') return 'medium';
    if (conf === 'low') return 'low';
    return 'uncertain';
  }

  private isAutomatable(checkId: string, type: FindingType): boolean {
    // SQL injection and security issues should not be auto-fixed
    if (checkId.includes('sql') || checkId.includes('injection')) {
      return false;
    }
    return type === 'quality';
  }

  private generateRemediationGuidance(result: any, requiresParamCheck: boolean): string {
    if (requiresParamCheck) {
      return (
        'CRITICAL: Use parameterized queries ($1, $2, $3) instead of string concatenation. ' +
        'Review all database query construction for SQL injection vulnerabilities. ' +
        'Never concatenate user input directly into SQL queries.'
      );
    }

    return `Fix ${result.check_id}: ${result.extra.message}`;
  }

  private generateRemediationSteps(result: any, requiresParamCheck: boolean): string[] {
    if (requiresParamCheck) {
      return [
        'Identify all SQL queries in the affected file',
        'Replace string concatenation with parameterized queries',
        'Use placeholders like $1, $2, $3 for all user inputs',
        'Pass user inputs as separate array to query executor',
        'Review and test all database interactions',
        'Run security scanner to verify fix',
      ];
    }

    return [
      `Review finding: ${result.check_id}`,
      'Apply recommended fix from Semgrep',
      'Run tests to verify no regressions',
      'Re-scan to confirm issue is resolved',
    ];
  }
}
