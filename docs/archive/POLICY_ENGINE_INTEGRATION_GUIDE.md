# Policy Engine Integration Guide

## 🎯 Overview

The Fleet Management Application now features a **revolutionary policy engine** that makes policies the **CORE GOVERNANCE LAYER** for the entire application. Every operation - from assigning a vehicle to processing fuel transactions - is now governed by intelligent, AI-generated policies that are automatically enforced in real-time.

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         POLICY HUB                              │
│  (Create, Manage, and Deploy Policies with AI Assistance)      │
└───────────────────────┬─────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────────┐
│                  POLICY-TO-RULES COMPILER                       │
│     (Transforms policies into executable enforcement rules)     │
└───────────────────────┬─────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────────┐
│               POLICY ENFORCEMENT ENGINE                         │
│    (Real-time rule evaluation on every operation)              │
└───────────────────────┬─────────────────────────────────────────┘
                        │
        ┌───────────────┼───────────────┬──────────────┐
        ▼               ▼               ▼              ▼
   ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐
   │   API   │    │  Forms  │    │Database │    │ Service │
   │Intercept│    │Validate │    │Middleware│   │ Layer   │
   └─────────┘    └─────────┘    └─────────┘    └─────────┘
        │               │               │              │
        └───────────────┴───────────────┴──────────────┘
                        │
                        ▼
            ┌───────────────────────────┐
            │  APPLICATION MODULES       │
            │  (Dispatch, Maintenance,   │
            │   Fuel, Driver, etc.)      │
            └────────────────────────────┘
```

## 🔧 Core Components

### 1. Policy Hub (`src/pages/PolicyHub.tsx`)
- **What it does**: User interface for creating and managing policies
- **Features**:
  - 7 comprehensive tabs (Dashboard, Policies, SOPs, Onboarding, Training, Compliance, Workflows)
  - AI-powered policy generation with multi-LLM consensus
  - Visual policy management
  - Professional document export (PDF/Word)

### 2. Policy Workbench (`src/components/features/policy/PolicyWorkbench.tsx`)
- **What it does**: Guided wizard for implementing complete policy system
- **Features**:
  - 8-phase implementation process
  - AI assistance at every step
  - Progress tracking
  - Real-time insights and recommendations

### 3. Policy-to-Rules Compiler (`src/lib/policy-engine/policy-rules-compiler.ts`)
- **What it does**: Transforms human-readable policies into executable rules
- **Process**:
  ```typescript
  Policy → Analysis → Rules Generation → Compiled Rules
  ```
- **Rule Types Generated**:
  - **Validation Rules**: Enforce data constraints (e.g., "driver must have valid license")
  - **Automation Rules**: Trigger automatic actions (e.g., "create work order when PM due")
  - **Approval Rules**: Require management approval (e.g., "repairs over $5,000")
  - **Notification Rules**: Send alerts (e.g., "notify manager of serious accidents")
  - **Calculation Rules**: Compute dynamic values (e.g., "vehicle replacement score")

### 4. Policy Enforcement Engine (`src/lib/policy-engine/policy-enforcement-engine.ts`)
- **What it does**: Evaluates rules in real-time for every operation
- **Decision Flow**:
  ```
  Operation Initiated
         ↓
  Find Applicable Rules
         ↓
  Evaluate Conditions
         ↓
  Execute Actions
         ↓
  Make Decision: ALLOW | BLOCK | WARN | REQUIRE_APPROVAL
         ↓
  Log Results
         ↓
  Return to Caller
  ```

### 5. Global Integration Layer (`src/lib/policy-engine/global-policy-integration.ts`)
- **What it does**: Embeds policy enforcement into every part of the application
- **Integration Points**:
  - API interceptors
  - Form validation
  - Database middleware
  - React components
  - Service layer

## 📋 How Policies Drive the Application

### Example 1: Driver Qualification Policy

**Policy Definition** (in Policy Hub):
```
Driver Qualification Policy
- All drivers must have valid, unexpired licenses
- CDL required for vehicles over 26,001 lbs GVWR
- Medical certification required for CDL holders
- MVR must be reviewed annually
```

**Compiled Rules** (automatic):
```typescript
{
  id: 'driver-qual-validation-license',
  trigger: { event: 'vehicle.assign', timing: 'before' },
  conditions: [
    { field: 'driver.licenseStatus', operator: 'not-equals', value: 'valid' }
  ],
  actions: [
    { type: 'block', message: 'Driver does not have valid license' },
    { type: 'log', target: 'policy_violations' },
    { type: 'notify', target: 'fleet.manager' }
  ]
}
```

**Real-World Impact**:
1. User tries to assign vehicle to driver in Dispatch module
2. Enforcement engine intercepts the operation
3. Checks driver's license status in database
4. If invalid/expired:
   - **BLOCKS** the assignment
   - Shows error to user
   - Logs violation
   - Notifies fleet manager
5. Operation cannot proceed until driver has valid license

### Example 2: Preventive Maintenance Policy

**Policy Definition**:
```
Preventive Maintenance Compliance
- PM services mandatory at specified intervals
- PM-A every 5,000 miles for light-duty vehicles
- Vehicles 30+ days overdue cannot be dispatched
- Automatic work orders created at 90% of interval
```

**Compiled Rules**:
```typescript
// Rule 1: Block dispatch if overdue
{
  trigger: { event: 'vehicle.dispatch', timing: 'before' },
  conditions: [
    { field: 'vehicle.pmStatus', operator: 'equals', value: 'overdue' },
    { field: 'vehicle.daysOverdue', operator: 'greater-than', value: 30 }
  ],
  actions: [
    { type: 'block', message: 'Vehicle is 30+ days overdue for PM' }
  ]
}

