# Fleet Compliance & Policy Features Documentation

## Executive Summary

This document provides comprehensive documentation for the four core Compliance & Policy features in the Fleet application:
1. **OSHA Safety Forms** - Incident and safety compliance documentation
2. **Policy Engine Workbench** - AI-driven policy automation and enforcement
3. **Custom Form Builder** - Dynamic form creation and management
4. **Data Workbench** - Fleet data management and analytics

---

## 1. OSHA SAFETY FORMS

### Feature Overview
The OSHA Safety Forms module manages workplace safety incidents, near-misses, and OSHA-compliant documentation. It provides a comprehensive solution for tracking injuries, incidents, and compliance requirements across the fleet organization.

**File Location:** `/home/user/Fleet/src/components/modules/OSHAForms.tsx`

**Key Statistics:**
- Tracks 8 form types (OSHA 300, 300A, 301, Incident, Near-Miss, JSA, Inspection, Custom)
- Supports 5 severity levels (Minor, Moderate, Serious, Critical, Fatal)
- Manages 5 form statuses (Draft, Submitted, Under-Review, Approved, Closed)

---

### 1.1 Target Users

| Role | Responsibilities |
|------|------------------|
| **Safety Officers** | Create, review, and approve safety forms; establish safety protocols |
| **Drivers/Equipment Operators** | Submit incident and near-miss reports |
| **Fleet Managers** | Monitor safety compliance; track trends |
| **HR Personnel** | Track employee injuries; manage documentation |
| **Supervisors** | Review and submit forms from their teams |
| **Compliance Auditors** | Verify OSHA compliance; access historical records |

---

### 1.2 User Stories

#### Safety Officer's Perspective
- **As a Safety Officer**, I want to review submitted safety forms so that **I can ensure incidents are properly documented and corrective actions are identified before approval**
- **As a Safety Officer**, I want to track critical and fatal incidents in real-time so that **I can immediately escalate serious safety concerns**
- **As a Safety Officer**, I want to approve forms with detailed notes so that **I can provide feedback on corrective and preventive measures**

#### Driver/Operator's Perspective
- **As a Driver**, I want to quickly report an incident or near-miss so that **safety teams can act immediately to prevent future occurrences**
- **As a Driver**, I want to attach photos to my incident report so that **the safety investigation has visual evidence of the situation**
- **As a Driver**, I want to add witness information to my report so that **my account is corroborated**

#### Fleet Manager's Perspective
- **As a Fleet Manager**, I want to see dashboard metrics on pending reviews, approved forms, and critical incidents so that **I can track safety performance and compliance status**
- **As a Fleet Manager**, I want to filter forms by type, date, and status so that **I can quickly find specific incidents**
- **As a Fleet Manager**, I want to export safety data for regulatory reporting so that **I can demonstrate OSHA compliance**

#### HR/Compliance Perspective
- **As an HR Manager**, I want to link incidents to specific employees with detailed injury information so that **I can manage workers' compensation claims**
- **As an HR Manager**, I want to track days away from work and restricted duty days so that **I can calculate OSHA-reportable metrics**
- **As a Compliance Auditor**, I want to access historical form records with timestamps so that **I can verify compliance during regulatory audits**

---

### 1.3 Core Functionality & Features

#### 1.3.1 Form Management
```
Create Form
  ├── Select Form Type (300, 300A, 301, Incident, Near-Miss, JSA, Inspection, Custom)
  ├── Set Severity Level (Minor → Fatal)
  ├── Record Incident Details
  │   ├── Title & Description
  │   ├── Incident Date
  │   ├── Location
  │   ├── Department
  │   └── Employee Information (Name, ID)
  ├── Document Injury Information
  │   ├── Injury Type (Laceration, Strain, Burn, etc.)
  │   ├── Body Part Affected
  │   ├── Medical Attention Required (Yes/No)
  │   ├── Days Away from Work
  │   └── Days on Restricted Duty
  ├── Analysis & Prevention
  │   ├── Root Cause Analysis
  │   ├── Corrective Actions
  │   └── Preventive Measures
  ├── Witnesses & Evidence
  │   ├── Add Witness Names
  │   └── Attach Photos/Evidence
  └── Save as Draft
```

#### 1.3.2 Form Status Lifecycle
```
Draft (Creation in Progress)
  ↓
Submit (Ready for Review)
  ↓
Under-Review (Safety Officer evaluates)
  ├── Sent back for edits →
  ↓
Approved (Safety Officer approves)
  ↓
Closed (Form archived)
```

#### 1.3.3 Dashboard Metrics
- **Total Forms**: Cumulative count of all submitted forms
- **Pending Review**: Forms awaiting safety officer action
- **Approved Forms**: Forms that passed review and are closed out
- **Critical Incidents**: Forms marked as critical or fatal severity

#### 1.3.4 Search & Filter Capabilities
- **Search**: Title, Description, Employee Name (Full Text)
- **Filter by Form Type**: All, OSHA 300, 300A, 301, Incident, Near-Miss, JSA, Inspection
- **Filter by Status**: All, Draft, Submitted, Under-Review, Approved, Closed
- **Combined Filtering**: Multiple filters work together

#### 1.3.5 Form Actions
| Action | Available When | Result |
|--------|-----------------|--------|
| Edit | Draft Status | Update form details |
| Submit | Draft Status | Move to "Submitted" for review |
| Approve | Submitted Status | Move to "Approved"; assign reviewer |
| Download | Any Status | Export form as PDF/document |
| View in 3D | Has Photos | Open Virtual Garage viewer with incident photos |

---

### 1.4 Data Structure

#### OSHAForm Interface
```typescript
{
  id: string                          // Unique identifier (osha-{timestamp})
  tenantId: string                    // Organization tenant ID
  formType: "300" | "300A" | "301" | "incident" | "near-miss" | "jsa" | "inspection" | "custom"
  
  // Incident Information
  title: string                       // Brief incident description
  description: string                 // Detailed description
  incidentDate: string                // Date incident occurred
  reportedDate: string                // Date reported (auto-set if not provided)
  location: string                    // Location where incident occurred
  department: string                  // Department involved
  
  // Employee Information
  employeeId?: string                 // Optional employee identifier
  employeeName?: string               // Employee's full name
  
  // Injury Information
  injuryType?: string                 // Type of injury (Laceration, Strain, etc.)
  bodyPart?: string                   // Body part affected
  severity: "minor" | "moderate" | "serious" | "critical" | "fatal"
  requiresMedicalAttention: boolean   // Medical attention required flag
  
  // Work Impact
  daysAway?: number                   // Days away from work
  daysRestricted?: number             // Days on restricted/light duty
  
  // Analysis & Resolution
  rootCause?: string                  // Root cause analysis text
  correctiveAction?: string           // Corrective actions taken
  preventiveMeasures?: string         // Preventive measures for future
  
  // Evidence & Witnesses
  witnesses: string[]                 // Witness names/identifiers
  photos: string[]                    // Photo/evidence URIs
  
  // Status & Approval Tracking
  status: "draft" | "submitted" | "under-review" | "approved" | "closed"
  submittedBy: string                 // User who submitted
  submittedAt: string                 // Submission timestamp
  reviewedBy?: string                 // Safety officer who reviewed
  reviewedAt?: string                 // Review timestamp
  approvedBy?: string                 // User who approved
  approvedAt?: string                 // Approval timestamp
  notes?: string                      // Additional notes
}
```

---

### 1.5 Data Inputs & Outputs

#### Inputs
| Source | Data | Purpose |
|--------|------|---------|
| User Form | Incident details, employee info, severity, actions | Create/update form |
| File Upload | Photos, documents, attachments | Evidence documentation |
| System | Auto-generated dates, user IDs | Form metadata |
| Manual Entry | Witness names, root cause analysis | Investigation details |

#### Outputs
| Output Type | Format | Usage |
|------------|--------|-------|
| Dashboard | JSON metrics | Display KPIs |
| Export | PDF/JSON | Regulatory compliance |
| Search Results | Filtered forms array | UI display |
| Notifications | Toast messages | User feedback |

---

### 1.6 Integration Points

#### Internal Integrations
```
OSHAForms Module
  ├── Virtual Garage (3D Photo Viewer)
  │   └── handleViewIn3D() - Navigate to 3D view with incident photos
  ├── UI Components Library
  │   ├── Card, CardContent, CardHeader, CardTitle
  │   ├── Dialog for form creation/editing
  │   ├── Tables for form listing
  │   ├── Badges for severity/status display
  │   └── Select dropdowns for form filtering
  └── State Management
      ├── useState for forms array
      ├── useState for search/filter state
      └── useState for dialog management
```

#### External Integrations (Potential)
- **Document Storage**: Photo/file upload to cloud storage
- **Email System**: Notification to safety officers about submissions
- **HRIS**: Employee information lookup
- **OSHA Reporting**: Export for compliance submissions
- **Workflow Automation**: Trigger alerts on critical incidents

---

### 1.7 Key Components & Purposes

#### Component: Dashboard Metrics
```
Function: Display safety KPIs at a glance
Props: forms array, calculated metrics
Displays:
  - Total Forms (all-time)
  - Pending Review (submitted + under-review)
  - Approved Forms (completed)
  - Critical Incidents (critical + fatal severity)
```

#### Component: Form Creation Dialog
```
Function: Modal dialog for creating/editing forms
Features:
  - Multi-step form with validation
  - Required field checking (title, date, location)
  - Conditional fields (witness info if exists)
  - Status-based field visibility
  - Auto-population on edit
```

#### Component: Forms Table
```
Function: Display filtered forms in tabular format
Columns:
  - Form Type (badge)
  - Title + Location
  - Date (incident date)
  - Employee Name
  - Severity (color-coded badge)
  - Status (color-coded badge)
  - Actions (Edit, Submit, Approve, Download, View 3D)
Sorting: By column headers
Pagination: First 15 forms shown, with count indicator
```

#### Component: Filter Controls
```
Function: Enable targeted form search
Controls:
  1. Search Box (title, description, employee name)
  2. Form Type Dropdown (filter by 300, 301, Incident, etc.)
  3. Status Dropdown (filter by Draft, Submitted, Approved, etc.)
All filters work together (AND logic)
```

---

### 1.8 Workflow Diagrams

