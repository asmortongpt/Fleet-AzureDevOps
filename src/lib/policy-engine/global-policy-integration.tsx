/**
 * Global Policy Integration Layer
 * Embeds policy enforcement into EVERY operation across the entire Fleet application
 *
 * This file makes policies the CORE GOVERNANCE LAYER that controls all business logic.
 * Nothing happens in this application without policy validation.
 *
 * Integration Points:
 * 1. API interceptors - all API calls validated
 * 2. Form validation - real-time policy checking
 * 3. Database middleware - policy checks before DB writes
 * 4. React hooks - policy-aware components
 * 5. Service layer - automatic policy enforcement
 * 6. Workflow engine - policy-driven workflows
 */

import React from 'react'
import { policyEnforcementEngine, type EnforcementContext, type EnforcementResult } from './policy-enforcement-engine'
import { policyRulesCompiler } from './policy-rules-compiler'
import type { Policy } from './types'

// ============================================================================
// 1. API INTERCEPTOR
// Intercepts all API calls and enforces policies BEFORE execution
// ============================================================================

export class PolicyAPIInterceptor {
  /**
   * Wraps fetch to enforce policies on all API calls
   */
  static async fetch(url: string, options: RequestInit = {}): Promise<Response> {
    // Parse operation from URL and method
    const operation = this.parseOperation(url, options.method || 'GET')
    const module = this.parseModule(url)

    // Extract data from request body
    const data = options.body ? JSON.parse(options.body as string) : {}

    // Enforce policies
    const result = await policyEnforcementEngine.enforce({
      operation,
      module,
      user: getCurrentUser(), // TODO: Get from auth context
      data,
      timestamp: new Date(),
      requestId: `api-${Date.now()}`,
    })

    // Handle enforcement decision
    if (result.decision === 'block') {
      throw new PolicyViolationError(result)
    }

    if (result.decision === 'require-approval') {
      throw new ApprovalRequiredError(result)
    }

    if (result.decision === 'warn') {
      console.warn('Policy Warning:', result.message)
      // Show warning toast to user
      showPolicyWarning(result)
    }

    // Apply modifications if any
    if (result.modifications.length > 0) {
      result.modifications.forEach((mod) => {
        data[mod.field] = mod.modifiedValue
      })
      options.body = JSON.stringify(data)
    }

    // Proceed with original fetch
    return fetch(url, options)
  }

  private static parseOperation(url: string, method: string): string {
    // Examples:
    // POST /api/vehicles/assign -> vehicle.assign
    // PUT /api/drivers/123 -> driver.update
    // POST /api/maintenance/workorders -> maintenance.create-workorder

    const parts = url.split('/').filter(Boolean)
    const resource = parts[parts.length - 2] || parts[parts.length - 1]
    const action = parts[parts.length - 1]

    const methodMap: Record<string, string> = {
      GET: 'read',
      POST: 'create',
      PUT: 'update',
      PATCH: 'update',
      DELETE: 'delete',
    }

    return `${resource}.${action || methodMap[method]}`
  }

  private static parseModule(url: string): string {
    // Extract module from URL path
    // /api/vehicles -> vehicle
    // /api/dispatch -> dispatch
    const match = url.match(/\/api\/(\w+)/)
    return match ? match[1] : 'unknown'
  }
}

// ============================================================================
// 2. FORM VALIDATION INTEGRATION
// Real-time policy checking as users fill out forms
// ============================================================================

export function usePolicyValidation(operation: string, module: string) {
  const [violations, setViolations] = React.useState<any[]>([])
  const [warnings, setWarnings] = React.useState<any[]>([])
  const [isValidating, setIsValidating] = React.useState(false)

  const validate = React.useCallback(
    async (formData: Record<string, any>) => {
      setIsValidating(true)

      try {
        const result = await policyEnforcementEngine.enforce({
          operation,
          module,
          user: getCurrentUser(),
          data: formData,
          timestamp: new Date(),
          requestId: `form-${Date.now()}`,
        })

        setViolations(result.violations)
        setWarnings(result.warnings)

        return result.decision === 'allow' || result.decision === 'warn'
      } finally {
        setIsValidating(false)
      }
    },
    [operation, module]
  )

  return {
    validate,
    violations,
    warnings,
    isValidating,
    hasViolations: violations.length > 0,
    hasWarnings: warnings.length > 0,
  }
}

// ============================================================================
// 3. DATABASE MIDDLEWARE
// Policy checks before any database write operation
// ============================================================================

