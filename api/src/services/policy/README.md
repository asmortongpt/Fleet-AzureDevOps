# Policy Enforcement Service

**Server-side policy enforcement engine for Fleet Management System**

> **Critical:** This service runs on the server and CANNOT be bypassed by client-side code. All policies from the Policy Hub are compiled and enforced here.

## Overview

The Policy Enforcement Service is THE authoritative enforcement engine for all fleet policies. It provides:

- **Server-side only enforcement** - Cannot be bypassed by client manipulation
- **Safe expression evaluation** - Uses VM2 isolation, no `eval()`
- **Comprehensive audit trail** - Every decision logged
- **Performance optimized** - <50ms target, Redis caching
- **Fail-secure design** - Deny on error or missing policy
- **Support for all policy types** - PM, approvals, fuel, assignments, safety, compliance

## Architecture

```
┌─────────────────┐
│   Policy Hub    │  ← Policy definitions (JSON)
│  (Client-side)  │
└────────┬────────┘
         │ Policies saved to DB
         ▼
┌─────────────────────────────────────────┐
│      Policy Enforcement Service          │
│  (Server-side - THIS SERVICE)            │
├─────────────────────────────────────────┤
│  1. Compile Policies → Executable Rules  │
│  2. Store in DB + Cache in Redis         │
│  3. Enforce on every operation           │
│  4. Log decisions + violations           │
│  5. Trigger approvals/notifications      │
└─────────────────────────────────────────┘
         │
         ▼
┌─────────────────┐
│   Operations    │  ← Create work order, assign vehicle, etc.
│   (Endpoints)   │
└─────────────────┘
```

## Policy Types Supported

| Policy Type | Module | Examples |
|------------|--------|----------|
| Preventive Maintenance | `maintenance` | PM intervals, auto work orders, service scheduling |
| Approval Workflows | `approval` | Dollar thresholds, multi-level approvals, dual control |
| Fuel Management | `fuel` | Transaction limits, fraud detection, budget controls |
| Vehicle Assignment | `assignments` | Driver qualifications, restrictions, CDL requirements |
| Safety & Compliance | `safety` | Hours of Service, inspections, certifications |
| Data Access | `data` | PII protection, data classification, access control |
| Operational | `operations` | Working hours, geofencing, route restrictions |

## Quick Start

### Installation

```typescript
import { policyEnforcementService } from './services/policy/PolicyEnforcementService'
```

### Initialize on App Startup

```typescript
// In your server initialization (e.g., server.ts)
async function initializeApp() {
  // ... other initialization

  // Compile all active policies
  await policyEnforcementService.compileAllPolicies()

  // Warm the cache
  await policyEnforcementService.warmCache()

  console.log('Policy enforcement engine ready')
}
```

### Basic Enforcement

```typescript
// In your API endpoint
const context = {
  operation: 'maintenance:create-work-order',
  module: 'maintenance',
  user: {
    id: req.user.id,
    roles: req.user.roles
  },
  data: {
    vehicleId: req.body.vehicleId,
    estimatedCost: req.body.estimatedCost
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
    error: 'Policy violation',
    violations: result.violations
  })
}

// Proceed with operation
```

## Core API

### Policy Compilation

```typescript
// Compile a single policy
await policyEnforcementService.compilePolicy(policy)

// Compile all active policies
await policyEnforcementService.compileAllPolicies()

// Recompile after policy update
await policyEnforcementService.recompilePolicy(policyId)
```

### Policy Enforcement

```typescript
// Enforce policies
const result = await policyEnforcementService.enforce(context)

// Enforce multiple operations
const results = await policyEnforcementService.enforceMultiple([context1, context2])

// Evaluate a single rule
const evaluation = await policyEnforcementService.evaluateRule(rule, context)
```

### Policy Queries

```typescript
// Get policies by module
const policies = await policyEnforcementService.getPoliciesForModule('maintenance')

// Get policies by action
const policies = await policyEnforcementService.getPoliciesForAction('create-work-order')

// Get active rules
const rules = await policyEnforcementService.getActiveRules('fuel')
```

### Violations

```typescript
// Log a violation
await policyEnforcementService.logViolation(violation)

// Get violations
const violations = await policyEnforcementService.getViolations({
  severity: 'high',
  startDate: new Date('2025-01-01'),
  limit: 50
})

// Get violations by user
const userViolations = await policyEnforcementService.getViolationsByUser(userId)
```

### Approval Workflows

