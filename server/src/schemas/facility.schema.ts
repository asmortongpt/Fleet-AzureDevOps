import { Request, Response, NextFunction } from 'express';
import { z, ZodError } from 'zod';

import { Logger } from '../utils/logger'; // Assuming a logger utility is available

// FedRAMP Compliance: Ensure all data validations are in place to prevent unauthorized data access and data leaks.

// Define the facility schema using Zod
const facilitySchema = z.object({
  id: z.string().uuid().nonempty(), // Ensure ID is a non-empty UUID
  name: z.string().min(1, "Facility name is required").max(100, "Facility name too long"),
  location: z.object({
    address: z.string().min(1, "Address is required"),
    city: z.string().min(1, "City is required"),
    state: z.string().length(2, "State must be a 2-letter code"),
    zipCode: z.string().regex(/^\d{5}(-\d{4})?$/, "Invalid zip code format")
  }),
  capacity: z.number().int().positive("Capacity must be a positive integer"),
  status: z.enum(['active', 'inactive', 'under_maintenance']),
  createdAt: z.string().refine((date) => !isNaN(Date.parse(date)), "Invalid date format")
});

// Middleware for validating request body against the facility schema
export const validateFacility = (req: Request, res: Response, next: NextFunction) => {
  try {
    facilitySchema.parse(req.body);
    next();
  } catch (error) {
    if (error instanceof ZodError) {
      Logger.error("Validation error:", error.errors); // Log the validation error
      res.status(400).json({ error: "Invalid request data", details: error.errors });
    } else {
      Logger.error("Unexpected error during validation:", error); // Log unexpected errors
      res.status(500).json({ error: "Internal server error" });
    }
  }
};

// FedRAMP Compliance: Ensure logging does not expose sensitive data and follows logging best practices.

// TypeScript strict mode is enabled in tsconfig.json
// This file should be integrated into the existing Fleet Local codebase by importing and using the `validateFacility` middleware in the relevant routes.