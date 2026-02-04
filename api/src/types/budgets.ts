/**
 * Budget Management & Purchase Requisitions Type Definitions
 * Corresponds to migration 004_budget_management.sql
 *
 * @module types/budgets
 * @created 2026-02-02
 */

import { UUID, Timestamp, JSONB } from './database-tables';

// ============================================================================
// Enums & Constants
// ============================================================================

export type BudgetPeriod = 'monthly' | 'quarterly' | 'annual';

export type BudgetCategory =
  | 'fuel'
  | 'maintenance'
  | 'insurance'
  | 'depreciation'
  | 'parts'
  | 'labor'
  | 'equipment'
  | 'administrative'
  | 'other';

export type BudgetStatus = 'draft' | 'active' | 'closed' | 'suspended';

export type RequisitionStatus =
  | 'draft'
  | 'submitted'
  | 'pending-approval'
  | 'approved'
  | 'denied'
  | 'converted-to-po'
  | 'cancelled';

export type BudgetAlertType =
  | 'threshold_80'
  | 'threshold_90'
  | 'threshold_100'
  | 'overspent'
  | 'forecast_warning';

export type BudgetTransactionType =
  | 'initial_allocation'
  | 'adjustment'
  | 'transfer'
  | 'expense_recorded'
  | 'commitment'
  | 'commitment_release'
  | 'reallocation';

export type BudgetHealthStatus = 'healthy' | 'warning' | 'critical' | 'over_budget';

// ============================================================================
// Budget Interface
// ============================================================================

export interface Budget {
  id: UUID;
  tenant_id: UUID;
  budget_name: string;
  budget_period: BudgetPeriod;
  fiscal_year: number;
  period_start: Date;
  period_end: Date;
  department?: string;
  cost_center?: string;
  budget_category: BudgetCategory;
  budgeted_amount: number;
  spent_to_date: number;
  committed_amount: number;
  available_amount: number; // Calculated field
  variance_amount: number; // Calculated field
  variance_percentage: number; // Calculated field
  forecast_end_of_period?: number;
  status: BudgetStatus;
  approved_by?: UUID;
  approved_at?: Timestamp;
  notes?: string;
  metadata?: JSONB;
  created_at: Timestamp;
  updated_at: Timestamp;
}

export interface BudgetCreateInput {
  budget_name: string;
  budget_period: BudgetPeriod;
  fiscal_year: number;
  period_start: Date;
  period_end: Date;
  department?: string;
  cost_center?: string;
  budget_category: BudgetCategory;
  budgeted_amount: number;
  notes?: string;
  metadata?: JSONB;
}

export interface BudgetUpdateInput {
  budget_name?: string;
  budgeted_amount?: number;
  forecast_end_of_period?: number;
  status?: BudgetStatus;
  notes?: string;
  metadata?: JSONB;
}

// ============================================================================
// Purchase Requisition Interfaces
// ============================================================================

export interface PurchaseRequisitionLineItem {
  description: string;
  quantity: number;
  unit_cost: number;
  total: number;
  part_number?: string;
  notes?: string;
}

export interface ApprovalWorkflowStep {
  approver_id: UUID;
  role: string;
  status: 'pending' | 'approved' | 'denied';
  date?: Timestamp;
  comments?: string;
  threshold_amount?: number;
}

export interface RequisitionAttachment {
  filename: string;
  url: string;
  upload_date: Timestamp;
  uploaded_by: UUID;
}

export interface PurchaseRequisition {
  id: UUID;
  tenant_id: UUID;
  requisition_number: string;
  requested_by: UUID;
  department?: string;
  cost_center?: string;
  requisition_date: Date;
  needed_by_date?: Date;
  justification: string;
  vendor_id?: UUID;
  suggested_vendor?: string;
  line_items: PurchaseRequisitionLineItem[];
  subtotal: number;
  tax_amount: number;
  shipping_cost: number;
  total_amount: number;
  budget_id?: UUID;
  status: RequisitionStatus;
  submitted_at?: Timestamp;
  approval_workflow: ApprovalWorkflowStep[];
  approved_by?: UUID;
  approved_at?: Timestamp;
  denied_by?: UUID;
  denied_at?: Timestamp;
  denial_reason?: string;
  purchase_order_id?: UUID;
  converted_to_po_at?: Timestamp;
  notes?: string;
  attachments: RequisitionAttachment[];
  metadata?: JSONB;
  created_at: Timestamp;
  updated_at: Timestamp;
}

export interface PurchaseRequisitionCreateInput {
  requested_by: UUID;
  department?: string;
  cost_center?: string;
  needed_by_date?: Date;
  justification: string;
  vendor_id?: UUID;
  suggested_vendor?: string;
  line_items: PurchaseRequisitionLineItem[];
  subtotal: number;
  tax_amount?: number;
  shipping_cost?: number;
  total_amount: number;
  budget_id?: UUID;
  notes?: string;
  metadata?: JSONB;
}

export interface PurchaseRequisitionUpdateInput {
  department?: string;
  cost_center?: string;
  needed_by_date?: Date;
  justification?: string;
  vendor_id?: UUID;
  suggested_vendor?: string;
  line_items?: PurchaseRequisitionLineItem[];
  subtotal?: number;
  tax_amount?: number;
  shipping_cost?: number;
  total_amount?: number;
  budget_id?: UUID;
  notes?: string;
  metadata?: JSONB;
}

export interface ApprovalDecisionInput {
  approver_id: UUID;
  decision: 'approve' | 'deny';
  comments?: string;
}

