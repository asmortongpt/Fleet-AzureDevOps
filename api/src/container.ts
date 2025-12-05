import "reflect-metadata";
import { Container } from "inversify";
import { TYPES } from "./types";
import { VehicleService } from "./modules/fleet/services/vehicle.service";
import { VehicleRepository } from "./modules/fleet/repositories/vehicle.repository";
import { VehicleController } from "./modules/fleet/controllers/vehicle.controller";
import { DriverService } from "./modules/drivers/services/driver.service";
import { DriverRepository } from "./modules/drivers/repositories/driver.repository";
import { DriverController } from "./modules/drivers/controllers/driver.controller";
import { MaintenanceService } from "./modules/maintenance/services/maintenance.service";
import { MaintenanceRepository } from "./modules/maintenance/repositories/maintenance.repository";
import { MaintenanceController } from "./modules/maintenance/controllers/maintenance.controller";
import { FacilityService } from "./modules/facilities/services/facility.service";
import { FacilityRepository } from "./modules/facilities/repositories/facility.repository";
import { FacilityController } from "./modules/facilities/controllers/facility.controller";

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

export { container };
