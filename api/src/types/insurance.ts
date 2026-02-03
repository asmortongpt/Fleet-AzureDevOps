/**
 * Insurance & Claims Management Type Definitions
 * Corresponds to database tables created in 003_insurance_claims.sql
 */

// ============================================================================
// ENUMS
// ============================================================================

export type PolicyType = 'liability' | 'collision' | 'comprehensive' | 'cargo' | 'workers-comp';

export type PolicyStatus = 'active' | 'expired' | 'cancelled' | 'pending-renewal';

export type PremiumFrequency = 'monthly' | 'quarterly' | 'annual';

export type ClaimType = 'property-damage' | 'bodily-injury' | 'comprehensive' | 'collision';

export type ClaimStatus = 'filed' | 'under-review' | 'approved' | 'denied' | 'settled' | 'closed';

export type AtFaultParty = 'our-driver' | 'third-party' | 'unknown' | 'both';

// ============================================================================
// INTERFACES
// ============================================================================

/**
 * Insurance Policy
 * Represents an insurance policy covering vehicles, drivers, or fleet-wide coverage
 */
export interface InsurancePolicy {
  id: string;
  tenant_id: string;
  policy_number: string;
  policy_type: PolicyType;
  insurance_carrier: string;
  carrier_contact_name?: string;
  carrier_contact_phone?: string;
  carrier_contact_email?: string;
  policy_start_date: Date | string;
  policy_end_date: Date | string;
  premium_amount: number;
  premium_frequency?: PremiumFrequency;
  deductible_amount?: number;
  coverage_limits: CoverageLimits;
  covered_vehicles?: string[] | 'all';
  covered_drivers?: string[] | 'all';
  policy_document_url?: string;
  certificate_of_insurance_url?: string;
  status: PolicyStatus;
  auto_renew: boolean;
  renewal_notice_days?: number;
  notes?: string;
  metadata?: Record<string, any>;
  created_at: Date;
  updated_at: Date;
}

/**
 * Coverage Limits
 * JSON structure for policy coverage limits
 */
export interface CoverageLimits {
  bodily_injury?: number;
  property_damage?: number;
  collision?: number;
  comprehensive?: number;
  uninsured_motorist?: number;
  underinsured_motorist?: number;
  medical_payments?: number;
  personal_injury_protection?: number;
  cargo?: number;
  [key: string]: number | undefined;
}

/**
 * Insurance Claim
 * Represents a claim filed against an insurance policy
 */
export interface InsuranceClaim {
  id: string;
  tenant_id: string;
  claim_number: string;
  incident_id: string;
  policy_id: string;
  claim_type: ClaimType;
  filed_date: Date | string;
  filed_by?: string;
  insurance_adjuster_name?: string;
  insurance_adjuster_phone?: string;
  insurance_adjuster_email?: string;
  claim_amount_requested?: number;
  claim_amount_approved?: number;
  deductible_paid?: number;
  payout_amount?: number;
  payout_date?: Date | string;
  status: ClaimStatus;
  status_updated_at?: Date;
  denial_reason?: string;
  at_fault_party?: AtFaultParty;
  at_fault_percentage?: number;
  total_loss: boolean;
  salvage_value?: number;
  claim_notes?: string;
  timeline: ClaimTimelineEvent[];
  documents: ClaimDocument[];
  metadata?: Record<string, any>;
  created_at: Date;
  updated_at: Date;
}

/**
 * Claim Timeline Event
 * Individual event in the claim processing timeline
 */
export interface ClaimTimelineEvent {
  date: string;
  event: string;
  description: string;
  user_id?: string;
  user_name?: string;
}

/**
 * Claim Document
 * Document attached to a claim
 */
export interface ClaimDocument {
  name: string;
  url: string;
  upload_date: string;
  document_type?: string;
  uploaded_by?: string;
}

/**
 * Vehicle Insurance Assignment
 * Links a vehicle to an insurance policy
 */