#### Incident Reporting Workflow
```
┌─────────────────────────────────────────────────────────────────┐
│ INCIDENT OCCURS                                                 │
└────────────────────┬────────────────────────────────────────────┘
                     ↓
┌─────────────────────────────────────────────────────────────────┐
│ DRIVER/OPERATOR ACTION                                          │
│ • Opens OSHA Forms module                                       │
│ • Clicks "New Form" button                                      │
│ • Completes incident information:                               │
│   - Select form type (Incident/Near-Miss)                       │
│   - Set severity level                                          │
│   - Enter location, date, employee info                         │
│   - Add description and witness names                           │
│   - Attach photos if available                                  │
└────────────────────┬────────────────────────────────────────────┘
                     ↓
┌─────────────────────────────────────────────────────────────────┐
│ SAVE AS DRAFT                                                   │
│ • Form saved with status: "Draft"                               │
│ • Driver can edit anytime before submission                     │
└────────────────────┬────────────────────────────────────────────┘
                     ↓
┌─────────────────────────────────────────────────────────────────┐
│ SUBMIT FOR REVIEW                                               │
│ • Form status changes to "Submitted"                            │
│ • Safety Officer receives notification                          │
│ • Timestamp recorded                                            │
└────────────────────┬────────────────────────────────────────────┘
                     ↓
         ┌───────────┴────────────┐
         ↓                        ↓
  ┌─────────────────┐   ┌─────────────────┐
  │ SAFETY OFFICER  │   │ SAFETY OFFICER  │
  │ REJECTS FORM    │   │ APPROVES FORM   │
  │ (Requests edits)│   │                 │
  └────────┬────────┘   └────────┬────────┘
           │                     │
           ↓                     ↓
  ┌─────────────────┐   ┌─────────────────┐
  │ Status:         │   │ Status: Approved│
  │ Under-Review    │   │ Form Archived   │
  │ Driver edits    │   │ Reports filed   │
  │ Resubmits       │   │ Compliance OK   │
  └─────────────────┘   └─────────────────┘
```

#### Root Cause Analysis & Prevention Workflow
```
┌──────────────────────────────────────────────────┐
│ INCIDENT DOCUMENTED                              │
└─────────────────────┬──────────────────────────────┘
                      ↓
┌──────────────────────────────────────────────────┐
│ SAFETY OFFICER REVIEW PHASE                      │
│ • Review incident details                        │
│ • Assess severity classification                 │
│ • Check witness information completeness         │
└─────────────────────┬──────────────────────────────┘
                      ↓
┌──────────────────────────────────────────────────┐
│ ROOT CAUSE ANALYSIS                              │
│ • Identify contributing factors                  │
│ • Document systemic issues                       │
│ • Input into form's "rootCause" field            │
└─────────────────────┬──────────────────────────────┘
                      ↓
┌──────────────────────────────────────────────────┐
│ CORRECTIVE ACTIONS                               │
│ • Immediate actions taken                        │
│ • Equipment/area repairs                         │
│ • First aid/medical treatment                    │
│ • Input into form's "correctiveAction" field     │
└─────────────────────┬──────────────────────────────┘
                      ↓
┌──────────────────────────────────────────────────┐
│ PREVENTIVE MEASURES                              │
│ • Training updates                               │
│ • Policy changes                                 │
│ • Equipment upgrades                             │
│ • Input into form's "preventiveMeasures" field   │
└─────────────────────┬──────────────────────────────┘
                      ↓
┌──────────────────────────────────────────────────┐
│ FORM APPROVED & CLOSED                           │
│ • Status changed to "Approved"                   │
│ • Timestamp recorded (approvedAt)                │
│ • Form ready for OSHA reporting                  │
└──────────────────────────────────────────────────┘
```

---

### 1.9 Suggested Test Scenarios

#### Unit Test Scenarios

| Test Case | Input | Expected Result |
|-----------|-------|-----------------|
| Create Form with Valid Data | All required fields filled | Form saved to state, toast success |
| Create Form Missing Required Fields | Title or location missing | Toast error, form not saved |
| Submit Draft Form | Form in "Draft" status | Status changes to "Submitted", timestamp recorded |
| Approve Submitted Form | Form in "Submitted" status | Status changes to "Approved", reviewedBy/At recorded |
| Edit Approved Form | Click edit on approved form | Form opens in dialog, can be modified |
| Search by Title | Enter partial form title | Only matching forms shown in table |
| Filter by Severity | Select "Critical" severity | Only critical/fatal forms displayed |
| Combined Filter | Type text AND filter by status | Results match both criteria (AND logic) |
| View 3D with Photos | Form has photos attached | Navigates to Virtual Garage viewer |
| View 3D without Photos | Form has no photos | Toast error: "No photos available" |
| Export Form | Click download button | PDF/JSON export file generated |

#### Integration Test Scenarios

| Test Case | Workflow | Verification |
|-----------|----------|---------------|
| End-to-End Form Submission | Create → Submit → Review → Approve | Form moves through all statuses correctly |
| Severity Color Coding | Create forms with different severity levels | Badges display correct colors (green→red) |
| Status Badge Progression | Track form through lifecycle | Status badges update visually at each step |
| Witness Addition | Add multiple witnesses to form | All witnesses display in form and table |
| Photo Attachment | Add photos to form | Photos array stored and accessible |
| Date Validation | Set incident date in past/future | Dates properly formatted and displayed |
| Employee Lookup | Enter employee name | Should integrate with employee database |

#### User Experience Test Scenarios

| Test Case | Scenario | Success Criteria |
|-----------|----------|------------------|
| First-Time User | User creates first incident form | Form fields clearly labeled, required fields marked |
| Bulk Form Review | Safety officer reviews 20+ forms | Search/filter works smoothly, no performance lag |
| Mobile Responsiveness | Access form on mobile device | Dialog fits screen, fields readable |
| Dashboard at a Glance | Manager views dashboard | Can immediately see critical incident count |
| Export for Compliance | Export forms for audit | Data integrity maintained, timestamps preserved |
| Incident Hotspot Analysis | Review forms by location | Can identify high-incident areas |

#### Edge Case Testing

| Edge Case | Scenario | Expected Behavior |
|-----------|----------|-------------------|
| Empty Forms List | No forms created yet | Display message: "No forms found. Create your first OSHA form..." |
| Special Characters | Enter "John's, Inc." as location | Characters properly escaped and displayed |
| Very Long Description | 5000+ character description | Text area scrolls, no UI breaking |
| Same Day Multiple Incidents | Multiple forms with same date | All forms display, properly sorted |
| Time Zone Differences | Forms across regions | Dates and times normalized to tenant timezone |
| Concurrent Edits | User A edits, User B submits simultaneously | Last write wins, or conflict resolution applied |

---

### 1.10 Security & Compliance Considerations

#### Data Protection
- All forms contain personally identifiable information (PII) about employees
- Forms must comply with HIPAA/medical privacy regulations
- Access control: Only assigned users and safety officers can view
- Audit trail: All modifications tracked with timestamps and user IDs

#### OSHA Compliance
- Forms must support OSHA 300 Log standard format
- Retention: Forms kept for 5+ years per OSHA requirements
- Reportable incidents: Critical/fatal marked for immediate escalation
- Regulatory reporting: Export functionality for OSHA submissions

---

## 2. POLICY ENGINE WORKBENCH

### Feature Overview
The Policy Engine Workbench is an AI-driven compliance automation system that enables organizations to define, test, and deploy policies across their fleet operations. It supports three execution modes: Monitor (observe only), Human-in-Loop (require approval), and Autonomous (auto-execute).

**File Location:** `/home/user/Fleet/src/components/modules/PolicyEngineWorkbench.tsx`

**Technology Stack:**
- Type System: `/home/user/Fleet/src/lib/policy-engine/types.ts`
- 12 policy types supported
- 3 execution modes with customizable security controls
- AI confidence scoring (0.0 - 1.0)
- Dual control and MFA support

---

### 2.1 Target Users

| Role | Responsibilities |
|------|------------------|
| **Compliance Officer** | Create and manage policies; set confidence thresholds |
| **Fleet Manager** | Monitor policy execution and violations |
| **Safety Director** | Define safety policies; review violations |
| **Operations Manager** | Manage dispatch and maintenance policies |
| **IT Security Admin** | Configure MFA, dual control, data retention policies |
| **Finance Manager** | Monitor payment and expense policies |
| **Environmental Manager** | Manage environmental compliance policies |

---

### 2.2 User Stories

#### Compliance Officer's Perspective
- **As a Compliance Officer**, I want to create safety policies with specific conditions so that **automated enforcement ensures consistent safety standards across all drivers**
- **As a Compliance Officer**, I want to set an AI confidence threshold for each policy so that **only high-confidence violations trigger enforcement actions**
- **As a Compliance Officer**, I want to test policies in a sandbox environment before activation so that **I can verify policy behavior before real deployment**
- **As a Compliance Officer**, I want to require dual control approval for critical policies so that **major policy changes have proper oversight**

#### Fleet Manager's Perspective
- **As a Fleet Manager**, I want to monitor policy executions in real-time so that **I can see how many times each policy has triggered**
- **As a Fleet Manager**, I want to track policy violations so that **I can identify problem areas and coach affected drivers**
- **As a Fleet Manager**, I want to see policies grouped by type so that **I can quickly find and manage policies by category**
- **As a Fleet Manager**, I want to receive alerts when critical policy violations occur so that **I can take immediate action**

#### Operations Manager's Perspective
- **As an Operations Manager**, I want to create dispatch policies that auto-reject inefficient routes so that **fuel costs are minimized without manual review**
- **As an Operations Manager**, I want to define maintenance policies triggered by mileage or time so that **vehicles receive preventive maintenance automatically**
- **As an Operations Manager**, I want to activate or deactivate policies on-demand so that **I can respond to operational changes quickly**

#### Safety Director's Perspective
- **As a Safety Director**, I want to define policies that monitor speeding in residential areas so that **violations are flagged for driver coaching**
- **As a Safety Director**, I want to require MFA confirmation for autonomous policy execution so that **safety policies aren't accidentally triggered**
- **As a Safety Director**, I want to track related policies together so that **I can see how different safety policies interact**

---

### 2.3 Core Functionality & Features

#### 2.3.1 Policy Lifecycle
```
Create Policy
  ├── Define Name & Description
  ├── Select Type (Safety, Dispatch, OSHA, Maintenance, etc.)
  ├── Configure Execution Mode (Monitor, Human-in-Loop, Autonomous)
  ├── Set Conditions (Rule definitions)
  ├── Define Actions (What happens when triggered)
  ├── Set Scope (Where policy applies)
  ├── Configure Security (Dual control, MFA, confidence threshold)
  └── Save as Draft

Test Policy
  ├── Run in Sandbox Environment
  ├── Verify Conditions Trigger Correctly
  ├── Confirm Actions Execute Properly
  └── Validate Expected Outcomes

Approve Policy
  ├── Policy Status: Testing → Approved
  ├── Ready for Production Deployment
  └── Can be Activated

Deploy Policy
  ├── Policy Status: Approved → Active
  ├── Monitor Execution Metrics
  ├── Track Violations
  └── Adjust Confidence Thresholds as Needed

Manage Policy
  ├── Modify Conditions/Actions
  ├── Pause/Resume (Deactivate/Activate)
  ├── Version Control
  └── Deprecate/Archive

Retire Policy
  ├── Status: Active → Deprecated/Archived
  ├── Remove from Active Enforcement
  └── Keep in System for Audit Trail
```

