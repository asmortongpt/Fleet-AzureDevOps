/**
 * Procurement Module Type Definitions
 *
 * Enterprise-grade TypeScript types with Zod validation schemas
 * for the Procurement Management system.
 *
 * @module types/procurement
 * @security All types have corresponding Zod schemas for runtime validation
 */

import { z } from 'zod'

// ============================================================================
// ZOD VALIDATION SCHEMAS
// ============================================================================

/**
 * Vendor status enum schema
 */
export const VendorStatusSchema = z.enum(['active', 'inactive', 'onboarding', 'suspended'])

/**
 * Vendor schema with comprehensive validation
 */
export const VendorSchema = z.object({
  id: z.string().uuid('Invalid vendor ID format'),
  name: z.string().min(1, 'Vendor name required').max(255, 'Vendor name too long'),
  contact: z.string().min(1, 'Contact name required').max(255, 'Contact name too long'),
  email: z.string().email('Invalid email format'),
  phone: z.string().regex(/^\+?[\d\s\-()]+$/, 'Invalid phone number format'),
  status: VendorStatusSchema,
  rating: z.number().min(0, 'Rating cannot be negative').max(5, 'Rating cannot exceed 5'),
  totalSpend: z.number().nonnegative('Total spend cannot be negative'),
  onTimeDelivery: z.number().min(0, 'On-time delivery cannot be negative').max(100, 'On-time delivery cannot exceed 100%'),
  qualityRating: z.number().min(0, 'Quality rating cannot be negative').max(100, 'Quality rating cannot exceed 100%'),
  leadTimeDays: z.number().int().nonnegative('Lead time cannot be negative'),
  contractEndDate: z.string().datetime().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime().optional(),
})

/**
 * Purchase Order status enum schema
 */
export const PurchaseOrderStatusSchema = z.enum([
  'draft',
  'pending_approval',
  'approved',
  'ordered',
  'in_transit',
  'received',
  'cancelled',
  'rejected',
])

/**
 * Purchase Order priority enum schema
 */
export const PurchaseOrderPrioritySchema = z.enum(['low', 'medium', 'high', 'urgent'])

/**
 * Purchase Order category enum schema
 */
export const PurchaseOrderCategorySchema = z.enum([
  'parts',
  'fuel',
  'equipment',
  'services',
  'supplies',
  'other',
])

/**
 * Purchase Order item schema
 */
export const PurchaseOrderItemSchema = z.object({
  id: z.string().uuid(),
  description: z.string().min(1).max(500),
  quantity: z.number().int().positive('Quantity must be positive'),
  unitPrice: z.number().nonnegative('Unit price cannot be negative'),
  totalPrice: z.number().nonnegative('Total price cannot be negative'),
  category: PurchaseOrderCategorySchema,
})

/**
 * Purchase Order schema with comprehensive validation
 */
export const PurchaseOrderSchema = z.object({
  id: z.string().uuid('Invalid purchase order ID format'),
  vendorId: z.string().uuid('Invalid vendor ID format'),
  vendorName: z.string().min(1, 'Vendor name required').max(255, 'Vendor name too long'),
  orderNumber: z.string().min(1, 'Order number required').max(50, 'Order number too long'),
  status: PurchaseOrderStatusSchema,
  totalAmount: z.number().nonnegative('Total amount cannot be negative'),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime().optional(),
  expectedDelivery: z.string().datetime().optional(),
  actualDelivery: z.string().datetime().optional(),
  items: z.number().int().positive('Items count must be positive'),
  priority: PurchaseOrderPrioritySchema,
  category: PurchaseOrderCategorySchema,
  approvedBy: z.string().uuid().optional(),
  approvedAt: z.string().datetime().optional(),
  notes: z.string().max(1000).optional(),
})

/**
 * Contract type enum schema
 */
export const ContractTypeSchema = z.enum([
  'parts',
  'fuel',
  'services',
  'maintenance',
  'lease',
  'insurance',
  'other',
])

/**
 * Contract status enum schema
 */
export const ContractStatusSchema = z.enum(['active', 'expiring', 'expired', 'pending', 'cancelled'])

/**
 * Contract schema with comprehensive validation
 */
export const ContractSchema = z.object({
  id: z.string().uuid('Invalid contract ID format'),
  vendorId: z.string().uuid('Invalid vendor ID format'),
  vendorName: z.string().min(1, 'Vendor name required').max(255, 'Vendor name too long'),
  type: ContractTypeSchema,
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  status: ContractStatusSchema,
  totalValue: z.number().nonnegative('Total value cannot be negative'),
  renewalDate: z.string().datetime().optional(),
  autoRenew: z.boolean().optional(),
  terms: z.string().max(5000).optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime().optional(),
})

