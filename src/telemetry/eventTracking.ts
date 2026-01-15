/**
 * Event Tracking Module - STUB IMPLEMENTATION
 *
 * DISABLED: ApplicationInsights SDK is incompatible with React 19
 * Error: "Cannot set properties of undefined (setting 'Activity')"
 *
 * This file re-exports stubs from the main index to maintain backwards compatibility.
 */

export {
  FleetEvents,
  trackVehicleCreated,
  trackVehicleUpdated,
  trackVehicleDeleted,
  trackVehicleStatusChanged,
  trackVehicleAssignment,
  trackMaintenanceScheduled,
  trackMaintenanceCompleted,
  trackMaintenanceCancelled,
  trackInspectionCompleted,
  trackUserLogin,
  trackUserLogout,
  trackUserLoginFailed,
  trackSessionExpired,
  trackSearchPerformed,
  trackSearchFilterApplied,
  trackSearchExported,
  trackDriverCreated,
  trackDriverUpdated,
  trackTripStarted,
  trackTripCompleted,
  trackDocumentUploaded,
  trackDocumentDownloaded,
  trackReportGenerated,
  trackReportExported,
  trackMapViewed,
  trackRouteCalculated,
  trackFeatureUsed,
  trackAIAssistantUsed,
  createOperationTimer,
  trackPageLoad,
} from './index';

export type {
  FleetEventName,
  VehicleEventData,
  MaintenanceEventData,
  UserEventData,
  SearchEventData,
  DriverEventData,
  TripEventData,
  DocumentEventData,
  ReportEventData,
} from './index';