// Rule 2: Auto-create work order when approaching due
{
  trigger: { event: 'vehicle.mileage.update', timing: 'after' },
  conditions: [
    { field: 'vehicle.mileageSinceLastPM', operator: 'greater-than', value: 4500 }
  ],
  actions: [
    { type: 'execute-workflow', workflowId: 'create-pm-workorder' },
    { type: 'notify', target: 'vehicle.assignedDepartment' }
  ]
}
```

**Real-World Impact**:
- System automatically creates PM work orders
- Prevents dispatch of overdue vehicles
- Ensures fleet remains in compliance
- Reduces breakdowns through proactive maintenance

### Example 3: Fuel Fraud Prevention Policy

**Policy Definition**:
```
Fuel Fraud Prevention
- Transaction exceeding tank capacity flagged
- After-hours fueling requires explanation
- Consecutive transactions within 1 hour blocked
- Geographic anomalies detected (fueling 100+ miles away)
```

**Compiled Rules**:
```typescript
{
  trigger: { event: 'fuel.transaction', timing: 'after' },
  conditions: [
    {
      field: 'transaction.gallons',
      operator: 'greater-than',
      value: 'vehicle.tankCapacity * 1.1',
      customLogic: 'transaction.gallons > vehicle.tankCapacity * 1.1'
    }
  ],
  actions: [
    { type: 'warn', message: 'Transaction exceeds tank capacity - possible fraud' },
    { type: 'require-approval', approvers: ['fleet.manager', 'risk.manager'] },
    { type: 'notify', target: 'fraud.investigation.team' },
    { type: 'log', target: 'policy_violations' }
  ]
}
```

**Real-World Impact**:
- Suspicious transactions flagged immediately
- Requires manager approval to proceed
- Fraud investigation team notified
- Complete audit trail maintained

## 💻 Developer Integration Guide

### 1. Using Policy Enforcement in React Components

#### Example: Policy-Aware Vehicle Assignment Component

```tsx
import { usePolicyValidation, PolicyButton } from '@/lib/policy-engine/global-policy-integration'

