/**
 * Accounts Payable & Depreciation Types
 * Types for AP tracking, asset depreciation, budgets, and purchase requisitions
 */

// ============================================================================
// ACCOUNTS PAYABLE
// ============================================================================

export type APStatus = 'unpaid' | 'partially-paid' | 'paid' | 'overdue' | 'disputed';
export type AgingBucket = 'current' | '1-30' | '31-60' | '61-90' | '90+';
export type PaymentMethod = 'check' | 'ach' | 'wire' | 'credit-card' | 'cash';

export interface AccountsPayable {
  id: string;
  tenant_id: string;
  invoice_id: string | null;
  vendor_id: string;
  invoice_number: string;
  invoice_date: Date;
  due_date: Date;
  amount_due: number;
  amount_paid: number;
  balance_remaining: number;
  status: APStatus;
  payment_terms: string | null;
  aging_days: number | null;
  aging_bucket: AgingBucket | null;
  discount_available: number | null;
  discount_date: Date | null;
  payment_batch_id: string | null;
  paid_date: Date | null;
  payment_method: PaymentMethod | null;
  payment_reference: string | null;
  payment_notes: string | null;
  metadata: Record<string, unknown>;
  created_at: Date;
  updated_at: Date;
}

export interface CreateAccountsPayableInput {
  tenant_id: string;
  invoice_id?: string;
  vendor_id: string;
  invoice_number: string;
  invoice_date: Date;
  due_date: Date;
  amount_due: number;
  payment_terms?: string;
  discount_available?: number;
  discount_date?: Date;
  metadata?: Record<string, unknown>;
}

export interface PaymentInput {
  amount_paid: number;
  paid_date: Date;
  payment_method: PaymentMethod;
  payment_reference?: string;
  payment_notes?: string;
}

export interface APAgingReport {
  tenant_id: string;
  vendor_id: string;
  vendor_name: string;
  total_invoices: number;
  total_balance: number;
  current_balance: number;
  balance_1_30: number;
  balance_31_60: number;
  balance_61_90: number;
  balance_90_plus: number;
  avg_days_outstanding: number;
}

export interface CashFlowForecast {
  date: Date;
  total_due: number;
  total_overdue: number;
  payments_scheduled: number;
  net_cash_flow: number;
  vendors: Array<{
    vendor_id: string;
    vendor_name: string;
    amount_due: number;
    due_date: Date;
  }>;
}

// ============================================================================
// ASSET DEPRECIATION
// ============================================================================

export type DepreciationMethod = 'straight-line' | 'declining-balance' | 'units-of-production';

export interface AssetDepreciation {
  id: string;
  tenant_id: string;
  asset_id: string | null;
  vehicle_id: string | null;
  depreciation_method: DepreciationMethod;
  original_cost: number;
  salvage_value: number;
  useful_life_years: number | null;
  useful_life_units: number | null;
  start_date: Date;
  depreciation_per_year: number | null;
  depreciation_per_unit: number | null;
  total_depreciation: number;
  current_book_value: number | null;
  last_calculated_date: Date | null;
  notes: string | null;
  metadata: Record<string, unknown>;
  created_at: Date;
  updated_at: Date;
}

export interface CreateDepreciationInput {
  tenant_id: string;
  asset_id?: string;
  vehicle_id?: string;
  depreciation_method: DepreciationMethod;
  original_cost: number;
  salvage_value: number;
  useful_life_years?: number;
  useful_life_units?: number;
  start_date: Date;
  notes?: string;
}

export interface DepreciationSchedule {
  id: string;
  tenant_id: string;
  asset_depreciation_id: string;
  period_start: Date;
  period_end: Date;
  beginning_book_value: number;
  depreciation_expense: number;
  accumulated_depreciation: number;
  ending_book_value: number;
  units_used: number | null;
  is_actual: boolean;
  notes: string | null;
  metadata: Record<string, unknown>;
  created_at: Date;
}

