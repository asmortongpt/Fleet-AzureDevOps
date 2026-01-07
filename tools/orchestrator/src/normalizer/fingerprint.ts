/**
 * Fingerprint Generator - Create stable fingerprints for findings
 */

import crypto from 'crypto';

import { CanonicalFinding, Location } from '../types/canonical.js';

/**
 * Generate a stable fingerprint for a finding
 */
export function generateFingerprint(finding: Partial<CanonicalFinding>): string {
  const components: string[] = [];

  // Type and severity
  if (finding.type) components.push(finding.type);
  if (finding.severity) components.push(finding.severity);

  // Location
  if (finding.location) {
    components.push(normalizeLocation(finding.location));
  }

  // Title or rule ID
  if (finding.title) components.push(finding.title);

  // Package information for dependencies
  if (finding.package_name) {
    components.push(finding.package_name);
    if (finding.cve) components.push(finding.cve);
  }

  // CVE/CWE for security findings
  if (finding.cve) components.push(finding.cve);
  if (finding.cwe) components.push(finding.cwe);

  // Create hash
  const key = components.join('::');
  return crypto.createHash('sha256').update(key).digest('hex').substring(0, 16);
}

/**
 * Normalize location to a stable string
 */
function normalizeLocation(location: Location): string {
  const parts: string[] = [];

  // Use relative path
  if (location.file) {
    parts.push(location.file.replace(/^\/.*\/Fleet\//, ''));
  }

  // Line number (column can vary)
  if (location.line) {
    parts.push(`L${location.line}`);
  }

  return parts.join(':');
}

/**
 * Check if two findings are likely duplicates
 */
export function areFindingsSimilar(f1: CanonicalFinding, f2: CanonicalFinding): boolean {
  // Same fingerprint = definite duplicate
  if (f1.fingerprint === f2.fingerprint) {
    return true;
  }

  // Check for similar findings
  const sameType = f1.type === f2.type;
  const sameFile = f1.location.file === f2.location.file;
  const sameLine = Math.abs((f1.location.line || 0) - (f2.location.line || 0)) <= 5;
  const similarTitle = levenshteinSimilarity(f1.title, f2.title) > 0.8;

  return sameType && sameFile && sameLine && similarTitle;
}

/**
 * Calculate Levenshtein similarity between two strings
 */
function levenshteinSimilarity(s1: string, s2: string): number {
  const longer = s1.length > s2.length ? s1 : s2;
  const shorter = s1.length > s2.length ? s2 : s1;

  if (longer.length === 0) {
    return 1.0;
  }

  const distance = levenshteinDistance(longer, shorter);
  return (longer.length - distance) / longer.length;
}

/**
 * Calculate Levenshtein distance
 */
function levenshteinDistance(s1: string, s2: string): number {
  const costs: number[] = [];
  for (let i = 0; i <= s1.length; i++) {
    let lastValue = i;
    for (let j = 0; j <= s2.length; j++) {
      if (i === 0) {
        costs[j] = j;
      } else if (j > 0) {
        let newValue = costs[j - 1] ?? 0;
        if (s1.charAt(i - 1) !== s2.charAt(j - 1)) {
          newValue = Math.min(Math.min(newValue, lastValue), costs[j] ?? 0) + 1;
        }
        costs[j - 1] = lastValue;
        lastValue = newValue;
      }
    }
    if (i > 0) {
      costs[s2.length] = lastValue;
    }
  }
  return costs[s2.length] ?? 0;
}