#### 2.3.2 Supported Policy Types
```
1. Safety - Driver behavior, speed limits, harsh braking
2. Dispatch - Route optimization, zone restrictions, load limits
3. Privacy - Data access controls, PII handling
4. EV Charging - Charging schedule optimization, station routing
5. Payments - Payment authorization, fraud detection
6. Maintenance - Service scheduling, compliance tracking
7. OSHA - Incident reporting, safety documentation
8. Environmental - Emissions compliance, green practices
9. Data Retention - Document lifecycle, archival
10. Security - Access control, authentication requirements
11. Vehicle Use - Personal use restrictions, authorized purposes
12. Driver Behavior - Aggressive driving, distracted driving
```

#### 2.3.3 Execution Modes

| Mode | Behavior | Use Case | Requires |
|------|----------|----------|----------|
| **Monitor** | Logs violations, no action taken | Observation, analysis, trending | None |
| **Human-in-Loop** | Flags violations, requires manual approval before action | High-impact policies, requires oversight | Manual approval |
| **Autonomous** | Automatically executes actions when conditions met | Low-risk policies, time-sensitive actions | Confidence score, optional MFA |

#### 2.3.4 Dashboard Metrics
- **Total Policies**: Count of all policies in system
- **Active Policies**: Policies with status = "active"
- **Total Executions**: Sum of executionCount across all policies
- **Violations Detected**: Sum of violationCount across all policies

#### 2.3.5 Advanced Security Controls
```
1. Confidence Score Threshold
   • Range: 0.0 (accept all) to 1.0 (require certainty)
   • Default: 0.85
   • Adjustable per policy
   • AI system won't trigger actions below threshold

2. Dual Control
   • Requires 2 authorized approvals
   • Prevents single-user override
   • Applies to sensitive policies
   • Approval chain visible in audit log

3. Multi-Factor Authentication (MFA)
   • Required before policy execution
   • Adds authentication layer
   • Prevents unauthorized automated actions
   • Complements dual control
```

---

### 2.4 Data Structure

#### Policy Interface
```typescript
{
  id: string                              // Unique identifier (policy-{timestamp})
  tenantId: string                        // Organization tenant ID
  name: string                            // Policy name (e.g., "Speed Limit Enforcement")
  description: string                     // Detailed description
  type: PolicyType                        // One of 12 types
  version: string                         // Semantic version (1.0.0)
  status: PolicyStatus                    // draft | testing | approved | active | deprecated | archived
  mode: PolicyMode                        // monitor | human-in-loop | autonomous
  
  // Policy Definition
  conditions: any[]                       // Array of condition rules that trigger policy
  actions: any[]                          // Array of actions to execute when conditions met
  scope: any                              // Scope definition (vehicles, drivers, locations, etc.)
  
  // Security & Confidence
  confidenceScore: number                 // 0.0-1.0, AI confidence threshold
  requiresDualControl: boolean            // Requires 2 approvals
  requiresMFAForExecution: boolean        // Requires MFA
  
  // Metadata & Tracking
  createdBy: string                       // Creator user ID
  createdAt: string                       // Creation timestamp
  lastModifiedBy: string                  // Last modifier user ID
  lastModifiedAt: string                  // Last modification timestamp
  
  // Organization & Relationships
  tags: string[]                          // Searchable tags
  category?: string                       // Optional category (e.g., "Regulatory", "Operational")
  relatedPolicies?: string[]              // Array of related policy IDs
  
  // Metrics & Execution History
  executionCount: number                  // How many times policy has triggered
  violationCount: number                  // How many violations detected
}

// Policy Types Union
type PolicyType = 
  | "safety" | "dispatch" | "privacy" | "ev-charging" | "payments" 
  | "maintenance" | "osha" | "environmental" | "data-retention" 
  | "security" | "vehicle-use" | "driver-behavior"

type PolicyMode = "monitor" | "human-in-loop" | "autonomous"

type PolicyStatus = "draft" | "testing" | "approved" | "active" | "deprecated" | "archived"
```

---

### 2.5 Data Inputs & Outputs

#### Inputs
| Source | Data | Purpose |
|--------|------|---------|
| User Form | Policy name, description, type, mode | Create/update policy |
| Condition Builder | Condition rules, logic operators | Define when policy triggers |
| Action Definition | Actions to take, parameters | Define policy enforcement |
| Scope Configuration | Vehicle filters, driver filters, location filters | Limit policy application |
| Security Settings | Confidence score, dual control flag, MFA flag | Configure security posture |

#### Outputs
| Output Type | Format | Usage |
|------------|--------|-------|
| Dashboard Metrics | JSON | Display KPIs (policies, executions, violations) |
| Policy Execution Log | JSON array | Track each time policy triggered |
| Violation Report | JSON | Identify problem areas |
| Audit Trail | JSON with timestamps | Compliance documentation |
| Alert Notifications | Toast/Email | Notify stakeholders of violations |

---

### 2.6 Integration Points

#### Internal Integrations
```
PolicyEngineWorkbench Module
  ├── UI Components Library
  │   ├── Card for policy cards
  │   ├── Dialog for create/edit
  │   ├── Table for policy listing
  │   ├── Badge for type/mode/status
  │   ├── Switch for dual control/MFA
  │   └── Range slider for confidence score
  ├── State Management
  │   ├── useState for policies array
  │   ├── useState for search/filter
  │   ├── useState for form state
  │   └── useState for dialog management
  └── Toast Notifications
      ├── Success messages on create/update
      ├── Error messages on validation
      └── Info messages on policy test
```

#### External Integrations (Potential)
- **Telemetry System**: Real-time vehicle/driver data for condition evaluation
- **Notification Engine**: Email/SMS alerts for violations
- **Compliance Framework**: HIPAA, SOC2, ISO compliance integration
- **Audit Logging**: Centralized audit trail for all policy actions
- **Rules Engine**: Condition and action evaluation
- **Workflow Engine**: Complex multi-step action sequences

---

### 2.7 Key Components & Purposes

#### Component: Policy Dashboard Metrics
```
Function: Display policy engine KPIs
Metrics:
  - Total Policies: All policies count
  - Active Policies: Green highlight, shows active enforcement
  - Total Executions: Blue, shows policy firing frequency
  - Violations Detected: Orange warning, shows enforcement impact
Visual: 4-card grid layout with icons
```

#### Component: Create/Edit Policy Dialog
```
Function: Multi-step policy creation and editing
Fields:
  1. Basic Info
     - Policy Name (required)
     - Policy Type (required)
  2. Description
     - Policy Description (required)
  3. Execution Configuration
     - Execution Mode (Monitor/Human-in-Loop/Autonomous)
     - Policy Status (Draft/Testing/Approved/Active)
  4. AI Confidence
     - Confidence Threshold slider (0.0-1.0)
     - Visual percentage display
  5. Security
     - Dual Control checkbox
     - MFA for Execution checkbox
  6. Organization
     - Category field
Status: Shows "Create New Policy" or "Edit Policy" in title
```

#### Component: Policy Table
```
Function: Display all policies in tabular format
Columns:
  - Policy Name (with version number)
  - Type (badge: Safety, Dispatch, etc.)
  - Mode (badge: Monitor, Human-in-Loop, Autonomous with icon)
  - Confidence (% display + Dual/MFA badges if applicable)
  - Executions (count + violations if any)
  - Status (badge with color)
  - Actions (buttons for Edit, Test, Activate, Deactivate)
Sorting: Clickable headers
Filtering: Type dropdown, Status dropdown, Search box
```

#### Component: Mode Indicator with Icon
```
Monitor (Eye icon)     → Blue badge "Log Only"
Human-in-Loop (Shield) → Yellow badge "Require Approval"
Autonomous (Lightning)  → Green badge "Auto-Execute"
```

---

### 2.8 Workflow Diagrams

#### Policy Creation & Deployment Workflow
```
┌────────────────────────────────────────────────┐
│ COMPLIANCE OFFICER CREATES NEW POLICY          │
│ • Define name & description                    │
│ • Select type (Safety, Dispatch, etc.)        │
│ • Specify execution mode                       │
│ • Set confidence threshold (85% default)       │
│ • Configure security (dual control, MFA)       │
└──────────────┬─────────────────────────────────┘
               ↓
┌────────────────────────────────────────────────┐
│ SAVE POLICY AS DRAFT                           │
│ Status: Draft                                  │
│ Not yet enforced                               │
└──────────────┬─────────────────────────────────┘
               ↓
┌────────────────────────────────────────────────┐
│ TEST POLICY IN SANDBOX                         │
│ • Run simulated test                           │
│ • Verify conditions trigger correctly          │
│ • Confirm actions execute properly             │
│ • Check for false positives/negatives          │
│ Status: Testing                                │
└──────────────┬─────────────────────────────────┘
               ↓
        ┌──────┴──────┐
        ↓             ↓
   ┌────────┐  ┌──────────────┐
   │ FAILS  │  │ SUCCEEDS     │
   └───┬────┘  └──────┬───────┘
       │               ↓
       │      ┌────────────────────────┐
       │      │ APPROVE POLICY         │
       │      │ Status: Approved       │
       │      │ Ready for production   │
       │      └────────┬───────────────┘
       │               ↓
       │      ┌────────────────────────┐
       │      │ ACTIVATE POLICY        │
       │      │ Status: Active         │
       │      │ Now enforcing in fleet │
       │      └────────┬───────────────┘
       │               ↓
       │      ┌────────────────────────┐
       │      │ MONITOR EXECUTION      │
       │      │ • Track executions     │
       │      │ • Log violations       │
       │      │ • Adjust thresholds    │
       │      └────────────────────────┘
       │
       └─→ ┌──────────────────────┐
           │ UPDATE & RETEST      │
           │ Modify policy        │
           │ Return to testing    │
           └──────────────────────┘
```

#### Policy Violation Detection & Response
```
┌──────────────────────────────────────────────────┐
│ VEHICLE/DRIVER DATA RECEIVED                     │
│ Real-time telemetry, location, speed, etc.       │
└─────────────────────┬────────────────────────────┘
                      ↓
┌──────────────────────────────────────────────────┐
│ CHECK AGAINST ACTIVE POLICIES                    │
│ Evaluate all conditions in real-time             │
└─────────────────────┬────────────────────────────┘
                      ↓
         ┌────────────┴──────────────┐
         ↓                           ↓
    ┌─────────┐             ┌──────────────┐
    │ NO MATCH│             │ CONDITIONS   │
    │ POLICY  │             │ TRIGGERED    │
    └─────────┘             │ Check Conf.% │
                            └──────┬───────┘
                                   ↓
                    ┌──────────────┴──────────────┐
                    ↓                             ↓
            ┌──────────────┐          ┌────────────────┐
            │ LOW CONF.    │          │ HIGH CONF.     │
            │ (<threshold) │          │ (≥threshold)   │
            │ Log only     │          │ Trigger action │
            └──────────────┘          └────────┬───────┘
                                               ↓
                                 ┌─────────────┴──────────────┐
                                 ↓                            ↓
                        ┌──────────────────┐    ┌──────────────────┐
                        │ AUTONOMOUS MODE  │    │ HUMAN-IN-LOOP    │
                        │ • Auto-execute   │    │ • Require approval│
                        │ • MFA if enabled │    │ • Wait for review │
                        │ • Log action     │    │ • Queue for human │
                        └──────────────────┘    └──────────────────┘
                                               ↓ (After approval)
                                 ┌─────────────────────────┐
                                 │ VIOLATION LOGGED        │
                                 │ • Increment count       │
                                 │ • Create audit entry    │
                                 │ • Send notifications    │
                                 │ • Trigger remediation   │
                                 └─────────────────────────┘
```

