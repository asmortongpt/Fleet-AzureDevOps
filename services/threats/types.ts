/**
 * Threat Intelligence Types and Interfaces
 */

export type ThreatLevel = 'critical' | 'high' | 'medium' | 'low' | 'clean';

export type IndicatorType = 'file_hash' | 'url' | 'ip' | 'domain' | 'email' | 'user_id' | 'session_id' | 'api_key';

export type BehavioralAnomaly = 'unusual_access_pattern' | 'privilege_escalation' | 'data_exfiltration' | 'lateral_movement' | 'credential_abuse' | 'brute_force' | 'resource_exhaustion' | 'suspicious_login';

export type HuntingRuleType = 'behavioral' | 'indicator' | 'statistical' | 'rule_based' | 'ml_based';

export interface ThreatIndicator {
  value: string;
  type: IndicatorType;
  source?: string;
  timestamp?: number;
  context?: Record<string, unknown>;
}

export interface ThreatAnalysisResult {
  indicator: string;
  type: string;
  threatLevel: ThreatLevel;
  isMalicious: boolean;
  confidence: number;
  metadata: Record<string, unknown>;
  analysisDate: Date;
  engines: {
    detected: number;
    total: number;
  };
  error?: string;
}

export interface BehaviorProfile {
  entityId: string;
  entityType: 'user' | 'api_key' | 'session' | 'device';
  timestamp: number;
  features: {
    accessFrequency: number;
    timeOfDay: number;
    geolocation?: string;
    ipAddress: string;
    deviceId?: string;
    userAgent?: string;
    apiEndpoints: string[];
    dataAccessed: string[];
    operationsPerformed: string[];
  };
  riskScore: number;
  anomalies: BehavioralAnomaly[];
}

export interface AnomalyDetectionResult {
  entityId: string;
  entityType: string;
  detected: boolean;
  anomalyType: BehavioralAnomaly;
  severity: ThreatLevel;
  confidence: number;
  description: string;
  evidence: Record<string, unknown>;
  timestamp: number;
}

export interface ThreatScore {
  entityId: string;
  entityType: string;
  overall: number; // 0-100
  factors: {
    indicators: number;
    behavioral: number;
    historical: number;
    temporal: number;
  };
  level: ThreatLevel;
  justification: string[];
  recommendations: string[];
  lastUpdated: number;
}

export interface ThreatIntelFeed {
  id: string;
  name: string;
  source: string;
  url?: string;
  type: IndicatorType;
  refreshInterval: number; // milliseconds
  enabled: boolean;
  credibility: number; // 0-100
  indicators: ThreatIndicator[];
  lastUpdated: number;
}

export interface ThreatHuntingRule {
  id: string;
  name: string;
  description: string;
  type: HuntingRuleType;
  enabled: boolean;
  query: string;
  pattern: string | Record<string, unknown>;
  threshold: number;
  timeWindow: number; // milliseconds
  indicators?: ThreatIndicator[];
  actions: ThreatHuntingAction[];
  createdAt: number;
  updatedAt: number;
}

export interface ThreatHuntingAction {
  type: 'alert' | 'quarantine' | 'block' | 'log' | 'investigate' | 'notify';
  target: 'indicator' | 'entity' | 'system';
  payload?: Record<string, unknown>;
}

export interface HuntingResult {
  ruleId: string;
  matched: boolean;
  matchCount: number;
  indicators: string[];
  entities: string[];
  severity: ThreatLevel;
  timestamp: number;
  details: Record<string, unknown>;
}

export interface ThreatNotification {
  id: string;
  timestamp: number;
  threatLevel: ThreatLevel;
  title: string;
  description: string;
  indicators: string[];
  affectedEntities: string[];
  source: string;
  actionItems: string[];
  read: boolean;
}

export interface ThreatIncident {
  id: string;
  createdAt: number;
  updatedAt: number;
  status: 'open' | 'investigating' | 'contained' | 'resolved' | 'closed';
  severity: ThreatLevel;
  title: string;
  description: string;
  indicators: ThreatIndicator[];
  affectedEntities: string[];
  rootCause?: string;
  mitigationSteps: string[];
  assignedTo?: string;
  tags: string[];
}

export interface IndicatorOfCompromise {
  value: string;
  type: IndicatorType;
  firstSeen: number;
  lastSeen: number;
  sources: string[];
  relatedIndicators: string[];
  threatLevel: ThreatLevel;
  confidence: number;
  context: Record<string, unknown>;
}

export interface ThreatMetrics {
  timestamp: number;
  totalThreatsDetected: number;
  criticalThreats: number;
  highThreats: number;
  mediumThreats: number;
  lowThreats: number;
  avgConfidence: number;
  topIndicators: { indicator: string; detections: number }[];
  topAnomalies: { type: BehavioralAnomaly; count: number }[];
  incidentCount: number;
  resolvedIncidents: number;
}
