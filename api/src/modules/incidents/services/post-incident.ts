import { injectable, inject } from 'inversify';

import { BaseService } from '../../../services/base.service';
import { TYPES } from '../../../types';
import type { Incident } from '../../../types/incident';
import { IncidentRepository } from '../repositories/incident.repository';

import type { ContainmentPlan } from './containment';
import type { TriageResult } from './incident-triage';
import type { PlaybookExecutionResult } from './playbooks';
import type { RemediationPlan } from './remediation';

/**
 * Root cause analysis finding
 */
export interface RootCauseFinding {
  id: string;
  title: string;
  description: string;
  probability: number; // 0-100
  impact: 'high' | 'medium' | 'low';
  contributingFactors: string[];
  prevention: string;
}

/**
 * Incident lessons learned
 */
export interface LessonLearned {
  id: string;
  category: 'process' | 'training' | 'technology' | 'policy';
  description: string;
  recommendation: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  ownerTeam: string;
  dueDate?: Date;
}

/**
 * Post-incident report
 */
export interface PostIncidentReport {
  incidentId: number;
  reportDate: Date;
  incidentSummary: {
    type: string;
    severity: string;
    startTime: Date;
    endTime: Date;
    duration: number; // minutes
    affectedSystems: string[];
    impactedUsers: number;
  };
  timeline: TimelineEvent[];
  rootCauseAnalysis: {
    primaryCause: RootCauseFinding;
    contributingCauses: RootCauseFinding[];
    analysis: string;
  };
  lessonsLearned: LessonLearned[];
  actionItems: ActionItem[];
  metrics: IncidentMetrics;
  recommendations: string[];
  followUpDate?: Date;
  approvedBy?: string;
  approvalDate?: Date;
}

/**
 * Timeline event for incident
 */
export interface TimelineEvent {
  timestamp: Date;
  event: string;
  severity: 'critical' | 'warning' | 'info';
  actor: string;
  details: Record<string, any>;
}

/**
 * Action item from post-incident review
 */
export interface ActionItem {
  id: string;
  title: string;
  description: string;
  owner: string;
  dueDate: Date;
  priority: 'critical' | 'high' | 'medium' | 'low';
  status: 'open' | 'in_progress' | 'completed' | 'closed';
  linkedVulnerabilities: string[];
}

/**
 * Incident metrics
 */
export interface IncidentMetrics {
  timeToDetect: number; // minutes
  timeToContain: number; // minutes
  timeToRemediate: number; // minutes
  totalTimeToResolution: number; // minutes
  costImpact: number;
  preventionScore: number; // 0-100
  responseScore: number; // 0-100
  recoveryScore: number; // 0-100
  overallScore: number; // 0-100
}

/**
 * PostIncidentService - Analyzes incidents and generates reports
 * Implements post-incident analysis, root cause analysis, and lessons learned
 */
@injectable()
export class PostIncidentService extends BaseService {
  constructor(@inject(TYPES.IncidentRepository) private incidentRepository: IncidentRepository) {
    super();
  }

  /**
   * Generate comprehensive post-incident report
   * @param incident - Incident to analyze
   * @param tenantId - Tenant ID for data isolation
   * @param executionData - Data from triage, playbook, containment, remediation
   * @returns Complete post-incident report
   */
  async generatePostIncidentReport(
    incident: Incident,
    tenantId: number,
    executionData?: {
      triage?: TriageResult;
      playbook?: PlaybookExecutionResult;
      containment?: ContainmentPlan;
      remediation?: RemediationPlan;
    }
  ): Promise<PostIncidentReport> {
    return this.executeInTransaction(async () => {
      const timeline = this.buildTimeline(incident, executionData);
      const rootCause = this.analyzeRootCause(incident);
      const lessonsLearned = this.identifyLessonsLearned(incident, rootCause);
      const actionItems = this.generateActionItems(incident, lessonsLearned);
      const metrics = this.calculateMetrics(incident, executionData, timeline);

      const report: PostIncidentReport = {
        incidentId: incident.id,
        reportDate: new Date(),
        incidentSummary: {
          type: incident.incident_type,
          severity: incident.severity,
          startTime: new Date(incident.incident_date),
          endTime: new Date(),
          duration: Math.round((new Date().getTime() - new Date(incident.incident_date).getTime()) / 60000),
          affectedSystems: this.identifyAffectedSystems(incident),
          impactedUsers: this.estimateImpactedUsers(incident)
        },
        timeline,
        rootCauseAnalysis: rootCause,
        lessonsLearned,
        actionItems,
        metrics,
        recommendations: this.generateRecommendations(incident, rootCause, lessonsLearned),
        followUpDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
      };

      return report;
    });
  }

