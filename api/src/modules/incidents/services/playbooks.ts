import { injectable } from 'inversify';

import { BaseService } from '../../../services/base.service';
import type { Incident } from '../../../types/incident';

/**
 * Playbook action status
 */
export enum PlaybookActionStatus {
  PENDING = 'pending',
  EXECUTING = 'executing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  SKIPPED = 'skipped'
}

/**
 * Single action in a playbook
 */
export interface PlaybookAction {
  id: string;
  name: string;
  description: string;
  action: string;
  parameters: Record<string, any>;
  requiredFields: string[];
  timeout: number; // milliseconds
  retryCount: number;
  retryDelay: number; // milliseconds
  parallel: boolean; // can run in parallel with other actions
}

/**
 * Complete response playbook for incident type
 */
export interface Playbook {
  id: string;
  incidentType: string;
  priority: string;
  name: string;
  description: string;
  actions: PlaybookAction[];
  version: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Execution result for a single action
 */
export interface ActionExecutionResult {
  actionId: string;
  actionName: string;
  status: PlaybookActionStatus;
  startTime: Date;
  endTime: Date;
  duration: number; // milliseconds
  result: any;
  error?: string;
  retriesUsed: number;
}

/**
 * Complete playbook execution result
 */
export interface PlaybookExecutionResult {
  playbook: Playbook;
  incidentId: number;
  startTime: Date;
  endTime: Date;
  totalDuration: number; // milliseconds
  actions: ActionExecutionResult[];
  overallStatus: 'success' | 'partial' | 'failed';
  successRate: number; // percentage
}

/**
 * PlaybooksService - Executes predefined response playbooks
 * Implements incident response automation with flexible action execution
 */
@injectable()
export class PlaybooksService extends BaseService {
  private playbooks: Map<string, Playbook> = new Map();

  constructor() {
    super();
    this.initializePlaybooks();
  }

