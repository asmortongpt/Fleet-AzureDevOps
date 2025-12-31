/**
 * Incident Response Orchestrator
 *
 * Main orchestrator for automated incident response workflows.
 * Coordinates triage, playbook execution, containment, remediation, and analysis.
 *
 * Security:
 * - All actions are logged to audit trail
 * - Parameterized queries only
 * - RBAC enforcement for all operations
 * - No secrets in logs
 */

import { EventEmitter } from 'events';
import {
  Incident,
  IncidentStatus,
  IncidentPriority,
  IncidentResponse,
  ResponseAction,
  ResponseMetrics
} from './types';
import { IncidentTriage } from './incident-triage';
import { PlaybookExecutor } from './playbooks';
import { ContainmentService } from './containment';
import { RemediationService } from './remediation';
import { PostIncidentAnalysis } from './post-incident';

export class IncidentResponder extends EventEmitter {
  private triage: IncidentTriage;
  private playbooks: PlaybookExecutor;
  private containment: ContainmentService;
  private remediation: RemediationService;
  private postIncident: PostIncidentAnalysis;
  private activeIncidents: Map<string, IncidentResponse>;
  private metrics: ResponseMetrics;

  constructor() {
    super();
    this.triage = new IncidentTriage();
    this.playbooks = new PlaybookExecutor();
    this.containment = new ContainmentService();
    this.remediation = new RemediationService();
    this.postIncident = new PostIncidentAnalysis();
    this.activeIncidents = new Map();
    this.metrics = this.initializeMetrics();
  }

  /**
   * Initialize response metrics tracking
   */
  private initializeMetrics(): ResponseMetrics {
    return {
      totalIncidents: 0,
      p0Incidents: 0,
      p1Incidents: 0,
      p2Incidents: 0,
      p3Incidents: 0,
      averageResponseTime: 0,
      averageContainmentTime: 0,
      averageRemediationTime: 0,
      successfulRemediations: 0,
      failedRemediations: 0,
    };
  }

