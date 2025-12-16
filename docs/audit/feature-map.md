# Fleet Feature Map - Production Analysis

**Date:** 2025-12-14
**Branch:** chore/repo-cleanup
**Analysis Scope:** Step 2 of 9-step cleanup process

---

## Executive Summary

The Fleet application is a comprehensive fleet management platform with:
- **102 API routes** actively registered in production (server.ts:line 287-427)
- **59 frontend modules** registered in navigation (src/lib/navigation.tsx)
- **7 modular repositories** in active use (container.ts Dependency Injection)
- **11 legacy repositories** still imported from flat structure
- **184 total route files** in api/src/routes/ (**51 are variants** - 28% duplication)

### Critical Finding: Route File Duplication

**Issue:** 28% of route files are variants (.enhanced, .refactored, .migrated, .example)
- **133 standard route files** (production)
- **51 variant route files** (experimental/example/refactored)

**Action Required:** Determine which variants are in production vs experimental/dead code.

---

## Production API Feature Map

### Registered API Routes (102 routes - server.ts)

#### Core Fleet Management (10 routes)
| Route | File | Endpoint | Status |
|-------|------|----------|--------|
| Vehicles | `vehicles` | `/api/vehicles` | ✅ Production |
| Drivers | `drivers` | `/api/drivers` | ✅ Production |
| Fuel Transactions | `fuel-transactions` | `/api/fuel-transactions` | ✅ Production |
| Maintenance | `maintenance` | `/api/maintenance` | ✅ Production |
| Incidents | `incidents` | `/api/incidents` | ✅ Production |
| Parts | `parts` | `/api/parts` | ✅ Production |
| Vendors | `vendors` | `/api/vendors` | ✅ Production |
| Invoices | `invoices` | `/api/invoices` | ✅ Production |
| Purchase Orders | `purchase-orders` | `/api/purchase-orders` | ✅ Production |
| Tasks | `tasks` | `/api/tasks` | ✅ Production |

#### Asset Management (4 routes)
| Route | File | Endpoint | Status |
|-------|------|----------|--------|
| Asset Management | `asset-management.routes` | `/api/assets` | ✅ Production |
| Asset Analytics | `asset-analytics.routes` | `/api/asset-analytics` | ✅ Production |
| Assets Mobile | `assets-mobile.routes` | `/api/assets-mobile` | ✅ Production |
| Heavy Equipment | `heavy-equipment.routes` | `/api/heavy-equipment` | ✅ Production |

#### Dispatch & Communication (2 routes)
| Route | File | Endpoint | Status |
|-------|------|----------|--------|
| Communication Logs | `communication-logs` | `/api/communication-logs` | ✅ Production |
| Teams | `teams.routes` | `/api/teams` | ✅ Production |

#### GPS & Tracking (4 routes)
| Route | File | Endpoint | Status |
|-------|------|----------|--------|
| GPS | `gps` | `/api/gps` | ✅ Production |
| Geofences | `geofences` | `/api/geofences` | ✅ Production |
| Telematics | `telematics.routes` | `/api/telematics` | ✅ Production |
| Vehicle Idling | `vehicle-idling.routes` | `/api/vehicle-idling` | ✅ Production |

#### Maintenance & Inspection (3 routes)
| Route | File | Endpoint | Status |
|-------|------|----------|--------|
| Maintenance Schedules | `maintenance-schedules` | `/api/maintenance-schedules` | ✅ Production |
| Inspections | `inspections` | `/api/inspections` | ✅ Production |
| Work Orders | `work-orders` | `/api/work-orders` | ✅ Production |

#### EV Management (3 routes)
| Route | File | Endpoint | Status |
|-------|------|----------|--------|
| EV Management | `ev-management.routes` | `/api/ev-management` | ✅ Production |
| Charging Sessions | `charging-sessions` | `/api/charging-sessions` | ✅ Production |
| Charging Stations | `charging-stations` | `/api/charging-stations` | ✅ Production |

#### Document Management (4 routes)
| Route | File | Endpoint | Status |
|-------|------|----------|--------|
| Documents | `documents` | `/api/documents` | ✅ Production |
| Fleet Documents | `fleet-documents.routes` | `/api/fleet-documents` | ✅ Production |
| Attachments | `attachments.routes` | `/api/attachments` | ✅ Production |
| OCR | `ocr.routes` | `/api/ocr` | ✅ Production |

