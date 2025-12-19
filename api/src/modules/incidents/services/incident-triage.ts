import { injectable, inject } from 'inversify';

import { BaseService } from '../../../services/base.service';
import { TYPES } from '../../../types';
import type { Incident } from '../../../types/incident';
import { IncidentRepository } from '../repositories/incident.repository';

/**
 * Priority levels for incident classification
 */
export enum PriorityLevel {
  CRITICAL = 'P0', // Immediate action required - security/safety threat
  HIGH = 'P1',     // Urgent - significant operational impact
  MEDIUM = 'P2',   // Standard - moderate impact
  LOW = 'P3'       // Low priority - minimal impact
}

/**
 * Incident classification criteria
 */
export interface IncidentClassification {
  priority: PriorityLevel;
  confidence: number; // 0-100
  reasoning: string;
  recommendedTeam: string[];
  estimatedResolutionTime: number; // minutes
  riskFactors: string[];
}

/**
 * Triage result with escalation recommendations
 */
export interface TriageResult {
  incidentId: number;
  classification: IncidentClassification;
  shouldEscalate: boolean;
  escalationPath: string[];
  assignedTeam: string;
  createdAt: Date;
}

/**
 * IncidentTriageService - Automatically classifies and triages incidents
 * Implements smart classification based on incident characteristics
 */
@injectable()
export class IncidentTriageService extends BaseService {
  private readonly CRITICAL_KEYWORDS = [
    'security',
    'breach',
    'compromise',
    'unauthorized access',
    'data loss',
    'ransomware',
    'malware',
    'intrusion',
    'sabotage',
    'fatality',
    'serious injury'
  ];

  private readonly HIGH_KEYWORDS = [
    'crash',
    'collision',
    'fire',
    'injury',
    'breakdown',
    'theft',
    'damage',
    'accident'
  ];

  constructor(@inject(TYPES.IncidentRepository) private incidentRepository: IncidentRepository) {
    super();
  }

  /**
   * Classify an incident and determine priority level
   * @param incident - The incident to classify
   * @returns Classification with priority level and reasoning
   */
  async classifyIncident(incident: Incident): Promise<IncidentClassification> {
    const riskFactors: string[] = [];
    let priorityScore = 0;

    // Analyze incident type
    const typeScore = this.analyzeIncidentType(incident.incident_type, riskFactors);
    priorityScore += typeScore;

    // Analyze severity
    const severityScore = this.analyzeSeverity(incident.severity, riskFactors);
    priorityScore += severityScore;

    // Analyze description for keywords
    const keywordScore = this.analyzeDescription(incident.description, riskFactors);
    priorityScore += keywordScore;

    // Analyze additional risk factors
    const riskScore = this.analyzeRiskFactors(incident, riskFactors);
    priorityScore += riskScore;

    // Determine priority level
    const priority = this.determinePriority(priorityScore);
    const confidence = Math.min(100, priorityScore);
    const recommendedTeam = this.determineTeam(incident.incident_type, priority);
    const estimatedTime = this.estimateResolutionTime(priority, incident.incident_type);

    return {
      priority,
      confidence,
      reasoning: `Incident classified as ${priority} based on type (${incident.incident_type}), severity (${incident.severity}), and ${riskFactors.length} identified risk factors`,
      recommendedTeam,
      estimatedResolutionTime: estimatedTime,
      riskFactors
    };
  }

  /**
   * Perform full triage workflow on an incident
   * @param incidentId - ID of incident to triage
   * @param tenantId - Tenant ID for data isolation
   * @returns Complete triage result with escalation recommendations
   */
  async triageIncident(incidentId: number, tenantId: number): Promise<TriageResult> {
    return this.executeInTransaction(async () => {
      const incident = await this.incidentRepository.findById(incidentId, tenantId);
      if (!incident) {
        throw new Error(`Incident ${incidentId} not found`);
      }

      const classification = await this.classifyIncident(incident);
      const shouldEscalate = this.determineEscalation(classification);
      const escalationPath = this.buildEscalationPath(classification);

      return {
        incidentId,
        classification,
        shouldEscalate,
        escalationPath,
        assignedTeam: classification.recommendedTeam[0],
        createdAt: new Date()
      };
    });
  }

  /**
   * Batch triage multiple incidents
   * @param incidentIds - Array of incident IDs to triage
   * @param tenantId - Tenant ID for data isolation
   * @returns Array of triage results
   */
  async triageIncidents(incidentIds: number[], tenantId: number): Promise<TriageResult[]> {
    return Promise.all(
      incidentIds.map(id => this.triageIncident(id, tenantId))
    );
  }

  /**
   * Get incidents requiring immediate attention
   * @param tenantId - Tenant ID for data isolation
   * @returns High priority incidents needing escalation
   */
  async getEscalationQueue(tenantId: number): Promise<TriageResult[]> {
    return this.executeInTransaction(async () => {
      const incidents = await this.incidentRepository.findAll(tenantId);
      const triageResults: TriageResult[] = [];

      for (const incident of incidents) {
        const triageResult = await this.triageIncident(incident.id, tenantId);
        if (triageResult.shouldEscalate) {
          triageResults.push(triageResult);
        }
      }

      // Sort by priority
      return triageResults.sort((a, b) => {
        const priorityOrder: Record<PriorityLevel, number> = {
          [PriorityLevel.CRITICAL]: 0,
          [PriorityLevel.HIGH]: 1,
          [PriorityLevel.MEDIUM]: 2,
          [PriorityLevel.LOW]: 3
        };
        return priorityOrder[a.classification.priority] - priorityOrder[b.classification.priority];
      });
    });
  }

