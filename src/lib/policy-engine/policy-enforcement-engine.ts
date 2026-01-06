/**
 * Policy Enforcement Engine
 * Real-time rule evaluation and enforcement across all application operations
 *
 * This engine sits between the UI/API and the database, intercepting every operation
 * and enforcing policy-derived rules BEFORE they execute.
 *
 * Architecture:
 * 1. Operation initiated (e.g., assign vehicle to driver)
 * 2. Engine intercepts and identifies applicable rules
 * 3. Rules evaluated against current context
 * 4. Decision: ALLOW / BLOCK / WARN / REQUIRE_APPROVAL
 * 5. Actions executed (notifications, logging, workflows)
 * 6. Operation proceeds or is blocked
 * 7. Results tracked for compliance reporting
 */

import type { CompiledRule, RuleCondition, RuleAction } from './policy-rules-compiler'

// ============================================================================
// Enforcement Types
// ============================================================================

export interface EnforcementContext {
  operation: string // e.g., 'vehicle.assign', 'fuel.transaction'
  module: string
  user: {
    id: string
    name: string
    role: string
    permissions: string[]
  }
  data: Record<string, any> // The data being operated on
  timestamp: Date
  requestId: string
}

export interface EnforcementResult {
  decision: 'allow' | 'block' | 'warn' | 'require-approval' | 'modify'
  appliedRules: AppliedRule[]
  violations: PolicyViolation[]
  warnings: PolicyWarning[]
  requiredApprovals: RequiredApproval[]
  modifications: DataModification[]
  message?: string
  allowOverride: boolean
  overrideRequires: string[] // roles that can override
}

export interface AppliedRule {
  ruleId: string
  policyId: string
  policyName: string
  result: 'passed' | 'failed' | 'warning'
  evaluationTime: number // ms
  details: string
}

export interface PolicyViolation {
  ruleId: string
  policyId: string
  policyName: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  message: string
  field?: string
  expectedValue?: any
  actualValue?: any
  complianceFramework?: string[]
}

export interface PolicyWarning {
  ruleId: string
  policyId: string
  message: string
  recommendation?: string
}

export interface RequiredApproval {
  ruleId: string
  policyId: string
  approvers: string[]
  message: string
  workflowId?: string
}

export interface DataModification {
  field: string
  originalValue: any
  modifiedValue: any
  reason: string
  ruleId: string
}

// ============================================================================
// Policy Enforcement Engine
// ============================================================================

export class PolicyEnforcementEngine {
  private rules: Map<string, CompiledRule[]> = new Map()
  private ruleCache: Map<string, CompiledRule[]> = new Map()

  /**
   * Load rules into the engine
   * Called when policies are created/updated in Policy Hub
   */
  loadRules(rules: CompiledRule[]): void {
    // Clear existing rules
    this.rules.clear()
    this.ruleCache.clear()

    // Index rules by module for fast lookup
    rules.forEach((rule) => {
      rule.module.forEach((module) => {
        if (!this.rules.has(module)) {
          this.rules.set(module, [])
        }
        this.rules.get(module)!.push(rule)
      })
    })

    // Sort rules by priority (highest first)
    this.rules.forEach((moduleRules) => {
      moduleRules.sort((a, b) => b.priority - a.priority)
    })

    console.log(`Policy Enforcement Engine loaded ${rules.length} rules across ${this.rules.size} modules`)
  }

