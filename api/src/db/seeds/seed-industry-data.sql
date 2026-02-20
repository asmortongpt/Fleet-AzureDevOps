-- ============================================================================
-- Industry-Standard Fleet Management Seed Data
-- Target: Dev tenant 12345678-1234-1234-1234-123456789012
-- Idempotent: Uses ON CONFLICT DO NOTHING for all inserts
-- ============================================================================

BEGIN;

SET app.current_tenant_id = '12345678-1234-1234-1234-123456789012';

-- ============================================================================
-- PHASE 1: POLICIES (the backbone)
-- These are operational policy engine rules that drive automated enforcement
-- ============================================================================

INSERT INTO policies (id, tenant_id, name, description, category, type, content, version, is_active, status, effective_date, created_by, rules, metadata)
VALUES
-- 1. Vehicle Safety Inspection Policy
('70000000-0000-0000-0000-000000000001',
 '12345678-1234-1234-1234-123456789012',
 'Vehicle Safety Inspection Policy',
 'Mandates daily pre-trip and post-trip vehicle inspections per FMCSA 49 CFR 396.11 and 396.13. All CMV operators must complete DVIR before and after each trip. Defects affecting safe operation require immediate out-of-service action.',
 'safety', 'safety',
 '{"regulatory_basis": "49 CFR 396.11, 396.13", "purpose": "Ensure all commercial motor vehicles are inspected daily to identify and correct safety defects before operation", "scope": "All CMV operators and vehicles", "key_requirements": ["Pre-trip inspection before first trip of day", "Post-trip inspection at end of each day", "Written DVIR for each inspection", "Report all defects affecting safe operation", "Out-of-service vehicles with critical defects"], "penalties": {"first_offense": "Verbal warning and retraining", "second_offense": "Written warning", "third_offense": "1-day suspension", "critical_defect_missed": "Immediate 3-day suspension"}, "review_cycle": "Annual", "training_required": true}',
 2, true, 'active',
 '2025-01-01', '00000000-0000-0000-0000-000000000001',
 '{"conditions": [{"field": "inspection_status", "operator": "equals", "value": "overdue"}, {"field": "vehicle_status", "operator": "equals", "value": "active"}], "actions": [{"type": "notification", "target": "driver", "message": "Pre-trip inspection overdue"}, {"type": "flag", "severity": "high", "reason": "Missing DVIR"}]}'::jsonb,
 '{"mode": "autonomous", "applies_to": "all_vehicles", "vehicle_types": ["truck", "bus", "van"], "tags": ["FMCSA", "DVIR", "pre-trip", "safety"]}'::jsonb),

-- 2. Driver Hours of Service Policy
('70000000-0000-0000-0000-000000000002',
 '12345678-1234-1234-1234-123456789012',
 'Hours of Service Compliance Policy',
 'Enforces FMCSA Hours of Service regulations per 49 CFR 395. Monitors driving time, on-duty time, and mandatory rest periods. ELD integration required for automated tracking. Violations trigger immediate alerts and corrective action.',
 'compliance', 'safety',
 '{"regulatory_basis": "49 CFR 395", "purpose": "Prevent fatigued driving by enforcing federal hours of service limits", "scope": "All CDL holders operating CMVs", "key_requirements": ["11-hour driving limit after 10 consecutive hours off duty", "14-hour on-duty window", "30-minute break required after 8 hours driving", "60/70-hour limit in 7/8-day period", "34-hour restart provision"], "eld_mandate": "All CMVs must use registered ELD devices per 49 CFR 395.8", "penalties": {"minor_violation": "Written warning and schedule adjustment", "major_violation": "Immediate out-of-service, 3-day suspension", "pattern_violation": "Termination review", "falsification": "Immediate termination and FMCSA reporting"}, "review_cycle": "Quarterly", "training_required": true}',
 2, true, 'active',
 '2025-01-01', '00000000-0000-0000-0000-000000000001',
 '{"conditions": [{"field": "driving_hours", "operator": "gte", "value": 10.5}, {"field": "on_duty_hours", "operator": "gte", "value": 13.5}], "actions": [{"type": "alert", "target": "driver", "message": "Approaching HOS limit"}, {"type": "alert", "target": "dispatcher", "message": "Driver approaching HOS limit"}, {"type": "flag", "severity": "critical", "reason": "HOS violation imminent"}]}'::jsonb,
 '{"mode": "autonomous", "applies_to": "all_drivers", "driver_types": ["CDL-A", "CDL-B"], "tags": ["FMCSA", "HOS", "ELD", "fatigue"]}'::jsonb),

-- 3. Drug & Alcohol Testing Program
('70000000-0000-0000-0000-000000000003',
 '12345678-1234-1234-1234-123456789012',
 'Drug & Alcohol Testing Program',
 'Comprehensive DOT drug and alcohol testing program per 49 CFR 382 and 49 CFR 40. Covers pre-employment, random, post-accident, reasonable suspicion, return-to-duty, and follow-up testing. Maintains strict chain of custody and MRO review protocols.',
 'compliance', 'safety',
 '{"regulatory_basis": "49 CFR 382, 49 CFR 40", "purpose": "Maintain a drug and alcohol-free workplace and ensure safety-sensitive employees are fit for duty", "scope": "All safety-sensitive employees including CDL drivers", "testing_types": ["Pre-employment (required before first CMV operation)", "Random (minimum 50% for drugs, 10% for alcohol annually)", "Post-accident (when fatality, injury with medical treatment, or vehicle towed)", "Reasonable suspicion (trained supervisor observation required)", "Return-to-duty (after SAP evaluation completion)", "Follow-up (minimum 6 direct observations in first 12 months)"], "substances_tested": ["Marijuana (THC)", "Cocaine", "Amphetamines", "Opioids", "Phencyclidine (PCP)", "Alcohol (BAC >= 0.04 positive, 0.02-0.039 removed from duty 24hr)"], "penalties": {"positive_test": "Immediate removal from safety-sensitive duties, referral to SAP", "refusal": "Treated same as positive result", "alcohol_02_039": "24-hour removal from duty", "second_positive": "Termination"}, "record_retention": {"positive_results": "5 years", "negative_results": "1 year", "random_selection": "2 years"}, "review_cycle": "Annual", "training_required": true}',
 2, true, 'active',
 '2025-01-01', '00000000-0000-0000-0000-000000000001',
 '{"conditions": [{"field": "test_due", "operator": "equals", "value": true}, {"field": "employee_type", "operator": "in", "value": ["driver", "mechanic"]}], "actions": [{"type": "notification", "target": "hr", "message": "Drug/alcohol test due"}, {"type": "schedule", "action": "book_test_appointment"}]}'::jsonb,
 '{"mode": "human-in-loop", "applies_to": "safety_sensitive_employees", "tags": ["DOT", "drug-testing", "alcohol", "FMCSA"]}'::jsonb),

-- 4. Fuel Card Usage Policy
('70000000-0000-0000-0000-000000000004',
 '12345678-1234-1234-1234-123456789012',
 'Fuel Card Usage & Fraud Prevention Policy',
 'Controls fuel card distribution, usage monitoring, and fraud prevention. Tracks fuel efficiency per vehicle, flags anomalous transactions, and enforces approved fuel station networks. Integrates with telematics for location-based validation.',
 'operations', 'payments',
 '{"purpose": "Prevent fuel card fraud, control fuel costs, and ensure accurate fuel tracking", "scope": "All fleet vehicles with assigned fuel cards", "key_requirements": ["One card per vehicle, driver must sign acknowledgment", "PIN required for all transactions", "Maximum transaction limit: $200 per fill", "Maximum daily limit: $400", "Fuel type must match vehicle requirements", "Transactions only at approved stations"], "fraud_indicators": ["Transaction location >50mi from vehicle GPS", "Multiple transactions within 2 hours", "Transaction amount exceeds tank capacity", "Weekend/holiday transaction without scheduled route", "Fuel grade mismatch"], "penalties": {"unauthorized_use": "Written warning, card suspended pending investigation", "personal_use": "Reimbursement required, written warning", "fraud": "Immediate termination, law enforcement referral"}, "review_cycle": "Monthly", "training_required": false}',
 1, true, 'active',
 '2025-03-01', '00000000-0000-0000-0000-000000000001',
 '{"conditions": [{"field": "transaction_amount", "operator": "gt", "value": 200}, {"field": "location_variance_miles", "operator": "gt", "value": 50}], "actions": [{"type": "flag", "severity": "high", "reason": "Suspicious fuel transaction"}, {"type": "notification", "target": "fleet_manager", "message": "Fuel card anomaly detected"}]}'::jsonb,
 '{"mode": "autonomous", "applies_to": "all_vehicles", "tags": ["fuel", "fraud-prevention", "cost-control"]}'::jsonb),

-- 5. Preventive Maintenance Schedule Policy
('70000000-0000-0000-0000-000000000005',
 '12345678-1234-1234-1234-123456789012',
 'Preventive Maintenance Compliance Policy',
 'Enforces systematic preventive maintenance per 49 CFR 396.3. Defines PM intervals by vehicle type and mileage, tracks compliance, and triggers automatic work order generation. Non-compliance results in vehicle grounding until service is completed.',
 'maintenance', 'maintenance',
 '{"regulatory_basis": "49 CFR 396.3", "purpose": "Ensure all vehicles receive timely preventive maintenance to maintain safety and reliability", "scope": "All fleet vehicles", "pm_intervals": {"PM-A": {"description": "Basic service - oil, filters, fluids, tire check", "interval_miles": 5000, "interval_days": 90, "estimated_hours": 1.5}, "PM-B": {"description": "Intermediate - PM-A plus brakes, steering, suspension inspection", "interval_miles": 15000, "interval_days": 180, "estimated_hours": 3.0}, "PM-C": {"description": "Major - PM-B plus transmission, differential, cooling system", "interval_miles": 45000, "interval_days": 365, "estimated_hours": 6.0}, "PM-D": {"description": "Overhaul - comprehensive system inspection and replacement", "interval_miles": 100000, "interval_days": 730, "estimated_hours": 16.0}}, "penalties": {"overdue_7_days": "Warning notification to driver and manager", "overdue_14_days": "Vehicle flagged, restricted to local routes only", "overdue_30_days": "Vehicle grounded until PM completed"}, "review_cycle": "Monthly", "training_required": false}',
 3, true, 'active',
 '2025-01-01', '00000000-0000-0000-0000-000000000001',
 '{"conditions": [{"field": "pm_status", "operator": "equals", "value": "overdue"}, {"field": "miles_since_last_pm", "operator": "gt", "value": 5000}], "actions": [{"type": "work_order", "action": "create_pm_work_order"}, {"type": "notification", "target": "maintenance_manager", "message": "PM overdue - work order created"}, {"type": "restriction", "action": "limit_routes"}]}'::jsonb,
 '{"mode": "autonomous", "applies_to": "all_vehicles", "tags": ["maintenance", "PM", "FMCSA", "396.3"]}'::jsonb),

-- 6. Accident Reporting & Response Policy
('70000000-0000-0000-0000-000000000006',
 '12345678-1234-1234-1234-123456789012',
 'Accident Reporting & Response Policy',
 'Defines immediate response procedures, reporting timelines, and investigation requirements for all fleet-related accidents per 49 CFR 390.15. Includes DOT recordable crash criteria, post-accident testing triggers, and documentation standards.',
 'safety', 'safety',
 '{"regulatory_basis": "49 CFR 390.15, 49 CFR 382.303", "purpose": "Ensure proper response, documentation, and investigation of all fleet accidents to protect employees, minimize liability, and prevent recurrence", "scope": "All fleet operators and vehicles", "immediate_response": ["Ensure safety of all persons involved", "Call 911 if injuries or significant property damage", "Do NOT admit fault or discuss details with other parties", "Document scene with photos (all angles, damage, road conditions)", "Exchange information with other parties", "Contact dispatch/fleet management within 30 minutes", "Complete incident report within 24 hours"], "dot_recordable_criteria": ["Fatality", "Injury requiring transport to medical facility", "Vehicle towed from scene due to disabling damage"], "post_accident_testing": {"alcohol": "Within 8 hours of accident", "drug": "Within 32 hours of accident", "triggers": "DOT recordable crashes or reasonable suspicion"}, "investigation_timeline": {"preliminary_report": "24 hours", "full_investigation": "5 business days", "root_cause_analysis": "10 business days", "corrective_action_plan": "15 business days"}, "penalties": {"late_reporting": "Written warning", "failure_to_report": "3-day suspension", "leaving_scene": "Immediate termination"}, "review_cycle": "Semi-annual", "training_required": true}',
 2, true, 'active',
 '2025-01-01', '00000000-0000-0000-0000-000000000001',
 '{"conditions": [{"field": "incident_type", "operator": "in", "value": ["collision", "property_damage", "injury"]}, {"field": "report_status", "operator": "equals", "value": "pending"}], "actions": [{"type": "alert", "target": "safety_manager", "message": "New accident reported - investigation required"}, {"type": "task", "action": "create_investigation_task"}, {"type": "schedule", "action": "post_accident_drug_test"}]}'::jsonb,
 '{"mode": "human-in-loop", "applies_to": "all", "tags": ["accident", "reporting", "investigation", "DOT"]}'::jsonb),

