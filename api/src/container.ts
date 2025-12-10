import "reflect-metadata";
import { Container } from "inversify";

// Controllers
import { DriverController } from "./modules/drivers/controllers/driver.controller";
import { FacilityController } from "./modules/facilities/controllers/facility.controller";
import { VehicleController } from "./modules/fleet/controllers/vehicle.controller";
import { IncidentController } from "./modules/incidents/controllers/incident.controller";
import { InspectionController } from "./modules/inspections/controllers/inspection.controller";
import { MaintenanceController } from "./modules/maintenance/controllers/maintenance.controller";
import { WorkOrderController } from "./modules/work-orders/controllers/work-order.controller";

// Services - Module Pattern
import { DriverService } from "./modules/drivers/services/driver.service";
import { FacilityService } from "./modules/facilities/services/facility.service";
import { VehicleService } from "./modules/fleet/services/vehicle.service";
import { IncidentService } from "./modules/incidents/services/incident.service";
import { InspectionService } from "./modules/inspections/services/inspection.service";
import { MaintenanceService } from "./modules/maintenance/services/maintenance.service";
import { WorkOrderService } from "./modules/work-orders/services/work-order.service";

// Services - Monitoring & Logging (Batch 1)
import { ApplicationInsightsService } from "./config/app-insights";
import { CacheService } from "./config/cache";
import { SentryService } from "./monitoring/sentry";
import { AnalyticsService } from "./services/analytics/analytics.service";
import { NotificationService } from "./services/notifications/notification.service";
import { JobQueueService } from "./services/queue/job-queue.service";
import { MCPServerService } from "./services/mcp-server.service";
import { CustomFieldsService } from "./services/custom-fields/custom-fields.service";
import { QueueService } from "./services/queue.service";
import { CameraSyncService } from "./services/camera-sync";
import { EmailNotificationService } from "./services/email-notifications";

// Repositories - Module Pattern
import { DriverRepository } from "./modules/drivers/repositories/driver.repository";
import { FacilityRepository } from "./modules/facilities/repositories/facility.repository";
import { VehicleRepository } from "./modules/fleet/repositories/vehicle.repository";
import { IncidentRepository } from "./modules/incidents/repositories/incident.repository";
import { InspectionRepository } from "./modules/inspections/repositories/inspection.repository";
import { MaintenanceRepository } from "./modules/maintenance/repositories/maintenance.repository";
import { WorkOrderRepository } from "./modules/work-orders/repositories/work-order.repository";

// Repositories - Other
import { BreakGlassRepository } from "./repositories/BreakGlassRepository";
import { GeofenceRepository } from "./repositories/GeofenceRepository";
import { SyncRepository } from "./repositories/SyncRepository";
import { VideoEventRepository } from "./repositories/VideoEventRepository";
import { TripRepository } from "./repositories/TripRepository";
import { TripUsageRepository } from "./repositories/TripUsageRepository";
import { PersonalUsePolicyRepository } from "./repositories/PersonalUsePolicyRepository";
import { ReimbursementRequestRepository } from "./repositories/ReimbursementRequestRepository";
import { HealthCheckRepository } from "./repositories/HealthCheckRepository";
import { RouteRepository } from "./repositories/RouteRepository";
import { PermissionRepository } from "./repositories/PermissionRepository";
import { VehicleAssignmentRepository } from "./repositories/VehicleAssignmentRepository";
import { ReservationRepository } from "./repositories/ReservationRepository";
import { TelematicsRepository } from "./repositories/TelematicsRepository";
import { AlertRepository } from "./repositories/AlertRepository";
import { AttachmentRepository } from "./repositories/AttachmentRepository";
import { ChargingSessionRepository } from "./repositories/ChargingSessionRepository";
import { ChargingStationRepository } from "./repositories/ChargingStationRepository";
import { CostRepository } from "./repositories/CostRepository";
import { DamageReportRepository } from "./repositories/DamageReportRepository";
import { DeploymentRepository } from "./repositories/DeploymentRepository";
import { DocumentRepository } from "./repositories/DocumentRepository";
import { FuelRepository } from "./repositories/FuelRepository";
import { InvoiceRepository } from "./repositories/InvoiceRepository";
import { PartRepository } from "./repositories/PartRepository";
import { PolicyRepository } from "./repositories/PolicyRepository";
import { PurchaseOrderRepository } from "./repositories/PurchaseOrderRepository";
import { ReimbursementRepository } from "./repositories/ReimbursementRepository";
import { TaskRepository } from "./repositories/TaskRepository";
import { VendorRepository } from "./repositories/VendorRepository";

import { TYPES } from "./types";

const container = new Container();

// Fleet module
container.bind(TYPES.VehicleService).to(VehicleService);
container.bind(TYPES.VehicleRepository).to(VehicleRepository);
container.bind(TYPES.VehicleController).to(VehicleController);

