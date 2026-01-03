/**
 * DrilldownManager - Global manager for drilldown system
 * Wraps app with provider, renders breadcrumbs and panel, handles keyboard shortcuts
 */

import React from 'react'

import { DrilldownBreadcrumbs } from '@/components/DrilldownBreadcrumbs'
import { DrilldownPanel } from '@/components/DrilldownPanel'
import {
  IncidentsDrilldown,
  SafetyScoreDetailDrilldown,
  VideoTelematicsDrilldown,
  DispatchDrilldown,
  RoutesDrilldown,
  TasksDrilldown,
  VendorsDrilldown,
  PartsInventoryDrilldown,
  PurchaseOrdersDrilldown,
  FuelPurchasingDrilldown
} from '@/components/drilldown/AdditionalHubDrilldowns'
import {
  JobListView,
  RouteListView,
  TaskListView
} from '@/components/drilldown/OperationsHubDrilldowns'
import { JobDetailPanel } from '@/components/drilldown/JobDetailPanel'
import { RouteDetailPanel } from '@/components/drilldown/RouteDetailPanel'
import { TaskDetailPanel } from '@/components/drilldown/TaskDetailPanel'
import { VehicleAssignmentDrilldown } from '@/components/drilldown/VehicleAssignmentDrilldown'
import { OperationsPerformanceDrilldown } from '@/components/drilldown/OperationsPerformanceDrilldown'
import {
  IncidentListView,
  LostTimeIncidentsView,
  OSHAComplianceView,
  DaysIncidentFreeView
} from '@/components/drilldown/SafetyHubDrilldowns'
import { IncidentDetailPanel } from '@/components/drilldown/IncidentDetailPanel'
import { HazardZoneDetailPanel } from '@/components/drilldown/HazardZoneDetailPanel'
import {
  InspectionListView,
  SafetyInspectionDetailPanel
} from '@/components/drilldown/SafetyInspectionDrilldowns'
import {
  TrainingRecordsView,
  CertificationsView,
  TrainingScheduleView
} from '@/components/drilldown/SafetyTrainingDrilldowns'
import {
  ViolationsListView,
  ComplianceViolationDetailPanel
} from '@/components/drilldown/SafetyComplianceDrilldowns'
import {
  SystemHealthDrilldown,
  AlertsDrilldown,
  FilesDrilldown
} from '@/components/drilldown/AdminHubDrilldowns'
import {
  AiAgentDrilldown,
  MessagesDrilldown,
  EmailDrilldown,
  HistoryDrilldown
} from '@/components/drilldown/CommunicationHubDrilldowns'
import {
  RegulationsDrilldown,
  GeofenceComplianceDrilldown,
  InspectionsDrilldown,
  IFTADrilldown,
  CSADrilldown
} from '@/components/drilldown/ComplianceHubDrilldowns'
import { DriverDetailPanel } from '@/components/drilldown/DriverDetailPanel'
import { DriverPerformanceView } from '@/components/drilldown/DriverPerformanceView'
import { DriverTripsView } from '@/components/drilldown/DriverTripsView'
import { FacilityDetailPanel } from '@/components/drilldown/FacilityDetailPanel'
import { FacilityVehiclesView } from '@/components/drilldown/FacilityVehiclesView'
import {
  FleetOverviewDrilldown,
  ActiveVehiclesDrilldown,
  MaintenanceDrilldown,
  FuelStatsDrilldown,
  PerformanceMetricsDrilldown,
  DriverStatsDrilldown,
  UtilizationDrilldown,
  SafetyScoreDrilldown,
  VehicleListDrilldown
} from '@/components/drilldown/FleetStatsDrilldowns'
import {
  VehicleDetailsDrilldown,
  UtilizationDetailsDrilldown,
  CostDetailsDrilldown,
  ComplianceDetailsDrilldown
} from '@/components/drilldown/FleetHubCompleteDrilldowns'
import {
  DriversRosterDrilldown,
  DriverPerformanceDrilldown,
  DriverScorecardDrilldown,
  GarageDrilldown,
  PredictiveMaintenanceDrilldown,
  MaintenanceCalendarDrilldown,
  ExecutiveDashboardDrilldown,
  CostAnalysisDrilldown,
  FleetOptimizerDrilldown
} from '@/components/drilldown/HubDrilldowns'
import { LaborDetailsView } from '@/components/drilldown/LaborDetailsView'
import { PartsBreakdownView } from '@/components/drilldown/PartsBreakdownView'
import { TripTelemetryView } from '@/components/drilldown/TripTelemetryView'
import { VehicleDetailPanel } from '@/components/drilldown/VehicleDetailPanel'
import { VehicleTripsList } from '@/components/drilldown/VehicleTripsList'
import { WorkOrderDetailPanel } from '@/components/drilldown/WorkOrderDetailPanel'
import {
  AssetDetailPanel,
  EquipmentDetailPanel,
  InventoryItemDetailPanel,
  AssetListView,
  EquipmentListView,
  InventoryListView
} from '@/components/drilldown/AssetHubDrilldowns'
import {
  MaintenanceRequestDetailPanel,
  MaintenanceRequestListView
} from '@/components/drilldown/MaintenanceRequestDrilldowns'
import {
  PMScheduleDetailPanel,
  RepairDetailPanel,
  InspectionDetailPanel,
  ServiceRecordDetailPanel,
  ServiceVendorDetailPanel
} from '@/components/drilldown/MaintenanceHubDrilldowns'
import {
  ScheduledItemDetailPanel,
  CalendarListView
} from '@/components/drilldown/ScheduleDrilldowns'
import {
  AlertDetailPanel,
  AlertListView
} from '@/components/drilldown/AlertDrilldowns'
import { PolicyDetailPanel } from '@/components/drilldown/PolicyDetailPanel'
import { ViolationDetailPanel } from '@/components/drilldown/ViolationDetailPanel'
import { PolicyTemplateDetailPanel } from '@/components/drilldown/PolicyTemplateDetailPanel'
import { PolicyExecutionView } from '@/components/drilldown/PolicyExecutionView'
import { DrilldownProvider, useDrilldown } from '@/contexts/DrilldownContext'