---

### 2.9 Suggested Test Scenarios

#### Unit Test Scenarios

| Test Case | Input | Expected Result |
|-----------|-------|-----------------|
| Create Policy with Valid Data | All required fields | Policy saved, status="draft" |
| Create Policy Missing Name | No name provided | Toast error, policy not saved |
| Create Policy Missing Description | No description | Toast error, policy not saved |
| Set Confidence to 0.5 | Drag slider to 50% | Display shows "50%", saved as 0.5 |
| Enable Dual Control | Toggle dual control switch | requiresDualControl = true |
| Enable MFA | Toggle MFA switch | requiresMFAForExecution = true |
| Test Policy (Draft) | Click play/test button | Status changes to "testing" |
| Activate Approved Policy | Click activate button | Status changes to "active" |
| Deactivate Active Policy | Click pause button | Status changes to "draft" |
| Search Policies | Enter policy name | Only matching policies displayed |
| Filter by Type | Select "Safety" type | Only safety policies shown |
| Filter by Status | Select "Active" status | Only active policies shown |
| Combined Filters | Type + Status filter | Both conditions apply (AND logic) |

#### Integration Test Scenarios

| Test Case | Workflow | Verification |
|-----------|----------|---------------|
| Full Policy Lifecycle | Draft → Test → Approve → Activate | All status transitions work, metrics update |
| Condition Evaluation | Configure condition, trigger event | Condition triggers action correctly |
| Confidence Threshold | Set to 80%, test low vs high conf. | Low conf (70%) ignores, high (90%) triggers |
| Dual Control Flow | Enable dual control, activate policy | Requires 2 approvals before action |
| MFA on Execution | Enable MFA, trigger autonomous policy | MFA prompt appears before execution |
| Violation Counting | Trigger policy 5 times | violationCount increments to 5 |
| Execution Counting | Execute policy 10 times | executionCount increments to 10 |
| Related Policies | Link policies together | Related policies displayed and grouped |

#### User Experience Test Scenarios

| Test Case | Scenario | Success Criteria |
|-----------|----------|------------------|
| Create First Policy | Compliance officer creates first policy | Clear guidance, helpful defaults |
| Complex Policy | Define policy with multiple conditions | UI handles complexity without confusion |
| Policy Testing | Test policy before deployment | Sandbox environment works, no production impact |
| Violation Alert | Trigger policy violation | Alert notifies stakeholders immediately |
| Bulk Policy Management | View 50+ policies | Filtering works smoothly, no performance lag |
| Mobile Policy Creation | Create policy on mobile device | Dialog fits screen, touch-friendly |
| Policy Audit Trail | Review policy change history | All modifications documented with timestamps |

#### Edge Cases

| Edge Case | Scenario | Expected Behavior |
|-----------|----------|-------------------|
| Empty Policies List | No policies created | Display "Create your first policy..." message |
| Very Long Policy Name | 500+ character name | Text area scrolls, no UI breaking |
| Same Name Policies | Two policies with same name | System allows duplicates, but warns user |
| Confidence = 1.0 | Set to "Certainty Required" | Only perfect confidence triggers action |
| Confidence = 0.0 | Set to "Accept All" | All detections trigger action |
| Concurrent Policy Edits | User A and B edit simultaneously | Last write wins, or conflict warning |
| Policy Namespace Conflicts | Related policy IDs don't exist | Graceful handling, warning message |

---

### 2.10 Security & Compliance Considerations

#### Authentication & Authorization
- Only compliance officers and designated roles can create/modify policies
- Audit trail tracks who created and modified each policy
- MFA support prevents unauthorized autonomous actions

#### Policy Safeguards
- Confidence scoring prevents false positives in critical scenarios
- Dual control requires 2 authorizations for sensitive policies
- Sandbox testing prevents unintended production impacts
- All policy changes versioned and logged

#### Compliance Features
- Audit logging of all policy executions
- Retention of policy history for regulatory compliance
- Related policy tracking for complex compliance requirements
- Category system for organizing compliance types

---

## 3. CUSTOM FORM BUILDER

### Feature Overview
The Custom Form Builder enables organizations to create dynamic, reusable forms for inspections, OSHA reports, job safety analyses (JSAs), incident reports, and custom compliance documentation. It provides drag-and-drop field management, conditional logic, validation rules, and multi-category support.

**File Location:** `/home/user/Fleet/src/components/modules/CustomFormBuilder.tsx`

**Capabilities:**
- 9 field types (text, number, date, select, checkbox, textarea, signature, photo, file)
- Conditional field logic (show/hide based on values)
- Field validation rules (min/max, patterns)
- Drag-and-drop reordering (planned)
- 5 form categories with version control

---

### 3.1 Target Users

| Role | Responsibilities |
|------|------------------|
| **Forms Administrator** | Create and manage custom forms; publish for use |
| **Compliance Manager** | Ensure forms meet regulatory requirements |
| **Department Managers** | Request custom forms for team needs |
| **Safety Coordinator** | Create job safety analysis forms |
| **Field Supervisors** | Use forms to collect field data |
| **Inspectors** | Complete inspection forms with photos/evidence |

---

### 3.2 User Stories

#### Forms Administrator's Perspective
- **As a Forms Administrator**, I want to create custom forms without coding so that **business users can define new forms quickly**
- **As a Forms Administrator**, I want to add various field types to forms so that **I can collect different data types (text, photos, dates, signatures, etc.)**
- **As a Forms Administrator**, I want to set field validation rules so that **data quality is maintained (e.g., phone numbers match pattern)**
- **As a Forms Administrator**, I want to publish forms for use so that **field teams can start collecting data**
- **As a Forms Administrator**, I want to track form versions so that **I can manage changes and rollbacks**
- **As a Forms Administrator**, I want to archive old forms so that **the form library stays current**

#### Compliance Manager's Perspective
- **As a Compliance Manager**, I want to verify forms meet OSHA requirements so that **submitted forms are compliant**
- **As a Compliance Manager**, I want to create required vs optional fields so that **critical data is never missing**
- **As a Compliance Manager**, I want to include signature fields so that **form submissions are legally documented**
- **As a Compliance Manager**, I want to create conditional fields so that **forms adapt to different incident types**

#### Field Supervisor's Perspective
- **As a Supervisor**, I want to use custom forms on tablet/phone so that **my team can complete forms in the field**
- **As a Supervisor**, I want forms to guide users with clear labels so that **data is entered consistently**
- **As a Supervisor**, I want to attach photos to forms so that **field conditions are documented visually**
- **As a Supervisor**, I want to save form drafts so that **users can complete forms over time**

#### Safety Coordinator's Perspective
- **As a Safety Coordinator**, I want to create JSA forms with hazard and control fields so that **we systematically identify workplace hazards**
- **As a Safety Coordinator**, I want to use job safety analysis forms as templates so that **safety analysis is consistent across jobs**
- **As a Safety Coordinator**, I want to print completed JSAs so that **crews have paper copies on-site**

---

### 3.3 Core Functionality & Features

#### 3.3.1 Form Lifecycle
```
Create Form
  ├── Enter Form Name
  ├── Select Category (OSHA, Inspection, JSA, Incident, Custom)
  ├── Add Description
  ├── Add Fields (Iterative)
  │   ├── Select Field Type
  │   ├── Set Field Label
  │   ├── Mark Required (Y/N)
  │   ├── Add Options (for dropdowns)
  │   ├── Set Validation Rules (optional)
  │   └── Save Field
  ├── Configure Field Order (drag-and-drop)
  ├── Set Conditional Logic (optional)
  └── Save as Draft

Review & Publish
  ├── Review Complete Form
  ├── Preview Form in User View
  ├── Test Field Validation
  ├── Publish (Status: Published)
  └── Make Available to Team

Use Form
  ├── Field Teams Complete Form
  ├── Submit Form Data
  └── Data Stored in System

Archive Form
  ├── Status: Published → Archived
  ├── Prevent New Uses
  └── Keep Historical Data Intact

Manage Versions
  ├── Track Version History
  ├── Allow Version Comparison
  ├── Enable Rollback if Needed
  └── Document Change Reasons
```

#### 3.3.2 Supported Field Types

| Field Type | Input Method | Use Case | Validation |
|-----------|--------------|----------|-----------|
| **Text** | Single-line input | Names, IDs, locations | Pattern matching, length |
| **Number** | Numeric input | Quantities, mileage, costs | Min/max range |
| **Date** | Date picker | Incident date, service date | Past/future constraints |
| **Select** | Dropdown | Classification, category | Limited options |
| **Checkbox** | Toggle | Yes/No questions, agreements | Binary selection |
| **Textarea** | Multi-line text | Descriptions, notes, analysis | Length limits |
| **Signature** | Digital signature | Legal document signing | Required for compliance |
| **Photo** | Camera/upload | Evidence, visual documentation | File type/size limits |
| **File** | File upload | Attachments, documents | File type whitelist |

#### 3.3.3 Form Categories
```
1. OSHA Forms
   └── OSHA 300, 300A, 301, and custom safety forms

2. Inspection Forms
   └── Vehicle inspections, equipment checks, facility inspections

3. Job Safety Analysis (JSA)
   └── Hazard identification, control measures, worker authorization

4. Incident Reports
   └── Incident description, injury details, investigation

5. Custom Forms
   └── Organization-specific forms for any purpose
```

#### 3.3.4 Dashboard Statistics
- **Total Forms**: Count of all forms in system
- **Published**: Forms actively in use
- **Drafts**: Forms in development
- **Archived**: Legacy forms no longer in use

#### 3.3.5 Form Management Operations
```
Create Form
  └── New Form → Draft Status

Edit Form (Draft only)
  └── Modify name, description, fields

Publish Form
  └── Draft → Published (Available for use)

Preview Form
  └── See how form appears to users

Edit Form (Published)
  └── Creates new version
  └── Old version archived
  └── Users notified of changes

Archive Form
  └── Published → Archived
  └── No longer available for new use
  └── Historical data preserved

Duplicate Form
  └── Copy existing form as template
  └── Creates new form from copy
```

---

### 3.4 Data Structure

