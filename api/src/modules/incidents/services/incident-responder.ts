import { injectable, inject } from 'inversify';
import { BaseService } from '../../../services/base.service';
import { IncidentRepository } from '../repositories/incident.repository';
import { IncidentTriageService, PriorityLevel } from './incident-triage';
import { PlaybooksService } from './playbooks';
import { ContainmentService } from './containment';
import { RemediationService } from './remediation';
import { PostIncidentService } from './post-incident';
import { TYPES } from '../../../types';
import type { Incident } from '../../../types/incident';

/**
 * Complete incident response result
 */
export interface IncidentResponse {
  incidentId: number;
  status: 'initiated' | 'in_progress' | 'contained' | 'remediated' | 'completed';
  priority: PriorityLevel;
  startTime: Date;
  endTime?: Date;
  triage: any;
  playbook: any;
  containment: any;
  remediation: any;
  postIncident: any;
  timeline: IncidentResponseStep[];
  summary: string;
}

/**
 * Step in incident response workflow
 */
export interface IncidentResponseStep {
  step: number;
  name: string;
  description: string;
  startTime: Date;
  endTime?: Date;
  duration?: number; // minutes
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  result?: any;
  error?: string;
}

/**
 * IncidentResponderService - Main orchestrator for automated incident response
 * Coordinates all incident response activities: triage, containment, remediation, analysis
 */
@injectable()
export class IncidentResponderService extends BaseService {
  constructor(
    @inject(TYPES.IncidentRepository) private incidentRepository: IncidentRepository,
    @inject(IncidentTriageService) private triageService: IncidentTriageService,
    @inject(PlaybooksService) private playbooksService: PlaybooksService,
    @inject(ContainmentService) private containmentService: ContainmentService,
    @inject(RemediationService) private remediationService: RemediationService,
    @inject(PostIncidentService) private postIncidentService: PostIncidentService
  ) {
    super();
  }