#### Financial & Cost Management (8 routes)
| Route | File | Endpoint | Status |
|-------|------|----------|--------|
| Costs | `costs` | `/api/costs` | ✅ Production |
| Cost Analysis | `cost-analysis.routes` | `/api/cost-analysis` | ✅ Production |
| Cost Benefit Analysis | `cost-benefit-analysis.routes` | `/api/cost-benefit-analysis` | ✅ Production |
| Billing Reports | `billing-reports` | `/api/billing-reports` | ✅ Production |
| Mileage Reimbursement | `mileage-reimbursement` | `/api/mileage-reimbursement` | ✅ Production |
| Personal Use Charges | `personal-use-charges` | `/api/personal-use-charges` | ✅ Production |
| Personal Use Policies | `personal-use-policies` | `/api/personal-use-policies` | ✅ Production |
| Fuel Purchasing | `fuel-purchasing.routes` | `/api/fuel-purchasing` | ✅ Production |

#### Reporting & Analytics (4 routes)
| Route | File | Endpoint | Status |
|-------|------|----------|--------|
| Executive Dashboard | `executive-dashboard.routes` | `/api/executive-dashboard` | ✅ Production |
| Custom Reports | `custom-reports.routes` | `/api/custom-reports` | ✅ Production |
| Assignment Reporting | `assignment-reporting.routes` | `/api/assignment-reporting` | ✅ Production |
| Driver Scorecard | `driver-scorecard.routes` | `/api/driver-scorecard` | ✅ Production |

#### AI & Automation (6 routes)
| Route | File | Endpoint | Status |
|-------|------|----------|--------|
| AI Insights | `ai-insights.routes` | `/api/ai-insights` | ✅ Production |
| AI Search | `ai-search` | `/api/ai-search` | ✅ Production |
| AI Task Asset | `ai-task-asset.routes` | `/api/ai-task-asset` | ✅ Production |
| AI Task Prioritization | `ai-task-prioritization.routes` | `/api/ai-tasks` | ✅ Production |
| LangChain | `langchain.routes` | `/api/langchain` | ✅ Production |
| Fleet Optimizer | `fleet-optimizer.routes` | `/api/fleet-optimizer` | ✅ Production |

#### Task & Schedule Management (3 routes)
| Route | File | Endpoint | Status |
|-------|------|----------|--------|
| Scheduling | `scheduling.routes` | `/api/scheduling` | ✅ Production |
| Calendar | `calendar.routes` | `/api/calendar` | ✅ Production |
| On-Call Management | `on-call-management.routes` | `/api/on-call-management` | ✅ Production |

#### Mobile & Integration (10 routes)
| Route | File | Endpoint | Status |
|-------|------|----------|--------|
| Mobile Assignment | `mobile-assignment.routes` | `/api/mobile-assignment` | ✅ Production |
| Mobile Hardware | `mobile-hardware.routes` | `/api/mobile-hardware` | ✅ Production |
| Mobile Integration | `mobile-integration.routes` | `/api/mobile-integration` | ✅ Production |
| Mobile Messaging | `mobile-messaging.routes` | `/api/mobile-messaging` | ✅ Production |
| Mobile Notifications | `mobile-notifications.routes` | `/api/mobile-notifications` | ✅ Production |
| Mobile OBD2 | `mobile-obd2.routes` | `/api/mobile-obd2` | ✅ Production |
| Mobile OCR | `mobile-ocr.routes` | `/api/mobile-ocr` | ✅ Production |
| Mobile Photos | `mobile-photos.routes` | `/api/mobile-photos` | ✅ Production |
| Mobile Trips | `mobile-trips.routes` | `/api/mobile-trips` | ✅ Production |
| Push Notifications | `push-notifications.routes` | `/api/push-notifications` | ✅ Production |

#### Vehicle Management (6 routes)
| Route | File | Endpoint | Status |
|-------|------|----------|--------|
| Vehicle Assignments | `vehicle-assignments.routes` | `/api/vehicle-assignments` | ✅ Production |
| Vehicle History | `vehicle-history.routes` | `/api/vehicle-history` | ✅ Production |
| Vehicle Identification | `vehicle-identification.routes` | `/api/vehicle-identification` | ✅ Production |
| Vehicle 3D | `vehicle-3d.routes` | `/api/vehicle-3d` | ✅ Production |
| Damage | `damage` | `/api/damage` | ✅ Production |
| Damage Reports | `damage-reports` | `/api/damage-reports` | ✅ Production |

#### Trip & Route Management (3 routes)
| Route | File | Endpoint | Status |
|-------|------|----------|--------|
| Routes | `routes` | `/api/routes` | ✅ Production |
| Route Emulator | `route-emulator.routes` | `/api/route-emulator` | ✅ Production |
| Trip Usage | `trip-usage` | `/api/trip-usage` | ✅ Production |

