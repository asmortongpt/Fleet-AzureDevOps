/**
 * Risk Scorer - Calculate risk scores for findings
 */

import { CanonicalFinding, RiskCluster, Severity } from '../types/canonical.js';
import { logger } from '../utils/logger.js';

/**
 * Calculate risk scores for all findings
 */
export function calculateRiskScores(findings: CanonicalFinding[]): CanonicalFinding[] {
  logger.info('Calculating risk scores');

  return findings.map((finding) => ({
    ...finding,
    risk_score: computeRiskScore(finding),
  }));
}

/**
 * Compute risk score for a single finding
 * Formula: Severity × Exploitability × Exposure × Blast Radius × Criticality
 */
function computeRiskScore(finding: CanonicalFinding): number {
  const severityScore = getSeverityScore(finding.severity);
  const exploitabilityScore = getExploitabilityScore(finding);
  const exposureScore = getExposureScore(finding);
  const blastRadiusScore = normalizeBlastRadius(finding.blast_radius);
  const criticalityScore = getCriticalityScore(finding);

  const rawScore =
    severityScore * exploitabilityScore * exposureScore * blastRadiusScore * criticalityScore;

  // Normalize to 0-10 scale
  return Math.min(10, Math.round(rawScore * 10) / 10);
}

/**
 * Map severity to numeric score
 */
function getSeverityScore(severity: Severity): number {
  const scores = {
    critical: 1.0,
    high: 0.75,
    medium: 0.5,
    low: 0.25,
    info: 0.1,
  };
  return scores[severity] || 0.5;
}

/**
 * Calculate exploitability score
 */
function getExploitabilityScore(finding: CanonicalFinding): number {
  // Security findings are generally more exploitable
  if (finding.type === 'security') {
    if (finding.cvss) {
      return Math.min(1.0, finding.cvss / 10);
    }
    if (finding.cve || finding.cwe) {
      return 0.8;
    }
    return 0.6;
  }

  // Dependency vulnerabilities
  if (finding.type === 'dependency') {
    if (finding.fixed_version) {
      return 0.7; // Fixable vulnerabilities
    }
    return 0.5;
  }

  // Quality and test issues have lower exploitability
  return 0.3;
}

/**
 * Calculate exposure score
 */
function getExposureScore(finding: CanonicalFinding): number {
  const file = finding.location.file.toLowerCase();

  // API and authentication code is highly exposed
  if (file.includes('api') || file.includes('auth') || file.includes('login')) {
    return 1.0;
  }

  // Server-side code has high exposure
  if (file.includes('server') || file.includes('backend') || file.includes('routes')) {
    return 0.9;
  }

  // Database and middleware
  if (file.includes('database') || file.includes('middleware')) {
    return 0.85;
  }

  // Frontend code has medium exposure
  if (file.includes('component') || file.includes('page') || file.includes('ui')) {
    return 0.6;
  }

  // Utilities and helpers
  if (file.includes('util') || file.includes('helper') || file.includes('lib')) {
    return 0.5;
  }

  // Tests and config
  if (file.includes('test') || file.includes('spec') || file.includes('config')) {
    return 0.3;
  }

  return 0.5;
}

/**
 * Normalize blast radius to 0-1 scale
 */
function normalizeBlastRadius(blastRadius: number): number {
  // Log scale normalization
  if (blastRadius <= 1) return 0.1;
  if (blastRadius <= 5) return 0.3;
  if (blastRadius <= 10) return 0.5;
  if (blastRadius <= 20) return 0.7;
  if (blastRadius <= 50) return 0.9;
  return 1.0;
}

/**
 * Calculate criticality based on finding context
 */