  /**
   * Initiate comprehensive incident response workflow
   * @param incidentId - ID of incident to respond to
   * @param tenantId - Tenant ID for data isolation
   * @returns Complete incident response with all phases
   */
  async respondToIncident(incidentId: number, tenantId: number): Promise<IncidentResponse> {
    const incident = await this.incidentRepository.findById(incidentId, tenantId);
    if (!incident) {
      throw new Error(`Incident ${incidentId} not found`);
    }

    const response: IncidentResponse = {
      incidentId,
      status: 'initiated',
      priority: PriorityLevel.LOW,
      startTime: new Date(),
      timeline: [],
      summary: ''
    };

    try {
      // Step 1: Triage and Classification
      response.timeline.push({
        step: 1,
        name: 'Triage & Classification',
        description: 'Automatically classify incident and determine priority',
        startTime: new Date(),
        status: 'in_progress'
      });

      const triageResult = await this.triageService.triageIncident(incidentId, tenantId);
      response.triage = triageResult;
      response.priority = triageResult.classification.priority;

      response.timeline[0].status = 'completed';
      response.timeline[0].endTime = new Date();
      response.timeline[0].duration = response.timeline[0].endTime.getTime() - response.timeline[0].startTime.getTime();
      response.timeline[0].result = triageResult;

      // Step 2: Determine and Execute Playbook
      response.timeline.push({
        step: 2,
        name: 'Playbook Execution',
        description: 'Execute predefined response playbook for incident type',
        startTime: new Date(),
        status: 'in_progress'
      });

      const playbook = this.playbooksService.getPlaybook(incident.incident_type, response.priority);
      if (playbook) {
        const playbookResult = await this.playbooksService.executePlaybook(playbook, incident);
        response.playbook = playbookResult;

        response.timeline[1].status = 'completed';
        response.timeline[1].endTime = new Date();
        response.timeline[1].duration = response.timeline[1].endTime.getTime() - response.timeline[1].startTime.getTime();
        response.timeline[1].result = playbookResult;
      } else {
        response.timeline[1].status = 'failed';
        response.timeline[1].error = 'No playbook found for incident type and priority';
      }

      response.status = 'in_progress';

      // Step 3: Containment
      response.timeline.push({
        step: 3,
        name: 'Containment',
        description: 'Isolate and contain incident threats',
        startTime: new Date(),
        status: 'in_progress'
      });

      const containmentPlan = await this.containmentService.containIncident(incident);
      response.containment = containmentPlan;

      response.timeline[2].status = 'completed';
      response.timeline[2].endTime = new Date();
      response.timeline[2].duration = response.timeline[2].endTime.getTime() - response.timeline[2].startTime.getTime();
      response.timeline[2].result = containmentPlan;

      response.status = containmentPlan.contained ? 'contained' : 'in_progress';

      // Step 4: Remediation
      response.timeline.push({
        step: 4,
        name: 'Remediation',
        description: 'Execute remediation plan to restore normal operations',
        startTime: new Date(),
        status: 'in_progress'
      });

      const remediationPlan = this.remediationService.createRemediationPlan(incident);
      const executedRemediation = await this.remediationService.executeRemediationPlan(remediationPlan);
      response.remediation = executedRemediation;

      response.timeline[3].status = 'completed';
      response.timeline[3].endTime = new Date();
      response.timeline[3].duration = response.timeline[3].endTime.getTime() - response.timeline[3].startTime.getTime();
      response.timeline[3].result = executedRemediation;

      response.status = 'remediated';

      // Step 5: Vulnerability Assessment
      response.timeline.push({
        step: 5,
        name: 'Vulnerability Assessment',
        description: 'Assess vulnerabilities exposed by incident',
        startTime: new Date(),
        status: 'in_progress'
      });

      const vulnerabilities = this.remediationService.assessVulnerabilities(incident);

      response.timeline[4].status = 'completed';
      response.timeline[4].endTime = new Date();
      response.timeline[4].duration = response.timeline[4].endTime.getTime() - response.timeline[4].startTime.getTime();
      response.timeline[4].result = vulnerabilities;

      // Step 6: Post-Incident Analysis
      response.timeline.push({
        step: 6,
        name: 'Post-Incident Analysis',
        description: 'Generate comprehensive post-incident report',
        startTime: new Date(),
        status: 'in_progress'
      });

      const postIncidentReport = await this.postIncidentService.generatePostIncidentReport(
        incident,
        tenantId,
        {
          triage: triageResult,
          playbook: response.playbook,
          containment: containmentPlan,
          remediation: executedRemediation
        }
      );
      response.postIncident = postIncidentReport;

      response.timeline[5].status = 'completed';
      response.timeline[5].endTime = new Date();
      response.timeline[5].duration = response.timeline[5].endTime.getTime() - response.timeline[5].startTime.getTime();
      response.timeline[5].result = postIncidentReport;

      response.status = 'completed';
      response.endTime = new Date();
      response.summary = this.generateSummary(response);
    } catch (error) {
      console.error('Incident response failed:', error);
      const currentStep = response.timeline[response.timeline.length - 1];
      if (currentStep) {
        currentStep.status = 'failed';
        currentStep.error = error instanceof Error ? error.message : String(error);
        currentStep.endTime = new Date();
      }
      response.status = 'in_progress';
    }

    return response;
  }

  /**
   * Respond to multiple incidents in batch
   * @param incidentIds - Array of incident IDs
   * @param tenantId - Tenant ID
   * @returns Array of incident responses
   */
  async respondToIncidents(incidentIds: number[], tenantId: number): Promise<IncidentResponse[]> {
    return Promise.all(
      incidentIds.map(id => this.respondToIncident(id, tenantId))
    );
  }

  /**
   * Get ongoing incident response status
   * @param incidentId - Incident ID
   * @param tenantId - Tenant ID
   * @returns Current response status
   */
  async getIncidentStatus(incidentId: number, tenantId: number): Promise<IncidentResponse | null> {
    // In production, would retrieve from database
    // For now, trigger response
    return this.respondToIncident(incidentId, tenantId);
  }

  /**
   * Escalate incident to higher priority
   * @param incidentId - Incident ID
   * @param newPriority - New priority level
   * @param reason - Reason for escalation
   * @param tenantId - Tenant ID
   * @returns Updated incident response
   */
  async escalateIncident(
    incidentId: number,
    newPriority: PriorityLevel,
    reason: string,
    tenantId: number
  ): Promise<IncidentResponse> {
    const incident = await this.incidentRepository.findById(incidentId, tenantId);
    if (!incident) {
      throw new Error(`Incident ${incidentId} not found`);
    }

    console.log(`Escalating incident ${incidentId} to ${newPriority}: ${reason}`);

    // Re-execute response with new priority
    const response = await this.respondToIncident(incidentId, tenantId);
    response.priority = newPriority;

    return response;
  }