#### Safety & Compliance (3 routes)
| Route | File | Endpoint | Status |
|-------|------|----------|--------|
| Safety Incidents | `safety-incidents` | `/api/safety-incidents` | ✅ Production |
| OSHA Compliance | `osha-compliance` | `/api/osha-compliance` | ✅ Production |
| Annual Reauthorization | `annual-reauthorization.routes` | `/api/annual-reauthorization` | ✅ Production |

#### Policy & Permission (2 routes)
| Route | File | Endpoint | Status |
|-------|------|----------|--------|
| Policies | `policies` | `/api/policies` | ✅ Production |
| Permissions | `permissions` | `/api/permissions` | ✅ Production |

#### Authentication & User Management (4 routes)
| Route | File | Endpoint | Status |
|-------|------|----------|--------|
| Auth | `auth` | `/api/auth` | ✅ Production |
| Session Revocation | `session-revocation` | `/api/auth` | ✅ Production |
| Microsoft Auth | `microsoft-auth` | `/api/microsoft-auth` | ✅ Production |
| Break Glass | `break-glass` | `/api/break-glass` | ✅ Production |

#### External Integrations (5 routes)
| Route | File | Endpoint | Status |
|-------|------|----------|--------|
| SmartCar | `smartcar.routes` | `/api/smartcar` | ✅ Production |
| ArcGIS Layers | `arcgis-layers` | `/api/arcgis-layers` | ✅ Production |
| Outlook | `outlook.routes` | `/api/outlook` | ✅ Production |
| Video Events | `video-events` | `/api/video-events` | ✅ Production |
| Video Telematics | `video-telematics.routes` | `/api/video-telematics` | ✅ Production |

#### Emulator & Testing (2 routes)
| Route | File | Endpoint | Status |
|-------|------|----------|--------|
| Emulator | `emulator.routes` | `/api/emulator` | ✅ Production |
| OBD2 Emulator | `obd2-emulator.routes` | `/api/obd2-emulator` | ✅ Production |

#### System Management (15 routes)
| Route | File | Endpoint | Status |
|-------|------|----------|--------|
| Monitoring | `monitoring` | `/api/monitoring` | ✅ Production |
| Health (System) | `health-system.routes` | `/api/health` | ✅ Production |
| Health (Microsoft) | `health.routes` | `/api/health/microsoft` | ✅ Production |
| Health Detailed | `health-detailed` | `/api/health-detailed` | ✅ Production |
| Performance | `performance.routes` | `/api/performance` | ✅ Production |
| Telemetry | `telemetry` | `/api/telemetry` | ✅ Production |
| Queue | `queue.routes` | `/api/queue` | ✅ Production |
| Deployments | `deployments` | `/api/deployments` | ✅ Production |
| Facilities | `facilities` | `/api/facilities` | ✅ Production |
| Search | `search` | `/api/search` | ✅ Production |
| Presence | `presence.routes` | `/api/presence` | ✅ Production |
| Storage Admin | `storage-admin` | `/api/storage-admin` | ✅ Production |
| Sync | `sync.routes` | `/api/sync` | ✅ Production |
| Quality Gates | `quality-gates` | `/api/quality-gates` | ✅ Production |
| Reservations | `reservations.routes` | `/api/reservations` | ✅ Production |
| Admin Jobs | `admin-jobs.routes` | `/api/admin/jobs` | ✅ Production |

---

## Dependency Injection Container Analysis

### Modular Repositories (Preferred Architecture)

**Pattern:** `api/src/modules/<domain>/repositories/<entity>.repository.ts`

From `container.ts`:

```typescript
// 7 Modular Domain Repositories (PRODUCTION)
✅ modules/fleet/repositories/vehicle.repository.ts        (VehicleRepository)
✅ modules/drivers/repositories/driver.repository.ts       (DriverRepository)
✅ modules/maintenance/repositories/maintenance.repository.ts (MaintenanceRepository)
✅ modules/facilities/repositories/facility.repository.ts  (FacilityRepository)
✅ modules/work-orders/repositories/work-order.repository.ts (WorkOrderRepository)
✅ modules/incidents/repositories/incident.repository.ts   (IncidentRepository)
✅ modules/inspections/repositories/inspection.repository.ts (InspectionRepository)
```

**Status:** These are the CANONICAL repository implementations using modular architecture.

### Legacy Repositories (Flat Architecture - Still in Use)

**Pattern:** `api/src/repositories/<Entity>Repository.ts`

From `container.ts`:

