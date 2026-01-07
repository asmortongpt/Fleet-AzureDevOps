/**
 * Trivy Scanner - Container and dependency vulnerability scanning
 */

import { execa } from 'execa';

import { CanonicalFinding, Severity } from '../types/canonical.js';
import { logger } from '../utils/logger.js';

import { BaseScanner } from './base-scanner.js';

export interface TrivyConfig {
  enabled: boolean;
  severity: string[];
  scanners: string[];
  ignore_unfixed?: boolean;
  timeout_ms?: number;
}

export class TrivyScanner extends BaseScanner {
  constructor(config: TrivyConfig) {
    super('trivy', config);
  }

  async scan(targetPath: string): Promise<any> {
    logger.info(`Running Trivy scan on ${targetPath}`);

    try {
      const { stdout } = await execa('trivy', [
        'fs',
        '--format', 'json',
        '--scanners', 'vuln,secret,config',
        '--severity', 'CRITICAL,HIGH,MEDIUM',
        targetPath
      ], {
        timeout: this.config.timeout_ms || 300000,
        reject: false,
      });

      return JSON.parse(stdout || '{}');
    } catch (error) {
      logger.warn('Trivy not available, skipping scan');
      return { Results: [] };
    }
  }

  normalize(rawOutput: any): CanonicalFinding[] {
    const findings: CanonicalFinding[] = [];

    for (const result of rawOutput.Results || []) {
      for (const vuln of result.Vulnerabilities || []) {
        const finding: CanonicalFinding = {
          id: `trivy-${vuln.VulnerabilityID}-${vuln.PkgName}`,
          fingerprint: this.generateFingerprint({
            type: 'dependency',
            title: vuln.VulnerabilityID,
          }),
          type: 'dependency',
          severity: this.mapSeverity(vuln.Severity),
          title: vuln.Title || vuln.VulnerabilityID,
          description: vuln.Description || 'Vulnerability detected',
          location: { file: result.Target || 'package.json' },
          cve: vuln.VulnerabilityID,
          cvss: vuln.CVSS?.nvd?.V3Score,
          package_name: vuln.PkgName,
          current_version: vuln.InstalledVersion,
          fixed_version: vuln.FixedVersion,
          blast_radius: 0,
          risk_score: 0,
          affected_components: [],
          remediation: {
            strategy: vuln.FixedVersion ? 'auto' : 'manual',
            effort: vuln.FixedVersion ? 'low' : 'medium',
            confidence: vuln.FixedVersion ? 'high' : 'medium',
            automated: Boolean(vuln.FixedVersion),
            description: vuln.FixedVersion
              ? `Update ${vuln.PkgName} to ${vuln.FixedVersion}`
              : 'No fix available yet',
          },
          evidence: this.createEvidence(vuln),
        };
        findings.push(finding);
      }
    }

    logger.info(`Trivy found ${findings.length} vulnerabilities`);
    return findings;
  }

  protected getVersion(): string {
    return 'trivy-cli';
  }

  private mapSeverity(trivySeverity: string): Severity {
    const map: Record<string, Severity> = {
      CRITICAL: 'critical',
      HIGH: 'high',
      MEDIUM: 'medium',
      LOW: 'low',
    };
    return map[trivySeverity] || 'low';
  }
}