-- 7. Driver Qualification & Authorization Policy
('70000000-0000-0000-0000-000000000007',
 '12345678-1234-1234-1234-123456789012',
 'Driver Qualification & Authorization Policy',
 'Establishes minimum qualification requirements for CMV operators per 49 CFR 391. Covers DQ file maintenance, MVR monitoring, medical certification tracking, and license endorsement verification. All drivers must maintain active qualification status.',
 'compliance', 'safety',
 '{"regulatory_basis": "49 CFR 391", "purpose": "Ensure only qualified, licensed, and medically certified drivers operate fleet vehicles", "scope": "All CMV operators", "dq_file_requirements": ["Valid CDL with appropriate endorsements", "DOT medical certificate (valid, not expired)", "Motor Vehicle Record (MVR) - reviewed annually", "Road test certificate or equivalent", "Application for employment", "Previous employer verification (3 years)", "Annual driver review and certification", "Drug and alcohol testing records"], "disqualifying_offenses": ["DUI/DWI conviction", "Leaving scene of accident", "Commission of felony involving CMV", "Two or more serious traffic violations in 3 years"], "medical_requirements": {"exam_frequency": "Every 24 months (12 months for certain conditions)", "provider": "FMCSA National Registry certified medical examiner", "conditions_requiring_waiver": ["Insulin-dependent diabetes", "Vision below standards", "Hearing impairment"]}, "mvr_monitoring": {"frequency": "Annual minimum, semi-annual recommended", "automatic_alerts": ["License suspension or revocation", "New moving violations", "Medical certificate expiration within 60 days"]}, "review_cycle": "Annual", "training_required": true}',
 2, true, 'active',
 '2025-01-01', '00000000-0000-0000-0000-000000000001',
 '{"conditions": [{"field": "medical_cert_expiry", "operator": "lt", "value": "60_days"}, {"field": "license_status", "operator": "not_equals", "value": "valid"}], "actions": [{"type": "alert", "target": "hr", "message": "Driver qualification issue detected"}, {"type": "restriction", "action": "suspend_driving_privileges"}, {"type": "notification", "target": "driver", "message": "Action required: update qualification documents"}]}'::jsonb,
 '{"mode": "autonomous", "applies_to": "all_drivers", "tags": ["DQ-file", "qualification", "CDL", "medical-cert"]}'::jsonb),

-- 8. Distracted Driving Prevention Policy
('70000000-0000-0000-0000-000000000008',
 '12345678-1234-1234-1234-123456789012',
 'Distracted Driving Prevention Policy',
 'Prohibits use of hand-held mobile devices while operating fleet vehicles per 49 CFR 392.80 and 392.82. Enforced via dashcam AI monitoring, telematics data, and periodic audits. Zero tolerance for texting while driving.',
 'safety', 'driver-behavior',
 '{"regulatory_basis": "49 CFR 392.80, 392.82", "purpose": "Eliminate distracted driving behaviors to prevent accidents and protect lives", "scope": "All fleet vehicle operators", "prohibited_activities": ["Using hand-held mobile phone while vehicle is in motion", "Texting or emailing while driving (including at stops in traffic)", "Reading or viewing device screens while driving", "Reaching for objects that require leaving seated position", "Manual programming of GPS while vehicle is in motion"], "permitted_activities": ["Hands-free phone calls via Bluetooth", "Voice-activated GPS commands", "Using phone when vehicle is safely parked and engine off", "Emergency 911 calls"], "enforcement_methods": ["AI-powered dashcam distraction detection", "Telematics phone usage correlation with driving events", "Periodic ride-along audits", "Anonymous reporting hotline"], "penalties": {"first_offense": "Written warning, mandatory retraining (4 hours)", "second_offense": "3-day suspension without pay", "third_offense": "Termination", "texting_while_driving": "Immediate 5-day suspension (federal disqualification risk)"}, "review_cycle": "Semi-annual", "training_required": true}',
 1, true, 'active',
 '2025-02-01', '00000000-0000-0000-0000-000000000001',
 '{"conditions": [{"field": "distraction_event", "operator": "equals", "value": true}, {"field": "vehicle_speed", "operator": "gt", "value": 5}], "actions": [{"type": "alert", "target": "driver", "message": "Distracted driving detected"}, {"type": "flag", "severity": "high", "reason": "Distracted driving event"}, {"type": "notification", "target": "safety_manager", "message": "Distraction event recorded"}]}'::jsonb,
 '{"mode": "autonomous", "applies_to": "all_drivers", "tags": ["distracted-driving", "cell-phone", "safety", "dashcam"]}'::jsonb),

-- 9. Personal Protective Equipment Policy
('70000000-0000-0000-0000-000000000009',
 '12345678-1234-1234-1234-123456789012',
 'Personal Protective Equipment (PPE) Policy',
 'Establishes PPE requirements for fleet operations per OSHA 1910.132-138. Defines required equipment by task type, inspection protocols, and replacement schedules. Covers drivers, mechanics, and warehouse personnel.',
 'safety', 'osha',
 '{"regulatory_basis": "OSHA 29 CFR 1910.132-138", "purpose": "Protect employees from workplace hazards through proper selection, use, and maintenance of PPE", "scope": "All fleet operations personnel", "ppe_by_role": {"drivers": ["High-visibility vest (ANSI Class 2 minimum)", "Steel-toe boots (ASTM F2413)", "Work gloves for cargo handling", "Hard hat when at construction/industrial sites"], "mechanics": ["Safety glasses (ANSI Z87.1)", "Steel-toe boots", "Mechanic gloves (cut-resistant)", "Hearing protection (>85dB environments)", "Welding helmet/shield when welding", "Chemical-resistant gloves for fluids"], "warehouse": ["High-visibility vest", "Steel-toe boots", "Hard hat in forklift areas", "Gloves for material handling"]}, "inspection_requirements": ["Daily visual inspection before use", "Replace damaged PPE immediately", "Annual comprehensive PPE assessment", "Document all PPE issues and replacements"], "employer_responsibilities": ["Provide PPE at no cost to employees", "Train on proper use, care, and limitations", "Maintain adequate inventory", "Ensure proper fit"], "penalties": {"not_wearing_ppe": "Verbal warning first, written warning second", "repeated_violations": "1-day suspension", "refusing_ppe": "Sent home without pay, progressive discipline"}, "review_cycle": "Annual", "training_required": true}',
 1, true, 'active',
 '2025-01-15', '00000000-0000-0000-0000-000000000001',
 '{"conditions": [{"field": "ppe_inspection_due", "operator": "equals", "value": true}], "actions": [{"type": "notification", "target": "safety_manager", "message": "PPE inspection due"}, {"type": "task", "action": "schedule_ppe_assessment"}]}'::jsonb,
 '{"mode": "monitor", "applies_to": "all", "tags": ["PPE", "OSHA", "safety-equipment"]}'::jsonb),

-- 10. Telematics & GPS Monitoring Policy
('70000000-0000-0000-0000-000000000010',
 '12345678-1234-1234-1234-123456789012',
 'Telematics & GPS Monitoring Policy',
 'Governs use of telematics, GPS tracking, and ELD devices across the fleet per FMCSA ELD mandate. Defines data collection scope, privacy expectations, driver notification requirements, and data retention standards.',
 'operations', 'vehicle-use',
 '{"regulatory_basis": "FMCSA ELD Mandate (49 CFR 395.8)", "purpose": "Enable fleet visibility, ensure ELD compliance, improve safety, and optimize operations through telematics data", "scope": "All fleet vehicles equipped with telematics devices", "data_collected": ["GPS location (real-time and historical)", "Vehicle speed and acceleration/braking events", "Engine diagnostics (OBD-II data)", "Fuel consumption and idle time", "Hours of Service (ELD data)", "Dashcam video (event-triggered and periodic)"], "privacy_notice": "All drivers are informed that fleet vehicles are monitored. Telematics data is used for safety, compliance, and operational purposes only. Data is not used for personal surveillance outside of work duties.", "driver_rights": ["View own driving data and scores", "Contest flagged events with supporting evidence", "Request data correction for equipment malfunctions", "Opt out of non-mandatory data sharing"], "data_retention": {"real_time_location": "90 days", "trip_history": "1 year", "eld_records": "6 months (per FMCSA requirement)", "dashcam_video": "30 days (90 days for flagged events)", "diagnostic_data": "2 years"}, "review_cycle": "Annual", "training_required": true}',
 1, true, 'active',
 '2025-01-01', '00000000-0000-0000-0000-000000000001',
 '{"conditions": [{"field": "device_status", "operator": "equals", "value": "offline"}, {"field": "offline_duration_hours", "operator": "gt", "value": 4}], "actions": [{"type": "alert", "target": "fleet_manager", "message": "Telematics device offline"}, {"type": "task", "action": "schedule_device_inspection"}]}'::jsonb,
 '{"mode": "autonomous", "applies_to": "all_vehicles", "tags": ["telematics", "GPS", "ELD", "monitoring"]}'::jsonb),

-- 11. Environmental & Hazmat Management Policy
('70000000-0000-0000-0000-000000000011',
 '12345678-1234-1234-1234-123456789012',
 'Environmental & Hazmat Compliance Policy',
 'Ensures compliance with EPA and DOT hazardous materials regulations per 40 CFR 112/262 and 49 CFR 397. Covers spill prevention, waste management, emissions standards, and hazmat transport requirements.',
 'compliance', 'environmental',
 '{"regulatory_basis": "40 CFR 112, 40 CFR 262, 49 CFR 397", "purpose": "Protect the environment, ensure regulatory compliance, and minimize liability from fleet operations environmental impact", "scope": "All fleet operations, maintenance facilities, and hazmat-endorsed drivers", "key_requirements": ["Spill Prevention Control and Countermeasure (SPCC) plan for facilities storing >1,320 gallons", "Proper disposal of used oil, antifreeze, batteries, and tires", "DEF system maintenance for diesel vehicles", "Annual emissions testing compliance", "Hazmat endorsement and training for applicable drivers"], "waste_management": {"used_oil": "Collected in approved containers, recycled through licensed hauler", "antifreeze": "Recycled or disposed as hazardous waste", "batteries": "Returned to supplier or recycled through approved program", "tires": "Recycled through state-approved tire recycler", "filters": "Drained and disposed per local regulations"}, "spill_response": ["Contain spill immediately with available absorbents", "Notify supervisor within 15 minutes", "Report spills >25 gallons to environmental coordinator", "Report spills >1,000 gallons to EPA National Response Center (800-424-8802)"], "review_cycle": "Annual", "training_required": true}',
 1, true, 'active',
 '2025-02-01', '00000000-0000-0000-0000-000000000001',
 '{"conditions": [{"field": "emissions_test_due", "operator": "equals", "value": true}, {"field": "hazmat_cert_expiry", "operator": "lt", "value": "30_days"}], "actions": [{"type": "notification", "target": "compliance_manager", "message": "Environmental compliance action required"}, {"type": "flag", "severity": "medium", "reason": "Environmental compliance due"}]}'::jsonb,
 '{"mode": "monitor", "applies_to": "all", "tags": ["EPA", "hazmat", "environmental", "emissions"]}'::jsonb),

