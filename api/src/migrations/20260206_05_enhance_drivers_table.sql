-- ============================================================================
-- Migration: Comprehensive Drivers Table Enhancement
-- Created: 2026-02-06
-- Purpose: Add 50+ fields for DOT compliance, medical, drug testing, biometrics
-- ============================================================================

-- Address Information
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS address VARCHAR(500);
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS city VARCHAR(100);
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS state VARCHAR(2);
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS zip_code VARCHAR(10);
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS country VARCHAR(2) DEFAULT 'US';

-- Security & Identification
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS ssn_encrypted TEXT;
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS tax_id VARCHAR(50);

-- License Details
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS license_issued_date TIMESTAMP;
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS license_restrictions VARCHAR(255);

-- CDL Endorsements (CRITICAL for DOT)
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS cdl_endorsements VARCHAR(50);
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS endorsement_hazmat BOOLEAN DEFAULT FALSE;
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS endorsement_tanker BOOLEAN DEFAULT FALSE;
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS endorsement_passenger BOOLEAN DEFAULT FALSE;
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS endorsement_school_bus BOOLEAN DEFAULT FALSE;
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS endorsement_doubles BOOLEAN DEFAULT FALSE;

-- Medical Certification (DOT CRITICAL - FMCSA Part 391)
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS medical_card_number VARCHAR(100);
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS medical_examiner_name VARCHAR(255);
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS medical_certification_date TIMESTAMP;
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS medical_expiry_date TIMESTAMP;
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS medical_restrictions TEXT;
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS self_certified_status VARCHAR(50);
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS medical_variance_number VARCHAR(100);

-- Drug & Alcohol Testing (DOT Part 382)
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS last_drug_test_date TIMESTAMP;
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS last_drug_test_result VARCHAR(20);
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS last_alcohol_test_date TIMESTAMP;
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS last_alcohol_test_result VARCHAR(20);
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS random_pool_participant BOOLEAN DEFAULT TRUE;
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS clearinghouse_consent_date TIMESTAMP;
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS clearinghouse_last_query_date TIMESTAMP;

-- Background & Screening
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS mvr_check_date TIMESTAMP;
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS mvr_status VARCHAR(50);
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS background_check_date TIMESTAMP;
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS background_check_status VARCHAR(50);
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS hire_reason VARCHAR(100);
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS termination_reason VARCHAR(100);
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS eligible_for_rehire BOOLEAN;

-- Compensation
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS pay_type VARCHAR(50);
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS pay_rate NUMERIC(10,2);
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS overtime_eligible BOOLEAN DEFAULT TRUE;
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS employment_classification VARCHAR(50);
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS union_member BOOLEAN DEFAULT FALSE;
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS union_local_number VARCHAR(50);

-- HOS Configuration
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS hos_cycle VARCHAR(20) DEFAULT 'US_70_8';
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS hos_restart_eligible BOOLEAN DEFAULT TRUE;
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS eld_username VARCHAR(100);
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS eld_exempt BOOLEAN DEFAULT FALSE;

-- Emergency Contacts
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS emergency_contact_2_name VARCHAR(255);
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS emergency_contact_2_phone VARCHAR(20);
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS emergency_contact_2_relationship VARCHAR(50);

-- Skills & Qualifications
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS languages_spoken VARCHAR(255);
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS hazmat_training_expiry TIMESTAMP;
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS defensive_driving_expiry TIMESTAMP;
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS smith_system_certified BOOLEAN DEFAULT FALSE;

-- Performance & Safety Scoring
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS safety_score NUMERIC(5,2);
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS efficiency_score NUMERIC(5,2);
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS accident_free_days INTEGER DEFAULT 0;
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS violation_free_days INTEGER DEFAULT 0;
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS speeding_incidents_count INTEGER DEFAULT 0;
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS harsh_braking_count INTEGER DEFAULT 0;

-- Biometric & Security
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS fingerprint_enrolled BOOLEAN DEFAULT FALSE;
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS face_id_enrolled BOOLEAN DEFAULT FALSE;
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS rfid_badge_number VARCHAR(50);
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS pin_code_hash VARCHAR(255);
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS two_factor_enabled BOOLEAN DEFAULT FALSE;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_drivers_medical_expiry ON drivers(medical_expiry_date) WHERE medical_expiry_date IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_drivers_license_expiry ON drivers(license_expiry_date);
CREATE INDEX IF NOT EXISTS idx_drivers_cdl ON drivers(cdl, cdl_class) WHERE cdl = TRUE;
CREATE INDEX IF NOT EXISTS idx_drivers_hazmat ON drivers(endorsement_hazmat) WHERE endorsement_hazmat = TRUE;
CREATE INDEX IF NOT EXISTS idx_drivers_clearinghouse ON drivers(clearinghouse_last_query_date);
CREATE INDEX IF NOT EXISTS idx_drivers_safety_score ON drivers(safety_score DESC);

-- Constraints
ALTER TABLE drivers ADD CONSTRAINT chk_drivers_pay_rate_positive CHECK (pay_rate IS NULL OR pay_rate > 0);
ALTER TABLE drivers ADD CONSTRAINT chk_drivers_safety_score_range CHECK (safety_score IS NULL OR (safety_score >= 0 AND safety_score <= 100));
