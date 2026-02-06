### Hardcoded / placeholder data inventory

| Module | Observed hardcoded/mock data | Notes |
| --- | --- | --- |
| `MaintenanceScheduling` | Previously used mock `useState` schedules/status. (Now replaced.) | Completed |
| `FuelPurchasing` | Date placeholders, example coordinates. Uses `useState` with default ranges. | Needs rewire to `useFuelTransactions`. |
| `Modules/tools/AIAssistant`, `ReceiptProcessing`, `RecurringScheduleDialog`, `CustomFormBuilder`, `MileageReimbursement` | Many placeholders (`id: msg-${Date.now()}`, placeholder text). | Need API-backed flows or remove mock generation. |
| `RouteManagement` panel (observed blank map, placeholder stats) | Likely uses static counters/UUIDs for vehicles/drivers. | Reconnect to `useRoutes`, `useVehicles`, `useDrivers`. |
| `FloatingKPIStrip` | Currently fetching `/api/dashboard/stats`; needs verification of CTA-scoped stats. | Already API-backed. |
| Map modules (LiveFleetMap, GoogleMapView) | Already use `useVehicles`, but still rely on fallback location zero; ensure CTA markers exist and map center uses real data. |
| `MaintenanceWorkspace` | Check for mock arrays in schedule/calendar sections. |
| `FleetWorkspace`, `AnalyticsWorkspace`, `ComplianceWorkspace` | Should be audited for `useState` arrays that do not call APIs. |

> Next steps: For each module above, replace local mock data with the appropriate `use*` hook or API call, map IDs to CTA names, and remove placeholder `Date.now()` IDs. Prioritize `RouteManagement`, KPI dashboards, and remaining maintenance views to prove CTA data everywhere.
