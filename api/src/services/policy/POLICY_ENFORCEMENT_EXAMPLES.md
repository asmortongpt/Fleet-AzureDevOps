# Policy Enforcement Service - Usage Examples

Comprehensive examples demonstrating real-world policy enforcement scenarios in the Fleet Management System.

## Table of Contents

1. [Setup and Initialization](#setup-and-initialization)
2. [Preventive Maintenance Policies](#preventive-maintenance-policies)
3. [Approval Workflow Policies](#approval-workflow-policies)
4. [Fuel Management Policies](#fuel-management-policies)
5. [Vehicle Assignment Policies](#vehicle-assignment-policies)
6. [Safety and Compliance Policies](#safety-and-compliance-policies)
7. [Policy Testing and Simulation](#policy-testing-and-simulation)
8. [Performance Monitoring](#performance-monitoring)
9. [Integration Patterns](#integration-patterns)

---

## Setup and Initialization

### Basic Service Initialization

```typescript
import { PolicyEnforcementService, policyEnforcementService } from './PolicyEnforcementService'

// Use singleton instance (recommended for most cases)
const policyService = policyEnforcementService

// OR create custom instance with dependency injection
import redisClient from '../../config/redis'
import { databaseConnectionManager } from '../../database'
import AuditService from '../auditService'

const customPolicyService = new PolicyEnforcementService({
  redis: redisClient,
  db: databaseConnectionManager.getWritePool(),
  auditService: new AuditService()
})
```

### Compile All Policies on Application Startup

```typescript
// In your app initialization (e.g., server.ts)
async function initializePolicyEngine() {
  try {
    console.log('Initializing policy enforcement engine...')

    // Compile all active policies from Policy Hub
    await policyEnforcementService.compileAllPolicies()

    // Warm the cache for fast first enforcement
    await policyEnforcementService.warmCache()

    console.log('Policy enforcement engine ready')
  } catch (error) {
    console.error('Failed to initialize policy engine:', error)
    // Don't fail startup - policies will compile on-demand
  }
}

// Call during app startup
await initializePolicyEngine()
```

---

## Preventive Maintenance Policies

### Example 1: PM Interval Enforcement

**Policy Definition (Policy Hub JSON):**

```json
{
  "id": "pm-light-duty-policy",
  "name": "Light Duty PM Interval Policy",
  "type": "preventive-maintenance",
  "status": "active",
  "mode": "autonomous",
  "version": "1.0",
  "conditions": [
    {
      "expression": "vehicle.classification === 'light-duty' && vehicle.odometer >= vehicle.lastPMOdometer + 5000",
      "priority": 150
    }
  ],
  "actions": [
    {
      "type": "deny",
      "message": "Preventive maintenance required - vehicle has exceeded 5000 mile interval"
    }
  ],
  "createdBy": "fleet-manager@example.com"
}
```

**Server-Side Enforcement:**

```typescript
import { policyEnforcementService } from './services/policy/PolicyEnforcementService'

// In your maintenance scheduling endpoint
app.post('/api/maintenance/schedule-pm', async (req, res) => {
  const { vehicleId, scheduledDate } = req.body

  // Fetch vehicle data
  const vehicle = await db.query('SELECT * FROM vehicles WHERE id = $1', [vehicleId])
  const vehicleData = vehicle.rows[0]

  // Build enforcement context
  const context = {
    operation: 'maintenance:schedule-pm',
    module: 'maintenance',
    user: {
      id: req.user.id,
      roles: req.user.roles,
      department: req.user.department
    },
    resource: {
      type: 'vehicle',
      id: vehicleId,
      data: vehicleData
    },
    data: {
      scheduledDate,
      currentOdometer: vehicleData.mileage,
      lastPMOdometer: vehicleData.last_service_mileage || 0,
      vehicle: {
        classification: vehicleData.classification,
        odometer: vehicleData.mileage,
        lastPMOdometer: vehicleData.last_service_mileage || 0
      }
    },
    environment: {
      timestamp: new Date(),
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    }
  }

  // Enforce policies
  const result = await policyEnforcementService.enforce(context)

  if (result.decision === 'deny') {
    return res.status(403).json({
      error: 'Policy violation',
      violations: result.violations,
      message: result.violations[0]?.description
    })
  }

  // Policy allows - proceed with scheduling
  await schedulePreventiveMaintenance(vehicleId, scheduledDate)

  res.json({
    success: true,
    message: 'PM scheduled successfully',
    warnings: result.warnings
  })
})
```

### Example 2: Automatic Work Order Creation

**Policy Definition:**

```json
{
  "id": "auto-work-order-policy",
  "name": "Automatic Work Order on High Mileage",
  "type": "preventive-maintenance",
  "status": "active",
  "mode": "autonomous",
  "version": "1.0",
  "conditions": [
    {
      "expression": "vehicle.odometer >= vehicle.nextServiceDue && vehicle.status === 'active'",
      "priority": 140
    }
  ],
  "actions": [
    {
      "type": "notify",
      "message": "Work order should be created automatically",
      "notificationRecipients": ["maintenance-team"]
    }
  ],
  "createdBy": "system"
}
```

**Enforcement on Odometer Update:**

```typescript
// In vehicle odometer update endpoint
app.patch('/api/vehicles/:id/odometer', async (req, res) => {
  const { id } = req.params
  const { odometer } = req.body

  const vehicle = await getVehicle(id)

  const context = {
    operation: 'maintenance:odometer-update',
    module: 'maintenance',
    user: req.user,
    resource: {
      type: 'vehicle',
      id,
      data: vehicle
    },
    data: {
      vehicle: {
        ...vehicle,
        odometer,
        nextServiceDue: vehicle.next_service_mileage
      }
    },
    environment: {
      timestamp: new Date(),
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    }
  }

  const result = await policyEnforcementService.enforce(context)

  // Update odometer
  await db.query('UPDATE vehicles SET mileage = $1 WHERE id = $2', [odometer, id])

  // If policy triggered notification, create work order
  if (result.warnings.length > 0) {
    await createAutomaticWorkOrder(id, 'Scheduled PM due')

    // Send notification to maintenance team
    await notificationService.notify({
      recipients: ['maintenance-team@example.com'],
      subject: `Work order created for vehicle ${vehicle.vehicle_number}`,
      body: result.warnings[0]
    })
  }

  res.json({
    success: true,
    odometer,
    workOrderCreated: result.warnings.length > 0
  })
})
```

---

## Approval Workflow Policies

### Example 3: Dollar Threshold Approvals

**Policy Definition:**

```json
{
  "id": "repair-approval-policy",
  "name": "High Value Repair Approval",
  "type": "approval-workflow",
  "status": "active",
  "mode": "human-in-loop",
  "version": "1.0",
  "conditions": [
    {
      "expression": "data.estimatedCost > 5000",
      "priority": 180
    }
  ],
  "actions": [
    {
      "type": "require-approval",
      "message": "Repairs exceeding $5,000 require Fleet Manager approval",
      "approvers": ["FleetManager"]
    }
  ],
  "requiresDualControl": true,
  "createdBy": "finance@example.com"
}
```

**Enforcement:**

```typescript
// In work order creation endpoint
app.post('/api/maintenance/work-orders', async (req, res) => {
  const { vehicleId, serviceType, estimatedCost, description } = req.body

  const context = {
    operation: 'maintenance:create-work-order',
    module: 'maintenance',
    user: {
      id: req.user.id,
      roles: req.user.roles
    },
    data: {
      vehicleId,
      serviceType,
      estimatedCost,
      description
    },
    environment: {
      timestamp: new Date(),
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    }
  }

  const result = await policyEnforcementService.enforce(context)

  if (result.decision === 'require-approval') {
    // Create pending work order
    const workOrder = await createPendingWorkOrder({
      vehicleId,
      serviceType,
      estimatedCost,
      description,
      status: 'pending-approval'
    })

    // Create approval request
    await createApprovalRequest({
      workOrderId: workOrder.id,
      requiredApprovals: result.requiredApprovals,
      requestedBy: req.user.id
    })

    return res.status(202).json({
      success: true,
      requiresApproval: true,
      workOrder,
      message: result.requiredApprovals.message,
      approvers: result.requiredApprovals.approvers
    })
  }

  // No approval needed - create work order immediately
  const workOrder = await createWorkOrder({
    vehicleId,
    serviceType,
    estimatedCost,
    description,
    status: 'scheduled'
  })

  res.json({
    success: true,
    workOrder
  })
})
```

### Example 4: Multi-Level Approvals

**Policy Definition:**

```json
{
  "id": "critical-repair-approval",
  "name": "Critical Repair Multi-Level Approval",
  "type": "approval-workflow",
  "status": "active",
  "mode": "human-in-loop",
  "version": "1.0",
  "conditions": [
    {
      "expression": "data.estimatedCost > 25000",
      "priority": 200
    }
  ],
  "actions": [
    {
      "type": "require-approval",
      "message": "Critical repairs exceeding $25,000 require approval from Fleet Manager AND Finance Director",
      "approvers": ["FleetManager", "FinanceDirector"]
    }
  ],
  "requiresDualControl": true,
  "requiresMFAForExecution": true,
  "createdBy": "executive-team@example.com"
}
```

**Check Approval Status:**

```typescript
// Check if approval is complete
app.get('/api/approvals/:requestId/status', async (req, res) => {
  const { requestId } = req.params

  const status = await policyEnforcementService.checkApprovalStatus(requestId)

  res.json(status)
})

// Approve a request
app.post('/api/approvals/:requestId/approve', async (req, res) => {
  const { requestId } = req.params
  const { comments } = req.body

  const status = await policyEnforcementService.checkApprovalStatus(requestId)

  // Add approval
  status.approvals.push({
    approver: req.user.id,
    decision: 'approved',
    timestamp: new Date(),
    comments
  })

  // Check if all required approvers have approved
  const requiredApprovers = status.requiredApprovals.approvers
  const approvedBy = status.approvals
    .filter(a => a.decision === 'approved')
    .map(a => a.approver)

  const allApproved = requiredApprovers.every(required =>
    approvedBy.some(approver => req.user.roles.includes(required))
  )

  if (allApproved) {
    // Execute the approved action
    await executeApprovedWorkOrder(requestId)

    return res.json({
      success: true,
      status: 'approved',
      message: 'All approvals received - work order executed'
    })
  }

  res.json({
    success: true,
    status: 'pending',
    message: 'Approval recorded - waiting for additional approvals',
    remaining: requiredApprovers.filter(r => !approvedBy.includes(r))
  })
})
```

---

## Fuel Management Policies

### Example 5: Fuel Transaction Fraud Detection

**Policy Definition:**

```json
{
  "id": "fuel-fraud-detection",
  "name": "Fuel Transaction Fraud Detection",
  "type": "fuel-management",
  "status": "active",
  "mode": "autonomous",
  "version": "1.0",
  "conditions": [
    {
      "expression": "data.gallons > 50 || (data.previousTransaction && daysDiff(data.previousTransaction.timestamp, environment.timestamp) === 0 && calculateDistance(data.previousTransaction.location, data.location) > 500)",
      "priority": 190
    }
  ],
  "actions": [
    {
      "type": "deny",
      "message": "Suspicious fuel transaction detected - possible fraud"
    }
  ],
  "createdBy": "security@example.com"
}
```

**Enforcement:**

```typescript
// In fuel transaction recording endpoint
app.post('/api/fuel/transactions', async (req, res) => {
  const { vehicleId, gallons, amount, location } = req.body

  // Get previous transaction
  const previousTx = await db.query(
    `SELECT * FROM fuel_transactions
     WHERE vehicle_id = $1
     ORDER BY date DESC
     LIMIT 1`,
    [vehicleId]
  )

  const context = {
    operation: 'fuel:record-transaction',
    module: 'fuel',
    user: {
      id: req.user.id,
      roles: req.user.roles
    },
    resource: {
      type: 'vehicle',
      id: vehicleId,
      data: await getVehicle(vehicleId)
    },
    data: {
      gallons,
      amount,
      location,
      previousTransaction: previousTx.rows[0] ? {
        timestamp: previousTx.rows[0].date,
        location: previousTx.rows[0].location,
        gallons: previousTx.rows[0].gallons
      } : null
    },
    environment: {
      timestamp: new Date(),
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    }
  }

  const result = await policyEnforcementService.enforce(context)

  if (result.decision === 'deny') {
    // Log security event
    await securityService.logSuspiciousActivity({
      type: 'fuel-fraud-attempt',
      userId: req.user.id,
      vehicleId,
      details: result.violations[0]?.description
    })

    // Alert security team
    await notificationService.alertSecurity({
      subject: 'Suspicious fuel transaction blocked',
      details: result.violations[0]
    })

    return res.status(403).json({
      error: 'Transaction blocked',
      reason: result.violations[0]?.description,
      severity: result.violations[0]?.severity
    })
  }

  // Record transaction
  const transaction = await recordFuelTransaction({
    vehicleId,
    gallons,
    amount,
    location,
    recordedBy: req.user.id
  })

  res.json({
    success: true,
    transaction,
    warnings: result.warnings
  })
})
```

### Example 6: Fuel Budget Limits

**Policy Definition:**

```json
{
  "id": "fuel-budget-limit",
  "name": "Monthly Fuel Budget Limit",
  "type": "fuel-management",
  "status": "active",
  "mode": "human-in-loop",
  "version": "1.0",
  "conditions": [
    {
      "expression": "data.monthlySpend + data.amount > data.monthlyBudget",
      "priority": 160
    }
  ],
  "actions": [
    {
      "type": "require-approval",
      "message": "Transaction exceeds monthly fuel budget - supervisor approval required",
      "approvers": ["Supervisor", "FleetManager"]
    }
  ],
  "createdBy": "finance@example.com"
}
```

---

## Vehicle Assignment Policies

### Example 7: Driver Qualification Validation

**Policy Definition:**

```json
{
  "id": "driver-qualification-policy",
  "name": "CDL Requirement for Heavy Vehicles",
  "type": "vehicle-assignment",
  "status": "active",
  "mode": "autonomous",
  "version": "1.0",
  "conditions": [
    {
      "expression": "vehicle.gvwr > 26000 && !driver.certifications.includes('CDL-A')",
      "priority": 200
    }
  ],
  "actions": [
    {
      "type": "deny",
      "message": "Driver does not have required CDL-A certification for vehicles over 26,000 lbs GVWR"
    }
  ],
  "createdBy": "safety@example.com"
}
```

**Enforcement:**

```typescript
// In vehicle assignment endpoint
app.post('/api/vehicles/:vehicleId/assign', async (req, res) => {
  const { vehicleId } = req.params
  const { driverId } = req.body

  const vehicle = await getVehicle(vehicleId)
  const driver = await getDriver(driverId)

  const context = {
    operation: 'assignments:assign-vehicle',
    module: 'assignments',
    user: {
      id: req.user.id,
      roles: req.user.roles
    },
    resource: {
      type: 'vehicle',
      id: vehicleId,
      data: vehicle
    },
    data: {
      driverId,
      vehicle: {
        gvwr: vehicle.gvwr,
        classification: vehicle.classification,
        requiresCDL: vehicle.gvwr > 26000
      },
      driver: {
        id: driverId,
        certifications: driver.certifications || [],
        licenseClass: driver.license_class
      }
    },
    environment: {
      timestamp: new Date(),
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    }
  }

  const result = await policyEnforcementService.enforce(context)

  if (result.decision === 'deny') {
    return res.status(403).json({
      error: 'Assignment not allowed',
      violations: result.violations,
      message: 'Driver does not meet vehicle requirements'
    })
  }

  // Assign vehicle
  await assignVehicleToDriver(vehicleId, driverId)

  res.json({
    success: true,
    message: 'Vehicle assigned successfully',
    warnings: result.warnings
  })
})
```

---

## Safety and Compliance Policies

### Example 8: Hours of Service Compliance

**Policy Definition:**

```json
{
  "id": "hos-compliance-policy",
  "name": "Hours of Service Daily Limit",
  "type": "safety-compliance",
  "status": "active",
  "mode": "autonomous",
  "version": "1.0",
  "conditions": [
    {
      "expression": "driver.hoursToday >= 11 || driver.consecutiveDays >= 7",
      "priority": 200
    }
  ],
  "actions": [
    {
      "type": "deny",
      "message": "Driver has exceeded Hours of Service limits - cannot dispatch"
    }
  ],
  "createdBy": "compliance@example.com"
}
```

**Enforcement:**

```typescript
// In dispatch/route assignment
app.post('/api/dispatch/assign-route', async (req, res) => {
  const { driverId, routeId } = req.body

  const driver = await getDriver(driverId)
  const route = await getRoute(routeId)

  // Calculate current HOS
  const hoursToday = await calculateDriverHoursToday(driverId)
  const consecutiveDays = await getConsecutiveDrivingDays(driverId)

  const context = {
    operation: 'safety:assign-route',
    module: 'safety',
    user: {
      id: req.user.id,
      roles: req.user.roles
    },
    data: {
      driverId,
      routeId,
      estimatedHours: route.estimated_hours,
      driver: {
        id: driverId,
        hoursToday,
        consecutiveDays,
        remainingHours: 11 - hoursToday
      }
    },
    environment: {
      timestamp: new Date(),
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    }
  }

  const result = await policyEnforcementService.enforce(context)

  if (result.decision === 'deny') {
    return res.status(403).json({
      error: 'HOS violation',
      violations: result.violations,
      remainingHours: 11 - hoursToday
    })
  }

  // Assign route
  await assignRoute(driverId, routeId)

  res.json({
    success: true,
    message: 'Route assigned',
    remainingHours: 11 - hoursToday - route.estimated_hours
  })
})
```

---

## Policy Testing and Simulation

### Example 9: Test Policy Before Activating

```typescript
// Test a new policy with sample data
async function testNewPolicy() {
  // Define policy
  const policy = {
    id: 'test-policy-001',
    name: 'Test PM Policy',
    type: 'preventive-maintenance',
    status: 'draft',
    mode: 'monitor',
    version: '1.0',
    conditions: [
      {
        expression: "vehicle.odometer >= 10000",
        priority: 100
      }
    ],
    actions: [
      {
        type: 'notify',
        message: 'PM due at 10,000 miles'
      }
    ],
    createdBy: 'test@example.com'
  }

  // Define test cases
  const testCases = [
    {
      name: 'Vehicle under threshold',
      context: {
        operation: 'maintenance:check',
        module: 'maintenance',
        user: { id: 'test-user', roles: ['Mechanic'] },
        data: {
          vehicle: { odometer: 8000 }
        },
        environment: {
          timestamp: new Date(),
          ipAddress: '127.0.0.1',
          userAgent: 'test'
        }
      },
      expectedDecision: 'allow' // Should not trigger at 8000 miles
    },
    {
      name: 'Vehicle at threshold',
      context: {
        operation: 'maintenance:check',
        module: 'maintenance',
        user: { id: 'test-user', roles: ['Mechanic'] },
        data: {
          vehicle: { odometer: 10000 }
        },
        environment: {
          timestamp: new Date(),
          ipAddress: '127.0.0.1',
          userAgent: 'test'
        }
      },
      expectedDecision: 'allow' // Should trigger notification
    },
    {
      name: 'Vehicle over threshold',
      context: {
        operation: 'maintenance:check',
        module: 'maintenance',
        user: { id: 'test-user', roles: ['Mechanic'] },
        data: {
          vehicle: { odometer: 15000 }
        },
        environment: {
          timestamp: new Date(),
          ipAddress: '127.0.0.1',
          userAgent: 'test'
        }
      },
      expectedDecision: 'allow' // Should trigger notification
    }
  ]

  // Run simulation
  const results = await policyEnforcementService.simulatePolicy(policy, testCases)

  // Analyze results
  console.log('Policy Simulation Results:')
  console.log('==========================')

  results.forEach(result => {
    console.log(`\nTest: ${result.testCase}`)
    console.log(`  Expected: ${result.expectedDecision}`)
    console.log(`  Actual: ${result.actualDecision}`)
    console.log(`  Passed: ${result.passed ? '✓' : '✗'}`)
    console.log(`  Execution Time: ${result.executionTimeMs.toFixed(2)}ms`)

    if (result.violations.length > 0) {
      console.log(`  Violations: ${result.violations.length}`)
      result.violations.forEach(v => {
        console.log(`    - ${v.description}`)
      })
    }
  })

  const passRate = (results.filter(r => r.passed).length / results.length) * 100
  console.log(`\nOverall Pass Rate: ${passRate.toFixed(1)}%`)

  if (passRate === 100) {
    console.log('✓ All tests passed - policy ready for activation')
  } else {
    console.log('✗ Some tests failed - review policy logic')
  }

  return results
}
```

---

## Performance Monitoring

### Example 10: Monitor Policy Performance

```typescript
// Get policy metrics dashboard
async function getPolicyDashboard() {
  const metrics = await policyEnforcementService.getPolicyMetrics()

  console.log('Policy Enforcement Metrics (Last 24 Hours)')
  console.log('==========================================')
  console.log(`Total Enforcements: ${metrics.totalEnforcements}`)
  console.log(`Total Violations: ${metrics.totalViolations}`)
  console.log(`\nDecisions:`)
  console.log(`  Allow: ${metrics.enforcementsByDecision.allow}`)
  console.log(`  Deny: ${metrics.enforcementsByDecision.deny}`)
  console.log(`  Require Approval: ${metrics.enforcementsByDecision['require-approval']}`)
  console.log(`\nViolations by Severity:`)
  console.log(`  Critical: ${metrics.violationsBySeverity.critical}`)
  console.log(`  High: ${metrics.violationsBySeverity.high}`)
  console.log(`  Medium: ${metrics.violationsBySeverity.medium}`)
  console.log(`  Low: ${metrics.violationsBySeverity.low}`)
  console.log(`\nPerformance:`)
  console.log(`  Avg Execution Time: ${metrics.avgExecutionTimeMs.toFixed(2)}ms`)
  console.log(`  P95 Execution Time: ${metrics.p95ExecutionTimeMs.toFixed(2)}ms`)
  console.log(`  Cache Hit Rate: ${(metrics.cacheHitRate * 100).toFixed(1)}%`)
  console.log(`  Error Rate: ${(metrics.errorRate * 100).toFixed(2)}%`)

  return metrics
}

// Get slow rules that need optimization
async function getSlowRules() {
  const rulePerformance = await policyEnforcementService.getRulePerformance()

  console.log('\nTop 10 Slowest Rules:')
  console.log('====================')

  rulePerformance.slice(0, 10).forEach((rule, index) => {
    console.log(`\n${index + 1}. Rule ${rule.ruleId}`)
    console.log(`   Policy: ${rule.policyId}`)
    console.log(`   Executions: ${rule.executionCount}`)
    console.log(`   Avg Time: ${rule.avgExecutionTimeMs.toFixed(2)}ms`)
    console.log(`   P95 Time: ${rule.p95ExecutionTimeMs.toFixed(2)}ms`)
    console.log(`   Error Rate: ${(rule.errorRate * 100).toFixed(2)}%`)
  })

  return rulePerformance
}
```

---

## Integration Patterns

### Example 11: Express Middleware Pattern

```typescript
// Create middleware for automatic policy enforcement
import { policyEnforcementService } from './services/policy/PolicyEnforcementService'

export function policyEnforcementMiddleware(options: {
  module: string
  operation?: string
  extractContext?: (req: Request) => any
}) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const operation = options.operation || `${options.module}:${req.method.toLowerCase()}`

      const context = {
        operation,
        module: options.module,
        user: {
          id: req.user.id,
          roles: req.user.roles,
          department: req.user.department
        },
        data: options.extractContext ? options.extractContext(req) : req.body,
        environment: {
          timestamp: new Date(),
          ipAddress: req.ip,
          userAgent: req.headers['user-agent']
        }
      }

      const result = await policyEnforcementService.enforce(context)

      if (result.decision === 'deny') {
        return res.status(403).json({
          error: 'Policy violation',
          violations: result.violations,
          message: result.violations[0]?.description
        })
      }

      if (result.decision === 'require-approval') {
        return res.status(202).json({
          requiresApproval: true,
          approvals: result.requiredApprovals,
          message: result.requiredApprovals?.message
        })
      }

      // Attach result to request for downstream use
      req.policyEnforcement = result

      next()
    } catch (error) {
      console.error('Policy enforcement error:', error)
      // Fail-secure: deny on error
      res.status(500).json({
        error: 'Policy enforcement failed',
        message: 'Unable to validate policy compliance'
      })
    }
  }
}

// Usage in routes
app.post('/api/maintenance/work-orders',
  authenticate,
  policyEnforcementMiddleware({
    module: 'maintenance',
    operation: 'create-work-order',
    extractContext: (req) => ({
      vehicleId: req.body.vehicleId,
      estimatedCost: req.body.estimatedCost,
      serviceType: req.body.serviceType
    })
  }),
  async (req, res) => {
    // If we get here, policy allows the operation
    const workOrder = await createWorkOrder(req.body)
    res.json(workOrder)
  }
)
```

### Example 12: Webhook Integration

```typescript
// Re-compile policies when Policy Hub updates
app.post('/webhooks/policy-hub/policy-updated', async (req, res) => {
  const { policyId } = req.body

  try {
    console.log(`Policy ${policyId} updated - recompiling...`)

    await policyEnforcementService.recompilePolicy(policyId)

    console.log(`Policy ${policyId} recompiled successfully`)

    res.json({ success: true })
  } catch (error) {
    console.error(`Failed to recompile policy ${policyId}:`, error)
    res.status(500).json({ error: error.message })
  }
})
```

---

## Best Practices

### 1. Always Use Server-Side Enforcement

```typescript
// ❌ DON'T rely on client-side validation alone
// Client: Check if PM is due
if (vehicle.odometer >= 5000) {
  alert('PM is due!')
}

// ✅ DO enforce on server
const result = await policyEnforcementService.enforce(context)
if (result.decision === 'deny') {
  throw new Error('PM required')
}
```

### 2. Handle All Decision Types

```typescript
const result = await policyEnforcementService.enforce(context)

switch (result.decision) {
  case 'allow':
    // Proceed with operation
    break

  case 'deny':
    // Block operation, return error
    return res.status(403).json({ error: 'Policy violation' })

  case 'require-approval':
    // Create approval workflow
    await createApprovalRequest(result.requiredApprovals)
    return res.status(202).json({ requiresApproval: true })

  case 'modify':
    // Apply modifications and proceed
    Object.assign(data, result.modifications)
    break
}
```

### 3. Log All Violations

```typescript
if (result.violations.length > 0) {
  for (const violation of result.violations) {
    await policyEnforcementService.logViolation(violation)

    // Alert if critical
    if (violation.severity === 'critical') {
      await alertSecurityTeam(violation)
    }
  }
}
```

### 4. Monitor Performance

```typescript
// Set up periodic monitoring
setInterval(async () => {
  const metrics = await policyEnforcementService.getPolicyMetrics()

  if (metrics.avgExecutionTimeMs > 100) {
    console.warn(`Policy enforcement is slow: ${metrics.avgExecutionTimeMs}ms avg`)
  }

  if (metrics.errorRate > 0.05) {
    console.error(`High error rate in policy enforcement: ${metrics.errorRate * 100}%`)
  }
}, 60000) // Every minute
```

---

## Troubleshooting

### Issue: Rule Not Triggering

```typescript
// Debug why a rule isn't triggering
const rules = await policyEnforcementService.getActiveRules('maintenance')

console.log(`Found ${rules.length} rules for maintenance module`)

rules.forEach(rule => {
  console.log(`Rule ${rule.id}:`)
  console.log(`  Condition: ${rule.condition.expression}`)
  console.log(`  Priority: ${rule.priority}`)
  console.log(`  Effect: ${rule.effect.type}`)
})

// Test specific context
const result = await policyEnforcementService.dryRun(context)
console.log('Dry run result:', result)
```

### Issue: Slow Performance

```typescript
// Identify slow rules
const performance = await policyEnforcementService.getRulePerformance()

performance.forEach(rule => {
  if (rule.avgExecutionTimeMs > 50) {
    console.warn(`Slow rule: ${rule.ruleId} (${rule.avgExecutionTimeMs}ms avg)`)
  }
})

// Warm cache if needed
await policyEnforcementService.warmCache()
```

---

## Summary

The Policy Enforcement Service provides:

- **Server-side enforcement** that cannot be bypassed
- **Safe expression evaluation** using VM2 isolation
- **Comprehensive audit trail** of all decisions
- **Performance monitoring** and optimization
- **Flexible policy types** for all fleet operations
- **Approval workflows** for human-in-the-loop scenarios
- **Fail-secure design** (deny on error)

Always enforce policies on the server. The client-side Policy Hub is for display and configuration only - all real enforcement happens in `PolicyEnforcementService`.