function getCriticalityScore(finding: CanonicalFinding): number {
  let score = 0.5; // Base score

  // Critical severity findings
  if (finding.severity === 'critical') {
    score += 0.3;
  }

  // Security-related
  if (finding.type === 'security') {
    score += 0.2;
  }

  // Has CVE/CWE
  if (finding.cve || finding.cwe) {
    score += 0.15;
  }

  // OWASP Top 10
  if (finding.owasp && finding.owasp.length > 0) {
    score += 0.15;
  }

  // SQL injection (highest criticality)
  if (finding.cwe === 'CWE-89' || finding.description.toLowerCase().includes('sql injection')) {
    score += 0.3;
  }

  return Math.min(1.0, score);
}

/**
 * Cluster findings by risk and root cause
 */
export function clusterFindings(findings: CanonicalFinding[]): RiskCluster[] {
  logger.info('Clustering findings by risk');

  // Group by location and type
  const clusters = new Map<string, CanonicalFinding[]>();

  for (const finding of findings) {
    const key = `${finding.type}:${finding.location.file.split('/')[0]}`;
    const existing = clusters.get(key) || [];
    existing.push(finding);
    clusters.set(key, existing);
  }

  // Create risk clusters
  const riskClusters: RiskCluster[] = [];
  let clusterId = 1;

  for (const [_key, clusterFindings] of clusters.entries()) {
    if (clusterFindings.length === 0) continue;

    const aggregateRiskScore =
      clusterFindings.reduce((sum, f) => sum + f.risk_score, 0) / clusterFindings.length;

    const maxBlastRadius = Math.max(...clusterFindings.map((f) => f.blast_radius));

    const allComponents = new Set<string>();
    for (const finding of clusterFindings) {
      finding.affected_components.forEach((c) => allComponents.add(c));
    }

    const cluster: RiskCluster = {
      id: `cluster-${clusterId++}`,
      findings: clusterFindings.sort((a, b) => b.risk_score - a.risk_score),
      aggregate_risk_score: Math.round(aggregateRiskScore * 10) / 10,
      root_cause: inferRootCause(clusterFindings),
      blast_radius: maxBlastRadius,
      affected_components: Array.from(allComponents),
      priority: calculatePriority(clusterFindings),
      remediation_strategy: determineRemediationStrategy(clusterFindings),
    };

    riskClusters.push(cluster);
  }

  // Sort by priority
  riskClusters.sort((a, b) => b.priority - a.priority);

  logger.info(`Created ${riskClusters.length} risk clusters`);
  return riskClusters;
}

/**
 * Infer root cause for a cluster
 */
function inferRootCause(findings: CanonicalFinding[]): string {
  const types = findings.map((f) => f.type);
  const mostCommon = types.reduce(
    (acc, type) => {
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  const [primaryType] = Object.entries(mostCommon).sort((a, b) => b[1] - a[1])[0] || [];

  if (primaryType === 'dependency') {
    return 'Outdated or vulnerable dependencies';
  }
  if (primaryType === 'security') {
    return 'Security vulnerabilities in code';
  }
  if (primaryType === 'quality') {
    return 'Code quality issues';
  }
  if (primaryType === 'test') {
    return 'Insufficient test coverage';
  }

  return 'Multiple issues';
}

/**
 * Calculate priority for cluster
 */
function calculatePriority(findings: CanonicalFinding[]): number {
  const avgRisk = findings.reduce((sum, f) => sum + f.risk_score, 0) / findings.length;
  const criticalCount = findings.filter((f) => f.severity === 'critical').length;
  const highCount = findings.filter((f) => f.severity === 'high').length;

  return Math.round(avgRisk * 10 + criticalCount * 5 + highCount * 2);
}

/**
 * Determine overall remediation strategy for cluster
 */
function determineRemediationStrategy(findings: CanonicalFinding[]): string {
  const autoFixable = findings.filter((f) => f.remediation.automated).length;
  const total = findings.length;

  if (autoFixable / total > 0.7) {
    return 'Automated remediation recommended';
  }
  if (autoFixable / total > 0.3) {
    return 'Mixed: Some automated, some manual fixes required';
  }
  return 'Manual remediation required';
}