#### CustomForm Interface
```typescript
{
  id: string                              // Unique form ID (F001, F002, etc.)
  name: string                            // Form name (e.g., "Daily Vehicle Inspection")
  description: string                     // Form description
  category: "osha" | "inspection" | "jsa" | "incident" | "custom"
  version: string                         // Semantic version (1.0, 1.2, etc.)
  status: "draft" | "published" | "archived"
  
  // Field Definitions
  fields: FormField[]                     // Array of form fields
  
  // Metadata
  createdBy: string                       // Creator user ID
  createdAt: string                       // Creation timestamp
  updatedAt: string                       // Last update timestamp
}

interface FormField {
  id: string                              // Unique field ID (field_{timestamp})
  type: FieldType                         // Type of field (text, number, date, etc.)
  label: string                           // Display label for field
  required: boolean                       // Is field required?
  options?: string[]                      // Options for select dropdown
  
  // Validation Rules
  validation?: {
    min?: number                          // Minimum value or length
    max?: number                          // Maximum value or length
    pattern?: string                      // Regex pattern for validation
  }
  
  // Conditional Logic
  conditionalOn?: {
    fieldId: string                       // Which field controls visibility
    value: any                            // What value shows this field
  }
}

type FieldType = "text" | "number" | "date" | "select" | "checkbox" | "textarea" | "signature" | "photo" | "file"
```

#### FormSubmission Interface (Inferred)
```typescript
{
  id: string                              // Submission ID
  formId: string                          // Which form was submitted
  submittedBy: string                     // User who submitted
  submittedAt: string                     // Submission timestamp
  data: {
    [fieldId: string]: any               // Field ID → submitted value
  }
  status: "draft" | "submitted" | "completed"
}
```

---

### 3.5 Data Inputs & Outputs

#### Inputs
| Source | Data | Purpose |
|--------|------|---------|
| User Input | Form name, description, category | Define form metadata |
| Form Builder | Field definitions, types, labels | Build form structure |
| Validation Rules | Min/max values, regex patterns | Enforce data quality |
| Conditional Logic | Field dependencies, visibility rules | Create adaptive forms |
| Field Submissions | Text, numbers, dates, files, photos | Collect form data |

#### Outputs
| Output Type | Format | Usage |
|------------|--------|-------|
| Form Template | JSON | Store and reuse form definition |
| Published Form | HTML/React | Display to end users |
| Form Submission | JSON | Store submitted data |
| Form Statistics | JSON | Show dashboard metrics |
| Completed Form PDF | PDF | Print or email |

---

### 3.6 Integration Points

#### Internal Integrations
```
CustomFormBuilder Module
  ├── Form Creation Dialog
  │   ├── Name/description inputs
  │   ├── Category dropdown
  │   └── Version tracking
  ├── Field Editor
  │   ├── Field type selector
  │   ├── Label input
  │   ├── Required checkbox
  │   ├── Options input (for select)
  │   └── Validation rules configuration
  ├── Form Preview
  │   ├── Display form as it appears to users
  │   └── Test field interactions
  ├── Forms Listing
  │   ├── Tabs by category (All, OSHA, Inspection, JSA)
  │   ├── Status badges (draft, published, archived)
  │   └── Action buttons (Edit, Preview, Publish, Archive)
  └── State Management
      ├── useState for forms array
      ├── useState for editing state
      ├── useState for form metadata
      └── useState for field list
```

#### External Integrations (Potential)
- **Form Data Storage**: Database for form definitions and submissions
- **Photo Storage**: Cloud storage for form attachments
- **PDF Generation**: Convert completed forms to PDF
- **Electronic Signature**: Digital signature validation
- **Approval Workflow**: Route forms for approval
- **Notification Engine**: Notify on form submission

---

### 3.7 Key Components & Purposes

#### Component: Form Statistics Cards
```
Function: Display form metrics dashboard
Cards:
  1. Total Forms: Count all forms (all statuses)
  2. Published: Active forms available for use
  3. Drafts: Forms in development
  4. Archived: Legacy forms no longer in use
Visual: 4-card grid with icons
```

#### Component: Form Creation/Edit Card
```
Function: Main interface for creating and editing forms
Sections:
  1. Form Metadata
     - Form Name (required)
     - Category dropdown
     - Description
  2. Fields List
     - Display each field with type, label, required flag
     - Edit/delete buttons per field
     - Drag handles for reordering (future)
  3. Add Field Section
     - Button to add new field
     - Shows "No fields added yet" message when empty
  4. Field Editor
     - Type selector (dropdown)
     - Label input
     - Options input (if select type)
     - Required checkbox
     - Remove field button
  5. Form Actions
     - Cancel button
     - Save Form button
Header: "Create New Form" or "Edit: {formName}"
```

#### Component: Form Gallery
```
Function: Display all forms by category
Layout: Card grid (3 columns on desktop)
Card Contents:
  - Form Name
  - Description
  - Status badge (published/draft/archived)
  - Field Count
  - Version Number
  - Category badge
  - Action buttons: Edit, Preview
```

#### Component: Form Preview
```
Function: Show how form appears to end users
Display:
  - Rendered form with all fields
  - Fields in correct order
  - Required field indicators
  - Field validation (test with invalid input)
  - Mobile-responsive layout
```

---

### 3.8 Workflow Diagrams

#### Form Creation & Publication Workflow
```
┌──────────────────────────────────────────────────┐
│ FORMS ADMINISTRATOR STARTS                       │
│ Needs to create new inspection form              │
└─────────────────────┬──────────────────────────────┘
                      ↓
┌──────────────────────────────────────────────────┐
│ CLICK "CREATE NEW FORM"                          │
│ Opens form creation card                         │
└─────────────────────┬──────────────────────────────┘
                      ↓
┌──────────────────────────────────────────────────┐
│ ENTER FORM METADATA                              │
│ • Name: "Daily Vehicle Inspection"              │
│ • Category: "Inspection"                         │
│ • Description: "Pre-shift vehicle checklist"     │
│ Status: Draft                                    │
└─────────────────────┬──────────────────────────────┘
                      ↓
┌──────────────────────────────────────────────────┐
│ ADD FORM FIELDS (Iterative)                      │
│                                                  │
│ Field 1:                                         │
│ • Type: Text                                     │
│ • Label: "Vehicle ID"                            │
│ • Required: Yes                                  │
│ ↓ Add Field                                      │
│                                                  │
│ Field 2:                                         │
│ • Type: Checkbox                                 │
│ • Label: "Tire Condition OK"                     │
│ • Required: Yes                                  │
│ ↓ Add Field                                      │
│                                                  │
│ Field 3:                                         │
│ • Type: Signature                                │
│ • Label: "Driver Signature"                      │
│ • Required: Yes                                  │
│ ↓ Add Field                                      │
│                                                  │
│ ... More fields ...                              │
└─────────────────────┬──────────────────────────────┘
                      ↓
┌──────────────────────────────────────────────────┐
│ PREVIEW FORM                                     │
│ • Click "Preview" button                         │
│ • See form as users will see it                  │
│ • Test field interactions                        │
│ • Verify required field markers                  │
│ • Check responsive layout                        │
└─────────────────────┬──────────────────────────────┘
                      ↓
        ┌─────────────┴──────────────┐
        ↓                            ↓
   ┌────────────┐          ┌─────────────────┐
   │ NOT READY  │          │ READY TO PUBLISH│
   │ SAVE DRAFT │          │ PUBLISH FORM    │
   └───┬────────┘          └────────┬────────┘
       │                           ↓
       │            ┌──────────────────────────┐
       │            │ STATUS: Draft → Published│
       │            │ Form now available      │
       │            │ Version: 1.0            │
       │            └──────────────────────────┘
       │                           ↓
       │            ┌──────────────────────────┐
       │            │ NOTIFY TEAM              │
       │            │ • Email notification     │
       │            │ • Dashboard update       │
       │            │ • Form in use list       │
       │            └──────────────────────────┘
       │
       └─→ ┌──────────────────────┐
           │ MAKE CHANGES         │
           │ • Edit fields        │
           │ • Add/remove fields  │
           │ • Save draft         │
           │ Try to preview again │
           └──────────────────────┘
```

#### Form Submission & Data Collection Workflow
```
┌────────────────────────────────────────────────────┐
│ FIELD SUPERVISOR RECEIVES INSPECTION TASK          │
│ Daily Vehicle Inspection form assigned             │
└────────────────────┬─────────────────────────────────┘
                     ↓
┌────────────────────────────────────────────────────┐
│ OPENS FORM ON TABLET/PHONE                         │
│ Form displays in mobile-friendly layout            │
│ Required field indicators show                     │
└────────────────────┬─────────────────────────────────┘
                     ↓
┌────────────────────────────────────────────────────┐
│ FILLS OUT FORM FIELDS                              │
│                                                    │
│ ☑ Vehicle ID: "UNIT-021"                           │
│ ☑ Tire Condition OK: [checked]                     │
│ ☑ Lights Functional: [checked]                     │
│ ☑ Photos: [Camera] → Take 3 photos                 │
│ ☑ Signature: [Signature Pad] → Draw signature      │
│ ☐ Additional Notes: [Optional]                     │
│                                                    │
│ Form validates as user fills                       │
└────────────────────┬─────────────────────────────────┘
                     ↓
┌────────────────────────────────────────────────────┐
│ SUBMIT FORM                                        │
│ • All required fields completed                    │
│ • Validation passes                                │
│ • Click "Submit" button                            │
└────────────────────┬─────────────────────────────────┘
                     ↓
┌────────────────────────────────────────────────────┐
│ FORM DATA STORED                                   │
│ • Data written to database                         │
│ • Photos uploaded to cloud storage                 │
│ • Submission timestamp recorded                    │
│ • Supervisor notified of success                   │
│ Status: "Submitted"                                │
└────────────────────────────────────────────────────┘
```

---

### 3.9 Suggested Test Scenarios

#### Unit Test Scenarios

| Test Case | Input | Expected Result |
|-----------|-------|-----------------|
| Create Form with Name | Enter "Daily Inspection" | Form saved with name in state |
| Create Form Missing Name | Leave name blank, try save | Error toast shown, form not saved |
| Add Text Field | Type label "Vehicle ID", save | Field added to fields array |
| Add Number Field | Select "Number" type, set label | Field type correctly stored |
| Add Dropdown with Options | Options: "Yes, No, Maybe" | Options split and stored in array |
| Mark Field Required | Check "Required" checkbox | required = true in field object |
| Remove Field | Click X button on field | Field removed from fields array |
| Edit Field (Draft) | Change field label | Change persisted in field object |
| Publish Form | Click "Publish" button | Status changes to "published", version set |
| Archive Published Form | Click archive on published form | Status changes to "archived" |
| Duplicate Form | Copy existing form | New form created with same fields |

#### Integration Test Scenarios

| Test Case | Workflow | Verification |
|-----------|----------|---------------|
| Create & Publish Form | Add fields → Preview → Publish | Form shows in "Published" tab |
| Form Category Filter | Create forms in different categories | Each appears in correct category tab |
| Version Management | Create form v1.0 → Edit → v1.1 | Version increments, history maintained |
| Field Order Preservation | Add fields 1-5 in order | Fields display in same order |
| Conditional Field Logic | Set field to show if another = "Yes" | Conditional field visibility works |
| Form Template Reuse | Duplicate published form | New form inherits all fields |
| Statistics Update | Create 5 forms → 3 published | Dashboard shows correct counts |

