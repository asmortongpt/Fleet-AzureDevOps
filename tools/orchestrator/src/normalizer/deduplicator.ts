/**
 * Deduplicator - Merge duplicate findings using fingerprints
 */

import { CanonicalFinding } from '../types/canonical.js';
import { logger } from '../utils/logger.js';

export interface DeduplicationResult {
  unique_findings: CanonicalFinding[];
  duplicates_removed: number;
  fingerprint_map: Map<string, CanonicalFinding[]>;
}

/**
 * Deduplicate findings by fingerprint
 */
export function deduplicateFindings(findings: CanonicalFinding[]): DeduplicationResult {
  const fingerprintMap = new Map<string, CanonicalFinding[]>();

  // Group by fingerprint
  for (const finding of findings) {
    const existing = fingerprintMap.get(finding.fingerprint) || [];
    existing.push(finding);
    fingerprintMap.set(finding.fingerprint, existing);
  }

  // Merge duplicates
  const uniqueFindings: CanonicalFinding[] = [];
  let duplicatesRemoved = 0;

  for (const [fingerprint, duplicates] of fingerprintMap.entries()) {
    if (duplicates.length === 1 && duplicates[0]) {
      uniqueFindings.push(duplicates[0]);
    } else {
      // Merge multiple findings
      const merged = mergeFindings(duplicates);
      uniqueFindings.push(merged);
      duplicatesRemoved += duplicates.length - 1;

      logger.debug(`Merged ${duplicates.length} findings with fingerprint ${fingerprint}`);
    }
  }

  logger.info(`Deduplication: ${findings.length} → ${uniqueFindings.length} (removed ${duplicatesRemoved})`);

  return {
    unique_findings: uniqueFindings,
    duplicates_removed: duplicatesRemoved,
    fingerprint_map: fingerprintMap,
  };
}

/**
 * Merge multiple findings into one
 */
function mergeFindings(findings: CanonicalFinding[]): CanonicalFinding {
  // Use the first finding as base
  const base = findings[0];
  if (!base) {
    throw new Error('Cannot merge empty findings array');
  }

  // Merge related findings
  const relatedFindingIds = new Set<string>();
  for (const finding of findings) {
    relatedFindingIds.add(finding.id);
    if (finding.related_findings) {
      finding.related_findings.forEach((id) => relatedFindingIds.add(id));
    }
  }

  // Take highest severity
  const severities = findings.map((f) => f.severity);
  const highestSeverity = selectHighestSeverity(severities);

  // Merge affected components
  const affectedComponents = new Set<string>();
  for (const finding of findings) {
    finding.affected_components.forEach((c) => affectedComponents.add(c));
  }

  return {
    ...base,
    severity: highestSeverity,
    affected_components: Array.from(affectedComponents),
    related_findings: Array.from(relatedFindingIds),
    description: `${base.description}\n\nDetected by: ${findings.map((f) => f.evidence.scanner).join(', ')}`,
  };
}

/**
 * Select the highest severity from a list
 */
function selectHighestSeverity(severities: string[]): 'critical' | 'high' | 'medium' | 'low' | 'info' {
  const priority = { critical: 5, high: 4, medium: 3, low: 2, info: 1 };

  let highest: 'critical' | 'high' | 'medium' | 'low' | 'info' = 'info';
  let highestValue = 0;

  for (const severity of severities) {
    const value = priority[severity as keyof typeof priority] || 0;
    if (value > highestValue) {
      highestValue = value;
      highest = severity as typeof highest;
    }
  }

  return highest;
}
