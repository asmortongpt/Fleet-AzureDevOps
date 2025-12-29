// server/src/validators/vehicle.validator.ts
import { z } from 'zod';

export const createVehicleSchema = z.object({
  make: z.string().trim().min(1).max(50),
  model: z.string().trim().min(1).max(50),
  year: z.number().int().min(1900).max(2030),
  vin: z.string().length(17).regex(/^[A-HJ-NPR-Z0-9]{17}$/),
  status: z.enum(['active', 'maintenance', 'retired']),
  licensePlate: z.string().trim().max(20).optional(),
  tenantId: z.number().int().positive()
}).strict();

export const updateVehicleSchema = z.object({
  vehicleId: z.number().int().positive(),
  make: z.string().trim().min(1).max(50).optional(),
  model: z.string().trim().min(1).max(50).optional(),
  year: z.number().int().min(1900).max(2030).optional(),
  vin: z.string().length(17).regex(/^[A-HJ-NPR-Z0-9]{17}$/).optional(),
  status: z.enum(['active', 'maintenance', 'retired']).optional(),
  licensePlate: z.string().trim().max(20).optional(),
  tenantId: z.number().int().positive()
}).strict();

export const vehicleFilterSchema = z.object({
  make: z.string().trim().max(50).optional(),
  model: z.string().trim().max(50).optional(),
  year: z.number().int().min(1900).max(2030).optional(),
  status: z.enum(['active', 'maintenance', 'retired']).optional(),
  tenantId: z.number().int().positive()
}).strict();

// server/src/validators/driver.validator.ts

export const createDriverSchema = z.object({
  firstName: z.string().trim().min(1).max(50),
  lastName: z.string().trim().min(1).max(50),
  email: z.string().email().max(100),
  phone: z.string().regex(/^\+?[1-9]\d{1,14}$/).optional(),
  licenseNumber: z.string().trim().max(20),
  tenantId: z.number().int().positive()
}).strict();

export const updateDriverSchema = z.object({
  driverId: z.number().int().positive(),
  firstName: z.string().trim().min(1).max(50).optional(),
  lastName: z.string().trim().min(1).max(50).optional(),
  email: z.string().email().max(100).optional(),
  phone: z.string().regex(/^\+?[1-9]\d{1,14}$/).optional(),
  licenseNumber: z.string().trim().max(20).optional(),
  tenantId: z.number().int().positive()
}).strict();

// server/src/validators/maintenance.validator.ts

export const createMaintenanceSchema = z.object({
  vehicleId: z.number().int().positive(),
  description: z.string().trim().min(1).max(500),
  scheduledDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  status: z.enum(['scheduled', 'in-progress', 'completed']),
  tenantId: z.number().int().positive()
}).strict();

export const updateMaintenanceSchema = z.object({
  maintenanceId: z.number().int().positive(),
  description: z.string().trim().min(1).max(500).optional(),
  scheduledDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  status: z.enum(['scheduled', 'in-progress', 'completed']).optional(),
  tenantId: z.number().int().positive()
}).strict();

// server/src/validators/index.ts
// Additional validators for asset management, telemetry, user management, and reports would follow a similar pattern, ensuring all fields are validated according to the requirements specified. Each schema would be exported from its respective file and then re-exported from this index file for easy import into the application.