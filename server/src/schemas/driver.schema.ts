import { Request, Response, NextFunction } from 'express';
import { z, ZodError } from 'zod';

import { logger } from '../utils/logger'; // Assuming a logger utility is available

// Define the Zod schema for driver validation
const driverSchema = z.object({
  id: z.string().uuid().nonempty(),
  name: z.string().min(1),
  licenseNumber: z.string().min(1),
  vehicleId: z.string().uuid().nonempty(),
  isActive: z.boolean(),
  // Additional fields can be added here
});

// Middleware for validating driver data
export const validateDriver = (req: Request, res: Response, next: NextFunction) => {
  try {
    driverSchema.parse(req.body);
    next();
  } catch (error) {
    if (error instanceof ZodError) {
      // Log the validation error details
      logger.error('Validation Error:', error.issues);

      // FedRAMP Compliance: Ensure that error messages do not expose sensitive information
      res.status(400).json({ message: 'Invalid driver data provided.' });
    } else {
      // Log unexpected errors
      logger.error('Unexpected Error:', error);

      // FedRAMP Compliance: Generic error message to avoid exposing internal details
      res.status(500).json({ message: 'An unexpected error occurred.' });
    }
  }
};

// Example usage in an Express route
// app.post('/drivers', validateDriver, (req, res) => {
//   // Handle the request knowing the data is validated
//   res.status(201).json({ message: 'Driver created successfully.' });
// });

/**
 * FedRAMP Compliance Notes:
 * - Ensure all logs are stored securely and access is restricted to authorized personnel.
 * - Implement encryption for data at rest and in transit.
 * - Regularly audit and review access logs to detect any unauthorized access.
 * - Ensure that error messages do not expose sensitive information.
 * - Maintain a secure software development lifecycle (SDLC) with regular security assessments.
 */