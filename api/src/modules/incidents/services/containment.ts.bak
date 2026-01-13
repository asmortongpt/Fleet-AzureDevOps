import { injectable } from 'inversify';

import { BaseService } from '../../../services/base.service';
import type { Incident } from '../../../types/incident';

/**
 * Containment action type
 */
export enum ContainmentActionType {
  ISOLATE_VEHICLE = 'isolate_vehicle',
  REVOKE_ACCESS = 'revoke_access',
  DISABLE_SYSTEMS = 'disable_systems',
  QUARANTINE_DATA = 'quarantine_data',
  RESTRICT_LOCATION = 'restrict_location',
  FREEZE_ASSETS = 'freeze_assets'
}

/**
 * Containment action result
 */
export interface ContainmentAction {
  id: string;
  type: ContainmentActionType;
  targetId: string;
  description: string;
  timestamp: Date;
  status: 'pending' | 'executed' | 'failed' | 'reversed';
  reversible: boolean;
  reverseAction?: string;
  metadata: Record<string, any>;
}

/**
 * Containment plan for an incident
 */
export interface ContainmentPlan {
  incidentId: number;
  createdAt: Date;
  actions: ContainmentAction[];
  contained: boolean;
  containmentPercentage: number;
  riskLevel: 'critical' | 'high' | 'medium' | 'low';
}

/**
 * ContainmentService - Isolates and contains threats
 * Implements immediate containment measures for security and safety incidents
 */
@injectable()
export class ContainmentService extends BaseService {
  /**
   * Create and execute containment plan for incident
   * @param incident - Incident requiring containment
   * @returns Containment plan with executed actions
   */
  async containIncident(incident: Incident): Promise<ContainmentPlan> {
    const plan: ContainmentPlan = {
      incidentId: incident.id,
      createdAt: new Date(),
      actions: [],
      contained: false,
      containmentPercentage: 0,
      riskLevel: 'high'
    };

    try {
      // Determine required containment measures
      const actions = this.determineContainmentActions(incident);

      // Execute each containment action
      for (const action of actions) {
        const executed = await this.executeContainmentAction(action, incident);
        plan.actions.push(executed);
      }

      // Assess containment status
      this.assessContainment(plan);

      return plan;
    } catch (error) {
      console.error('Containment execution failed:', error);
      plan.contained = false;
      plan.containmentPercentage = plan.actions.filter(a => a.status === 'executed').length / plan.actions.length * 100;
      return plan;
    }
  }

