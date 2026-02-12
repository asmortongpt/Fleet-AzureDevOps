import "reflect-metadata";
import { Container } from "inversify";

import { connectionManager } from "./config/connection-manager";
import { DriverController } from "./modules/drivers/controllers/driver.controller";
import { DriverRepository } from "./modules/drivers/repositories/driver.repository";
import { DriverService } from "./modules/drivers/services/driver.service";
import { FacilityController } from "./modules/facilities/controllers/facility.controller";
import { FacilityRepository } from "./modules/facilities/repositories/facility.repository";
import { FacilityService } from "./modules/facilities/services/facility.service";
import { VehicleController } from "./modules/fleet/controllers/vehicle.controller";
import { VehicleRepository } from "./modules/fleet/repositories/vehicle.repository";
import { VehicleService } from "./modules/fleet/services/vehicle.service";
import { IncidentController } from "./modules/incidents/controllers/incident.controller";
import { IncidentRepository } from "./modules/incidents/repositories/incident.repository";
import { IncidentService } from "./modules/incidents/services/incident.service";
import { InspectionController } from "./modules/inspections/controllers/inspection.controller";
import { InspectionRepository } from "./modules/inspections/repositories/inspection.repository";
import { InspectionService } from "./modules/inspections/services/inspection.service";
import { MaintenanceController } from "./modules/maintenance/controllers/maintenance.controller";
import { MaintenanceRepository } from "./modules/maintenance/repositories/maintenance.repository";
import { MaintenanceScheduleRepository } from "./modules/maintenance/repositories/maintenance-schedule.repository";
import { MaintenanceService } from "./modules/maintenance/services/maintenance.service";
import { WorkOrderController } from "./modules/work-orders/controllers/work-order.controller";
import { WorkOrderRepository } from "./modules/work-orders/repositories/work-order.repository";
import { WorkOrderPartsRepository } from "./modules/work-orders/repositories/work-order-parts.repository";
import { WorkOrderLaborRepository } from "./modules/work-orders/repositories/work-order-labor.repository";
import { WorkOrderService } from "./modules/work-orders/services/work-order.service";
import { BreakGlassRepository } from "./repositories/BreakGlassRepository";
import { PermissionsRepository } from "./repositories/PermissionsRepository";
import { PersonalUsePoliciesRepository } from "./repositories/PersonalUsePoliciesRepository";
import { AttachmentRepository } from "./repositories/attachments.repository";

// Fuel Transaction Service

// Push Notification Repository (Agent 57 - B3 Refactoring)
import { PushNotificationRepository } from './repositories/push-notification.repository';
import { VehicleAssignmentsRepository } from "./repositories/vehicle-assignments.repository";
import { FueltransactionService } from "./services/FuelTransactionService";
import { FuelCardService } from "./services/FuelCardService";
import { FuelCardReconciliationService } from "./services/fuel-card-reconciliation";
import { AssignmentNotificationService } from "./services/assignment-notification.service";
import { CacheService } from "./services/cache.service";
import { TYPES } from "./types";

const container = new Container();

// Infrastructure - Database Pool (lazy initialization)
container.bind(TYPES.DatabasePool).toDynamicValue(() => connectionManager.getPool());

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
container.bind(TYPES.MaintenanceScheduleRepository).to(MaintenanceScheduleRepository);
container.bind(TYPES.MaintenanceController).to(MaintenanceController);

// Facilities module
container.bind(TYPES.FacilityService).to(FacilityService);
container.bind(TYPES.FacilityRepository).to(FacilityRepository);
container.bind(TYPES.FacilityController).to(FacilityController);

// Work Orders module
container.bind(TYPES.WorkOrderService).to(WorkOrderService);
container.bind(TYPES.WorkOrderRepository).to(WorkOrderRepository);
container.bind(TYPES.WorkOrderPartsRepository).to(WorkOrderPartsRepository);
container.bind(TYPES.WorkOrderLaborRepository).to(WorkOrderLaborRepository);
container.bind(TYPES.WorkOrderController).to(WorkOrderController);

// Incidents module
container.bind(TYPES.IncidentService).to(IncidentService);
container.bind(TYPES.IncidentRepository).to(IncidentRepository);
container.bind(TYPES.IncidentController).to(IncidentController);

// Inspections module
container.bind(TYPES.InspectionService).to(InspectionService);
container.bind(TYPES.InspectionRepository).to(InspectionRepository);
container.bind(TYPES.InspectionController).to(InspectionController);

// Break-Glass Repository
container.bind(TYPES.BreakGlassRepository).to(BreakGlassRepository);

// Personal Use Policies Repository
container.bind(TYPES.PersonalUsePoliciesRepository).to(PersonalUsePoliciesRepository);

// Permissions Repository
container.bind(TYPES.PermissionsRepository).to(PermissionsRepository);

// Attachments Repository
container.bind(TYPES.AttachmentRepository).to(AttachmentRepository);

// Vehicle Assignments Repository (Agent 51 - B3 Refactoring)
container.bind(TYPES.VehicleAssignmentsRepository).to(VehicleAssignmentsRepository);

// Assignment Notification Service
container.bind(TYPES.AssignmentNotificationService).to(AssignmentNotificationService);

// Fuel Services
container.bind(TYPES.FuelTransactionService).to(FueltransactionService);
container.bind(TYPES.FuelCardService).to(FuelCardService);
container.bind(TYPES.FuelCardReconciliationService).to(FuelCardReconciliationService);

// Cache Service
container.bind(TYPES.CacheService).to(CacheService);

export { container, TYPES };
container.bind(TYPES.PushNotificationRepository).to(PushNotificationRepository);