export class PolicyDatabaseMiddleware {
  /**
   * Wraps database operations with policy enforcement
   */
  static async executeQuery<T>(
    operation: string,
    module: string,
    data: Record<string, any>,
    queryFn: () => Promise<T>
  ): Promise<T> {
    // Enforce policies before database write
    const result = await policyEnforcementEngine.enforce({
      operation,
      module,
      user: getCurrentUser(),
      data,
      timestamp: new Date(),
      requestId: `db-${Date.now()}`,
    })

    // Block if policy violated
    if (result.decision === 'block') {
      throw new PolicyViolationError(result)
    }

    // Require approval if needed
    if (result.decision === 'require-approval') {
      // Create approval workflow and return pending status
      await createApprovalWorkflow(result.requiredApprovals, data)
      throw new ApprovalRequiredError(result)
    }

    // Apply modifications
    if (result.modifications.length > 0) {
      result.modifications.forEach((mod) => {
        data[mod.field] = mod.modifiedValue
      })
    }

    // Execute query
    return queryFn()
  }
}

// ============================================================================
// 4. REACT COMPONENT WRAPPERS
// Policy-aware React components
// ============================================================================

/**
 * HOC that wraps components with policy enforcement
 */
export function withPolicyEnforcement<P extends object>(
  Component: React.ComponentType<P>,
  operation: string,
  module: string
) {
  return function PolicyEnforcedComponent(props: P) {
    const [canRender, setCanRender] = React.useState(false)
    const [policyError, setPolicyError] = React.useState<string | null>(null)

    React.useEffect(() => {
      checkPolicyAccess()
    }, [])

    const checkPolicyAccess = async () => {
      try {
        const result = await policyEnforcementEngine.enforce({
          operation: `${operation}.view`,
          module,
          user: getCurrentUser(),
          data: {},
          timestamp: new Date(),
          requestId: `component-${Date.now()}`,
        })

        if (result.decision === 'block') {
          setPolicyError(result.message || 'Access denied by policy')
          setCanRender(false)
        } else {
          setCanRender(true)
        }
      } catch (error) {
        setPolicyError('Error checking policy access')
        setCanRender(false)
      }
    }

    if (!canRender) {
      return (
        <div className="p-8 text-center">
          <div className="text-red-600 font-semibold mb-2">Access Denied</div>
          <div className="text-slate-600">{policyError}</div>
        </div>
      )
    }

    return <Component {...props} />
  }
}

/**
 * Policy-aware button that checks permissions before allowing click
 */
export function PolicyButton({
  operation,
  module,
  data = {},
  onClick,
  children,
  ...buttonProps
}: {
  operation: string
  module: string
  data?: Record<string, any>
  onClick: () => void | Promise<void>
  children: React.ReactNode
  [key: string]: any
}) {
  const [isChecking, setIsChecking] = React.useState(false)

  const handleClick = async () => {
    setIsChecking(true)

    try {
      const result = await policyEnforcementEngine.enforce({
        operation,
        module,
        user: getCurrentUser(),
        data,
        timestamp: new Date(),
        requestId: `button-${Date.now()}`,
      })

      if (result.decision === 'block') {
        alert(result.message)
        return
      }

      if (result.decision === 'warn') {
        const proceed = confirm(`${result.message}\n\nDo you want to proceed?`)
        if (!proceed) return
      }

      if (result.decision === 'require-approval') {
        alert('This action requires approval. An approval request has been created.')
        await createApprovalWorkflow(result.requiredApprovals, data)
        return
      }

      // Execute actual click handler
      await onClick()
    } finally {
      setIsChecking(false)
    }
  }

  return (
    <button {...buttonProps} onClick={handleClick} disabled={isChecking || buttonProps.disabled}>
      {isChecking ? 'Checking...' : children}
    </button>
  )
}

// ============================================================================
// 5. SERVICE LAYER INTEGRATION
// Automatic policy enforcement in all service methods
// ============================================================================

/**
 * Base service class with built-in policy enforcement
 */
export class PolicyEnforcedService {
  protected module: string

  constructor(module: string) {
    this.module = module
  }

  /**
   * Execute operation with automatic policy enforcement
   */
  protected async executeWithPolicy<T>(
    operation: string,
    data: Record<string, any>,
    action: () => Promise<T>
  ): Promise<T> {
    const result = await policyEnforcementEngine.enforce({
      operation: `${this.module}.${operation}`,
      module: this.module,
      user: getCurrentUser(),
      data,
      timestamp: new Date(),
      requestId: `service-${Date.now()}`,
    })

    if (result.decision === 'block') {
      throw new PolicyViolationError(result)
    }

    if (result.decision === 'require-approval') {
      throw new ApprovalRequiredError(result)
    }

    return action()
  }
}