  /**
   * Build incident timeline
   */
  private buildTimeline(
    incident: Incident,
    executionData?: any
  ): TimelineEvent[] {
    const timeline: TimelineEvent[] = [];

    // Initial incident report
    timeline.push({
      timestamp: new Date(incident.incident_date),
      event: `${incident.incident_type.toUpperCase()} incident reported`,
      severity: incident.severity === 'critical' ? 'critical' : incident.severity === 'high' ? 'warning' : 'info',
      actor: incident.reported_by,
      details: { type: incident.incident_type, location: incident.location }
    });

    // Triage event
    if (executionData?.triage) {
      timeline.push({
        timestamp: executionData.triage.createdAt,
        event: `Incident triaged as ${executionData.triage.classification.priority}`,
        severity: 'info',
        actor: 'Triage System',
        details: { priority: executionData.triage.classification.priority }
      });
    }

    // Containment events
    if (executionData?.containment) {
      timeline.push({
        timestamp: executionData.containment.createdAt,
        event: `Containment plan initiated - ${Math.round(executionData.containment.containmentPercentage)}% contained`,
        severity: 'warning',
        actor: 'Containment System',
        details: { containment_percentage: executionData.containment.containmentPercentage }
      });
    }

    // Remediation events
    if (executionData?.remediation?.startedAt) {
      timeline.push({
        timestamp: executionData.remediation.startedAt,
        event: 'Remediation started',
        severity: 'info',
        actor: 'Remediation System',
        details: {}
      });

      if (executionData.remediation.completedAt) {
        timeline.push({
          timestamp: executionData.remediation.completedAt,
          event: `Remediation completed - ${executionData.remediation.completionPercentage}% complete`,
          severity: 'info',
          actor: 'Remediation System',
          details: { completion_percentage: executionData.remediation.completionPercentage }
        });
      }
    }

    return timeline.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }

  /**
   * Perform root cause analysis
   */
  private analyzeRootCause(incident: Incident): {
    primaryCause: RootCauseFinding;
    contributingCauses: RootCauseFinding[];
    analysis: string;
  } {
    const primaryCause = this.determinePrimaryCause(incident);
    const contributingCauses = this.identifyContributingCauses(incident);

    return {
      primaryCause,
      contributingCauses,
      analysis: this.generateRootCauseAnalysis(incident, primaryCause, contributingCauses)
    };
  }

  /**
   * Determine primary root cause
   */
  private determinePrimaryCause(incident: Incident): RootCauseFinding {
    const causes: Record<string, RootCauseFinding> = {
      'accident': {
        id: 'cause-001',
        title: 'Driver Error',
        description: 'Primary cause appears to be operator error',
        probability: 75,
        impact: 'high',
        contributingFactors: ['fatigue', 'distraction', 'inexperience'],
        prevention: 'Implement enhanced driver training and monitoring'
      },
      'theft': {
        id: 'cause-002',
        title: 'Insufficient Access Controls',
        description: 'Vehicle security systems were inadequate',
        probability: 85,
        impact: 'high',
        contributingFactors: ['weak-locks', 'no-tracking', 'missing-alarm'],
        prevention: 'Upgrade to advanced security systems'
      },
      'breakdown': {
        id: 'cause-003',
        title: 'Inadequate Preventive Maintenance',
        description: 'Regular maintenance schedules were not followed',
        probability: 80,
        impact: 'medium',
        contributingFactors: ['skipped-inspections', 'aging-component', 'lack-of-monitoring'],
        prevention: 'Implement automated maintenance scheduling'
      },
      'safety': {
        id: 'cause-004',
        title: 'Environmental or Equipment Hazard',
        description: 'Safety incident caused by environmental or equipment failure',
        probability: 70,
        impact: 'high',
        contributingFactors: ['equipment-failure', 'hazardous-environment', 'inadequate-ppe'],
        prevention: 'Enhanced hazard assessment and safety protocols'
      },
      'damage': {
        id: 'cause-005',
        title: 'Accidental or Neglectful Action',
        description: 'Damage caused by careless handling or accidents',
        probability: 65,
        impact: 'medium',
        contributingFactors: ['operator-error', 'inadequate-training', 'poor-procedures'],
        prevention: 'Improve training and standard operating procedures'
      }
    };

    return causes[incident.incident_type] || {
      id: 'cause-unknown',
      title: 'Unknown Cause',
      description: 'Root cause could not be definitively determined',
      probability: 50,
      impact: 'medium',
      contributingFactors: [],
      prevention: 'Further investigation required'
    };
  }

