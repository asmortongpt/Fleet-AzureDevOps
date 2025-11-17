/**
 * TypeScript Types for Personal vs Business Vehicle Use Tracking
 * Federal Compliance: IRS personal vs business use classification
 * Enhanced Version: Includes payment methods, reimbursement workflows, and receipt tracking
 */

// =====================================================
// Enums
// =====================================================

export enum UsageType {
  BUSINESS = 'business',
  PERSONAL = 'personal',
  MIXED = 'mixed'
}

export enum ApprovalStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  AUTO_APPROVED = 'auto_approved'
}

export enum ApprovalWorkflow {
  MANAGER = 'manager',
  FLEET_ADMIN = 'fleet_admin',
  BOTH = 'both',
  NONE = 'none'
}

export enum ChargeStatus {
  PENDING = 'pending',
  INVOICED = 'invoiced',
  BILLED = 'billed',
  PAID = 'paid',
  WAIVED = 'waived',
  DISPUTED = 'disputed'
}

export enum PaymentMethod {
  DRIVER_DIRECT = 'driver_direct',           // Driver pays directly (no company involvement)
  DRIVER_REIMBURSE = 'driver_reimburse',     // Driver pays, requests reimbursement
  COMPANY_BILL = 'company_bill',             // Company bills driver monthly
  PAYROLL_DEDUCT = 'payroll_deduct'          // Automatic payroll deduction
}

export enum CalculationMethod {
  PER_MILE = 'per_mile',       // Charge per mile driven
  FLAT_FEE = 'flat_fee',       // Fixed monthly/yearly fee
  ACTUAL_COST = 'actual_cost'  // Actual costs (fuel, maintenance)
}

export enum ReimbursementStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  PAID = 'paid',
  CANCELLED = 'cancelled'
}

export enum FlatFeeFrequency {
  MONTHLY = 'monthly',
  QUARTERLY = 'quarterly',
  YEARLY = 'yearly'
}

// =====================================================
// Trip Usage Classification
// =====================================================

export interface TripUsageClassification {
  id: string
  tenant_id: string
  trip_id?: string
  vehicle_id: string
  driver_id: string

  // Usage classification
  usage_type: UsageType
  business_purpose?: string
  business_percentage?: number
  personal_notes?: string

  // Mileage breakdown
  miles_total: number
  miles_business: number // Computed
  miles_personal: number // Computed

  // Trip details
  trip_date: Date | string
  start_location?: string
  end_location?: string
  start_odometer?: number
  end_odometer?: number

  // Approval workflow
  approved_by_user_id?: string
  approved_at?: Date | string
  approval_status: ApprovalStatus
  rejection_reason?: string

  // Metadata
  metadata?: Record<string, any>

  // Audit fields
  created_at: Date | string
  updated_at: Date | string
  created_by_user_id?: string
}

export interface CreateTripUsageRequest {
  vehicle_id: string
  driver_id: string
  usage_type: UsageType
  business_purpose?: string
  business_percentage?: number
  personal_notes?: string
  miles_total: number
  trip_date: string
  start_location?: string
  end_location?: string
  start_odometer?: number
  end_odometer?: number
  trip_id?: string
}

export interface UpdateTripUsageRequest {
  usage_type?: UsageType
  business_purpose?: string
  business_percentage?: number
  personal_notes?: string
  miles_total?: number
  start_location?: string
  end_location?: string
}

export interface ApproveTripRequest {
  approver_notes?: string
}

export interface RejectTripRequest {
  rejection_reason: string
}

// =====================================================
// Personal Use Policies
// =====================================================

export interface PersonalUsePolicy {
  id: string
  tenant_id: string

  // Policy settings
  allow_personal_use: boolean
  require_approval: boolean
  max_personal_miles_per_month?: number
  max_personal_miles_per_year?: number

  // Charging configuration
  charge_personal_use: boolean
  payment_method: PaymentMethod
  calculation_method: CalculationMethod
  personal_use_rate_per_mile?: number
  flat_fee_amount?: number
  flat_fee_frequency?: FlatFeeFrequency

  // Reimbursement settings
  reimbursement_approval_required: boolean
  auto_approve_under_amount?: number
  reimbursement_payment_terms_days: number
  require_receipt_upload: boolean
  receipt_required_over_amount?: number

  // Reporting requirements
  reporting_required: boolean
  approval_workflow: ApprovalWorkflow

  // Notification settings
  notification_settings: NotificationSettings

  // Auto-approval thresholds
  auto_approve_under_miles?: number
  auto_approve_days_advance?: number