export interface VehicleInsuranceAssignment {
  id: string;
  tenant_id: string;
  vehicle_id: string;
  policy_id: string;
  start_date: Date | string;
  end_date?: Date | string;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

/**
 * Driver Insurance Assignment
 * Links a driver to an insurance policy
 */
export interface DriverInsuranceAssignment {
  id: string;
  tenant_id: string;
  driver_id: string;
  policy_id: string;
  start_date: Date | string;
  end_date?: Date | string;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

// ============================================================================
// REQUEST/RESPONSE TYPES
// ============================================================================

/**
 * Create Policy Request
 */
export interface CreatePolicyRequest {
  policy_number: string;
  policy_type: PolicyType;
  insurance_carrier: string;
  carrier_contact_name?: string;
  carrier_contact_phone?: string;
  carrier_contact_email?: string;
  policy_start_date: string;
  policy_end_date: string;
  premium_amount: number;
  premium_frequency?: PremiumFrequency;
  deductible_amount?: number;
  coverage_limits: CoverageLimits;
  covered_vehicles?: string[] | 'all';
  covered_drivers?: string[] | 'all';
  policy_document_url?: string;
  auto_renew?: boolean;
  renewal_notice_days?: number;
  notes?: string;
}

/**
 * Update Policy Request
 */
export type UpdatePolicyRequest = Partial<CreatePolicyRequest> & {
  status?: PolicyStatus;
};

/**
 * File Claim Request
 */
export interface FileClaimRequest {
  claim_number?: string;
  incident_id: string;
  policy_id: string;
  claim_type: ClaimType;
  filed_date: string;
  claim_amount_requested?: number;
  at_fault_party?: AtFaultParty;
  at_fault_percentage?: number;
  total_loss?: boolean;
  claim_notes?: string;
}

/**
 * Update Claim Status Request
 */
export interface UpdateClaimStatusRequest {
  status: ClaimStatus;
  denial_reason?: string;
  claim_amount_approved?: number;
  payout_amount?: number;
  payout_date?: string;
  insurance_adjuster_name?: string;
  insurance_adjuster_phone?: string;
  insurance_adjuster_email?: string;
  notes?: string;
}

/**
 * Coverage Verification Request
 */
export interface CoverageVerificationRequest {
  vehicle_id?: string;
  driver_id?: string;
  date?: string;
  policy_type?: PolicyType;
}

/**
 * Coverage Verification Response
 */
export interface CoverageVerificationResponse {
  is_covered: boolean;
  policies: InsurancePolicy[];
  gaps?: string[];
  warnings?: string[];
}

/**
 * Loss Ratio Calculation
 */
export interface LossRatio {
  period_start: string;
  period_end: string;
  total_premiums_paid: number;
  total_claims_paid: number;
  total_claims_outstanding: number;
  loss_ratio_percentage: number;
  claim_count: number;
  average_claim_amount: number;
}

/**
 * Policy Expiration Alert
 */
export interface PolicyExpirationAlert {
  policy_id: string;
  policy_number: string;
  policy_type: PolicyType;
  insurance_carrier: string;
  expiry_date: string;
  days_until_expiry: number;
  covered_vehicle_count: number;
  covered_driver_count: number;
}

// ============================================================================
// EXTENDED INCIDENT TYPE (for insurance integration)
// ============================================================================

/**
 * Enhanced Incident with Insurance Fields
 */
export interface IncidentWithInsurance {
  id: string;
  tenant_id: string;
  incident_number: string;
  vehicle_id?: string;
  driver_id?: string;
  facility_id?: string;
  incident_type: string;
  severity: string;
  status: string;
  incident_date: Date | string;
  location?: string;
  description: string;
  injuries_reported?: boolean;
  police_report_filed?: boolean;
  police_report_number?: string;
  estimated_cost?: number;
  actual_cost?: number;
  insurance_claim_number?: string;
  photos?: string[];
  witness_statements?: string;
  notes?: string;
  reported_by: string;
  // Insurance-specific fields
  claim_filed?: boolean;
  claim_id?: string;
  at_fault_party?: AtFaultParty;
  total_loss?: boolean;
  subrogation?: boolean;
  subrogation_amount?: number;
  third_party_insurance_company?: string;
  third_party_policy_number?: string;
  created_at: Date;
  updated_at: Date;
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

/**
 * Policy with Assignments
 * Policy joined with vehicle and driver assignments
 */
export interface PolicyWithAssignments extends InsurancePolicy {
  vehicle_assignments?: VehicleInsuranceAssignment[];
  driver_assignments?: DriverInsuranceAssignment[];
  vehicle_count?: number;
  driver_count?: number;
}

/**
 * Claim with Related Data
 * Claim joined with policy, incident, and user info
 */
export interface ClaimWithRelations extends InsuranceClaim {
  policy?: InsurancePolicy;
  incident?: IncidentWithInsurance;
  filed_by_name?: string;
  vehicle_unit?: string;
  driver_name?: string;
}

/**
 * Certificate of Insurance Data
 */
export interface CertificateOfInsuranceData {
  policy: InsurancePolicy;
  certificate_holder_name: string;
  certificate_holder_address: string;
  certificate_number: string;
  issue_date: string;
  description_of_operations?: string;
  additional_insureds?: string[];
}
