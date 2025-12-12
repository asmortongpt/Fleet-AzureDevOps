import { Container } from 'inversify';
import { IVehicleService } from './interfaces/IVehicleService';
import { IMaintenanceService } from './interfaces/IMaintenanceService';
import { VehicleService } from './services/vehicleService';
import { MaintenanceService } from './services/maintenanceService';

export const container = new Container();

container.bind<IVehicleService>('IVehicleService').to(VehicleService);
container.bind<IMaintenanceService>('IMaintenanceService').to(MaintenanceService);