  /**
   * Initialize standard playbooks for common incident types
   */
  private initializePlaybooks(): void {
    // Safety Incident Playbook
    this.registerPlaybook({
      id: 'safety-incident-p0',
      incidentType: 'safety',
      priority: 'P0',
      name: 'Critical Safety Incident Response',
      description: 'Immediate response for critical safety incidents',
      version: '1.0.0',
      createdAt: new Date(),
      updatedAt: new Date(),
      actions: [
        {
          id: 'activate-emergency',
          name: 'Activate Emergency Response',
          description: 'Alert emergency response team',
          action: 'notify_emergency_team',
          parameters: { channels: ['email', 'sms', 'phone'] },
          requiredFields: ['contact_info'],
          timeout: 300000,
          retryCount: 3,
          retryDelay: 5000,
          parallel: false
        },
        {
          id: 'secure-scene',
          name: 'Secure Incident Scene',
          description: 'Initiate scene containment',
          action: 'secure_location',
          parameters: { perimeter: 100, unit: 'meters' },
          requiredFields: ['location'],
          timeout: 600000,
          retryCount: 2,
          retryDelay: 10000,
          parallel: false
        },
        {
          id: 'collect-evidence',
          name: 'Collect Initial Evidence',
          description: 'Document scene and injuries',
          action: 'collect_evidence',
          parameters: { photo: true, video: true, witness_statements: true },
          requiredFields: ['incident_id'],
          timeout: 1800000,
          retryCount: 0,
          retryDelay: 0,
          parallel: true
        },
        {
          id: 'notify-authorities',
          name: 'Notify Authorities',
          description: 'Contact police and medical services',
          action: 'notify_authorities',
          parameters: { emergency_services: true },
          requiredFields: ['location'],
          timeout: 300000,
          retryCount: 2,
          retryDelay: 5000,
          parallel: false
        },
        {
          id: 'assign-investigator',
          name: 'Assign Lead Investigator',
          description: 'Assign investigation responsibility',
          action: 'assign_investigator',
          parameters: { priority: 'high', expertise: ['safety', 'accident_investigation'] },
          requiredFields: [],
          timeout: 60000,
          retryCount: 1,
          retryDelay: 5000,
          parallel: false
        }
      ]
    });

    // Theft Incident Playbook
    this.registerPlaybook({
      id: 'theft-incident-p0',
      incidentType: 'theft',
      priority: 'P0',
      name: 'Critical Theft Response',
      description: 'Immediate response for critical theft',
      version: '1.0.0',
      createdAt: new Date(),
      updatedAt: new Date(),
      actions: [
        {
          id: 'disable-vehicle',
          name: 'Disable Stolen Vehicle',
          description: 'Remote disable vehicle if equipped',
          action: 'disable_vehicle',
          parameters: { remote: true, immediate: true },
          requiredFields: ['vehicle_id'],
          timeout: 60000,
          retryCount: 3,
          retryDelay: 5000,
          parallel: false
        },
        {
          id: 'alert-law-enforcement',
          name: 'Alert Law Enforcement',
          description: 'Report vehicle to police',
          action: 'alert_police',
          parameters: { amber_alert: true },
          requiredFields: ['vehicle_id'],
          timeout: 300000,
          retryCount: 2,
          retryDelay: 5000,
          parallel: false
        },
        {
          id: 'freeze-assets',
          name: 'Freeze Vehicle Assets',
          description: 'Prevent asset usage from this vehicle',
          action: 'freeze_assets',
          parameters: { api_access: false, fuel: false, doors: true },
          requiredFields: ['vehicle_id'],
          timeout: 120000,
          retryCount: 1,
          retryDelay: 5000,
          parallel: true
        },
        {
          id: 'notify-insurance',
          name: 'Notify Insurance Provider',
          description: 'Report theft to insurance',
          action: 'notify_insurance',
          parameters: { claim_type: 'theft' },
          requiredFields: ['insurance_policy'],
          timeout: 600000,
          retryCount: 0,
          retryDelay: 0,
          parallel: false
        },
        {
          id: 'activate-tracking',
          name: 'Activate Asset Tracking',
          description: 'Enable GPS and tracking systems',
          action: 'activate_tracking',
          parameters: { gps: true, cellular: true, refresh_rate: 10 },
          requiredFields: ['vehicle_id'],
          timeout: 60000,
          retryCount: 2,
          retryDelay: 5000,
          parallel: true
        }
      ]
    });

    // Accident Incident Playbook
    this.registerPlaybook({
      id: 'accident-incident-p1',
      incidentType: 'accident',
      priority: 'P1',
      name: 'Vehicle Accident Response',
      description: 'Standard response for vehicle accidents',
      version: '1.0.0',
      createdAt: new Date(),
      updatedAt: new Date(),
      actions: [
        {
          id: 'assess-injuries',
          name: 'Assess for Injuries',
          description: 'Check for injuries and medical needs',
          action: 'assess_medical',
          parameters: { call_ambulance: true },
          requiredFields: ['driver_id'],
          timeout: 300000,
          retryCount: 0,
          retryDelay: 0,
          parallel: false
        },
        {
          id: 'document-scene',
          name: 'Document Accident Scene',
          description: 'Photograph and document scene',
          action: 'document_scene',
          parameters: { photos: true, measurements: true, weather: true },
          requiredFields: ['location'],
          timeout: 1200000,
          retryCount: 0,
          retryDelay: 0,
          parallel: true
        },
        {
          id: 'exchange-information',
          name: 'Exchange Information',
          description: 'Collect information from other parties',
          action: 'collect_party_info',
          parameters: { insurance: true, license: true, contact: true },
          requiredFields: [],
          timeout: 1800000,
          retryCount: 0,
          retryDelay: 0,
          parallel: true
        },
        {
          id: 'file-police-report',
          name: 'File Police Report',
          description: 'Report accident to police if required',
          action: 'file_police_report',
          parameters: { injuries: true },
          requiredFields: ['location'],
          timeout: 600000,
          retryCount: 1,
          retryDelay: 10000,
          parallel: false
        },
        {
          id: 'notify-insurer',
          name: 'Notify Insurance',
          description: 'Report accident to insurance company',
          action: 'notify_insurance',
          parameters: { claim_type: 'accident' },
          requiredFields: ['insurance_policy'],
          timeout: 600000,
          retryCount: 0,
          retryDelay: 0,
          parallel: false
        }
      ]
    });

    // Breakdown Incident Playbook
    this.registerPlaybook({
      id: 'breakdown-incident-p2',
      incidentType: 'breakdown',
      priority: 'P2',
      name: 'Vehicle Breakdown Response',
      description: 'Standard response for vehicle breakdowns',
      version: '1.0.0',
      createdAt: new Date(),
      updatedAt: new Date(),
      actions: [
        {
          id: 'assess-safety',
          name: 'Assess Safety',
          description: 'Ensure safe location and conditions',
          action: 'assess_safety',
          parameters: { hazard_lights: true, safe_zone: true },
          requiredFields: ['location'],
          timeout: 300000,
          retryCount: 0,
          retryDelay: 0,
          parallel: false
        },
        {
          id: 'dispatch-assistance',
          name: 'Dispatch Roadside Assistance',
          description: 'Send tow truck and assistance',
          action: 'dispatch_assistance',
          parameters: { service: 'roadside_assistance' },
          requiredFields: ['vehicle_id', 'location'],
          timeout: 600000,
          retryCount: 1,
          retryDelay: 10000,
          parallel: false
        },
        {
          id: 'document-issue',
          name: 'Document Issue',
          description: 'Record breakdown details and symptoms',
          action: 'document_breakdown',
          parameters: { photos: true, diagnostics: true },
          requiredFields: ['incident_id'],
          timeout: 600000,
          retryCount: 0,
          retryDelay: 0,
          parallel: true
        },
        {
          id: 'schedule-maintenance',
          name: 'Schedule Maintenance',
          description: 'Book vehicle for repair',
          action: 'schedule_maintenance',
          parameters: { priority: 'high' },
          requiredFields: ['vehicle_id'],
          timeout: 600000,
          retryCount: 1,
          retryDelay: 5000,
          parallel: false
        }
      ]
    });
  }

