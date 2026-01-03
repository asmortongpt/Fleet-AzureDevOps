export interface IVehicleService {
  getVehicle(id: number): Promise<Vehicle>;
}