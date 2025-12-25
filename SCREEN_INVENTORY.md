# Screen Inventory

**Generated:** 2025-12-24T22:30:00-05:00
**Baseline Commit:** e4125d52
**Total Screens:** 79

---

## Section: Main (22 screens)

| ID | Label | Role Gating | Consolidation Target |
|----|-------|-------------|---------------------|
| live-fleet-dashboard | Live Fleet Dashboard | All | → Fleet Hub |
| dashboard | Fleet Dashboard | All | → Fleet Hub |
| executive-dashboard | Executive Dashboard | SuperAdmin, Admin, Manager | → Analytics Hub |
| admin-dashboard | Admin Dashboard | SuperAdmin, Admin | → Admin Hub |
| operations-workspace | Operations Workspace | All | → Operations Hub |
| fleet-workspace | Fleet Workspace | All | → Fleet Hub |
| maintenance-workspace | Maintenance Workspace | All | → Maintenance Hub |
| analytics-workspace | Analytics Workspace | All | → Analytics Hub |
| compliance-workspace | Compliance Workspace | All | → Compliance Hub |
| compliance-map | Compliance Map | All | → Compliance Hub Tab |
| compliance-dashboard | Compliance Dashboard | All | → Compliance Hub |
| drivers-workspace | Drivers Workspace | All | → Drivers Hub |
| dispatch-console | Dispatch Console | All | → Operations Hub |
| gps-tracking | Live GPS Tracking | All | → Fleet Hub Tab |
| gis-map | GIS Command Center | All | → Fleet Hub Tab |
| traffic-cameras | Traffic Cameras | All | → Fleet Hub Tab |
| geofences | Geofence Management | All | → Fleet Hub Tab |
| vehicle-telemetry | Vehicle Telemetry | All | → Fleet Hub Tab |
| map-layers | Enhanced Map Layers | All | → Fleet Hub Tab |
| route-optimization | Route Optimization | All | → Operations Hub Tab |

---

## Section: Management (13 screens)

| ID | Label | Consolidation Target |
|----|-------|---------------------|
| garage | Garage & Service | → Maintenance Hub |
| virtual-garage | Virtual Garage 3D | → Fleet Hub Tab |
| predictive | Predictive Maintenance | → Maintenance Hub Tab |
| driver-mgmt | Driver Performance | → Drivers Hub Tab |
| drivers | Drivers Management | → Drivers Hub |
| asset-management | Asset Management | → Assets Hub |
| equipment-dashboard | Equipment Dashboard | → Assets Hub Tab |
| task-management | Task Management | → Operations Hub Tab |
| incident-management | Incident Management | → Safety Hub |
| notifications | Alerts & Notifications | → Admin Hub Tab |
| documents | Document Management | → Admin Hub Tab |
| document-qa | Document Q&A | → Admin Hub Tab |

---

## Section: Procurement (4 screens)

| ID | Label | Consolidation Target |
|----|-------|---------------------|
| vendor-management | Vendor Management | → Procurement Hub |
| parts-inventory | Parts Inventory | → Procurement Hub Tab |
| purchase-orders | Purchase Orders | → Procurement Hub Tab |
| invoices | Invoices & Billing | → Procurement Hub Tab |

---

## Section: Communication (14 screens)

| ID | Label | Consolidation Target |
|----|-------|---------------------|
| push-notification-admin | Push Notifications | → Admin Hub Tab |
| ai-assistant | AI Assistant | → Tools (Keep) |
| teams-integration | Teams Messages | → Communication Hub |
| email-center | Email Center | → Communication Hub Tab |
| maintenance-scheduling | Maintenance Calendar | → Maintenance Hub Tab |
| receipt-processing | Receipt Processing | → Procurement Hub Tab |
| communication-log | Communication Log | → Communication Hub Tab |
| osha-forms | OSHA Safety Forms | → Compliance Hub Tab |
| policy-engine | Policy Engine | → Admin Hub Tab |
| video-telematics | Video Telematics | → Fleet Hub Tab |
| ev-charging | EV Charging | → Fleet Hub Tab |
| form-builder | Custom Form Builder | → Admin Hub Tab |

---

## Section: Tools (20 screens)

| ID | Label | Consolidation Target |
|----|-------|---------------------|
| arcgis-integration | ArcGIS Integration | → Integrations (Keep) |
| map-settings | Map Provider Settings | → Settings Tab |
| mileage | Mileage Reimbursement | → Finance Hub |
| personal-use | Personal Use | → Drivers Hub Tab |
| personal-use-policy | Personal Use Policy | → Admin Hub Tab |
| reimbursement-queue | Reimbursement Queue | → Finance Hub Tab |
| charges-billing | Charges & Billing | → Finance Hub Tab |
| maintenance-request | Maintenance Request | → Maintenance Hub Tab |
| fuel | Fuel Management | → Fleet Hub Tab |
| routes | Route Management | → Operations Hub Tab |
| workbench | Data Workbench | → Analytics Hub Tab |
| comprehensive | Fleet Analytics | → Analytics Hub Tab |
| analytics | Analytics Dashboard | → Analytics Hub |
| endpoint-monitor | Endpoint Monitor | → Admin Hub Tab |
| driver-scorecard | Driver Scorecard | → Drivers Hub Tab |
| fleet-optimizer | Fleet Optimizer | → Analytics Hub Tab |
| cost-analysis | Cost Analysis | → Finance Hub Tab |
| fuel-purchasing | Fuel Purchasing | → Procurement Hub Tab |
| custom-reports | Custom Report Builder | → Reports Hub |
| settings | Settings | → Settings (Keep) |

---

## Section: Hubs (11 screens - NEW)

| ID | Label | Notes |
|----|-------|-------|
| operations-hub | Operations Hub | Primary - consolidation target |
| reports-hub | Reports Hub | Primary - consolidation target |
| procurement-hub | Procurement Hub | Primary - consolidation target |
| communication-hub | Communication Hub | Primary - consolidation target |
| fleet-hub | Fleet Hub | Primary - consolidation target |
| maintenance-hub | Maintenance Hub | Primary - consolidation target |
| analytics-hub | Analytics Hub | Primary - consolidation target |
| compliance-hub | Compliance Hub | Primary - consolidation target |
| drivers-hub | Drivers Hub | Primary - consolidation target |
| safety-hub | Safety Hub | Primary - consolidation target |
| assets-hub | Assets Hub | Primary - consolidation target |

---

## Consolidation Summary

### Before: 79 screens
### After Target: 15-20 screens

| Hub | Absorbing | Screen Count |
|-----|-----------|--------------|
| Fleet Hub | 12 screens | Main vehicle/map views |
| Operations Hub | 6 screens | Dispatch, routes, tasks |
| Maintenance Hub | 5 screens | Garage, predictive, calendar |
| Analytics Hub | 6 screens | Dashboards, reports, KPIs |
| Drivers Hub | 5 screens | Driver mgmt, performance |
| Compliance Hub | 4 screens | DOT, IFTA, OSHA |
| Procurement Hub | 6 screens | Vendors, parts, invoices |
| Admin Hub | 8 screens | Settings, documents, notifications |
| Safety Hub | 3 screens | Incidents, video |
| Assets Hub | 3 screens | Equipment, inventory |
| Communication Hub | 3 screens | Teams, email, log |

**Standalone Keeps:** AI Assistant, Settings, ArcGIS Integration

### Reduction: 79 → 15-20 screens (75-80% reduction)