-- 12. Vehicle Use & Assignment Policy
('70000000-0000-0000-0000-000000000012',
 '12345678-1234-1234-1234-123456789012',
 'Vehicle Use & Assignment Policy',
 'Defines authorized vehicle use, assignment protocols, personal use restrictions, and driver responsibility for assigned fleet vehicles. Covers take-home vehicle eligibility, mileage tracking, and vehicle return conditions.',
 'operations', 'vehicle-use',
 '{"purpose": "Establish clear guidelines for fleet vehicle assignment, authorized use, and driver accountability", "scope": "All fleet vehicles and authorized operators", "assignment_criteria": ["Valid driver license with appropriate class and endorsements", "Completed defensive driving training", "Clean MVR (no major violations in past 3 years)", "Signed vehicle use agreement on file"], "authorized_use": ["Business-related travel during work hours", "Commute to/from work (if approved for take-home)", "Business travel requiring overnight stay"], "prohibited_use": ["Personal errands during work hours", "Transporting non-employees without authorization", "Towing or hauling not related to job duties", "Operating vehicle under influence of drugs/alcohol", "Allowing unauthorized persons to operate vehicle"], "take_home_eligibility": {"criteria": "Employees who are on-call or whose duties require immediate response", "approval": "Department manager and fleet manager", "personal_use_reporting": "IRS requires personal use value reporting on W-2"}, "driver_responsibilities": ["Maintain vehicle cleanliness (interior and exterior)", "Report all damage, defects, or mechanical issues within 24 hours", "Keep vehicle locked when unattended", "Return vehicle with minimum 1/4 tank fuel", "Follow all posted speed limits and traffic laws"], "review_cycle": "Annual", "training_required": false}',
 2, true, 'active',
 '2025-01-01', '00000000-0000-0000-0000-000000000001',
 '{"conditions": [{"field": "personal_miles", "operator": "gt", "value": 100}, {"field": "vehicle_assignment", "operator": "equals", "value": "take_home"}], "actions": [{"type": "notification", "target": "fleet_manager", "message": "High personal mileage on fleet vehicle"}, {"type": "flag", "severity": "low", "reason": "Personal use review needed"}]}'::jsonb,
 '{"mode": "monitor", "applies_to": "all_vehicles", "tags": ["vehicle-use", "assignment", "take-home", "IRS"]}'::jsonb),

-- 13. Data Retention & Privacy Policy
('70000000-0000-0000-0000-000000000013',
 '12345678-1234-1234-1234-123456789012',
 'Data Retention & Privacy Policy',
 'Establishes data retention periods, privacy protections, and data handling procedures for all fleet management data per FMCSA record retention requirements and applicable privacy laws.',
 'compliance', 'data-retention',
 '{"regulatory_basis": "49 CFR 391.51, 49 CFR 395.8, 49 CFR 382.401", "purpose": "Ensure proper retention, protection, and disposal of fleet management records in compliance with federal and state regulations", "scope": "All fleet management data including driver records, vehicle records, and operational data", "retention_periods": {"driver_qualification_files": "Duration of employment + 3 years", "drug_alcohol_records_positive": "5 years", "drug_alcohol_records_negative": "1 year", "hours_of_service_records": "6 months", "vehicle_inspection_reports": "1 year from date + 3 months", "maintenance_records": "Duration of vehicle ownership + 1 year", "accident_records": "3 years from date of accident", "training_records": "Duration of employment + 3 years", "fuel_transaction_records": "7 years (IRS requirement)", "telematics_data": "Per telematics policy schedule", "dashcam_footage_routine": "30 days", "dashcam_footage_incident": "Duration of claim/litigation + 1 year"}, "data_protection": ["Encrypt sensitive data at rest and in transit", "Role-based access control for all systems", "Audit logging for data access", "Annual security assessment", "Breach notification within 72 hours"], "disposal_methods": {"electronic": "Secure deletion with verification", "paper": "Cross-cut shredding", "media": "Physical destruction or degaussing"}, "review_cycle": "Annual", "training_required": true}',
 1, true, 'active',
 '2025-01-01', '00000000-0000-0000-0000-000000000001',
 '{"conditions": [{"field": "record_age", "operator": "gt", "value": "retention_period"}], "actions": [{"type": "notification", "target": "compliance_manager", "message": "Records approaching retention limit"}, {"type": "task", "action": "schedule_record_review"}]}'::jsonb,
 '{"mode": "monitor", "applies_to": "all", "tags": ["data-retention", "privacy", "FMCSA", "records"]}'::jsonb),

-- 14. Workplace Safety & Ergonomics Policy
('70000000-0000-0000-0000-000000000014',
 '12345678-1234-1234-1234-123456789012',
 'Workplace Safety & Ergonomics Policy',
 'Comprehensive workplace safety program per OSHA General Duty Clause (Section 5(a)(1)). Covers facility safety, ergonomic assessments, incident prevention, and safety committee requirements for all fleet operations locations.',
 'safety', 'osha',
 '{"regulatory_basis": "OSHA General Duty Clause 29 USC 654, 29 CFR 1910", "purpose": "Provide a safe and healthful workplace free from recognized hazards", "scope": "All fleet operations facilities and personnel", "facility_requirements": ["Emergency exits clearly marked and unobstructed", "Fire extinguishers inspected monthly, serviced annually", "First aid kits in all work areas", "Safety Data Sheets (SDS) accessible for all chemicals", "Adequate lighting in all work areas (minimum 50 foot-candles for maintenance)", "Slip-resistant flooring in wet areas", "Proper ventilation in maintenance bays"], "ergonomic_standards": {"drivers": "Adjustable seats, lumbar support, regular stretch breaks every 2 hours", "mechanics": "Proper lifting equipment for items >50 lbs, anti-fatigue mats, adjustable workbenches", "office": "Ergonomic chairs, monitor at eye level, keyboard tray"}, "safety_committee": {"membership": "Minimum 4 members representing management and hourly employees", "meeting_frequency": "Monthly", "responsibilities": ["Review all incident reports", "Conduct quarterly facility inspections", "Recommend safety improvements", "Track corrective action completion"]}, "incident_reporting": {"near_miss": "Report within 24 hours via safety app", "injury_no_lost_time": "Report within 8 hours, supervisor investigation", "injury_lost_time": "Report immediately, OSHA 300 log entry within 7 days", "fatality": "Report to OSHA within 8 hours (800-321-OSHA)"}, "review_cycle": "Annual", "training_required": true}',
 1, true, 'active',
 '2025-01-15', '00000000-0000-0000-0000-000000000001',
 '{"conditions": [{"field": "safety_inspection_due", "operator": "equals", "value": true}, {"field": "facility_type", "operator": "in", "value": ["maintenance_bay", "warehouse", "office"]}], "actions": [{"type": "task", "action": "schedule_safety_inspection"}, {"type": "notification", "target": "safety_manager", "message": "Facility safety inspection due"}]}'::jsonb,
 '{"mode": "monitor", "applies_to": "all", "tags": ["OSHA", "workplace-safety", "ergonomics", "facility"]}'::jsonb),

-- 15. Speed & Aggressive Driving Policy
('70000000-0000-0000-0000-000000000015',
 '12345678-1234-1234-1234-123456789012',
 'Speed & Aggressive Driving Prevention Policy',
 'Establishes speed limits, aggressive driving thresholds, and enforcement mechanisms using telematics data. Includes speeding tiers, hard braking/acceleration limits, and progressive discipline for repeat offenders.',
 'safety', 'driver-behavior',
 '{"purpose": "Reduce accident risk and liability by preventing speeding and aggressive driving behaviors", "scope": "All fleet vehicle operators", "speed_thresholds": {"posted_limit": "Must not exceed posted speed limit", "highway_max": "65 mph maximum regardless of posted limit (unless state law requires higher)", "residential_zones": "25 mph maximum in school and residential zones", "facility_grounds": "10 mph on all company property"}, "aggressive_driving_thresholds": {"hard_braking": "Deceleration >8.8 mph/sec (0.4g)", "hard_acceleration": "Acceleration >8.8 mph/sec (0.4g)", "hard_cornering": "Lateral acceleration >0.4g", "speeding_minor": "1-10 mph over posted limit", "speeding_moderate": "11-20 mph over posted limit", "speeding_severe": ">20 mph over posted limit"}, "scoring": {"events_per_1000_miles": "Target <5 events for excellent rating", "weight_factors": {"hard_brake": 1, "hard_accel": 1, "hard_corner": 1, "minor_speed": 2, "moderate_speed": 5, "severe_speed": 10}}, "penalties": {"score_below_70": "Coaching session with supervisor", "score_below_50": "Written warning, mandatory defensive driving course", "3_severe_speed_events": "3-day suspension", "pattern_aggressive": "Termination review"}, "review_cycle": "Monthly", "training_required": true}',
 2, true, 'active',
 '2025-01-01', '00000000-0000-0000-0000-000000000001',
 '{"conditions": [{"field": "speed_over_limit", "operator": "gt", "value": 10}, {"field": "hard_brake_count_daily", "operator": "gt", "value": 3}], "actions": [{"type": "alert", "target": "driver", "message": "Speed violation detected"}, {"type": "flag", "severity": "medium", "reason": "Aggressive driving event"}, {"type": "notification", "target": "safety_manager", "message": "Driver speed/behavior alert"}]}'::jsonb,
 '{"mode": "autonomous", "applies_to": "all_drivers", "tags": ["speeding", "aggressive-driving", "telematics", "safety-score"]}'::jsonb)

ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- PHASE 1b: POLICY TEMPLATES (formal governance documents)
-- These are detailed policy documents with full procedures and regulatory refs
-- ============================================================================

INSERT INTO policy_templates (id, policy_code, policy_name, policy_category, policy_objective, policy_scope, policy_content, procedures, regulatory_references, industry_standards, version, effective_date, status, is_mandatory, applies_to_roles, requires_training, created_by)
VALUES
('70100000-0000-0000-0000-000000000001', 'PT-DVIR-001', 'Daily Vehicle Inspection Report (DVIR) Program',
 'Safety',
 'Establish a systematic daily vehicle inspection program ensuring all commercial motor vehicles are safe to operate before and after each trip.',
 'All CDL drivers operating commercial motor vehicles within the fleet. Applies to all vehicle classes including trucks, buses, and vans.',
 E'SECTION 1: PURPOSE AND AUTHORITY\nThis policy establishes the requirement for daily vehicle inspection reports (DVIR) in compliance with Federal Motor Carrier Safety Administration (FMCSA) regulations. The DVIR program is a critical component of our fleet safety management system.\n\nSECTION 2: PRE-TRIP INSPECTION REQUIREMENTS\n2.1 Every driver must conduct a thorough pre-trip inspection before operating any CMV.\n2.2 Inspection must cover all items listed on the approved DVIR checklist including:\n  - Brakes (service and parking)\n  - Steering mechanism\n  - Lighting devices and reflectors\n  - Tires (condition and inflation)\n  - Horn\n  - Windshield wipers\n  - Rear vision mirrors\n  - Coupling devices (if applicable)\n  - Wheels, rims, and lugs\n  - Emergency equipment (fire extinguisher, warning triangles)\n2.3 Any defect affecting safe operation must be reported and repaired before the vehicle is operated.\n\nSECTION 3: POST-TRIP INSPECTION REQUIREMENTS\n3.1 At the end of each day of driving, the driver must prepare a DVIR identifying any defects discovered.\n3.2 If no defects are found, the driver must still complete the DVIR indicating satisfactory condition.\n\nSECTION 4: DEFECT REPORTING AND REPAIR\n4.1 Critical defects (brakes, steering, tires) require immediate vehicle out-of-service.\n4.2 Maintenance must acknowledge and repair defects before the vehicle returns to service.\n4.3 Driver must review previous day DVIR and sign acknowledgment of repairs.\n\nSECTION 5: RECORD RETENTION\nAll DVIRs must be retained for a minimum of 3 months from the date of inspection.',
 E'PRE-TRIP INSPECTION PROCEDURE:\n1. Walk around vehicle checking for visible damage, fluid leaks, tire condition\n2. Enter cab and test all lights, signals, wipers, horn\n3. Start engine, check gauges, listen for unusual sounds\n4. Test brakes (service and parking)\n5. Check mirrors, seat belt, emergency equipment\n6. Complete DVIR form in fleet management system\n7. If defects found: report immediately, do not operate if safety-critical\n\nPOST-TRIP INSPECTION PROCEDURE:\n1. Park vehicle in designated area\n2. Complete walk-around inspection\n3. Note any new defects or changes from pre-trip\n4. Complete post-trip DVIR in fleet management system\n5. Report any maintenance needs',
 ARRAY['49 CFR 396.11 - Driver Vehicle Inspection Report', '49 CFR 396.13 - Driver Inspection', '49 CFR 393 - Parts and Accessories Necessary for Safe Operation'],
 ARRAY['FMCSA Compliance Safety Accountability (CSA)', 'CVSA North American Standard Inspection'],
 '2.0', '2025-01-01', 'Active', true, ARRAY['driver', 'mechanic', 'fleet_manager'], true,
 '00000000-0000-0000-0000-000000000001'),