export interface ConvertToPOInput {
  purchase_order_number?: string;
  vendor_id: UUID;
  expected_delivery_date?: Date;
  notes?: string;
}

// ============================================================================
// Budget Alert Interfaces
// ============================================================================

export interface BudgetAlertRecipient {
  user_id: UUID;
  email: string;
  notification_sent: boolean;
}

export interface BudgetAlert {
  id: UUID;
  tenant_id: UUID;
  budget_id: UUID;
  alert_type: BudgetAlertType;
  alert_threshold: number;
  current_percentage: number;
  amount_spent: number;
  amount_budgeted: number;
  alert_message: string;
  recipients: BudgetAlertRecipient[];
  sent_at: Timestamp;
  acknowledged: boolean;
  acknowledged_by?: UUID;
  acknowledged_at?: Timestamp;
  metadata?: JSONB;
  created_at: Timestamp;
}

// ============================================================================
// Budget Transaction Interfaces
// ============================================================================

export interface BudgetTransaction {
  id: UUID;
  tenant_id: UUID;
  budget_id: UUID;
  transaction_type: BudgetTransactionType;
  transaction_date: Timestamp;
  amount: number;
  previous_spent?: number;
  new_spent?: number;
  previous_committed?: number;
  new_committed?: number;
  reference_type?: string;
  reference_id?: UUID;
  description?: string;
  performed_by?: UUID;
  metadata?: JSONB;
  created_at: Timestamp;
}

// ============================================================================
// Variance Report Interfaces
// ============================================================================

export interface BudgetVarianceReport {
  id: UUID;
  tenant_id: UUID;
  budget_name: string;
  department?: string;
  cost_center?: string;
  budget_category: BudgetCategory;
  fiscal_year: number;
  period_start: Date;
  period_end: Date;
  budgeted_amount: number;
  spent_to_date: number;
  committed_amount: number;
  available_amount: number;
  variance_amount: number;
  variance_percentage: number;
  forecast_end_of_period?: number;
  status: BudgetStatus;
  health_status: BudgetHealthStatus;
  consumption_percentage: number;
  days_remaining: number;
  period_elapsed_percentage: number;
  created_at: Timestamp;
  updated_at: Timestamp;
}

export interface PendingPurchaseRequisition {
  id: UUID;
  tenant_id: UUID;
  requisition_number: string;
  requested_by: UUID;
  department?: string;
  requisition_date: Date;
  needed_by_date?: Date;
  total_amount: number;
  status: RequisitionStatus;
  justification: string;
  days_pending: number;
  is_urgent: boolean;
  approval_workflow: ApprovalWorkflowStep[];
  created_at: Timestamp;
}

// ============================================================================
// Query & Filter Interfaces
// ============================================================================

export interface BudgetFilters {
  fiscal_year?: number;
  department?: string;
  cost_center?: string;
  budget_category?: BudgetCategory;
  status?: BudgetStatus;
  period_start?: Date;
  period_end?: Date;
  health_status?: BudgetHealthStatus;
}

export interface RequisitionFilters {
  status?: RequisitionStatus;
  requested_by?: UUID;
  department?: string;
  vendor_id?: UUID;
  budget_id?: UUID;
  date_from?: Date;
  date_to?: Date;
  is_urgent?: boolean;
}

// ============================================================================
// Response Interfaces
// ============================================================================

export interface BudgetListResponse {
  budgets: Budget[];
  total: number;
  page: number;
  limit: number;
}

export interface RequisitionListResponse {
  requisitions: PurchaseRequisition[];
  total: number;
  page: number;
  limit: number;
}

export interface BudgetVarianceReportResponse {
  reports: BudgetVarianceReport[];
  summary: {
    total_budgeted: number;
    total_spent: number;
    total_committed: number;
    total_available: number;
    overall_variance_percentage: number;
    budgets_on_track: number;
    budgets_at_risk: number;
    budgets_over_budget: number;
  };
}

export interface BudgetAlertListResponse {
  alerts: BudgetAlert[];
  total: number;
  unacknowledged_count: number;
}

// ============================================================================
// Service Result Types
// ============================================================================

export interface BudgetUpdateResult {
  budget: Budget;
  alert_triggered?: BudgetAlert;
  transaction_recorded: BudgetTransaction;
}

export interface ApprovalResult {
  requisition: PurchaseRequisition;
  approved: boolean;
  next_approver?: UUID;
  notification_sent: boolean;
}

export interface ConvertToPOResult {
  requisition: PurchaseRequisition;
  purchase_order_id: UUID;
  success: boolean;
  message: string;
}

// ============================================================================
// Error Types
// ============================================================================

export class BudgetExceededError extends Error {
  constructor(
    public budgetId: UUID,
    public budgetName: string,
    public requestedAmount: number,
    public availableAmount: number
  ) {
    super(
      `Budget "${budgetName}" exceeded: Requested ${requestedAmount}, Available ${availableAmount}`
    );
    this.name = 'BudgetExceededError';
  }
}

export class InsufficientBudgetError extends Error {
  constructor(
    public budgetId: UUID,
    public budgetName: string,
    public requestedAmount: number,
    public availableAmount: number
  ) {
    super(
      `Insufficient budget in "${budgetName}": Requested ${requestedAmount}, Available ${availableAmount}`
    );
    this.name = 'InsufficientBudgetError';
  }
}

export class UnauthorizedApprovalError extends Error {
  constructor(public userId: UUID, public requisitionId: UUID) {
    super(`User ${userId} is not authorized to approve requisition ${requisitionId}`);
    this.name = 'UnauthorizedApprovalError';
  }
}