function VehicleAssignment() {
  const [vehicleId, setVehicleId] = useState('')
  const [driverId, setDriverId] = useState('')

  // Real-time validation as form is filled
  const { validate, violations, warnings, isValidating } = usePolicyValidation(
    'vehicle.assign',
    'dispatch'
  )

  // Validate when fields change
  useEffect(() => {
    if (vehicleId && driverId) {
      validate({ vehicleId, driverId })
    }
  }, [vehicleId, driverId, validate])

  const handleAssign = async () => {
    // Actual assignment logic (policy enforcement happens automatically)
    await fetch('/api/vehicles/assign', {
      method: 'POST',
      body: JSON.stringify({ vehicleId, driverId }),
    })
  }

  return (
    <div>
      <select value={vehicleId} onChange={(e) => setVehicleId(e.target.value)}>
        {/* Vehicle options */}
      </select>

      <select value={driverId} onChange={(e) => setDriverId(e.target.value)}>
        {/* Driver options */}
      </select>

      {/* Show policy violations in real-time */}
      {violations.map((violation) => (
        <Alert key={violation.ruleId} variant="destructive">
          <AlertDescription>{violation.message}</AlertDescription>
        </Alert>
      ))}

      {/* Show policy warnings */}
      {warnings.map((warning) => (
        <Alert key={warning.ruleId} variant="warning">
          <AlertDescription>{warning.message}</AlertDescription>
        </Alert>
      ))}

      {/* Policy-aware button - checks policies before allowing click */}
      <PolicyButton
        operation="vehicle.assign"
        module="dispatch"
        data={{ vehicleId, driverId }}
        onClick={handleAssign}
        disabled={violations.length > 0}
      >
        Assign Vehicle
      </PolicyButton>
    </div>
  )
}
```

### 2. Using Policy Enforcement in Service Layer

```typescript
import { PolicyEnforcedService } from '@/lib/policy-engine/global-policy-integration'

class VehicleService extends PolicyEnforcedService {
  constructor() {
    super('vehicle') // Module name
  }

  async assignVehicle(vehicleId: string, driverId: string): Promise<void> {
    // Automatic policy enforcement
    return this.executeWithPolicy(
      'assign', // Operation name
      { vehicleId, driverId }, // Data to validate
      async () => {
        // Actual business logic (only executes if policies allow)
        const response = await fetch('/api/vehicles/assign', {
          method: 'POST',
          body: JSON.stringify({ vehicleId, driverId }),
        })

        if (!response.ok) {
          throw new Error('Assignment failed')
        }
      }
    )
  }
}

// Usage
const vehicleService = new VehicleService()

try {
  await vehicleService.assignVehicle('vehicle-123', 'driver-456')
  toast.success('Vehicle assigned successfully')
} catch (error) {
  if (error instanceof PolicyViolationError) {
    toast.error(error.message)
    // Show policy violation details
  } else {
    toast.error('Assignment failed')
  }
}
```

### 3. Wrapping Components with Policy Access Control

```tsx
import { withPolicyEnforcement } from '@/lib/policy-engine/global-policy-integration'

// Original component
function FuelTransactionPage() {
  return <div>{/* Fuel transaction UI */}</div>
}

// Wrapped component with policy access control
export default withPolicyEnforcement(
  FuelTransactionPage,
  'fuel.transaction', // Operation required to view
  'fuel' // Module
)

// If user doesn't have policy permission to view fuel transactions,
// they'll see "Access Denied" instead of the page
```

### 4. Manual Policy Enforcement (Advanced)

```typescript
import { policyEnforcementEngine } from '@/lib/policy-engine/global-policy-integration'