('70100000-0000-0000-0000-000000000002', 'PT-DAT-001', 'DOT Drug & Alcohol Testing Program',
 'Compliance',
 'Implement a comprehensive drug and alcohol testing program that meets all DOT/FMCSA requirements and maintains a substance-free workplace.',
 'All safety-sensitive employees including CDL drivers, mechanics who perform safety-related repairs, and dispatchers.',
 E'SECTION 1: PROGRAM OVERVIEW\nThis program establishes drug and alcohol testing procedures in accordance with DOT 49 CFR Part 40 and FMCSA 49 CFR Part 382. A Designated Employer Representative (DER) oversees all program administration.\n\nSECTION 2: TESTING CATEGORIES\n2.1 Pre-Employment: Required before first CMV operation. Negative result required.\n2.2 Random: Computer-generated selection, minimum 50% of drivers for drugs, 10% for alcohol annually.\n2.3 Post-Accident: Required when DOT-recordable crash occurs. Alcohol within 8 hours, drugs within 32 hours.\n2.4 Reasonable Suspicion: Based on trained supervisor observations of appearance, behavior, speech, or body odor.\n2.5 Return-to-Duty: Required after SAP evaluation and treatment completion.\n2.6 Follow-Up: Minimum 6 unannounced tests in first 12 months after return to duty.\n\nSECTION 3: SUBSTANCES TESTED\nDrugs (5-panel): Marijuana (THC), Cocaine, Amphetamines/Methamphetamines, Opioids (codeine, morphine, heroin, hydrocodone, hydromorphone, oxycodone, oxymorphone), Phencyclidine (PCP).\nAlcohol: BAC >= 0.04 is positive. BAC 0.02-0.039 requires 24-hour removal.\n\nSECTION 4: TESTING PROCEDURES\n4.1 All testing conducted at SAMHSA-certified laboratories\n4.2 Strict chain of custody protocols maintained\n4.3 Split specimen procedure for all drug tests\n4.4 Medical Review Officer (MRO) reviews all results\n4.5 Employee may request retest of split specimen within 72 hours of notification\n\nSECTION 5: CONSEQUENCES\n5.1 Positive result or refusal: Immediate removal from safety-sensitive duties\n5.2 Referral to Substance Abuse Professional (SAP)\n5.3 Return to duty only after SAP clearance and negative return-to-duty test\n5.4 Second positive: Termination',
 E'COLLECTION PROCEDURE:\n1. Employee notified and reports to collection site within 2 hours\n2. Present valid photo ID\n3. Empty pockets, secure personal items\n4. Provide specimen under direct observation (if return-to-duty or follow-up)\n5. Specimen sealed, chain of custody form completed\n6. Results reviewed by MRO within 5 business days\n\nREASONABLE SUSPICION PROCEDURE:\n1. Trained supervisor documents specific observations\n2. Second trained supervisor confirms (when possible)\n3. Employee transported to collection site (do not allow to drive)\n4. Complete reasonable suspicion documentation form within 24 hours',
 ARRAY['49 CFR Part 40 - Procedures for Transportation Workplace Drug and Alcohol Testing', '49 CFR Part 382 - Controlled Substances and Alcohol Use and Testing', '49 CFR 382.303 - Post-Accident Testing'],
 ARRAY['SAMHSA Guidelines', 'DOT Office of Drug and Alcohol Policy and Compliance'],
 '1.5', '2025-01-01', 'Active', true, ARRAY['driver', 'mechanic'], true,
 '00000000-0000-0000-0000-000000000001'),

('70100000-0000-0000-0000-000000000003', 'PT-PPE-001', 'Personal Protective Equipment Program',
 'Safety',
 'Ensure all employees are provided with and properly use appropriate PPE to protect against workplace hazards.',
 'All fleet operations personnel including drivers, mechanics, warehouse staff, and field technicians.',
 E'SECTION 1: HAZARD ASSESSMENT\nPer OSHA 29 CFR 1910.132(d), a workplace hazard assessment has been conducted for all job classifications. PPE requirements are based on identified hazards for each role.\n\nSECTION 2: PPE REQUIREMENTS BY ROLE\n2.1 DRIVERS:\n  - High-visibility vest (ANSI/ISEA 107 Class 2) when outside vehicle\n  - Safety footwear (ASTM F2413) with steel or composite toe\n  - Work gloves for cargo handling\n  - Hard hat at construction/industrial delivery sites\n  - Safety glasses when performing any vehicle checks\n\n2.2 MECHANICS:\n  - Safety glasses with side shields (ANSI Z87.1) at all times in shop\n  - Steel-toe boots\n  - Cut-resistant mechanic gloves\n  - Hearing protection when noise exceeds 85 dB (grinders, air tools)\n  - Face shield for grinding operations\n  - Chemical-resistant gloves when handling fluids\n  - Welding helmet/gloves when welding\n\n2.3 WAREHOUSE PERSONNEL:\n  - High-visibility vest in forklift traffic areas\n  - Steel-toe boots\n  - Hard hat in overhead hazard areas\n  - Cut-resistant gloves for material handling\n\nSECTION 3: TRAINING\n3.1 Initial training before first assignment requiring PPE\n3.2 Retraining when workplace conditions change or new PPE introduced\n3.3 Training covers: when PPE is necessary, proper donning/doffing, care and maintenance, limitations\n\nSECTION 4: MAINTENANCE AND REPLACEMENT\n4.1 Employees inspect PPE daily before use\n4.2 Damaged or defective PPE reported and replaced immediately at company expense\n4.3 Annual PPE inventory and condition assessment',
 E'PPE ISSUANCE PROCEDURE:\n1. New employee completes PPE needs assessment with supervisor\n2. PPE issued from inventory, sizes confirmed for proper fit\n3. Employee signs PPE acknowledgment form\n4. Training completed and documented\n5. Annual re-assessment and replacement as needed\n\nPPE INSPECTION PROCEDURE:\n1. Visual check for damage, wear, contamination before each use\n2. Hard hats: check for cracks, dents, UV degradation\n3. Safety glasses: check for scratches, lens integrity\n4. Gloves: check for cuts, punctures, chemical degradation\n5. Report defects immediately to supervisor',
 ARRAY['29 CFR 1910.132 - General Requirements (PPE)', '29 CFR 1910.133 - Eye and Face Protection', '29 CFR 1910.135 - Head Protection', '29 CFR 1910.136 - Foot Protection', '29 CFR 1910.138 - Hand Protection'],
 ARRAY['ANSI Z87.1 Eye Protection', 'ANSI/ISEA 107 High-Visibility Safety Apparel', 'ASTM F2413 Foot Protection'],
 '1.0', '2025-01-15', 'Active', true, ARRAY['driver', 'mechanic', 'warehouse'], true,
 '00000000-0000-0000-0000-000000000001'),

('70100000-0000-0000-0000-000000000004', 'PT-DQ-001', 'Driver Qualification File Management',
 'Compliance',
 'Maintain complete and current driver qualification files for all CMV operators in compliance with FMCSA requirements.',
 'All employees who operate commercial motor vehicles requiring a CDL.',
 E'SECTION 1: DQ FILE CONTENTS\nPer 49 CFR 391.51, each driver qualification file must contain:\n1.1 Application for employment (391.21)\n1.2 Motor Vehicle Record (MVR) from each state (391.23) - obtained within 30 days of hire, annually thereafter\n1.3 Road test certificate or equivalent (391.31/391.33)\n1.4 Medical examiner certificate (391.43) - current, not expired\n1.5 Previous employer safety performance history (391.23(d)) - 3 years\n1.6 Annual review of driving record (391.25)\n1.7 Annual certification of violations (391.27)\n1.8 Drug and alcohol testing records per 49 CFR 382\n\nSECTION 2: MEDICAL CERTIFICATION\n2.1 Physical examination by FMCSA National Registry listed medical examiner\n2.2 Valid for up to 24 months (shorter for certain conditions)\n2.3 Driver must carry valid medical certificate while on duty\n2.4 Fleet management system tracks expiration dates with 90/60/30 day alerts\n\nSECTION 3: MVR MONITORING\n3.1 Pull MVRs within 30 days of hire and annually thereafter\n3.2 Continuous MVR monitoring service recommended\n3.3 Disqualifying violations per 49 CFR 391.15: DUI, leaving scene, felony involving CMV, railroad crossing violations, multiple serious traffic violations\n\nSECTION 4: FILE AUDITS\n4.1 Monthly spot-check of 10% of DQ files\n4.2 Annual comprehensive audit of all files\n4.3 Deficiencies corrected within 15 business days\n4.4 Driver removed from service if critical documents expired/missing',
 E'NEW DRIVER ONBOARDING DQ PROCESS:\n1. Collect and verify employment application\n2. Verify CDL and endorsements (physical inspection + online verification)\n3. Order MVR from all states driver has held license in past 3 years\n4. Verify medical certificate is current\n5. Contact previous employers for safety performance history\n6. Schedule and conduct road test (or accept equivalent)\n7. Complete background check\n8. Enroll in drug and alcohol testing program\n9. Enter all documents into fleet management system\n10. Set automatic alerts for all expiration dates',
 ARRAY['49 CFR 391.51 - General Requirements for Driver Qualification Files', '49 CFR 391.23 - Investigation and Inquiries', '49 CFR 391.25 - Annual Review of Driving Record', '49 CFR 391.43 - Medical Examination'],
 ARRAY['FMCSA Driver Qualification Guidelines', 'National Registry of Certified Medical Examiners'],
 '1.8', '2025-01-01', 'Active', true, ARRAY['driver', 'hr', 'fleet_manager'], true,
 '00000000-0000-0000-0000-000000000001'),

('70100000-0000-0000-0000-000000000005', 'PT-HOS-001', 'Hours of Service Compliance Program',
 'Compliance',
 'Ensure strict compliance with FMCSA Hours of Service regulations to prevent fatigued driving and maintain operational safety.',
 'All CDL drivers operating CMVs in interstate and intrastate commerce.',
 E'SECTION 1: HOS LIMITS\n1.1 11-Hour Driving Limit: May drive maximum 11 hours after 10 consecutive hours off duty\n1.2 14-Hour Limit: May not drive beyond 14th consecutive hour after coming on duty, following 10 consecutive hours off duty\n1.3 Rest Breaks: Required 30-minute break after 8 cumulative hours of driving\n1.4 60/70-Hour Limit: May not drive after 60/70 hours on duty in 7/8 consecutive days\n1.5 34-Hour Restart: Restarts the 7/8 day period after 34 or more consecutive hours off duty\n1.6 Sleeper Berth: Drivers using sleeper berth must take at least 7 consecutive hours in berth, plus 2-hour period either in berth, off duty, or combination\n\nSECTION 2: ELD REQUIREMENTS\n2.1 All CMVs must be equipped with FMCSA-registered ELD devices\n2.2 Drivers trained on ELD operation before first use\n2.3 ELD data automatically transmitted to fleet management system\n2.4 Manual edits require driver annotation and supervisor approval\n2.5 Supporting documents maintained: bills of lading, fuel receipts, dispatch records\n\nSECTION 3: EXCEPTIONS\n3.1 Short-haul exception: Drivers within 150 air-mile radius, report to same location, 14-hour duty period\n3.2 Adverse driving conditions: Additional 2 hours driving time for unexpected weather/road conditions\n3.3 Emergency conditions: Relief from HOS in declared emergency (FMCSA emergency declaration required)\n\nSECTION 4: MONITORING AND ENFORCEMENT\n4.1 Real-time HOS monitoring dashboard for dispatchers\n4.2 Automatic alerts at 10/13 hours (1 hour before limit)\n4.3 Dispatchers prohibited from dispatching drivers who would exceed limits\n4.4 All violations investigated within 24 hours',
 E'DISPATCHER HOS MONITORING PROCEDURE:\n1. Check driver HOS status before assigning loads\n2. Calculate projected hours including drive time and loading/unloading\n3. Ensure adequate rest time planned for multi-day routes\n4. Monitor real-time alerts and take immediate action on warnings\n5. Document any HOS exceptions claimed\n\nDRIVER HOS COMPLIANCE PROCEDURE:\n1. Log on to ELD at start of duty\n2. Select correct duty status (driving, on-duty not driving, sleeper berth, off duty)\n3. Monitor available hours throughout shift\n4. Plan rest stops to comply with 30-minute break requirement\n5. Notify dispatch when approaching limits\n6. Log off ELD at end of duty period',
 ARRAY['49 CFR 395 - Hours of Service of Drivers', '49 CFR 395.8 - Driver''s Record of Duty Status', '49 CFR 395.22 - ELD Requirements'],
 ARRAY['FMCSA Hours of Service Final Rule', 'ELD Technical Specifications'],
 '2.0', '2025-01-01', 'Active', true, ARRAY['driver', 'dispatcher'], true,
 '00000000-0000-0000-0000-000000000001'),

