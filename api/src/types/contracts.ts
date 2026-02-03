/**
 * Vehicle Contracts & Leasing Type Definitions
 *
 * This module contains TypeScript type definitions for vehicle contracts,
 * lease management, lease-end inspections, and service contracts.
 *
 * @module types/contracts
 * @since 2026-02-02
 */

// ============================================================================
// Vehicle Contract Types
// ============================================================================

export type ContractType = 'lease' | 'purchase' | 'rental' | 'service-contract';

export type ContractStatus = 'active' | 'expired' | 'terminated' | 'renewed';

export interface VehicleContract {
  id: string;
  tenant_id: string;

  // Contract identification
  contract_number: string;
  contract_type: ContractType;

  // Associations
  vehicle_id: string | null;
  vendor_id: string;

  // Contract dates and terms
  start_date: string; // ISO date
  end_date: string; // ISO date
  term_months: number | null;

  // Financial terms
  monthly_payment: number | null;
  down_payment: number | null;
  buyout_option: boolean;
  buyout_amount: number | null;

  // Lease-specific terms
  mileage_allowance_annual: number | null;
  excess_mileage_fee: number | null; // Per mile
  early_termination_fee: number | null;

  // Coverage and services
  wear_and_tear_coverage: boolean;
  maintenance_included: boolean;
  insurance_included: boolean;

  // Contract management
  contract_document_url: string | null;
  auto_renew: boolean;
  renewal_notice_days: number;

  // Status tracking
  status: ContractStatus;
  termination_date: string | null; // ISO date
  termination_reason: string | null;

  // Financial tracking
  total_paid: number;
  final_buyout_exercised: boolean;

  // Metadata
  notes: string | null;
  metadata: Record<string, any>;

  // Audit fields
  created_at: string; // ISO timestamp
  updated_at: string; // ISO timestamp
  created_by: string | null;
  updated_by: string | null;
}

export interface CreateVehicleContractDTO {
  contract_number: string;
  contract_type: ContractType;
  vehicle_id?: string;
  vendor_id: string;
  start_date: string;
  end_date: string;
  term_months?: number;
  monthly_payment?: number;
  down_payment?: number;
  buyout_option?: boolean;
  buyout_amount?: number;
  mileage_allowance_annual?: number;
  excess_mileage_fee?: number;
  early_termination_fee?: number;
  wear_and_tear_coverage?: boolean;
  maintenance_included?: boolean;
  insurance_included?: boolean;
  contract_document_url?: string;
  auto_renew?: boolean;
  renewal_notice_days?: number;
  notes?: string;
  metadata?: Record<string, any>;
}

export interface UpdateVehicleContractDTO extends Partial<CreateVehicleContractDTO> {
  status?: ContractStatus;
  termination_date?: string;
  termination_reason?: string;
  total_paid?: number;
  final_buyout_exercised?: boolean;
}

// ============================================================================
// Lease-End Inspection Types
// ============================================================================

export type LeaseDisposition = 'returned' | 'purchased' | 'extended';

export interface ExcessWearItem {
  item: string;
  description: string;
  charge: number;
}

export interface MissingItem {
  item: string;
  description: string;
  charge: number;
}

export interface LeaseEndInspection {
  id: string;
  tenant_id: string;

  // Associations
  contract_id: string;
  vehicle_id: string;

  // Inspection details
  inspection_date: string; // ISO date
  inspector_name: string | null;
  inspector_company: string | null;

  // Mileage assessment
  final_odometer: number;
  mileage_overage: number;
  mileage_penalty: number;

  // Wear and tear charges
  excess_wear_items: ExcessWearItem[] | null;
  excess_wear_total: number;

  // Missing items
  missing_items: MissingItem[] | null;
  missing_items_total: number;

  // Total charges
  total_charges: number | null;

  // Disposition
  disposition: LeaseDisposition | null;
  disposition_date: string | null; // ISO date

  // Documentation
  final_invoice_url: string | null;
  notes: string | null;
  metadata: Record<string, any>;

  // Audit fields
  created_at: string; // ISO timestamp
  updated_at: string; // ISO timestamp
  created_by: string | null;
  updated_by: string | null;
}

export interface CreateLeaseEndInspectionDTO {
  contract_id: string;
  vehicle_id: string;
  inspection_date: string;
  inspector_name?: string;
  inspector_company?: string;
  final_odometer: number;
  mileage_overage?: number;
  mileage_penalty?: number;
  excess_wear_items?: ExcessWearItem[];
  excess_wear_total?: number;
  missing_items?: MissingItem[];
  missing_items_total?: number;
  total_charges?: number;
  disposition?: LeaseDisposition;
  disposition_date?: string;
  final_invoice_url?: string;
  notes?: string;
  metadata?: Record<string, any>;
}

export interface UpdateLeaseEndInspectionDTO extends Partial<CreateLeaseEndInspectionDTO> {}

// ============================================================================
// Service Contract Types
// ============================================================================

export type ServiceContractType = 'extended-warranty' | 'maintenance-plan' | 'roadside-assistance';

export type ServiceContractStatus = 'active' | 'expired' | 'cancelled';

export interface ServiceContract {
  id: string;
  tenant_id: string;

  // Contract identification
  contract_number: string;
  contract_type: ServiceContractType;

  // Associations
  vehicle_id: string | null;
  vehicle_type: string | null; // Applies to all vehicles of this type
  vendor_id: string;

  // Contract terms
  start_date: string; // ISO date
  end_date: string; // ISO date
  coverage_mileage: number | null;

  // Financial terms
  contract_cost: number;
  deductible: number | null;

  // Coverage details
  covered_services: string[]; // e.g., ["engine", "transmission", "electrical"]
  exclusions: string | null;
  claim_process: string | null;
  claims_phone: string | null;

