/**
 * Fuel Card Integration Types
 * Purpose: Complete type definitions for fuel card management system
 * Created: 2026-02-02
 */

/**
 * Fuel Card Provider (WEX, FleetCor, Comdata, etc.)
 */
export interface FuelCardProvider {
  id: string;
  tenant_id: string;
  provider_name: string;
  api_endpoint?: string;
  api_key_encrypted?: string;
  account_number?: string;
  is_active: boolean;
  sync_frequency_minutes?: number;
  last_sync_at?: Date;
  metadata?: Record<string, any>;
  created_at: Date;
  updated_at: Date;
}

/**
 * Create Fuel Card Provider Input
 */
export interface CreateFuelCardProviderInput {
  provider_name: string;
  api_endpoint?: string;
  api_key?: string; // Will be encrypted before storage
  account_number?: string;
  is_active?: boolean;
  sync_frequency_minutes?: number;
  metadata?: Record<string, any>;
}

/**
 * Update Fuel Card Provider Input
 */
export interface UpdateFuelCardProviderInput {
  provider_name?: string;
  api_endpoint?: string;
  api_key?: string;
  account_number?: string;
  is_active?: boolean;
  sync_frequency_minutes?: number;
  metadata?: Record<string, any>;
}

/**
 * Fuel Card Status
 */
export type FuelCardStatus = 'active' | 'suspended' | 'lost' | 'expired';

/**
 * Fuel Card assigned to vehicle or driver
 */
export interface FuelCard {
  id: string;
  tenant_id: string;
  provider_id: string;
  card_number_encrypted: string;
  card_last4: string;
  vehicle_id?: string;
  driver_id?: string;
  status: FuelCardStatus;
  issue_date: Date;
  expiry_date: Date;
  daily_limit?: number;
  weekly_limit?: number;
  monthly_limit?: number;
  allowed_fuel_types?: string[];
  allowed_product_codes?: string[];
  pin_required: boolean;
  odometer_required: boolean;
  metadata?: Record<string, any>;
  created_at: Date;
  updated_at: Date;
}

/**
 * Create Fuel Card Input
 */
export interface CreateFuelCardInput {
  provider_id: string;
  card_number: string; // Will be encrypted before storage
  card_last4: string;
  vehicle_id?: string;
  driver_id?: string;
  status?: FuelCardStatus;
  issue_date: Date | string;
  expiry_date: Date | string;
  daily_limit?: number;
  weekly_limit?: number;
  monthly_limit?: number;
  allowed_fuel_types?: string[];
  allowed_product_codes?: string[];
  pin_required?: boolean;
  odometer_required?: boolean;
  metadata?: Record<string, any>;
}

/**
 * Update Fuel Card Input
 */
export interface UpdateFuelCardInput {
  vehicle_id?: string | null;
  driver_id?: string | null;
  status?: FuelCardStatus;
  expiry_date?: Date | string;
  daily_limit?: number | null;
  weekly_limit?: number | null;
  monthly_limit?: number | null;
  allowed_fuel_types?: string[];
  allowed_product_codes?: string[];
  pin_required?: boolean;
  odometer_required?: boolean;
  metadata?: Record<string, any>;
}

/**
 * Reconciliation Status
 */
export type ReconciliationStatus = 'pending' | 'matched' | 'unmatched' | 'disputed';

/**
 * Fuel Card Transaction from provider
 */
export interface FuelCardTransaction {
  id: string;
  tenant_id: string;
  fuel_card_id: string;
  provider_transaction_id?: string;
  transaction_date: Date;
  vehicle_id?: string;
  driver_id?: string;
  fuel_type: string;
  gallons: number;
  cost_per_gallon: number;
  total_cost: number;
  odometer_reading?: number;
  location?: string;
  latitude?: number;
  longitude?: number;
  merchant_name?: string;
  merchant_address?: string;
  product_code?: string;
  unit_of_measure?: string;
  receipt_url?: string;
  is_approved?: boolean;
  approved_by?: string;
  approved_at?: Date;
  is_disputed: boolean;
  dispute_reason?: string;
  disputed_by?: string;
  disputed_at?: Date;
  reconciled_with_fuel_transaction_id?: string;
  reconciliation_status: ReconciliationStatus;
  metadata?: Record<string, any>;
  created_at: Date;
  updated_at: Date;
}