('70100000-0000-0000-0000-000000000006', 'PT-PM-001', 'Preventive Maintenance Program',
 'Maintenance',
 'Establish a systematic preventive maintenance program to ensure vehicle safety, reliability, and regulatory compliance.',
 'All fleet vehicles including trucks, vans, sedans, and specialty equipment.',
 E'SECTION 1: PM SCHEDULE\n1.1 PM-A (Basic Service) - Every 5,000 miles or 90 days:\n  - Engine oil and filter change\n  - All fluid levels checked and topped\n  - Tire inspection (tread depth, inflation, condition)\n  - Brake visual inspection\n  - Lights and signals check\n  - Wiper blades inspection\n  - Battery terminals and charge check\n\n1.2 PM-B (Intermediate Service) - Every 15,000 miles or 6 months:\n  - All PM-A items plus:\n  - Brake measurement and adjustment\n  - Steering and suspension inspection\n  - Exhaust system inspection\n  - Coolant system inspection\n  - Belt and hose inspection\n  - Transmission fluid check\n  - Differential fluid check\n\n1.3 PM-C (Major Service) - Every 45,000 miles or annually:\n  - All PM-B items plus:\n  - Transmission service\n  - Differential service\n  - Cooling system flush and fill\n  - Fuel system service\n  - AC system check\n  - Comprehensive electrical check\n  - Frame and body inspection\n\n1.4 PM-D (Overhaul) - Every 100,000 miles or 2 years:\n  - All PM-C items plus:\n  - Engine tune-up\n  - Major brake service\n  - Suspension component replacement as needed\n  - Complete electrical system test\n  - DOT annual inspection items\n\nSECTION 2: COMPLIANCE TRACKING\n2.1 Fleet management system generates work orders automatically based on mileage/time intervals\n2.2 Overdue PM notifications sent to driver, maintenance manager, and fleet manager\n2.3 Vehicles overdue >14 days restricted to local routes\n2.4 Vehicles overdue >30 days placed out of service\n\nSECTION 3: QUALITY ASSURANCE\n3.1 All PM work documented with technician name, parts used, and completion time\n3.2 Post-service quality check by lead technician\n3.3 Monthly PM compliance rate target: 95% or higher',
 E'PM WORK ORDER PROCESS:\n1. System generates PM work order based on mileage/time trigger\n2. Maintenance scheduler assigns to available bay and technician\n3. Parts pre-ordered based on PM checklist\n4. Driver notified of scheduled service date\n5. Vehicle delivered to maintenance facility\n6. Technician completes PM checklist\n7. Lead technician reviews and signs off\n8. Vehicle returned to service\n9. Work order closed with all documentation',
 ARRAY['49 CFR 396.3 - Inspection, Repair, and Maintenance', '49 CFR 396.17 - Periodic Inspection'],
 ARRAY['TMC Recommended Practices', 'ASE Certification Standards'],
 '3.0', '2025-01-01', 'Active', true, ARRAY['mechanic', 'fleet_manager', 'maintenance_manager'], true,
 '00000000-0000-0000-0000-000000000001'),

('70100000-0000-0000-0000-000000000007', 'PT-AIR-001', 'Accident Investigation & Response Protocol',
 'Safety',
 'Define standardized procedures for accident response, investigation, documentation, and corrective action to minimize injuries, liability, and recurrence.',
 'All fleet operators, supervisors, safety personnel, and fleet management.',
 E'SECTION 1: IMMEDIATE RESPONSE\n1.1 Driver Actions at Scene:\n  a) Ensure safety of all persons - move to safe location if possible\n  b) Call 911 if injuries or significant damage\n  c) Turn on hazard lights, set up warning triangles\n  d) Do NOT admit fault or discuss details with other parties\n  e) Exchange information: name, license, insurance, vehicle info\n  f) Document scene: photos of all vehicles (all angles), road conditions, traffic signs, weather\n  g) Identify witnesses and obtain contact information\n  h) Contact dispatch/fleet management within 30 minutes\n\n1.2 Dispatcher/Manager Actions:\n  a) Confirm driver and passenger safety\n  b) Arrange replacement vehicle/driver if needed\n  c) Notify insurance carrier\n  d) Initiate post-accident drug/alcohol testing if DOT criteria met\n  e) Assign investigator\n\nSECTION 2: INVESTIGATION\n2.1 Preliminary report completed within 24 hours\n2.2 Scene investigation within 48 hours (if accessible)\n2.3 Full investigation report within 5 business days including:\n  - Sequence of events\n  - Contributing factors\n  - Witness statements\n  - Photos and diagrams\n  - Police report\n  - Driver history review\n2.4 Root cause analysis within 10 business days\n2.5 Corrective action plan within 15 business days\n\nSECTION 3: DOT RECORDABLE CRITERIA\nAn accident is DOT recordable if it involves a CMV and results in:\n  - A fatality (any person)\n  - An injury requiring transport to medical treatment facility\n  - A vehicle being towed from the scene due to disabling damage\n\nSECTION 4: POST-ACCIDENT TESTING\nDrug and alcohol testing required per 49 CFR 382.303 for DOT recordable crashes.\nAlcohol test must be administered within 8 hours.\nDrug test must be administered within 32 hours.',
 E'ACCIDENT SCENE DOCUMENTATION CHECKLIST:\n1. Photos: all vehicles from 4 angles each\n2. Photos: point of impact close-up\n3. Photos: road conditions, signs, signals\n4. Photos: weather/visibility conditions\n5. Photos: skid marks or debris\n6. Diagram: scene layout with measurements\n7. Record: date, time, location, weather\n8. Record: other party information\n9. Record: witness names and contacts\n10. Record: police report number and officer name',
 ARRAY['49 CFR 390.15 - Assistance in Investigations and Special Studies', '49 CFR 382.303 - Post-Accident Testing', '49 CFR 390.5 - Definitions (Accident)'],
 ARRAY['NTSB Accident Investigation Best Practices', 'NSC Defensive Driving Standards'],
 '2.2', '2025-01-01', 'Active', true, ARRAY['driver', 'safety_manager', 'fleet_manager'], true,
 '00000000-0000-0000-0000-000000000001'),

('70100000-0000-0000-0000-000000000008', 'PT-HAZ-001', 'Hazardous Materials Transport Program',
 'Compliance',
 'Ensure safe transport of hazardous materials in compliance with DOT and FMCSA regulations including proper placarding, documentation, and driver training.',
 'All drivers with hazmat endorsement and vehicles transporting regulated quantities of hazardous materials.',
 E'SECTION 1: DRIVER REQUIREMENTS\n1.1 Valid CDL with Hazmat (H) endorsement\n1.2 TSA security threat assessment clearance\n1.3 Hazmat training completed within 90 days of hire, refreshed every 3 years\n1.4 Training must include: general awareness, function-specific, safety, security awareness, driver training for materials transported\n\nSECTION 2: SHIPPING DOCUMENTATION\n2.1 Shipping papers must accompany all hazmat shipments\n2.2 Required information: proper shipping name, hazard class, ID number, packing group, quantity, emergency contact\n2.3 Papers must be within driver reach while driving, in door pocket when driver leaves vehicle\n2.4 Emergency Response Guidebook (ERG) must be in vehicle\n\nSECTION 3: PLACARDING\n3.1 Placards required per 49 CFR 172 based on hazard class and quantity\n3.2 Driver must verify correct placards before transport\n3.3 Placards must be clearly visible on all four sides of vehicle\n\nSECTION 4: ROUTING\n4.1 Hazmat vehicles must follow designated hazmat routes per 49 CFR 397\n4.2 Avoid tunnels, bridges, and populated areas where possible\n4.3 No parking within 5 feet of traveled roadway\n4.4 Attended vehicle rule: driver must stay within 100 feet or vehicle must be in safe parking area\n\nSECTION 5: EMERGENCY RESPONSE\n5.1 In case of spill or leak: isolate area, call 911 and CHEMTREC (800-424-9300)\n5.2 Do not attempt cleanup without proper training and equipment\n5.3 Provide shipping papers and SDS to emergency responders',
 E'PRE-TRIP HAZMAT CHECKLIST:\n1. Verify hazmat endorsement is current\n2. Check shipping papers match load\n3. Verify placards are correct and properly displayed\n4. Ensure ERG is in vehicle\n5. Check all container seals and closures\n6. Verify emergency equipment (fire extinguisher, spill kit)\n7. Review route for hazmat restrictions\n8. Confirm emergency contact information is current',
 ARRAY['49 CFR 397 - Transportation of Hazardous Materials; Driving and Parking Rules', '49 CFR 172 - Hazardous Materials Table and Communication', '49 CFR 177 - Carriage by Public Highway'],
 ARRAY['PHMSA Hazmat Transportation Guidelines', 'NFPA 704 Hazard Identification'],
 '1.0', '2025-02-01', 'Active', true, ARRAY['driver'], true,
 '00000000-0000-0000-0000-000000000001')

ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- PHASE 1c: SAFETY POLICIES (tenant-level safety policy records)
-- ============================================================================

INSERT INTO safety_policies (id, tenant_id, policy_number, policy_name, policy_category, description, effective_date, review_date, status, version, created_by)
VALUES
('70200000-0000-0000-0000-000000000001', '12345678-1234-1234-1234-123456789012', 'SP-001', 'Fleet Vehicle Safety Standards', 'vehicle_maintenance',
 'Comprehensive vehicle safety standards covering inspection requirements, maintenance intervals, and out-of-service criteria for all fleet vehicles.',
 '2025-01-01', '2026-01-01', 'active', '2.0', '00000000-0000-0000-0000-000000000001'),
('70200000-0000-0000-0000-000000000002', '12345678-1234-1234-1234-123456789012', 'SP-002', 'Driver Safety & Behavior Standards', 'driver_safety',
 'Establishes expectations for safe driving behavior including speed limits, distracted driving prohibition, defensive driving techniques, and seat belt usage requirements.',
 '2025-01-01', '2026-01-01', 'active', '1.5', '00000000-0000-0000-0000-000000000001'),
('70200000-0000-0000-0000-000000000003', '12345678-1234-1234-1234-123456789012', 'SP-003', 'Hazardous Materials Handling', 'environmental',
 'Procedures for safe handling, transport, and storage of hazardous materials including fuel, lubricants, batteries, and cleaning chemicals.',
 '2025-02-01', '2026-02-01', 'active', '1.0', '00000000-0000-0000-0000-000000000001'),
('70200000-0000-0000-0000-000000000004', '12345678-1234-1234-1234-123456789012', 'SP-004', 'Workplace Injury Prevention', 'driver_safety',
 'Injury prevention program covering ergonomics, lifting techniques, slip/trip/fall prevention, and workplace hazard identification.',
 '2025-01-15', '2026-01-15', 'active', '1.2', '00000000-0000-0000-0000-000000000001'),
('70200000-0000-0000-0000-000000000005', '12345678-1234-1234-1234-123456789012', 'SP-005', 'Emergency Response Plan', 'compliance',
 'Facility and vehicle emergency response procedures for fire, severe weather, medical emergencies, active threats, and hazmat spills.',
 '2025-01-01', '2026-01-01', 'active', '1.8', '00000000-0000-0000-0000-000000000001'),
('70200000-0000-0000-0000-000000000006', '12345678-1234-1234-1234-123456789012', 'SP-006', 'DOT Compliance & Recordkeeping', 'compliance',
 'Procedures for maintaining DOT compliance including HOS records, DQ files, vehicle inspection records, and drug/alcohol testing documentation.',
 '2025-01-01', '2026-01-01', 'active', '2.1', '00000000-0000-0000-0000-000000000001')
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- PHASE 1d: PROCEDURES (Standard Operating Procedures)
-- ============================================================================