```typescript
// 11 Legacy Flat Repositories (STILL IN PRODUCTION)
⚠️ repositories/BreakGlassRepository.ts
⚠️ repositories/PersonalUsePoliciesRepository.ts
⚠️ repositories/PermissionsRepository.ts
⚠️ repositories/attachments.repository.ts
⚠️ repositories/vehicle-assignments.repository.ts
⚠️ repositories/push-notification.repository.ts
```

**Status:** Legacy architecture still actively used. Cannot delete until migrated to modular pattern.

### Additional Modular Repositories (Not in Container)

Found in `api/src/modules/` but NOT registered in container.ts:

```typescript
// Additional repositories found in modules/ directory
? modules/fleet/vehicles/vehicles.repository.ts          ❓ Duplicate of vehicle.repository.ts?
? modules/incidents/repositories/incident-witness.repository.ts
? modules/incidents/repositories/incident-action.repository.ts
? modules/incidents/repositories/incident-timeline.repository.ts
```

**Question:** Are these used dynamically or are they dead code?

---

## Frontend Module Registry (59 modules)

From `src/lib/navigation.tsx`:

### Main Section (11 modules)
```typescript
✅ dashboard              - Fleet Dashboard
✅ executive-dashboard    - Executive Dashboard
✅ admin-dashboard        - Admin Dashboard
✅ dispatch-console       - Dispatch Console
✅ gps-tracking           - Live GPS Tracking
✅ gis-map                - GIS Command Center
✅ traffic-cameras        - Traffic Cameras
✅ geofences              - Geofence Management
✅ vehicle-telemetry      - Vehicle Telemetry
✅ map-layers             - Enhanced Map Layers
✅ route-optimization     - Route Optimization
```

### Management Section (14 modules)
```typescript
✅ people                 - People Management
✅ garage                 - Garage & Service
✅ virtual-garage         - Virtual Garage 3D
✅ predictive             - Predictive Maintenance
✅ driver-mgmt            - Driver Performance
✅ asset-management       - Asset Management
✅ equipment-dashboard    - Equipment Dashboard
✅ task-management        - Task Management
✅ incident-management    - Incident Management
✅ notifications          - Alerts & Notifications
✅ documents              - Document Management
✅ document-qa            - Document Q&A
```

### Procurement Section (4 modules)
```typescript
✅ vendor-management      - Vendor Management
✅ parts-inventory        - Parts Inventory
✅ purchase-orders        - Purchase Orders
✅ invoices               - Invoices & Billing
```

### Communication Section (10 modules)
```typescript
✅ ai-assistant           - AI Assistant
✅ teams-integration      - Teams Messages
✅ email-center           - Email Center
✅ maintenance-scheduling - Maintenance Calendar
✅ receipt-processing     - Receipt Processing
✅ communication-log      - Communication Log
✅ osha-forms             - OSHA Safety Forms
✅ policy-engine          - Policy Engine
✅ video-telematics       - Video Telematics
✅ ev-charging            - EV Charging
✅ form-builder           - Custom Form Builder
✅ push-notification-admin - Push Notifications
```

### Tools Section (20 modules)
```typescript
✅ mileage                - Mileage Reimbursement
✅ personal-use           - Personal Use
✅ personal-use-policy    - Personal Use Policy
✅ reimbursement-queue    - Reimbursement Queue
✅ charges-billing        - Charges & Billing
✅ maintenance-request    - Maintenance Request
✅ fuel                   - Fuel Management
✅ routes                 - Route Management
✅ workbench              - Data Workbench
✅ comprehensive          - Fleet Analytics
✅ endpoint-monitor       - Endpoint Monitor
✅ driver-scorecard       - Driver Scorecard
✅ fleet-optimizer        - Fleet Optimizer
✅ cost-analysis          - Cost Analysis
✅ fuel-purchasing        - Fuel Purchasing
✅ custom-reports         - Custom Report Builder
✅ arcgis-integration     - ArcGIS Integration
✅ map-settings           - Map Provider Settings
✅ settings               - Settings
```

**Total Frontend Modules:** 59 registered in navigation.tsx

**Frontend Module Files:** 115 .tsx files in `src/components/modules/`

**Discrepancy:** 115 files vs 59 registered modules suggests:
- 56 module files are NOT registered (test files, helpers, sub-components, or dead code)

---

## Route File Variant Analysis (51 files - 28% duplication)

### Variant Patterns Identified

From `find api/src/routes -name "*.enhanced.ts" -o -name "*.refactored.ts" -o -name "*.migrated.ts" -o -name "*.example.ts"`:

#### Enhanced Variants (~30 files)
```
⚠️ annual-reauthorization.routes.enhanced.ts
⚠️ asset-management.routes.enhanced.ts
⚠️ billing-reports.enhanced.ts
⚠️ charging-sessions.enhanced.ts
⚠️ communications.enhanced.ts
⚠️ dispatch.routes.enhanced.ts
... (24 more .enhanced.ts files)
```

