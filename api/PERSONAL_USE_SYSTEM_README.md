# Personal Use & Reimbursement System - Complete Implementation Guide

## Overview

This document provides comprehensive documentation for the **Enhanced Personal Use and Reimbursement System** for the Fleet Management application. This system allows companies to implement flexible personal vehicle use policies with multiple payment options, reimbursement workflows, and automated approval processes.

## Table of Contents

1. [System Architecture](#system-architecture)
2. [Database Schema](#database-schema)
3. [Backend Implementation](#backend-implementation)
4. [Frontend Components](#frontend-components)
5. [User Workflows](#user-workflows)
6. [API Reference](#api-reference)
7. [Configuration Guide](#configuration-guide)
8. [Testing Guide](#testing-guide)

---

## System Architecture

### Core Functionality

The system supports four main workflows:

1. **Trip Classification** - Drivers mark trips as Business, Personal, or Mixed
2. **Policy Management** - Admins configure company-wide personal use policies
3. **Charging & Billing** - Automated calculation and tracking of charges
4. **Reimbursement Processing** - Driver reimbursement requests and approval workflow

### Payment Methods

Companies can choose from four payment methods:

| Method | Description | Use Case |
|--------|-------------|----------|
| `driver_direct` | Driver pays directly for personal use | Fully personal vehicles |
| `driver_reimburse` | Driver pays upfront, requests reimbursement | Company reimbursement programs |
| `company_bill` | Company bills driver monthly | Corporate fleets |
| `payroll_deduct` | Automatic payroll deduction | Streamlined processing |

### Calculation Methods

Charges can be calculated using three methods:

| Method | Description | Configuration |
|--------|-------------|--------------|
| `per_mile` | Charge per mile driven | Set `personal_use_rate_per_mile` |
| `flat_fee` | Fixed monthly/yearly fee | Set `flat_fee_amount` and `flat_fee_frequency` |
| `actual_cost` | Proportional actual costs | Track fuel, maintenance, insurance |

---

## Database Schema

### Tables Created

#### 1. `trip_usage_classification`
Tracks individual trip classifications (business/personal/mixed).

**Key Fields:**
- `usage_type`: business, personal, mixed
- `business_percentage`: For mixed trips (0-100%)
- `miles_business`, `miles_personal`: Auto-calculated
- `approval_status`: pending, approved, rejected, auto_approved

#### 2. `personal_use_policies`
Tenant-level policy configuration.

**New Fields (Migration 006):**
- `payment_method`: driver_direct, driver_reimburse, company_bill, payroll_deduct
- `calculation_method`: per_mile, flat_fee, actual_cost
- `flat_fee_amount`, `flat_fee_frequency`
- `reimbursement_approval_required`: Boolean
- `auto_approve_under_amount`: Auto-approve threshold
- `require_receipt_upload`: Boolean
- `receipt_required_over_amount`: Receipt threshold

#### 3. `personal_use_charges`
Tracks charges and billing for personal use.

**New Fields (Migration 006):**
- `is_reimbursement`: Boolean (charge vs. reimbursement)
- `reimbursement_requested_at`, `reimbursement_approved_at`
- `reimbursement_approved_by`, `reimbursement_paid_at`
- `receipt_file_path`, `receipt_uploaded_at`
- `actual_cost_breakdown`: JSONB (fuel, maintenance, etc.)
- `driver_notes`: Text

#### 4. `reimbursement_requests` (NEW)
Separate table for reimbursement lifecycle tracking.

**Key Fields:**
- `request_amount`, `approved_amount`
- `status`: pending, approved, rejected, paid, cancelled
- `receipt_file_path`, `receipt_metadata`
- `payment_date`, `payment_reference`
- `category`: fuel, maintenance, insurance, etc.

#### 5. `payment_schedules` (NEW)
Tracks recurring payment schedules for monthly billing and payroll deductions.

**Key Fields:**
- `payment_method`, `schedule_type` (monthly, biweekly, weekly)
- `next_payment_date`, `last_payment_date`
- `is_active`, `suspended_at`
- `charge_ids`: Array of linked charges

### Database Views

#### `v_driver_reimbursement_summary`
Summary of reimbursement requests by driver and status.

#### `v_pending_reimbursements`
Queue of pending reimbursements for admin review.

#### `v_monthly_payment_obligations`
Monthly obligations showing charges owed and reimbursements due.

#### `v_personal_use_dashboard`
Complete dashboard metrics for drivers (usage, charges, reimbursements).

### Helper Functions

#### `calculate_personal_use_charge(tenant_id, miles, actual_costs)`
Calculates charge based on policy configuration (per_mile, flat_fee, or actual_cost).

#### `auto_approve_reimbursement()` (Trigger)
Automatically approves reimbursement requests under the configured threshold.

---

## Backend Implementation

### File Structure

```
api/src/
├── types/
│   └── trip-usage.ts                 # Enhanced TypeScript types
├── routes/
│   ├── personal-use-policies.ts      # Policy CRUD + configuration
│   ├── personal-use-charges.ts       # Charge calculation + tracking
│   ├── trip-marking.ts               # Quick trip classification (NEW)
│   └── reimbursement-requests.ts     # Reimbursement workflow (NEW)
└── middleware/
    └── file-upload.ts                # Receipt upload handling (NEW)
```

### Key Backend Routes

#### Policy Management (`personal-use-policies.ts`)

- `GET /api/personal-use-policies` - Get current policy
- `PUT /api/personal-use-policies/:tenant_id` - Create/update policy
- `GET /api/personal-use-policies/limits/:driver_id` - Get driver limits
- `GET /api/personal-use-policies/drivers-at-limit` - Get drivers near limits

#### Charge Management (`personal-use-charges.ts`)

- `GET /api/personal-use-charges` - List charges (filtered)
- `GET /api/personal-use-charges/:id` - Get charge details
- `POST /api/personal-use-charges/calculate` - Calculate charges for period
- `POST /api/personal-use-charges` - Create charge
- `PATCH /api/personal-use-charges/:id` - Update charge status
- `POST /api/personal-use-charges/bulk-create` - Bulk charge creation
- `GET /api/personal-use-charges/summary` - Summary by status

#### Trip Marking (`trip-marking.ts`) - NEW

- `POST /api/trips/:id/mark-personal` - Mark existing trip
- `POST /api/trips/start-personal` - Start new personal trip
- `POST /api/trips/:id/split` - Split trip into business/personal
- `GET /api/trips/my-personal-trips` - Driver's personal trip history
- `POST /api/trips/:id/quick-classify` - Fast 2-click classification

#### Reimbursement Requests (`reimbursement-requests.ts`) - NEW

- `POST /api/reimbursement-requests` - Create reimbursement request
- `GET /api/reimbursement-requests` - List requests (filtered)
- `GET /api/reimbursement-requests/:id` - Get request details
- `POST /api/reimbursement-requests/:id/upload-receipt` - Upload receipt
- `PATCH /api/reimbursement-requests/:id/review` - Approve/reject
- `POST /api/reimbursement-requests/:id/process-payment` - Mark as paid
- `GET /api/reimbursement-requests/queue` - Admin approval queue

---

## Frontend Components

### Page Components

#### 1. `PersonalUsePolicy.tsx` - Policy Configuration (Admin)

**Location:** `src/pages/PersonalUse/PersonalUsePolicy.tsx`

**Features:**
- Policy configuration form with step-by-step wizard
- Payment method selection with descriptions
- Calculation method configuration (per-mile, flat-fee, actual-cost)
- Reimbursement settings (approval, thresholds, receipts)
- Usage limits (monthly/yearly)
- Notification settings
- Live preview of policy impact

**Key Components:**
```tsx
- PaymentMethodSelector
- CalculationMethodConfig
- ReimbursementSettings
- UsageLimitConfig
- PolicyPreview
```

#### 2. `PersonalUseDashboard.tsx` - Driver Dashboard

**Location:** `src/pages/PersonalUse/PersonalUseDashboard.tsx`

**Features:**
- Usage meters (monthly/yearly with visual progress bars)
- Quick trip marking interface
- Pending charges summary
- Pending reimbursements summary
- Payment history
- Upcoming bills/deductions
- Real-time cost calculator

**Key Sections:**
```tsx
- UsageMeters (monthly/yearly limits)
- QuickTripMarker
- PendingChargesList
- ReimbursementRequestsList
- PaymentHistory
- UpcomingPayments
```

#### 3. `ReimbursementQueue.tsx` - Admin Approval Queue

**Location:** `src/pages/PersonalUse/ReimbursementQueue.tsx`

**Features:**
- Filterable queue (status, driver, date range, category)
- Receipt viewer with zoom/download
- Bulk approve/reject
- Individual request review
- Payment processing workflow
- Export to CSV/Excel

**Key Features:**
```tsx
- FilterBar (status, driver, date range)
- ReimbursementCard (request details + receipt)
- ReceiptViewer (lightbox modal)
- BulkActionBar
- PaymentProcessor
```

#### 4. `ChargesAndBilling.tsx` - Monthly Billing Dashboard

**Location:** `src/pages/PersonalUse/ChargesAndBilling.tsx`

**Features:**
- Monthly billing overview
- Generate invoices for drivers
- Payment tracking by method
- Export to payroll system
- Dispute management
- Payment schedule management

**Key Sections:**
```tsx
- BillingOverview
- InvoiceGenerator
- PaymentTracker
- DisputeManager
- PayrollExport
```

### Reusable Components

#### `TripMarker.tsx` - Inline Trip Classification

**Location:** `src/components/TripMarker.tsx`

**Props:**
```typescript
interface TripMarkerProps {
  tripId?: string;
  initialType?: UsageType;
  onSave: (data: TripUsageData) => void;
  showCostPreview?: boolean;
  compact?: boolean;
}
```

**Features:**
- Business/Personal/Mixed toggle (3 buttons)
- Percentage slider for mixed trips (0-100%)
- Real-time cost preview
- Business purpose field (required for business/mixed)
- Personal notes field (optional)
- Validation with helpful error messages
- Mobile-optimized design

**Usage:**
```tsx
<TripMarker
  tripId={trip.id}
  showCostPreview={true}
  onSave={(data) => handleTripClassification(data)}
/>
```

#### `ReceiptUploader.tsx` - Receipt Upload Component

**Location:** `src/components/ReceiptUploader.tsx`

**Features:**
- Drag-and-drop upload
- Image preview
- PDF support
- File size validation
- Automatic compression
- Progress indicator

#### `CostCalculator.tsx` - Real-time Cost Preview

**Location:** `src/components/CostCalculator.tsx`

**Features:**
- Live calculation based on policy
- Shows per-mile rate
- Shows flat fee (if applicable)
- Breakdown for actual costs
- Monthly projection

---

## User Workflows

### Workflow 1: Driver Marks Personal Trip

1. Driver completes a trip
2. System prompts for trip classification
3. Driver selects "Personal" or "Mixed"
4. If mixed, driver adjusts percentage slider
5. Driver adds optional notes
6. System shows cost preview
7. Driver confirms
8. Trip saved with classification

**Time:** < 30 seconds

### Workflow 2: Driver Requests Reimbursement

**Scenario:** Company policy is `driver_reimburse`

1. Driver pays for fuel/maintenance
2. Driver navigates to Personal Use Dashboard
3. Clicks "Request Reimbursement"
4. Enters amount, date, category
5. Uploads receipt (if required)
6. Submits request
7. **Auto-approval:** If under threshold → immediately approved
8. **Manual approval:** Manager reviews in queue → approves/rejects
9. Finance processes payment
10. Driver receives payment notification

**Auto-approval Example:**
- Policy: `auto_approve_under_amount = $50`
- Request: $35 with receipt
- Result: Instant approval

### Workflow 3: Admin Processes Monthly Billing

**Scenario:** Company policy is `company_bill`

1. Admin navigates to Charges & Billing
2. Selects billing period (e.g., "2025-11")
3. Clicks "Calculate All Charges"
4. System calculates charges for all drivers
5. Admin reviews charge summary
6. Clicks "Generate Invoices"
7. System creates invoices with unique numbers
8. Invoices emailed to drivers
9. Admin tracks payments
10. Marks invoices as paid when received

### Workflow 4: Automatic Payroll Deduction

**Scenario:** Company policy is `payroll_deduct`

1. Driver uses vehicle for personal trips (auto-tracked)
2. System calculates charges monthly
3. Charges automatically added to payment schedule
4. On payroll run date:
   - System exports charge data
   - Payroll system deducts amount
   - Admin marks charges as paid
   - Driver sees deduction on pay stub

---

## API Reference

### Trip Marking API

#### Mark Trip as Personal/Business

```http
POST /api/trips/:id/mark-personal
Content-Type: application/json

{
  "usage_type": "mixed",
  "business_percentage": 70,
  "business_purpose": "Client meeting + lunch",
  "personal_notes": "Stopped at grocery store"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "usage_type": "mixed",
    "miles_total": 45.2,
    "miles_business": 31.64,
    "miles_personal": 13.56,
    "estimated_charge": 6.78
  }
}
```

### Reimbursement API

#### Create Reimbursement Request

```http
POST /api/reimbursement-requests
Content-Type: multipart/form-data

{
  "charge_id": "uuid",
  "request_amount": 45.50,
  "description": "Fuel for personal trip to airport",
  "expense_date": "2025-11-14",
  "category": "fuel",
  "receipt": <file>
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "status": "approved",
    "request_amount": 45.50,
    "approved_amount": 45.50,
    "message": "Auto-approved under $50 threshold"
  }
}
```

#### Review Reimbursement Request

```http
PATCH /api/reimbursement-requests/:id/review
Content-Type: application/json

{
  "status": "approved",
  "approved_amount": 40.00,
  "reviewer_notes": "Approved with adjusted amount per policy"
}
```

### Policy Configuration API

#### Update Policy

```http
PUT /api/personal-use-policies/:tenant_id
Content-Type: application/json

{
  "allow_personal_use": true,
  "charge_personal_use": true,
  "payment_method": "driver_reimburse",
  "calculation_method": "per_mile",
  "personal_use_rate_per_mile": 0.50,
  "max_personal_miles_per_month": 200,
  "reimbursement_approval_required": true,
  "auto_approve_under_amount": 50.00,
  "require_receipt_upload": true,
  "receipt_required_over_amount": 25.00,
  "effective_date": "2025-12-01"
}
```

---

## Configuration Guide

### Example Policy Configurations

#### Configuration 1: Simple Per-Mile Billing

**Use Case:** Small company, drivers pay monthly

```json
{
  "allow_personal_use": true,
  "charge_personal_use": true,
  "payment_method": "company_bill",
  "calculation_method": "per_mile",
  "personal_use_rate_per_mile": 0.50,
  "max_personal_miles_per_month": 200,
  "require_approval": false
}
```

#### Configuration 2: Reimbursement with Auto-Approval

**Use Case:** Company reimburses drivers, auto-approve small amounts

```json
{
  "allow_personal_use": true,
  "charge_personal_use": true,
  "payment_method": "driver_reimburse",
  "calculation_method": "actual_cost",
  "reimbursement_approval_required": true,
  "auto_approve_under_amount": 75.00,
  "require_receipt_upload": true,
  "receipt_required_over_amount": 25.00,
  "reimbursement_payment_terms_days": 14
}
```

#### Configuration 3: Flat Fee + Payroll Deduction

**Use Case:** Large enterprise, flat monthly fee

```json
{
  "allow_personal_use": true,
  "charge_personal_use": true,
  "payment_method": "payroll_deduct",
  "calculation_method": "flat_fee",
  "flat_fee_amount": 150.00,
  "flat_fee_frequency": "monthly",
  "max_personal_miles_per_month": 300
}
```

### Receipt Requirements

Configure receipt requirements based on amount:

```json
{
  "require_receipt_upload": true,
  "receipt_required_over_amount": 25.00
}
```

**Result:**
- Expenses <= $25: Receipt optional
- Expenses > $25: Receipt required
- Auto-approval only if receipt provided (when required)

---

## Testing Guide

### Unit Tests

#### Test Payment Method Logic

```typescript
describe('Personal Use Policy', () => {
  it('should calculate per-mile charge correctly', () => {
    const charge = calculateCharge(50, 0.50);
    expect(charge).toBe(25.00);
  });

  it('should auto-approve reimbursement under threshold', () => {
    const policy = { auto_approve_under_amount: 50 };
    const request = { request_amount: 45, receipt_file_path: '/path' };
    expect(shouldAutoApprove(policy, request)).toBe(true);
  });

  it('should require receipt over threshold', () => {
    const policy = { receipt_required_over_amount: 25 };
    expect(isReceiptRequired(policy, 30)).toBe(true);
    expect(isReceiptRequired(policy, 20)).toBe(false);
  });
});
```

### Integration Tests

#### Test Trip Marking Workflow

```typescript
describe('Trip Marking API', () => {
  it('should mark trip as personal and calculate charge', async () => {
    const response = await api.post('/api/trips/123/mark-personal', {
      usage_type: 'personal',
      personal_notes: 'Weekend errands'
    });

    expect(response.status).toBe(200);
    expect(response.data.miles_personal).toBeGreaterThan(0);
    expect(response.data.estimated_charge).toBeGreaterThan(0);
  });
});
```

#### Test Reimbursement Workflow

```typescript
describe('Reimbursement Workflow', () => {
  it('should auto-approve reimbursement under threshold', async () => {
    // Create request under $50
    const response = await api.post('/api/reimbursement-requests', {
      request_amount: 40,
      expense_date: '2025-11-14',
      category: 'fuel'
    });

    expect(response.data.status).toBe('approved');
    expect(response.data.approved_amount).toBe(40);
  });

  it('should require manual review over threshold', async () => {
    // Create request over $50
    const response = await api.post('/api/reimbursement-requests', {
      request_amount: 75,
      expense_date: '2025-11-14',
      category: 'maintenance'
    });

    expect(response.data.status).toBe('pending');
  });
});
```

### E2E Tests

```typescript
describe('Personal Use Driver Experience', () => {
  it('should allow driver to mark trip and see cost', async () => {
    // Login as driver
    await page.goto('/dashboard');

    // Find recent trip
    await page.click('[data-testid="trip-item-123"]');

    // Mark as personal
    await page.click('[data-testid="mark-personal"]');

    // Verify cost preview shown
    const cost = await page.textContent('[data-testid="cost-preview"]');
    expect(cost).toContain('$');

    // Confirm
    await page.click('[data-testid="confirm"]');

    // Verify success
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
  });
});
```

---

## Migration Instructions

### Step 1: Run Database Migration

```bash
# From api directory
psql -U your_user -d your_database -f /path/to/migrations/006_enhanced_personal_use_system.sql
```

### Step 2: Update Backend

```bash
# Install dependencies (if any new ones)
cd api
npm install

# Rebuild TypeScript
npm run build

# Restart API server
npm run dev
```

### Step 3: Update Frontend

```bash
# From root directory
npm install

# Run dev server
npm run dev
```

### Step 4: Configure Policy

1. Login as admin
2. Navigate to Settings > Personal Use Policy
3. Complete policy configuration wizard
4. Set payment method and calculation method
5. Configure reimbursement settings (if applicable)
6. Save and activate policy

---

## Security Considerations

### Receipt Storage

- Store receipts in Azure Blob Storage with access tokens
- File paths in database are references, not actual files
- Implement virus scanning on upload
- Limit file types: `.pdf`, `.jpg`, `.png`
- Max file size: 5MB

### Access Control

- Drivers can only see their own trips/charges/reimbursements
- Managers can see their team's data
- Fleet admins can see all data
- Policy configuration requires admin role

### Audit Trail

All tables include:
- `created_at`, `updated_at`
- `created_by_user_id`
- Approval actions tracked with timestamps
- Payment processing tracked with references

---

## Troubleshooting

### Issue: Charges Not Calculating

**Solution:**
1. Verify policy is active (`effective_date` <= today)
2. Check `charge_personal_use` is `true`
3. Verify calculation method has required fields:
   - `per_mile`: requires `personal_use_rate_per_mile`
   - `flat_fee`: requires `flat_fee_amount` and `flat_fee_frequency`
   - `actual_cost`: requires cost breakdown

### Issue: Auto-Approval Not Working

**Solution:**
1. Check policy `auto_approve_under_amount` is set
2. Verify request amount is under threshold
3. If receipts required, ensure receipt is uploaded
4. Check database trigger is active:
   ```sql
   SELECT * FROM pg_trigger WHERE tgname = 'auto_approve_reimbursement_trigger';
   ```

### Issue: Receipt Upload Failing

**Solution:**
1. Check file size (max 5MB)
2. Verify file type (PDF, JPG, PNG only)
3. Check storage service connection
4. Verify user has upload permissions

---

## Future Enhancements

### Planned Features

1. **Mobile App Integration**
   - Quick trip marking from mobile
   - Receipt capture with phone camera
   - Push notifications for approvals

2. **Advanced Analytics**
   - Personal use trends
   - Cost predictions
   - Policy impact analysis

3. **Integrations**
   - QuickBooks export
   - ADP payroll integration
   - Concur expense management

4. **AI/ML Features**
   - Auto-classify trips based on patterns
   - Fraud detection
   - Receipt OCR and validation

---

## Support

For questions or issues:
- Email: support@fleetmanagement.com
- Documentation: https://docs.fleetmanagement.com/personal-use
- GitHub Issues: https://github.com/your-org/fleet/issues

---

**Last Updated:** 2025-11-15
**Version:** 2.0.0
**Authors:** Fleet Engineering Team
