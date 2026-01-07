import { CanonicalFinding, Evidence } from '../types/canonical.js';
import * as crypto from 'crypto';

export interface ScannerConfig {
  enabled: boolean;
  timeout_ms?: number;
  args?: string[];
  env?: Record<string, string>;
}

export interface ScanResult {
  scanner: string;
  success: boolean;
  findings: CanonicalFinding[];
  raw_output: any;
  errors?: string[];
  duration_ms: number;
}

export abstract class BaseScanner {
  protected name: string;
  protected config: ScannerConfig;

  constructor(name: string, config: ScannerConfig) {
    this.name = name;
    this.config = config;
  }

  /**
   * Execute the scanner and return raw output
   */
  abstract scan(targetPath: string): Promise<any>;

  /**
   * Normalize raw scanner output to canonical findings
   */
  abstract normalize(rawOutput: any): CanonicalFinding[];

  /**
   * Generate fingerprint for deduplication
   */
  protected generateFingerprint(finding: Partial<CanonicalFinding>): string {
    const key = `${finding.type}:${finding.location?.file}:${finding.location?.line}:${finding.title}`;
    return crypto.createHash('sha256').update(key).digest('hex').substring(0, 16);
  }

  /**
   * Create evidence object
   */
  protected createEvidence(rawOutput: any): Evidence {
    return {
      scanner: this.name,
      timestamp: new Date().toISOString(),
      raw_output: rawOutput,
      scan_version: this.getVersion(),
    };
  }

  /**
   * Get scanner version
   */
  protected abstract getVersion(): string;

  /**
   * Full scan workflow
   */
  async execute(targetPath: string): Promise<ScanResult> {
    if (!this.config.enabled) {
      return {
        scanner: this.name,
        success: true,
        findings: [],
        raw_output: null,
        duration_ms: 0,
      };
    }

    const startTime = Date.now();
    try {
      const rawOutput = await this.scan(targetPath);
      const findings = this.normalize(rawOutput);

      return {
        scanner: this.name,
        success: true,
        findings,
        raw_output: rawOutput,
        duration_ms: Date.now() - startTime,
      };
    } catch (error) {
      return {
        scanner: this.name,
        success: false,
        findings: [],
        raw_output: null,
        errors: [error instanceof Error ? error.message : String(error)],
        duration_ms: Date.now() - startTime,
      };
    }
  }
}
