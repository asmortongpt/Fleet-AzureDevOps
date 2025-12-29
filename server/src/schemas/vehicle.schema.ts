import { Request, Response, NextFunction } from 'express';
import { z, ZodError } from 'zod';

import { FedRAMPCompliance } from '../utils/compliance'; // Placeholder for compliance utilities
import { logger } from '../utils/logger'; // Assuming a logger utility is available

// Define the vehicle schema using Zod
const vehicleSchema = z.object({
  id: z.string().uuid().optional(),
  make: z.string().min(1, "Make is required"),
  model: z.string().min(1, "Model is required"),
  year: z.number().int().min(1886, "Year must be a valid year").max(new Date().getFullYear(), "Year cannot be in the future"),
  vin: z.string().length(17, "VIN must be exactly 17 characters"),
  mileage: z.number().int().nonnegative("Mileage cannot be negative"),
  isActive: z.boolean().optional(),
});

// Middleware for validating vehicle data
export const validateVehicle = (req: Request, res: Response, next: NextFunction) => {
  try {
    vehicleSchema.parse(req.body);
    next();
  } catch (error) {
    if (error instanceof ZodError) {
      logger.error('Validation Error:', error.issues);
      res.status(400).json({ error: 'Invalid vehicle data', details: error.issues });
    } else {
      logger.error('Unexpected Error:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }
};

// FedRAMP Compliance Note: Ensure that all logs containing sensitive information are handled according to FedRAMP guidelines.
// This includes masking sensitive data and ensuring logs are stored securely.
FedRAMPCompliance.ensureLogSecurity(logger);

// Integration Note: Ensure that this middleware is integrated into the existing Fleet Local codebase by applying it to the relevant API routes.
// Example: app.post('/api/vehicles', validateVehicle, vehicleController.createVehicle);