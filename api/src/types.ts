export const TYPES = {
  // Controllers
  VehicleController: Symbol.for("VehicleController"),
  DriverController: Symbol.for("DriverController"),
  MaintenanceController: Symbol.for("MaintenanceController"),
  FacilityController: Symbol.for("FacilityController"),
  TelemetryController: Symbol.for("TelemetryController"),
  WorkOrderController: Symbol.for("WorkOrderController"),
  IncidentController: Symbol.for("IncidentController"),
  InspectionController: Symbol.for("InspectionController"),
  DocumentController: Symbol.for("DocumentController"),

  // Services
  VehicleService: Symbol.for("VehicleService"),
  DriverService: Symbol.for("DriverService"),
  MaintenanceService: Symbol.for("MaintenanceService"),
  FacilityService: Symbol.for("FacilityService"),
  TelemetryService: Symbol.for("TelemetryService"),
  WorkOrderService: Symbol.for("WorkOrderService"),
  IncidentService: Symbol.for("IncidentService"),
  InspectionService: Symbol.for("InspectionService"),
  DocumentService: Symbol.for("DocumentService"),
  AssignmentNotificationService: Symbol.for("AssignmentNotificationService"),
  FuelTransactionService: Symbol.for("FuelTransactionService"),

  // Repositories
  VehicleRepository: Symbol.for("VehicleRepository"),
  DriverRepository: Symbol.for("DriverRepository"),
  MaintenanceRepository: Symbol.for("MaintenanceRepository"),
  FacilityRepository: Symbol.for("FacilityRepository"),
  TelemetryRepository: Symbol.for("TelemetryRepository"),
  WorkOrderRepository: Symbol.for("WorkOrderRepository"),
  IncidentRepository: Symbol.for("IncidentRepository"),
  InspectionRepository: Symbol.for("InspectionRepository"),
  DocumentRepository: Symbol.for("DocumentRepository"),
  AttachmentRepository: Symbol.for("AttachmentRepository"),
  BreakGlassRepository: Symbol.for("BreakGlassRepository"),
  PermissionsRepository: Symbol.for("PermissionsRepository"),
  PersonalUsePoliciesRepository: Symbol.for("PersonalUsePoliciesRepository"),
  VehicleAssignmentsRepository: Symbol.for("VehicleAssignmentsRepository"),
  PushNotificationRepository: Symbol.for("PushNotificationRepository"),

  // Infrastructure
  DatabasePool: Symbol.for("DatabasePool"),
};
