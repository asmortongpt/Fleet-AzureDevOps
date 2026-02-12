/**
 * AI-Driven Policy and Rules Engine
 *
 * This engine evaluates policies against real-time operational data
 * and enforces rules across the fleet management system.
 */

import { Policy, PolicyType } from './types';

import { auditLogger } from '@/lib/audit/audit-logger';
import logger from '@/utils/logger';

export interface PolicyEvaluationContext {
  // Vehicle context
  vehicleId?: string;
  vehicleStatus?: string;
  vehicleMileage?: number;
  vehicleLocation?: { latitude: number; longitude: number };

  // Driver context
  driverId?: string;
  driverLicenseStatus?: string;
  driverScorecard?: number;

  // Maintenance context
  lastMaintenanceDate?: string;
  maintenanceDue?: boolean;
  odometerReading?: number;

  // Safety context
  incidentHistory?: number;
  oshaViolations?: number;
  safetyScore?: number;

  // EV charging context
  batteryLevel?: number;
  chargingStationId?: string;

  // Financial context
  costPerMile?: number;
  budgetRemaining?: number;

  // Dispatch context
  routeDistance?: number;
  estimatedDuration?: number;

  // Additional context
  timestamp?: string;
  tenantId?: string;
  userId?: string;
  [key: string]: any;
}

export interface PolicyEvaluationResult {
  allowed: boolean;
  policy: Policy;
  reason?: string;
  confidence?: number;
  suggestedAction?: string;
  requiresHumanReview?: boolean;
}

export interface PolicyViolation {
  policyId: string;
  policyName: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  timestamp: string;
  context: any;
}

/**
 * Evaluates a single condition against the context
 */
function evaluateCondition(condition: any, context: PolicyEvaluationContext): boolean {
  try {
    const { field, operator, value } = condition;

    // Get the actual value from context
    const contextValue = context[field];

    // Handle missing values
    if (contextValue === undefined || contextValue === null) {
      logger.warn('Policy condition field not found in context', { field, operator, value });
      return false;
    }

    // Evaluate based on operator
    switch (operator) {
      case 'equals':
      case '==':
        return contextValue === value;

      case 'notEquals':
      case '!=':
        return contextValue !== value;

      case 'greaterThan':
      case '>':
        return Number(contextValue) > Number(value);

      case 'lessThan':
      case '<':
        return Number(contextValue) < Number(value);

      case 'greaterThanOrEqual':
      case '>=':
        return Number(contextValue) >= Number(value);

      case 'lessThanOrEqual':
      case '<=':
        return Number(contextValue) <= Number(value);

      case 'contains':
        return String(contextValue).includes(String(value));

      case 'notContains':
        return !String(contextValue).includes(String(value));

      case 'in':
        return Array.isArray(value) && value.includes(contextValue);

      case 'notIn':
        return Array.isArray(value) && !value.includes(contextValue);

      case 'matches':
        return new RegExp(String(value)).test(String(contextValue));

      case 'between':
        if (Array.isArray(value) && value.length === 2) {
          const numValue = Number(contextValue);
          return numValue >= Number(value[0]) && numValue <= Number(value[1]);
        }
        return false;

      default:
        logger.warn('Unknown operator in policy condition', { operator });
        return false;
    }
  } catch (error) {
    logger.error('Error evaluating policy condition', { condition, error });
    return false;
  }
}

/**
 * Evaluates all conditions for a policy (AND logic)
 */
function evaluateConditions(conditions: any[], context: PolicyEvaluationContext): boolean {
  if (!conditions || conditions.length === 0) {
    return true; // No conditions = always pass
  }

  return conditions.every(condition => evaluateCondition(condition, context));
}

/**
 * Determines the severity of a policy violation
 */
function determineSeverity(policy: Policy): 'low' | 'medium' | 'high' | 'critical' {
  // Use policy metadata or defaults
  if (policy.type === 'safety' || policy.type === 'osha') {
    return 'critical';
  }
  if (policy.type === 'maintenance' || policy.type === 'environmental') {
    return 'high';
  }
  if (policy.type === 'vehicle-use' || policy.type === 'driver-behavior') {
    return 'medium';
  }
  return 'low';
}

/**
 * Main policy evaluation function
 */