/**
 * Create Fuel Card Transaction Input (bulk import)
 */
export interface CreateFuelCardTransactionInput {
  fuel_card_id: string;
  provider_transaction_id?: string;
  transaction_date: Date | string;
  vehicle_id?: string;
  driver_id?: string;
  fuel_type: string;
  gallons: number;
  cost_per_gallon: number;
  total_cost: number;
  odometer_reading?: number;
  location?: string;
  latitude?: number;
  longitude?: number;
  merchant_name?: string;
  merchant_address?: string;
  product_code?: string;
  unit_of_measure?: string;
  receipt_url?: string;
  metadata?: Record<string, any>;
}

/**
 * Update Fuel Card Transaction Input
 */
export interface UpdateFuelCardTransactionInput {
  vehicle_id?: string;
  driver_id?: string;
  is_approved?: boolean;
  is_disputed?: boolean;
  dispute_reason?: string;
  reconciliation_status?: ReconciliationStatus;
  metadata?: Record<string, any>;
}

/**
 * Fuel Card Transaction with enriched data
 */
export interface FuelCardTransactionWithDetails extends FuelCardTransaction {
  card_last4?: string;
  vehicle_name?: string;
  driver_name?: string;
  provider_name?: string;
}

/**
 * Reconciliation Match Result
 */
export interface ReconciliationMatch {
  fuel_card_transaction_id: string;
  fuel_transaction_id: string;
  match_score: number; // 0-100
  match_factors: {
    vehicle_match: boolean;
    date_match: boolean;
    gallons_match: boolean;
    amount_match: boolean;
    location_match?: boolean;
  };
  confidence: 'high' | 'medium' | 'low';
}

/**
 * Reconciliation Result
 */
export interface ReconciliationResult {
  processed_count: number;
  matched_count: number;
  unmatched_count: number;
  matches: ReconciliationMatch[];
  unmatched_transactions: string[]; // IDs of unmatched transactions
  errors: Array<{ transaction_id: string; error: string }>;
}

/**
 * Fraud Detection Alert
 */
export interface FraudAlert {
  transaction_id: string;
  alert_type: 'unusual_location' | 'excessive_fill' | 'rapid_succession' | 'distance_anomaly' | 'duplicate_transaction';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  details: Record<string, any>;
  created_at: Date;
}

/**
 * Fuel Card Utilization Summary
 */
export interface FuelCardUtilization {
  card_id: string;
  card_last4: string;
  status: FuelCardStatus;
  vehicle_name?: string;
  driver_name?: string;
  transaction_count: number;
  total_gallons: number;
  total_cost: number;
  last_transaction_date?: Date;
  pending_reconciliation: number;
  disputed_transactions: number;
}

/**
 * Reconciliation Summary
 */
export interface ReconciliationSummary {
  tenant_id: string;
  pending_count: number;
  matched_count: number;
  unmatched_count: number;
  disputed_count: number;
  pending_amount: number;
  unmatched_amount: number;
  disputed_amount: number;
}

/**
 * Bulk Import Request
 */
export interface BulkImportRequest {
  provider_id: string;
  transactions: CreateFuelCardTransactionInput[];
  auto_reconcile?: boolean;
}

/**
 * Bulk Import Result
 */
export interface BulkImportResult {
  success: boolean;
  imported_count: number;
  skipped_count: number;
  error_count: number;
  transaction_ids: string[];
  errors: Array<{ row: number; error: string; data: any }>;
  reconciliation_result?: ReconciliationResult;
}

/**
 * Query Filters for Fuel Card Transactions
 */
export interface FuelCardTransactionFilters {
  fuel_card_id?: string;
  vehicle_id?: string;
  driver_id?: string;
  reconciliation_status?: ReconciliationStatus | ReconciliationStatus[];
  is_disputed?: boolean;
  start_date?: Date | string;
  end_date?: Date | string;
  min_amount?: number;
  max_amount?: number;
  search?: string; // Search merchant name, location, etc.
}

/**
 * Pagination Parameters
 */
export interface PaginationParams {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

/**
 * Paginated Response
 */
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