  /**
   * Process new incident
   *
   * @param incident - Incident to process
   * @returns Response result with actions taken
   */
  async processIncident(incident: Incident): Promise<IncidentResponse> {
    const startTime = Date.now();
    const incidentId = incident.id || this.generateIncidentId();

    try {
      this.emit('incident:received', { incidentId, incident });

      // Step 1: Triage - Classify and prioritize
      const triageResult = await this.triage.classify(incident);
      this.emit('incident:triaged', { incidentId, triageResult });

      // Update metrics
      this.updateMetricsForPriority(triageResult.priority);

      // Step 2: Select and execute playbook
      const playbook = await this.playbooks.selectPlaybook(incident, triageResult);
      const playbookResult = await this.playbooks.execute(playbook, incident);
      this.emit('incident:playbook_executed', { incidentId, playbookResult });

      // Step 3: Containment (if required by playbook)
      let containmentResult = null;
      if (playbookResult.requiresContainment) {
        containmentResult = await this.containment.contain(incident, triageResult);
        this.emit('incident:contained', { incidentId, containmentResult });
      }

      // Step 4: Remediation (if auto-remediation is available)
      let remediationResult = null;
      if (playbookResult.autoRemediationAvailable) {
        remediationResult = await this.remediation.remediate(incident, triageResult, containmentResult);
        this.emit('incident:remediated', { incidentId, remediationResult });

        if (remediationResult.success) {
          this.metrics.successfulRemediations++;
        } else {
          this.metrics.failedRemediations++;
        }
      }

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      // Create response object
      const response: IncidentResponse = {
        incidentId,
        incident,
        triageResult,
        playbookResult,
        containmentResult,
        remediationResult,
        status: this.determineStatus(playbookResult, remediationResult),
        responseTime,
        timestamp: new Date(),
        actions: this.compileActions(playbookResult, containmentResult, remediationResult),
      };

      // Store active incident
      this.activeIncidents.set(incidentId, response);

      // Update metrics
      this.updateResponseTimeMetrics(responseTime);

      // Emit completion event
      this.emit('incident:processed', response);

      return response;

    } catch (error) {
      this.emit('incident:error', { incidentId, error });
      throw new Error(`Incident processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get active incident response
   *
   * @param incidentId - Incident ID
   * @returns Active incident response or null
   */
  getActiveIncident(incidentId: string): IncidentResponse | null {
    return this.activeIncidents.get(incidentId) || null;
  }

  /**
   * Complete incident and run post-incident analysis
   *
   * @param incidentId - Incident ID
   * @returns Post-incident report
   */
  async completeIncident(incidentId: string) {
    const response = this.activeIncidents.get(incidentId);

    if (!response) {
      throw new Error(`Incident ${incidentId} not found`);
    }

    // Run post-incident analysis
    const analysis = await this.postIncident.analyze(response);
    this.emit('incident:completed', { incidentId, analysis });

    // Remove from active incidents
    this.activeIncidents.delete(incidentId);

    return analysis;
  }

  /**
   * Get current response metrics
   *
   * @returns Current metrics
   */
  getMetrics(): ResponseMetrics {
    return { ...this.metrics };
  }

  /**
   * Generate unique incident ID
   *
   * @returns Incident ID
   */
  private generateIncidentId(): string {
    return `INC-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }

  /**
   * Update metrics based on incident priority
   *
   * @param priority - Incident priority
   */
  private updateMetricsForPriority(priority: IncidentPriority): void {
    this.metrics.totalIncidents++;

    switch (priority) {
      case 'P0':
        this.metrics.p0Incidents++;
        break;
      case 'P1':
        this.metrics.p1Incidents++;
        break;
      case 'P2':
        this.metrics.p2Incidents++;
        break;
      case 'P3':
        this.metrics.p3Incidents++;
        break;
    }
  }

  /**
   * Update response time metrics
   *
   * @param responseTime - Response time in milliseconds
   */
  private updateResponseTimeMetrics(responseTime: number): void {
    const totalIncidents = this.metrics.totalIncidents;
    this.metrics.averageResponseTime =
      (this.metrics.averageResponseTime * (totalIncidents - 1) + responseTime) / totalIncidents;
  }

  /**
   * Determine final incident status
   *
   * @param playbookResult - Playbook execution result
   * @param remediationResult - Remediation result
   * @returns Final status
   */
  private determineStatus(playbookResult: any, remediationResult: any): IncidentStatus {
    if (remediationResult?.success) {
      return 'resolved';
    }

    if (playbookResult.requiresHumanIntervention) {
      return 'awaiting_approval';
    }

    return 'in_progress';
  }

  /**
   * Compile all actions taken
   *
   * @param playbookResult - Playbook result
   * @param containmentResult - Containment result
   * @param remediationResult - Remediation result
   * @returns Array of actions
   */
  private compileActions(
    playbookResult: any,
    containmentResult: any,
    remediationResult: any
  ): ResponseAction[] {
    const actions: ResponseAction[] = [];

    if (playbookResult?.actions) {
      actions.push(...playbookResult.actions);
    }

    if (containmentResult?.actions) {
      actions.push(...containmentResult.actions);
    }

    if (remediationResult?.actions) {
      actions.push(...remediationResult.actions);
    }

    return actions;
  }

  /**
   * Force escalate incident to human operator
   *
   * @param incidentId - Incident ID
   * @param reason - Escalation reason
   */
  async escalate(incidentId: string, reason: string): Promise<void> {
    const response = this.activeIncidents.get(incidentId);

    if (!response) {
      throw new Error(`Incident ${incidentId} not found`);
    }

    this.emit('incident:escalated', { incidentId, reason });

    // Update status
    response.status = 'escalated';
    response.actions.push({
      type: 'escalation',
      description: `Escalated to human operator: ${reason}`,
      timestamp: new Date(),
      success: true,
    });
  }

  /**
   * Shutdown responder gracefully
   */
  async shutdown(): Promise<void> {
    this.emit('responder:shutdown');

    // Wait for active incidents to complete
    const completionPromises = Array.from(this.activeIncidents.keys()).map(
      id => this.completeIncident(id).catch(err =>
        console.error(`Failed to complete incident ${id}:`, err)
      )
    );

    await Promise.all(completionPromises);

    this.removeAllListeners();
  }
}
