# Fleet CTA — Complete App Audit & Agent Team Task List

Generated: 2026-02-20

## Overview

Total issues found across all hubs: **~60+ broken elements**
- Critical (non-functional buttons): 25+
- Moderate (placeholder handlers): 10+
- Backend gaps (missing/mock routes): 20+

---

## TEAM 1: fleet-ops

**Owns:** FleetOperationsHub, OperationsHub, OperationsHubEnhanced, AssetsHub, LiveTracking, and all drilldowns opened from fleet tabs.

### Tasks

#### F-1: Wire up FleetOperationsHub button handlers
**File:** `src/pages/FleetOperationsHub.tsx`
- Line 1111: `handleCreateWorkOrder` — only logs, should open work order creation form or navigate with context
- Line 1119: `handleScheduleMaintenance` — only logs, should open maintenance scheduling for the vehicle
- Line 1258: "Edit" button in Upcoming Maintenance — missing onClick handler entirely
- Line 1357: `handleAddAsset` — navigates to generic hub, should go to asset creation
- Line 1362: `handleScheduleAssetMaintenance` — navigates to generic hub, should open asset maintenance scheduling with asset context

#### F-2: Wire up OperationsHub quick actions
**File:** `src/components/hubs/operations/OperationsHub.tsx`
- Line 389-390: "View Details" button — no onClick handler, should open vehicle detail panel
- Line 392-393: "Dispatch" button — no onClick handler, should open dispatch interface
- Lines 404-419: 4 Quick Action buttons all navigate to generic 'fleet-hub-consolidated' — should go to specific pages (Job creation, Route optimization, Geofence management, Vehicle assignment)

#### F-3: Wire up OperationsHubEnhanced quick actions
**File:** `src/components/hubs/operations/OperationsHubEnhanced.tsx`
- Lines 421-436: 4 Quick Action buttons all navigate to generic 'fleet-hub-consolidated' — same issue as OperationsHub

#### F-4: Wire up AssetsHub buttons
**File:** `src/components/hubs/assets/AssetsHub.tsx`
- Line 392-395: "Analytics Report" button — no onClick handler
- Line 396-399: "Add Asset" button — no onClick handler
- Line 176: Unused `_categoryFilter` state — either implement filtering UI or remove

#### F-5: Implement asset-relationships API
**File:** `src/components/drilldown/AssetRelationshipsList.tsx`
- Line 39-81: API endpoint `/api/asset-relationships` documented as "not yet implemented"

---

## TEAM 2: compliance-safety

**Owns:** ComplianceSafetyHub, ComplianceDashboard, ComplianceMapView, OSHAComplianceDashboard, SafetyNotificationSystem, SafetyTrainingTracker, and all safety/compliance drilldowns.

### Tasks

#### C-1: Fix ComplianceMapView buttons
**File:** `src/components/compliance/ComplianceMapView.tsx`
- Line 205-207: "Generate Report" button — no onClick handler
- Line 209-214: "Take Action" button — operator precedence bug (needs parentheses) AND no onClick handler
- Line 279-282: `handleViewDetails` function — only logs, has TODO comment

#### C-2: Fix SafetyNotificationSystem
**File:** `src/components/safety/SafetyNotificationSystem.tsx`
- Line 325-331: "View Details" button — has `notification.action_url` available but no onClick handler to use it

#### C-3: Fix ComplianceDashboard exports
**File:** `src/components/compliance/ComplianceDashboard.tsx`
- Line 451-454: "Export All Data" button — no onClick handler
- Line 412-414: Download buttons in report cards — no onClick handlers

#### C-4: Fix SafetyTrainingTracker buttons
**File:** `src/components/safety/SafetyTrainingTracker.tsx`
- Line 191-194: "Export Report" button — no onClick handler
- Line 368: "Schedule" button — no onClick handler
- Line 371: "Renew" button — no onClick handler
- Line 374: "View Cert" button — no onClick handler

#### C-5: Fix OSHAComplianceDashboard downloads
**File:** `src/components/safety/OSHAComplianceDashboard.tsx`
- Line 161-168: "OSHA 300 Log" and "OSHA 300A Summary" buttons — no onClick handlers

