/**
 * Type Definitions for Incident Response System
 *
 * Comprehensive type definitions for all incident response components.
 */

// ============================================================================
// Core Incident Types
// ============================================================================

export type IncidentPriority = 'P0' | 'P1' | 'P2' | 'P3';
export type IncidentCategory =
  | 'security_breach'
  | 'system_outage'
  | 'performance_degradation'
  | 'policy_violation'
  | 'suspicious_activity'
  | 'other';

export type IncidentStatus =
  | 'open'
  | 'triaged'
  | 'in_progress'
  | 'contained'
  | 'resolved'
  | 'closed'
  | 'escalated'
  | 'awaiting_approval';

export interface Incident {
  id?: string;
  title: string;
  description?: string;
  source?: string;
  severity?: string;
  detectedAt?: Date;
  metadata?: Record<string, any>;
}

// ============================================================================
// Triage Types
// ============================================================================

export interface SeverityIndicators {
  systemDown: boolean;
  dataBreach: boolean;
  multipleSystemsAffected: boolean;
  privilegeEscalation: boolean;
  activeExploitation: boolean;
  publicFacing: boolean;
  productionEnvironment: boolean;
  regulatoryImpact: boolean;
}

export interface ImpactAssessment {
  usersAffected: number;
  systemsAffected: number;
  dataAtRisk: boolean;
  reputationImpact: boolean;
  financialImpact: boolean;
  businessContinuityThreat: boolean;
}

export interface TriageResult {
  priority: IncidentPriority;
  category: IncidentCategory;
  severityScore: number;
  impactScore: number;
  indicators: SeverityIndicators;
  impact: ImpactAssessment;
  recommendedActions: string[];
  estimatedTTR: number; // Time to resolve in minutes
  requiresImmediateAction: boolean;
  autoRemediationAvailable: boolean;
  timestamp: Date;
}

// ============================================================================
// Playbook Types
// ============================================================================

export type PlaybookActionType =
  | 'notification'
  | 'containment'
  | 'investigation'
  | 'remediation'
  | 'monitoring'
  | 'documentation';

export interface PlaybookAction {
  id: string;
  name: string;
  type: PlaybookActionType;
  description: string;
  requiresApproval: boolean;
  automated: boolean;
  timeout: number; // milliseconds
}

export interface Playbook {
  id: string;
  name: string;
  category: IncidentCategory;
  description: string;
  actions: PlaybookAction[];
  successCriteria: string[];
  requiresHumanOversight: boolean;
}

export interface PlaybookResult {
  playbookId: string;
  playbookName: string;
  success: boolean;
  executedActions: Array<{
    actionId: string;
    actionName: string;
    success: boolean;
    error?: string;
    timestamp: Date;
  }>;
  requiresContainment: boolean;
  autoRemediationAvailable: boolean;
  requiresHumanIntervention: boolean;
  executionTime: number;
  timestamp: Date;
  actions?: ResponseAction[];
}

// ============================================================================
// Containment Types
// ============================================================================

export interface ContainmentStrategy {
  id: string;
  name: string;
  description: string;
  requiresApproval: boolean;
  rollbackAvailable: boolean;
  estimatedImpact: 'low' | 'medium' | 'high';
}

export interface ContainmentAction {
  strategyId: string;
  strategyName: string;
  success: boolean;
  requiresApproval: boolean;
  rollbackAvailable: boolean;
  details: string;
  timestamp: Date;
  executionTime: number;
}

export interface ContainmentResult {
  success: boolean;
  actions: ContainmentAction[];
  containmentTime: number;
  systemsIsolated: number;
  credentialsRevoked: number;
  ipsBlocked: number;
  rollbackAvailable: boolean;
  timestamp: Date;
}

// ============================================================================
// Remediation Types
// ============================================================================

export interface RemediationStrategy {
  id: string;
  name: string;
  description: string;
  automated: boolean;
  requiresApproval: boolean;
  rollbackAvailable: boolean;
  estimatedDuration: number; // milliseconds
}

export interface RemediationAction {
  strategyId: string;
  strategyName: string;
  success: boolean;
  requiresApproval: boolean;
  rollbackAvailable: boolean;
  details: string;
  timestamp: Date;
  executionTime: number;
}

export interface RemediationResult {
  success: boolean;
  actions: RemediationAction[];
  remediationTime: number;
  patchesApplied: number;
  servicesRestarted: number;
  configurationsRestored: number;
  verified: boolean;
  requiresVerification: boolean;
  rollbackAvailable: boolean;
  timestamp: Date;
}

// ============================================================================
// Response Types
// ============================================================================

export interface ResponseAction {
  type: string;
  description: string;
  timestamp: Date;
  success: boolean;
  error?: string;
}

export interface IncidentResponse {
  incidentId: string;
  incident: Incident;
  triageResult: TriageResult;
  playbookResult: PlaybookResult;
  containmentResult: ContainmentResult | null;
  remediationResult: RemediationResult | null;
  status: IncidentStatus;
  responseTime: number;
  timestamp: Date;
  actions: ResponseAction[];
}

// ============================================================================
// Metrics Types
// ============================================================================

export interface ResponseMetrics {
  totalIncidents: number;
  p0Incidents: number;
  p1Incidents: number;
  p2Incidents: number;
  p3Incidents: number;
  averageResponseTime: number;
  averageContainmentTime: number;
  averageRemediationTime: number;
  successfulRemediations: number;
  failedRemediations: number;
}

// ============================================================================
// Post-Incident Analysis Types
// ============================================================================

export interface TimelineEvent {
  timestamp: Date;
  event: string;
  description: string;
  category: 'detection' | 'triage' | 'response' | 'action' | 'containment' | 'remediation';
}

export interface RootCauseAnalysis {
  primaryCause: string;
  contributingFactors: string[];
  technicalDetails: string;
  preventable: boolean;
  similar_incidents: string[];
}

export interface LessonsLearned {
  whatWorkedWell: string[];
  whatDidntWork: string[];
  whatToImprove: string[];
}

export interface ImprovementRecommendation {
  category: 'Prevention' | 'Detection' | 'Response' | 'Recovery' | 'Monitoring';
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  recommendation: string;
  expectedImpact: string;
}

export interface PostIncidentReport {
  incidentId: string;
  incident: Incident;
  timeline: TimelineEvent[];
  rootCause: RootCauseAnalysis;
  impact: {
    severity: IncidentPriority;
    usersAffected: number;
    systemsAffected: number;
    downtime: number;
    dataAtRisk: boolean;
    financialImpact: string;
    reputationImpact: string;
    regulatoryImpact: boolean;
  };
  lessonsLearned: LessonsLearned;
  recommendations: ImprovementRecommendation[];
  effectiveness: {
    detectionSpeed: number;
    triageAccuracy: number;
    responseSpeed: number;
    containmentEffectiveness: number;
    remediationEffectiveness: number;
    overallEffectiveness: number;
  };
  mttr: number; // Mean Time To Resolve
  generatedAt: Date;
  generatedBy: string;
}
