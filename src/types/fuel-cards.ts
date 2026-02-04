/**
 * Fuel Card Integration Types (Frontend)
 * Purpose: Type definitions for fuel card management UI
 * Created: 2026-02-02
 */

export type FuelCardStatus = 'active' | 'suspended' | 'lost' | 'expired';
export type ReconciliationStatus = 'pending' | 'matched' | 'unmatched' | 'disputed';

export interface FuelCardProvider {
  id: string;
  tenant_id: string;
  provider_name: string;
  api_endpoint?: string;
  account_number?: string;
  is_active: boolean;
  sync_frequency_minutes?: number;
  last_sync_at?: string;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface FuelCard {
  id: string;
  tenant_id: string;
  provider_id: string;
  card_last4: string;
  vehicle_id?: string;
  driver_id?: string;
  status: FuelCardStatus;
  issue_date: string;
  expiry_date: string;
  daily_limit?: number;
  weekly_limit?: number;
  monthly_limit?: number;
  allowed_fuel_types?: string[];
  allowed_product_codes?: string[];
  pin_required: boolean;
  odometer_required: boolean;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface FuelCardTransaction {
  id: string;
  tenant_id: string;
  fuel_card_id: string;
  provider_transaction_id?: string;
  transaction_date: string;
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
  approved_at?: string;
  is_disputed: boolean;
  dispute_reason?: string;
  disputed_by?: string;
  disputed_at?: string;
  reconciled_with_fuel_transaction_id?: string;
  reconciliation_status: ReconciliationStatus;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface FuelCardTransactionWithDetails extends FuelCardTransaction {
  card_last4?: string;
  vehicle_name?: string;
  driver_name?: string;
  provider_name?: string;
}

export interface FuelCardUtilization {
  card_id: string;
  card_last4: string;
  status: FuelCardStatus;
  vehicle_name?: string;
  driver_name?: string;
  transaction_count: number;
  total_gallons: number;
  total_cost: number;
  last_transaction_date?: string;
  pending_reconciliation: number;
  disputed_transactions: number;
}

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

export interface ReconciliationMatch {
  fuel_card_transaction_id: string;
  fuel_transaction_id: string;
  match_score: number;
  match_factors: {
    vehicle_match: boolean;
    date_match: boolean;
    gallons_match: boolean;
    amount_match: boolean;
    location_match?: boolean;
  };
  confidence: 'high' | 'medium' | 'low';
}

export interface FraudAlert {
  transaction_id: string;
  alert_type: 'unusual_location' | 'excessive_fill' | 'rapid_succession' | 'distance_anomaly' | 'duplicate_transaction';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  details: Record<string, any>;
  created_at: string;
}

// API Request/Response types
export interface CreateFuelCardProviderRequest {
  provider_name: string;
  api_endpoint?: string;
  api_key?: string;
  account_number?: string;
  is_active?: boolean;
  sync_frequency_minutes?: number;
  metadata?: Record<string, any>;
}

export interface CreateFuelCardRequest {
  provider_id: string;
  card_number: string;
  card_last4: string;
  vehicle_id?: string;
  driver_id?: string;
  status?: FuelCardStatus;
  issue_date: string;
  expiry_date: string;
  daily_limit?: number;
  weekly_limit?: number;
  monthly_limit?: number;
  allowed_fuel_types?: string[];
  allowed_product_codes?: string[];
  pin_required?: boolean;
  odometer_required?: boolean;
  metadata?: Record<string, any>;
}

export interface UpdateFuelCardRequest {
  vehicle_id?: string | null;
  driver_id?: string | null;
  status?: FuelCardStatus;
  expiry_date?: string;
  daily_limit?: number | null;
  weekly_limit?: number | null;
  monthly_limit?: number | null;
  allowed_fuel_types?: string[];
  allowed_product_codes?: string[];
  pin_required?: boolean;
  odometer_required?: boolean;
  metadata?: Record<string, any>;
}

export interface CreateFuelCardTransactionRequest {
  fuel_card_id: string;
  provider_transaction_id?: string;
  transaction_date: string;
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

export interface BulkImportRequest {
  provider_id: string;
  transactions: CreateFuelCardTransactionRequest[];
  auto_reconcile?: boolean;
}

export interface BulkImportResult {
  success: boolean;
  imported_count: number;
  skipped_count: number;
  error_count: number;
  transaction_ids: string[];
  errors: Array<{ row: number; error: string; data: any }>;
  reconciliation_result?: {
    processed_count: number;
    matched_count: number;
    unmatched_count: number;
    matches: ReconciliationMatch[];
    unmatched_transactions: string[];
    errors: Array<{ transaction_id: string; error: string }>;
  };
}

export interface FuelCardFilters {
  status?: FuelCardStatus;
  vehicle_id?: string;
  driver_id?: string;
}

export interface FuelCardTransactionFilters {
  fuel_card_id?: string;
  vehicle_id?: string;
  driver_id?: string;
  reconciliation_status?: ReconciliationStatus | ReconciliationStatus[];
  is_disputed?: boolean;
  start_date?: string;
  end_date?: string;
  min_amount?: number;
  max_amount?: number;
  search?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface ApiErrorResponse {
  error: string;
  details?: any;
}
