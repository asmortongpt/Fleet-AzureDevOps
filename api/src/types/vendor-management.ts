/**
 * VENDOR PERFORMANCE & CONTRACT MANAGEMENT TYPES
 * Phase 3 - Agent 8: TypeScript type definitions
 */

// ============================================================================
// VENDOR PERFORMANCE TYPES
// ============================================================================

export interface VendorPerformance {
  id: string;
  tenant_id: string;
  vendor_id: string;

  // Evaluation period
  evaluation_period_start: Date;
  evaluation_period_end: Date;

  // Order metrics
  total_orders: number;
  on_time_deliveries: number;
  on_time_percentage: number; // Calculated field

  // Performance scores (1-5 scale)
  quality_score: number;
  pricing_competitiveness: number;
  responsiveness_score: number;

  // Financial metrics
  total_spend: number;

  // Warranty performance
  warranty_claims: number;
  warranty_approval_rate: number;

  // Customer satisfaction
  customer_satisfaction: number;

  // Overall score and ranking
  overall_score: number; // Calculated field
  ranking: number | null;
  preferred_vendor: boolean;

  // Notes and improvement areas
  improvement_areas: string | null;
  notes: string | null;

  // Evaluation metadata
  evaluated_by: string | null;

  // Audit timestamps
  created_at: Date;
  updated_at: Date;
}

export interface CreateVendorPerformanceInput {
  vendor_id: string;
  evaluation_period_start: Date | string;
  evaluation_period_end: Date | string;
  total_orders?: number;
  on_time_deliveries?: number;
  quality_score?: number;
  pricing_competitiveness?: number;
  responsiveness_score?: number;
  total_spend?: number;
  warranty_claims?: number;
  warranty_approval_rate?: number;
  customer_satisfaction?: number;
  improvement_areas?: string;
  notes?: string;
}

export interface UpdateVendorPerformanceInput {
  total_orders?: number;
  on_time_deliveries?: number;
  quality_score?: number;
  pricing_competitiveness?: number;
  responsiveness_score?: number;
  total_spend?: number;
  warranty_claims?: number;
  warranty_approval_rate?: number;
  customer_satisfaction?: number;
  preferred_vendor?: boolean;
  improvement_areas?: string;
  notes?: string;
}

export interface VendorRanking {
  id: string;
  vendor_id: string;
  vendor_name: string;
  vendor_type: string;
  overall_score: number;
  ranking: number;
  on_time_percentage: number;
  total_spend: number;
  quality_score: number;
  pricing_competitiveness: number;
  responsiveness_score: number;
  customer_satisfaction: number;
  preferred_vendor: boolean;
  evaluation_period_start: Date;
  evaluation_period_end: Date;
}

// ============================================================================
// VENDOR CONTRACT TYPES
// ============================================================================

export type VendorContractType =
  | 'service-agreement'
  | 'blanket-po'
  | 'pricing-contract'
  | 'msa'
  | 'maintenance-plan'
  | 'other';

export type VendorContractStatus =
  | 'draft'
  | 'pending-approval'
  | 'active'
  | 'expired'
  | 'terminated'
  | 'renewed';

export interface VendorContract {
  id: string;
  tenant_id: string;
  vendor_id: string;

  // Contract identification
  contract_number: string;
  contract_type: VendorContractType;

  // Contract period
  start_date: Date;
  end_date: Date;
  term_months: number; // Calculated field

  // Financial terms
  contract_value: number | null;
  payment_terms: string | null;

  // Service level agreement
  service_level_agreement: string | null;
  sla_response_time_hours: number | null;
  sla_resolution_time_hours: number | null;

  // Pricing terms
  pricing_terms: Record<string, unknown>;

  // Renewal terms
  auto_renew: boolean;
  renewal_notice_days: number;

  // Termination clause
  termination_clause: string | null;
  early_termination_penalty: number | null;

  // Document management
  contract_document_url: string | null;
  signed_contract_url: string | null;

  // Status tracking
  status: VendorContractStatus;

  // Termination tracking
  terminated_date: Date | null;
  termination_reason: string | null;
  terminated_by: string | null;

  // Metadata
  notes: string | null;
  metadata: Record<string, unknown>;

