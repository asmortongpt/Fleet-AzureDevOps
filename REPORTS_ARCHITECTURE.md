# Fleet Reports Hub - Architecture

## Overview
The Reports Hub provides a scalable, multi-tenant reporting system with:
- **100 Core Universal Reports** - Work for ANY fleet organization
- **Organization-Specific Custom Reports** - Configurable per organization (e.g., City of Tallahassee)
- **AI-Powered Report Builder** - Generate custom reports via natural language
- **Multi-LLM AI Chatbot** - Intelligent report insights

---

## Report Type Architecture

### 1. Core Universal Reports (100 reports)
**Location**: `src/reporting_library/reports/*.json`

**Purpose**: Out-of-the-box reports that work for ANY fleet management organization

**Domains**:
- **Executive** (exec-01 through exec-10): High-level KPIs, strategic insights
- **Billing** (billing-01 through billing-10): Financial reporting, cost tracking
- **Work Orders** (workorders-01 through workorders-10): Completion rates, labor analytics
- **Shop** (shop-01 through shop-10): Shop efficiency, technician performance
- **PM** (pm-01 through pm-10): Preventive maintenance schedules, compliance
- **Assets** (assets-01 through assets-10): Asset tracking, inventory levels
- **Fuel** (fuel-01 through fuel-10): Fuel consumption, efficiency metrics
- **Safety** (safety-01 through safety-10): Incident reports, safety compliance
- **EV** (ev-01 through ev-10): Electric vehicle performance, charging analytics
- **Bio** (bio-01 through bio-10): Biodiesel usage, sustainability metrics

**Characteristics**:
- Generic, applicable to all organizations
- Shipped with the product
- Cannot be deleted (can be hidden per org)
- Read-only definitions
- Parameterized for flexibility

**Example**: `exec-01.json`
```json
{
  "id": "exec-01",
  "title": "Executive Summary",
  "domain": "exec",
  "description": "High-level fleet performance metrics",
  "datasource": {
    "type": "sqlView",
    "view": "vw_exec_summary",
    "parameters": {
      "date_start": "{{dateRange.start}}",
      "date_end": "{{dateRange.end}}",
      "organization_id": "{{user.organization_id}}"
    }
  },
  "filters": [...],
  "visuals": [...],
  "security": {
    "rowLevel": [
      {"role": "Admin", "rule": "TRUE"},
      {"role": "DepartmentUser", "rule": "department IN user.departments"}
    ]
  }
}
```

---

### 2. Organization-Specific Custom Reports
**Location**: Database table `custom_reports`

**Purpose**: Reports tailored to specific organization's unique needs

**Examples**:
- **City of Tallahassee**: 35 custom dashboard reports
- **City of Miami**: Different custom reports
- **ABC Logistics**: Their own custom reports

**Characteristics**:
- Stored in database, not filesystem
- Organization-scoped (organization_id foreign key)
- Can be created via:
  - Admin UI
  - AI Report Builder
  - API
- Can be shared within organization
- Can be modified/deleted by org admins
- Inherits from core report schema

**Database Schema**:
```sql
CREATE TABLE custom_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  created_by_user_id UUID NOT NULL REFERENCES users(id),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  domain VARCHAR(50),
  category VARCHAR(50), -- e.g., 'main_dashboard', 'driver_measures', etc.
  definition JSONB NOT NULL, -- Full report JSON definition
  is_template BOOLEAN DEFAULT false, -- Can be copied by other orgs
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT unique_org_report UNIQUE(organization_id, title)
);

CREATE INDEX idx_custom_reports_org ON custom_reports(organization_id);
CREATE INDEX idx_custom_reports_domain ON custom_reports(domain);
CREATE INDEX idx_custom_reports_category ON custom_reports(category);
```

---

## City of Tallahassee Custom Reports (35 reports)

These are **organization-specific** and will be stored in the `custom_reports` table with `organization_id = <cot_org_id>`.

