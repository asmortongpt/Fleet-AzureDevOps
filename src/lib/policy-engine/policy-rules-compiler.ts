/**
 * Policy-to-Rules Compiler
 * Transforms human-readable policies into executable application rules
 *
 * This is the BRAIN of the application - it takes policies created in the Policy Hub
 * and compiles them into enforceable rules that actively govern ALL operations across
 * the entire Fleet Management application.
 *
 * Flow:
 * 1. Policy created/updated in Policy Hub
 * 2. Compiler transforms policy into executable rules
 * 3. Rules deployed to enforcement engine
 * 4. Real-time validation on every operation
 * 5. Violations tracked and enforced
 * 6. Feedback loop informs policy refinement
 */

import type { Policy } from './types'

// ============================================================================
// Core Rule Types
// ============================================================================

export interface CompiledRule {
  id: string
  policyId: string
  policyName: string
  ruleType: 'validation' | 'automation' | 'approval' | 'notification' | 'calculation'
  module: ApplicationModule[]
  trigger: RuleTrigger
  conditions: RuleCondition[]
  actions: RuleAction[]
  priority: number
  active: boolean
  metadata: RuleMetadata
}

export type ApplicationModule =
  | 'dispatch'
  | 'maintenance'
  | 'fuel'
  | 'driver'
  | 'vehicle'
  | 'parts'
  | 'compliance'
  | 'telematics'
  | 'financial'
  | 'reservations'
  | 'all'

export interface RuleTrigger {
  event: string // e.g., 'vehicle.assign', 'maintenance.schedule', 'fuel.transaction'
  timing: 'before' | 'after' | 'instead-of' // When to evaluate
  scope: 'single' | 'batch' // Single operation or batch
}

export interface RuleCondition {
  field: string
  operator: 'equals' | 'not-equals' | 'greater-than' | 'less-than' | 'contains' | 'in' | 'not-in' | 'matches' | 'exists' | 'custom'
  value: any
  dataSource?: 'event' | 'database' | 'api' | 'calculated'
  customLogic?: string // JavaScript expression for complex conditions
}

export interface RuleAction {
  type: 'block' | 'allow' | 'warn' | 'require-approval' | 'modify' | 'log' | 'notify' | 'execute-workflow' | 'calculate'
  target?: string | string[]
  value?: any
  message?: string
  approvers?: string[]
  workflowId?: string
  notificationTemplate?: string
  executionLogic?: string
}

export interface RuleMetadata {
  complianceFramework?: string[]
  riskLevel: 'low' | 'medium' | 'high' | 'critical'
  enforcementMode: 'monitor' | 'warn' | 'enforce'
  auditRequired: boolean
  documentationUrl?: string
  exceptionPolicy?: string
}

// ============================================================================
// Policy-to-Rules Compiler
// ============================================================================

export class PolicyRulesCompiler {
  /**
   * Main compilation entry point
   * Transforms a policy into executable rules
   */
  async compilePolicy(policy: Policy): Promise<CompiledRule[]> {
    const rules: CompiledRule[] = []

    // Analyze policy conditions and generate validation rules
    const validationRules = this.generateValidationRules(policy)
    rules.push(...validationRules)

    // Generate automation rules for policy actions
    const automationRules = this.generateAutomationRules(policy)
    rules.push(...automationRules)

    // Generate approval workflow rules
    const approvalRules = this.generateApprovalRules(policy)
    rules.push(...approvalRules)

    // Generate notification rules
    const notificationRules = this.generateNotificationRules(policy)
    rules.push(...notificationRules)

    // Generate calculation rules for dynamic values
    const calculationRules = this.generateCalculationRules(policy)
    rules.push(...calculationRules)

    return rules
  }