// Drivers module
container.bind(TYPES.DriverService).to(DriverService);
container.bind(TYPES.DriverRepository).to(DriverRepository);
container.bind(TYPES.DriverController).to(DriverController);

// Maintenance module
container.bind(TYPES.MaintenanceService).to(MaintenanceService);
container.bind(TYPES.MaintenanceRepository).to(MaintenanceRepository);
container.bind(TYPES.MaintenanceController).to(MaintenanceController);

// Facilities module
container.bind(TYPES.FacilityService).to(FacilityService);
container.bind(TYPES.FacilityRepository).to(FacilityRepository);
container.bind(TYPES.FacilityController).to(FacilityController);

// Work Orders module
container.bind(TYPES.WorkOrderService).to(WorkOrderService);
container.bind(TYPES.WorkOrderRepository).to(WorkOrderRepository);
container.bind(TYPES.WorkOrderController).to(WorkOrderController);

// Incidents module
container.bind(TYPES.IncidentService).to(IncidentService);
container.bind(TYPES.IncidentRepository).to(IncidentRepository);
container.bind(TYPES.IncidentController).to(IncidentController);

// Inspections module
container.bind(TYPES.InspectionService).to(InspectionService);
container.bind(TYPES.InspectionRepository).to(InspectionRepository);
container.bind(TYPES.InspectionController).to(InspectionController);

// Break-Glass module
container.bind(TYPES.BreakGlassRepository).to(BreakGlassRepository);

// Geofence module
container.bind(TYPES.GeofenceRepository).to(GeofenceRepository);

// Sync module
container.bind(TYPES.SyncRepository).to(SyncRepository);

// Video Event module
container.bind(TYPES.VideoEventRepository).to(VideoEventRepository);

// Trip and Personal Use modules
container.bind(TYPES.TripRepository).to(TripRepository);
container.bind(TYPES.TripUsageRepository).to(TripUsageRepository);
container.bind(TYPES.PersonalUsePolicyRepository).to(PersonalUsePolicyRepository);
container.bind(TYPES.ReimbursementRequestRepository).to(ReimbursementRequestRepository);

// Health Check module
container.bind(TYPES.HealthCheckRepository).to(HealthCheckRepository);

// Route module
container.bind(TYPES.RouteRepository).to(RouteRepository);

// Permission module
container.bind(TYPES.PermissionRepository).to(PermissionRepository);

// Vehicle Assignment module
container.bind(TYPES.VehicleAssignmentRepository).to(VehicleAssignmentRepository);

// Reservation module
container.bind(TYPES.ReservationRepository).to(ReservationRepository);

// Telematics module
container.bind(TYPES.TelematicsRepository).to(TelematicsRepository);

// Additional Core Repositories
container.bind(TYPES.AlertRepository).to(AlertRepository);
container.bind(TYPES.AttachmentRepository).to(AttachmentRepository);
container.bind(TYPES.ChargingSessionRepository).to(ChargingSessionRepository);
container.bind(TYPES.ChargingStationRepository).to(ChargingStationRepository);
container.bind(TYPES.CostRepository).to(CostRepository);
container.bind(TYPES.DamageReportRepository).to(DamageReportRepository);
container.bind(TYPES.DeploymentRepository).to(DeploymentRepository);
container.bind(TYPES.DocumentRepository).to(DocumentRepository);
container.bind(TYPES.FuelRepository).to(FuelRepository);
container.bind(TYPES.InvoiceRepository).to(InvoiceRepository);
container.bind(TYPES.PartRepository).to(PartRepository);
container.bind(TYPES.PolicyRepository).to(PolicyRepository);
container.bind(TYPES.PurchaseOrderRepository).to(PurchaseOrderRepository);
container.bind(TYPES.ReimbursementRepository).to(ReimbursementRepository);
container.bind(TYPES.TaskRepository).to(TaskRepository);
container.bind(TYPES.VendorRepository).to(VendorRepository);

// Monitoring & Logging Services (Batch 1)
container.bind(TYPES.ApplicationInsightsService).to(ApplicationInsightsService).inSingletonScope();
container.bind(TYPES.CacheService).to(CacheService).inSingletonScope();
container.bind(TYPES.SentryService).to(SentryService).inSingletonScope();
container.bind(TYPES.AnalyticsService).to(AnalyticsService).inSingletonScope();
container.bind(TYPES.NotificationService).to(NotificationService).inSingletonScope();
container.bind(TYPES.JobQueueService).to(JobQueueService).inSingletonScope();
container.bind(TYPES.MCPServerService).to(MCPServerService).inSingletonScope();
container.bind(TYPES.CustomFieldsService).to(CustomFieldsService).inSingletonScope();
container.bind(TYPES.QueueService).to(QueueService).inSingletonScope();
container.bind(TYPES.CameraSyncService).to(CameraSyncService).inSingletonScope();
container.bind(TYPES.EmailNotificationService).to(EmailNotificationService).inSingletonScope();

export { container };
