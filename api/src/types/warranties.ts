/**
 * Warranty Tracking Types
 *
 * TypeScript type definitions for warranty tracking and claims recovery system
 *
 * @module types/warranties
 * @author Claude Code - Agent 7 (Phase 3)
 * @date 2026-02-02
 */

// ============================================================================
// Enums
// ============================================================================

export enum WarrantyType {
    MANUFACTURER = 'manufacturer',
    EXTENDED = 'extended',
    POWERTRAIN = 'powertrain',
    COMPONENT = 'component',
    OTHER = 'other'
}

export enum WarrantyStatus {
    ACTIVE = 'active',
    EXPIRED = 'expired',
    VOIDED = 'voided',
    CLAIMED = 'claimed'
}

export enum WarrantyClaimStatus {
    SUBMITTED = 'submitted',
    UNDER_REVIEW = 'under-review',
    APPROVED = 'approved',
    DENIED = 'denied',
    PAID = 'paid',
    CANCELLED = 'cancelled'
}

// ============================================================================
// Warranty Interface
// ============================================================================

export interface Warranty {
    id: string;
    tenant_id: string;
    warranty_number?: string;
    warranty_type: WarrantyType;
    vehicle_id?: string;
    component?: string; // engine, transmission, battery, tires, etc.
    part_id?: string;
    vendor_id?: string;
    start_date: Date | string;
    end_date?: Date | string;
    end_mileage?: number;
    coverage_description: string;
    exclusions?: string;
    claim_process?: string;
    warranty_contact_name?: string;
    warranty_contact_phone?: string;
    warranty_contact_email?: string;
    warranty_document_url?: string;
    transferable: boolean;
    prorated: boolean;
    status: WarrantyStatus;
    void_date?: Date | string;
    void_reason?: string;
    claims_filed: number;
    claims_approved: number;
    total_claimed: number;
    total_recovered: number;
    notes?: string;
    metadata?: Record<string, any>;
    created_at: Date | string;
    updated_at: Date | string;
}

// ============================================================================
// Warranty Claim Interface
// ============================================================================

export interface WarrantyClaim {
    id: string;
    tenant_id: string;
    warranty_id: string;
    claim_number: string;
    work_order_id?: string;
    claim_date: Date | string;
    filed_by?: string; // user_id
    failure_description: string;
    failure_date: Date | string;
    vehicle_odometer?: number;
    failed_component?: string;
    root_cause?: string;
    repair_performed?: string;
    parts_replaced?: WarrantyClaimPart[];
    labor_hours?: number;
    claim_amount: number;
    approved_amount?: number;
    denied_amount?: number;
    payout_amount?: number;
    payout_date?: Date | string;
    status: WarrantyClaimStatus;
    approval_date?: Date | string;
    denial_date?: Date | string;
    denial_reason?: string;
    adjuster_name?: string;
    adjuster_contact?: string;
    authorization_number?: string;
    supporting_documents?: WarrantyClaimDocument[];
    timeline?: WarrantyClaimTimelineEvent[];
    notes?: string;
    metadata?: Record<string, any>;
    created_at: Date | string;
    updated_at: Date | string;
}

// ============================================================================
// Supporting Types
// ============================================================================

export interface WarrantyClaimPart {
    part_number: string;
    description: string;
    quantity: number;
    unit_cost: number;
}

export interface WarrantyClaimDocument {
    name: string;
    url: string;
    upload_date: Date | string;
}

export interface WarrantyClaimTimelineEvent {
    date: Date | string;
    event: string;
    description: string;
}

// ============================================================================
// Request/Response DTOs
// ============================================================================

export interface CreateWarrantyRequest {
    warranty_number?: string;
    warranty_type: WarrantyType;
    vehicle_id?: string;
    component?: string;
    part_id?: string;
    vendor_id?: string;
    start_date: Date | string;
    end_date?: Date | string;
    end_mileage?: number;
    coverage_description: string;
    exclusions?: string;
    claim_process?: string;
    warranty_contact_name?: string;
    warranty_contact_phone?: string;
    warranty_contact_email?: string;
    warranty_document_url?: string;
    transferable?: boolean;
    prorated?: boolean;
    notes?: string;
    metadata?: Record<string, any>;
}

export interface UpdateWarrantyRequest {
    warranty_number?: string;
    warranty_type?: WarrantyType;
    vehicle_id?: string;
    component?: string;
    part_id?: string;
    vendor_id?: string;
    start_date?: Date | string;
    end_date?: Date | string;
    end_mileage?: number;
    coverage_description?: string;
    exclusions?: string;
    claim_process?: string;
    warranty_contact_name?: string;
    warranty_contact_phone?: string;
    warranty_contact_email?: string;
    warranty_document_url?: string;
    transferable?: boolean;
    prorated?: boolean;
    status?: WarrantyStatus;
    void_date?: Date | string;
    void_reason?: string;
    notes?: string;
    metadata?: Record<string, any>;
}