  // Policy dates
  effective_date: Date | string
  expiration_date?: Date | string

  // Audit fields
  created_by_user_id?: string
  created_at: Date | string
  updated_at: Date | string
}

export interface NotificationSettings {
  notify_at_percentage?: number
  notify_manager_on_exceed?: boolean
  notify_driver_on_limit?: boolean
  email_notifications?: boolean
}

export interface CreatePolicyRequest {
  allow_personal_use: boolean
  require_approval: boolean
  max_personal_miles_per_month?: number
  max_personal_miles_per_year?: number
  charge_personal_use: boolean
  payment_method?: PaymentMethod
  calculation_method?: CalculationMethod
  personal_use_rate_per_mile?: number
  flat_fee_amount?: number
  flat_fee_frequency?: FlatFeeFrequency
  reimbursement_approval_required?: boolean
  auto_approve_under_amount?: number
  reimbursement_payment_terms_days?: number
  require_receipt_upload?: boolean
  receipt_required_over_amount?: number
  reporting_required?: boolean
  approval_workflow?: ApprovalWorkflow
  notification_settings?: NotificationSettings
  auto_approve_under_miles?: number
  effective_date: string
  expiration_date?: string
}

export interface UpdatePolicyRequest extends Partial<CreatePolicyRequest> {}

// =====================================================
// Personal Use Charges
// =====================================================

export interface PersonalUseCharge {
  id: string
  tenant_id: string
  driver_id: string
  trip_usage_id?: string

  // Billing period
  charge_period: string // YYYY-MM
  charge_period_start: Date | string
  charge_period_end: Date | string

  // Charge calculation
  miles_charged: number
  rate_per_mile: number
  total_charge: number

  // Payment tracking
  charge_status: ChargeStatus
  payment_method?: string
  paid_at?: Date | string
  waived_by_user_id?: string
  waived_at?: Date | string
  waived_reason?: string

  // Invoice information
  invoice_number?: string
  invoice_date?: Date | string
  due_date?: Date | string

  // Reimbursement fields
  is_reimbursement: boolean
  reimbursement_requested_at?: Date | string
  reimbursement_approved_at?: Date | string
  reimbursement_approved_by?: string
  reimbursement_rejected_at?: Date | string
  reimbursement_rejection_reason?: string
  reimbursement_paid_at?: Date | string
  reimbursement_payment_reference?: string

  // Receipt tracking
  receipt_file_path?: string
  receipt_uploaded_at?: Date | string

  // Actual cost breakdown (for actual_cost calculation method)
  actual_cost_breakdown?: ActualCostBreakdown

  // Additional information
  driver_notes?: string
  notes?: string
  metadata?: Record<string, any>

  // Audit fields
  created_at: Date | string
  updated_at: Date | string
  created_by_user_id?: string
}

export interface ActualCostBreakdown {
  fuel?: number
  maintenance?: number
  insurance?: number
  depreciation?: number
  other?: number
}

export interface CreateChargeRequest {
  driver_id: string
  trip_usage_id?: string
  charge_period: string
  charge_period_start: string
  charge_period_end: string
  miles_charged: number
  rate_per_mile: number
  notes?: string
  is_reimbursement?: boolean
  actual_cost_breakdown?: ActualCostBreakdown
}

export interface UpdateChargeRequest {
  charge_status?: ChargeStatus
  payment_method?: string
  paid_at?: string
  waived_reason?: string
  invoice_number?: string
  invoice_date?: string
  due_date?: string
  notes?: string
  driver_notes?: string
}

export interface CalculateChargesRequest {
  driver_id: string
  charge_period: string // YYYY-MM
}

export interface CalculateChargesResponse {
  driver_id: string
  charge_period: string
  total_personal_miles: number
  rate_per_mile: number
  total_charge: number
  trips_included: number
  charge_breakdown: ChargeBreakdownItem[]
}

export interface ChargeBreakdownItem {
  trip_usage_id: string
  trip_date: string
  miles_personal: number
  rate: number
  charge: number
}

// =====================================================
// Reimbursement Requests
// =====================================================

export interface ReimbursementRequest {
  id: string
  tenant_id: string
  driver_id: string
  charge_id: string

  // Request details
  request_amount: number
  description?: string
  expense_date: Date | string
  category?: string

  // Receipt information
  receipt_file_path?: string
  receipt_uploaded_at?: Date | string
  receipt_metadata?: Record<string, any>

  // Approval workflow
  status: ReimbursementStatus
  submitted_at: Date | string
  reviewed_at?: Date | string
  reviewed_by_user_id?: string
  reviewer_notes?: string