  /**
   * Analyze incident type for risk assessment
   */
  private analyzeIncidentType(type: string, riskFactors: string[]): number {
    const typeScores: Record<string, number> = {
      'safety': 40,
      'theft': 35,
      'accident': 30,
      'damage': 25,
      'breakdown': 15,
      'other': 10
    };

    const score = typeScores[type] || 10;
    if (score >= 30) {
      riskFactors.push(`High-risk incident type: ${type}`);
    }
    return score;
  }

  /**
   * Analyze severity level for risk assessment
   */
  private analyzeSeverity(severity: string, riskFactors: string[]): number {
    const severityScores: Record<string, number> = {
      'critical': 40,
      'high': 30,
      'medium': 15,
      'low': 5
    };

    const score = severityScores[severity] || 5;
    if (severity === 'critical') {
      riskFactors.push('Critical severity level');
    }
    return score;
  }

  /**
   * Analyze description for risk keywords
   */
  private analyzeDescription(description: string, riskFactors: string[]): number {
    let score = 0;
    const lowerDesc = description.toLowerCase();

    // Check for critical keywords
    for (const keyword of this.CRITICAL_KEYWORDS) {
      if (lowerDesc.includes(keyword)) {
        score += 30;
        riskFactors.push(`Critical keyword detected: ${keyword}`);
      }
    }

    // Check for high-risk keywords
    for (const keyword of this.HIGH_KEYWORDS) {
      if (lowerDesc.includes(keyword) && score === 0) {
        score += 15;
        riskFactors.push(`High-risk keyword detected: ${keyword}`);
      }
    }

    return Math.min(score, 40);
  }

  /**
   * Analyze additional risk factors
   */
  private analyzeRiskFactors(incident: Incident, riskFactors: string[]): number {
    let score = 0;

    if (incident.injuries_reported) {
      score += 25;
      riskFactors.push('Injuries reported');
    }

    if (incident.police_report_filed) {
      score += 20;
      riskFactors.push('Police report filed');
    }

    if (incident.estimated_cost && incident.estimated_cost > 50000) {
      score += 15;
      riskFactors.push('High estimated cost');
    }

    if (incident.photos && incident.photos.length > 0) {
      riskFactors.push('Evidence photos attached');
    }

    return score;
  }

  /**
   * Determine priority level based on score
   */
  private determinePriority(score: number): PriorityLevel {
    if (score >= 75) return PriorityLevel.CRITICAL;
    if (score >= 50) return PriorityLevel.HIGH;
    if (score >= 25) return PriorityLevel.MEDIUM;
    return PriorityLevel.LOW;
  }

  /**
   * Determine which team should handle the incident
   */
  private determineTeam(incidentType: string, priority: PriorityLevel): string[] {
    const baseTeams: Record<string, string[]> = {
      'safety': ['Safety Team', 'Operations'],
      'theft': ['Security Team', 'Operations'],
      'accident': ['Operations', 'Legal'],
      'damage': ['Maintenance', 'Operations'],
      'breakdown': ['Maintenance', 'Operations'],
      'other': ['Operations']
    };

    const teams = baseTeams[incidentType] || ['Operations'];

    // Add escalation teams for high priority
    if (priority === PriorityLevel.CRITICAL) {
      teams.unshift('Executive Team');
    } else if (priority === PriorityLevel.HIGH) {
      teams.unshift('Management');
    }

    return teams;
  }

  /**
   * Estimate resolution time based on incident characteristics
   */
  private estimateResolutionTime(priority: PriorityLevel, incidentType: string): number {
    const baseTime: Record<string, number> = {
      'breakdown': 60,
      'accident': 480,    // 8 hours
      'damage': 240,      // 4 hours
      'theft': 1440,      // 24 hours
      'safety': 120,      // 2 hours
      'other': 240        // 4 hours
    };

    const time = baseTime[incidentType] || 240;

    // Adjust based on priority
    const priorityMultipliers: Record<PriorityLevel, number> = {
      [PriorityLevel.CRITICAL]: 0.25,
      [PriorityLevel.HIGH]: 0.5,
      [PriorityLevel.MEDIUM]: 1,
      [PriorityLevel.LOW]: 2
    };

    return Math.round(time * priorityMultipliers[priority]);
  }

  /**
   * Determine if incident should be escalated
   */
  private determineEscalation(classification: IncidentClassification): boolean {
    return classification.priority === PriorityLevel.CRITICAL ||
           classification.priority === PriorityLevel.HIGH;
  }

  /**
   * Build escalation path based on incident priority
   */
  private buildEscalationPath(classification: IncidentClassification): string[] {
    const path: string[] = [];

    if (classification.priority === PriorityLevel.CRITICAL) {
      path.push('Incident Commander');
      path.push('Director');
      path.push('VP Operations');
    } else if (classification.priority === PriorityLevel.HIGH) {
      path.push('Team Lead');
      path.push('Manager');
      path.push('Director');
    } else if (classification.priority === PriorityLevel.MEDIUM) {
      path.push('Team Lead');
      path.push('Manager');
    }

    return path;
  }
}