async function customOperation() {
  // Manual enforcement for complex scenarios
  const result = await policyEnforcementEngine.enforce({
    operation: 'custom.operation',
    module: 'custom',
    user: getCurrentUser(),
    data: {
      // Your operation data
      vehicleId: 'v-123',
      cost: 10000,
      // ... more fields
    },
    timestamp: new Date(),
    requestId: `custom-${Date.now()}`,
  })

  // Handle enforcement decision
  if (result.decision === 'block') {
    throw new Error(result.message)
  }

  if (result.decision === 'warn') {
    // Show warning but allow to proceed
    const proceed = confirm(`${result.message}\n\nProceed anyway?`)
    if (!proceed) return
  }

  if (result.decision === 'require-approval') {
    // Create approval workflow
    await createApprovalWorkflow(result.requiredApprovals)
    return
  }

  // Operation allowed - proceed
  // ... your logic here
}
```

## 🔄 Policy Lifecycle

### 1. Policy Creation

```
Policy Hub → Create Policy → AI Assistance → Draft Policy → Review → Activate
```

### 2. Compilation to Rules

```
Active Policy → Policy Compiler → Validation Rules
                               → Automation Rules
                               → Approval Rules
                               → Notification Rules
                               → Calculation Rules
```

### 3. Runtime Enforcement

```
User Action → API/Form/DB → Enforcement Engine → Find Rules
                                                → Evaluate Conditions
                                                → Execute Actions
                                                → Allow/Block/Warn/Approve
                                                → Log Execution
                                                → Return Result
```

### 4. Continuous Improvement

```
Enforcement Data → Analytics → Policy Violations Report
                             → Compliance Dashboard
                             → AI Recommendations for Policy Updates
                             → Policy Refinement
```

## 📊 Monitoring & Analytics

### Real-Time Policy Dashboards

Access at `/policy-hub` → **Dashboard** tab:

- **Enforcement Statistics**
  - Total enforcements today/week/month
  - Allow vs Block vs Warn ratio
  - Most enforced policies
  - Top violated policies

- **Compliance Metrics**
  - Overall compliance score
  - Compliance by module
  - Compliance by policy type
  - Trending over time

- **Violation Tracking**
  - Open violations
  - Violations by severity
  - Violations by user/department
  - Remediation status

- **Performance Metrics**
  - Rule evaluation time
  - Enforcement latency
  - Cache hit rate
  - Database query performance

### Enforcement Audit Trail

Every policy enforcement is logged with:
- Policy and rule applied
- Operation attempted
- User and timestamp
- Conditions evaluated
- Decision made (allow/block/warn)
- Actions executed
- Full context data

Access logs:
```typescript
const stats = await policyEnforcementEngine.getEnforcementStats({
  start: new Date('2025-01-01'),
  end: new Date('2025-01-31'),
})