INSERT INTO procedures (id, tenant_id, procedure_code, procedure_name, procedure_type, description, steps, related_policy_id, frequency, estimated_duration_minutes, requires_certification, status, version)
VALUES
('70300000-0000-0000-0000-000000000001', '12345678-1234-1234-1234-123456789012', 'SOP-001', 'Daily Pre-Trip/Post-Trip Vehicle Inspection', 'safety_inspection',
 'Standard operating procedure for conducting thorough pre-trip and post-trip vehicle inspections per FMCSA regulations.',
 '[{"step": 1, "title": "Approach and External Walk-Around", "description": "Walk around vehicle checking for leaks, tire condition, body damage, and load security", "duration_minutes": 3},
   {"step": 2, "title": "Under Hood Check", "description": "Check oil level, coolant, power steering fluid, brake fluid, belts, and hoses", "duration_minutes": 3},
   {"step": 3, "title": "In-Cab Systems Check", "description": "Test all gauges, warning lights, horn, wipers, mirrors, seat belt, HVAC", "duration_minutes": 2},
   {"step": 4, "title": "Brake Test", "description": "Test service brakes and parking brake. For air brakes: check pressure build-up rate and low pressure warning", "duration_minutes": 2},
   {"step": 5, "title": "Lights and Signals", "description": "Test all headlights, taillights, brake lights, turn signals, hazard lights, and clearance lights", "duration_minutes": 2},
   {"step": 6, "title": "Complete DVIR", "description": "Document findings in fleet management system. Report any defects immediately", "duration_minutes": 3}]'::jsonb,
 '70200000-0000-0000-0000-000000000001', 'daily', 15, false, 'active', '2.0'),

('70300000-0000-0000-0000-000000000002', '12345678-1234-1234-1234-123456789012', 'SOP-002', 'Accident Response & Reporting', 'incident_response',
 'Step-by-step procedure for responding to and documenting vehicle accidents.',
 '[{"step": 1, "title": "Ensure Safety", "description": "Check for injuries, move to safe location if possible, call 911 if needed"},
   {"step": 2, "title": "Secure Scene", "description": "Activate hazard lights, set warning triangles 100-500 feet behind vehicle"},
   {"step": 3, "title": "Document Scene", "description": "Take photos from all angles, document road/weather conditions"},
   {"step": 4, "title": "Exchange Information", "description": "Get other party name, license, insurance, vehicle info. Do NOT admit fault"},
   {"step": 5, "title": "Notify Dispatch", "description": "Call dispatch within 30 minutes with location and situation details"},
   {"step": 6, "title": "Complete Incident Report", "description": "Fill out accident report form within 24 hours with all documentation"},
   {"step": 7, "title": "Drug/Alcohol Test", "description": "Report to testing facility if DOT-recordable crash. Alcohol within 8hr, drug within 32hr"}]'::jsonb,
 '70200000-0000-0000-0000-000000000005', 'as_needed', 60, false, 'active', '2.2'),

('70300000-0000-0000-0000-000000000003', '12345678-1234-1234-1234-123456789012', 'SOP-003', 'Preventive Maintenance Service', 'maintenance',
 'Procedure for scheduling, performing, and documenting preventive maintenance services.',
 '[{"step": 1, "title": "Work Order Review", "description": "Review PM work order, check vehicle history, pre-order required parts"},
   {"step": 2, "title": "Vehicle Intake", "description": "Record odometer, document existing damage, note driver-reported issues"},
   {"step": 3, "title": "Execute PM Checklist", "description": "Complete all items on PM-level-specific checklist (A/B/C/D)"},
   {"step": 4, "title": "Additional Repairs", "description": "Document any additional issues found, get approval for non-PM repairs"},
   {"step": 5, "title": "Quality Check", "description": "Lead technician reviews work, verifies all checklist items completed"},
   {"step": 6, "title": "Close Work Order", "description": "Record parts used, labor hours, technician notes, and completion status"}]'::jsonb,
 '70200000-0000-0000-0000-000000000001', 'monthly', 180, true, 'active', '3.0'),

('70300000-0000-0000-0000-000000000004', '12345678-1234-1234-1234-123456789012', 'SOP-004', 'Drug & Alcohol Testing Collection', 'driver_training',
 'Procedure for conducting DOT drug and alcohol testing including specimen collection, chain of custody, and result handling.',
 '[{"step": 1, "title": "Notification", "description": "Employee notified of test requirement, must report to collection site within 2 hours"},
   {"step": 2, "title": "Identification", "description": "Verify employee identity with valid government-issued photo ID"},
   {"step": 3, "title": "Collection", "description": "Specimen collected per DOT 49 CFR Part 40 procedures, chain of custody maintained"},
   {"step": 4, "title": "Documentation", "description": "Complete Federal Drug Testing Custody and Control Form (CCF)"},
   {"step": 5, "title": "Lab Processing", "description": "Specimen shipped to SAMHSA-certified laboratory via secure carrier"},
   {"step": 6, "title": "MRO Review", "description": "Medical Review Officer reviews results, contacts donor if positive for legitimate medical explanation"},
   {"step": 7, "title": "Result Reporting", "description": "DER receives verified results, takes appropriate action per policy"}]'::jsonb,
 '70200000-0000-0000-0000-000000000004', 'as_needed', 45, true, 'active', '1.5'),

('70300000-0000-0000-0000-000000000005', '12345678-1234-1234-1234-123456789012', 'SOP-005', 'New Driver Orientation & Qualification', 'driver_training',
 'Comprehensive onboarding procedure for new drivers covering DQ file assembly, training requirements, and road test.',
 '[{"step": 1, "title": "Application & Background", "description": "Collect employment application, verify CDL, order MVR, initiate background check"},
   {"step": 2, "title": "Previous Employer Check", "description": "Contact all employers from past 3 years for safety performance history per 49 CFR 391.23"},
   {"step": 3, "title": "Medical Certification", "description": "Verify current DOT medical certificate from National Registry examiner"},
   {"step": 4, "title": "Pre-Employment Drug Test", "description": "Schedule and complete pre-employment drug test, must be negative before CMV operation"},
   {"step": 5, "title": "Orientation Training", "description": "Complete company orientation: policies, procedures, ELD training, safety standards (8 hours)"},
   {"step": 6, "title": "Road Test", "description": "Conduct road test per 49 CFR 391.31 or verify equivalent (valid CDL skills test within past 3 years)"},
   {"step": 7, "title": "DQ File Assembly", "description": "Compile all documents into driver qualification file, verify completeness"},
   {"step": 8, "title": "Release to Service", "description": "Safety manager reviews and approves DQ file, driver authorized to operate"}]'::jsonb,
 '70200000-0000-0000-0000-000000000004', 'as_needed', 480, true, 'active', '1.8')
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- PHASE 2: TRAINING SYSTEM
-- ============================================================================

INSERT INTO training_programs (id, tenant_id, program_code, program_name, program_type, description, duration_hours, certification_valid_years, is_required, required_for_roles, training_provider, cost_per_person, is_active)
VALUES
('70400000-0000-0000-0000-000000000001', '12345678-1234-1234-1234-123456789012', 'TRN-DD-001', 'Defensive Driving Course', 'defensive_driving',
 'Comprehensive defensive driving course covering hazard recognition, space management, speed management, and adverse conditions driving. Meets Smith System and NSC standards.',
 8.0, 3, true, ARRAY['driver'], 'National Safety Council', 275.00, true),
('70400000-0000-0000-0000-000000000002', '12345678-1234-1234-1234-123456789012', 'TRN-HZ-001', 'Hazmat Awareness & Safety', 'hazmat',
 'DOT-required hazmat training covering identification, handling, documentation, placarding, and emergency response for hazardous materials transport.',
 4.0, 3, true, ARRAY['driver'], 'JJ Keller', 195.00, true),
('70400000-0000-0000-0000-000000000003', '12345678-1234-1234-1234-123456789012', 'TRN-HOS-001', 'Hours of Service Rules & ELD Operation', 'safety',
 'Training on FMCSA HOS regulations, proper ELD use, logging procedures, and common violations to avoid.',
 2.0, 2, true, ARRAY['driver', 'dispatcher'], 'In-House', 0.00, true),
('70400000-0000-0000-0000-000000000004', '12345678-1234-1234-1234-123456789012', 'TRN-PTI-001', 'Pre-Trip Inspection Certification', 'safety',
 'Hands-on training for conducting thorough pre-trip and post-trip vehicle inspections per FMCSA requirements.',
 1.5, 2, true, ARRAY['driver'], 'In-House', 0.00, true),
('70400000-0000-0000-0000-000000000005', '12345678-1234-1234-1234-123456789012', 'TRN-WS-001', 'Workplace Safety & OSHA Compliance', 'safety',
 'OSHA-compliant workplace safety training covering hazard communication, PPE use, lockout/tagout, fire safety, and emergency procedures.',
 3.0, 1, true, ARRAY['driver', 'mechanic'], 'OSHA Training Institute', 150.00, true),
('70400000-0000-0000-0000-000000000006', '12345678-1234-1234-1234-123456789012', 'TRN-DA-001', 'Drug & Alcohol Awareness', 'safety',
 'DOT-required drug and alcohol awareness training covering testing procedures, prohibited substances, consequences of violations, and available assistance programs.',
 1.0, 2, true, ARRAY['driver', 'mechanic'], 'In-House', 0.00, true),
('70400000-0000-0000-0000-000000000007', '12345678-1234-1234-1234-123456789012', 'TRN-ELD-001', 'ELD Operation & Compliance', 'equipment_operation',
 'Hands-on training for Electronic Logging Device operation, duty status changes, annotations, and troubleshooting.',
 2.0, 2, true, ARRAY['driver'], 'In-House', 0.00, true),
('70400000-0000-0000-0000-000000000008', '12345678-1234-1234-1234-123456789012', 'TRN-TEL-001', 'Fleet Telematics System Training', 'equipment_operation',
 'Training on fleet telematics system including GPS tracking, driver scoring, dispatch communication, and mobile app usage.',
 1.5, null, false, ARRAY['driver', 'dispatcher'], 'In-House', 0.00, true),
('70400000-0000-0000-0000-000000000009', '12345678-1234-1234-1234-123456789012', 'TRN-PM-001', 'Preventive Maintenance Fundamentals', 'equipment_operation',
 'Training for maintenance technicians on PM procedures, documentation standards, quality checks, and parts management.',
 3.0, 2, true, ARRAY['mechanic'], 'ASE Training', 225.00, true),
('70400000-0000-0000-0000-000000000010', '12345678-1234-1234-1234-123456789012', 'TRN-AR-001', 'Accident Reporting Procedures', 'safety',
 'Training on proper accident scene response, documentation, reporting procedures, and post-accident protocols.',
 1.0, 2, true, ARRAY['driver'], 'In-House', 0.00, true)
ON CONFLICT (id) DO NOTHING;

-- Training completions (~40 records across drivers and courses)
INSERT INTO training_completions (id, tenant_id, program_id, user_id, driver_id, completion_date, expiration_date, score, status, instructor_name, training_location, notes)
VALUES
-- Defensive Driving - most drivers completed
('70500000-0000-0000-0000-000000000001', '12345678-1234-1234-1234-123456789012', '70400000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', '2025-06-15', '2028-06-15', 92.0, 'current', 'Robert Wilson', 'CTA Training Center', 'Excellent performance'),
('70500000-0000-0000-0000-000000000002', '12345678-1234-1234-1234-123456789012', '70400000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000002', '30000000-0000-0000-0000-000000000002', '2025-06-15', '2028-06-15', 88.0, 'current', 'Robert Wilson', 'CTA Training Center', null),
('70500000-0000-0000-0000-000000000003', '12345678-1234-1234-1234-123456789012', '70400000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000003', '30000000-0000-0000-0000-000000000003', '2025-07-01', '2028-07-01', 95.0, 'current', 'Robert Wilson', 'CTA Training Center', 'Top performer'),
('70500000-0000-0000-0000-000000000004', '12345678-1234-1234-1234-123456789012', '70400000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000004', '30000000-0000-0000-0000-000000000004', '2025-07-01', '2028-07-01', 85.0, 'current', 'Robert Wilson', 'CTA Training Center', null),
('70500000-0000-0000-0000-000000000005', '12345678-1234-1234-1234-123456789012', '70400000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000005', '30000000-0000-0000-0000-000000000005', '2025-08-10', '2028-08-10', 78.0, 'current', 'Sarah Chen', 'CTA Training Center', 'Needs improvement in hazard perception'),
('70500000-0000-0000-0000-000000000006', '12345678-1234-1234-1234-123456789012', '70400000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000006', '30000000-0000-0000-0000-000000000006', '2025-08-10', '2028-08-10', 91.0, 'current', 'Sarah Chen', 'CTA Training Center', null),
-- Some drivers pending defensive driving
('70500000-0000-0000-0000-000000000007', '12345678-1234-1234-1234-123456789012', '70400000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000015', '30000000-0000-0000-0000-000000000015', '2024-03-01', '2025-03-01', 82.0, 'expired', 'Robert Wilson', 'CTA Training Center', 'Renewal overdue'),

