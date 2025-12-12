import { BadRequestError } from '@shared/core/errors';

const calculateFuelEfficiency = (distance: number, fuelConsumed: number): number => {
  if (distance <= 0 || fuelConsumed <= 0) {
    throw new BadRequestError('Distance and fuel consumed must be positive numbers');
  }
  return distance / fuelConsumed;
};

const estimateFuelCost = (distance: number, fuelEfficiency: number, fuelPricePerLiter: number): number => {
  if (distance <= 0 || fuelEfficiency <= 0 || fuelPricePerLiter <= 0) {
    throw new BadRequestError('Distance, fuel efficiency, and fuel price must be positive numbers');
  }
  const fuelNeeded = distance / fuelEfficiency;
  return fuelNeeded * fuelPricePerLiter;
};

export { calculateFuelEfficiency, estimateFuelCost };