export interface CreateWarrantyClaimRequest {
    warranty_id: string;
    claim_number: string;
    work_order_id?: string;
    claim_date: Date | string;
    failure_description: string;
    failure_date: Date | string;
    vehicle_odometer?: number;
    failed_component?: string;
    root_cause?: string;
    repair_performed?: string;
    parts_replaced?: WarrantyClaimPart[];
    labor_hours?: number;
    claim_amount: number;
    adjuster_name?: string;
    adjuster_contact?: string;
    supporting_documents?: WarrantyClaimDocument[];
    notes?: string;
    metadata?: Record<string, any>;
}

export interface UpdateWarrantyClaimStatusRequest {
    status: WarrantyClaimStatus;
    approved_amount?: number;
    denied_amount?: number;
    payout_amount?: number;
    payout_date?: Date | string;
    denial_reason?: string;
    authorization_number?: string;
    notes?: string;
}

// ============================================================================
// Warranty Eligibility Check
// ============================================================================

export interface WarrantyEligibilityRequest {
    vehicle_id: string;
    component?: string;
    failure_date: Date | string;
    odometer: number;
}

export interface WarrantyEligibilityResult {
    warranty_id: string;
    warranty_number?: string;
    warranty_type: string;
    coverage_description: string;
    is_eligible: boolean;
    ineligibility_reason?: string;
}

export interface WarrantyEligibilityResponse {
    eligible_warranties: WarrantyEligibilityResult[];
    ineligible_warranties: WarrantyEligibilityResult[];
    has_eligible_warranty: boolean;
}

// ============================================================================
// Warranty Statistics
// ============================================================================

export interface WarrantyStatistics {
    total_warranties: number;
    active_warranties: number;
    expired_warranties: number;
    total_claims_filed: number;
    total_claims_approved: number;
    total_claims_denied: number;
    total_claimed_amount: number;
    total_recovered_amount: number;
    recovery_rate: number; // percentage
    avg_claim_amount: number;
    avg_payout_amount: number;
    warranties_by_type: Record<WarrantyType, number>;
    claims_by_status: Record<WarrantyClaimStatus, number>;
}

// ============================================================================
// Expiring Warranties
// ============================================================================

export interface ExpiringWarranty extends Warranty {
    days_until_expiration: number;
    mileage_until_expiration?: number;
    vehicle_number?: string;
    vehicle_make?: string;
    vehicle_model?: string;
}

export interface ExpiringWarrantiesResponse {
    expiring_soon: ExpiringWarranty[]; // < 30 days
    expiring_this_month: ExpiringWarranty[]; // 30-60 days
    expiring_this_quarter: ExpiringWarranty[]; // 60-90 days
    total_count: number;
}

// ============================================================================
// Warranty Recovery Report
// ============================================================================

export interface WarrantyRecoveryReport {
    period_start: Date | string;
    period_end: Date | string;
    claims_filed: number;
    claims_approved: number;
    claims_denied: number;
    claims_paid: number;
    total_claimed: number;
    total_approved: number;
    total_denied: number;
    total_recovered: number;
    recovery_rate: number; // percentage of claimed amount recovered
    approval_rate: number; // percentage of claims approved
    avg_days_to_approval: number;
    avg_days_to_payout: number;
    top_components: Array<{
        component: string;
        claims_count: number;
        total_recovered: number;
    }>;
    top_warranties: Array<{
        warranty_id: string;
        warranty_number: string;
        warranty_type: string;
        claims_count: number;
        total_recovered: number;
    }>;
}

// ============================================================================
// Work Order Warranty Enhancement
// ============================================================================

export interface WorkOrderWarrantyInfo {
    warranty_claim_eligible: boolean;
    warranty_id?: string;
    warranty_claim_id?: string;
    warranty_covered_amount?: number;
    eligible_warranties?: WarrantyEligibilityResult[];
}

// ============================================================================
// Validation Schemas (for Zod or similar)
// ============================================================================

export const WARRANTY_TYPES = ['manufacturer', 'extended', 'powertrain', 'component', 'other'] as const;
export const WARRANTY_STATUSES = ['active', 'expired', 'voided', 'claimed'] as const;
export const WARRANTY_CLAIM_STATUSES = ['submitted', 'under-review', 'approved', 'denied', 'paid', 'cancelled'] as const;

// Common components that can be covered by warranties
export const WARRANTY_COMPONENTS = [
    'engine',
    'transmission',
    'drivetrain',
    'electrical',
    'hvac',
    'suspension',
    'brakes',
    'steering',
    'battery',
    'hybrid_system',
    'tires',
    'exhaust',
    'fuel_system',
    'cooling_system',
    'body',
    'paint',
    'interior',
    'other'
] as const;

export type WarrantyComponent = typeof WARRANTY_COMPONENTS[number];
