/**
 * Severity Classification System for QA Framework
 *
 * Production-ready mode: Conservative recommendations
 * - CRITICAL: Blocks production (security, data loss, crashes)
 * - HIGH: Important but not blocking (performance, UX problems)
 * - MEDIUM: Nice to have (code quality, minor bugs)
 * - LOW: Optional (style, refactoring suggestions)
 */

export enum Severity {
  CRITICAL = 'CRITICAL',  // Blocks production: security vulnerabilities, data loss risks, crashes
  HIGH = 'HIGH',          // Important but not blocking: performance issues, UX problems
  MEDIUM = 'MEDIUM',      // Nice to have: code quality improvements, minor bugs
  LOW = 'LOW'             // Optional: style improvements, refactoring suggestions
}

export interface Finding {
  severity: Severity;
  category: string;
  message: string;
  recommendation?: string;
  requiredForProduction: boolean;
  location?: string;
  evidence?: string[];
}

export interface GateConfig {
  productionMode: boolean;
  passThreshold: number;
  criticalOnly: boolean;
}

/**
 * Classify console errors by severity
 */
export function classifyConsoleFinding(errorType: string, message: string): Severity {
  const critical = [
    'SecurityError',
    'CORS',
    'Authentication',
    'Authorization',
    'Database',
    'Unhandled rejection',
    'Fatal',
    'ECONNREFUSED',
    'ERR_CONNECTION_REFUSED',
    'Failed to fetch',
    'NetworkError'
  ];

  const high = [
    'TypeError',
    'ReferenceError',
    'SyntaxError',
    'RangeError',
    'Network request failed',
    'API error'
  ];

  const errorLower = errorType.toLowerCase();
  const messageLower = message.toLowerCase();

  // Check for critical patterns
  if (critical.some(c => errorLower.includes(c.toLowerCase()) || messageLower.includes(c.toLowerCase()))) {
    return Severity.CRITICAL;
  }

  // Check for high priority patterns
  if (high.some(h => errorLower.includes(h.toLowerCase()) || messageLower.includes(h.toLowerCase()))) {
    return Severity.HIGH;
  }

  // Default to medium for other errors
  return Severity.MEDIUM;
}

/**
 * Classify accessibility findings by impact
 */
export function classifyAccessibilityFinding(impact: string): Severity {
  switch(impact.toLowerCase()) {
    case 'critical':
      return Severity.CRITICAL;
    case 'serious':
      return Severity.HIGH;
    case 'moderate':
      return Severity.MEDIUM;
    default:
      return Severity.LOW;
  }
}

/**
 * Classify security findings
 */
export function classifySecurityFinding(type: string): Severity {
  const critical = [
    'exposed secret',
    'sql injection',
    'xss',
    'csrf',
    'authentication bypass',
    'insecure direct object reference'
  ];

  const high = [
    'missing security header',
    'weak password',
    'insecure configuration'
  ];

  const typeLower = type.toLowerCase();

  if (critical.some(c => typeLower.includes(c))) {
    return Severity.CRITICAL;
  }

  if (high.some(h => typeLower.includes(h))) {
    return Severity.HIGH;
  }

  return Severity.MEDIUM;
}

/**
 * Classify performance findings
 */
export function classifyPerformanceFinding(metric: string, value: number, threshold: number): Severity {
  const ratio = value / threshold;

  // More than 2x threshold is critical
  if (ratio > 2.0) {
    return Severity.CRITICAL;
  }

  // More than 1.5x threshold is high
  if (ratio > 1.5) {
    return Severity.HIGH;
  }

  // More than threshold is medium
  if (ratio > 1.0) {
    return Severity.MEDIUM;
  }

  return Severity.LOW;
}

/**
 * Production mode: only fail on CRITICAL findings
 * Strict mode: fail on any findings
 */
export function shouldFailGate(findings: Finding[], config: GateConfig): boolean {
  if (!config.productionMode) {
    // Strict mode: any finding can fail depending on gate thresholds
    return findings.length > 0;
  }

  if (config.criticalOnly) {
    // Production mode with CRITICAL_ONLY: only CRITICAL findings fail
    return findings.some(f => f.severity === Severity.CRITICAL && f.requiredForProduction);
  }

  // Production mode: CRITICAL and HIGH findings fail
  return findings.some(f =>
    (f.severity === Severity.CRITICAL || f.severity === Severity.HIGH) &&
    f.requiredForProduction
  );
}

/**
 * Calculate gate score based on findings and severity
 */
export function calculateGateScore(
  findings: Finding[],
  maxScore: number,
  config: GateConfig
): number {
  if (findings.length === 0) {
    return maxScore;
  }

  // Weight findings by severity
  const weights = {
    [Severity.CRITICAL]: config.productionMode ? 3 : 5,
    [Severity.HIGH]: config.productionMode ? 2 : 3,
    [Severity.MEDIUM]: config.productionMode ? 0.5 : 1,
    [Severity.LOW]: config.productionMode ? 0 : 0.5
  };

  const totalPenalty = findings.reduce((sum, finding) => {
    return sum + weights[finding.severity];
  }, 0);

  const score = Math.max(0, maxScore - totalPenalty);
  return Math.round(score);
}

/**
 * Generate finding summary for reporting
 */
export function generateFindingSummary(findings: Finding[]): string {
  const bySeverity = findings.reduce((acc, f) => {
    acc[f.severity] = (acc[f.severity] || 0) + 1;
    return acc;
  }, {} as Record<Severity, number>);

  const parts: string[] = [];

  if (bySeverity[Severity.CRITICAL]) {
    parts.push(`${bySeverity[Severity.CRITICAL]} CRITICAL`);
  }
  if (bySeverity[Severity.HIGH]) {
    parts.push(`${bySeverity[Severity.HIGH]} HIGH`);
  }
  if (bySeverity[Severity.MEDIUM]) {
    parts.push(`${bySeverity[Severity.MEDIUM]} MEDIUM`);
  }
  if (bySeverity[Severity.LOW]) {
    parts.push(`${bySeverity[Severity.LOW]} LOW`);
  }

  return parts.join(', ') || 'None';
}

/**
 * Filter findings based on production mode
 */
export function filterFindingsForProduction(findings: Finding[], config: GateConfig): Finding[] {
  if (!config.productionMode) {
    return findings;
  }

  if (config.criticalOnly) {
    return findings.filter(f => f.severity === Severity.CRITICAL);
  }

  // Include CRITICAL and HIGH in production mode
  return findings.filter(f =>
    f.severity === Severity.CRITICAL ||
    f.severity === Severity.HIGH
  );
}
