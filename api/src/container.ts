import "reflect-metadata";
import { Container } from "inversify";

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
import { MaintenanceService } from "./modules/maintenance/services/maintenance.service";
import { WorkOrderController } from "./modules/work-orders/controllers/work-order.controller";
import { WorkOrderRepository } from "./modules/work-orders/repositories/work-order.repository";
import { WorkOrderService } from "./modules/work-orders/services/work-order.service";
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

export { container };