interface DrilldownManagerProps {
  children: React.ReactNode
}

function DrilldownContent() {
  const { currentLevel } = useDrilldown()

  if (!currentLevel) return null

  // Render the appropriate component based on the current level type
  switch (currentLevel.type) {
    // ============================================
    // Fleet-Level Stats Drilldowns
    // ============================================
    case 'fleet-overview':
    case 'total-vehicles':
      return <FleetOverviewDrilldown />

    case 'active-vehicles':
      return <ActiveVehiclesDrilldown />

    case 'maintenance-vehicles':
    case 'all-vehicles':
    case 'vehicle-list':
      return <VehicleListDrilldown />

    case 'maintenance-stats':
    case 'maintenance':
      return <MaintenanceDrilldown />

    case 'fuel-stats':
    case 'fuel-today':
      return <FuelStatsDrilldown />

    case 'performance-metrics':
    case 'miles-day':
    case 'on-time':
    case 'idle-time':
    case 'mpg':
      return <PerformanceMetricsDrilldown />

    case 'drivers-stats':
      return <DriverStatsDrilldown />

    case 'utilization':
    case 'fleet-utilization':
      return <UtilizationDrilldown />

    case 'safety-score':
    case 'safety':
      return <SafetyScoreDrilldown />

    // ============================================
    // Vehicle drilldown hierarchy
    // ============================================
    case 'vehicle':
      return <VehicleDetailPanel vehicleId={currentLevel.data?.vehicleId} />

    case 'vehicle-detail':
      return <VehicleDetailPanel vehicleId={currentLevel.data?.vehicleId} />

    case 'vehicle-details-complete':
      return <VehicleDetailsDrilldown />

    case 'vehicle-utilization':
    case 'utilization-details':
      return <UtilizationDetailsDrilldown />

    case 'vehicle-cost':
    case 'cost-details':
    case 'tco-analysis':
      return <CostDetailsDrilldown />

    case 'vehicle-compliance':
    case 'compliance-details':
      return <ComplianceDetailsDrilldown />

    case 'vehicle-trips':
      return (
        <VehicleTripsList
          vehicleId={currentLevel.data?.vehicleId}
          vehicleName={currentLevel.data?.vehicleName}
        />
      )

    case 'trip-telemetry':
      return (
        <TripTelemetryView
          tripId={currentLevel.data?.tripId}
          trip={currentLevel.data?.trip}
        />
      )

    // ============================================
    // Driver drilldown hierarchy
    // ============================================
    case 'driver':
      return <DriverDetailPanel driverId={currentLevel.data?.driverId} />

    case 'driver-detail':
      return <DriverDetailPanel driverId={currentLevel.data?.driverId} />

    case 'driver-performance':
      return (
        <DriverPerformanceView
          driverId={currentLevel.data?.driverId}
          driverName={currentLevel.data?.driverName}
        />
      )

    case 'driver-trips':
      return (
        <DriverTripsView
          driverId={currentLevel.data?.driverId}
          driverName={currentLevel.data?.driverName}
        />
      )

    // ============================================
    // Maintenance drilldown hierarchy
    // ============================================
    case 'workOrder':
      return <WorkOrderDetailPanel workOrderId={currentLevel.data?.workOrderId} />

    case 'work-order-detail':
      return <WorkOrderDetailPanel workOrderId={currentLevel.data?.workOrderId} />

    case 'work-order-parts':
      return (
        <PartsBreakdownView
          workOrderId={currentLevel.data?.workOrderId}
          workOrderNumber={currentLevel.data?.workOrderNumber}
        />
      )

    case 'work-order-labor':
      return (
        <LaborDetailsView
          workOrderId={currentLevel.data?.workOrderId}
          workOrderNumber={currentLevel.data?.workOrderNumber}
        />
      )


    // ============================================
    // Drivers Hub Drilldowns
    // ============================================
    case 'drivers-roster':
    case 'total-drivers':
    case 'on-duty':
      return <DriversRosterDrilldown />

    case 'driver-performance-hub':
    case 'top-performers':
    case 'needs-coaching':
      return <DriverPerformanceDrilldown />

    case 'driver-scorecard':
    case 'fleet-avg-score':
      return <DriverScorecardDrilldown />

    // ============================================
    // Maintenance Hub Drilldowns
    // ============================================
    case 'garage-overview':
    case 'work-orders':
    case 'bay-utilization':
    case 'in-progress':
      return <GarageDrilldown />

    case 'predictive-maintenance':
    case 'predictions-active':
      return <PredictiveMaintenanceDrilldown />

    case 'maintenance-calendar':
    case 'maintenance-today':
    case 'maintenance-overdue':
      return <MaintenanceCalendarDrilldown />

    // ============================================
    // Analytics Hub Drilldowns
    // ============================================
    case 'executive-dashboard':
    case 'fleet-kpis':
      return <ExecutiveDashboardDrilldown />

    case 'cost-analysis':
    case 'total-tco':
    case 'fuel-cost':
      return <CostAnalysisDrilldown />

    case 'fleet-optimizer':
    case 'optimization-recommendations':
      return <FleetOptimizerDrilldown />

    // ============================================
    // Safety Hub Drilldowns
    // ============================================
    // Incident views
    case 'incidents':
    case 'open-incidents':
    case 'under-review':
      return <IncidentListView filter={currentLevel.data?.filter} />

    case 'incident':
      return <IncidentDetailPanel incidentId={currentLevel.data?.incidentId} />

    // OSHA and compliance
    case 'lost-time-incidents':
      return <LostTimeIncidentsView />

    case 'osha-compliance':
      return <OSHAComplianceView />

    case 'days-incident-free':
      return <DaysIncidentFreeView />

    case 'safety-score-detail':
      return <SafetyScoreDetailDrilldown />

    // Hazard zones
    case 'hazard-zone':
      return <HazardZoneDetailPanel hazardZoneId={currentLevel.data?.hazardZoneId} />

    // Safety Inspections
    case 'safety-inspections':
    case 'inspections-failed':
    case 'inspections-due':
    case 'inspections-overdue':
    case 'inspections-violations':
      return <InspectionListView filter={currentLevel.data?.filter} />

    case 'safety-inspection':
    case 'safety-inspection-detail':
      return <SafetyInspectionDetailPanel inspectionId={currentLevel.data?.inspectionId} />

    // Training and Certifications
    case 'training-records':
    case 'training-completed':
    case 'training-in-progress':
    case 'training-scheduled':
    case 'training-expired':
      return <TrainingRecordsView filter={currentLevel.data?.filter} />

    case 'certifications':
    case 'certifications-active':
    case 'certifications-expiring':
    case 'certifications-expired':
    case 'certifications-renewal':
      return <CertificationsView filter={currentLevel.data?.filter} />

    case 'training-schedule':
      return <TrainingScheduleView />

    // Compliance Violations
    case 'compliance-violations':
    case 'violations-open':
    case 'violations-critical':
    case 'violations-unpaid':
    case 'violations-overdue':
      return <ViolationsListView filter={currentLevel.data?.filter} />

    case 'compliance-violation':
    case 'compliance-violation-detail':
      return <ComplianceViolationDetailPanel violationId={currentLevel.data?.violationId} />

    // Video telematics
    case 'video-telematics':
    case 'cameras-online':
    case 'events-today':
      return <VideoTelematicsDrilldown />

    // ============================================
    // Operations Hub Drilldowns
    // ============================================
    // Jobs/Dispatch
    case 'dispatch':
    case 'active-jobs':
    case 'delayed':
    case 'completed-jobs':
      return <JobListView filter={currentLevel.data?.filter} />

    case 'in-transit':
      return <JobListView filter="active" />

    case 'job':
    case 'job-detail':
      return <JobDetailPanel jobId={currentLevel.data?.jobId} />

    // Routes
    case 'routes':
    case 'active-routes':
    case 'optimized-today':
      return <RouteListView filter={currentLevel.data?.filter} />

    case 'route':
    case 'route-detail':
      return <RouteDetailPanel routeId={currentLevel.data?.routeId} />

    // Tasks
    case 'tasks':
    case 'open-tasks':
    case 'overdue-tasks':
      return <TaskListView filter={currentLevel.data?.filter} />

    case 'task':
    case 'task-detail':
      return <TaskDetailPanel taskId={currentLevel.data?.taskId} />

    // Vehicle Assignments
    case 'vehicle-assignments':
    case 'current-assignments':
    case 'assignment-history':
      return <VehicleAssignmentDrilldown filter={currentLevel.data?.filter} />

    // Operations Performance
    case 'ops-performance':
    case 'efficiency-metrics':
    case 'operations-metrics':
      return <OperationsPerformanceDrilldown />

    // ============================================
    // Procurement Hub Drilldowns
    // ============================================
    case 'vendors':
    case 'active-vendors':
      return <VendorsDrilldown />

    case 'parts-inventory':
    case 'total-skus':
    case 'low-stock':
    case 'out-of-stock':
      return <PartsInventoryDrilldown />

    case 'purchase-orders':
    case 'open-pos':
    case 'in-transit-pos':
      return <PurchaseOrdersDrilldown />

    case 'fuel-purchasing':
    case 'fuel-cards':
      return <FuelPurchasingDrilldown />

    // ============================================
    // Communication Hub Drilldowns
    // ============================================
    case 'ai-agent':
    case 'ai-conversations':
    case 'ai-satisfaction':
      return <AiAgentDrilldown />

    case 'messages':
    case 'messages-today':
    case 'channels':
    case 'automations':
      return <MessagesDrilldown />

    case 'email':
    case 'email-templates':
    case 'open-rate':
    case 'scheduled-emails':
      return <EmailDrilldown />

    case 'communication-history':
    case 'flagged':
    case 'archived':
      return <HistoryDrilldown />

    // ============================================
    // Compliance Hub Drilldowns
    // ============================================
    case 'regulations':
    case 'dot-compliance':
    case 'ifta-compliance':
      return <RegulationsDrilldown />

    case 'geofence-compliance':
    case 'compliant-zones':
    case 'attention-zones':
      return <GeofenceComplianceDrilldown />

    case 'inspections':
    case 'inspections-due':
    case 'hos-violations':
    case 'eld-status':
      return <InspectionsDrilldown />

    case 'ifta':
    case 'miles-tracked':
    case 'fuel-tax-due':
      return <IFTADrilldown />

    case 'csa':
    case 'csa-pending':
    case 'incidents-ytd':
    case 'days-safe':
      return <CSADrilldown />

    // ============================================
    // Admin Hub Drilldowns
    // ============================================
    case 'system-health':
    case 'active-sessions':
    case 'uptime':
      return <SystemHealthDrilldown />

    case 'system-alerts':
    case 'critical-alerts':
    case 'resolved-today':
    case 'suppressed':
      return <AlertsDrilldown />

    case 'files':
    case 'shared-files':
    case 'uploaded-today':
      return <FilesDrilldown />

    // ============================================
    // Facility drilldown hierarchy
    // ============================================
    case 'facility':
      return <FacilityDetailPanel facilityId={currentLevel.data?.facilityId} />

    case 'facility-detail':
      return <FacilityDetailPanel facilityId={currentLevel.data?.facilityId} />

    case 'facility-vehicles':
      return (
        <FacilityVehiclesView
          facilityId={currentLevel.data?.facilityId}
          facilityName={currentLevel.data?.facilityName}
        />
      )

    // ============================================
    // Asset drilldown hierarchy
    // ============================================
    case 'asset':
    case 'asset-detail':
      return <AssetDetailPanel assetId={currentLevel.data?.assetId} />

    case 'asset-list':
      return <AssetListView filter={currentLevel.data?.filter} />

    // ============================================
    // Equipment drilldown hierarchy
    // ============================================
    case 'equipment':
    case 'equipment-detail':
      return <EquipmentDetailPanel equipmentId={currentLevel.data?.equipmentId} />

    case 'equipment-list':
      return <EquipmentListView category={currentLevel.data?.category} />

    // ============================================
    // Inventory drilldown hierarchy
    // ============================================
    case 'inventory-item':
    case 'inventory-item-detail':
      return <InventoryItemDetailPanel itemId={currentLevel.data?.itemId} />

    case 'inventory-list':
      return <InventoryListView filter={currentLevel.data?.filter} />

    // ============================================
    // Maintenance Request drilldown hierarchy
    // ============================================
    case 'maintenance-request':
    case 'maintenance-request-detail':
      return <MaintenanceRequestDetailPanel requestId={currentLevel.data?.requestId} />

    case 'maintenance-requests-list':
      return <MaintenanceRequestListView status={currentLevel.data?.status} />

    // ============================================
    // Maintenance Hub drilldown hierarchy
    // ============================================
    case 'pm-schedule-detail':
      return <PMScheduleDetailPanel scheduleId={currentLevel.data?.scheduleId} />

    case 'repair-detail':
      return <RepairDetailPanel repairId={currentLevel.data?.repairId} />

    case 'inspection-detail':
      return <InspectionDetailPanel inspectionId={currentLevel.data?.inspectionId} />

    case 'service-record-detail':
      return <ServiceRecordDetailPanel serviceRecordId={currentLevel.data?.serviceRecordId} />

    case 'service-vendor-detail':
      return <ServiceVendorDetailPanel vendorId={currentLevel.data?.vendorId} />

    // ============================================
    // Schedule drilldown hierarchy
    // ============================================
    case 'scheduled-item':
      return <ScheduledItemDetailPanel itemId={currentLevel.data?.itemId} />

    case 'calendar-list':
      return (
        <CalendarListView
          timeframe={currentLevel.data?.timeframe}
          type={currentLevel.data?.type}
        />
      )

    // ============================================
    // Alert drilldown hierarchy
    // ============================================
    case 'alert':
    case 'alert-detail':
      return <AlertDetailPanel alertId={currentLevel.data?.alertId} />

    case 'alerts-list':
      return (
        <AlertListView
          status={currentLevel.data?.status}
          severity={currentLevel.data?.severity}
        />
      )

    // ============================================
    // Policy drilldown hierarchy
    // ============================================
    case 'policy':
    case 'policy-detail':
      return <PolicyDetailPanel policyId={currentLevel.data?.policyId} />

    case 'violation':
    case 'violation-detail':
      return <ViolationDetailPanel violationId={currentLevel.data?.violationId} />

    case 'policy-template':
    case 'template-detail':
      return (
        <PolicyTemplateDetailPanel
          templateId={currentLevel.data?.templateId}
          template={currentLevel.data?.template}
        />
      )

    case 'policy-executions':
    case 'execution-history':
      return (
        <PolicyExecutionView
          policyId={currentLevel.data?.policyId}
          entityType={currentLevel.data?.entityType}
          entityId={currentLevel.data?.entityId}
        />
      )

    case 'execution-detail':
      return (
        <PolicyExecutionView
          policyId={currentLevel.data?.execution?.policy_id}
          entityType={currentLevel.data?.execution?.entity_type}
          entityId={currentLevel.data?.execution?.entity_id}
        />
      )

    // ============================================
    // Fallback for unknown types
    // ============================================
    default:
      return (
        <div className="p-6 text-center">
          <p className="text-muted-foreground">
            Unknown drilldown type: {currentLevel.type}
          </p>
        </div>
      )
  }
}

export function DrilldownManager({ children }: DrilldownManagerProps) {
  return (
    <DrilldownProvider>
      <div className="relative">
        {/* Breadcrumbs - fixed at top when drilldown is active */}
        <DrilldownBreadcrumbs />

        {/* Main content */}
        {children}

        {/* Drilldown Panel */}
        <DrilldownPanel>
          <DrilldownContent />
        </DrilldownPanel>
      </div>
    </DrilldownProvider>
  )
}

/**
 * Hook to access drilldown functionality in any component
 * Re-exported for convenience
 */
export { useDrilldown } from '@/contexts/DrilldownContext'