  // Payment information
  approved_amount?: number
  payment_date?: Date | string
  payment_method?: string
  payment_reference?: string

  // Audit fields
  created_at: Date | string
  updated_at: Date | string
  created_by_user_id?: string
}

export interface CreateReimbursementRequest {
  charge_id: string
  request_amount: number
  description?: string
  expense_date: string
  category?: string
  receipt_file?: File | string
}

export interface ReviewReimbursementRequest {
  status: ReimbursementStatus.APPROVED | ReimbursementStatus.REJECTED
  approved_amount?: number
  reviewer_notes?: string
}

export interface ProcessReimbursementPaymentRequest {
  payment_date: string
  payment_method: string
  payment_reference: string
}

// =====================================================
// Payment Schedules
// =====================================================

export interface PaymentSchedule {
  id: string
  tenant_id: string
  driver_id: string

  // Schedule details
  payment_method: PaymentMethod
  schedule_type: 'monthly' | 'biweekly' | 'weekly'
  amount: number

  // Schedule timing
  start_date: Date | string
  end_date?: Date | string
  next_payment_date: Date | string
  last_payment_date?: Date | string

  // Status
  is_active: boolean
  suspended_at?: Date | string
  suspended_reason?: string

  // Linked charges
  charge_ids: string[]

  // Metadata
  notes?: string
  metadata?: Record<string, any>

  // Audit fields
  created_at: Date | string
  updated_at: Date | string
  created_by_user_id?: string
}

export interface CreatePaymentScheduleRequest {
  driver_id: string
  payment_method: PaymentMethod
  schedule_type: 'monthly' | 'biweekly' | 'weekly'
  amount: number
  start_date: string
  end_date?: string
}

// =====================================================
// Driver Usage Limits
// =====================================================

export interface DriverUsageLimits {
  driver_id: string
  tenant_id: string

  // Current month
  current_month: {
    period: string // YYYY-MM
    personal_miles: number
    limit?: number
    percentage_used?: number
    exceeds_limit: boolean
  }

  // Current year
  current_year: {
    year: number
    personal_miles: number
    limit?: number
    percentage_used?: number
    exceeds_limit: boolean
  }

  // Warnings
  warnings: string[]

  // Policy info
  policy: {
    allow_personal_use: boolean
    require_approval: boolean
    charge_personal_use: boolean
    payment_method: PaymentMethod
  }
}

// =====================================================
// Dashboard & Reporting
// =====================================================

export interface PersonalUseDashboard {
  driver_id: string
  tenant_id: string
  current_month: string

  // Usage metrics
  month_personal_miles: number
  year_personal_miles: number
  monthly_limit?: number
  yearly_limit?: number
  monthly_percentage?: number
  yearly_percentage?: number

  // Pending items
  pending_approvals: number
  pending_charges_count: number
  pending_charges_amount: number
  pending_reimbursements_count: number
  pending_reimbursements_amount: number

  // Payment info
  next_payment_date?: Date | string
  next_payment_amount?: number
}

export interface ReimbursementSummary {
  driver_id: string
  tenant_id: string
  status: ReimbursementStatus
  request_count: number
  total_requested: number
  total_approved: number
  total_paid: number
  earliest_request?: Date | string
  latest_request?: Date | string
  avg_review_days?: number
}

export interface MonthlyPaymentObligation {
  tenant_id: string
  driver_id: string
  charge_period: string
  charges_owed: number
  reimbursements_due: number
  total_paid: number
  pending_count: number
}

export interface MonthlyUsageSummary {
  tenant_id: string
  driver_id: string
  month: string // YYYY-MM
  total_trips: number
  total_personal_miles: number
  total_business_miles: number
  total_miles: number
  personal_trips: number
  business_trips: number
  mixed_trips: number
  pending_approvals: number
}

export interface DriverUsageReport {
  driver_id: string
  driver_name?: string
  personal_miles: number
  business_miles: number
  total_miles: number
  personal_percentage: number
  charges_pending: number
  charges_paid: number
  limit_exceeded: boolean
}

export interface ComplianceReport {
  tenant_id: string
  report_period: {
    start: string
    end: string
  }
  total_drivers: number
  total_trips: number
  business_miles: number
  personal_miles: number
  business_percentage: number
  personal_percentage: number
  drivers: DriverUsageReport[]
  charges_billed: number
  charges_collected: number
}

// =====================================================
// Query Filters
// =====================================================