  /**
   * Generates validation rules that enforce policy constraints
   */
  private generateValidationRules(policy: Policy): CompiledRule[] {
    const rules: CompiledRule[] = []

    // Example: Driver qualification policy
    if (policy.type === 'driver-qualification') {
      rules.push({
        id: `${policy.id}-validation-license`,
        policyId: policy.id,
        policyName: policy.name,
        ruleType: 'validation',
        module: ['driver', 'vehicle', 'dispatch'],
        trigger: {
          event: 'vehicle.assign',
          timing: 'before',
          scope: 'single',
        },
        conditions: [
          {
            field: 'driver.licenseStatus',
            operator: 'not-equals',
            value: 'valid',
            dataSource: 'database',
          },
          {
            field: 'driver.licenseExpiryDate',
            operator: 'less-than',
            value: 'TODAY',
            dataSource: 'calculated',
          },
        ],
        actions: [
          {
            type: 'block',
            message: 'POLICY VIOLATION: Driver does not have a valid license. Cannot assign vehicle.',
          },
          {
            type: 'log',
            target: 'policy_violations',
          },
          {
            type: 'notify',
            target: 'fleet.manager',
            notificationTemplate: 'driver-license-invalid',
          },
        ],
        priority: 100,
        active: true,
        metadata: {
          complianceFramework: ['DOT', 'State DMV'],
          riskLevel: 'critical',
          enforcementMode: 'enforce',
          auditRequired: true,
        },
      })

      // CDL requirement for CMVs
      rules.push({
        id: `${policy.id}-validation-cdl`,
        policyId: policy.id,
        policyName: policy.name,
        ruleType: 'validation',
        module: ['vehicle', 'driver', 'dispatch'],
        trigger: {
          event: 'vehicle.assign',
          timing: 'before',
          scope: 'single',
        },
        conditions: [
          {
            field: 'vehicle.requiresCDL',
            operator: 'equals',
            value: true,
            dataSource: 'database',
          },
          {
            field: 'driver.hasCDL',
            operator: 'not-equals',
            value: true,
            dataSource: 'database',
          },
        ],
        actions: [
          {
            type: 'block',
            message: 'POLICY VIOLATION: This vehicle requires a CDL. Driver is not CDL-qualified.',
          },
          {
            type: 'log',
            target: 'policy_violations',
          },
        ],
        priority: 100,
        active: true,
        metadata: {
          complianceFramework: ['DOT/FMCSA'],
          riskLevel: 'critical',
          enforcementMode: 'enforce',
          auditRequired: true,
        },
      })
    }

    // Example: Preventive maintenance policy
    if (policy.type === 'preventive-maintenance') {
      rules.push({
        id: `${policy.id}-validation-pm-overdue`,
        policyId: policy.id,
        policyName: policy.name,
        ruleType: 'validation',
        module: ['vehicle', 'dispatch', 'reservations'],
        trigger: {
          event: 'vehicle.dispatch',
          timing: 'before',
          scope: 'single',
        },
        conditions: [
          {
            field: 'vehicle.pmStatus',
            operator: 'equals',
            value: 'overdue',
            dataSource: 'database',
          },
          {
            field: 'vehicle.daysOverdue',
            operator: 'greater-than',
            value: 30,
            dataSource: 'calculated',
          },
        ],
        actions: [
          {
            type: 'block',
            message: 'POLICY VIOLATION: Vehicle is 30+ days overdue for preventive maintenance. Cannot dispatch.',
          },
          {
            type: 'log',
            target: 'policy_violations',
          },
          {
            type: 'notify',
            target: 'maintenance.supervisor',
            notificationTemplate: 'pm-overdue-block',
          },
        ],
        priority: 90,
        active: true,
        metadata: {
          complianceFramework: ['Internal', 'DOT (CMV)'],
          riskLevel: 'high',
          enforcementMode: 'enforce',
          auditRequired: true,
        },
      })
    }

    // Example: Fuel fraud prevention policy
    if (policy.type === 'fuel-fraud-prevention') {
      rules.push({
        id: `${policy.id}-validation-fuel-anomaly`,
        policyId: policy.id,
        policyName: policy.name,
        ruleType: 'validation',
        module: ['fuel'],
        trigger: {
          event: 'fuel.transaction',
          timing: 'after',
          scope: 'single',
        },
        conditions: [
          {
            field: 'transaction.gallons',
            operator: 'greater-than',
            value: 'vehicle.tankCapacity * 1.1', // 110% of tank capacity
            dataSource: 'calculated',
            customLogic: 'transaction.gallons > vehicle.tankCapacity * 1.1',
          },
        ],
        actions: [
          {
            type: 'warn',
            message: 'POLICY ALERT: Fuel transaction exceeds tank capacity. Possible fraud.',
          },
          {
            type: 'log',
            target: 'policy_violations',
          },
          {
            type: 'require-approval',
            approvers: ['fleet.manager', 'risk.manager'],
          },
          {
            type: 'notify',
            target: 'fraud.investigation.team',
            notificationTemplate: 'fuel-anomaly-detected',
          },
        ],
        priority: 80,
        active: true,
        metadata: {
          complianceFramework: ['Internal Controls'],
          riskLevel: 'high',
          enforcementMode: 'warn',
          auditRequired: true,
        },
      })
    }

    return rules
  }

