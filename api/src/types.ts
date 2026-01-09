export type DepreciationMethod = "STRAIGHT_LINE" | "MACRS_5YR" | "MACRS_7YR";

export type Convention = "FULL_MONTH" | "HALF_MONTH" | "ACTUAL_DAYS";

export interface PolicyMap {
  capitalization_threshold: { amount: number; currency: string };
  depreciation_convention: { type: Convention };
}

export const TYPES = {
  AssignmentNotificationService: Symbol.for("AssignmentNotificationService"),
  AttachmentRepository: Symbol.for("AttachmentRepository"),
  BreakGlassRepository: Symbol.for("BreakGlassRepository"),
  CacheService: Symbol.for("CacheService"),
  DatabasePool: Symbol.for("DatabasePool"),
  DriverController: Symbol.for("DriverController"),
  DriverRepository: Symbol.for("DriverRepository"),
  DriverService: Symbol.for("DriverService"),
  FacilityController: Symbol.for("FacilityController"),
  FacilityRepository: Symbol.for("FacilityRepository"),
  FacilityService: Symbol.for("FacilityService"),
  FuelTransactionService: Symbol.for("FuelTransactionService"),
  IncidentController: Symbol.for("IncidentController"),
  IncidentRepository: Symbol.for("IncidentRepository"),
  IncidentService: Symbol.for("IncidentService"),
  InspectionController: Symbol.for("InspectionController"),
  InspectionRepository: Symbol.for("InspectionRepository"),
  InspectionService: Symbol.for("InspectionService"),
  MaintenanceController: Symbol.for("MaintenanceController"),
  MaintenanceRepository: Symbol.for("MaintenanceRepository"),
  MaintenanceService: Symbol.for("MaintenanceService"),
  PermissionsRepository: Symbol.for("PermissionsRepository"),
  PersonalUsePoliciesRepository: Symbol.for("PersonalUsePoliciesRepository"),
  PushNotificationRepository: Symbol.for("PushNotificationRepository"),
  VehicleAssignmentsRepository: Symbol.for("VehicleAssignmentsRepository"),
  VehicleController: Symbol.for("VehicleController"),
  VehicleRepository: Symbol.for("VehicleRepository"),
  VehicleService: Symbol.for("VehicleService"),
  VehiclesRepository: Symbol.for("VehiclesRepository"),
  VehiclesService: Symbol.for("VehiclesService"),
  WorkOrderController: Symbol.for("WorkOrderController"),
  WorkOrderRepository: Symbol.for("WorkOrderRepository"),
  WorkOrderService: Symbol.for("WorkOrderService")
};
