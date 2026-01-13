import { Vehicle } from '../types/vehicle';

export interface IVehicleService {
  getVehicle(id: number): Promise<Vehicle>;
}