/**
 * Example: Vehicle Service with Policy Enforcement
 */
export class VehicleService extends PolicyEnforcedService {
  constructor() {
    super('vehicle')
  }

  async assignVehicle(vehicleId: string, driverId: string): Promise<void> {
    return this.executeWithPolicy(
      'assign',
      { vehicleId, driverId },
      async () => {
        // Actual assignment logic
        await fetch('/api/vehicles/assign', {
          method: 'POST',
          body: JSON.stringify({ vehicleId, driverId }),
        })
      }
    )
  }

  async scheduleMainten(vehicleId: string, serviceType: string): Promise<void> {
    return this.executeWithPolicy(
      'schedule-maintenance',
      { vehicleId, serviceType },
      async () => {
        // Actual scheduling logic
        await fetch('/api/maintenance/schedule', {
          method: 'POST',
          body: JSON.stringify({ vehicleId, serviceType }),
        })
      }
    )
  }
}

// ============================================================================
// 6. AUTOMATIC POLICY LOADING ON APP STARTUP
// ============================================================================

export async function initializePolicyEngine(): Promise<void> {
  console.log('Initializing Policy Enforcement Engine...')

  try {
    // Fetch all active policies from Policy Hub
    const policies = await fetchActivePolicies()

    // Compile policies into rules
    const allRules = []
    for (const policy of policies) {
      const rules = await policyRulesCompiler.compilePolicy(policy)
      allRules.push(...rules)
    }

    // Load rules into enforcement engine
    policyEnforcementEngine.loadRules(allRules)

    console.log(`✅ Policy Engine initialized with ${policies.length} policies and ${allRules.length} rules`)

    // Set up policy change listener
    setupPolicyChangeListener()
  } catch (error) {
    console.error('Failed to initialize Policy Engine:', error)
    throw error
  }
}

/**
 * Listen for policy changes and reload rules
 */
function setupPolicyChangeListener(): void {
  // Subscribe to policy updates (via WebSocket or polling)
  // When policies change, recompile and reload

  // Example with polling (replace with WebSocket for real-time)
  setInterval(async () => {
    try {
      const policies = await fetchActivePolicies()
      const allRules = []
      for (const policy of policies) {
        const rules = await policyRulesCompiler.compilePolicy(policy)
        allRules.push(...rules)
      }
      policyEnforcementEngine.loadRules(allRules)
    } catch (error) {
      console.error('Error reloading policies:', error)
    }
  }, 60000) // Check every minute
}

// ============================================================================
// 7. POLICY-DRIVEN WORKFLOW AUTOMATION
// ============================================================================

export class PolicyWorkflowEngine {
  /**
   * Execute workflow triggered by policy
   */
  static async executeWorkflow(workflowId: string, context: any): Promise<void> {
    // TODO: Implement workflow execution
    console.log(`Executing workflow ${workflowId} triggered by policy`)
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function getCurrentUser() {
  // TODO: Get from auth context
  return {
    id: 'user-1',
    name: 'Current User',
    role: 'fleet-manager',
    permissions: ['all'],
  }
}

async function fetchActivePolicies(): Promise<Policy[]> {
  // TODO: Fetch from API
  const response = await fetch('/api/policies?status=active')
  return response.json()
}

async function createApprovalWorkflow(approvals: any[], data: any): Promise<void> {
  // TODO: Create workflow in database
  console.log('Creating approval workflow:', approvals)
}

function showPolicyWarning(result: EnforcementResult): void {
  // TODO: Show toast notification
  console.warn('Policy Warning:', result.message)
}

// ============================================================================
// CUSTOM ERRORS
// ============================================================================

export class PolicyViolationError extends Error {
  constructor(public result: EnforcementResult) {
    super(result.message)
    this.name = 'PolicyViolationError'
  }
}

export class ApprovalRequiredError extends Error {
  constructor(public result: EnforcementResult) {
    super(result.message || 'Approval required')
    this.name = 'ApprovalRequiredError'
  }
}

// ============================================================================
// EXPORT EVERYTHING FOR APP-WIDE USE
// ============================================================================

export {
  policyEnforcementEngine,
  policyRulesCompiler,
}