export async function evaluatePolicy(
  policy: Policy,
  context: PolicyEvaluationContext
): Promise<PolicyEvaluationResult> {
  logger.info('Evaluating policy', { policyId: policy.id, policyName: policy.name, mode: policy.mode });

  // Check if policy is active
  if (policy.status !== 'active') {
    return {
      allowed: true,
      policy,
      reason: 'Policy is not active'
    };
  }

  // Evaluate conditions
  const conditionsMet = evaluateConditions(policy.conditions, context);

  // For monitor mode, always allow but log
  if (policy.mode === 'monitor') {
    if (!conditionsMet) {
      logger.warn('Policy violation detected (monitor mode)', {
        policyId: policy.id,
        policyName: policy.name,
        context
      });
    }

    return {
      allowed: true,
      policy,
      reason: conditionsMet ? 'Conditions met (monitor mode)' : 'Violation logged (monitor mode)',
      confidence: policy.confidenceScore,
      requiresHumanReview: false
    };
  }

  // For human-in-loop mode, flag for review if conditions not met
  if (policy.mode === 'human-in-loop') {
    return {
      allowed: conditionsMet,
      policy,
      reason: conditionsMet ? 'Conditions met' : 'Requires human approval',
      confidence: policy.confidenceScore,
      requiresHumanReview: !conditionsMet
    };
  }

  // For autonomous mode, enforce strictly
  if (policy.mode === 'autonomous') {
    return {
      allowed: conditionsMet,
      policy,
      reason: conditionsMet ? 'Conditions met' : 'Policy violation - action blocked',
      confidence: policy.confidenceScore,
      requiresHumanReview: false
    };
  }

  // Default: allow
  return {
    allowed: true,
    policy,
    reason: 'Unknown policy mode'
  };
}

/**
 * Evaluates multiple policies of a specific type
 */
export async function evaluatePoliciesByType(
  policies: Policy[],
  type: PolicyType,
  context: PolicyEvaluationContext
): Promise<{
  allowed: boolean;
  results: PolicyEvaluationResult[];
  violations: PolicyViolation[];
}> {
  const relevantPolicies = policies.filter(p => p.type === type && p.status === 'active');
  const results: PolicyEvaluationResult[] = [];
  const violations: PolicyViolation[] = [];

  for (const policy of relevantPolicies) {
    const result = await evaluatePolicy(policy, context);
    results.push(result);

    if (!result.allowed && policy.mode === 'autonomous') {
      violations.push({
        policyId: policy.id,
        policyName: policy.name,
        severity: determineSeverity(policy),
        message: result.reason || 'Policy violation detected',
        timestamp: new Date().toISOString(),
        context
      });
    }
  }

  // Block if any autonomous policy fails
  const allowed = !violations.some(v => v.severity === 'critical' || v.severity === 'high');

  return { allowed, results, violations };
}

/**
 * Checks if an action is allowed based on all relevant policies
 */
export async function checkPolicyCompliance(
  policies: Policy[],
  actionType: PolicyType,
  context: PolicyEvaluationContext
): Promise<{
  allowed: boolean;
  requiresApproval: boolean;
  violations: PolicyViolation[];
  recommendations: string[];
}> {
  const evaluation = await evaluatePoliciesByType(policies, actionType, context);

  const requiresApproval = evaluation.results.some(r => r.requiresHumanReview);
  const recommendations: string[] = [];

  // Generate recommendations based on results
  for (const result of evaluation.results) {
    if (result.suggestedAction) {
      recommendations.push(result.suggestedAction);
    }
  }

  return {
    allowed: evaluation.allowed,
    requiresApproval,
    violations: evaluation.violations,
    recommendations
  };
}

/**
 * Logs a policy execution for audit and analytics
 */
export function logPolicyExecution(
  policy: Policy,
  context: PolicyEvaluationContext,
  result: PolicyEvaluationResult
): void {
  logger.info('Policy executed', {
    policyId: policy.id,
    policyName: policy.name,
    policyType: policy.type,
    allowed: result.allowed,
    mode: policy.mode,
    confidence: result.confidence,
    context
  });

  // Send to audit service for compliance logging
  auditLogger.logEvent({
    eventType: 'COMPLIANCE_EVENT',
    action: 'READ',
    userId: context.userId || 'system',
    userRoles: [],
    resource: 'policy',
    resourceId: policy.id,
    timestamp: new Date(),
    ipAddress: 'frontend',
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'policy-engine',
    result: result.allowed ? 'SUCCESS' : 'FAILURE',
    sensitivity: 'INTERNAL',
    details: {
      policyName: policy.name,
      policyType: policy.type,
      allowed: result.allowed,
      mode: policy.mode,
      confidence: result.confidence,
      vehicleId: context.vehicleId,
      driverId: context.driverId,
    },
  }).catch((error: unknown) => {
    logger.warn('Failed to send policy execution to audit service:', { error: String(error) });
  });
}
