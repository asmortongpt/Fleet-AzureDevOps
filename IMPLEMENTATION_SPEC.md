# Feature: Personal vs Business Vehicle Use Tracking

**Branch:** feature/personal-business-use
**Created:** 2025-11-10
**Status:** 🚧 In Development

## Overview

Add capability for users to identify and track whether vehicle usage is for personal or business purposes, with configurable policies around personal use.

## Requirements

### 1. Usage Type Classification

Users must be able to specify for each trip/usage:
- **Business Use** - Official organization business
- **Personal Use** - Private/personal use
- **Mixed Use** - Combination of both (with split calculation)

### 2. Trip-Level Tracking

When recording trips, users should specify:
```typescript
interface TripUsage {
  usage_type: 'business' | 'personal' | 'mixed'
  business_purpose?: string // Required if business or mixed
  business_percentage?: number // Required if mixed (0-100)
  personal_notes?: string // Optional for personal tracking
}
```

### 3. Policy Configuration

Administrators should be able to configure tenant-level policies:

```typescript
interface PersonalUsePolicy {
  tenant_id: UUID
  allow_personal_use: boolean
  require_approval: boolean
  max_personal_miles_per_month?: number
  max_personal_miles_per_year?: number
  charge_personal_use: boolean
  personal_use_rate_per_mile?: number
  reporting_required: boolean
  approval_workflow?: 'manager' | 'fleet_admin' | 'both'
}
```

### 4. Mileage Reimbursement Integration

- **Business mileage** - Full federal rate reimbursement
- **Personal mileage** - No reimbursement (or charged to employee if policy configured)
- **Mixed mileage** - Pro-rated based on business_percentage

### 5. Reporting & Compliance

#### For Users/Drivers:
- Monthly personal use summary
- Warnings when approaching policy limits
- Personal use charges/deductions (if applicable)

#### For Administrators:
- Personal use dashboard by driver
- Policy violation alerts
- Personal use cost recovery tracking
- Compliance reports for IRS/tax purposes

### 6. Audit Trail

All usage classifications must be:
- Timestamped
- User-attributed
- Immutable after submission (or require supervisor approval to change)
- Available for audit reports

## Database Schema Changes

### New Table: trip_usage_classification

```sql
CREATE TABLE trip_usage_classification (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    trip_id UUID, -- Could reference fuel_transactions, routes, or telemetry
    vehicle_id UUID REFERENCES vehicles(id),
    driver_id UUID REFERENCES users(id),
    usage_type VARCHAR(20) NOT NULL CHECK (usage_type IN ('business', 'personal', 'mixed')),
    business_purpose TEXT,
    business_percentage DECIMAL(5,2) CHECK (business_percentage >= 0 AND business_percentage <= 100),
    personal_notes TEXT,
    miles_total DECIMAL(10,2),
    miles_business DECIMAL(10,2),
    miles_personal DECIMAL(10,2),
    trip_date DATE NOT NULL,
    start_location VARCHAR(255),
    end_location VARCHAR(255),
    approved_by_user_id UUID REFERENCES users(id),
    approved_at TIMESTAMP WITH TIME ZONE,
    approval_status VARCHAR(20) DEFAULT 'pending' CHECK (approval_status IN ('pending', 'approved', 'rejected')),
    rejection_reason TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_trip_usage_tenant ON trip_usage_classification(tenant_id);
CREATE INDEX idx_trip_usage_driver ON trip_usage_classification(driver_id);
CREATE INDEX idx_trip_usage_vehicle ON trip_usage_classification(vehicle_id);
CREATE INDEX idx_trip_usage_type ON trip_usage_classification(usage_type);
CREATE INDEX idx_trip_usage_date ON trip_usage_classification(trip_date DESC);
CREATE INDEX idx_trip_usage_approval_status ON trip_usage_classification(approval_status);
```

### New Table: personal_use_policies

```sql
CREATE TABLE personal_use_policies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE UNIQUE,
    allow_personal_use BOOLEAN DEFAULT false,
    require_approval BOOLEAN DEFAULT true,
    max_personal_miles_per_month INTEGER,
    max_personal_miles_per_year INTEGER,
    charge_personal_use BOOLEAN DEFAULT false,
    personal_use_rate_per_mile DECIMAL(5,2),
    reporting_required BOOLEAN DEFAULT true,
    approval_workflow VARCHAR(20) DEFAULT 'manager' CHECK (approval_workflow IN ('manager', 'fleet_admin', 'both')),
    notification_settings JSONB DEFAULT '{}',
    effective_date DATE NOT NULL,
    created_by_user_id UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_personal_use_policies_tenant ON personal_use_policies(tenant_id);
```

### New Table: personal_use_charges

```sql
CREATE TABLE personal_use_charges (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    driver_id UUID REFERENCES users(id) ON DELETE CASCADE,
    trip_usage_id UUID REFERENCES trip_usage_classification(id),
    charge_period VARCHAR(7) NOT NULL, -- YYYY-MM format
    miles_charged DECIMAL(10,2) NOT NULL,
    rate_per_mile DECIMAL(5,2) NOT NULL,
    total_charge DECIMAL(10,2) NOT NULL,
    charge_status VARCHAR(20) DEFAULT 'pending' CHECK (charge_status IN ('pending', 'billed', 'paid', 'waived')),
    payment_method VARCHAR(50),
    paid_at TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_personal_use_charges_tenant ON personal_use_charges(tenant_id);
CREATE INDEX idx_personal_use_charges_driver ON personal_use_charges(driver_id);
CREATE INDEX idx_personal_use_charges_period ON personal_use_charges(charge_period);
CREATE INDEX idx_personal_use_charges_status ON personal_use_charges(charge_status);
```