  /**
   * Generates automation rules for policy-driven actions
   */
  private generateAutomationRules(policy: Policy): CompiledRule[] {
    const rules: CompiledRule[] = []

    // Example: Automatic work order creation for PM
    if (policy.type === 'preventive-maintenance') {
      rules.push({
        id: `${policy.id}-automation-pm-workorder`,
        policyId: policy.id,
        policyName: policy.name,
        ruleType: 'automation',
        module: ['maintenance'],
        trigger: {
          event: 'vehicle.mileage.update',
          timing: 'after',
          scope: 'single',
        },
        conditions: [
          {
            field: 'vehicle.mileageSinceLastPM',
            operator: 'greater-than',
            value: 4500, // 90% of 5000 mile PM interval
            dataSource: 'calculated',
          },
        ],
        actions: [
          {
            type: 'execute-workflow',
            workflowId: 'create-pm-workorder',
            executionLogic: `
              createWorkOrder({
                vehicleId: vehicle.id,
                workOrderType: 'PM-A',
                priority: 'routine',
                scheduledDate: addDays(today, 7),
                notes: 'Automatically generated per PM policy'
              })
            `,
          },
          {
            type: 'notify',
            target: 'vehicle.assignedDepartment',
            notificationTemplate: 'pm-due-soon',
          },
        ],
        priority: 50,
        active: true,
        metadata: {
          riskLevel: 'medium',
          enforcementMode: 'monitor',
          auditRequired: false,
        },
      })
    }

    // Example: Automatic driver suspension on license revocation
    if (policy.type === 'driver-qualification') {
      rules.push({
        id: `${policy.id}-automation-suspend-driver`,
        policyId: policy.id,
        policyName: policy.name,
        ruleType: 'automation',
        module: ['driver'],
        trigger: {
          event: 'driver.license.status.change',
          timing: 'after',
          scope: 'single',
        },
        conditions: [
          {
            field: 'license.newStatus',
            operator: 'in',
            value: ['suspended', 'revoked', 'expired'],
            dataSource: 'event',
          },
        ],
        actions: [
          {
            type: 'execute-workflow',
            workflowId: 'suspend-driver-authorization',
            executionLogic: `
              suspendDriverAuthorization({
                driverId: driver.id,
                reason: 'License ' + license.newStatus,
                effectiveDate: 'immediate',
                notifyDriver: true,
                notifySupervisor: true,
                removeVehicleAssignments: true
              })
            `,
          },
          {
            type: 'notify',
            target: 'driver,supervisor,hr.department,fleet.manager',
            notificationTemplate: 'driver-authorization-suspended',
          },
          {
            type: 'log',
            target: 'policy_executions',
          },
        ],
        priority: 100,
        active: true,
        metadata: {
          complianceFramework: ['DOT', 'Internal'],
          riskLevel: 'critical',
          enforcementMode: 'enforce',
          auditRequired: true,
        },
      })
    }

    return rules
  }

  /**
   * Generates approval workflow rules
   */
  private generateApprovalRules(policy: Policy): CompiledRule[] {
    const rules: CompiledRule[] = []

    // Example: High-value maintenance approval
    if (policy.type === 'maintenance-authorization') {
      rules.push({
        id: `${policy.id}-approval-high-value-repair`,
        policyId: policy.id,
        policyName: policy.name,
        ruleType: 'approval',
        module: ['maintenance'],
        trigger: {
          event: 'workorder.estimate.submit',
          timing: 'before',
          scope: 'single',
        },
        conditions: [
          {
            field: 'estimate.totalCost',
            operator: 'greater-than',
            value: 5000,
            dataSource: 'event',
          },
        ],
        actions: [
          {
            type: 'require-approval',
            approvers: ['fleet.manager', 'finance.director'],
            message: 'Repair estimate exceeds $5,000 and requires management approval per policy.',
          },
          {
            type: 'execute-workflow',
            workflowId: 'high-value-repair-approval',
          },
          {
            type: 'log',
            target: 'policy_executions',
          },
        ],
        priority: 70,
        active: true,
        metadata: {
          complianceFramework: ['Internal Controls', 'Procurement'],
          riskLevel: 'medium',
          enforcementMode: 'enforce',
          auditRequired: true,
        },
      })
    }

    return rules
  }