```typescript
// Check if operation requires approval
const requirement = await policyEnforcementService.requiresApproval(
  'maintenance:create-work-order',
  { estimatedCost: 7500 }
)

// Check approval status
const status = await policyEnforcementService.checkApprovalStatus(requestId)
```

### Testing & Simulation

```typescript
// Simulate policy with test cases
const results = await policyEnforcementService.simulatePolicy(policy, testCases)

// Dry run (doesn't log to database)
const result = await policyEnforcementService.dryRun(context)
```

### Performance & Monitoring

```typescript
// Get metrics
const metrics = await policyEnforcementService.getPolicyMetrics()

// Get rule performance
const performance = await policyEnforcementService.getRulePerformance()

// Warm cache
await policyEnforcementService.warmCache()

// Invalidate cache
await policyEnforcementService.invalidatePolicyCache(policyId)
```

## Enforcement Context

The enforcement context provides all information needed to evaluate policies:

```typescript
interface EnforcementContext {
  operation: string        // e.g., 'maintenance:create-work-order'
  module: string          // e.g., 'maintenance'
  user: {
    id: string
    roles: string[]
    department?: string
    attributes?: Record<string, any>
  }
  resource?: {
    type: string          // e.g., 'vehicle', 'work-order'
    id: string
    data: any
  }
  data: any              // Operation-specific data
  environment: {
    timestamp: Date
    ipAddress: string
    userAgent: string
  }
}
```

## Enforcement Result

The result indicates what decision was made and why:

```typescript
interface EnforcementResult {
  decision: 'allow' | 'deny' | 'require-approval' | 'modify'
  appliedRules: string[]              // IDs of rules that were evaluated
  violations: PolicyViolation[]        // Any violations detected
  warnings: string[]                   // Non-blocking warnings
  requiredApprovals?: ApprovalRequirement  // If approval needed
  modifications?: Record<string, any>  // Data modifications applied
  executionTimeMs: number             // Performance metric
  metadata: {
    rulesEvaluated: number
    cacheHit: boolean
    timestamp: Date
  }
}
```

## Decision Handling

Always handle all possible decisions:

```typescript
const result = await policyEnforcementService.enforce(context)

switch (result.decision) {
  case 'allow':
    // Proceed with operation
    await performOperation(data)
    break

  case 'deny':
    // Block operation - return error
    return res.status(403).json({
      error: 'Policy violation',
      violations: result.violations,
      message: result.violations[0]?.description
    })

  case 'require-approval':
    // Create approval workflow
    await createApprovalRequest({
      operation: context.operation,
      approvals: result.requiredApprovals,
      requestedBy: context.user.id
    })
    return res.status(202).json({
      requiresApproval: true,
      message: result.requiredApprovals.message,
      approvers: result.requiredApprovals.approvers
    })

  case 'modify':
    // Apply modifications and proceed
    Object.assign(data, result.modifications)
    await performOperation(data)
    break
}
```

## Compiled Rules

Policies from the Policy Hub are compiled into executable rules:

```typescript
interface CompiledRule {
  id: string
  policyId: string
  policyName: string
  type: RuleType  // validation, calculation, automation, approval, notification
  module: string  // maintenance, fuel, assignments, safety, etc.
  action: string  // create-work-order, record-transaction, etc.
  priority: number  // Higher = evaluated first
  condition: {
    expression: string     // JavaScript expression
    variables: string[]    // Variables needed
  }
  effect: {
    type: 'allow' | 'deny' | 'modify' | 'require-approval' | 'notify'
    message?: string
    modifications?: Record<string, any>
    approvers?: string[]
    notificationRecipients?: string[]
  }
  metadata: {
    compiledAt: Date
    version: string
    performance?: {
      avgMs: number
      p95Ms: number
      executionCount: number
    }
  }
}
```

## Database Tables

The service uses these tables (created by migration `003_policy_enforcement_tables.sql`):

- **`compiled_rules`** - Compiled executable rules from policies
- **`policy_enforcement_logs`** - Audit trail of every enforcement decision
- **`approval_requirements`** - Approval workflows generated by policies
- **`rule_performance_metrics`** - Performance statistics per rule
- **`policy_cache_metadata`** - Cache state tracking
- **`policy_simulation_runs`** - Policy testing results

## Caching Strategy

- **Redis cache** for compiled rules (30 min TTL)
- **In-memory cache** for frequently accessed rules
- **Automatic invalidation** when policies are updated
- **Warm cache** on startup for fast first enforcement
- **Cache hit rate** tracked in metrics

