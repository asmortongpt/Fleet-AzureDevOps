/**
 * Production Validation Schemas using Zod
 *
 * Provides runtime type validation for all data models.
 * Used for:
 * - API request/response validation
 * - Form input validation
 * - Environment variable validation
 * - User input sanitization
 */

import { z } from 'zod';

// ============================================================================
// User Schemas
// ============================================================================

export const userRoleSchema = z.enum(['admin', 'manager', 'operator', 'viewer']);

export const userSchema = z.object({
  id: z.string().optional(),
  name: z.string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be less than 100 characters')
    .regex(/^[a-zA-Z\s'-]+$/, 'Name can only contain letters, spaces, hyphens, and apostrophes'),
  email: z.string()
    .email('Invalid email address')
    .toLowerCase()
    .transform(val => val.trim()),
  role: userRoleSchema,
  department: z.string()
    .min(2, 'Department must be at least 2 characters')
    .max(50, 'Department must be less than 50 characters')
    .optional(),
  status: z.enum(['active', 'inactive']).default('active'),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

export const createUserSchema = userSchema.omit({ id: true, createdAt: true, updatedAt: true });
export const updateUserSchema = userSchema.partial().required({ id: true });

// ============================================================================
// Vehicle Schemas
// ============================================================================

export const vehicleStatusSchema = z.enum(['active', 'maintenance', 'out_of_service', 'retired']);
export const vehicleTypeSchema = z.enum(['sedan', 'suv', 'truck', 'van']);

export const vinSchema = z.string()
  .length(17, 'VIN must be exactly 17 characters')
  .regex(/^[A-HJ-NPR-Z0-9]{17}$/, 'Invalid VIN format (excludes I, O, Q)');

export const vehicleSchema = z.object({
  id: z.string().optional(),
  vin: vinSchema,
  make: z.string()
    .min(2, 'Make must be at least 2 characters')
    .max(50, 'Make must be less than 50 characters'),
  model: z.string()
    .min(1, 'Model is required')
    .max(50, 'Model must be less than 50 characters'),
  year: z.number()
    .int('Year must be a whole number')
    .min(1900, 'Year must be 1900 or later')
    .max(new Date().getFullYear() + 1, 'Year cannot be more than 1 year in the future'),
  licensePlate: z.string()
    .min(2, 'License plate must be at least 2 characters')
    .max(20, 'License plate must be less than 20 characters')
    .optional(),
  vehicleType: vehicleTypeSchema,
  status: vehicleStatusSchema.default('active'),
  mileage: z.number()
    .int('Mileage must be a whole number')
    .min(0, 'Mileage cannot be negative')
    .optional(),
  fuelLevel: z.number()
    .min(0, 'Fuel level cannot be negative')
    .max(100, 'Fuel level cannot exceed 100%')
    .optional(),
  assignedDriverId: z.string().optional(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

export const createVehicleSchema = vehicleSchema.omit({ id: true, createdAt: true, updatedAt: true });
export const updateVehicleSchema = vehicleSchema.partial().required({ id: true });

// ============================================================================
// Maintenance Schemas
// ============================================================================

export const maintenanceTypeSchema = z.enum([
  'oil_change',
  'tire_rotation',
  'brake_service',
  'engine_repair',
  'transmission',
  'inspection',
  'general_service',
  'emergency_repair',
]);

export const maintenanceStatusSchema = z.enum([
  'pending',
  'scheduled',
  'in_progress',
  'completed',
  'cancelled',
]);

export const maintenanceRecordSchema = z.object({
  id: z.string().optional(),
  vehicleId: z.string().min(1, 'Vehicle ID is required'),
  maintenanceType: maintenanceTypeSchema,
  scheduledDate: z.date(),
  completedDate: z.date().optional(),
  cost: z.number()
    .min(0, 'Cost cannot be negative')
    .optional(),
  vendor: z.string()
    .max(100, 'Vendor name must be less than 100 characters')
    .optional(),
  notes: z.string()
    .max(1000, 'Notes must be less than 1000 characters')
    .optional(),
  status: maintenanceStatusSchema.default('pending'),
  createdAt: z.date().optional(),
});

export const createMaintenanceRecordSchema = maintenanceRecordSchema.omit({ id: true, createdAt: true });
export const updateMaintenanceRecordSchema = maintenanceRecordSchema.partial().required({ id: true });

// ============================================================================
// AI Chat Schemas
// ============================================================================

export const chatMessageRoleSchema = z.enum(['user', 'assistant', 'system']);

export const chatMessageSchema = z.object({
  id: z.string(),
  role: chatMessageRoleSchema,
  content: z.string()
    .min(1, 'Message content cannot be empty')
    .max(10000, 'Message content is too long'),
  timestamp: z.date(),
  tokenCount: z.number().int().min(0).optional(),
});

export const chatCompletionOptionsSchema = z.object({
  model: z.enum(['gpt-4', 'gpt-3.5-turbo', 'claude-3-opus', 'claude-3-sonnet']).optional(),
  temperature: z.number().min(0).max(2).optional(),
  maxTokens: z.number().int().min(1).max(32000).optional(),
  stream: z.boolean().optional(),
});

// ============================================================================
// Environment & Configuration Schemas
// ============================================================================

export const environmentVariableSchema = z.object({
  name: z.string()
    .min(1, 'Variable name is required')
    .regex(/^[A-Z][A-Z0-9_]*$/, 'Variable name must be uppercase with underscores'),
  value: z.string(),
  sensitive: z.boolean().default(false),
  description: z.string().optional(),
});

export const featureFlagSchema = z.object({
  name: z.string().min(1, 'Feature name is required'),
  enabled: z.boolean(),
  description: z.string().optional(),
});

export const systemHealthStatusSchema = z.enum(['healthy', 'degraded', 'down']);

export const systemHealthComponentSchema = z.object({
  name: z.string().min(1, 'Component name is required'),
  status: systemHealthStatusSchema,
  lastChecked: z.date(),
  responseTime: z.number().min(0).optional(),
  errorMessage: z.string().optional(),
});

// ============================================================================
// Security & Compliance Schemas
// ============================================================================

export const securityCheckSchema = z.object({
  id: z.string(),
  name: z.string().min(1, 'Check name is required'),
  description: z.string(),
  status: z.enum(['passing', 'failing', 'warning']),
  lastChecked: z.date(),
});

export const securityAlertSeveritySchema = z.enum(['critical', 'high', 'medium', 'low']);

export const securityAlertSchema = z.object({
  id: z.string(),
  title: z.string().min(1, 'Alert title is required'),
  description: z.string(),
  severity: securityAlertSeveritySchema,
  timestamp: z.date(),
  resolved: z.boolean().default(false),
  resolvedAt: z.date().optional(),
});

export const accessLogSchema = z.object({
  id: z.string(),
  userId: z.string(),
  userName: z.string(),
  action: z.string().min(1, 'Action is required'),
  resource: z.string(),
  timestamp: z.date(),
  ipAddress: z.string().ip().optional(),
  userAgent: z.string().optional(),
  success: z.boolean(),
});

// ============================================================================
// Pagination & Filtering Schemas
// ============================================================================

export const paginationSchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
});

export const dateRangeFilterSchema = z.object({
  startDate: z.date().optional(),
  endDate: z.date().optional(),
}).refine(
  (data) => !data.startDate || !data.endDate || data.startDate <= data.endDate,
  { message: 'Start date must be before or equal to end date' }
);

export const vehicleFilterSchema = z.object({
  status: vehicleStatusSchema.optional(),
  vehicleType: vehicleTypeSchema.optional(),
  make: z.string().optional(),
  assignedDriverId: z.string().optional(),
  minMileage: z.number().int().min(0).optional(),
  maxMileage: z.number().int().min(0).optional(),
}).merge(paginationSchema);

export const maintenanceFilterSchema = z.object({
  vehicleId: z.string().optional(),
  status: maintenanceStatusSchema.optional(),
  maintenanceType: maintenanceTypeSchema.optional(),
}).merge(dateRangeFilterSchema).merge(paginationSchema);

// ============================================================================
// API Response Schemas
// ============================================================================

export const apiErrorSchema = z.object({
  error: z.string(),
  message: z.string(),
  statusCode: z.number().int().min(400).max(599),
  details: z.record(z.any()).optional(),
});

export const apiSuccessSchema = z.object({
  success: z.boolean(),
  message: z.string().optional(),
  data: z.any().optional(),
});

export const paginatedResponseSchema = <T extends z.ZodTypeAny>(itemSchema: T) =>
  z.object({
    data: z.array(itemSchema),
    pagination: z.object({
      total: z.number().int().min(0),
      page: z.number().int().min(1),
      limit: z.number().int().min(1),
      totalPages: z.number().int().min(0),
    }),
  });

// ============================================================================
// Type Exports (inferred from Zod schemas)
// ============================================================================

export type User = z.infer<typeof userSchema>;
export type CreateUser = z.infer<typeof createUserSchema>;
export type UpdateUser = z.infer<typeof updateUserSchema>;
export type UserRole = z.infer<typeof userRoleSchema>;

export type Vehicle = z.infer<typeof vehicleSchema>;
export type CreateVehicle = z.infer<typeof createVehicleSchema>;
export type UpdateVehicle = z.infer<typeof updateVehicleSchema>;
export type VehicleStatus = z.infer<typeof vehicleStatusSchema>;
export type VehicleType = z.infer<typeof vehicleTypeSchema>;

export type MaintenanceRecord = z.infer<typeof maintenanceRecordSchema>;
export type CreateMaintenanceRecord = z.infer<typeof createMaintenanceRecordSchema>;
export type UpdateMaintenanceRecord = z.infer<typeof updateMaintenanceRecordSchema>;
export type MaintenanceType = z.infer<typeof maintenanceTypeSchema>;
export type MaintenanceStatus = z.infer<typeof maintenanceStatusSchema>;

export type ChatMessage = z.infer<typeof chatMessageSchema>;
export type ChatMessageRole = z.infer<typeof chatMessageRoleSchema>;
export type ChatCompletionOptions = z.infer<typeof chatCompletionOptionsSchema>;

export type EnvironmentVariable = z.infer<typeof environmentVariableSchema>;
export type FeatureFlag = z.infer<typeof featureFlagSchema>;
export type SystemHealthComponent = z.infer<typeof systemHealthComponentSchema>;
export type SystemHealthStatus = z.infer<typeof systemHealthStatusSchema>;

export type SecurityCheck = z.infer<typeof securityCheckSchema>;
export type SecurityAlert = z.infer<typeof securityAlertSchema>;
export type SecurityAlertSeverity = z.infer<typeof securityAlertSeveritySchema>;
export type AccessLog = z.infer<typeof accessLogSchema>;

export type Pagination = z.infer<typeof paginationSchema>;
export type DateRangeFilter = z.infer<typeof dateRangeFilterSchema>;
export type VehicleFilter = z.infer<typeof vehicleFilterSchema>;
export type MaintenanceFilter = z.infer<typeof maintenanceFilterSchema>;

export type ApiError = z.infer<typeof apiErrorSchema>;
export type ApiSuccess = z.infer<typeof apiSuccessSchema>;

// ============================================================================
// Validation Helper Functions
// ============================================================================

/**
 * Validate data against a schema and return typed result
 */
export function validate<T extends z.ZodTypeAny>(
  schema: T,
  data: unknown
): { success: true; data: z.infer<T> } | { success: false; errors: z.ZodError } {
  const result = schema.safeParse(data);

  if (result.success) {
    return { success: true, data: result.data };
  } else {
    return { success: false, errors: result.error };
  }
}

/**
 * Validate and throw if invalid
 */
export function validateOrThrow<T extends z.ZodTypeAny>(
  schema: T,
  data: unknown,
  errorMessage?: string
): z.infer<T> {
  try {
    return schema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const formattedErrors = error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
      throw new Error(errorMessage || `Validation failed: ${formattedErrors}`);
    }
    throw error;
  }
}

/**
 * Format Zod errors for user-friendly display
 */
export function formatZodErrors(error: z.ZodError): Record<string, string> {
  const formatted: Record<string, string> = {};

  error.errors.forEach((err) => {
    const path = err.path.join('.');
    formatted[path] = err.message;
  });

  return formatted;
}

/**
 * Sanitize user input (strip HTML, trim whitespace)
 */
export function sanitizeInput(input: string): string {
  return input
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .trim(); // Remove leading/trailing whitespace
}

/**
 * Validate email format (additional to Zod validation)
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate VIN checksum (Luhn algorithm for VINs)
 */
export function isValidVINChecksum(vin: string): boolean {
  if (vin.length !== 17) return false;

  const weights = [8, 7, 6, 5, 4, 3, 2, 10, 0, 9, 8, 7, 6, 5, 4, 3, 2];
  const transliteration: Record<string, number> = {
    A: 1, B: 2, C: 3, D: 4, E: 5, F: 6, G: 7, H: 8,
    J: 1, K: 2, L: 3, M: 4, N: 5, P: 7, R: 9,
    S: 2, T: 3, U: 4, V: 5, W: 6, X: 7, Y: 8, Z: 9,
  };

  let sum = 0;
  for (let i = 0; i < 17; i++) {
    const char = vin[i];
    const value = /\d/.test(char) ? parseInt(char) : transliteration[char] || 0;
    sum += value * weights[i];
  }

  const checkDigit = sum % 11;
  const expectedCheckDigit = vin[8] === 'X' ? 10 : parseInt(vin[8]);

  return checkDigit === expectedCheckDigit;
}
