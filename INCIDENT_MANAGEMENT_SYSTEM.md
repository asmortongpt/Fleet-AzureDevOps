# Incident & Safety Management System

## 📋 Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Features](#features)
- [API Endpoints](#api-endpoints)
- [Frontend Components](#frontend-components)
- [Data Models](#data-models)
- [Testing](#testing)
- [Deployment](#deployment)
- [Security](#security)
- [Performance](#performance)

---

## Overview

The Incident & Safety Management System provides comprehensive tracking, investigation, and analysis of safety incidents across the fleet. Built with enterprise-grade security, real-time updates, and advanced analytics.

### Key Capabilities

- ✅ **Incident Reporting** - Comprehensive incident capture with GPS location
- ✅ **Investigation Workflow** - Structured root cause analysis
- ✅ **Safety Metrics** - Real-time KPIs and trending
- ✅ **Insurance Integration** - Claim tracking and cost analysis
- ✅ **OSHA/DOT Compliance** - Regulatory reporting support
- ✅ **Multi-tenant Isolation** - Secure tenant data segregation
- ✅ **Real-time Updates** - React Query with optimistic updates

---

## Architecture

### Technology Stack

**Frontend:**
- React 18 with TypeScript (strict mode)
- TanStack Query (React Query) for data management
- Framer Motion for animations
- Recharts for data visualization
- Shadcn/ui component library
- TailwindCSS v4 for styling

**Backend:**
- Express.js REST API
- PostgreSQL database
- JWT authentication with httpOnly cookies
- CSRF protection on all mutations
- RBAC with permission-based access control

### File Structure

```
Fleet-CTA/
├── src/
│   ├── pages/
│   │   └── IncidentHub.tsx (569 lines)        # Main dashboard
│   ├── components/
│   │   └── incident/
│   │       ├── IncidentReportDialog.tsx       # Incident reporting form
│   │       └── InvestigationDialog.tsx        # Investigation workflow
│   └── hooks/
│       └── use-reactive-incident-data.ts      # Data management hooks
├── api/
│   └── src/
│       └── routes/
│           └── incidents.ts                    # API route handlers
├── tests/
│   └── e2e/
│       └── incident-management.spec.ts        # 20+ E2E tests
└── scripts/
    └── verify-production.sh                   # Deployment verification
```

---

## Features

### 1. Incident Reporting

**Location:** `src/components/incident/IncidentReportDialog.tsx`

**Functionality:**
- Capture incident date, time, and location
- GPS location via browser Geolocation API
- Severity classification (minor, major, critical, fatality)
- Incident type categorization
- Driver and vehicle association
- Third-party involvement tracking
- Injury reporting with details
- Police report integration
- Damage estimation
- Photo and document attachments
- Witness statements

**Validation:**
- Required field validation
- Minimum character counts (description ≥ 20 chars)
- Conditional validation (third party details, injury details)
- Date/time validation
- Real-time error display

**API Integration:**
```typescript
const { createIncident } = useIncidentMutations()

await createIncident.mutateAsync({
  tenant_id: tenantId,
  incident_date: '2024-01-30',
  severity: 'major',
  type: 'vehicle_accident',
  description: 'Detailed description...',
  // ... additional fields
})
```

### 2. Investigation Workflow

**Location:** `src/components/incident/InvestigationDialog.tsx`

**Functionality:**
- Incident summary display
- Investigation date tracking
- Findings documentation (min 50 chars)
- Root cause analysis (min 30 chars)
- Contributing factors (array)
- Corrective actions tracking
- Preventive measures planning
- Training recommendations
- Follow-up scheduling
- Status tracking (in_progress, completed, reviewed, approved)

**Data Model:**
```typescript
interface Investigation {
  id: string
  incident_id: string
  tenant_id: string
  investigator_id: string
  investigation_date: string
  findings: string
  root_cause_analysis: string
  contributing_factors?: string[]
  corrective_actions: string[]
  preventive_measures: string[]
  training_recommendations?: string[]
  follow_up_required: boolean
  follow_up_date?: string
  status: 'in_progress' | 'completed' | 'reviewed' | 'approved'
}
```

### 3. Safety Metrics Dashboard

**Location:** `src/pages/IncidentHub.tsx` - Overview Tab

**Key Performance Indicators:**
- Total Incidents
- Days Since Last Incident
- Total Incident Cost
- Incident Rate (per million miles)
- Incidents by Severity
- Incidents by Type
- Preventable Incidents Rate
- Insurance Claims Cost
- OSHA Recordable Incidents

**Analytics:**
- Incident trend charts (90-day view)
- Severity distribution (pie chart)
- Type distribution (bar chart)
- Month-over-month comparison
- Year-over-year comparison
- Cost tracking by type

### 4. Real-time Data Management

**Location:** `src/hooks/use-reactive-incident-data.ts`

**React Query Hooks:**
```typescript
// Query Hooks
useIncidents(params: IncidentQueryParams)
useIncident(incidentId: string)
useInvestigations(incidentId: string)
useSafetyMetrics(tenantId: string, params?: DateRange)

// Mutation Hooks
const {
  createIncident,
  updateIncident,
  deleteIncident,
  createInvestigation,
  updateInvestigation
} = useIncidentMutations()
```

**Features:**
- Automatic cache invalidation
- Optimistic updates
- Stale-while-revalidate (30 second stale time)
- Background refetching
- Error retry logic

---

## API Endpoints

### Base URL
```
/api/incidents
```

### Endpoints

#### 1. List Incidents
```http
GET /api/incidents
```

**Query Parameters:**
- `tenant_id` (required)
- `start_date` (optional)
- `end_date` (optional)
- `severity` (optional): minor|major|critical|fatality
- `type` (optional): vehicle_accident|property_damage|personal_injury|near_miss|environmental|equipment_damage
- `status` (optional): reported|under_investigation|pending_review|closed|claim_filed
- `driver_id` (optional)
- `vehicle_id` (optional)

**Response:**
```json
{
  "incidents": [
    {
      "id": "uuid",
      "incident_number": "INC-1234567890",
      "severity": "major",
      "type": "vehicle_accident",
      "status": "under_investigation",
      "incident_date": "2024-01-30",
      "location_address": "123 Main St",
      "description": "...",
      "driver_id": "uuid",
      "vehicle_id": "uuid",
      "created_at": "2024-01-30T10:00:00Z"
    }
  ],
  "total": 42
}
```

#### 2. Get Single Incident
```http
GET /api/incidents/:id
```

**Response:**
```json
{
  "id": "uuid",
  "incident_number": "INC-1234567890",
  "severity": "major",
  "type": "vehicle_accident",
  "status": "under_investigation",
  "incident_date": "2024-01-30",
  "incident_time": "14:30",
  "location_address": "123 Main St",
  "location_city": "Miami",
  "location_state": "FL",
  "latitude": 25.7617,
  "longitude": -80.1918,
  "description": "Vehicle collision at intersection...",
  "driver_id": "uuid",
  "vehicle_id": "uuid",
  "witnesses": ["John Doe", "Jane Smith"],
  "third_party_involved": true,
  "third_party_details": "...",
  "injuries_reported": false,
  "vehicle_damage_estimate": 5000,
  "property_damage_estimate": 0,
  "police_report_filed": true,
  "police_report_number": "PD-2024-12345",
  "emergency_services_called": false,
  "insurance_claim_number": "CLM-2024-67890",
  "insurance_carrier": "State Farm",
  "estimated_claim_amount": 5000,
  "root_cause": "Driver distraction",
  "preventive_actions": "Additional driver training scheduled",
  "reported_by": "Toby Deckow",
  "reported_at": "2024-01-30T14:35:00Z",
  "created_at": "2024-01-30T14:35:00Z",
  "updated_at": "2024-01-30T15:00:00Z"
}
```

#### 3. Create Incident
```http
POST /api/incidents
```

**Headers:**
- `Content-Type: application/json`
- `x-csrf-token: <token>` (CSRF protection)

**Body:**
```json
{
  "tenant_id": "uuid",
  "incident_date": "2024-01-30",
  "incident_time": "14:30",
  "severity": "major",
  "type": "vehicle_accident",
  "location_address": "123 Main St",
  "location_city": "Miami",
  "location_state": "FL",
  "latitude": 25.7617,
  "longitude": -80.1918,
  "description": "Vehicle collision at intersection. Minor front-end damage. No injuries reported.",
  "driver_id": "uuid",
  "vehicle_id": "uuid",
  "witnesses": ["John Doe"],
  "third_party_involved": false,
  "injuries_reported": false,
  "vehicle_damage_estimate": 5000,
  "police_report_filed": true,
  "police_report_number": "PD-2024-12345",
  "emergency_services_called": false,
  "reported_by": "Toby Deckow"
}
```

**Response:**
```json
{
  "id": "uuid",
  "incident_number": "INC-1706630100000",
  "status": "reported",
  "reported_at": "2024-01-30T14:35:00Z",
  ...
}
```

#### 4. Update Incident
```http
PATCH /api/incidents/:id
```

**Headers:**
- `Content-Type: application/json`
- `x-csrf-token: <token>`

**Body:**
```json
{
  "status": "under_investigation",
  "root_cause": "Driver distraction - mobile phone use",
  "preventive_actions": "Implement mobile device policy training",
  "insurance_claim_number": "CLM-2024-67890",
  "estimated_claim_amount": 5000
}
```

#### 5. Delete Incident
```http
DELETE /api/incidents/:id
```

**Headers:**
- `x-csrf-token: <token>`

**Response:**
```json
{
  "message": "Incident deleted successfully"
}
```

#### 6. Get Investigations
```http
GET /api/incidents/:id/investigations
```

**Response:**
```json
{
  "investigations": [
    {
      "id": "uuid",
      "incident_id": "uuid",
      "investigator_id": "uuid",
      "investigation_date": "2024-01-31",
      "findings": "Driver was distracted by incoming phone call...",
      "root_cause_analysis": "Lack of enforcement of mobile device policy",
      "contributing_factors": [
        "No hands-free device available",
        "Urgent call from dispatcher"
      ],
      "corrective_actions": [
        "Provide hands-free devices to all drivers",
        "Update mobile device policy"
      ],
      "preventive_measures": [
        "Monthly safety training on distracted driving",
        "Install vehicle telematics monitoring"
      ],
      "training_recommendations": [
        "Defensive driving course",
        "Distraction awareness training"
      ],
      "follow_up_required": true,
      "follow_up_date": "2024-02-15",
      "status": "completed",
      "completed_at": "2024-01-31T16:00:00Z"
    }
  ]
}
```

#### 7. Create Investigation
```http
POST /api/incidents/:id/investigations
```

**Headers:**
- `Content-Type: application/json`
- `x-csrf-token: <token>`

**Body:**
```json
{
  "incident_id": "uuid",
  "tenant_id": "uuid",
  "investigator_id": "uuid",
  "investigation_date": "2024-01-31",
  "findings": "Driver was distracted by incoming phone call during intersection approach.",
  "root_cause_analysis": "Lack of enforcement of company mobile device policy and absence of hands-free equipment.",
  "contributing_factors": [
    "No hands-free device available in vehicle",
    "Urgent call from dispatcher"
  ],
  "corrective_actions": [
    "Provide hands-free devices to all drivers",
    "Update and enforce mobile device policy"
  ],
  "preventive_measures": [
    "Monthly safety training on distracted driving",
    "Install vehicle telematics for monitoring"
  ],
  "training_recommendations": [
    "Defensive driving course",
    "Distraction awareness training"
  ],
  "follow_up_required": true,
  "follow_up_date": "2024-02-15"
}
```

#### 8. Update Investigation
```http
PATCH /api/incidents/investigations/:investigationId
```

**Headers:**
- `Content-Type: application/json`
- `x-csrf-token: <token>`

**Body:**
```json
{
  "status": "approved",
  "follow_up_notes": "All corrective actions implemented successfully"
}
```

#### 9. Get Safety Metrics
```http
GET /api/incidents/metrics
```

**Query Parameters:**
- `tenant_id` (required)
- `start_date` (optional)
- `end_date` (optional)

**Response:**
```json
{
  "total_incidents": 42,
  "incidents_by_severity": {
    "minor": 25,
    "major": 12,
    "critical": 4,
    "fatality": 1
  },
  "incidents_by_type": {
    "vehicle_accident": 20,
    "property_damage": 8,
    "personal_injury": 5,
    "near_miss": 7,
    "environmental": 1,
    "equipment_damage": 1
  },
  "incidents_trend": [
    { "date": "2024-01-01", "count": 3 },
    { "date": "2024-01-02", "count": 1 },
    ...
  ],
  "days_since_last_incident": 5,
  "incidents_per_million_miles": 2.35,
  "preventable_incidents_rate": 0.67,
  "total_incident_cost": 125000,
  "average_incident_cost": 2976,
  "cost_by_type": {
    "vehicle_accident": 85000,
    "property_damage": 25000,
    "personal_injury": 15000
  },
  "insurance_claims_cost": 105000,
  "total_injuries": 8,
  "lost_time_injuries": 3,
  "osha_recordable_incidents": 5,
  "near_miss_reports": 7,
  "safety_observations": 42,
  "training_completion_rate": 0.95,
  "month_over_month_change": -0.12,
  "year_over_year_change": -0.23
}
```

---

## Frontend Components

### IncidentHub (Main Dashboard)

**File:** `src/pages/IncidentHub.tsx`
**Lines:** 569

**Features:**
- 4-tab interface (Overview, Incidents, Investigations, Analytics)
- Real-time data updates via React Query
- Safety metrics dashboard
- Incident list with filtering
- Investigation tracking
- Animated components with Framer Motion

**State Management:**
```typescript
const { user } = useAuth()
const tenantId = user?.tenantId || ''

const { data: incidents } = useIncidents({ tenant_id: tenantId, ...dateRange })
const { data: metrics } = useSafetyMetrics(tenantId, dateRange)
```

### IncidentReportDialog

**File:** `src/components/incident/IncidentReportDialog.tsx`
**Lines:** 682

**Features:**
- Comprehensive incident reporting form
- GPS location capture
- Conditional field rendering
- Real-time validation
- CSRF-protected submission

**Props:**
```typescript
interface IncidentReportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  tenantId: string
  reportedBy: string
  onSuccess?: () => void
}
```

### InvestigationDialog

**File:** `src/components/incident/InvestigationDialog.tsx`
**Lines:** 745

**Features:**
- Investigation workflow management
- Root cause analysis
- Dynamic array inputs (contributing factors, corrective actions)
- Follow-up scheduling
- Status tracking

**Props:**
```typescript
interface InvestigationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  incident: Incident
  tenantId: string
  investigatorId: string
  onSuccess?: () => void
}
```

---

## Data Models

### Incident

```typescript
interface Incident {
  id: string
  tenant_id: string
  incident_number: string
  incident_date: string
  incident_time: string
  severity: IncidentSeverity
  type: IncidentType
  status: IncidentStatus

  // Location
  location_address: string
  location_city: string
  location_state: string
  latitude?: number
  longitude?: number

  // Involved parties
  driver_id?: string
  vehicle_id?: string
  witnesses?: string[]
  third_party_involved: boolean
  third_party_details?: string

  // Description
  description: string
  weather_conditions?: string
  road_conditions?: string

  // Damage/Injury
  injuries_reported: boolean
  injury_details?: string
  vehicle_damage_estimate?: number
  property_damage_estimate?: number

  // Response
  police_report_filed: boolean
  police_report_number?: string
  emergency_services_called: boolean

  // Investigation
  investigation_id?: string
  root_cause?: string
  preventive_actions?: string

  // Insurance
  insurance_claim_number?: string
  insurance_carrier?: string
  estimated_claim_amount?: number

  // Documentation
  photos?: string[]
  documents?: string[]

  // Metadata
  reported_by: string
  reported_at: string
  created_at: string
  updated_at: string
  closed_at?: string
}
```

### Type Definitions

```typescript
type IncidentSeverity = 'minor' | 'major' | 'critical' | 'fatality'

type IncidentType =
  | 'vehicle_accident'
  | 'property_damage'
  | 'personal_injury'
  | 'near_miss'
  | 'environmental'
  | 'equipment_damage'

type IncidentStatus =
  | 'reported'
  | 'under_investigation'
  | 'pending_review'
  | 'closed'
  | 'claim_filed'
```

---

## Testing

### E2E Tests

**File:** `tests/e2e/incident-management.spec.ts`
**Test Count:** 20 functional + 3 accessibility + 2 performance

**Test Suites:**
1. **Functional Tests (IM-001 to IM-020)**
   - Hub loading and tab navigation
   - Safety metrics display
   - Incident report dialog
   - Form validation
   - Incident submission
   - Investigation workflow
   - GPS location capture
   - Filtering and search
   - Real-time updates

2. **Accessibility Tests (IM-A11Y-001 to IM-A11Y-003)**
   - ARIA labels
   - Keyboard navigation
   - Screen reader support

3. **Performance Tests (IM-PERF-001 to IM-PERF-002)**
   - Page load time (< 3 seconds)
   - Large data set handling

**Run Tests:**
```bash
npx playwright test tests/e2e/incident-management.spec.ts
```

### Production Verification

**File:** `scripts/verify-production.sh`
**Test Suites:** 10

**Verifies:**
- Frontend deployment
- API health
- Core endpoints
- Authentication system
- Security headers
- Hub routes
- Database connectivity
- Performance metrics
- Critical features
- Incident Management system

**Run Verification:**
```bash
./scripts/verify-production.sh
```

---

## Deployment

### Environment Variables

```bash
# Frontend
VITE_API_URL=https://your-api.azurestaticapps.net/api
VITE_SKIP_AUTH=false  # Set to 'true' only for demo mode

# Backend
DB_HOST=your-postgres-server.postgres.database.azure.com
DB_PORT=5432
DB_NAME=fleet_db
DB_USER=fleet_user
DB_PASSWORD=<secure-password>
NODE_ENV=production
```

### Build Commands

```bash
# Frontend
npm run build
npm run preview

# Backend
cd api
npm run build
npm start

# Production verification
./scripts/verify-production.sh
```

---

## Security

### Authentication
- JWT tokens stored in httpOnly cookies
- CSRF protection on all mutations
- Token refresh mechanism
- Session expiration handling

### Authorization
- Multi-tenant isolation via `tenant_id`
- RBAC permission checks
- Role hierarchy (SuperAdmin > Admin > Manager > User > ReadOnly)

### Input Validation
- Zod schema validation on backend
- Frontend form validation
- SQL injection prevention (parameterized queries)
- XSS prevention (React auto-escaping)

### Security Headers
- X-Content-Type-Options
- X-Frame-Options
- Strict-Transport-Security
- Content-Security-Policy

---

## Performance

### Optimization Techniques
- React.memo for component memoization
- useMemo and useCallback for expensive calculations
- React Query caching (30-second stale time)
- Lazy loading with code splitting
- Virtual scrolling for large lists

### Metrics
- Page load time: < 3 seconds
- API response time: < 500ms
- Incident list rendering: < 100ms
- Form submission: < 1 second

### Monitoring
- React Query DevTools
- Performance API measurements
- Error boundary logging
- Sentry error tracking

---

## Support

For issues or questions:
1. Check the E2E tests for usage examples
2. Review the API endpoint documentation
3. Run production verification script
4. Check logs in `/tmp/production-verify-*.log`

---

**Last Updated:** January 30, 2024
**Version:** 1.0.0
**Status:** Production Ready ✅