  /**
   * Determine which containment actions are needed
   */
  private determineContainmentActions(incident: Incident): ContainmentAction[] {
    const actions: ContainmentAction[] = [];

    switch (incident.incident_type) {
      case 'theft':
        // Isolate and disable stolen vehicle
        if (incident.vehicle_id) {
          actions.push({
            id: `isolate-${incident.vehicle_id}`,
            type: ContainmentActionType.ISOLATE_VEHICLE,
            targetId: incident.vehicle_id,
            description: 'Isolate stolen vehicle from fleet',
            timestamp: new Date(),
            status: 'pending',
            reversible: false,
            metadata: { reason: 'vehicle_theft' }
          });

          actions.push({
            id: `disable-${incident.vehicle_id}`,
            type: ContainmentActionType.DISABLE_SYSTEMS,
            targetId: incident.vehicle_id,
            description: 'Disable vehicle systems to prevent use',
            timestamp: new Date(),
            status: 'pending',
            reversible: true,
            reverseAction: 're-enable-systems',
            metadata: { systems: ['engine', 'doors', 'fuel'] }
          });

          actions.push({
            id: `revoke-${incident.vehicle_id}`,
            type: ContainmentActionType.REVOKE_ACCESS,
            targetId: incident.vehicle_id,
            description: 'Revoke access keys and credentials',
            timestamp: new Date(),
            status: 'pending',
            reversible: false,
            metadata: { access_types: ['remote', 'app', 'keyfob'] }
          });
        }
        break;

      case 'safety':
        // Restrict movement of affected vehicle
        if (incident.vehicle_id) {
          actions.push({
            id: `restrict-${incident.vehicle_id}`,
            type: ContainmentActionType.RESTRICT_LOCATION,
            targetId: incident.vehicle_id,
            description: 'Restrict vehicle to safe location',
            timestamp: new Date(),
            status: 'pending',
            reversible: true,
            reverseAction: 'unrestrict-location',
            metadata: { reason: 'safety_incident' }
          });

          actions.push({
            id: `disable-systems-${incident.vehicle_id}`,
            type: ContainmentActionType.DISABLE_SYSTEMS,
            targetId: incident.vehicle_id,
            description: 'Disable potentially unsafe systems',
            timestamp: new Date(),
            status: 'pending',
            reversible: true,
            reverseAction: 're-enable-systems',
            metadata: { systems: [] } // To be determined by inspection
          });
        }
        break;

      case 'accident':
        // Restrict accident scene vehicle
        if (incident.vehicle_id) {
          actions.push({
            id: `restrict-scene-${incident.vehicle_id}`,
            type: ContainmentActionType.RESTRICT_LOCATION,
            targetId: incident.vehicle_id,
            description: 'Restrict vehicle at accident scene',
            timestamp: new Date(),
            status: 'pending',
            reversible: true,
            reverseAction: 'release-from-scene',
            metadata: { reason: 'accident_investigation' }
          });
        }

        // Restrict driver if needed
        if (incident.driver_id && incident.injuries_reported) {
          actions.push({
            id: `restrict-driver-${incident.driver_id}`,
            type: ContainmentActionType.RESTRICT_LOCATION,
            targetId: incident.driver_id,
            description: 'Restrict driver from operations pending investigation',
            timestamp: new Date(),
            status: 'pending',
            reversible: true,
            reverseAction: 'clear-driver',
            metadata: { reason: 'injury_accident' }
          });
        }
        break;

      case 'damage':
        // Quarantine damaged vehicle
        if (incident.vehicle_id) {
          actions.push({
            id: `quarantine-${incident.vehicle_id}`,
            type: ContainmentActionType.QUARANTINE_DATA,
            targetId: incident.vehicle_id,
            description: 'Quarantine vehicle pending inspection',
            timestamp: new Date(),
            status: 'pending',
            reversible: true,
            reverseAction: 'release-quarantine',
            metadata: { reason: 'vehicle_damage' }
          });
        }
        break;

      case 'breakdown':
        // Isolate broken vehicle
        if (incident.vehicle_id) {
          actions.push({
            id: `isolate-breakdown-${incident.vehicle_id}`,
            type: ContainmentActionType.ISOLATE_VEHICLE,
            targetId: incident.vehicle_id,
            description: 'Isolate broken vehicle from fleet operations',
            timestamp: new Date(),
            status: 'pending',
            reversible: true,
            reverseAction: 'return-to-service',
            metadata: { reason: 'vehicle_breakdown' }
          });
        }
        break;
    }

    // Add general containment for critical incidents
    if (incident.severity === 'critical') {
      // Freeze assets if significant cost
      if (incident.estimated_cost && incident.estimated_cost > 100000) {
        actions.push({
          id: `freeze-assets-${incident.id}`,
          type: ContainmentActionType.FREEZE_ASSETS,
          targetId: String(incident.id),
          description: 'Freeze incident-related assets pending approval',
          timestamp: new Date(),
          status: 'pending',
          reversible: false,
          metadata: { amount: incident.estimated_cost }
        });
      }
    }

    return actions;
  }

  /**
   * Execute a single containment action
   */
  private async executeContainmentAction(
    action: ContainmentAction,
    incident: Incident
  ): Promise<ContainmentAction> {
    const executedAction = { ...action };

    try {
      switch (action.type) {
        case ContainmentActionType.ISOLATE_VEHICLE:
          await this.isolateVehicle(action.targetId, action.metadata);
          executedAction.status = 'executed';
          break;

        case ContainmentActionType.REVOKE_ACCESS:
          await this.revokeAccess(action.targetId, action.metadata);
          executedAction.status = 'executed';
          break;

        case ContainmentActionType.DISABLE_SYSTEMS:
          await this.disableSystems(action.targetId, action.metadata);
          executedAction.status = 'executed';
          break;

        case ContainmentActionType.QUARANTINE_DATA:
          await this.quarantineData(action.targetId, incident.id, action.metadata);
          executedAction.status = 'executed';
          break;

        case ContainmentActionType.RESTRICT_LOCATION:
          await this.restrictLocation(action.targetId, action.metadata);
          executedAction.status = 'executed';
          break;

        case ContainmentActionType.FREEZE_ASSETS:
          await this.freezeAssets(action.targetId, action.metadata);
          executedAction.status = 'executed';
          break;

        default:
          throw new Error(`Unknown containment action type: ${action.type}`);
      }
    } catch (error) {
      console.error(`Containment action ${action.id} failed:`, error);
      executedAction.status = 'failed';
    }

    return executedAction;
  }

  /**
   * Isolate vehicle from fleet
   */
  private async isolateVehicle(vehicleId: string, metadata: Record<string, any>): Promise<void> {
    // In production, would:
    // 1. Update vehicle status to 'isolated'
    // 2. Remove from active fleet roster
    // 3. Notify fleet management system
    // 4. Log isolation event to audit trail

    return new Promise((resolve) => {
      setTimeout(() => {
        console.log(`Vehicle ${vehicleId} isolated: ${JSON.stringify(metadata)}`);
        resolve();
      }, 100);
    });
  }