## Performance

Target performance:

- **Rule evaluation**: <50ms per rule
- **Total enforcement**: <100ms for 5-10 rules
- **Cache hit rate**: >85%
- **Error rate**: <1%

Monitor performance:

```typescript
const metrics = await policyEnforcementService.getPolicyMetrics()

console.log(`Avg execution time: ${metrics.avgExecutionTimeMs}ms`)
console.log(`P95 execution time: ${metrics.p95ExecutionTimeMs}ms`)
console.log(`Cache hit rate: ${(metrics.cacheHitRate * 100).toFixed(1)}%`)
```

## Security

### Safe Expression Evaluation

Uses **VM2** for safe JavaScript evaluation:

- No access to `require()`, `process`, `global`
- Timeout protection (100ms max)
- Isolated sandbox per evaluation
- No `eval()` or `Function()` constructor

### Fail-Secure Design

- **Deny on error** - If policy evaluation fails, operation is blocked
- **Deny on missing policy** - If expected policy is missing, deny
- **Circuit breaker** - Auto-disable failing rules after 5 errors
- **Audit trail** - Every decision logged to database

### Authorization

- **User roles** checked in enforcement context
- **Permission validation** before policy evaluation
- **Dual control** support for critical policies
- **MFA enforcement** for sensitive operations

## Metrics & Monitoring

### Prometheus Metrics

The service exposes these metrics:

- `policy_enforcements_total` - Total enforcements by decision/module/operation
- `policy_violations_total` - Total violations by severity/type/module
- `policy_enforcement_duration_ms` - Enforcement duration histogram
- `policy_rule_evaluation_duration_ms` - Individual rule evaluation time
- `policy_compiled_rules_count` - Number of compiled rules by module
- `policy_cache_hits_total` - Cache hit counter
- `policy_cache_misses_total` - Cache miss counter

### Logging

All enforcement decisions are logged to:

1. **Database** (`policy_enforcement_logs`) - Permanent audit trail
2. **Audit Service** - Security event logging
3. **Application logs** - Structured logging with Winston/Pino

## Error Handling

The service uses a fail-secure approach:

```typescript
try {
  const result = await policyEnforcementService.enforce(context)
  return result
} catch (error) {
  // On error, deny the operation
  return {
    decision: 'deny',
    violations: [{
      policyId: 'system',
      severity: 'critical',
      description: `Policy enforcement failed: ${error.message}`
    }],
    // ... other fields
  }
}
```

### Circuit Breaker

Automatically disables failing rules:

- **Threshold**: 5 consecutive failures
- **Reset time**: 1 minute
- **Behavior**: Skip rule evaluation, return error
- **Alerts**: Log warning when circuit opens

## Integration Patterns

### Express Middleware

```typescript
import { policyEnforcementMiddleware } from './middleware/policy'

app.post('/api/maintenance/work-orders',
  authenticate,
  policyEnforcementMiddleware({
    module: 'maintenance',
    operation: 'create-work-order'
  }),
  createWorkOrderHandler
)
```

### Webhook on Policy Update

```typescript
app.post('/webhooks/policy-hub/policy-updated', async (req, res) => {
  const { policyId } = req.body
  await policyEnforcementService.recompilePolicy(policyId)
  res.json({ success: true })
})
```

### Background Jobs

```typescript
// Re-compile policies nightly
cron.schedule('0 2 * * *', async () => {
  await policyEnforcementService.compileAllPolicies()
})
```

## Testing

### Unit Testing

```typescript
import { PolicyEnforcementService } from './PolicyEnforcementService'

describe('PolicyEnforcementService', () => {
  let service: PolicyEnforcementService

  beforeEach(() => {
    service = new PolicyEnforcementService({
      redis: mockRedis,
      db: mockDb,
      auditService: mockAuditService
    })
  })

  it('should deny when PM interval exceeded', async () => {
    const context = {
      operation: 'maintenance:check',
      module: 'maintenance',
      user: { id: 'test', roles: ['Mechanic'] },
      data: {
        vehicle: { odometer: 10000, lastPMOdometer: 0 }
      },
      environment: {
        timestamp: new Date(),
        ipAddress: '127.0.0.1',
        userAgent: 'test'
      }
    }

    const result = await service.enforce(context)

    expect(result.decision).toBe('deny')
    expect(result.violations).toHaveLength(1)
  })
})
```

### Policy Simulation