  // Audit fields
  created_by: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface CreateVendorContractInput {
  vendor_id: string;
  contract_number: string;
  contract_type: VendorContractType;
  start_date: Date | string;
  end_date: Date | string;
  contract_value?: number;
  payment_terms?: string;
  service_level_agreement?: string;
  sla_response_time_hours?: number;
  sla_resolution_time_hours?: number;
  pricing_terms?: Record<string, unknown>;
  auto_renew?: boolean;
  renewal_notice_days?: number;
  termination_clause?: string;
  early_termination_penalty?: number;
  contract_document_url?: string;
  signed_contract_url?: string;
  status?: VendorContractStatus;
  notes?: string;
  metadata?: Record<string, unknown>;
}

export interface UpdateVendorContractInput {
  contract_number?: string;
  contract_type?: VendorContractType;
  start_date?: Date | string;
  end_date?: Date | string;
  contract_value?: number;
  payment_terms?: string;
  service_level_agreement?: string;
  sla_response_time_hours?: number;
  sla_resolution_time_hours?: number;
  pricing_terms?: Record<string, unknown>;
  auto_renew?: boolean;
  renewal_notice_days?: number;
  termination_clause?: string;
  early_termination_penalty?: number;
  contract_document_url?: string;
  signed_contract_url?: string;
  status?: VendorContractStatus;
  terminated_date?: Date | string;
  termination_reason?: string;
  notes?: string;
  metadata?: Record<string, unknown>;
}

export interface ExpiringContract {
  id: string;
  vendor_id: string;
  vendor_name: string;
  vendor_contact_name: string | null;
  vendor_contact_email: string | null;
  vendor_contact_phone: string | null;
  contract_number: string;
  contract_type: VendorContractType;
  contract_value: number | null;
  start_date: Date;
  end_date: Date;
  days_until_expiry: number;
  auto_renew: boolean;
  renewal_notice_days: number;
  status: VendorContractStatus;
}

// ============================================================================
// VENDOR CONTACT TYPES
// ============================================================================

export type VendorContactType =
  | 'primary'
  | 'accounting'
  | 'sales'
  | 'support'
  | 'technical'
  | 'emergency'
  | 'legal'
  | 'other';

export type PreferredContactMethod = 'email' | 'phone' | 'mobile' | 'fax';

export interface VendorContact {
  id: string;
  tenant_id: string;
  vendor_id: string;

  // Contact information
  contact_name: string;
  job_title: string | null;
  department: string | null;

  // Contact methods
  email: string;
  phone: string | null;
  mobile: string | null;
  fax: string | null;

  // Contact type and preferences
  contact_type: VendorContactType;
  is_primary: boolean;
  preferred_contact_method: PreferredContactMethod;

  // Availability
  availability_hours: string | null;
  timezone: string | null;

  // Status
  is_active: boolean;

  // Notes
  notes: string | null;

  // Audit timestamps
  created_at: Date;
  updated_at: Date;
}

export interface CreateVendorContactInput {
  vendor_id: string;
  contact_name: string;
  email: string;
  contact_type: VendorContactType;
  job_title?: string;
  department?: string;
  phone?: string;
  mobile?: string;
  fax?: string;
  is_primary?: boolean;
  preferred_contact_method?: PreferredContactMethod;
  availability_hours?: string;
  timezone?: string;
  is_active?: boolean;
  notes?: string;
}

export interface UpdateVendorContactInput {
  contact_name?: string;
  job_title?: string;
  department?: string;
  email?: string;
  phone?: string;
  mobile?: string;
  fax?: string;
  contact_type?: VendorContactType;
  is_primary?: boolean;
  preferred_contact_method?: PreferredContactMethod;
  availability_hours?: string;
  timezone?: string;
  is_active?: boolean;
  notes?: string;
}

// ============================================================================
// QUERY PARAMETER TYPES
// ============================================================================

export interface VendorPerformanceQueryParams {
  vendor_id?: string;
  start_date?: string;
  end_date?: string;
  min_score?: number;
  max_score?: number;
  preferred_only?: boolean;
  limit?: number;
  offset?: number;
}

export interface VendorContractQueryParams {
  vendor_id?: string;
  contract_type?: VendorContractType;
  status?: VendorContractStatus;
  expiring_within_days?: number;
  auto_renew?: boolean;
  limit?: number;
  offset?: number;
}

export interface VendorContactQueryParams {
  vendor_id?: string;
  contact_type?: VendorContactType;
  is_primary?: boolean;
  is_active?: boolean;
  search?: string;
  limit?: number;
  offset?: number;
}

// ============================================================================
// RESPONSE TYPES
// ============================================================================

export interface VendorPerformanceResponse {
  data: VendorPerformance[];
  total: number;
  page: number;
  pageSize: number;
}

export interface VendorContractResponse {
  data: VendorContract[];
  total: number;
  page: number;
  pageSize: number;
}

export interface VendorContactResponse {
  data: VendorContact[];
  total: number;
  page: number;
  pageSize: number;
}

export interface VendorRankingResponse {
  data: VendorRanking[];
  total: number;
  evaluation_period_start: Date;
  evaluation_period_end: Date;
}

export interface ExpiringContractResponse {
  data: ExpiringContract[];
  total: number;
  days_range: number;
}

// ============================================================================
// CALCULATION INPUT TYPES
// ============================================================================

export interface VendorScoringInput {
  vendor_id: string;
  start_date: Date | string;
  end_date: Date | string;
}

export interface VendorSpendAnalysis {
  vendor_id: string;
  vendor_name: string;
  total_spend: number;
  total_orders: number;
  average_order_value: number;
  last_order_date: Date | null;
  days_since_last_order: number | null;
}

export interface SLAComplianceMetrics {
  contract_id: string;
  vendor_id: string;
  vendor_name: string;
  sla_response_time_hours: number | null;
  sla_resolution_time_hours: number | null;
  total_incidents: number;
  response_time_violations: number;
  resolution_time_violations: number;
  compliance_percentage: number;
}