  // Contract management
  contract_document_url: string | null;
  status: ServiceContractStatus;

  // Claims tracking
  claims_filed: number;
  claims_paid: number;

  // Metadata
  notes: string | null;
  metadata: Record<string, any>;

  // Audit fields
  created_at: string; // ISO timestamp
  updated_at: string; // ISO timestamp
  created_by: string | null;
  updated_by: string | null;
}

export interface CreateServiceContractDTO {
  contract_number: string;
  contract_type: ServiceContractType;
  vehicle_id?: string;
  vehicle_type?: string;
  vendor_id: string;
  start_date: string;
  end_date: string;
  coverage_mileage?: number;
  contract_cost: number;
  deductible?: number;
  covered_services: string[];
  exclusions?: string;
  claim_process?: string;
  claims_phone?: string;
  contract_document_url?: string;
  notes?: string;
  metadata?: Record<string, any>;
}

export interface UpdateServiceContractDTO extends Partial<CreateServiceContractDTO> {
  status?: ServiceContractStatus;
  claims_filed?: number;
  claims_paid?: number;
}

// ============================================================================
// Lease Management Types
// ============================================================================

export interface MileageOverageCalculation {
  mileage_allowance: number;
  current_mileage: number;
  mileage_used: number;
  mileage_remaining: number;
  mileage_overage: number;
  percentage_used: number;
  excess_mileage_fee: number;
  estimated_overage_charge: number;
}

export interface ExpiringContract {
  contract_id: string;
  contract_number: string;
  contract_type: ContractType;
  vehicle_id: string | null;
  vehicle_number: string | null;
  vendor_name: string | null;
  end_date: string; // ISO date
  days_until_expiry: number;
  status: ContractStatus;
}

export interface LeaseAlert {
  vehicle_id: string;
  vehicle_number: string;
  contract_id: string;
  contract_number: string;
  alert_type: 'mileage_80' | 'mileage_90' | 'mileage_100' | 'lease_expiring';
  alert_message: string;
  current_percentage: number | null;
  mileage_remaining: number | null;
  days_until_expiry: number | null;
  severity: 'info' | 'warning' | 'critical';
  created_at: string; // ISO timestamp
}

export interface LeasePaymentTracking {
  contract_id: string;
  contract_number: string;
  vehicle_id: string | null;
  monthly_payment: number;
  payments_made: number;
  total_paid: number;
  budgeted_amount: number | null;
  variance: number | null;
  variance_percentage: number | null;
}

export interface LeasePurchaseComparison {
  vehicle_id: string;
  vehicle_number: string;

  // Lease option
  total_lease_cost: number;
  buyout_amount: number;
  total_lease_plus_buyout: number;

  // Purchase option
  estimated_purchase_price: number;
  estimated_financing_cost: number;
  total_purchase_cost: number;

  // Comparison
  cost_difference: number;
  recommendation: 'lease' | 'purchase' | 'neutral';
  analysis_notes: string;
}

// ============================================================================
// Lease-End Inspection Workflow Types
// ============================================================================

export interface LeaseEndChecklist {
  contract_id: string;
  vehicle_id: string;
  checklist_items: ChecklistItem[];
  completed_items: number;
  total_items: number;
  completion_percentage: number;
}

export interface ChecklistItem {
  id: string;
  category: string; // e.g., "Exterior", "Interior", "Mechanical", "Documentation"
  item: string; // e.g., "Check tire tread depth", "Verify all keys present"
  is_completed: boolean;
  completed_at: string | null; // ISO timestamp
  completed_by: string | null;
  notes: string | null;
}

export interface LeaseEndInvoice {
  inspection_id: string;
  contract_id: string;
  vehicle_id: string;

  // Line items
  mileage_charges: number;
  wear_and_tear_charges: number;
  missing_items_charges: number;
  cleaning_charges: number;
  other_charges: number;

  // Totals
  subtotal: number;
  tax: number;
  total_due: number;

  // Payment
  payment_due_date: string; // ISO date
  payment_status: 'pending' | 'paid' | 'disputed';
  payment_date: string | null; // ISO date

  invoice_url: string | null;
}

// ============================================================================
// Query Parameters and Filters
// ============================================================================

export interface VehicleContractListParams {
  tenant_id: string;
  vehicle_id?: string;
  vendor_id?: string;
  contract_type?: ContractType;
  status?: ContractStatus;
  expiring_within_days?: number;
  page?: number;
  limit?: number;
  sort_by?: 'end_date' | 'contract_number' | 'monthly_payment' | 'created_at';
  sort_order?: 'asc' | 'desc';
}

export interface LeaseEndInspectionListParams {
  tenant_id: string;
  contract_id?: string;
  vehicle_id?: string;
  disposition?: LeaseDisposition;
  inspection_date_from?: string; // ISO date
  inspection_date_to?: string; // ISO date
  page?: number;
  limit?: number;
  sort_by?: 'inspection_date' | 'total_charges' | 'created_at';
  sort_order?: 'asc' | 'desc';
}

// ============================================================================
// API Response Types
// ============================================================================

export interface PaginatedVehicleContractsResponse {
  data: VehicleContract[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    total_pages: number;
  };
}

export interface PaginatedLeaseEndInspectionsResponse {
  data: LeaseEndInspection[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    total_pages: number;
  };
}

export interface LeaseStatusResponse {
  vehicle_id: string;
  vehicle_number: string;
  contract: VehicleContract;
  mileage_analysis: MileageOverageCalculation;
  alerts: LeaseAlert[];
  upcoming_inspection: {
    recommended_date: string; // ISO date (60 days before lease end)
    inspection_scheduled: boolean;
    inspection_id: string | null;
  };
}