console.log(stats)
// {
//   totalEnforcements: 15234,
//   allowed: 12543,
//   blocked: 1234,
//   warnings: 1234,
//   approvalsRequired: 223,
//   topViolatedPolicies: [...]
// }
```

## 🚀 Getting Started

### Step 1: Access the Policy Hub

Navigate to `/policy-hub` in your application.

### Step 2: Create Your First Policy

1. Click the **Policy Workbench** tab
2. Complete the **Organization Profile** (10 min)
3. Run the **Current State Assessment** (20 min)
4. Let AI **Generate Policies** with multi-LLM consensus (45 min)
5. **Review and Activate** policies (30 min)

### Step 3: Verify Enforcement

1. Go to a module (e.g., Dispatch)
2. Try an operation that violates a policy
3. See real-time blocking/warning
4. Check enforcement logs in Policy Hub → Dashboard

### Step 4: Monitor and Refine

1. Review compliance dashboards
2. Analyze violation patterns
3. Adjust policies based on insights
4. Use AI recommendations for improvements

## 🎯 Key Benefits

### For Fleet Managers
- **Automated Compliance**: Policies enforced automatically, 24/7
- **Reduced Liability**: Every operation validated against policies
- **Real-Time Visibility**: See all enforcement decisions in real-time
- **Continuous Improvement**: AI-powered policy recommendations

### For Drivers & Staff
- **Clear Guidance**: Immediate feedback on what's allowed
- **No Surprises**: Know policy requirements before acting
- **Fair Enforcement**: Consistent policy application for everyone

### For Administrators
- **Audit-Ready**: Complete audit trail of all enforcement
- **Easy Management**: Update policies without code changes
- **Flexible Rules**: Policies adapt to your organization's needs
- **Professional Documentation**: Export policies as branded PDF/Word

### For Developers
- **No Boilerplate**: Policy enforcement handled automatically
- **Declarative Policies**: Define rules, not code
- **Type-Safe Integration**: Full TypeScript support
- **Testing Support**: Mock policies for unit tests

## 🔐 Security & Compliance

### Data Security
- All policy executions logged with full audit trail
- Sensitive data redacted in logs
- Role-based access to policy management
- Version control for all policy changes

### Compliance Frameworks Supported
- DOT/FMCSA (commercial vehicles)
- OSHA (safety)
- EPA (environmental)
- IFTA (fuel tax)
- State and local regulations
- Custom organizational policies

### Audit Features
- Complete enforcement history
- Policy version tracking
- User action attribution
- Approval workflow records
- Exception tracking

## 📚 Advanced Topics

### Creating Custom Rule Types

```typescript
// Extend the compiler to support custom rule generation
class CustomPolicyCompiler extends PolicyRulesCompiler {
  generateCustomRules(policy: Policy): CompiledRule[] {
    // Your custom rule generation logic
    return []
  }
}
```

### Integrating External Data Sources

```typescript
// Custom condition evaluation with external API
{
  condition: {
    field: 'driver.creditScore',
    operator: 'greater-than',
    value: 650,
    dataSource: 'api',
    apiEndpoint: 'https://api.example.com/credit-check'
  }
}
```

### Workflow Automation

```typescript
// Trigger complex workflows from policies
{
  action: {
    type: 'execute-workflow',
    workflowId: 'accident-investigation',
    executionLogic: `
      createIncidentRecord(context.data)
      assignInvestigator(context.data.location)
      scheduleReview(addDays(today, 10))
      notifyStakeholders(incident.severity)
    `
  }
}
```

## 🐛 Troubleshooting

### Policy Not Enforcing

**Check**:
1. Is policy status "active"?
2. Did policy compile successfully?
3. Are rules loaded in enforcement engine?
4. Does operation trigger event match rule?

**Debug**:
```typescript
// Check loaded rules
console.log(policyEnforcementEngine.rules)

// Check enforcement result
const result = await policyEnforcementEngine.enforce({...})
console.log(result)
```

### False Policy Violations

**Check**:
1. Are conditions correctly specified?
2. Is data source correct (event/database/api/calculated)?
3. Are field names matching database schema?

**Debug**:
```typescript
// Log condition evaluation
rule.conditions.forEach(async (cond) => {
  const value = await evaluateCondition(cond, context)
  console.log(`${cond.field}: ${value} ${cond.operator} ${cond.value}`)
})
```

### Performance Issues

**Optimize**:
1. Use rule caching (automatic)
2. Minimize database queries in conditions
3. Use batch operations where possible
4. Profile enforcement timing

**Monitor**:
```typescript
// Check performance metrics
const stats = await policyEnforcementEngine.getEnforcementStats()
console.log('Avg enforcement time:', stats.avgEnforcementTime)
```

## 📖 Next Steps

1. **Complete the Policy Workbench** - Build your comprehensive policy system
2. **Integrate Existing Modules** - Add policy enforcement to custom modules
3. **Create Custom Policies** - Build organization-specific policies
4. **Monitor and Refine** - Use analytics to improve policies
5. **Train Users** - Educate staff on policy system

## 🤝 Support

For questions or issues:
- Check the Policy Hub README: `POLICY_HUB_README.md`
- Review code examples in this guide
- Check enforcement logs in Policy Hub dashboard
- Contact fleet management team

---

**The Policy Engine transforms your Fleet Management application from a collection of features into a cohesive, policy-governed system where every action is validated, logged, and enforced according to your organization's rules.**
