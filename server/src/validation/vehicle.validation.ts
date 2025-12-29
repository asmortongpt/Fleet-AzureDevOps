import { z } from 'zod';

export const createVehicleSchema = z.object({
  vin: z.string().length(17, 'VIN must be exactly 17 characters'),
  make: z.string().min(1, 'Make is required'),
  model: z.string().min(1, 'Model is required'),
  year: z.number().int().min(1900).max(new Date().getFullYear() + 1),
  licensePlate: z.string().optional(),
  color: z.string().optional(),
  mileage: z.number().nonnegative().optional(),
  status: z.enum(['active', 'inactive', 'maintenance', 'retired']).default('active'),
});

export const updateVehicleSchema = z.object({
  vin: z.string().length(17).optional(),
  make: z.string().min(1).optional(),
  model: z.string().min(1).optional(),
  year: z.number().int().min(1900).max(new Date().getFullYear() + 1).optional(),
  licensePlate: z.string().optional(),
  color: z.string().optional(),
  mileage: z.number().nonnegative().optional(),
  status: z.enum(['active', 'inactive', 'maintenance', 'retired']).optional(),
});

export const vehicleIdSchema = z.object({
  id: z.string().uuid('Invalid vehicle ID'),
});