export interface TripUsageFilters {
  tenant_id?: string
  driver_id?: string
  vehicle_id?: string
  usage_type?: UsageType
  approval_status?: ApprovalStatus
  start_date?: string
  end_date?: string
  month?: string // YYYY-MM
  year?: number
  limit?: number
  offset?: number
}

export interface ChargeFilters {
  tenant_id?: string
  driver_id?: string
  charge_period?: string
  charge_status?: ChargeStatus
  is_reimbursement?: boolean
  start_date?: string
  end_date?: string
  limit?: number
  offset?: number
}

export interface ReimbursementFilters {
  tenant_id?: string
  driver_id?: string
  status?: ReimbursementStatus
  category?: string
  start_date?: string
  end_date?: string
  has_receipt?: boolean
  limit?: number
  offset?: number
}

// =====================================================
// API Response Types
// =====================================================

export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  limit: number
  offset: number
  has_more: boolean
}

// =====================================================
// Validation Helpers
// =====================================================

export function isValidUsageType(type: string): type is UsageType {
  return Object.values(UsageType).includes(type as UsageType)
}

export function isValidApprovalStatus(status: string): status is ApprovalStatus {
  return Object.values(ApprovalStatus).includes(status as ApprovalStatus)
}

export function isValidChargeStatus(status: string): status is ChargeStatus {
  return Object.values(ChargeStatus).includes(status as ChargeStatus)
}

export function isValidApprovalWorkflow(workflow: string): workflow is ApprovalWorkflow {
  return Object.values(ApprovalWorkflow).includes(workflow as ApprovalWorkflow)
}

export function isValidPaymentMethod(method: string): method is PaymentMethod {
  return Object.values(PaymentMethod).includes(method as PaymentMethod)
}

export function isValidCalculationMethod(method: string): method is CalculationMethod {
  return Object.values(CalculationMethod).includes(method as CalculationMethod)
}

export function isValidReimbursementStatus(status: string): status is ReimbursementStatus {
  return Object.values(ReimbursementStatus).includes(status as ReimbursementStatus)
}

// =====================================================
// Business Logic Helpers
// =====================================================

export function calculateMileageBreakdown(
  total_miles: number,
  usage_type: UsageType,
  business_percentage?: number
): { business_miles: number; personal_miles: number } {
  switch (usage_type) {
    case UsageType.BUSINESS:
      return { business_miles: total_miles, personal_miles: 0 }

    case UsageType.PERSONAL:
      return { business_miles: 0, personal_miles: total_miles }

    case UsageType.MIXED:
      if (business_percentage === undefined) {
        throw new Error('Business percentage required for mixed usage type')
      }
      const business_miles = Math.round(total_miles * (business_percentage / 100) * 100) / 100
      const personal_miles = Math.round(total_miles * ((100 - business_percentage) / 100) * 100) / 100
      return { business_miles, personal_miles }

    default:
      throw new Error(`Invalid usage type: ${usage_type}`)
  }
}

export function calculateCharge(miles: number, rate_per_mile: number): number {
  return Math.round(miles * rate_per_mile * 100) / 100
}

export function calculateActualCost(breakdown: ActualCostBreakdown): number {
  const costs = [
    breakdown.fuel || 0,
    breakdown.maintenance || 0,
    breakdown.insurance || 0,
    breakdown.depreciation || 0,
    breakdown.other || 0
  ]
  return Math.round(costs.reduce((sum, cost) => sum + cost, 0) * 100) / 100
}

export function formatChargePeriod(date: Date): string {
  return date.toISOString().slice(0, 7) // YYYY-MM
}

export function getChargePeriodDates(period: string): { start: Date; end: Date } {
  const [year, month] = period.split('-').map(Number)
  const start = new Date(year, month - 1, 1)
  const end = new Date(year, month, 0) // Last day of month
  return { start, end }
}

export function getPaymentMethodLabel(method: PaymentMethod): string {
  switch (method) {
    case PaymentMethod.DRIVER_DIRECT:
      return 'Driver Pays Directly'
    case PaymentMethod.DRIVER_REIMBURSE:
      return 'Driver Reimbursement'
    case PaymentMethod.COMPANY_BILL:
      return 'Monthly Billing'
    case PaymentMethod.PAYROLL_DEDUCT:
      return 'Payroll Deduction'
  }
}

export function getCalculationMethodLabel(method: CalculationMethod): string {
  switch (method) {
    case CalculationMethod.PER_MILE:
      return 'Per Mile Rate'
    case CalculationMethod.FLAT_FEE:
      return 'Flat Fee'
    case CalculationMethod.ACTUAL_COST:
      return 'Actual Costs'
  }
}