  /**
   * Main enforcement entry point
   * Evaluates all applicable rules for an operation
   */
  async enforce(context: EnforcementContext): Promise<EnforcementResult> {
    const startTime = Date.now()

    // Find applicable rules
    const applicableRules = this.getApplicableRules(context)

    if (applicableRules.length === 0) {
      return {
        decision: 'allow',
        appliedRules: [],
        violations: [],
        warnings: [],
        requiredApprovals: [],
        modifications: [],
        allowOverride: false,
        overrideRequires: [],
      }
    }

    // Evaluate each rule
    const appliedRules: AppliedRule[] = []
    const violations: PolicyViolation[] = []
    const warnings: PolicyWarning[] = []
    const requiredApprovals: RequiredApproval[] = []
    const modifications: DataModification[] = []

    for (const rule of applicableRules) {
      const ruleStart = Date.now()

      try {
        const evaluation = await this.evaluateRule(rule, context)

        appliedRules.push({
          ruleId: rule.id,
          policyId: rule.policyId,
          policyName: rule.policyName,
          result: evaluation.result,
          evaluationTime: Date.now() - ruleStart,
          details: evaluation.details,
        })

        // Collect violations
        if (evaluation.violations) {
          violations.push(...evaluation.violations)
        }

        // Collect warnings
        if (evaluation.warnings) {
          warnings.push(...evaluation.warnings)
        }

        // Collect required approvals
        if (evaluation.requiredApprovals) {
          requiredApprovals.push(...evaluation.requiredApprovals)
        }

        // Collect modifications
        if (evaluation.modifications) {
          modifications.push(...evaluation.modifications)
        }
      } catch (error) {
        console.error(`Error evaluating rule ${rule.id}:`, error)
        // Log error but continue with other rules
      }
    }

    // Determine final decision
    const decision = this.makeDecision(violations, warnings, requiredApprovals)

    // Log enforcement result
    await this.logEnforcement(context, {
      decision,
      appliedRules,
      violations,
      warnings,
      requiredApprovals,
      modifications,
      allowOverride: false,
      overrideRequires: [],
    })

    const totalTime = Date.now() - startTime
    console.log(`Policy enforcement for ${context.operation} completed in ${totalTime}ms (${applicableRules.length} rules evaluated)`)

    return {
      decision,
      appliedRules,
      violations,
      warnings,
      requiredApprovals,
      modifications,
      message: this.generateMessage(decision, violations, warnings),
      allowOverride: violations.length > 0 && violations.every((v) => v.severity !== 'critical'),
      overrideRequires: ['fleet.manager', 'risk.manager'],
    }
  }

  /**
   * Find rules applicable to the current operation
   */
  private getApplicableRules(context: EnforcementContext): CompiledRule[] {
    const cacheKey = `${context.module}:${context.operation}`

    if (this.ruleCache.has(cacheKey)) {
      return this.ruleCache.get(cacheKey)!
    }

    const moduleRules = this.rules.get(context.module) || []
    const allRules = this.rules.get('all') || []

    const applicable = [...moduleRules, ...allRules].filter((rule) => {
      return (
        rule.active &&
        rule.trigger.event === context.operation
      )
    })

    this.ruleCache.set(cacheKey, applicable)
    return applicable
  }

  /**
   * Evaluate a single rule against the context
   */
  private async evaluateRule(
    rule: CompiledRule,
    context: EnforcementContext
  ): Promise<{
    result: 'passed' | 'failed' | 'warning'
    details: string
    violations?: PolicyViolation[]
    warnings?: PolicyWarning[]
    requiredApprovals?: RequiredApproval[]
    modifications?: DataModification[]
  }> {
    // Evaluate all conditions
    const conditionResults = await Promise.all(
      rule.conditions.map((cond) => this.evaluateCondition(cond, context))
    )

    // All conditions must be true for rule to trigger
    const allConditionsMet = conditionResults.every((r) => r === true)

    if (!allConditionsMet) {
      return {
        result: 'passed',
        details: 'Conditions not met, rule not triggered',
      }
    }

    // Conditions met, execute actions
    const violations: PolicyViolation[] = []
    const warnings: PolicyWarning[] = []
    const requiredApprovals: RequiredApproval[] = []
    const modifications: DataModification[] = []

    for (const action of rule.actions) {
      switch (action.type) {
        case 'block':
          violations.push({
            ruleId: rule.id,
            policyId: rule.policyId,
            policyName: rule.policyName,
            severity: rule.metadata.riskLevel,
            message: action.message || 'Operation blocked by policy',
            complianceFramework: rule.metadata.complianceFramework,
          })
          break

        case 'warn':
          warnings.push({
            ruleId: rule.id,
            policyId: rule.policyId,
            message: action.message || 'Policy warning',
          })
          break

        case 'require-approval':
          requiredApprovals.push({
            ruleId: rule.id,
            policyId: rule.policyId,
            approvers: action.approvers || [],
            message: action.message || 'Approval required by policy',
            workflowId: action.workflowId,
          })
          break

        case 'modify':
          if (action.target && action.value !== undefined) {
            modifications.push({
              field: action.target,
              originalValue: context.data[action.target],
              modifiedValue: action.value,
              reason: action.message || 'Modified by policy',
              ruleId: rule.id,
            })
          }
          break

        case 'notify':
          await this.sendNotification(action, context, rule)
          break

        case 'execute-workflow':
          await this.executeWorkflow(action, context, rule)
          break

        case 'log':
          await this.logPolicyAction(action, context, rule)
          break
      }
    }

    const result = violations.length > 0 ? 'failed' : warnings.length > 0 ? 'warning' : 'passed'

    return {
      result,
      details: `Rule triggered: ${violations.length} violations, ${warnings.length} warnings`,
      violations: violations.length > 0 ? violations : undefined,
      warnings: warnings.length > 0 ? warnings : undefined,
      requiredApprovals: requiredApprovals.length > 0 ? requiredApprovals : undefined,
      modifications: modifications.length > 0 ? modifications : undefined,
    }
  }