#### User Experience Test Scenarios

| Test Case | Scenario | Success Criteria |
|-----------|----------|------------------|
| First-Time User | Create first form | Clear guidance, intuitive flow |
| Complex Form | Create form with 20+ fields | UI responsive, no performance lag |
| Mobile Form Creation | Create form on iPad | Touch-friendly, no scrolling issues |
| Form Preview | Preview form before publishing | Looks like final product |
| Field Validation Preview | Test required fields, min/max | Validation works in preview |
| Bulk Field Addition | Add 10 fields rapidly | No lag, all fields appear |
| Form Editing | Publish form, then edit | Clear indication of changes |

#### Edge Cases

| Edge Case | Scenario | Expected Behavior |
|-----------|----------|-------------------|
| Empty Form | Try to publish form with no fields | Warning: "Add fields before publishing" |
| Very Long Field Label | 500+ character label | Text wraps or truncates, no UI breaking |
| Special Characters | Include quotes, ampersands | Characters properly escaped |
| Duplicate Field Names | Two fields with same label | System allows (might warn user) |
| Field Name Conflicts | Field ID collision | System generates unique IDs |
| Simultaneous Edits | Two admins edit form at same time | Last write wins, or conflict warning |
| No Published Forms | View "Published" tab when none exist | Display: "No published forms available" |

---

### 3.10 Security & Compliance Considerations

#### Data Protection
- Form submissions contain field-level data that may include sensitive information
- All form definitions should be version-controlled
- Audit trail for form changes
- Access control for form creation/publishing

#### Regulatory Compliance
- OSHA form category ensures compliance templates available
- Signature fields support legal documentation requirements
- Version tracking supports compliance audits
- Photo attachments enable evidence documentation

#### Field Validation
- Required field enforcement prevents incomplete submissions
- Pattern validation ensures data quality (phone, email, etc.)
- Min/max validation prevents data entry errors
- Type-specific validation (date, number ranges)

---

## 4. DATA WORKBENCH

### Feature Overview
The Data Workbench is a comprehensive fleet data management and analytics platform that provides real-time visibility into vehicle fleet operations, maintenance scheduling, fuel consumption, and operational costs. It features advanced search capabilities, multi-tab analytics, and detailed performance metrics.

**File Location:** `/home/user/Fleet/src/components/modules/DataWorkbench.tsx`

**Scope:**
- 5 main tabs: Fleet Overview, Maintenance, Fuel Records, Analytics
- Advanced search with 14+ filter criteria
- Real-time metrics and KPIs
- Interactive data visualization (placeholder charts)
- Fleet performance analytics

---

### 4.1 Target Users

| Role | Responsibilities |
|------|------------------|
| **Fleet Manager** | Monitor overall fleet health, KPIs, compliance |
| **Maintenance Manager** | Schedule/track maintenance, manage costs |
| **Operations Manager** | Optimize routes, manage fuel, control costs |
| **Finance Manager** | Analyze fleet costs, generate reports |
| **Fleet Analyst** | Deep-dive analysis, trend identification |
| **Dispatcher** | View vehicle status, assign tasks |
| **Executive** | High-level dashboards, cost reporting |

---

### 4.2 User Stories

#### Fleet Manager's Perspective
- **As a Fleet Manager**, I want to see real-time metrics on active vehicles, fuel levels, and maintenance status so that **I can quickly assess fleet health**
- **As a Fleet Manager**, I want to search vehicles by multiple criteria so that **I can find specific vehicles when needed**
- **As a Fleet Manager**, I want to view vehicle status (Active, In Service, Idle) with visual indicators so that **I can identify bottlenecks**
- **As a Fleet Manager**, I want to see alerts on vehicles needing attention so that **I can proactively manage issues**

#### Maintenance Manager's Perspective
- **As a Maintenance Manager**, I want to see overdue maintenance tasks flagged so that **I can prioritize urgent servicing**
- **As a Maintenance Manager**, I want to schedule maintenance services directly from the workbench so that **I can manage the entire maintenance lifecycle**
- **As a Maintenance Manager**, I want to track maintenance costs by service type so that **I can monitor budget**
- **As a Maintenance Manager**, I want to view next service dates so that **I can plan capacity and resources**

#### Operations Manager's Perspective
- **As an Operations Manager**, I want to analyze fuel consumption patterns so that **I can identify inefficiency and coach drivers**
- **As an Operations Manager**, I want to track cost per mile for each vehicle so that **I can optimize fleet composition**
- **As an Operations Manager**, I want to view fuel metrics across time ranges so that **I can spot trends**
- **As an Operations Manager**, I want to identify the most fuel-efficient vehicles so that **I can replicate best practices**

#### Finance Manager's Perspective
- **As a Finance Manager**, I want detailed cost breakdowns (fuel vs maintenance) so that **I can allocate budgets accurately**
- **As a Finance Manager**, I want to export fleet data for financial reporting so that **I can analyze cost trends**
- **As a Finance Manager**, I want to see cost per vehicle to identify high-cost outliers so that **I can manage fleet spending**

#### Fleet Analyst's Perspective
- **As a Fleet Analyst**, I want to perform advanced searches with multiple filter criteria so that **I can find specific data patterns**
- **As a Fleet Analyst**, I want to sort tables by any column to identify trends so that **I can provide insights to management**
- **As a Fleet Analyst**, I want to view historical data and trends so that **I can make data-driven recommendations**

---

### 4.3 Core Functionality & Features

#### 4.3.1 Tab-Based Navigation
```
Data Workbench Tabs:
│
├── Fleet Overview
│   └── Quick view of all vehicles, status, mileage, fuel, department, region
│   └── Search and filter vehicles
│   └── Dashboard metrics (total, active, in-service, fuel, alerts)
│   └── Pagination (show 15 at a time)
│
├── Maintenance
│   └── All maintenance records with filtering (all, upcoming, overdue, completed)
│   └── Metrics: Total cost this month, overdue count, upcoming count
│   └── Sortable columns (vehicle, service type, date, cost, status)
│   └── Schedule new service button
│   └── Pagination (show 20 at a time)
│
├── Fuel Records
│   └── Fuel transaction history with time range filter (7/30/60/90 days)
│   └── Vehicle filter (all or specific vehicle)
│   └── Metrics: Total cost, average MPG, total gallons, cost per mile
│   └── Fuel consumption trend chart (placeholder)
│   └── Sortable columns (vehicle, date, gallons, cost, odometer, MPG)
│   └── Location tracking
│
└── Analytics
    └── Fleet utilization rate
    └── Average miles per day
    └── Most efficient vehicle
    └── Cost analysis (fuel vs maintenance breakdown)
    └── Vehicle utilization chart (placeholder)
    └── Top performers table (most efficient, most reliable, lowest cost)
    └── Cost trends chart (placeholder)
    └── Time range selector (7/30/60/90 days)
```

#### 4.3.2 Fleet Overview Features

##### Search & Filter
```
Search Bar
  └── Full-text search on:
      ├── Vehicle number
      ├── Make
      └── Model

Advanced Search Dialog
  └── Vehicle Identification Section
      ├── Vehicle Number
      ├── VIN
      ├── License Plate
      └── Status (Active, Service, Inactive)
  └── Vehicle Specifications Section
      ├── Make
      ├── Model
      ├── Year From
      └── Year To
  └── Assignment & Location Section
      ├── Department
      ├── Region
      └── Assigned Driver
  └── Performance Metrics Section
      ├── Fuel Level Min %
      ├── Fuel Level Max %
      ├── Mileage Min
      └── Mileage Max

Active Filters Display
  └── Show applied filters as removable badges
  └── Clear All button
```

##### Vehicle Table Columns
- Vehicle (number + year/make/model)
- Status (badge: Active, In Service, Idle)
- Mileage (formatted with commas)
- Fuel (visual bar + percentage)
- Driver (assigned driver name)
- Department (badge)
- Region (text)
- Alerts (count or "None")

##### Dashboard Metrics
- Total Vehicles (info blue)
- Active Vehicles (success green)
- In Maintenance (warning orange)
- Average Fuel Level (% of fleet)
- Active Alerts (count)

#### 4.3.3 Maintenance Tab Features

##### Filter Controls
```
Status Filter Buttons:
├── All (show all records)
├── Upcoming (scheduled services)
├── Overdue (past due)
└── Completed (finished services)

Sort Columns (Clickable Headers):
├── Vehicle (vehicle # ascending)
├── Service Type
├── Date
├── Cost
└── Status

Schedule Service Button
└── Opens dialog to schedule new service
    ├── Select vehicle
    ├── Select service type
    ├── Choose scheduled date
    └── Add notes
```

##### Metrics Cards
- Maintenance Cost (this month): Dollar amount
- Overdue Services: Count with warning color
- Upcoming Services (30 days): Count