-- HOS Training - most drivers completed
('70500000-0000-0000-0000-000000000010', '12345678-1234-1234-1234-123456789012', '70400000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', '2025-05-01', '2027-05-01', 96.0, 'current', 'Mike Torres', 'Online', null),
('70500000-0000-0000-0000-000000000011', '12345678-1234-1234-1234-123456789012', '70400000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000002', '30000000-0000-0000-0000-000000000002', '2025-05-01', '2027-05-01', 90.0, 'current', 'Mike Torres', 'Online', null),
('70500000-0000-0000-0000-000000000012', '12345678-1234-1234-1234-123456789012', '70400000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000003', '30000000-0000-0000-0000-000000000003', '2025-05-15', '2027-05-15', 100.0, 'current', 'Mike Torres', 'Online', 'Perfect score'),
('70500000-0000-0000-0000-000000000013', '12345678-1234-1234-1234-123456789012', '70400000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000007', '30000000-0000-0000-0000-000000000007', '2025-06-01', '2027-06-01', 88.0, 'current', 'Mike Torres', 'Online', null),
('70500000-0000-0000-0000-000000000014', '12345678-1234-1234-1234-123456789012', '70400000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000008', '30000000-0000-0000-0000-000000000008', '2025-06-01', '2027-06-01', 85.0, 'current', 'Mike Torres', 'Online', null),

-- Pre-Trip Inspection training
('70500000-0000-0000-0000-000000000020', '12345678-1234-1234-1234-123456789012', '70400000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', '2025-04-15', '2027-04-15', 94.0, 'current', 'James Brown', 'CTA Maintenance Yard', null),
('70500000-0000-0000-0000-000000000021', '12345678-1234-1234-1234-123456789012', '70400000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000002', '30000000-0000-0000-0000-000000000002', '2025-04-15', '2027-04-15', 90.0, 'current', 'James Brown', 'CTA Maintenance Yard', null),
('70500000-0000-0000-0000-000000000022', '12345678-1234-1234-1234-123456789012', '70400000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000003', '30000000-0000-0000-0000-000000000003', '2025-04-20', '2027-04-20', 97.0, 'current', 'James Brown', 'CTA Maintenance Yard', null),
('70500000-0000-0000-0000-000000000023', '12345678-1234-1234-1234-123456789012', '70400000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000010', '30000000-0000-0000-0000-000000000010', '2025-05-10', '2027-05-10', 86.0, 'current', 'James Brown', 'CTA Maintenance Yard', null),

-- Workplace Safety / OSHA training
('70500000-0000-0000-0000-000000000030', '12345678-1234-1234-1234-123456789012', '70400000-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', '2025-09-01', '2026-09-01', 88.0, 'current', 'OSHA Trainer', 'CTA Training Center', null),
('70500000-0000-0000-0000-000000000031', '12345678-1234-1234-1234-123456789012', '70400000-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000002', '30000000-0000-0000-0000-000000000002', '2025-09-01', '2026-09-01', 92.0, 'current', 'OSHA Trainer', 'CTA Training Center', null),
('70500000-0000-0000-0000-000000000032', '12345678-1234-1234-1234-123456789012', '70400000-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000005', '30000000-0000-0000-0000-000000000005', '2025-09-15', '2026-09-15', 85.0, 'current', 'OSHA Trainer', 'CTA Training Center', null),

-- Drug & Alcohol Awareness
('70500000-0000-0000-0000-000000000035', '12345678-1234-1234-1234-123456789012', '70400000-0000-0000-0000-000000000006', '10000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', '2025-05-01', '2027-05-01', 100.0, 'current', 'HR Department', 'Online', null),
('70500000-0000-0000-0000-000000000036', '12345678-1234-1234-1234-123456789012', '70400000-0000-0000-0000-000000000006', '10000000-0000-0000-0000-000000000002', '30000000-0000-0000-0000-000000000002', '2025-05-01', '2027-05-01', 100.0, 'current', 'HR Department', 'Online', null),
('70500000-0000-0000-0000-000000000037', '12345678-1234-1234-1234-123456789012', '70400000-0000-0000-0000-000000000006', '10000000-0000-0000-0000-000000000003', '30000000-0000-0000-0000-000000000003', '2025-05-15', '2027-05-15', 100.0, 'current', 'HR Department', 'Online', null),
('70500000-0000-0000-0000-000000000038', '12345678-1234-1234-1234-123456789012', '70400000-0000-0000-0000-000000000006', '10000000-0000-0000-0000-000000000004', '30000000-0000-0000-0000-000000000004', '2025-06-01', '2027-06-01', 100.0, 'current', 'HR Department', 'Online', null),
('70500000-0000-0000-0000-000000000039', '12345678-1234-1234-1234-123456789012', '70400000-0000-0000-0000-000000000006', '10000000-0000-0000-0000-000000000009', '30000000-0000-0000-0000-000000000009', '2025-06-01', '2027-06-01', 100.0, 'current', 'HR Department', 'Online', null),

-- ELD Training
('70500000-0000-0000-0000-000000000040', '12345678-1234-1234-1234-123456789012', '70400000-0000-0000-0000-000000000007', '10000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', '2025-04-01', '2027-04-01', 90.0, 'current', 'Tech Support', 'CTA HQ', null),
('70500000-0000-0000-0000-000000000041', '12345678-1234-1234-1234-123456789012', '70400000-0000-0000-0000-000000000007', '10000000-0000-0000-0000-000000000002', '30000000-0000-0000-0000-000000000002', '2025-04-01', '2027-04-01', 88.0, 'current', 'Tech Support', 'CTA HQ', null),
('70500000-0000-0000-0000-000000000042', '12345678-1234-1234-1234-123456789012', '70400000-0000-0000-0000-000000000007', '10000000-0000-0000-0000-000000000006', '30000000-0000-0000-0000-000000000006', '2025-04-15', '2027-04-15', 95.0, 'current', 'Tech Support', 'CTA HQ', null),

-- Accident Reporting
('70500000-0000-0000-0000-000000000045', '12345678-1234-1234-1234-123456789012', '70400000-0000-0000-0000-000000000010', '10000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', '2025-05-01', '2027-05-01', 94.0, 'current', 'Safety Director', 'CTA Training Center', null),
('70500000-0000-0000-0000-000000000046', '12345678-1234-1234-1234-123456789012', '70400000-0000-0000-0000-000000000010', '10000000-0000-0000-0000-000000000003', '30000000-0000-0000-0000-000000000003', '2025-05-15', '2027-05-15', 90.0, 'current', 'Safety Director', 'CTA Training Center', null),
('70500000-0000-0000-0000-000000000047', '12345678-1234-1234-1234-123456789012', '70400000-0000-0000-0000-000000000010', '10000000-0000-0000-0000-000000000005', '30000000-0000-0000-0000-000000000005', '2025-06-01', '2027-06-01', 87.0, 'current', 'Safety Director', 'CTA Training Center', null)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- PHASE 3: TRACKING DEVICES
-- ============================================================================

INSERT INTO tracking_devices (id, tenant_id, device_type, manufacturer, model_number, serial_number, firmware_version, purchase_date, warranty_expiry_date, unit_cost, status)
VALUES
('71200000-0000-0000-0000-000000000001', '12345678-1234-1234-1234-123456789012', 'eld', 'Samsara', 'VG54', 'SAM-ELD-00001', '4.2.1', '2024-06-15', '2027-06-15', 299.00, 'installed'),
('71200000-0000-0000-0000-000000000002', '12345678-1234-1234-1234-123456789012', 'eld', 'Samsara', 'VG54', 'SAM-ELD-00002', '4.2.1', '2024-06-15', '2027-06-15', 299.00, 'installed'),
('71200000-0000-0000-0000-000000000003', '12345678-1234-1234-1234-123456789012', 'eld', 'Samsara', 'VG54', 'SAM-ELD-00003', '4.2.1', '2024-06-15', '2027-06-15', 299.00, 'installed'),
('71200000-0000-0000-0000-000000000004', '12345678-1234-1234-1234-123456789012', 'gps_tracker', 'CalAmp', 'LMU-3640', 'CAL-GPS-00001', '3.8.0', '2024-08-01', '2026-08-01', 189.00, 'installed'),
('71200000-0000-0000-0000-000000000005', '12345678-1234-1234-1234-123456789012', 'gps_tracker', 'CalAmp', 'LMU-3640', 'CAL-GPS-00002', '3.8.0', '2024-08-01', '2026-08-01', 189.00, 'installed'),
('71200000-0000-0000-0000-000000000006', '12345678-1234-1234-1234-123456789012', 'dashcam', 'Lytx', 'DriveCam SF-300', 'LYT-DC-00001', '6.1.0', '2024-10-01', '2027-10-01', 449.00, 'installed'),
('71200000-0000-0000-0000-000000000007', '12345678-1234-1234-1234-123456789012', 'dashcam', 'Lytx', 'DriveCam SF-300', 'LYT-DC-00002', '6.1.0', '2024-10-01', '2027-10-01', 449.00, 'installed'),
('71200000-0000-0000-0000-000000000008', '12345678-1234-1234-1234-123456789012', 'dashcam', 'Lytx', 'DriveCam SF-300', 'LYT-DC-00003', '6.1.0', '2024-10-01', '2027-10-01', 449.00, 'installed'),
('71200000-0000-0000-0000-000000000009', '12345678-1234-1234-1234-123456789012', 'obd2', 'Geotab', 'GO9', 'GEO-OBD-00001', '5.0.3', '2024-09-15', '2027-09-15', 149.00, 'installed'),
('71200000-0000-0000-0000-000000000010', '12345678-1234-1234-1234-123456789012', 'obd2', 'Geotab', 'GO9', 'GEO-OBD-00002', '5.0.3', '2024-09-15', '2027-09-15', 149.00, 'installed'),
('71200000-0000-0000-0000-000000000011', '12345678-1234-1234-1234-123456789012', 'temperature_sensor', 'TempTrackr', 'TT-200', 'TMP-SEN-00001', '2.1.0', '2024-11-01', '2026-11-01', 89.00, 'installed'),
('71200000-0000-0000-0000-000000000012', '12345678-1234-1234-1234-123456789012', 'fuel_sensor', 'OmniComm', 'LLS-30160', 'OMN-FS-00001', '1.5.2', '2024-12-01', '2026-12-01', 129.00, 'installed'),
('71200000-0000-0000-0000-000000000013', '12345678-1234-1234-1234-123456789012', 'gps_tracker', 'CalAmp', 'LMU-3640', 'CAL-GPS-00003', '3.8.0', '2025-01-15', '2027-01-15', 189.00, 'in_stock'),
('71200000-0000-0000-0000-000000000014', '12345678-1234-1234-1234-123456789012', 'eld', 'Samsara', 'VG54', 'SAM-ELD-00004', '4.2.1', '2025-01-15', '2028-01-15', 299.00, 'in_stock'),
('71200000-0000-0000-0000-000000000015', '12345678-1234-1234-1234-123456789012', 'dashcam', 'Lytx', 'DriveCam SF-300', 'LYT-DC-00004', '6.1.0', '2025-01-15', '2028-01-15', 449.00, 'in_stock')
ON CONFLICT (id) DO NOTHING;