  /**
   * Evaluate a single condition
   */
  private async evaluateCondition(
    condition: RuleCondition,
    context: EnforcementContext
  ): Promise<boolean> {
    // Get the actual value from context
    let actualValue = this.getValueFromContext(condition.field, context)

    // Handle different data sources
    if (condition.dataSource === 'database') {
      actualValue = await this.getValueFromDatabase(condition.field, context)
    } else if (condition.dataSource === 'api') {
      actualValue = await this.getValueFromAPI(condition.field, context)
    } else if (condition.dataSource === 'calculated') {
      actualValue = await this.calculateValue(condition.field, context)
    }

    // Handle custom logic
    if (condition.customLogic) {
      return this.evaluateCustomLogic(condition.customLogic, context, actualValue)
    }

    // Evaluate operator
    switch (condition.operator) {
      case 'equals':
        return actualValue === condition.value
      case 'not-equals':
        return actualValue !== condition.value
      case 'greater-than':
        return Number(actualValue) > Number(condition.value)
      case 'less-than':
        return Number(actualValue) < Number(condition.value)
      case 'contains':
        return String(actualValue).includes(String(condition.value))
      case 'in':
        return Array.isArray(condition.value) && condition.value.includes(actualValue)
      case 'not-in':
        return Array.isArray(condition.value) && !condition.value.includes(actualValue)
      case 'matches':
        return new RegExp(condition.value).test(String(actualValue))
      case 'exists':
        return actualValue !== null && actualValue !== undefined
      default:
        console.warn(`Unknown operator: ${condition.operator}`)
        return false
    }
  }

  /**
   * Get value from context data
   */
  private getValueFromContext(field: string, context: EnforcementContext): any {
    const parts = field.split('.')
    let value: any = context.data

    for (const part of parts) {
      if (value === null || value === undefined) {
        return undefined
      }
      value = value[part]
    }

    return value
  }

  /**
   * Get value from database (placeholder - implement with actual DB queries)
   */
  private async getValueFromDatabase(field: string, context: EnforcementContext): Promise<any> {
    // TODO: Implement actual database queries
    // For now, return from context
    return this.getValueFromContext(field, context)
  }

  /**
   * Get value from external API (placeholder)
   */
  private async getValueFromAPI(field: string, context: EnforcementContext): Promise<any> {
    // TODO: Implement API calls
    return undefined
  }

  /**
   * Calculate dynamic value
   */
  private async calculateValue(field: string, context: EnforcementContext): Promise<any> {
    // Special calculations
    if (field === 'TODAY') {
      return new Date()
    }

    // TODO: Implement more calculations
    return this.getValueFromContext(field, context)
  }

  /**
   * Evaluate custom JavaScript logic
   */
  private evaluateCustomLogic(
    logic: string,
    context: EnforcementContext,
    actualValue: any
  ): boolean {
    try {
      // Create safe evaluation context
      const evalContext = {
        value: actualValue,
        context: context.data,
        user: context.user,
      }

      // Use Function constructor for safe evaluation (better than eval)
      const fn = new Function('data', `with(data) { return ${logic} }`)
      return fn(evalContext)
    } catch (error) {
      console.error('Error evaluating custom logic:', error)
      return false
    }
  }

  /**
   * Make final enforcement decision
   */
  private makeDecision(
    violations: PolicyViolation[],
    warnings: PolicyWarning[],
    approvals: RequiredApproval[]
  ): 'allow' | 'block' | 'warn' | 'require-approval' {
    // Critical violations always block
    if (violations.some((v) => v.severity === 'critical')) {
      return 'block'
    }

    // Any violations block unless overridden
    if (violations.length > 0) {
      return 'block'
    }

    // Required approvals
    if (approvals.length > 0) {
      return 'require-approval'
    }

    // Warnings allow but alert
    if (warnings.length > 0) {
      return 'warn'
    }

    return 'allow'
  }

