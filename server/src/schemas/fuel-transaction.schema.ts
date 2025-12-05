import { z } from 'zod';

/**
 * Zod validation schema for Fuel Transactions
 * Ensures all input data meets security and business requirements
 */
export const createFuelTransactionSchema = z.object({
  vehicle_id: z.number().int().positive('Vehicle ID must be a positive integer'),
  driver_id: z.number().int().positive('Driver ID must be a positive integer').optional(),
  transaction_date: z.string().datetime().optional(),
  fuel_type: z.enum(['gasoline', 'diesel', 'electric', 'hybrid', 'cng']),
  quantity_gallons: z.number().positive('Quantity must be positive'),
  cost_per_gallon: z.number().positive('Cost per gallon must be positive'),
  total_cost: z.number().positive('Total cost must be positive'),
  odometer_reading: z.number().int().nonnegative('Odometer reading must be non-negative'),
  location: z.string().max(255).optional(),
  receipt_number: z.string().max(100).optional(),
  notes: z.string().max(5000).optional()
});

export const updateFuelTransactionSchema = z.object({
  driver_id: z.number().int().positive().optional(),
  fuel_type: z.enum(['gasoline', 'diesel', 'electric', 'hybrid', 'cng']).optional(),
  quantity_gallons: z.number().positive().optional(),
  cost_per_gallon: z.number().positive().optional(),
  total_cost: z.number().positive().optional(),
  odometer_reading: z.number().int().nonnegative().optional(),
  location: z.string().max(255).optional(),
  receipt_number: z.string().max(100).optional(),
  notes: z.string().max(5000).optional()
});

export type CreateFuelTransactionInput = z.infer<typeof createFuelTransactionSchema>;
export type UpdateFuelTransactionInput = z.infer<typeof updateFuelTransactionSchema>;