## API Endpoints

### Usage Classification

#### POST /api/trip-usage
Create trip usage classification
```json
{
  "vehicle_id": "uuid",
  "driver_id": "uuid",
  "usage_type": "mixed",
  "business_purpose": "Client meeting + lunch",
  "business_percentage": 75,
  "miles_total": 50,
  "trip_date": "2025-11-10",
  "start_location": "Office",
  "end_location": "Client Site"
}
```

#### GET /api/trip-usage
Get trip usage history with filtering
```
GET /api/trip-usage?driver_id=uuid&usage_type=personal&month=2025-11
```

#### PATCH /api/trip-usage/:id
Update usage classification (requires approval if already submitted)

### Policy Management

#### GET /api/personal-use-policies
Get tenant policy configuration

#### PUT /api/personal-use-policies/:tenant_id
Update tenant policy (admin only)

#### GET /api/personal-use-policies/limits/:driver_id
Get driver's current usage vs limits
```json
{
  "driver_id": "uuid",
  "current_month": {
    "personal_miles": 120,
    "limit": 200,
    "percentage_used": 60
  },
  "current_year": {
    "personal_miles": 450,
    "limit": 1000,
    "percentage_used": 45
  },
  "warnings": []
}
```

### Approval Workflow

#### GET /api/trip-usage/pending-approval
Get trips pending approval (for managers)

#### POST /api/trip-usage/:id/approve
Approve personal/mixed use trip

#### POST /api/trip-usage/:id/reject
Reject personal/mixed use trip

### Charging & Billing

#### GET /api/personal-use-charges
Get charges for drivers

#### POST /api/personal-use-charges/calculate
Calculate charges for billing period

#### PATCH /api/personal-use-charges/:id
Update charge status (mark as paid, waived, etc.)

### Reporting

#### GET /api/reports/personal-use/summary
Monthly/yearly summary by driver

#### GET /api/reports/personal-use/compliance
IRS compliance report showing personal vs business use

## Frontend Components

### 1. Trip Classification Dialog
Modal for classifying trips when creating/editing

### 2. Personal Use Dashboard (Driver View)
- Current month/year usage
- Approaching limits warnings
- Pending approvals
- Charge statements

### 3. Personal Use Dashboard (Admin View)
- All drivers' personal use summary
- Policy violation alerts
- Approval queue
- Charge recovery metrics

### 4. Policy Configuration (Admin)
Settings page for configuring tenant policy

### 5. Approval Workflow
Interface for managers to review and approve/reject personal use

## User Stories

### Driver/User Stories
1. As a driver, I want to classify each trip as personal or business so my reimbursements are accurate
2. As a driver, I want to see my personal use limits so I don't exceed policy
3. As a driver, I want to track mixed-use trips with accurate business percentage
4. As a driver, I want to see charges for personal use before they're billed

### Manager Stories
1. As a manager, I want to approve/reject personal use requests from my team
2. As a manager, I want to see which drivers are approaching personal use limits
3. As a manager, I want to waive charges for exceptional circumstances

### Administrator Stories
1. As an admin, I want to configure organization-wide personal use policies
2. As an admin, I want to generate IRS-compliant reports for audits
3. As an admin, I want to track cost recovery from personal use charges
4. As an admin, I want to enforce usage limits automatically

## Implementation Plan

### Phase 1: Database & Core API (Week 1)
- [ ] Create migration for new tables
- [ ] Build trip-usage API endpoints
- [ ] Build policy management API endpoints
- [ ] Unit tests for business logic

### Phase 2: Approval Workflow (Week 1-2)
- [ ] Implement approval endpoints
- [ ] Email notifications for approvals
- [ ] Manager dashboard for approvals

### Phase 3: Frontend Integration (Week 2-3)
- [ ] Trip classification dialog
- [ ] Driver personal use dashboard
- [ ] Admin policy configuration
- [ ] Approval workflow UI

### Phase 4: Charging & Billing (Week 3-4)
- [ ] Charge calculation logic
- [ ] Billing period reports
- [ ] Payment tracking
- [ ] Charge statement generation

### Phase 5: Reporting & Compliance (Week 4)
- [ ] IRS compliance reports
- [ ] Personal use analytics
- [ ] Cost recovery tracking
- [ ] Audit trail exports

### Phase 6: Testing & Documentation (Week 4)
- [ ] E2E tests for full workflow
- [ ] User documentation
- [ ] Admin guide
- [ ] API documentation updates

## Success Criteria

- [ ] Users can classify all trips with usage type
- [ ] Policies are enforced automatically
- [ ] Approval workflow functions correctly
- [ ] Personal use charges calculate accurately
- [ ] IRS-compliant reports can be generated
- [ ] All actions are auditable
- [ ] No performance impact on existing features

## Notes

- Must integrate with existing mileage reimbursement API
- Consider mobile app support for on-the-go classification
- Ensure GDPR/privacy compliance for personal use tracking
- Support for retroactive classification (with audit trail)
- Consider integration with payroll systems for charge recovery

---

**Next Steps:**
1. Review and approve spec
2. Create detailed implementation tasks
3. Begin Phase 1 development
