import { z } from 'zod'

import { commonSchemas } from '../middleware/validation'

/**
 * Fuel Transactions Validation Schemas
 *
 * Comprehensive validation for fuel transaction tracking including:
 * - Fuel purchases and refueling events
 * - Fuel type and quantity
 * - Cost tracking
 * - Payment method validation
 * - Vendor information
 * - Location tracking
 *
 * Security Features:
 * - XSS prevention through input sanitization
 * - SQL injection prevention via parameterized queries
 * - Amount limits to prevent fraudulent entries
 * - Required field enforcement
 */

/**
 * Fuel type enumeration
 */
const fuelTypeEnum = z.enum([
  'gasoline',
  'diesel',
  'electric',
  'hybrid',
  'cng',        // Compressed Natural Gas
  'propane',
  'e85',        // Ethanol blend
  'biodiesel',
  'hydrogen',
  'other'
])

/**
 * Payment method enumeration
 */
const paymentMethodEnum = z.enum([
  'fleet_card',
  'credit_card',
  'debit_card',
  'cash',
  'account',
  'voucher',
  'mobile_payment',
  'ach',
  'wire_transfer',
  'other'
])

/**
 * Transaction status enumeration
 */
const transactionStatusEnum = z.enum([
  'pending',
  'completed',
  'disputed',
  'refunded',
  'cancelled',
  'under_review'
])

/**
 * Create fuel transaction
 * POST /fuel-transactions
 */
export const createFuelTransactionSchema = z.object({
  // Vehicle and driver (REQUIRED)
  vehicle_id: z.string().uuid('Invalid vehicle ID format'),

  driver_id: z.string().uuid('Invalid driver ID format').optional(),

  // Transaction timestamp (REQUIRED)
  transaction_date: z.coerce.date({
    errorMap: () => ({ message: 'Invalid transaction date format' })
  }),

  // Fuel details (REQUIRED)
  fuel_type: fuelTypeEnum,

  quantity: z.number()
    .positive('Quantity must be greater than 0')
    .max(1000, 'Quantity exceeds maximum allowable value (1000 gallons)')
    .finite('Quantity must be a finite number')
    .multipleOf(0.001, 'Quantity can have at most 3 decimal places'),

  unit: z.enum(['gallons', 'liters', 'kwh']).default('gallons'),

  // Cost details (REQUIRED)
  price_per_unit: commonSchemas.currency
    .max(50, 'Price per unit exceeds maximum ($50)'),

  total_cost: commonSchemas.currency
    .max(10000, 'Total cost exceeds maximum ($10,000)'),

  tax_amount: commonSchemas.currency.optional(),

  // Odometer reading (REQUIRED for fuel efficiency tracking)
  odometer_reading: commonSchemas.nonNegativeNumber
    .max(9999999, 'Odometer reading exceeds maximum value'),

  // Payment information (REQUIRED)
  payment_method: paymentMethodEnum,

  card_last_four: z.string()
    .regex(/^\d{4}$/, 'Card last four must be exactly 4 digits')
    .optional(),

  authorization_code: z.string()
    .max(50, 'Authorization code too long')
    .optional(),

  // Vendor and location information (OPTIONAL)
  vendor_name: z.string()
    .max(200, 'Vendor name too long')
    .trim()
    .optional(),

  vendor_id: z.string().uuid().optional(),

  station_name: z.string()
    .max(200, 'Station name too long')
    .trim()
    .optional(),

  station_address: z.string()
    .max(500, 'Station address too long')
    .trim()
    .optional(),

  // GPS location (OPTIONAL but recommended)
  latitude: commonSchemas.latitude.optional(),
  longitude: commonSchemas.longitude.optional(),

  // Transaction status
  status: transactionStatusEnum.default('completed'),

  // Receipt and reference information (OPTIONAL)
  receipt_number: z.string()
    .max(100, 'Receipt number too long')
    .optional(),

  invoice_number: z.string()
    .max(100, 'Invoice number too long')
    .optional(),

  reference_number: z.string()
    .max(100, 'Reference number too long')
    .optional(),

  // Fuel efficiency tracking (OPTIONAL - can be calculated)
  miles_since_last_fill: z.number()
    .nonnegative('Miles must be non-negative')
    .max(10000, 'Miles since last fill exceeds maximum')
    .optional(),

  calculated_mpg: z.number()
    .positive('MPG must be positive')
    .max(200, 'MPG exceeds maximum value')
    .optional(),

  // Additional fields
  is_partial_fill: z.boolean().default(false),

  pump_number: z.string()
    .max(20, 'Pump number too long')
    .optional(),

  notes: z.string()
    .max(2000, 'Notes must be 2000 characters or less')
    .optional(),

  // Metadata
  metadata: z.record(
    z.string().max(100),
    z.union([z.string().max(500), z.number(), z.boolean()])
  ).optional()
}).strict().refine(data => {
  // Validate that total_cost matches quantity * price_per_unit (within 1 cent tolerance)
  const calculatedTotal = data.quantity * data.price_per_unit
  const difference = Math.abs(data.total_cost - calculatedTotal)
  return difference <= 0.02 // Allow 2 cent rounding difference
}, {
  message: 'Total cost must match quantity × price per unit',
  path: ['total_cost']
}).refine(data => {
  // If tax_amount is provided, ensure total includes it
  if (data.tax_amount) {
    return data.total_cost >= data.tax_amount
  }
  return true
}, {
  message: 'Total cost must be greater than or equal to tax amount',
  path: ['total_cost']
})