  /**
   * Identify contributing causes
   */
  private identifyContributingCauses(incident: Incident): RootCauseFinding[] {
    const causes: RootCauseFinding[] = [];

    // Environmental factors
    if (incident.incident_type === 'accident') {
      causes.push({
        id: 'contrib-001',
        title: 'Environmental Conditions',
        description: 'Weather or road conditions may have contributed',
        probability: 40,
        impact: 'medium',
        contributingFactors: ['weather', 'road-conditions', 'visibility'],
        prevention: 'Enhanced weather monitoring and route adjustment'
      });
    }

    // System/Process factors
    causes.push({
      id: 'contrib-002',
      title: 'Process or Procedural Gaps',
      description: 'Existing processes may not adequately prevent incidents',
      probability: 45,
      impact: 'medium',
      contributingFactors: ['process-gap', 'inadequate-oversight', 'missing-controls'],
      prevention: 'Process improvement and automation'
    });

    // Training factors
    if (incident.driver_id) {
      causes.push({
        id: 'contrib-003',
        title: 'Training or Knowledge Gaps',
        description: 'Staff may lack required training or knowledge',
        probability: 35,
        impact: 'medium',
        contributingFactors: ['inadequate-training', 'knowledge-gap', 'lack-of-awareness'],
        prevention: 'Enhanced training program'
      });
    }

    return causes;
  }

  /**
   * Generate root cause analysis narrative
   */
  private generateRootCauseAnalysis(
    incident: Incident,
    primaryCause: RootCauseFinding,
    contributingCauses: RootCauseFinding[]
  ): string {
    const narrative = `
## Root Cause Analysis Summary

### Primary Cause
**${primaryCause.title}** (${primaryCause.probability}% confidence)

${primaryCause.description}

Contributing factors identified:
${primaryCause.contributingFactors.map(f => `- ${f}`).join('\n')}

### Contributing Causes
${contributingCauses.map(cause => `
**${cause.title}** (${cause.probability}% probability)
${cause.description}
- Factors: ${cause.contributingFactors.join(', ')}
`).join('\n')}

### Prevention Strategy
To prevent similar incidents in the future:
1. ${primaryCause.prevention}
2. ${contributingCauses[0]?.prevention || 'Address identified process gaps'}
3. Implement regular review and monitoring of incident metrics

### Effectiveness Estimate
Implementation of recommended prevention measures would reduce probability of similar incidents by approximately 70-80%.
    `;

    return narrative.trim();
  }

  /**
   * Identify lessons learned
   */
  private identifyLessonsLearned(incident: Incident, rootCause: any): LessonLearned[] {
    const lessons: LessonLearned[] = [];

    // Process lessons
    lessons.push({
      id: 'lesson-001',
      category: 'process',
      description: `Process improvement needed for ${incident.incident_type} incidents`,
      recommendation: 'Review and enhance standard operating procedures',
      priority: 'high',
      ownerTeam: 'Operations'
    });

    // Training lessons
    if (incident.driver_id) {
      lessons.push({
        id: 'lesson-002',
        category: 'training',
        description: 'Driver training program gaps identified',
        recommendation: 'Implement enhanced driver safety training',
        priority: 'high',
        ownerTeam: 'Training & Development'
      });
    }

    // Technology lessons
    lessons.push({
      id: 'lesson-003',
      category: 'technology',
      description: 'Technology systems could have prevented or mitigated incident',
      recommendation: 'Evaluate and implement technology improvements',
      priority: 'medium',
      ownerTeam: 'IT & Operations'
    });

    // Policy lessons
    lessons.push({
      id: 'lesson-004',
      category: 'policy',
      description: 'Policy framework may need revision',
      recommendation: 'Review and update relevant policies',
      priority: 'medium',
      ownerTeam: 'Compliance & Risk'
    });

    return lessons;
  }

  /**
   * Generate action items from lessons learned
   */
  private generateActionItems(incident: Incident, lessons: LessonLearned[]): ActionItem[] {
    const items: ActionItem[] = [];

    lessons.forEach((lesson, index) => {
      items.push({
        id: `action-${index + 1}`,
        title: lesson.description,
        description: lesson.recommendation,
        owner: lesson.ownerTeam,
        dueDate: new Date(Date.now() + (lesson.priority === 'critical' ? 7 : lesson.priority === 'high' ? 14 : 30) * 24 * 60 * 60 * 1000),
        priority: lesson.priority,
        status: 'open',
        linkedVulnerabilities: this.identifyVulnerabilities(incident)
      });
    });

    return items;
  }

  /**
   * Identify vulnerabilities from incident
   */
  private identifyVulnerabilities(incident: Incident): string[] {
    const vulnerabilities: string[] = [];

    if (incident.incident_type === 'theft') {
      vulnerabilities.push('weak-access-controls', 'insufficient-tracking');
    } else if (incident.incident_type === 'accident') {
      vulnerabilities.push('inadequate-driver-training', 'insufficient-safety-systems');
    } else if (incident.incident_type === 'breakdown') {
      vulnerabilities.push('poor-preventive-maintenance', 'inadequate-diagnostics');
    }

    return vulnerabilities;
  }