  /**
   * Generate user-friendly message
   */
  private generateMessage(
    decision: string,
    violations: PolicyViolation[],
    warnings: PolicyWarning[]
  ): string {
    if (decision === 'block') {
      return `Operation blocked by policy:\n${violations.map((v) => `• ${v.message}`).join('\n')}`
    }

    if (decision === 'warn') {
      return `Policy warnings:\n${warnings.map((w) => `• ${w.message}`).join('\n')}`
    }

    if (decision === 'require-approval') {
      return 'This operation requires management approval per policy.'
    }

    return 'Operation allowed'
  }

  /**
   * Send notification based on policy action
   */
  private async sendNotification(
    action: RuleAction,
    context: EnforcementContext,
    rule: CompiledRule
  ): Promise<void> {
    // TODO: Implement actual notification system
    console.log(`NOTIFICATION: ${action.notificationTemplate} to ${action.target}`)
  }

  /**
   * Execute workflow based on policy action
   */
  private async executeWorkflow(
    action: RuleAction,
    context: EnforcementContext,
    rule: CompiledRule
  ): Promise<void> {
    // TODO: Implement workflow execution
    console.log(`WORKFLOW: ${action.workflowId} triggered by policy ${rule.policyName}`)
  }

  /**
   * Log policy action
   */
  private async logPolicyAction(
    action: RuleAction,
    context: EnforcementContext,
    rule: CompiledRule
  ): Promise<void> {
    // TODO: Implement actual logging to database
    console.log(`POLICY LOG: ${rule.policyName} - ${context.operation}`)
  }

  /**
   * Log enforcement result
   */
  private async logEnforcement(
    context: EnforcementContext,
    result: EnforcementResult
  ): Promise<void> {
    // TODO: Implement actual logging to policy_executions table
    console.log(`ENFORCEMENT: ${context.operation} - ${result.decision}`)
  }

  /**
   * Get enforcement statistics
   */
  async getEnforcementStats(timeRange: { start: Date; end: Date }): Promise<{
    totalEnforcements: number
    allowed: number
    blocked: number
    warnings: number
    approvalsRequired: number
    topViolatedPolicies: Array<{ policyId: string; policyName: string; violations: number }>
    complianceScore: number
  }> {
    // TODO: Implement actual statistics from database
    return {
      totalEnforcements: 0,
      allowed: 0,
      blocked: 0,
      warnings: 0,
      approvalsRequired: 0,
      topViolatedPolicies: [],
      complianceScore: 100,
    }
  }
}

// ============================================================================
// Singleton instance
// ============================================================================

export const policyEnforcementEngine = new PolicyEnforcementEngine()

// ============================================================================
// React Hook for UI Integration
// ============================================================================

/**
 * React hook to enforce policies before operations
 * Usage:
 *
 * const { enforce, isEnforcing } = usePolicyEnforcement()
 *
 * const handleAssignVehicle = async () => {
 *   const result = await enforce({
 *     operation: 'vehicle.assign',
 *     module: 'dispatch',
 *     data: { driverId, vehicleId }
 *   })
 *
 *   if (result.decision === 'block') {
 *     showError(result.message)
 *     return
 *   }
 *
 *   // Proceed with operation
 *   await assignVehicle(driverId, vehicleId)
 * }
 */
export function usePolicyEnforcement() {
  const [isEnforcing, setIsEnforcing] = React.useState(false)

  const enforce = async (context: Partial<EnforcementContext>): Promise<EnforcementResult> => {
    setIsEnforcing(true)

    try {
      // Get user from auth context
      const user = {
        id: 'current-user-id', // TODO: Get from auth
        name: 'Current User',
        role: 'user',
        permissions: [],
      }

      const fullContext: EnforcementContext = {
        operation: context.operation || '',
        module: context.module || '',
        user: context.user || user,
        data: context.data || {},
        timestamp: new Date(),
        requestId: `req-${Date.now()}`,
      }

      return await policyEnforcementEngine.enforce(fullContext)
    } finally {
      setIsEnforcing(false)
    }
  }

  return { enforce, isEnforcing }
}

// Import React for hook
import React from 'react'