### Main Dashboard (8 reports)
1. **cot-main-01**: Scheduled vs Non-Scheduled Repairs
2. **cot-main-02**: PM Compliance by Shop
3. **cot-main-03**: Fleet Availability vs Industry Standard
4. **cot-main-04**: Direct vs Indirect Labor
5. **cot-main-05**: Rework Average
6. **cot-main-06**: Shop Efficiency
7. **cot-main-07**: Turnaround Times
8. **cot-main-08**: Monthly Billing

### Driver Measures (9 reports)
9. **cot-driver-01**: Equipment Types
10. **cot-driver-02**: Equipment Usage
11. **cot-driver-03**: Mechanic Hours
12. **cot-driver-04**: Work Orders per Month/Shop
13. **cot-driver-05**: Work Order Equipment Count
14. **cot-driver-06**: PM Count
15. **cot-driver-07**: Fuel Usage
16. **cot-driver-08**: Fuel Emissions
17. **cot-driver-09**: PM Compliance Detailed

### Safety Dashboard (7 reports)
18. **cot-safety-01**: Equipment Safety Score Totals
19. **cot-safety-02**: Equipment Safety Minutes
20. **cot-safety-03**: Equipment Safety Measures
21. **cot-safety-04**: Equipment Idle Time Measures
22. **cot-safety-05**: Driver Safety Score Totals
23. **cot-safety-06**: Driver Safety Minutes
24. **cot-safety-07**: Driver Safety Measures

### Electric Initiative (8 reports)
25. **cot-electric-01**: Number of Electric Vehicles
26. **cot-electric-02**: Miles Driven on Electricity
27. **cot-electric-03**: Pounds CO₂ Saved
28. **cot-electric-04**: Trees Saved
29. **cot-electric-05**: Oil Changes Saved
30. **cot-electric-06**: Transmission Service Saved
31. **cot-electric-07**: Electric Buses
32. **cot-electric-08**: Hybrid Vehicles

### Biodiesel Dashboard (3 reports)
33. **cot-bio-01**: Biodiesel Production History
34. **cot-bio-02**: Biodiesel Partner Pickup History
35. **cot-bio-03**: Partner Request Forms

---

## User Interface Architecture

### Reports Hub Page Tabs

#### Tab 1: Core Reports
- Display 100 universal reports
- Filterable by domain (Executive, Billing, Work Orders, etc.)
- Searchable
- Grid or list view
- Always visible to all users (RBAC applies to data)

#### Tab 2: Custom Reports
- Display organization-specific custom reports
- Filterable by category (Main Dashboard, Driver Measures, etc.)
- Searchable
- Grid or list view
- Only shows reports for user's organization
- Admins see "Create Custom Report" button

#### Tab 3: AI Report Builder
- Natural language input
- Generates new custom reports
- Saves to `custom_reports` table
- Scoped to user's organization

#### Tab 4: My Reports
- Reports created by current user
- Reports shared with user
- Recently viewed
- Favorites

---

## Implementation Plan

### Phase 1: Database Setup ✅
- [x] Create `custom_reports` table
- [x] Create `report_shares` table
- [x] Create `report_templates` table (for templates other orgs can copy)

### Phase 2: Seed City of Tallahassee Custom Reports
- [ ] Create SQL migration to insert 35 CoT reports
- [ ] Link to City of Tallahassee organization ID
- [ ] Set appropriate categories and domains

### Phase 3: Update ReportsHub.tsx
- [ ] Add "Core Reports" vs "Custom Reports" tabs
- [ ] Fetch custom reports from API
- [ ] Filter by organization context
- [ ] Add "Create Custom Report" button for admins

### Phase 4: Backend API
- [ ] `GET /api/reports/core` - List core reports (from filesystem)
- [ ] `GET /api/reports/custom` - List org's custom reports (from DB)
- [ ] `POST /api/reports/custom` - Create custom report
- [ ] `PUT /api/reports/custom/:id` - Update custom report
- [ ] `DELETE /api/reports/custom/:id` - Delete custom report
- [ ] `POST /api/reports/custom/:id/share` - Share with users/roles

### Phase 5: Admin UI
- [ ] Custom Report Manager page
- [ ] Drag-and-drop report builder
- [ ] Template gallery (copy from other orgs if marked as template)
- [ ] Organization settings (which core reports to show/hide)

