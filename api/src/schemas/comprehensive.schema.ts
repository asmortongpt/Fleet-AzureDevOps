import { z } from 'zod';

// Vehicle validation schemas
export const vehicleCreateSchema = z.object({
  vin: z.string().length(17),
  make: z.string().min(1).max(50),
  model: z.string().min(1).max(50),
  year: z.number().int().min(1900).max(2100),
  licensePlate: z.string().min(1).max(20),
  status: z.enum(['active', 'maintenance', 'retired']).optional(),
});

export const vehicleUpdateSchema = vehicleCreateSchema.partial();

// Maintenance schemas
export const maintenanceRecordSchema = z.object({
  vehicleId: z.string().uuid(),
  type: z.enum(['preventive', 'corrective', 'inspection']),
  description: z.string().min(1).max(1000),
  cost: z.number().positive().optional(),
  performedAt: z.string().datetime(),
  nextDueDate: z.string().datetime().optional(),
});

// Driver schemas
export const driverCreateSchema = z.object({
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  email: z.string().email(),
  phone: z.string().min(10).max(20),
  licenseNumber: z.string().min(1).max(50),
  licenseExpiry: z.string().datetime(),
});

export const driverUpdateSchema = driverCreateSchema.partial();

// Fuel transaction schemas
export const fuelTransactionSchema = z.object({
  vehicleId: z.string().uuid(),
  driverId: z.string().uuid().optional(),
  gallons: z.number().positive(),
  costPerGallon: z.number().positive(),
  totalCost: z.number().positive(),
  odometer: z.number().int().positive(),
  location: z.string().min(1).max(200),
  transactionDate: z.string().datetime(),
});

// Work order schemas
export const workOrderSchema = z.object({
  vehicleId: z.string().uuid(),
  title: z.string().min(1).max(200),
  description: z.string().min(1).max(2000),
  priority: z.enum(['low', 'medium', 'high', 'critical']),
  status: z.enum(['pending', 'in_progress', 'completed', 'cancelled']),
  scheduledDate: z.string().datetime().optional(),
  completedDate: z.string().datetime().optional(),
});

// Inspection schemas
export const inspectionSchema = z.object({
  vehicleId: z.string().uuid(),
  inspectorId: z.string().uuid(),
  type: z.enum(['pre_trip', 'post_trip', 'annual', 'safety']),
  passedInspection: z.boolean(),
  notes: z.string().max(2000).optional(),
  inspectionDate: z.string().datetime(),
});

// Assignment schemas
export const vehicleAssignmentSchema = z.object({
  vehicleId: z.string().uuid(),
  driverId: z.string().uuid(),
  startDate: z.string().datetime(),
  endDate: z.string().datetime().optional(),
  notes: z.string().max(500).optional(),
});