```typescript
// Test policy before activating
const results = await policyEnforcementService.simulatePolicy(policy, [
  {
    name: 'Low cost repair - should allow',
    context: { /* ... */ },
    expectedDecision: 'allow'
  },
  {
    name: 'High cost repair - should require approval',
    context: { /* ... */ },
    expectedDecision: 'require-approval'
  }
])

const passRate = results.filter(r => r.passed).length / results.length
console.log(`Pass rate: ${passRate * 100}%`)
```

## Best Practices

### 1. Always Enforce on Server

❌ **Don't** rely on client-side validation:
```typescript
// Client code - can be bypassed!
if (estimatedCost > 5000) {
  alert('Requires approval')
}
```

✅ **Do** enforce on server:
```typescript
// Server code - cannot be bypassed
const result = await policyEnforcementService.enforce(context)
if (result.decision === 'deny') {
  throw new PolicyViolationError(result.violations)
}
```

### 2. Handle All Decisions

Always handle `allow`, `deny`, `require-approval`, and `modify`.

### 3. Log All Violations

```typescript
if (result.violations.length > 0) {
  for (const violation of result.violations) {
    await policyEnforcementService.logViolation(violation)

    if (violation.severity === 'critical') {
      await alertSecurityTeam(violation)
    }
  }
}
```

### 4. Monitor Performance

```typescript
const metrics = await policyEnforcementService.getPolicyMetrics()

if (metrics.avgExecutionTimeMs > 100) {
  console.warn('Policy enforcement is slow')
}

if (metrics.errorRate > 0.05) {
  console.error('High error rate in policy enforcement')
}
```

### 5. Test Policies Before Activation

Always simulate policies with test cases before setting status to `active`.

### 6. Use Appropriate Priority

- **200+**: Critical safety/compliance (deny immediately)
- **150-199**: High priority (approvals, restrictions)
- **100-149**: Medium priority (validations, notifications)
- **<100**: Low priority (warnings, informational)

## Troubleshooting

### Rule Not Triggering

```typescript
// Debug: Check active rules
const rules = await policyEnforcementService.getActiveRules('maintenance')
console.log(`Found ${rules.length} rules`)

// Debug: Dry run with your context
const result = await policyEnforcementService.dryRun(context)
console.log('Result:', result)
```

### Slow Performance

```typescript
// Identify slow rules
const performance = await policyEnforcementService.getRulePerformance()

performance.forEach(rule => {
  if (rule.avgExecutionTimeMs > 50) {
    console.warn(`Slow rule: ${rule.ruleId}`)
  }
})

// Warm cache
await policyEnforcementService.warmCache()
```

### High Error Rate

```typescript
// Check metrics
const metrics = await policyEnforcementService.getPolicyMetrics()

if (metrics.errorRate > 0.05) {
  // Check recent errors in logs
  const violations = await policyEnforcementService.getViolations({
    violationType: 'evaluation-error',
    limit: 10
  })

  violations.forEach(v => {
    console.error(`Error in policy ${v.policyId}: ${v.description}`)
  })
}
```

## Examples

See [POLICY_ENFORCEMENT_EXAMPLES.md](./POLICY_ENFORCEMENT_EXAMPLES.md) for comprehensive real-world examples including:

- Preventive maintenance policies
- Approval workflow policies
- Fuel management policies
- Vehicle assignment policies
- Safety and compliance policies
- Policy testing and simulation
- Performance monitoring
- Integration patterns

## Migration

Run the database migration to create required tables:

```bash
psql -d fleet_db -f api/src/db/migrations/003_policy_enforcement_tables.sql
```

Or use your migration tool:

```bash
npm run migrate
```

## Dependencies

- **vm2** - Safe JavaScript evaluation
- **ioredis** - Redis caching
- **pg** - PostgreSQL database
- **prom-client** - Prometheus metrics

## Contributing

When adding new policy types:

1. Update `PolicyType` enum
2. Add compilation logic in `compilePolicy()`
3. Add enforcement logic in `evaluateRule()`
4. Add tests
5. Update documentation

## License

Internal use only - Capital Tech Alliance Fleet Management System

## Support

For issues or questions:
- Check examples: [POLICY_ENFORCEMENT_EXAMPLES.md](./POLICY_ENFORCEMENT_EXAMPLES.md)
- Review logs: `policy_enforcement_logs` table
- Check metrics: `policyEnforcementService.getPolicyMetrics()`
- Contact: fleet-dev@example.com