##### Maintenance Table
- Vehicle (# and full name)
- Service Type (Oil Change, Tire Rotation, etc.)
- Date (formatted date)
- Cost ($ formatted)
- Status (badge: completed/upcoming/overdue)
- Next Due (date)

#### 4.3.4 Fuel Tab Features

##### Time Range Filter
- 7 days, 30 days, 60 days, 90 days
- Dynamically recalculates all metrics

##### Vehicle Filter
- All Vehicles (default)
- Individual vehicle selection from dropdown

##### Metrics Cards
- Total Fuel Cost ($ for selected range)
- Average MPG (fleet average)
- Total Gallons (consumed in range)
- Cost per Mile ($)

##### Fuel Consumption Chart
- Placeholder for line chart
- X-axis: Time (days)
- Y-axis: Consumption (gallons or $)
- Legend: By vehicle or total

##### Fuel Table Columns
- Vehicle (# and full name)
- Date (formatted)
- Gallons (with decimals)
- Cost ($ formatted)
- Odometer (mileage, formatted)
- MPG (miles per gallon badge)
- Location (fuel station name)

#### 4.3.5 Analytics Tab Features

##### Key Performance Indicators
```
Row 1: Fleet Health
├── Utilization Rate (%)
├── Avg Miles per Day
└── Most Efficient Vehicle

Row 2: Cost Analysis (selectable time range)
├── Total Operating Cost
├── Cost per Vehicle
└── Cost Breakdown
    ├── Fuel ($)
    ├── Maintenance ($)
    └── Visual stacked bar

Row 3: Vehicle Utilization
└── Chart placeholder (bar chart by department)

Row 4: Top Performers Table
├── Most Efficient Vehicle (MPG)
├── Most Reliable Vehicle (Uptime %)
└── Lowest Cost Vehicle (Operating Cost)
```

##### Cost Analysis Details
```
Cost Breakdown:
├── Fuel Costs
│   └── Bar showing fuel percentage
├── Maintenance Costs
│   └── Bar showing maintenance percentage
└── Total Operating Cost

Cost by Vehicle
├── Sort by total cost
├── Identify outliers
└── Compare across fleet
```

#### 4.3.6 Import/Export Operations
```
Export
└── Button: "Export"
    └── Downloads fleet data as JSON
    └── Filename: "fleet-data-{date}.json"
    └── Contains all vehicles and metrics

Import
└── Button: "Import"
    └── File picker (CSV, XLSX, JSON)
    └── Parses and validates data
    └── Imports into fleet database
    └── Shows success message

Refresh
└── Button: "Refresh"
    └── Reloads data from server
    └── Recalculates all metrics
    └── Shows loading state
```

---

### 4.4 Data Structure

#### Vehicle Interface (from types.ts)
```typescript
{
  id: string                              // Unique vehicle ID
  tenantId: string                        // Organization tenant
  number: string                          // Vehicle number (UNIT-001)
  type: VehicleType                       // Car, truck, van, etc.
  make: string                            // Manufacturer
  model: string                           // Model name
  year: number                            // Year manufactured
  vin: string                             // Vehicle ID number
  licensePlate: string                    // License plate
  status: VehicleStatus                   // active | idle | charging | service | emergency | offline
  location: {
    lat: number                           // Current latitude
    lng: number                           // Current longitude
    address: string                       // Current address
  }
  region: string                          // Geographic region
  department: string                      // Department assignment
  fuelLevel: number                       // Fuel percentage (0-100)
  fuelType: FuelType                      // gasoline | diesel | electric | hybrid
  mileage: number                         // Current mileage
  hoursUsed?: number                      // Equipment hours used
  assignedDriver?: string                 // Driver name
  ownership: "owned" | "leased" | "rented"
  lastService: string                     // Last service date
  nextService: string                     // Next service date
  alerts: string[]                        // Alert messages
  customFields?: Record<string, any>      // Custom tenant data
  tags?: string[]                         // Searchable tags
}
```

#### MaintenanceRecord Interface
```typescript
{
  id: string                              // Record ID
  vehicleNumber: string                   // Vehicle identifier
  vehicleName: string                     // Full vehicle description
  serviceType: string                     // Oil Change, Tire Rotation, etc.
  date: string                            // Service date (ISO format)
  cost: number                            // Service cost ($)
  status: "upcoming" | "overdue" | "completed"
  nextDue: string | null                  // Next service date
  notes?: string                          // Additional notes
}
```

#### FuelRecord Interface
```typescript
{
  id: string                              // Record ID
  vehicleNumber: string                   // Vehicle identifier
  vehicleName: string                     // Full vehicle description
  date: string                            // Fuel date (ISO format)
  gallons: number                         // Gallons purchased
  cost: number                            // Cost ($)
  odometer: number                        // Odometer reading
  mpg: number                             // Miles per gallon calculated
  location?: string                       // Fuel station name
}
```

#### Dashboard Metrics
```typescript
{
  total: number                           // Total vehicles
  active: number                          // Active vehicles
  maintenance: number                     // In maintenance
  avgFuel: number                         // Average fuel %
  alerts: number                          // Alert count
}

// Maintenance Metrics
{
  totalCost: number                       // Cost this month ($)
  overdue: number                         // Overdue services count
  upcoming: number                        // Upcoming (30 days) count
}

// Fuel Metrics
{
  totalCost: string                       // Total fuel cost
  avgMPG: string                          // Average MPG
  totalGallons: string                    // Total gallons
  costPerMile: string                     // Cost per mile
}

// Analytics Metrics
{
  activeVehicles: number                  // Count
  totalVehicles: number                   // Count
  avgMilesPerDay: string                  // Miles average
  totalCost: string                       // Total operating cost
  costPerVehicle: string                  // Cost per vehicle
  fuelCost: string                        // Fuel cost only
  maintenanceCost: string                 // Maintenance cost only
  mostEfficient: {
    vehicle: string                       // Vehicle name
    mpg: number                           // MPG average
  }
}
```

---

### 4.5 Data Inputs & Outputs

#### Inputs
| Source | Data | Purpose |
|--------|------|---------|
| API | Vehicle data, telemetry, location | Populate fleet overview |
| Database | Maintenance records | Maintenance tracking |
| Database | Fuel transactions | Fuel analysis |
| User | Search criteria | Filter vehicles |
| User | Date range selection | Filter by time |
| User | Sort column selection | Reorder data |
| File Upload | CSV/JSON data | Import fleet data |

#### Outputs
| Output Type | Format | Usage |
|------------|--------|-------|
| Dashboard Display | HTML/React components | User interface |
| Exported Data | JSON file | Data portability, backups |
| Metrics Display | JSON formatted | KPI display |
| Table Data | Filtered/sorted arrays | Table rendering |
| Charts Data | Chart.js compatible | Visualization |

---

### 4.6 Integration Points

#### Internal Integrations
```
DataWorkbench Module
  ├── Tabs Component
  │   ├── TabsList (navigation)
  │   ├── TabsTrigger (tab buttons)
  │   └── TabsContent (tab panels)
  ├── Fleet Overview Tab
  │   ├── Search bar component
  │   ├── Advanced search dialog
  │   ├── Filter controls
  │   ├── Active filters display
  │   ├── Vehicle data table
  │   └── Dashboard metrics cards
  ├── Maintenance Tab
  │   ├── Status filter buttons
  │   ├── Sort column headers
  │   ├── Schedule service dialog
  │   ├── Metrics cards
  │   └── Maintenance table
  ├── Fuel Tab
  │   ├── Time range selector
  │   ├── Vehicle filter
  │   ├── Metrics cards
  │   ├── Chart placeholder
  │   └── Fuel table
  ├── Analytics Tab
  │   ├── Time range selector
  │   ├── Metrics cards
  │   ├── Chart placeholders
  │   └── Top performers table
  └── Data Import/Export
      ├── Export button (JSON download)
      ├── Import button (file upload)
      └── Refresh button (API refresh)
```

#### External Integrations (Potential)
- **Telemetry API**: Real-time vehicle location, speed, fuel level
- **Maintenance Service**: Schedule/track maintenance services
- **Fuel Management System**: Fuel purchase history and pricing
- **GPS Tracking**: Real-time vehicle location
- **Chart Library**: Interactive data visualizations (Chart.js, D3.js)
- **PDF Export**: Generate fleet reports in PDF format
- **Email Service**: Send exported data via email

---

### 4.7 Key Components & Purposes

#### Component: MetricCard
```
Function: Display single KPI with title, value, subtitle, icon
Props:
  - title: Metric name
  - value: Metric value (number, currency, %)
  - subtitle: Additional context
  - icon: Icon component to display
  - status: Color status (info, success, warning, error)
Usage: Dashboard metrics throughout all tabs
Styling: Card with left-side color bar
```

#### Component: Fleet Overview Tab
```
Function: Main tab showing all vehicles at a glance
Features:
  - Metric cards (Total, Active, In Service, Fuel, Alerts)
  - Search box (full-text search)
  - Advanced Search button (dialog trigger)
  - Filter display (active filters with remove buttons)
  - Vehicle data table (15 rows + pagination)
  - Real-time status updates
Sorting: Click column headers (future)
```

#### Component: Maintenance Tab
```
Function: Track and schedule vehicle maintenance
Features:
  - Metric cards (Cost, Overdue, Upcoming)
  - Status filter buttons (All, Upcoming, Overdue, Completed)
  - Schedule Service button (dialog trigger)
  - Maintenance table (sortable by vehicle, date, cost, status)
  - Pagination (20 rows)
Sorting: Clickable column headers with sort indicators
```

#### Component: Fuel Tab
```
Function: Analyze fuel consumption and costs
Features:
  - Metric cards (Total Cost, Avg MPG, Total Gallons, Cost/Mile)
  - Time range selector (7/30/60/90 days)
  - Vehicle filter (all vehicles or specific)
  - Fuel consumption chart (placeholder)
  - Fuel table (sortable columns)
  - Pagination (20 rows)
```

#### Component: Analytics Tab
```
Function: Deep-dive fleet performance analysis
Features:
  - Time range selector (7/30/60/90 days)
  - Utilization metrics (3 cards)
  - Cost analysis card (breakdown of fuel vs maintenance)
  - Vehicle utilization chart (placeholder)
  - Top performers table (efficiency, reliability, cost)
  - Cost trends chart (placeholder)
Visual: 2-3 column grid layout
```

#### Component: Advanced Search Dialog
```
Function: Multi-criteria vehicle search
Sections:
  1. Vehicle Identification
  2. Vehicle Specifications
  3. Assignment & Location
  4. Performance Metrics
Fields: 14+ search criteria
Actions: Search button, Cancel button
Results: Filtered vehicle list, applied filter badges
```

#### Component: Sort Icon
```
Function: Display sort direction indicator
Display: Shows up/down arrow based on sort direction
Appears: Only on sorted column header
Updates: When user clicks to change sort direction
```

---

### 4.8 Workflow Diagrams

#### Fleet Overview Search & Filter Workflow
```
┌────────────────────────────────────────────────────┐
│ FLEET MANAGER OPENS DATA WORKBENCH                 │
│ Fleet Overview tab active                          │
│ Shows all 500 vehicles by default                  │
└─────────────────┬──────────────────────────────────┘
                  ↓
         ┌────────┴─────────┐
         ↓                  ↓
    ┌─────────┐      ┌─────────────────┐
    │ SEARCH  │      │ ADVANCED SEARCH │
    │ (Quick) │      │ (Detailed)      │
    └────┬────┘      └────────┬────────┘
         ↓                    ↓
    ┌─────────────┐   ┌─────────────────┐
    │ Type:       │   │ Vehicle ID:     │
    │ "UNIT-02"   │   │ "UNIT-02"       │
    │ Auto-filters│   │ • Make: Ford    │
    │ on number   │   │ • Year: 2020    │
    │ ↓ Results   │   │ • Status: Active│
    │ 8 vehicles  │   │ • Department:   │
    │ starting    │   │   Operations    │
    │ with        │   │ • Region: North │
    │ UNIT-02     │   │ ↓ Search        │
    └─────────────┘   │ 2 vehicles      │
                      │ matching all    │
                      │ criteria        │
                      └─────────────────┘
         ↓
    ┌─────────────────────────────────────┐
    │ DISPLAY RESULTS                     │
    │ • Results count: "2 vehicles"       │
    │ • Apply filters as badges           │
    │ • Each filter removable (X button)  │
    │ • "Clear All" button available      │
    │ • Table updates with matching data  │
    └─────────────────────────────────────┘
         ↓
    ┌─────────────────────────────────────┐
    │ USER REFINES SEARCH                 │
    │ • Remove filter (click X)           │
    │ • Add another filter                │
    │ • Clear all and start over          │
    │ Results update automatically        │
    └─────────────────────────────────────┘
```

#### Maintenance Workflow
```
┌────────────────────────────────────────────────────┐
│ MAINTENANCE MANAGER OPENS MAINTENANCE TAB          │
│ Sees 3 metric cards:                               │
│ • Cost: $5,200 (this month)                        │
│ • Overdue: 3 services                              │
│ • Upcoming: 12 services (30 days)                  │
└─────────────────┬──────────────────────────────────┘
                  ↓
         ┌────────┴────────┐
         ↓                 ↓
    ┌─────────┐      ┌──────────────┐
    │ FILTER  │      │ SCHEDULE NEW │
    │ STATUS  │      │ SERVICE      │
    └────┬────┘      └────────┬─────┘
         │                    │
         ├─ All              │
         ├─ Upcoming ←─┐    │
         ├─ Overdue  ←─┤    │
         └─ Completed←─┤   │
              ↓         │   │
         Shows 3 overdue│   │
         services first │   │
                        │   │
         ┌──────────────┘   │
         ↓                  ↓
    ┌────────────┐   ┌──────────────────┐
    │ TABLE VIEW │   │ SCHEDULE SERVICE │
    │ • UNIT-002 │   │ • Select Vehicle │
    │   Oil Chg  │   │ • Select Type    │
    │   Overdue  │   │ • Set Date       │
    │ • UNIT-015 │   │ • Add Notes      │
    │   Tires    │   │ → Save           │
    │   Overdue  │   │   Service queued │
    │ • UNIT-031 │   │   for scheduling │
    │   Brakes   │   └──────────────────┘
    │   Overdue  │
    └────────────┘
         ↓
    ┌────────────────────────────────────┐
    │ CLICK VEHICLE FOR DETAILS          │
    │ • See service history              │
    │ • Estimate costs                   │
    │ • View recommended vendors         │
    └────────────────────────────────────┘
```

#### Fuel Analysis Workflow
```
┌────────────────────────────────────────────────────┐
│ OPERATIONS MANAGER OPENS FUEL TAB                  │
│ Default: Last 30 days, all vehicles                │
└─────────────────┬──────────────────────────────────┘
                  ↓
┌────────────────────────────────────────────────────┐
│ VIEWS METRICS (for selected time range)            │
│ • Total Cost: $12,500                              │
│ • Avg MPG: 18.5                                    │
│ • Total Gallons: 675                               │
│ • Cost/Mile: $0.047                                │
└─────────────────┬──────────────────────────────────┘
                  ↓
         ┌────────┴──────────┐
         ↓                   ↓
    ┌─────────┐        ┌──────────┐
    │ CHANGE  │        │ FILTER   │
    │ TIME    │        │ VEHICLE  │
    │ RANGE   │        │          │
    └────┬────┘        └────┬─────┘
         │                  │
    7/30/60/90 days    Select vehicle
         ↓              UNIT-021
         │                  ↓
         └──────┬───────────┘
                ↓
    ┌────────────────────────────┐
    │ VIEW FILTERED DATA         │
    │ • Chart shows trend        │
    │ • Table shows transactions │
    │ • Sortable by any column   │
    └────────┬───────────────────┘
             ↓
    ┌────────────────────────────┐
    │ IDENTIFY PATTERNS          │
    │ • UNIT-021 avg: 17.2 MPG   │
    │ • Fleet avg: 18.5 MPG      │
    │ • Potential driver coaching│
    └────────────────────────────┘
```

#### Analytics Reporting Workflow
```
┌────────────────────────────────────────────────────┐
│ FINANCE MANAGER OPENS ANALYTICS TAB                │
│ Time range selector: Default 30 days               │
└─────────────────┬──────────────────────────────────┘
                  ↓
┌────────────────────────────────────────────────────┐
│ HIGH-LEVEL KPIs                                    │
│ • Utilization Rate: 87%                            │
│ • Avg Miles/Day: 156.2                             │
│ • Most Efficient: UNIT-005 (28.5 MPG)              │
└─────────────────┬──────────────────────────────────┘
                  ↓
┌────────────────────────────────────────────────────┐
│ COST ANALYSIS                                      │
│ • Total: $45,200                                   │
│ • Cost/Vehicle: $602.67                            │
│ • Breakdown:                                       │
│   ├─ Fuel: 65% ($29,380)                           │
│   └─ Maintenance: 35% ($15,820)                    │
│ Stacked bar shows proportion                       │
└─────────────────┬──────────────────────────────────┘
                  ↓
┌────────────────────────────────────────────────────┐
│ TOP PERFORMERS TABLE                               │
│ • Most Efficient: UNIT-005 (28.5 MPG)              │
│ • Most Reliable: UNIT-008 (99.2% uptime)           │
│ • Lowest Cost: UNIT-012 ($0.42/mile)               │
└─────────────────┬──────────────────────────────────┘
                  ↓
┌────────────────────────────────────────────────────┐
│ CHANGE TIME RANGE                                  │
│ • Select 90 days                                   │
│ • All metrics recalculate                          │
│ • Charts update with new data                      │
│ • Trends become visible (increasing/decreasing)    │
└─────────────────┬──────────────────────────────────┘
                  ↓
┌────────────────────────────────────────────────────┐
│ EXPORT DATA                                        │
│ • Click "Export" button                            │
│ • Downloads: fleet-data-2024-11-11.json            │
│ • Contains: All vehicles, metrics, analysis        │
│ • Share with stakeholders/executives               │
└────────────────────────────────────────────────────┘
```

---

### 4.9 Suggested Test Scenarios

#### Unit Test Scenarios

| Test Case | Input | Expected Result |
|-----------|-------|-----------------|
| Load Overview Tab | Data loads (500 vehicles) | First 15 shown, pagination indicated |
| Search by Number | Enter "UNIT-021" | Only vehicles matching displayed |
| Search by Make | Enter "Ford" | All Ford vehicles filtered |
| Advanced Search - VIN | Enter VIN | Vehicles matching VIN shown |
| Advanced Search - Fuel Range | Set 25%-50% | Only vehicles in range shown |
| Advanced Search - Mileage Range | 10000-50000 mi | Vehicles in range displayed |
| Combined Filters | 3+ criteria | All filters applied (AND logic) |
| Clear Single Filter | Click X on filter | That filter removed, results updated |
| Clear All Filters | Click "Clear All" | All filters cleared, full list shown |
| Sort Maintenance by Cost | Click cost header | Records sort ascending by cost |
| Change Sort Direction | Click again | Records reverse to descending |
| Fuel Time Range 7 days | Select "7 days" | Shows only last 7 days data |
| Fuel Time Range 90 days | Select "90 days" | Recalculates metrics for 90 days |
| Filter Maintenance - Overdue | Click "Overdue" | Only overdue services shown |
| Export Data | Click export | JSON file downloads |

#### Integration Test Scenarios

| Test Case | Workflow | Verification |
|-----------|----------|---------------|
| Search → Filter → Sort | Find vehicles → Apply filter → Sort by column | All operations work together |
| Time Range → Metrics Update | Change fuel range 30→90 days | All 4 metrics recalculate correctly |
| Vehicle Count Changes | Add new vehicle via form | Count updates in metrics |
| Maintenance Status Changes | Mark service completed | Overdue count decreases |
| Fuel Metrics Accumulation | Add new fuel record | Total cost and gallons update |
| Analytics Time Window | 7→30→60→90 days | Cost trends update at each change |
| Multiple Filters Combination | Vehicle ID + Make + Department | Results honor all criteria |

#### User Experience Test Scenarios

| Test Case | Scenario | Success Criteria |
|-----------|----------|------------------|
| First-Time Dashboard | User opens workbench | All metrics visible, intuitive |
| Large Fleet (500+ vehicles) | Load all vehicles | Pagination works smoothly |
| Mobile Tablet View | View on iPad landscape | Tables responsive, readable |
| Complex Advanced Search | 10+ filter criteria | Dialog organized, not overwhelming |
| Export Data | Download fleet data | File opens in Excel/JSON viewer |
| Real-time Updates | New data arrives | Metrics update without reload |
| Accessibility | Use keyboard only | All controls keyboard-navigable |

#### Edge Cases

| Edge Case | Scenario | Expected Behavior |
|-----------|----------|-------------------|
| Empty Fleet | No vehicles in system | Display "No vehicles found" message |
| No Maintenance Records | Vehicles have no maintenance | Show 0 for all metrics, empty table |
| No Fuel Records | Vehicles have no fuel history | Show 0 for all metrics, empty table |
| Single Vehicle | Only 1 vehicle in system | Show complete data, no pagination |
| Identical Vehicle Names | Two UNIT-001 entries | System generates unique IDs |
| Extreme Mileage Values | 999,999 miles | Format correctly, sort properly |
| Very High Fuel Costs | $10,000+ in one transaction | Display without truncation |
| All Vehicles in Service | 100% unavailable | Show in-service count = total |
| No Driver Assignments | All vehicles unassigned | Show "Unassigned" in driver column |
| Fuel > 100% (data error) | System receives bad data | Cap at 100%, log error |

---

### 4.10 Security & Compliance Considerations

#### Data Access Control
- Fleet data contains sensitive vehicle and driver information
- Users should only see vehicles/data relevant to their scope
- Export functionality should be audit-logged
- API calls should include proper authentication tokens

#### Data Privacy
- Driver names and vehicle locations are PII/sensitive
- Advanced search exposes detailed vehicle information
- Export data may contain confidential information
- Secure transport (HTTPS) required for all data

#### Compliance & Auditing
- Maintenance scheduling supports regulatory compliance
- Fuel tracking enables accurate cost reporting
- Data export enables audit trail documentation
- All user searches/exports should be logged

#### Performance Considerations
- Large fleet (500+ vehicles) requires pagination
- Sorting/filtering on 50+ columns should be efficient
- Real-time metrics updates may require caching strategy
- Chart rendering should not block UI

---

## Summary of Features

### OSHA Safety Forms
- Manages workplace incidents and safety compliance
- Supports 8 form types with 5 severity levels
- Workflow: Draft → Submitted → Under-Review → Approved
- Target: Safety officers, drivers, HR personnel

### Policy Engine Workbench
- AI-driven compliance automation with 3 execution modes
- Supports 12 policy types with configurable security controls
- Lifecycle: Draft → Testing → Approved → Active
- Target: Compliance officers, fleet managers, safety directors

### Custom Form Builder
- Create dynamic forms without coding
- 9 field types + validation rules + conditional logic
- Categories: OSHA, Inspection, JSA, Incident, Custom
- Target: Forms administrators, compliance managers, field supervisors

### Data Workbench
- Comprehensive fleet analytics and reporting
- 4 main tabs: Overview, Maintenance, Fuel, Analytics
- 14+ advanced search criteria
- Target: Fleet managers, operations managers, finance teams

---

## Integration Architecture

All four features integrate within the Fleet application through:

1. **Shared Type System**: `/src/lib/types.ts` for Vehicle, User, and core objects
2. **State Management**: React hooks (useState, useMemo, useCallback)
3. **UI Components Library**: Consistent card, dialog, table, badge components
4. **API Integration**: `useFleetData()` hook for backend data access
5. **Notification System**: Sonner toast library for user feedback
6. **Data Flow**: Unidirectional (user input → state → API → display)

---