-- Vehicle device installations
INSERT INTO vehicle_devices (id, tenant_id, vehicle_id, device_id, installation_date, installation_location, device_identifier, is_active, last_communication, device_status)
VALUES
('71300000-0000-0000-0000-000000000001', '12345678-1234-1234-1234-123456789012', '40000000-0000-0000-0000-000000000001', '71200000-0000-0000-0000-000000000001', '2024-07-01', 'OBD-II port', 'IMEI-SAM-001', true, now() - interval '5 minutes', 'operational'),
('71300000-0000-0000-0000-000000000002', '12345678-1234-1234-1234-123456789012', '40000000-0000-0000-0000-000000000002', '71200000-0000-0000-0000-000000000002', '2024-07-01', 'OBD-II port', 'IMEI-SAM-002', true, now() - interval '12 minutes', 'operational'),
('71300000-0000-0000-0000-000000000003', '12345678-1234-1234-1234-123456789012', '40000000-0000-0000-0000-000000000003', '71200000-0000-0000-0000-000000000003', '2024-07-15', 'OBD-II port', 'IMEI-SAM-003', true, now() - interval '2 hours', 'operational'),
('71300000-0000-0000-0000-000000000004', '12345678-1234-1234-1234-123456789012', '40000000-0000-0000-0000-000000000005', '71200000-0000-0000-0000-000000000004', '2024-08-15', 'under_seat', 'IMEI-CAL-001', true, now() - interval '30 minutes', 'operational'),
('71300000-0000-0000-0000-000000000005', '12345678-1234-1234-1234-123456789012', '40000000-0000-0000-0000-000000000010', '71200000-0000-0000-0000-000000000005', '2024-08-15', 'under_seat', 'IMEI-CAL-002', true, now() - interval '8 hours', 'offline'),
('71300000-0000-0000-0000-000000000006', '12345678-1234-1234-1234-123456789012', '40000000-0000-0000-0000-000000000001', '71200000-0000-0000-0000-000000000006', '2024-10-15', 'dashboard', 'IMEI-LYT-001', true, now() - interval '5 minutes', 'operational'),
('71300000-0000-0000-0000-000000000007', '12345678-1234-1234-1234-123456789012', '40000000-0000-0000-0000-000000000003', '71200000-0000-0000-0000-000000000007', '2024-10-15', 'dashboard', 'IMEI-LYT-002', true, now() - interval '2 hours', 'operational'),
('71300000-0000-0000-0000-000000000008', '12345678-1234-1234-1234-123456789012', '40000000-0000-0000-0000-000000000007', '71200000-0000-0000-0000-000000000008', '2024-10-20', 'dashboard', 'IMEI-LYT-003', true, now() - interval '1 hour', 'operational'),
('71300000-0000-0000-0000-000000000009', '12345678-1234-1234-1234-123456789012', '40000000-0000-0000-0000-000000000015', '71200000-0000-0000-0000-000000000009', '2024-10-01', 'OBD-II port', 'IMEI-GEO-001', true, now() - interval '20 minutes', 'operational'),
('71300000-0000-0000-0000-000000000010', '12345678-1234-1234-1234-123456789012', '40000000-0000-0000-0000-000000000020', '71200000-0000-0000-0000-000000000010', '2024-10-01', 'OBD-II port', 'IMEI-GEO-002', true, now() - interval '3 days', 'malfunction'),
('71300000-0000-0000-0000-000000000011', '12345678-1234-1234-1234-123456789012', '40000000-0000-0000-0000-000000000025', '71200000-0000-0000-0000-000000000011', '2024-11-15', 'rear_window', 'IMEI-TMP-001', true, now() - interval '10 minutes', 'operational'),
('71300000-0000-0000-0000-000000000012', '12345678-1234-1234-1234-123456789012', '40000000-0000-0000-0000-000000000030', '71200000-0000-0000-0000-000000000012', '2024-12-15', 'under_seat', 'IMEI-OMN-001', true, now() - interval '45 minutes', 'operational')
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- PHASE 4: SECURITY INCIDENTS
-- ============================================================================

INSERT INTO security_incidents (id, incident_type, severity, user_id, tenant_id, ip_address, request_path, request_method, details, resolved, created_at)
VALUES
('71000000-0000-0000-0000-000000000001', 'rate_limit', 'low', '10000000-0000-0000-0000-000000000005', '12345678-1234-1234-1234-123456789012', '192.168.1.100', '/api/vehicles', 'GET', '{"requests_in_window": 150, "limit": 100, "window": "60s"}'::jsonb, true, now() - interval '30 days'),
('71000000-0000-0000-0000-000000000002', 'brute_force', 'high', null, '12345678-1234-1234-1234-123456789012', '10.0.0.55', '/api/auth/login', 'POST', '{"attempts": 12, "username": "admin@cta.com", "blocked": true}'::jsonb, true, now() - interval '25 days'),
('71000000-0000-0000-0000-000000000003', 'sql_injection', 'critical', null, '12345678-1234-1234-1234-123456789012', '203.0.113.50', '/api/vehicles?id=1 OR 1=1', 'GET', '{"payload": "1 OR 1=1", "blocked": true, "waf_rule": "SQL_INJECTION_DETECTED"}'::jsonb, true, now() - interval '20 days'),
('71000000-0000-0000-0000-000000000004', 'csrf', 'medium', '10000000-0000-0000-0000-000000000003', '12345678-1234-1234-1234-123456789012', '192.168.1.45', '/api/policies', 'POST', '{"reason": "Missing CSRF token", "origin": "unknown"}'::jsonb, true, now() - interval '18 days'),
('71000000-0000-0000-0000-000000000005', 'rate_limit', 'low', '00000000-0000-0000-0000-000000000002', '12345678-1234-1234-1234-123456789012', '192.168.1.10', '/api/drivers', 'GET', '{"requests_in_window": 120, "limit": 100, "window": "60s"}'::jsonb, true, now() - interval '15 days'),
('71000000-0000-0000-0000-000000000006', 'xss_attempt', 'high', null, '12345678-1234-1234-1234-123456789012', '198.51.100.25', '/api/work-orders', 'POST', '{"payload": "<script>alert(1)</script>", "field": "description", "sanitized": true}'::jsonb, true, now() - interval '12 days'),
('71000000-0000-0000-0000-000000000007', 'idor', 'high', '10000000-0000-0000-0000-000000000008', '12345678-1234-1234-1234-123456789012', '192.168.1.67', '/api/users/00000000-0000-0000-0000-000000000001', 'GET', '{"attempted_resource": "admin_user_profile", "user_role": "driver", "blocked": true}'::jsonb, true, now() - interval '10 days'),
('71000000-0000-0000-0000-000000000008', 'rate_limit', 'low', '10000000-0000-0000-0000-000000000012', '12345678-1234-1234-1234-123456789012', '192.168.1.88', '/api/fuel-transactions', 'GET', '{"requests_in_window": 105, "limit": 100, "window": "60s"}'::jsonb, false, now() - interval '5 days'),
('71000000-0000-0000-0000-000000000009', 'brute_force', 'high', null, '12345678-1234-1234-1234-123456789012', '10.0.0.99', '/api/auth/login', 'POST', '{"attempts": 8, "username": "fleet@cta.com", "blocked": true}'::jsonb, false, now() - interval '3 days'),
('71000000-0000-0000-0000-000000000010', 'csrf', 'medium', '10000000-0000-0000-0000-000000000015', '12345678-1234-1234-1234-123456789012', '192.168.1.33', '/api/vehicles/40000000-0000-0000-0000-000000000005', 'PUT', '{"reason": "Token mismatch", "expected_origin": "localhost:5174"}'::jsonb, false, now() - interval '1 day')
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- PHASE 5: ADDITIONAL INCIDENTS
-- ============================================================================

INSERT INTO incidents (id, tenant_id, number, vehicle_id, driver_id, type, severity, status, incident_date, location, latitude, longitude, description, injuries_reported, fatalities_reported, estimated_cost)
VALUES
('71400000-0000-0000-0000-000000000001', '12345678-1234-1234-1234-123456789012', 'INC-2026-006', '40000000-0000-0000-0000-000000000012', '30000000-0000-0000-0000-000000000012', 'hos_violation', 'moderate', 'in_progress', now() - interval '6 days', 'I-10 Eastbound Mile Marker 182', 30.4420, -84.1500, 'Driver exceeded 11-hour driving limit by 45 minutes. ELD flagged violation. Driver stated traffic delay caused inability to reach rest stop. Schedule reviewed.', false, false, 0),
('71400000-0000-0000-0000-000000000002', '12345678-1234-1234-1234-123456789012', 'INC-2026-007', '40000000-0000-0000-0000-000000000008', '30000000-0000-0000-0000-000000000008', 'weather_related', 'minor', 'completed', now() - interval '15 days', 'Mahan Dr at Blair Stone Rd', 30.4300, -84.2650, 'Vehicle hydroplaned during heavy rain. Minor slide into curb. No other vehicles involved. Tire and rim damage. Driver followed safe driving protocols.', false, false, 850.00),
('71400000-0000-0000-0000-000000000003', '12345678-1234-1234-1234-123456789012', 'INC-2026-008', null, '30000000-0000-0000-0000-000000000014', 'distracted_driving', 'moderate', 'in_progress', now() - interval '4 days', 'Monroe St at Park Ave', 30.4480, -84.2810, 'Dashcam detected driver using handheld phone while driving. AI flagged event with 95% confidence. Driver counseled. Written warning issued per distracted driving policy.', false, false, 0),
('71400000-0000-0000-0000-000000000004', '12345678-1234-1234-1234-123456789012', 'INC-2026-009', '40000000-0000-0000-0000-000000000035', null, 'equipment_failure', 'major', 'in_progress', now() - interval '2 days', 'CTA South Maintenance Yard', 30.4100, -84.2900, 'Hydraulic lift failure in maintenance bay #3 during vehicle service. Lift descended unexpectedly approximately 8 inches. Technician was clear of vehicle. OSHA recordable. Lift locked out, vendor inspection scheduled.', false, false, 12000.00),
('71400000-0000-0000-0000-000000000005', '12345678-1234-1234-1234-123456789012', 'INC-2026-010', '40000000-0000-0000-0000-000000000005', '30000000-0000-0000-0000-000000000005', 'theft', 'moderate', 'pending', now() - interval '1 day', 'Walmart Supercenter, N Monroe St', 30.4700, -84.2800, 'Catalytic converter stolen from fleet van while parked overnight at delivery location. Police report filed #TPD-2026-08821. Insurance claim initiated.', false, false, 3200.00)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- PHASE 6: ADDITIONAL ANNOUNCEMENTS
-- ============================================================================

INSERT INTO announcements (id, tenant_id, title, message, type, priority, target_roles, published_at, expires_at, created_by_id, is_active)
VALUES
(gen_random_uuid(), '12345678-1234-1234-1234-123456789012', 'New Safety Policy: Distracted Driving Prevention',
 'Effective February 1, 2026, our updated Distracted Driving Prevention Policy is now in effect. All drivers must complete the mandatory awareness training by February 28. Zero tolerance for handheld device use while driving. See policy SP-002 for complete details.',
 'alert', 'high', '["SuperAdmin","Admin","Manager","User"]'::jsonb, now() - interval '2 days', now() + interval '30 days', '00000000-0000-0000-0000-000000000001', true),
(gen_random_uuid(), '12345678-1234-1234-1234-123456789012', 'Q1 2026 Compliance Audit Scheduled',
 'The quarterly compliance audit is scheduled for March 15-17, 2026. All department managers must ensure DQ files, maintenance records, and training documentation are current. Contact the compliance team with questions.',
 'reminder', 'high', '["Admin","Manager"]'::jsonb, now() - interval '5 days', now() + interval '25 days', '00000000-0000-0000-0000-000000000002', true),
(gen_random_uuid(), '12345678-1234-1234-1234-123456789012', 'Defensive Driving Course Registration Open',
 'Registration is now open for the next defensive driving course session on March 1-2, 2026. This 8-hour course is required for all CDL drivers and must be completed every 3 years. Register through the training portal or contact your supervisor.',
 'info', 'medium', '["User","Manager"]'::jsonb, now() - interval '3 days', now() + interval '15 days', '00000000-0000-0000-0000-000000000001', true),
(gen_random_uuid(), '12345678-1234-1234-1234-123456789012', 'Fleet Safety Alert: Catalytic Converter Theft',
 'We have experienced a catalytic converter theft from a fleet vehicle. All drivers: park in well-lit areas when possible, report suspicious activity immediately, and use designated secure parking when available overnight. See incident INC-2026-010.',
 'warning', 'high', '["SuperAdmin","Admin","Manager","User"]'::jsonb, now() - interval '1 day', now() + interval '14 days', '00000000-0000-0000-0000-000000000001', true),
(gen_random_uuid(), '12345678-1234-1234-1234-123456789012', 'PM Compliance Rate Achievement',
 'Congratulations to the maintenance team! We achieved a 97% preventive maintenance compliance rate in January 2026, exceeding our 95% target. Special recognition to lead technician James Brown and the scheduling team for their outstanding work.',
 'success', 'low', '[]'::jsonb, now() - interval '7 days', now() + interval '30 days', '00000000-0000-0000-0000-000000000002', true);

COMMIT;
