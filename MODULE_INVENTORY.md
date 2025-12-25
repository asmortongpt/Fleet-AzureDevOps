# Module Inventory

**Generated:** 2025-12-24T22:30:00-05:00
**Baseline Commit:** e4125d52

---

## Summary

| Metric | Value |
|--------|-------|
| Total Module Directories | 17 |
| Total Module TSX Files | 104 |
| Empty Modules | 1 (facilities) |

---

## Module Details

### Priority 1: Core Fleet Operations

#### fleet (19 files)
**Purpose:** Core vehicle management, GPS tracking, telemetry, virtual garage

**Files:**
- FleetAnalytics.tsx (17KB) - Analytics views
- FleetDashboard.tsx (7KB) - Fleet overview
- FleetOptimizer.tsx (16KB) - Optimization tools
- GPSTracking.tsx (18KB) - Live GPS
- VehicleAssignmentManagement.tsx (27KB) - Assignment workflows
- VehicleInventory.tsx (29KB) - Vehicle inventory
- VehicleManagement.tsx (3KB) - Vehicle CRUD
- VehicleTelemetry.tsx (25KB) - Telemetry display
- VirtualGarage.tsx (50KB) - 3D garage view
- VirtualGarage3D.tsx (14KB) - 3D rendering
- FleetAnalytics/ (components, hooks)
- FleetDashboard/ (components, hooks)
- GPSTracking/ (stories)
- VehicleTelemetry/ (components)
- VirtualGarage/ (hooks, utils)

**Routes:** dashboard, gps-tracking, virtual-garage, vehicle-telemetry

---

#### drivers (2 files)
**Purpose:** Driver management and performance tracking

**Files:**
- DriverPerformance.tsx (24KB)
- DriverScorecard.tsx (19KB)

**Routes:** drivers, driver-mgmt, driver-scorecard

---

#### fuel (2 files)
**Purpose:** Fuel management and purchasing

**Files:**
- FuelManagement.tsx (12KB)
- FuelPurchasing.tsx (30KB)

**Routes:** fuel, fuel-purchasing

---

### Priority 2: Operations & Maintenance

#### operations (10 files)
**Purpose:** Dispatch, routing, scheduling

**Files:**
- DispatchConsole.tsx
- RouteManagement.tsx
- RouteOptimization.tsx
- SchedulingCalendar.tsx
- TaskManagement.tsx
- (5 additional components)

**Routes:** dispatch-console, routes, route-optimization, maintenance-scheduling, task-management

---

#### maintenance (5 files)
**Purpose:** Maintenance workflows and scheduling

**Files:**
- MaintenanceScheduling.tsx
- PredictiveMaintenance.tsx
- GarageService.tsx
- (2 additional components)

**Routes:** garage, predictive, maintenance-request

---

### Priority 3: Analytics & Reporting

#### analytics (17 files)
**Purpose:** Dashboards, reports, KPIs

**Files:**
- ExecutiveDashboard.tsx
- AnalyticsDashboard.tsx
- CustomReports.tsx
- DataWorkbench.tsx
- FleetKPIs.tsx
- (12 additional components)

**Routes:** executive-dashboard, analytics, workbench, custom-reports, comprehensive

---

### Priority 4: Compliance & Safety

#### compliance (5 files)
**Purpose:** DOT, IFTA, OSHA compliance

**Files:**
- ComplianceDashboard.tsx
- DOTCompliance.tsx
- IFTACompliance.tsx
- OSHAForms.tsx
- ComplianceMap.tsx

**Routes:** compliance-workspace, compliance-map, compliance-dashboard, osha-forms

---

### Priority 5: Integrations & Tools

#### integrations (18 files)
**Purpose:** Third-party connectors

**Files:**
- ArcGISIntegration.tsx
- SmartcarIntegration.tsx
- OutlookIntegration.tsx
- TeamsIntegration.tsx
- VideoTelematics.tsx
- (13 additional components)

**Routes:** arcgis-integration, teams-integration, email-center, video-telematics

---

#### tools (6 files)
**Purpose:** Utility tools

**Files:**
- AIAssistant.tsx
- FormBuilder.tsx
- EndpointMonitor.tsx
- PolicyEngine.tsx
- (2 additional components)

**Routes:** ai-assistant, form-builder, endpoint-monitor, policy-engine

---

### Priority 6: Administrative & Support

#### admin (3 files)
**Purpose:** Admin panels, monitoring

**Files:**
- MonitoringDashboard.tsx
- ErrorRateChart.tsx
- AlertsPanel.tsx

**Routes:** admin-dashboard

---

#### assets (5 files)
**Purpose:** Asset management and tracking

**Files:**
- AssetManagement.tsx
- EquipmentDashboard.tsx
- (3 additional components)

**Routes:** asset-management, equipment-dashboard

---

#### procurement (5 files)
**Purpose:** Purchasing workflows

**Files:**
- VendorManagement.tsx
- PartsInventory.tsx
- PurchaseOrders.tsx
- Invoices.tsx
- (1 additional component)

**Routes:** vendor-management, parts-inventory, purchase-orders, invoices

---

#### communication (1 file)
**Purpose:** Team communication

**Files:**
- CommunicationLog.tsx

**Routes:** communication-log, push-notification-admin

---

#### charging (2 files)
**Purpose:** EV charging management

**Files:**
- EVChargingManagement.tsx
- (1 additional component)

**Routes:** ev-charging

---

#### personal-use (2 files)
**Purpose:** Personal use policy tracking

**Files:**
- PersonalUseDashboard.tsx
- PersonalUsePolicyConfig.tsx

**Routes:** personal-use, personal-use-policy

---

#### mobile (2 files)
**Purpose:** Mobile-specific features

**Files:**
- (2 mobile components)

**Routes:** (mobile app routes)

---

#### facilities (0 files)
**Purpose:** Facility management (Empty/Placeholder)

---

## Consolidation Recommendations

### High Impact Merges

1. **Fleet Hub** - Consolidate fleet + drivers + fuel
2. **Operations Hub** - Consolidate operations + maintenance 
3. **Analytics Hub** - Consolidate analytics + compliance
4. **Integrations Hub** - Consolidate integrations + tools
5. **Admin Hub** - Consolidate admin + assets + procurement

### Target Architecture
- 8 Hub pages with tabbed navigation
- Each hub contains entity list + detail + edit views
- Shared design system components