#### C-6: Fix ComplianceSafetyHub renewal handler
**File:** `src/pages/ComplianceSafetyHub.tsx`
- Line 280-282: `handleScheduleRenewal` — shows toast only, no real action

---

## TEAM 3: business-mgmt

**Owns:** BusinessManagementHub, ProcurementHub, ReportsHub, and related modules.

### Tasks

#### B-1: Verify BusinessManagementHub completeness
- Audit flagged as "fully functional" — verify all tabs work end-to-end
- Check report generation and download (lines 833-871)
- Verify all API calls return real data

#### B-2: Wire up ProcurementHub actions
- Audit any create/edit/delete buttons for proper functionality
- Verify purchase order workflow is complete

#### B-3: Wire up ReportsHub report generation
- Verify all report templates can be viewed and generated
- Check download functionality works

---

## TEAM 4: people-comms

**Owns:** PeopleCommunicationHub, CommunicationHub, CommunicationLog, EmailCenter, and related drilldowns.

### Tasks

#### P-1: Fix PeopleCommunicationHub meeting handler
**File:** `src/pages/PeopleCommunicationHub.tsx`
- Line 602: `handleJoinMeeting` — explicitly returns "functionality will be available in the next release" error toast
- Line 731: "View" button on task deadlines incorrectly calls `handleJoinMeeting` — should call a `handleViewTask` handler instead

#### P-2: Wire up CommunicationHub actions
- Verify all message sending, notification viewing, and contact management work
- Check announcement posting functionality

#### P-3: Wire up EmailCenter
- Verify compose, send, reply, forward actions work
- Check attachment handling

---

## TEAM 5: admin-config

**Owns:** AdminConfigurationHub, AdvancedSettings, SecuritySettings, and settings pages.

### Tasks

#### A-1: Fix AdminConfigurationHub handlers
**File:** `src/pages/AdminConfigurationHub.tsx`
- Line 392-396: `handleConfigureSettings` — navigates to generic 'settings' page, loses category context
- Line 398-403: `handleToggleFeature` — shows error toast telling user to "contact system administrator" instead of working
- Line 516-521: `handleRunBackup` — same pattern, non-functional with admin-contact message
- Line 712-715: Webhook Events stat — hardcoded "—" instead of API data

#### A-2: Fix AdvancedSettings actions
- Verify all toggle switches actually persist settings
- Verify configuration changes take effect

#### A-3: Fix SecuritySettings actions
- Verify password policy, session management, 2FA settings work

---

## BACKEND: API Route Gaps (shared work)

### Critical Path Fixes

#### API-1: Fix policy-violations path mismatch
- Frontend calls: `/api/policy-violations`
- Backend has: `/api/policy-templates/violations`
- Fix: Add alias route in server.ts OR update frontend service paths

#### API-2: Implement /api/licenses endpoint
- Frontend calls: `GET /api/licenses`
- Backend: NO ROUTE EXISTS
- Fix: Create route file and register, or remove from frontend

#### API-3: Register attachments.routes.ts
- File exists: `api/src/routes/attachments.routes.ts`
- NOT registered in server.ts
- Fix: Import and register with `app.use('/api/attachments', ...)`

#### API-4: Fix traffic cameras dual path
- Frontend uses both `/api/traffic/cameras` and `/api/traffic-cameras`
- Only `/api/traffic-cameras` is registered
- Fix: Add alias

#### API-5: Consolidate document geo path
- Frontend calls: `POST /api/documents/geo/geocode`
- Backend has: router at `/api/document-geo`
- Fix: Add alias or update frontend

### Mock Data Routes (20+ files returning fake data)
Priority list for conversion to real DB queries:
1. communications.ts
2. incidents.ts (partially real)
3. maintenance-schedules.ts
4. osha-compliance.ts
5. insurance.ts
6. geofences.ts
7. gps.ts
8. break-glass.ts
9. communication-logs.ts
10. flair-expenses.ts

### Cleanup (low priority)
- Remove: example-di.routes.ts, production-ready-api.ts, inspections.dal-example.ts
- Consolidate: documents.ts + documents.routes.ts, permissions.ts + permissions.routes.ts