export interface DepreciationCalculationResult {
  asset_depreciation_id: string;
  period_start: Date;
  period_end: Date;
  depreciation_expense: number;
  accumulated_depreciation: number;
  book_value: number;
  schedule_entries: DepreciationSchedule[];
}

// ============================================================================
// ASSET DISPOSAL
// ============================================================================

export type DisposalMethod = 'sold' | 'traded' | 'scrapped' | 'donated' | 'stolen' | 'destroyed';
export type AssetCondition = 'excellent' | 'good' | 'fair' | 'poor' | 'salvage';

export interface AssetDisposal {
  id: string;
  tenant_id: string;
  asset_id: string | null;
  vehicle_id: string | null;
  disposal_date: Date;
  disposal_method: DisposalMethod;
  disposal_reason: string;
  book_value_at_disposal: number;
  sale_price: number | null;
  trade_in_value: number | null;
  buyer_name: string | null;
  buyer_contact: string | null;
  sale_document_url: string | null;
  title_transferred: boolean;
  title_transfer_date: Date | null;
  gain_loss: number | null;
  disposal_costs: number | null;
  net_proceeds: number | null;
  odometer_at_disposal: number | null;
  condition_at_disposal: AssetCondition | null;
  disposal_notes: string | null;
  processed_by: string | null;
  metadata: Record<string, unknown>;
  created_at: Date;
  updated_at: Date;
}

export interface CreateDisposalInput {
  tenant_id: string;
  asset_id?: string;
  vehicle_id?: string;
  disposal_date: Date;
  disposal_method: DisposalMethod;
  disposal_reason: string;
  book_value_at_disposal: number;
  sale_price?: number;
  trade_in_value?: number;
  buyer_name?: string;
  buyer_contact?: string;
  disposal_costs?: number;
  odometer_at_disposal?: number;
  condition_at_disposal?: AssetCondition;
  disposal_notes?: string;
  processed_by?: string;
}

// ============================================================================
// BUDGETS
// ============================================================================

export type BudgetPeriod = 'monthly' | 'quarterly' | 'annual';
export type BudgetCategory = 'fuel' | 'maintenance' | 'insurance' | 'depreciation' | 'parts' | 'labor';
export type BudgetStatus = 'active' | 'closed' | 'locked';
export type BudgetHealth = 'over-budget' | 'at-risk' | 'on-track' | 'under-budget';

export interface Budget {
  id: string;
  tenant_id: string;
  budget_name: string;
  budget_period: BudgetPeriod;
  fiscal_year: number;
  period_start: Date;
  period_end: Date;
  department: string | null;
  cost_center: string | null;
  budget_category: BudgetCategory;
  budgeted_amount: number;
  spent_to_date: number;
  committed_amount: number;
  available_amount: number | null;
  variance_amount: number | null;
  variance_percentage: number | null;
  forecast_end_of_period: number | null;
  status: BudgetStatus;
  approved_by: string | null;
  approved_at: Date | null;
  notes: string | null;
  metadata: Record<string, unknown>;
  created_at: Date;
  updated_at: Date;
}

export interface CreateBudgetInput {
  tenant_id: string;
  budget_name: string;
  budget_period: BudgetPeriod;
  fiscal_year: number;
  period_start: Date;
  period_end: Date;
  department?: string;
  cost_center?: string;
  budget_category: BudgetCategory;
  budgeted_amount: number;
}

export interface BudgetVsActual {
  tenant_id: string;
  fiscal_year: number;
  budget_period: BudgetPeriod;
  budget_category: BudgetCategory;
  department: string | null;
  budgeted_amount: number;
  spent_to_date: number;
  committed_amount: number;
  available_amount: number | null;
  variance_amount: number | null;
  variance_percentage: number | null;
  budget_health: BudgetHealth;
}

// ============================================================================
// PURCHASE REQUISITIONS
// ============================================================================

export type RequisitionStatus = 'draft' | 'submitted' | 'approved' | 'denied' | 'converted-to-po' | 'cancelled';