---

## Multi-Tenancy & Security

### Organization Context
Every user belongs to an organization:
```typescript
interface User {
  id: string
  email: string
  organization_id: string
  role: 'Admin' | 'Manager' | 'Technician' | 'Driver'
  departments: string[]
}
```

### Report Access Control

#### Core Reports
- Visible to all organizations
- RBAC applied at data level (row-level security)
- Organizations can hide specific core reports via settings

#### Custom Reports
- Scoped to organization via `organization_id`
- Only users in same organization can access
- Can be shared within organization
- RBAC applied at data level

### SQL Views
All SQL views include organization filtering:
```sql
CREATE VIEW vw_exec_summary AS
SELECT
  organization_id,
  date,
  total_vehicles,
  available_vehicles,
  downtime_hours,
  total_cost
FROM fleet_metrics
WHERE organization_id = $1; -- Parameterized
```

---

## Migration Path for City of Tallahassee

### Current State
- 35 dashboard reports as JSON files in filesystem

### Target State
- 35 reports in `custom_reports` table
- Linked to City of Tallahassee organization
- Available via Custom Reports tab

### Migration SQL
```sql
-- Insert City of Tallahassee organization (if not exists)
INSERT INTO organizations (id, name, city, state, type)
VALUES
  ('cot-org-uuid', 'City of Tallahassee', 'Tallahassee', 'FL', 'municipal')
ON CONFLICT DO NOTHING;

-- Insert 35 custom reports
INSERT INTO custom_reports (organization_id, created_by_user_id, title, description, domain, category, definition)
VALUES
  ('cot-org-uuid', 'system-user-uuid', 'Scheduled vs Non-Scheduled Repairs',
   'Hours and percentages by shop with 75/25 Industry Standard benchmark',
   'maintenance', 'main_dashboard',
   '{ ... full JSON definition ... }'::jsonb),
  ... -- Repeat for all 35 reports
;
```

---

## Benefits of This Architecture

### For Product Development
✅ **Scalability**: Core reports ship with product, custom reports per org
✅ **Maintainability**: Core reports versioned in code, custom reports in DB
✅ **Flexibility**: Organizations can extend without changing core product

### For Organizations
✅ **Out-of-the-box**: 100 core reports work immediately
✅ **Customizable**: Add organization-specific reports
✅ **Shareable**: Share custom reports within organization
✅ **AI-Powered**: Generate new reports via natural language

### For Users
✅ **Familiar**: Core reports consistent across all organizations
✅ **Tailored**: Custom reports match their specific workflows
✅ **Discoverable**: Clear tabs separate core vs custom
✅ **RBAC**: Only see data they have access to

---

## API Examples

### Get Core Reports
```typescript
GET /api/reports/core
Response: [
  { id: "exec-01", title: "Executive Summary", domain: "exec", ... },
  { id: "exec-02", title: "Executive Report 2", domain: "exec", ... },
  ...
]
```

### Get Custom Reports (Organization-Scoped)
```typescript
GET /api/reports/custom
Headers: { Authorization: "Bearer <jwt>" }
Response: [
  {
    id: "uuid-1",
    organization_id: "cot-org-uuid",
    title: "Scheduled vs Non-Scheduled Repairs",
    category: "main_dashboard",
    ...
  },
  ...
]
```

### Create Custom Report
```typescript
POST /api/reports/custom
Headers: { Authorization: "Bearer <jwt>" }
Body: {
  title: "Custom Fleet Report",
  description: "My custom report",
  domain: "fleet",
  category: "operations",
  definition: { ... report JSON ... }
}
Response: { id: "new-uuid", ... }
```

---

## Next Steps

1. **Create database migrations** for custom_reports table
2. **Seed City of Tallahassee reports** into database
3. **Update ReportsHub.tsx** with Core vs Custom tabs
4. **Implement custom reports API** endpoints
5. **Build admin UI** for managing custom reports
6. **Test multi-tenancy** with multiple organizations

---

**Architecture Status**: ✅ Designed
**Implementation Status**: 🔄 In Progress
**Target Completion**: Next phase
