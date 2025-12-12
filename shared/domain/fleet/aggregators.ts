import { BadRequestError } from '@shared/core/errors';

const aggregateVehicleData = (vehicles: any[]): object => {
  if (!Array.isArray(vehicles)) {
    throw new BadRequestError('Vehicles must be an array');
  }
  const totalDistance = vehicles.reduce((sum, vehicle) => sum + (vehicle.distance || 0), 0);
  const totalFuel = vehicles.reduce((sum, vehicle) => sum + (vehicle.fuelConsumed || 0), 0);
  const averageFuelEfficiency = totalDistance / totalFuel || 0;
  return {
    totalVehicles: vehicles.length,
    totalDistance,
    totalFuel,
    averageFuelEfficiency
  };
};

export { aggregateVehicleData };