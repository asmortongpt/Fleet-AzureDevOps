/**
 * SOP-Based Policy Enforcement System
 *
 * This module provides enforcement hooks that integrate policies into
 * every critical operation based on Standard Operating Procedures (SOPs)
 */

import { toast } from 'sonner';

import { checkPolicyCompliance, PolicyEvaluationContext } from './engine';
import { Policy, PolicyType } from './types';

import logger from '@/utils/logger';

export interface PolicyEnforcementResult {
  allowed: boolean;
  requiresApproval: boolean;
  violations: Array<{
    policyId: string;
    policyName: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    message: string;
  }>;
  recommendations: string[];
  blockedReason?: string;
}

/**
 * Enforcement hook for safety incident reporting
 * SOP: All safety incidents must comply with OSHA reporting requirements
 */
export async function enforceSafetyIncidentPolicy(
  policies: Policy[],
  incidentData: {
    severity: string;
    type: string;
    vehicleId?: string;
    driverId?: string;
    injuries: number;
    oshaRecordable: boolean;
  }
): Promise<PolicyEnforcementResult> {
  const context: PolicyEvaluationContext = {
    incidentHistory: 0, // Would come from actual data
    oshaViolations: 0,
    safetyScore: 85,
    timestamp: new Date().toISOString(),
    ...incidentData
  };

  const result = await checkPolicyCompliance(policies, 'safety', context);

  // Log enforcement
  logger.info('Safety incident policy check', {
    allowed: result.allowed,
    violations: result.violations.length,
    requiresApproval: result.requiresApproval
  });

  // Show user feedback
  if (!result.allowed) {
    const criticalViolations = result.violations.filter(v => v.severity === 'critical');
    if (criticalViolations.length > 0) {
      toast.error(`Safety Policy Violation: ${criticalViolations[0].message}`, {
        description: 'This incident cannot be filed without supervisor approval'
      });
    }
  } else if (result.requiresApproval) {
    toast.warning('Supervisor Approval Required', {
      description: 'This incident requires management review before filing'
    });
  }

  return result;
}

/**
 * Enforcement hook for maintenance work orders
 * SOP: Maintenance must follow preventive maintenance schedules and cost limits
 */
export async function enforceMaintenancePolicy(
  policies: Policy[],
  workOrderData: {
    vehicleId: string;
    type: string;
    estimatedCost: number;
    priority: string;
    scheduledDate?: string;
  }
): Promise<PolicyEnforcementResult> {
  const context: PolicyEvaluationContext = {
    ...workOrderData,
    maintenanceDue: false, // Would check actual maintenance schedule
    odometerReading: 0, // Would come from vehicle data
    costPerMile: workOrderData.estimatedCost / 1000, // Simplified
    budgetRemaining: 50000, // Would come from budget system
    timestamp: new Date().toISOString()
  };

  const result = await checkPolicyCompliance(policies, 'maintenance', context);

  logger.info('Maintenance work order policy check', {
    allowed: result.allowed,
    cost: workOrderData.estimatedCost,
    violations: result.violations.length
  });

  if (!result.allowed) {
    toast.error('Maintenance Policy Violation', {
      description: result.violations[0]?.message || 'Work order does not comply with policy'
    });
  }

  return result;
}

/**
 * Enforcement hook for vehicle dispatch/routing
 * SOP: Dispatch must comply with driver hours, vehicle status, and safety requirements
 */
export async function enforceDispatchPolicy(
  policies: Policy[],
  dispatchData: {
    vehicleId: string;
    driverId: string;
    routeDistance: number;
    estimatedDuration: number;
  }
): Promise<PolicyEnforcementResult> {
  const context: PolicyEvaluationContext = {
    vehicleId: dispatchData.vehicleId,
    vehicleStatus: 'active', // Would check actual status
    driverId: dispatchData.driverId,
    driverLicenseStatus: 'valid', // Would check actual license
    driverScorecard: 85, // Would come from scorecard system
    routeDistance: dispatchData.routeDistance,
    estimatedDuration: dispatchData.estimatedDuration,
    timestamp: new Date().toISOString()
  };

  const result = await checkPolicyCompliance(policies, 'dispatch', context);

  logger.info('Dispatch policy check', {
    allowed: result.allowed,
    vehicleId: dispatchData.vehicleId,
    driverId: dispatchData.driverId
  });

  if (!result.allowed) {
    toast.error('Dispatch Policy Violation', {
      description: 'Vehicle cannot be dispatched - check driver hours or vehicle status'
    });
  }

  return result;
}

/**
 * Enforcement hook for EV charging sessions
 * SOP: EV charging must follow grid demand management and cost optimization
 */
export async function enforceEVChargingPolicy(
  policies: Policy[],
  chargingData: {
    vehicleId: string;
    batteryLevel: number;
    chargingStationId: string;
    requestedPower: number;
  }
): Promise<PolicyEnforcementResult> {
  const context: PolicyEvaluationContext = {
    vehicleId: chargingData.vehicleId,
    batteryLevel: chargingData.batteryLevel,
    chargingStationId: chargingData.chargingStationId,
    timestamp: new Date().toISOString()
  };

  const result = await checkPolicyCompliance(policies, 'ev-charging', context);

  logger.info('EV charging policy check', {
    allowed: result.allowed,
    batteryLevel: chargingData.batteryLevel
  });

  if (!result.allowed) {
    toast.error('EV Charging Policy Violation', {
      description: 'Charging session does not comply with energy management policy'
    });
  } else if (result.recommendations.length > 0) {
    toast.info('Charging Recommendation', {
      description: result.recommendations[0]
    });
  }

  return result;
}

