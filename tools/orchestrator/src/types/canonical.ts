/**
 * Canonical Finding Schema
 * All scanner outputs normalized to this format
 */

export type FindingType = 'security' | 'quality' | 'dependency' | 'architecture' | 'test' | 'performance';
export type Severity = 'critical' | 'high' | 'medium' | 'low' | 'info';
export type RemediationStrategy = 'auto' | 'assisted' | 'manual' | 'accept' | 'defer';
export type RemediationEffort = 'trivial' | 'low' | 'medium' | 'high' | 'extreme';
export type RemediationConfidence = 'certain' | 'high' | 'medium' | 'low' | 'uncertain';

export interface Location {
  file: string;
  line?: number;
  column?: number;
  endLine?: number;
  endColumn?: number;
  snippet?: string;
}

export interface Remediation {
  strategy: RemediationStrategy;
  effort: RemediationEffort;
  confidence: RemediationConfidence;
  automated: boolean;
  description: string;
  steps?: string[];
  code_changes?: CodeChange[];
}

export interface CodeChange {
  file: string;
  operation: 'replace' | 'insert' | 'delete' | 'rename';
  oldContent?: string;
  newContent?: string;
  line?: number;
}

export interface Evidence {
  scanner: string;
  timestamp: string;
  raw_output: any;
  scan_id?: string;
  scan_version?: string;
}

export interface CanonicalFinding {
  id: string;
  fingerprint: string;
  type: FindingType;
  severity: Severity;
  title: string;
  description: string;
  location: Location;

  // Security specific
  cwe?: string;
  cve?: string;
  cvss?: number;
  owasp?: string[];

  // Dependency specific
  package_name?: string;
  current_version?: string;
  fixed_version?: string;

  // Analysis
  blast_radius: number;
  risk_score: number;
  affected_components: string[];

  // Remediation
  remediation: Remediation;

  // Audit trail
  evidence: Evidence;

  // Correlation
  related_findings?: string[];
  cluster_id?: string;
}

export interface RiskCluster {
  id: string;
  findings: CanonicalFinding[];
  aggregate_risk_score: number;
  root_cause?: string;
  blast_radius: number;
  affected_components: string[];
  priority: number;
  remediation_strategy: string;
}

export interface ArchitectureNode {
  id: string;
  type: 'file' | 'component' | 'service' | 'dependency' | 'test';
  name: string;
  path?: string;
  dependencies: string[];
  dependents: string[];
  findings: string[];
  risk_score: number;
  criticality: number;
}

export interface DependencyGraph {
  nodes: Record<string, ArchitectureNode>;
  edges: Array<{ from: string; to: string; type: string }>;
}

export interface RemediationBacklog {
  version: string;
  timestamp: string;
  total_findings: number;
  by_severity: Record<Severity, number>;
  by_type: Record<FindingType, number>;
  clusters: RiskCluster[];
  findings: CanonicalFinding[];
  estimated_effort: string;
  auto_remediable: number;
}

export interface ChiefArchitectReport {
  executive_summary: {
    overall_score: number;
    security_posture: string;
    architecture_grade: string;
    code_quality_grade: string;
    test_coverage: number;
    critical_findings: number;
    auto_fixable: number;
  };

  key_recommendations: Array<{
    priority: number;
    category: string;
    title: string;
    description: string;
    impact: string;
    effort: RemediationEffort;
  }>;

  security_analysis: {
    vulnerabilities: number;
    secrets_exposed: number;
    authentication_issues: number;
    authorization_issues: number;
    injection_vectors: number;
  };

  architecture_analysis: {
    coupling_score: number;
    modularity_score: number;
    maintainability_index: number;
    technical_debt_ratio: number;
    design_patterns_used: string[];
    antipatterns_found: string[];
  };

  code_quality: {
    eslint_errors: number;
    typescript_errors: number;
    code_smells: number;
    duplications: number;
    complexity_hotspots: string[];
  };

  testing: {
    unit_coverage: number;
    integration_coverage: number;
    e2e_coverage: number;
    untested_critical_paths: string[];
  };

  dependencies: {
    total: number;
    outdated: number;
    vulnerable: number;
    high_risk: string[];
  };

  blast_radius_map: Record<string, number>;

  remediation_roadmap: Array<{
    phase: number;
    name: string;
    goals: string[];
    clusters: string[];
    estimated_days: number;
  }>;
}

export interface GateDefinition {
  name: string;
  type: 'security' | 'quality' | 'test' | 'build' | 'deploy';
  command: string;
  threshold?: {
    max_errors?: number;
    min_coverage?: number;
    max_vulnerabilities?: Record<Severity, number>;
  };
  required: boolean;
  timeout_ms: number;
}

export interface GateResult {
  gate: string;
  passed: boolean;
  timestamp: string;
  duration_ms: number;
  output: string;
  errors?: string[];
  metrics?: Record<string, number>;
}

export interface VerificationReport {
  timestamp: string;
  gates: GateResult[];
  all_passed: boolean;
  failed_gates: string[];
  artifacts: string[];
}