  /**
   * Revoke access credentials for vehicle
   */
  private async revokeAccess(vehicleId: string, metadata: Record<string, any>): Promise<void> {
    // In production, would:
    // 1. Revoke all access tokens
    // 2. Invalidate key fobs
    // 3. Disable mobile app access
    // 4. Update access control lists
    // 5. Notify security systems

    return new Promise((resolve) => {
      setTimeout(() => {
        console.log(`Access revoked for ${vehicleId}: ${JSON.stringify(metadata)}`);
        resolve();
      }, 100);
    });
  }

  /**
   * Disable vehicle systems
   */
  private async disableSystems(vehicleId: string, metadata: Record<string, any>): Promise<void> {
    // In production, would:
    // 1. Connect to vehicle telemetry/telematics
    // 2. Disable specified systems (engine, doors, etc.)
    // 3. Send commands to vehicle control systems
    // 4. Verify system status
    // 5. Log actions to audit trail

    return new Promise((resolve) => {
      setTimeout(() => {
        console.log(`Systems disabled for ${vehicleId}: ${JSON.stringify(metadata)}`);
        resolve();
      }, 100);
    });
  }

  /**
   * Quarantine vehicle data
   */
  private async quarantineData(vehicleId: string, incidentId: number, metadata: Record<string, any>): Promise<void> {
    // In production, would:
    // 1. Copy vehicle data to quarantine storage
    // 2. Lock original data from modifications
    // 3. Create forensic snapshot
    // 4. Document chain of custody
    // 5. Flag for analysis

    return new Promise((resolve) => {
      setTimeout(() => {
        console.log(`Data quarantined for ${vehicleId} (incident ${incidentId}): ${JSON.stringify(metadata)}`);
        resolve();
      }, 100);
    });
  }

  /**
   * Restrict vehicle location
   */
  private async restrictLocation(vehicleId: string, metadata: Record<string, any>): Promise<void> {
    // In production, would:
    // 1. Set geofence around incident location
    // 2. Prevent vehicle from leaving area
    // 3. Alert if movement attempted
    // 4. Notify operations
    // 5. Track location continuously

    return new Promise((resolve) => {
      setTimeout(() => {
        console.log(`Location restricted for ${vehicleId}: ${JSON.stringify(metadata)}`);
        resolve();
      }, 100);
    });
  }

  /**
   * Freeze incident-related assets
   */
  private async freezeAssets(targetId: string, metadata: Record<string, any>): Promise<void> {
    // In production, would:
    // 1. Lock assets from procurement
    // 2. Require approval for any transactions
    // 3. Notify finance department
    // 4. Create hold on associated invoices
    // 5. Document reason in system

    return new Promise((resolve) => {
      setTimeout(() => {
        console.log(`Assets frozen for ${targetId}: ${JSON.stringify(metadata)}`);
        resolve();
      }, 100);
    });
  }

  /**
   * Reverse a containment action
   */
  async reverseAction(action: ContainmentAction, reason: string): Promise<ContainmentAction> {
    if (!action.reversible || !action.reverseAction) {
      throw new Error(`Action ${action.id} is not reversible`);
    }

    const reversedAction = { ...action };
    reversedAction.status = 'reversed';
    reversedAction.metadata.reversal_reason = reason;
    reversedAction.metadata.reversed_at = new Date();

    console.log(`Reversed action ${action.id}: ${action.reverseAction}`);

    return reversedAction;
  }

  /**
   * Assess overall containment status
   */
  private assessContainment(plan: ContainmentPlan): void {
    const executedCount = plan.actions.filter(a => a.status === 'executed').length;
    const totalCount = plan.actions.length;

    plan.containmentPercentage = totalCount > 0 ? (executedCount / totalCount) * 100 : 0;
    plan.contained = plan.containmentPercentage >= 80;

    // Determine risk level
    if (plan.containmentPercentage < 50) {
      plan.riskLevel = 'critical';
    } else if (plan.containmentPercentage < 75) {
      plan.riskLevel = 'high';
    } else if (plan.containmentPercentage < 90) {
      plan.riskLevel = 'medium';
    } else {
      plan.riskLevel = 'low';
    }
  }

  /**
   * Get all containment actions for an incident
   */
  async getContainmentActions(incidentId: number): Promise<ContainmentAction[]> {
    // In production, would query from database
    return [];
  }

  /**
   * Get containment history for vehicle
   */
  async getVehicleContainmentHistory(vehicleId: string): Promise<ContainmentPlan[]> {
    // In production, would query from database
    return [];
  }
}