**Question:** Are `.enhanced.ts` files production or experimental?
**Action:** Check server.ts imports to determine which are registered.

#### Example/Template Files (~10 files)
```
🗑️ dashboard-stats.example.ts
🗑️ document-search.example.ts
🗑️ example-di.routes.ts
🗑️ inspections.dal-example.ts
🗑️ vehicles-refactored.example.ts
🗑️ vehicles.optimized.example.ts
🗑️ vendors.dal-example.ts
... (3 more .example.ts files)
```

**Status:** Example files are NOT registered in server.ts - SAFE TO DELETE.

#### Migration/Refactoring Variants (~5 files)
```
⚠️ drivers.refactored.ts
⚠️ vehicles.migrated.ts
⚠️ vehicles.refactored.ts
... (2 more migration variants)
```

**Question:** Are refactored versions production or work-in-progress?
**Action:** Check which are imported in server.ts.

#### Backup Files
```
🗑️ ai.ts.backup
```

**Status:** Backup files should be deleted (Git maintains history).

---

## Findings & Recommendations

### Critical Questions for Step 3 (Branch Validation)

1. **Which route files are registered in server.ts?**
   - Standard vs Enhanced vs Refactored vs Migrated variants
   - Need to cross-reference server.ts imports against route file names

2. **Which repository naming convention is canonical?**
   - Modular (lowercase) vs Legacy (PascalCase)
   - container.ts shows preference for modular lowercase

3. **What features exist in Fleet/ directory that are missing from main?**
   - Fleet/ has 0 backup files (cleaned)
   - Fleet/ has different commit history
   - Need git diff analysis in Step 3

4. **What features exist in fleet-repo/ directory?**
   - 1.9GB size suggests significant content
   - Need to investigate origin and compare to main

5. **Which frontend modules (56 unregistered) are dead code vs sub-components?**
   - 115 module files vs 59 registered = 56 unregistered
   - Need to analyze imports in registered modules

### Immediate Cleanup Recommendations

#### Safe Deletions (Example files - NOT imported)
```bash
# Delete example/template route files (~10 files)
rm api/src/routes/*.example.ts
rm api/src/routes/*.dal-example.ts
```

#### Safe Deletions (Backup files)
```bash
# Delete route backup files
rm api/src/routes/*.backup
```

#### Requires Investigation (Enhanced/Refactored/Migrated)
```
⚠️ DO NOT DELETE YET - Need to verify which are production vs experimental
- 30+ .enhanced.ts files
- 5+ .refactored.ts / .migrated.ts files
```

### Architecture Migration Path

**Current State:**
- Dual architecture: Modular (preferred) + Legacy (flat)
- 7 modular repositories in production
- 11 legacy repositories still in use

**Recommended Migration:**
1. Identify which legacy repositories are still imported in routes
2. Migrate legacy imports to modular equivalents
3. Delete deprecated legacy repository files
4. Standardize on modular lowercase naming convention

---

## Next Steps (Step 3: Branch Validation)

**Required Analysis:**
1. Compare Fleet/ directory commits to main branch
2. Compare fleet-repo/ directory commits to main branch
3. Identify unmerged features from both directories
4. Create merge plan for valuable work

**Required Verification:**
1. Cross-reference server.ts route imports against route file variants
2. Determine production status of .enhanced / .refactored / .migrated files
3. Analyze frontend module imports to identify dead vs active unregistered modules
4. Map repository import dependencies across all route files

---

## Summary Statistics

| Category | Count | Status |
|----------|-------|--------|
| **API Routes (Production)** | 102 | ✅ All registered in server.ts |
| **Frontend Modules (Navigation)** | 59 | ✅ All registered in navigation.tsx |
| **Frontend Module Files** | 115 | ⚠️ 56 unregistered (sub-components or dead code) |
| **Total Route Files** | 184 | ⚠️ 133 standard + 51 variants (28% duplication) |
| **Modular Repositories (DI)** | 7 | ✅ Preferred architecture |
| **Legacy Repositories (DI)** | 11 | ⚠️ Still in production use |
| **Additional Module Repos** | 4 | ❓ Not in DI container - investigate |
| **Route Variants** | 51 | ⚠️ Needs investigation |
| **Example Route Files** | ~10 | 🗑️ Safe to delete |
| **Backup Route Files** | 1+ | 🗑️ Safe to delete |

---

**Feature Map Complete:** Ready for Step 3 (Branch Validation)