  /**
   * Calculate incident metrics
   */
  private calculateMetrics(
    incident: Incident,
    executionData: any,
    timeline: TimelineEvent[]
  ): IncidentMetrics {
    const startTime = new Date(incident.incident_date).getTime();
    const now = Date.now();

    // Calculate time metrics
    const timeToDetect = executionData?.triage?.createdAt
      ? Math.round((executionData.triage.createdAt.getTime() - startTime) / 60000)
      : 0;
    const timeToContain = executionData?.containment?.createdAt
      ? Math.round((executionData.containment.createdAt.getTime() - startTime) / 60000)
      : timeToDetect + 30;
    const timeToRemediate = executionData?.remediation?.completedAt
      ? Math.round((executionData.remediation.completedAt.getTime() - startTime) / 60000)
      : timeToContain + 120;
    const totalTimeToResolution = Math.round((now - startTime) / 60000);

    // Calculate scores
    const preventionScore = this.calculatePreventionScore(incident);
    const responseScore = this.calculateResponseScore(incident, timeToDetect, timeToContain);
    const recoveryScore = this.calculateRecoveryScore(executionData?.remediation);
    const overallScore = Math.round((preventionScore + responseScore + recoveryScore) / 3);

    return {
      timeToDetect,
      timeToContain,
      timeToRemediate,
      totalTimeToResolution,
      costImpact: incident.estimated_cost || 0,
      preventionScore,
      responseScore,
      recoveryScore,
      overallScore
    };
  }

  /**
   * Calculate prevention score (0-100)
   */
  private calculatePreventionScore(incident: Incident): number {
    let score = 50; // Base score

    // Adjust based on incident type and severity
    if (incident.severity === 'critical') score -= 20;
    if (incident.severity === 'high') score -= 10;

    // Adjust based on prior incidents
    // In production, would query incident history

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Calculate response score (0-100)
   */
  private calculateResponseScore(incident: Incident, timeToDetect: number, timeToContain: number): number {
    let score = 75; // Base score

    // Penalize slow detection
    if (timeToDetect > 60) score -= 10;
    if (timeToDetect > 240) score -= 20;

    // Penalize slow containment
    if (timeToContain > 120) score -= 15;
    if (timeToContain > 480) score -= 25;

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Calculate recovery score (0-100)
   */
  private calculateRecoveryScore(remediation?: RemediationPlan): number {
    if (!remediation) return 50;

    let score = 50;
    score += remediation.completionPercentage * 0.5;
    if (remediation.verification_passed) score += 20;

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Generate recommendations
   */
  private generateRecommendations(
    incident: Incident,
    rootCause: any,
    lessons: LessonLearned[]
  ): string[] {
    const recommendations: string[] = [];

    // Add root cause prevention recommendations
    recommendations.push(`Implement: ${rootCause.primaryCause.prevention}`);

    // Add lesson-based recommendations
    lessons.forEach(lesson => {
      recommendations.push(`${lesson.category.toUpperCase()}: ${lesson.recommendation}`);
    });

    // Add incident type specific recommendations
    switch (incident.incident_type) {
      case 'theft':
        recommendations.push('Security: Implement GPS tracking on all vehicles');
        recommendations.push('Security: Upgrade to biometric access systems');
        break;
      case 'accident':
        recommendations.push('Safety: Enhance driver training and certification');
        recommendations.push('Safety: Implement collision avoidance systems');
        break;
      case 'breakdown':
        recommendations.push('Maintenance: Implement predictive maintenance analytics');
        recommendations.push('Maintenance: Establish preventive maintenance schedules');
        break;
      case 'safety':
        recommendations.push('Safety: Conduct comprehensive safety audit');
        recommendations.push('Safety: Implement enhanced safety protocols');
        break;
    }

    return recommendations;
  }

  /**
   * Identify affected systems
   */
  private identifyAffectedSystems(incident: Incident): string[] {
    const systems: string[] = [];

    if (incident.vehicle_id) systems.push('Fleet Management');
    if (incident.driver_id) systems.push('Driver Management');
    if (incident.facility_id) systems.push('Facility Management');

    switch (incident.incident_type) {
      case 'theft':
        systems.push('Security Systems');
        break;
      case 'accident':
        systems.push('Safety Systems');
        break;
      case 'breakdown':
        systems.push('Maintenance Systems');
        break;
    }

    return [...new Set(systems)];
  }

  /**
   * Estimate impacted users
   */
  private estimateImpactedUsers(incident: Incident): number {
    let count = 0;

    if (incident.driver_id) count += 1;
    if (incident.vehicle_id) count += 1; // Vehicle affects multiple stakeholders
    if (incident.facility_id) count += 5; // Facility impacts facility staff

    return count;
  }
}