/**
 * Enforcement hook for payment/procurement operations
 * SOP: All payments must follow approval workflows and budget constraints
 */
export async function enforcePaymentPolicy(
  policies: Policy[],
  paymentData: {
    amount: number;
    category: string;
    vendorId?: string;
    approvalRequired: boolean;
  }
): Promise<PolicyEnforcementResult> {
  const context: PolicyEvaluationContext = {
    costPerMile: paymentData.amount, // Reusing for amount
    budgetRemaining: 100000, // Would come from budget system
    timestamp: new Date().toISOString(),
    ...paymentData
  };

  const result = await checkPolicyCompliance(policies, 'payments', context);

  logger.info('Payment policy check', {
    allowed: result.allowed,
    amount: paymentData.amount
  });

  if (!result.allowed) {
    toast.error('Payment Policy Violation', {
      description: 'Payment exceeds approval limits or budget constraints'
    });
  } else if (result.requiresApproval) {
    toast.warning('Approval Required', {
      description: `Payment of $${paymentData.amount.toFixed(2)} requires supervisor approval`
    });
  }

  return result;
}

/**
 * Enforcement hook for driver behavior/performance
 * SOP: Driver actions must comply with safety standards and training requirements
 */
export async function enforceDriverBehaviorPolicy(
  policies: Policy[],
  behaviorData: {
    driverId: string;
    action: string;
    severity: string;
  }
): Promise<PolicyEnforcementResult> {
  const context: PolicyEvaluationContext = {
    driverId: behaviorData.driverId,
    driverScorecard: 75, // Would come from actual scorecard
    incidentHistory: 2, // Would come from incident database
    timestamp: new Date().toISOString(),
    ...behaviorData
  };

  const result = await checkPolicyCompliance(policies, 'driver-behavior', context);

  logger.info('Driver behavior policy check', {
    allowed: result.allowed,
    action: behaviorData.action
  });

  if (!result.allowed) {
    toast.error('Driver Policy Violation', {
      description: 'Action violates driver safety or performance policy'
    });
  }

  return result;
}

/**
 * Enforcement hook for environmental compliance
 * SOP: Operations must comply with emissions and environmental regulations
 */
export async function enforceEnvironmentalPolicy(
  policies: Policy[],
  environmentalData: {
    vehicleId: string;
    emissionLevel?: number;
    fuelType: string;
    location: { latitude: number; longitude: number };
  }
): Promise<PolicyEnforcementResult> {
  const context: PolicyEvaluationContext = {
    vehicleId: environmentalData.vehicleId,
    vehicleLocation: environmentalData.location,
    timestamp: new Date().toISOString(),
    ...environmentalData
  };

  const result = await checkPolicyCompliance(policies, 'environmental', context);

  logger.info('Environmental policy check', {
    allowed: result.allowed,
    vehicleId: environmentalData.vehicleId
  });

  if (!result.allowed) {
    toast.error('Environmental Policy Violation', {
      description: 'Operation does not comply with environmental regulations'
    });
  }

  return result;
}

/**
 * Generic enforcement wrapper that can be used for any policy type
 */
export async function enforcePolicy(
  policies: Policy[],
  policyType: PolicyType,
  context: PolicyEvaluationContext
): Promise<PolicyEnforcementResult> {
  const result = await checkPolicyCompliance(policies, policyType, context);

  logger.info('Policy enforcement check', {
    type: policyType,
    allowed: result.allowed,
    violations: result.violations.length
  });

  return result;
}

/**
 * Helper to determine if an action should be blocked entirely
 */
export function shouldBlockAction(result: PolicyEnforcementResult): boolean {
  // Block if not allowed and has critical violations
  if (!result.allowed) {
    const hasCritical = result.violations.some(v => v.severity === 'critical' || v.severity === 'high');
    return hasCritical;
  }
  return false;
}

/**
 * Helper to get approval requirements for an action
 */
export function getApprovalRequirements(result: PolicyEnforcementResult): {
  required: boolean;
  level: 'supervisor' | 'manager' | 'executive' | null;
  reason: string;
} {
  if (!result.requiresApproval) {
    return { required: false, level: null, reason: '' };
  }

  // Determine approval level based on violation severity
  const highestSeverity = result.violations.reduce((max, v) => {
    const severityRank = { low: 1, medium: 2, high: 3, critical: 4 };
    const currentRank = severityRank[v.severity];
    const maxRank = severityRank[max];
    return currentRank > maxRank ? v.severity : max;
  }, 'low' as 'low' | 'medium' | 'high' | 'critical');

  let level: 'supervisor' | 'manager' | 'executive';
  if (highestSeverity === 'critical') {
    level = 'executive';
  } else if (highestSeverity === 'high') {
    level = 'manager';
  } else {
    level = 'supervisor';
  }

  return {
    required: true,
    level,
    reason: result.violations[0]?.message || 'Policy requires approval'
  };
}
