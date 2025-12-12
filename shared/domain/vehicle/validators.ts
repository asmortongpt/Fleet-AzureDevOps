import { BadRequestError } from '@shared/core/errors';

const validateVehicleId = (vehicleId: string): void => {
  if (!/^V-\d{6}$/.test(vehicleId)) {
    throw new BadRequestError('Invalid vehicle ID format. Must be V-XXXXXX where X is a digit.');
  }
};

const validateLicensePlate = (licensePlate: string): void => {
  if (!/^[A-Z]{3}-\d{4}$/.test(licensePlate)) {
    throw new BadRequestError('Invalid license plate format. Must be AAA-1234 where A is an uppercase letter and 1 is a digit.');
  }
};

export { validateVehicleId, validateLicensePlate };