  /**
   * Generates notification rules
   */
  private generateNotificationRules(policy: Policy): CompiledRule[] {
    const rules: CompiledRule[] = []

    // Example: Accident notification policy
    if (policy.type === 'accident-response') {
      rules.push({
        id: `${policy.id}-notification-accident`,
        policyId: policy.id,
        policyName: policy.name,
        ruleType: 'notification',
        module: ['compliance', 'driver'],
        trigger: {
          event: 'accident.reported',
          timing: 'after',
          scope: 'single',
        },
        conditions: [
          {
            field: 'accident.severity',
            operator: 'in',
            value: ['injury', 'major-damage', 'fatality'],
            dataSource: 'event',
          },
        ],
        actions: [
          {
            type: 'notify',
            target: 'fleet.manager,risk.manager,hr.director,city.manager,legal.department',
            notificationTemplate: 'serious-accident-alert',
          },
          {
            type: 'execute-workflow',
            workflowId: 'accident-investigation',
          },
          {
            type: 'log',
            target: 'policy_executions',
          },
        ],
        priority: 100,
        active: true,
        metadata: {
          complianceFramework: ['DOT', 'OSHA', 'Internal'],
          riskLevel: 'critical',
          enforcementMode: 'enforce',
          auditRequired: true,
        },
      })
    }

    return rules
  }

  /**
   * Generates calculation rules for dynamic policy values
   */
  private generateCalculationRules(policy: Policy): CompiledRule[] {
    const rules: CompiledRule[] = []

    // Example: Vehicle replacement score calculation
    if (policy.type === 'vehicle-replacement') {
      rules.push({
        id: `${policy.id}-calculation-replacement-score`,
        policyId: policy.id,
        policyName: policy.name,
        ruleType: 'calculation',
        module: ['vehicle', 'financial'],
        trigger: {
          event: 'vehicle.evaluation.request',
          timing: 'after',
          scope: 'single',
        },
        conditions: [],
        actions: [
          {
            type: 'calculate',
            executionLogic: `
              const age = currentYear - vehicle.year
              const mileage = vehicle.currentMileage
              const maintenanceCost = vehicle.last12MonthsMaintenanceCost
              const reliability = 1 - (vehicle.breakdownsLast12Months / 12)

              const score = (
                (age / vehicle.expectedLifeYears) * 30 +
                (mileage / vehicle.expectedLifeMiles) * 30 +
                (maintenanceCost / vehicle.purchasePrice) * 25 +
                (1 - reliability) * 15
              )

              return {
                replacementScore: score,
                recommendation: score > 75 ? 'replace' : score > 50 ? 'evaluate' : 'keep',
                reasoning: generateReplacementReasoning(age, mileage, maintenanceCost, reliability)
              }
            `,
          },
          {
            type: 'log',
            target: 'policy_executions',
          },
        ],
        priority: 40,
        active: true,
        metadata: {
          riskLevel: 'low',
          enforcementMode: 'monitor',
          auditRequired: false,
        },
      })
    }

    return rules
  }

  /**
   * Decompiles rules back to human-readable policy for review
   */
  decompileRules(rules: CompiledRule[]): string {
    let policyText = ''

    rules.forEach((rule) => {
      policyText += `\n## Rule: ${rule.id}\n`
      policyText += `**Type:** ${rule.ruleType}\n`
      policyText += `**Applies to:** ${rule.module.join(', ')}\n`
      policyText += `**Trigger:** ${rule.trigger.event} (${rule.trigger.timing})\n\n`

      policyText += `**Conditions:**\n`
      rule.conditions.forEach((cond) => {
        policyText += `- ${cond.field} ${cond.operator} ${cond.value}\n`
      })

      policyText += `\n**Actions:**\n`
      rule.actions.forEach((action) => {
        policyText += `- ${action.type}: ${action.message || action.target || 'execute'}\n`
      })

      policyText += `\n**Risk Level:** ${rule.metadata.riskLevel}\n`
      policyText += `**Enforcement Mode:** ${rule.metadata.enforcementMode}\n`
      policyText += `---\n`
    })

    return policyText
  }
}

// ============================================================================
// Singleton instance
// ============================================================================

export const policyRulesCompiler = new PolicyRulesCompiler()