export interface PurchaseRequisition {
  id: string;
  tenant_id: string;
  requisition_number: string;
  requested_by: string;
  department: string | null;
  cost_center: string | null;
  requisition_date: Date;
  needed_by_date: Date | null;
  justification: string;
  vendor_id: string | null;
  suggested_vendor: string | null;
  line_items: RequisitionLineItem[];
  subtotal: number;
  tax_amount: number | null;
  shipping_cost: number | null;
  total_amount: number;
  budget_id: string | null;
  status: RequisitionStatus;
  submitted_at: Date | null;
  approval_workflow: ApprovalWorkflowItem[];
  approved_by: string | null;
  approved_at: Date | null;
  denied_by: string | null;
  denied_at: Date | null;
  denial_reason: string | null;
  purchase_order_id: string | null;
  converted_to_po_at: Date | null;
  notes: string | null;
  attachments: Attachment[];
  metadata: Record<string, unknown>;
  created_at: Date;
  updated_at: Date;
}

export interface RequisitionLineItem {
  description: string;
  quantity: number;
  unit_cost: number;
  total: number;
}

export interface ApprovalWorkflowItem {
  approver_id: string;
  role: string;
  status: 'pending' | 'approved' | 'denied';
  date: Date | null;
  comments: string | null;
}

export interface Attachment {
  name: string;
  url: string;
  upload_date: Date;
  uploaded_by: string;
}

export interface CreateRequisitionInput {
  tenant_id: string;
  requested_by: string;
  department?: string;
  cost_center?: string;
  requisition_date: Date;
  needed_by_date?: Date;
  justification: string;
  vendor_id?: string;
  suggested_vendor?: string;
  line_items: RequisitionLineItem[];
  subtotal: number;
  tax_amount?: number;
  shipping_cost?: number;
  total_amount: number;
  budget_id?: string;
}

// ============================================================================
// INVOICE ENHANCEMENTS
// ============================================================================

export interface InvoiceApproval {
  approver_id: string;
  role: string;
  status: 'pending' | 'approved' | 'rejected';
  date: Date | null;
  comments: string | null;
}

export interface InvoiceCoding {
  department: string;
  cost_center: string;
  gl_account: string;
}

// ============================================================================
// QUERY & FILTER OPTIONS
// ============================================================================

export interface APQueryOptions {
  tenant_id: string;
  vendor_id?: string;
  status?: APStatus | APStatus[];
  aging_bucket?: AgingBucket;
  due_date_from?: Date;
  due_date_to?: Date;
  min_amount?: number;
  max_amount?: number;
  limit?: number;
  offset?: number;
}

export interface DepreciationQueryOptions {
  tenant_id: string;
  asset_id?: string;
  vehicle_id?: string;
  depreciation_method?: DepreciationMethod;
  as_of_date?: Date;
}

export interface BudgetQueryOptions {
  tenant_id: string;
  fiscal_year?: number;
  budget_period?: BudgetPeriod;
  budget_category?: BudgetCategory;
  department?: string;
  status?: BudgetStatus;
}

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

export interface APListResponse {
  data: AccountsPayable[];
  total: number;
  limit: number;
  offset: number;
}

export interface APAgingReportResponse {
  generated_at: Date;
  tenant_id: string;
  summary: {
    total_vendors: number;
    total_invoices: number;
    total_outstanding: number;
    current: number;
    days_1_30: number;
    days_31_60: number;
    days_61_90: number;
    days_90_plus: number;
  };
  by_vendor: APAgingReport[];
}

export interface DepreciationSummary {
  tenant_id: string;
  depreciation_method: DepreciationMethod;
  total_assets: number;
  total_original_cost: number;
  total_accumulated_depreciation: number;
  total_book_value: number;
  avg_age_years: number;
}

export interface MonthlyDepreciationJournal {
  period: string; // YYYY-MM
  entries: Array<{
    asset_id: string;
    asset_name: string;
    depreciation_expense: number;
    accumulated_depreciation: number;
    book_value: number;
  }>;
  total_monthly_expense: number;
}