  /**
   * Register a new playbook
   * @param playbook - Playbook to register
   */
  registerPlaybook(playbook: Playbook): void {
    this.playbooks.set(playbook.id, playbook);
  }

  /**
   * Get playbook for incident type and priority
   * @param incidentType - Type of incident
   * @param priority - Priority level (P0, P1, etc.)
   * @returns Matching playbook or null
   */
  getPlaybook(incidentType: string, priority: string): Playbook | null {
    const playbookId = `${incidentType}-incident-${priority.toLowerCase()}`;
    return this.playbooks.get(playbookId) || null;
  }

  /**
   * Get all available playbooks
   * @returns Array of all registered playbooks
   */
  getAllPlaybooks(): Playbook[] {
    return Array.from(this.playbooks.values());
  }

  /**
   * Execute a playbook against an incident
   * @param playbook - Playbook to execute
   * @param incident - Incident to respond to
   * @returns Execution result with action outcomes
   */
  async executePlaybook(playbook: Playbook, incident: Incident): Promise<PlaybookExecutionResult> {
    const startTime = new Date();
    const results: ActionExecutionResult[] = [];

    // Separate parallel and sequential actions
    const sequentialActions = playbook.actions.filter(a => !a.parallel);
    const parallelActions = playbook.actions.filter(a => a.parallel);

    try {
      // Execute sequential actions
      for (const action of sequentialActions) {
        const result = await this.executeAction(action, incident);
        results.push(result);
      }

      // Execute parallel actions
      const parallelResults = await Promise.allSettled(
        parallelActions.map(action => this.executeAction(action, incident))
      );

      for (const settledResult of parallelResults) {
        if (settledResult.status === 'fulfilled') {
          results.push(settledResult.value);
        } else {
          results.push({
            actionId: 'unknown',
            actionName: 'parallel-action',
            status: PlaybookActionStatus.FAILED,
            startTime: new Date(),
            endTime: new Date(),
            duration: 0,
            result: null,
            error: String(settledResult.reason),
            retriesUsed: 0
          });
        }
      }
    } catch (error) {
      // Errors are handled per-action, overall status reflects this
    }

    const endTime = new Date();
    const totalDuration = endTime.getTime() - startTime.getTime();
    const successCount = results.filter(r => r.status === PlaybookActionStatus.COMPLETED).length;
    const successRate = Math.round((successCount / results.length) * 100);

    return {
      playbook,
      incidentId: incident.id,
      startTime,
      endTime,
      totalDuration,
      actions: results,
      overallStatus: successRate === 100 ? 'success' : successRate > 50 ? 'partial' : 'failed',
      successRate
    };
  }

  /**
   * Execute a single playbook action with retry logic
   * @param action - Action to execute
   * @param incident - Context incident
   * @returns Action execution result
   */
  private async executeAction(action: PlaybookAction, incident: Incident): Promise<ActionExecutionResult> {
    const startTime = new Date();
    let retriesUsed = 0;
    let lastError: string | undefined;
    let result: any = null;

    for (let attempt = 0; attempt <= action.retryCount; attempt++) {
      try {
        retriesUsed = attempt;
        result = await this.performAction(action, incident, action.timeout);

        return {
          actionId: action.id,
          actionName: action.name,
          status: PlaybookActionStatus.COMPLETED,
          startTime,
          endTime: new Date(),
          duration: new Date().getTime() - startTime.getTime(),
          result,
          retriesUsed
        };
      } catch (error) {
        lastError = error instanceof Error ? error.message : String(error);

        if (attempt < action.retryCount) {
          await this.delay(action.retryDelay);
        }
      }
    }

    return {
      actionId: action.id,
      actionName: action.name,
      status: PlaybookActionStatus.FAILED,
      startTime,
      endTime: new Date(),
      duration: new Date().getTime() - startTime.getTime(),
      result: null,
      error: lastError,
      retriesUsed
    };
  }

  /**
   * Perform the actual action execution
   * @param action - Action to perform
   * @param incident - Context incident
   * @param timeout - Timeout in milliseconds
   * @returns Action result
   */
  private async performAction(
    action: PlaybookAction,
    incident: Incident,
    timeout: number
  ): Promise<any> {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error(`Action ${action.name} timed out after ${timeout}ms`));
      }, timeout);

      try {
        // Validate required fields
        for (const field of action.requiredFields) {
          if (!this.getFieldValue(incident, field)) {
            throw new Error(`Required field missing: ${field}`);
          }
        }

        // Simulate action execution - in production, would call actual handlers
        const result = {
          action: action.action,
          timestamp: new Date(),
          incident_id: incident.id,
          parameters: action.parameters,
          status: 'executed'
        };

        clearTimeout(timer);
        resolve(result);
      } catch (error) {
        clearTimeout(timer);
        reject(error);
      }
    });
  }

  /**
   * Get field value from incident (supports nested paths)
   */
  private getFieldValue(incident: Incident, field: string): any {
    const parts = field.split('.');
    let value: any = incident;

    for (const part of parts) {
      if (value == null) return null;
      value = value[part as keyof typeof value];
    }

    return value;
  }

  /**
   * Delay execution (for retries)
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