/**
 * Procurement Metrics schema
 */
export const ProcurementMetricsSchema = z.object({
  totalPOs: z.number().int().nonnegative(),
  activeVendors: z.number().int().nonnegative(),
  pendingApprovals: z.number().int().nonnegative(),
  totalSpend: z.number().nonnegative(),
  avgOrderValue: z.number().nonnegative(),
  onTimeDeliveryRate: z.number().min(0).max(100),
  monthlySpend: z.number().nonnegative(),
  budgetUsed: z.number().nonnegative(),
  budgetTotal: z.number().positive(),
  costSavings: z.number().optional(),
  negotiatedDiscounts: z.number().optional(),
})

// ============================================================================
// TYPESCRIPT TYPES (Inferred from Zod schemas)
// ============================================================================

export type VendorStatus = z.infer<typeof VendorStatusSchema>
export type Vendor = z.infer<typeof VendorSchema>

export type PurchaseOrderStatus = z.infer<typeof PurchaseOrderStatusSchema>
export type PurchaseOrderPriority = z.infer<typeof PurchaseOrderPrioritySchema>
export type PurchaseOrderCategory = z.infer<typeof PurchaseOrderCategorySchema>
export type PurchaseOrderItem = z.infer<typeof PurchaseOrderItemSchema>
export type PurchaseOrder = z.infer<typeof PurchaseOrderSchema>

export type ContractType = z.infer<typeof ContractTypeSchema>
export type ContractStatus = z.infer<typeof ContractStatusSchema>
export type Contract = z.infer<typeof ContractSchema>

export type ProcurementMetrics = z.infer<typeof ProcurementMetricsSchema>

// ============================================================================
// ADDITIONAL COMPUTED TYPES
// ============================================================================

/**
 * Chart data point for visualizations
 */
export interface ChartDataPoint {
  name: string
  value: number
  fill?: string
  label?: string
}

/**
 * Trend data point for time-series visualizations
 */
export interface TrendDataPoint {
  name: string
  [key: string]: string | number
}

/**
 * Vendor performance metrics
 */
export interface VendorPerformance {
  vendorId: string
  vendorName: string
  totalOrders: number
  totalSpend: number
  onTimeDeliveryRate: number
  qualityScore: number
  averageLeadTime: number
}

/**
 * Spend analysis by category
 */
export interface SpendByCategory {
  category: PurchaseOrderCategory
  totalSpend: number
  orderCount: number
  percentage: number
}

/**
 * Budget tracking
 */
export interface BudgetTracking {
  period: string
  budgetTotal: number
  budgetUsed: number
  budgetRemaining: number
  percentageUsed: number
  projectedOverrun?: number
}

/**
 * Procurement alert types
 */
export type ProcurementAlertType =
  | 'budget_threshold'
  | 'contract_expiring'
  | 'overdue_delivery'
  | 'pending_approval'
  | 'vendor_performance'
  | 'cost_anomaly'

/**
 * Procurement alert
 */
export interface ProcurementAlert {
  id: string
  type: ProcurementAlertType
  severity: 'low' | 'medium' | 'high' | 'critical'
  title: string
  description: string
  relatedId?: string
  createdAt: string
  acknowledged: boolean
}

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

/**
 * Paginated API response
 */
export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

/**
 * API error response
 */
export interface APIErrorResponse {
  error: string
  message: string
  statusCode: number
  timestamp: string
  details?: Record<string, unknown>
}

// ============================================================================
// FILTER AND SORT TYPES
// ============================================================================

/**
 * Vendor filter options
 */
export interface VendorFilters {
  status?: VendorStatus[]
  minRating?: number
  maxRating?: number
  searchTerm?: string
}

/**
 * Purchase Order filter options
 */
export interface PurchaseOrderFilters {
  status?: PurchaseOrderStatus[]
  priority?: PurchaseOrderPriority[]
  category?: PurchaseOrderCategory[]
  vendorId?: string
  dateFrom?: string
  dateTo?: string
  minAmount?: number
  maxAmount?: number
  searchTerm?: string
}

/**
 * Contract filter options
 */
export interface ContractFilters {
  status?: ContractStatus[]
  type?: ContractType[]
  vendorId?: string
  expiringWithinDays?: number
  searchTerm?: string
}

/**
 * Sort direction
 */
export type SortDirection = 'asc' | 'desc'

/**
 * Sort options
 */
export interface SortOptions {
  field: string
  direction: SortDirection
}