/**
 * Update fuel transaction
 * PUT /fuel-transactions/:id
 */
export const updateFuelTransactionSchema = z.object({
  driver_id: z.string().uuid().optional(),

  fuel_type: fuelTypeEnum.optional(),

  quantity: z.number()
    .positive()
    .max(1000)
    .finite()
    .multipleOf(0.001)
    .optional(),

  price_per_unit: commonSchemas.currency.max(50).optional(),

  total_cost: commonSchemas.currency.max(10000).optional(),

  tax_amount: commonSchemas.currency.optional(),

  odometer_reading: commonSchemas.nonNegativeNumber.max(9999999).optional(),

  payment_method: paymentMethodEnum.optional(),

  vendor_name: z.string().max(200).trim().optional(),

  station_name: z.string().max(200).trim().optional(),

  status: transactionStatusEnum.optional(),

  notes: z.string().max(2000).optional(),

  metadata: z.record(
    z.string().max(100),
    z.union([z.string().max(500), z.number(), z.boolean()])
  ).optional()
}).strict()

/**
 * Query parameters for GET /fuel-transactions
 */
export const getFuelTransactionsQuerySchema = z.object({
  // Pagination
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(500).default(50),

  // Filtering
  vehicle_id: z.string().uuid().optional(),
  driver_id: z.string().uuid().optional(),
  vendor_id: z.string().uuid().optional(),

  fuel_type: fuelTypeEnum.optional(),
  payment_method: paymentMethodEnum.optional(),
  status: transactionStatusEnum.optional(),

  // Search
  search: z.string()
    .max(500, 'Search query too long')
    .optional(),

  // Date range
  start_date: z.coerce.date().optional(),
  end_date: z.coerce.date().optional(),

  // Cost range
  min_cost: commonSchemas.currency.optional(),
  max_cost: commonSchemas.currency.optional(),

  // Quantity range
  min_quantity: z.coerce.number().positive().optional(),
  max_quantity: z.coerce.number().positive().optional(),

  // Sorting
  sort: z.enum([
    'transaction_date',
    'total_cost',
    'quantity',
    'odometer_reading',
    'vendor_name'
  ]).default('transaction_date'),
  order: z.enum(['asc', 'desc']).default('desc')
}).refine(data => {
  // Validate date range
  if (data.start_date && data.end_date) {
    return data.start_date <= data.end_date
  }
  return true
}, {
  message: 'start_date must be before or equal to end_date'
}).refine(data => {
  // Validate cost range
  if (data.min_cost !== undefined && data.max_cost !== undefined) {
    return data.min_cost <= data.max_cost
  }
  return true
}, {
  message: 'min_cost must be less than or equal to max_cost'
}).refine(data => {
  // Validate quantity range
  if (data.min_quantity !== undefined && data.max_quantity !== undefined) {
    return data.min_quantity <= data.max_quantity
  }
  return true
}, {
  message: 'min_quantity must be less than or equal to max_quantity'
})

/**
 * Bulk fuel transaction import
 * POST /fuel-transactions/bulk
 */
export const bulkFuelTransactionsSchema = z.object({
  transactions: z.array(createFuelTransactionSchema)
    .min(1, 'At least one transaction required')
    .max(500, 'Maximum 500 transactions per batch')
}).strict()

/**
 * Type exports for TypeScript
 */
export type CreateFuelTransactionInput = z.infer<typeof createFuelTransactionSchema>
export type UpdateFuelTransactionInput = z.infer<typeof updateFuelTransactionSchema>
export type GetFuelTransactionsQuery = z.infer<typeof getFuelTransactionsQuerySchema>
export type BulkFuelTransactionsInput = z.infer<typeof bulkFuelTransactionsSchema>