  /**
   * Deescalate incident to lower priority
   * @param incidentId - Incident ID
   * @param newPriority - New priority level
   * @param reason - Reason for deescalation
   * @param tenantId - Tenant ID
   * @returns Updated incident response
   */
  async deescalateIncident(
    incidentId: number,
    newPriority: PriorityLevel,
    reason: string,
    tenantId: number
  ): Promise<IncidentResponse> {
    const incident = await this.incidentRepository.findById(incidentId, tenantId);
    if (!incident) {
      throw new Error(`Incident ${incidentId} not found`);
    }

    console.log(`Deescalating incident ${incidentId} to ${newPriority}: ${reason}`);

    const response = await this.respondToIncident(incidentId, tenantId);
    response.priority = newPriority;

    return response;
  }

  /**
   * Get critical incidents requiring immediate attention
   * @param tenantId - Tenant ID
   * @returns List of critical incidents
   */
  async getCriticalIncidents(tenantId: number): Promise<IncidentResponse[]> {
    const escapequeue = await this.triageService.getEscalationQueue(tenantId);
    const criticalIncidents = escapequeue
      .filter(t => t.classification.priority === PriorityLevel.CRITICAL)
      .map(t => t.incidentId);

    return this.respondToIncidents(criticalIncidents, tenantId);
  }

  /**
   * Get incident response statistics
   * @param tenantId - Tenant ID
   * @returns Response statistics and metrics
   */
  async getIncidentStats(tenantId: number): Promise<any> {
    const allIncidents = await this.incidentRepository.findAll(tenantId);

    const stats = {
      totalIncidents: allIncidents.length,
      byType: this.groupBy(allIncidents, 'incident_type'),
      bySeverity: this.groupBy(allIncidents, 'severity'),
      byStatus: this.groupBy(allIncidents, 'status'),
      averageResolutionTime: this.calculateAverageResolution(allIncidents)
    };

    return stats;
  }

  /**
   * Generate summary of incident response
   */
  private generateSummary(response: IncidentResponse): string {
    const completedSteps = response.timeline.filter(s => s.status === 'completed').length;
    const failedSteps = response.timeline.filter(s => s.status === 'failed').length;

    let summary = `Incident Response Summary:\n`;
    summary += `Incident ID: ${response.incidentId}\n`;
    summary += `Priority: ${response.priority}\n`;
    summary += `Status: ${response.status}\n`;
    summary += `Duration: ${response.endTime ? Math.round((response.endTime.getTime() - response.startTime.getTime()) / 60000) : 0} minutes\n`;
    summary += `Steps Completed: ${completedSteps}/${response.timeline.length}\n`;

    if (failedSteps > 0) {
      summary += `Failed Steps: ${failedSteps}\n`;
    }

    if (response.triage?.classification) {
      summary += `Classification: ${response.triage.classification.priority} - ${response.triage.classification.reasoning}\n`;
    }

    if (response.containment?.contained) {
      summary += `Containment: ${Math.round(response.containment.containmentPercentage)}% contained\n`;
    }

    if (response.remediation?.status) {
      summary += `Remediation: ${response.remediation.status} (${response.remediation.completionPercentage}% complete)\n`;
    }

    return summary;
  }

  /**
   * Group array by property
   */
  private groupBy(items: any[], property: string): Record<string, number> {
    return items.reduce((acc, item) => {
      const key = item[property] || 'unknown';
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }

  /**
   * Calculate average resolution time
   */
  private calculateAverageResolution(incidents: Incident[]): number {
    if (incidents.length === 0) return 0;

    const resolvedIncidents = incidents.filter(i => i.status === 'resolved' || i.status === 'closed');
    if (resolvedIncidents.length === 0) return 0;

    const totalTime = resolvedIncidents.reduce((sum, incident) => {
      const startTime = new Date(incident.incident_date).getTime();
      const endTime = new Date(incident.updated_at).getTime();
      return sum + (endTime - startTime);
    }, 0);

    return Math.round(totalTime / resolvedIncidents.length / 60000); // Convert to minutes
  }
}
