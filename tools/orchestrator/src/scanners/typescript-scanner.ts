/**
 * TypeScript Scanner
 * Type checking and compilation errors
 */

import { execa } from 'execa';

import { CanonicalFinding, Location } from '../types/canonical.js';
import { logger } from '../utils/logger.js';

import { BaseScanner } from './base-scanner.js';

export interface TypeScriptConfig {
  enabled: boolean;
  project: string;
  timeout_ms?: number;
}

interface TypeScriptDiagnostic {
  file?: string;
  start?: number;
  length?: number;
  line?: number;
  character?: number;
  messageText: string | { messageText: string; category: number; code: number };
  category: number;
  code: number;
}

export class TypeScriptScanner extends BaseScanner {
  private project: string;

  constructor(config: TypeScriptConfig) {
    super('typescript', config);
    this.project = config.project;
  }

  async scan(targetPath: string): Promise<TypeScriptDiagnostic[]> {
    logger.info(`Running TypeScript type check on ${targetPath}`);

    // Use absolute path for project if it's relative
    const projectPath = this.project.startsWith('/')
      ? this.project
      : `${targetPath}/${this.project}`;

    const args = ['tsc', '--noEmit', '--project', projectPath];

    try {
      const { stdout, stderr } = await execa('npx', args, {
        cwd: targetPath,
        timeout: this.config.timeout_ms || 180000,
        reject: false,
      });

      if (stderr && stderr.includes('error')) {
        logger.warn('TypeScript stderr output', { stderr: stderr.substring(0, 500) });
      }

      // Parse TypeScript compiler output
      return this.parseTypeScriptOutput(stdout + '\n' + stderr);
    } catch (error) {
      logger.error('TypeScript execution failed', { error });
      throw new Error(
        `TypeScript failed: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  normalize(rawOutput: TypeScriptDiagnostic[]): CanonicalFinding[] {
    const findings: CanonicalFinding[] = [];

    for (const diagnostic of rawOutput) {
      if (!diagnostic.file) continue;

      const location: Location = {
        file: diagnostic.file,
        line: diagnostic.line || 1,
        column: diagnostic.character || 1,
      };

      const message =
        typeof diagnostic.messageText === 'string'
          ? diagnostic.messageText
          : diagnostic.messageText.messageText;

      const finding: CanonicalFinding = {
        id: `typescript-${diagnostic.code}-${diagnostic.file}-${diagnostic.line}`,
        fingerprint: this.generateFingerprint({
          type: 'quality',
          location,
          title: `TS${diagnostic.code}`,
        }),
        type: 'quality',
        severity: this.mapSeverity(diagnostic.category),
        title: `TypeScript Error TS${diagnostic.code}`,
        description: message,
        location,
        blast_radius: 0,
        risk_score: 0,
        affected_components: [],
        remediation: {
          strategy: 'manual',
          effort: this.estimateEffort(diagnostic.code),
          confidence: 'high',
          automated: false,
          description: `Fix TypeScript error TS${diagnostic.code}`,
          steps: this.generateRemediationSteps(diagnostic.code),
        },
        evidence: this.createEvidence(diagnostic),
      };

      findings.push(finding);
    }

    logger.info(`TypeScript found ${findings.length} type errors`);
    return findings;
  }

  protected getVersion(): string {
    return 'typescript-cli';
  }

  private parseTypeScriptOutput(output: string): TypeScriptDiagnostic[] {
    const diagnostics: TypeScriptDiagnostic[] = [];
    const lines = output.split('\n');

    // TypeScript output format: file.ts(line,col): error TSxxxx: message
    const errorRegex = /^(.+?)\((\d+),(\d+)\): error TS(\d+): (.+)$/;

    for (const line of lines) {
      const match = line.match(errorRegex);
      if (match && match[1] && match[2] && match[3] && match[4] && match[5]) {
        diagnostics.push({
          file: match[1],
          line: parseInt(match[2], 10),
          character: parseInt(match[3], 10),
          code: parseInt(match[4], 10),
          messageText: match[5],
          category: 1, // Error
        });
      }
    }

    return diagnostics;
  }

  private mapSeverity(category: number): 'high' | 'medium' | 'low' {
    // TypeScript categories: 0 = warning, 1 = error, 2 = suggestion, 3 = message
    if (category === 1) return 'medium';
    if (category === 0) return 'low';
    return 'low';
  }

  private estimateEffort(code: number): 'trivial' | 'low' | 'medium' | 'high' | 'extreme' {
    // Common simple fixes
    const trivialCodes = [2304, 2339, 2322, 2345]; // Cannot find name, property doesn't exist, etc.
    const lowCodes = [2531, 2532, 2533]; // Object possibly null/undefined
    const mediumCodes = [2769]; // No overload matches

    if (trivialCodes.includes(code)) return 'trivial';
    if (lowCodes.includes(code)) return 'low';
    if (mediumCodes.includes(code)) return 'medium';
    return 'low';
  }

  private generateRemediationSteps(code: number): string[] {
    const commonSteps = [
      'Review the TypeScript error message',
      'Check the type definitions and interfaces',
      'Update the code to satisfy type requirements',
      'Run: npm run typecheck to verify',
      'Run tests to ensure no regressions',
    ];

    // Add code-specific guidance
    if (code === 2304) {
      return [
        'Import the missing identifier',
        'Check for typos in the identifier name',
        ...commonSteps.slice(3),
      ];
    }

    if (code === 2339) {
      return [
        'Verify the property exists on the type',
        'Add the property to the type definition if needed',
        'Use optional chaining (?.) if property may not exist',
        ...commonSteps.slice(3),
      ];
    }

    return commonSteps;
  }
}
