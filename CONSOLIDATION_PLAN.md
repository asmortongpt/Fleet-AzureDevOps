# Consolidation Plan

**Generated:** 2025-12-24T22:35:00-05:00
**Branch:** consolidate/plan

---

## Executive Summary

| Metric | Before | After | Reduction |
|--------|--------|-------|-----------|
| Navigation Items | 79 | 18 | 77% |
| Module Directories | 17 | 11 | 35% |
| Route Count | 79 | 18 | 77% |

---

## BEFORE: Current Route List (79 screens)

### Main Section (22)
1. live-fleet-dashboard
2. dashboard
3. executive-dashboard
4. admin-dashboard
5. operations-workspace
6. fleet-workspace
7. maintenance-workspace
8. analytics-workspace
9. compliance-workspace
10. compliance-map
11. compliance-dashboard
12. drivers-workspace
13. dispatch-console
14. gps-tracking
15. gis-map
16. traffic-cameras
17. geofences
18. vehicle-telemetry
19. map-layers
20. route-optimization
21. (additional main screens)

### Management Section (13)
22. garage
23. virtual-garage
24. predictive
25. driver-mgmt
26. drivers
27. asset-management
28. equipment-dashboard
29. task-management
30. incident-management
31. notifications
32. documents
33. document-qa

### Procurement Section (4)
34. vendor-management
35. parts-inventory
36. purchase-orders
37. invoices

### Communication Section (14)
38. push-notification-admin
39. ai-assistant
40. teams-integration
41. email-center
42. maintenance-scheduling
43. receipt-processing
44. communication-log
45. osha-forms
46. policy-engine
47. video-telematics
48. ev-charging
49. form-builder
50. (additional comm screens)

### Tools Section (20)
51. arcgis-integration
52. map-settings
53. mileage
54. personal-use
55. personal-use-policy
56. reimbursement-queue
57. charges-billing
58. maintenance-request
59. fuel
60. routes
61. workbench
62. comprehensive
63. analytics
64. endpoint-monitor
65. driver-scorecard
66. fleet-optimizer
67. cost-analysis
68. fuel-purchasing
69. custom-reports
70. settings

### Hubs Section (11)
71. operations-hub
72. reports-hub
73. procurement-hub
74. communication-hub
75. fleet-hub
76. maintenance-hub
77. analytics-hub
78. compliance-hub
79. drivers-hub
80. safety-hub
81. assets-hub

---

## AFTER: Consolidated Route List (18 screens)

| # | Route | Description | Tabs/Sub-views |
|---|-------|-------------|----------------|
| 1 | `/fleet` | Fleet Hub | Map, Vehicles, GPS, Telemetry, EV, Video |
| 2 | `/fleet/:id` | Vehicle Detail | Overview, Telemetry, History, Documents |
| 3 | `/operations` | Operations Hub | Dispatch, Routes, Tasks, Schedule |
| 4 | `/maintenance` | Maintenance Hub | Garage, Predictive, Calendar, Work Orders |
| 5 | `/drivers` | Drivers Hub | List, Performance, Scorecard, Assignments |
| 6 | `/drivers/:id` | Driver Detail | Profile, Performance, Trips, Documents |
| 7 | `/analytics` | Analytics Hub | Dashboard, Reports, KPIs, Workbench |
| 8 | `/compliance` | Compliance Hub | DOT, IFTA, OSHA, Map |
| 9 | `/procurement` | Procurement Hub | Vendors, Parts, Orders, Invoices |
| 10 | `/assets` | Assets Hub | Equipment, Inventory, Tracking |
| 11 | `/safety` | Safety Hub | Incidents, Video, Alerts |
| 12 | `/admin` | Admin Hub | Users, Settings, Documents, Notifications |
| 13 | `/reports` | Reports Hub | Custom Reports, Builder, Templates |
| 14 | `/communication` | Communication Hub | AI Assistant, Teams, Email, Log |
| 15 | `/settings` | Settings | Profile, Preferences, Integrations |
| 16 | `/login` | Login | Authentication |
| 17 | `/register` | Register | Registration |
| 18 | `/` | Home/Dashboard | Redirect to Fleet Hub |

---

## Merge Mapping

### Fleet Hub (`/fleet`)
**Absorbs 12 screens:**
- live-fleet-dashboard → Fleet Hub (Map Tab)
- dashboard → Fleet Hub (Overview Tab)
- fleet-workspace → Fleet Hub
- gps-tracking → Fleet Hub (GPS Tab)
- gis-map → Fleet Hub (Map Tab)
- traffic-cameras → Fleet Hub (Map Tab)
- geofences → Fleet Hub (Map Tab)
- vehicle-telemetry → Fleet Hub (Telemetry Tab)
- map-layers → Fleet Hub (Map Tab)
- virtual-garage → Fleet Hub (3D Tab)
- video-telematics → Fleet Hub (Video Tab)
- ev-charging → Fleet Hub (EV Tab)

### Operations Hub (`/operations`)
**Absorbs 6 screens:**
- operations-workspace → Operations Hub
- dispatch-console → Operations Hub (Dispatch Tab)
- route-optimization → Operations Hub (Routes Tab)
- routes → Operations Hub (Routes Tab)
- task-management → Operations Hub (Tasks Tab)
- maintenance-scheduling → Operations Hub (Calendar Tab)

### Maintenance Hub (`/maintenance`)
**Absorbs 5 screens:**
- maintenance-workspace → Maintenance Hub
- garage → Maintenance Hub (Garage Tab)
- predictive → Maintenance Hub (Predictive Tab)
- maintenance-request → Maintenance Hub (Requests Tab)

### Drivers Hub (`/drivers`)
**Absorbs 6 screens:**
- drivers-workspace → Drivers Hub
- drivers → Drivers Hub (List Tab)
- driver-mgmt → Drivers Hub (Performance Tab)
- driver-scorecard → Drivers Hub (Scorecard Tab)
- personal-use → Drivers Hub (Personal Tab)
- personal-use-policy → Drivers Hub (Policy Tab)

### Analytics Hub (`/analytics`)
**Absorbs 8 screens:**
- analytics-workspace → Analytics Hub
- executive-dashboard → Analytics Hub (Executive Tab)
- analytics → Analytics Hub (Dashboard Tab)
- comprehensive → Analytics Hub (Fleet Tab)
- workbench → Analytics Hub (Workbench Tab)
- fleet-optimizer → Analytics Hub (Optimizer Tab)
- cost-analysis → Analytics Hub (Costs Tab)

### Compliance Hub (`/compliance`)
**Absorbs 5 screens:**
- compliance-workspace → Compliance Hub
- compliance-dashboard → Compliance Hub (Dashboard Tab)
- compliance-map → Compliance Hub (Map Tab)
- osha-forms → Compliance Hub (OSHA Tab)

### Procurement Hub (`/procurement`)
**Absorbs 7 screens:**
- vendor-management → Procurement Hub (Vendors Tab)
- parts-inventory → Procurement Hub (Parts Tab)
- purchase-orders → Procurement Hub (Orders Tab)
- invoices → Procurement Hub (Invoices Tab)
- receipt-processing → Procurement Hub (Receipts Tab)
- fuel → Procurement Hub (Fuel Tab)
- fuel-purchasing → Procurement Hub (Fuel Tab)

### Assets Hub (`/assets`)
**Absorbs 3 screens:**
- asset-management → Assets Hub (List Tab)
- equipment-dashboard → Assets Hub (Dashboard Tab)

### Safety Hub (`/safety`)
**Absorbs 2 screens:**
- incident-management → Safety Hub (Incidents Tab)

### Admin Hub (`/admin`)
**Absorbs 10 screens:**
- admin-dashboard → Admin Hub (Dashboard Tab)
- notifications → Admin Hub (Alerts Tab)
- documents → Admin Hub (Documents Tab)
- document-qa → Admin Hub (Q&A Tab)
- push-notification-admin → Admin Hub (Push Tab)
- policy-engine → Admin Hub (Policy Tab)
- form-builder → Admin Hub (Forms Tab)
- endpoint-monitor → Admin Hub (Monitor Tab)

### Communication Hub (`/communication`)
**Absorbs 4 screens:**
- ai-assistant → Communication Hub (AI Tab)
- teams-integration → Communication Hub (Teams Tab)
- email-center → Communication Hub (Email Tab)
- communication-log → Communication Hub (Log Tab)

---

## Migration Plan

### Phase 1: Foundation (Week 1)
1. Create hub page template component
2. Create tabbed navigation component
3. Set up new route structure in router
4. Create redirect rules for old routes

### Phase 2: Fleet Hub (Week 1-2)
1. Build Fleet Hub with map as default view
2. Migrate GPS, telemetry, video components as tabs
3. Create vehicle detail page with tabs
4. Set up route redirects

### Phase 3: Operations & Maintenance (Week 2)
1. Build Operations Hub with dispatch/routes/tasks/calendar
2. Build Maintenance Hub with garage/predictive/calendar
3. Migrate existing components into tabs

### Phase 4: Drivers & Analytics (Week 2-3)
1. Build Drivers Hub with list/performance/scorecard
2. Build Analytics Hub with dashboards/reports/KPIs
3. Create driver detail page

### Phase 5: Support Hubs (Week 3)
1. Build Compliance Hub
2. Build Procurement Hub
3. Build Assets Hub
4. Build Safety Hub

### Phase 6: Admin & Communication (Week 3-4)
1. Build Admin Hub
2. Build Communication Hub
3. Build Reports Hub
4. Migrate settings

### Phase 7: Cleanup (Week 4)
1. Remove old routes
2. Remove redundant components
3. Update navigation
4. Update documentation

---

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Breaking existing bookmarks | Medium | Implement redirects for all old routes |
| User confusion | Medium | Progressive rollout with feature flags |
| Missing functionality | High | Feature parity checklist before migration |
| Performance regression | Medium | Performance testing after each phase |

---

## Success Metrics

- [ ] Route count reduced from 79 to 18
- [ ] All functionality preserved (feature parity tested)
- [ ] No broken links or 404s
- [ ] User navigation time reduced by 40%+
- [ ] Page load performance maintained or improved
