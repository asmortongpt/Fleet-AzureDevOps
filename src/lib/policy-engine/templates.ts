/**
 * Policy, SOP, and Training Templates Library
 * Comprehensive best-practice templates for fleet management governance
 *
 * This library provides industry-standard templates that comply with:
 * - DOT/FMCSA regulations
 * - OSHA safety requirements
 * - EPA environmental standards
 * - IFTA fuel tax compliance
 * - Best practices from NAFA, APWA, and other fleet management associations
 */

import type { PolicyType, PolicyMode } from './types'

// ============================================================================
// POLICY TEMPLATES
// ============================================================================

export interface PolicyTemplate {
  name: string
  description: string
  type: PolicyType
  category: string
  mode: PolicyMode
  conditions: any[]
  actions: any[]
  scope: any
  tags: string[]
  relatedPolicies: string[]
  bestPractices: string[]
  regulatoryReferences: string[]
  kpis: string[]
}

/**
 * SAFETY POLICY TEMPLATES
 */
export const safetyPolicyTemplates: PolicyTemplate[] = [
  {
    name: "Preventable Accident Response and Investigation",
    description: "Mandatory procedures for accident reporting, scene safety, investigation, and preventability determination",
    type: "safety",
    category: "Accident Management",
    mode: "human-in-loop",
    conditions: [
      { field: "incident.type", operator: "equals", value: "accident" },
      { field: "incident.severity", operator: "in", value: ["minor", "moderate", "severe", "critical"] }
    ],
    actions: [
      { type: "notify", target: "safety-officer", priority: "high" },
      { type: "create-investigation", assignTo: "safety-committee" },
      { type: "require-statement", from: "driver" },
      { type: "preserve-evidence", items: ["photos", "witness-statements", "police-report"] }
    ],
    scope: {
      vehicles: "all",
      drivers: "all",
      locations: "all"
    },
    tags: ["safety", "accidents", "DOT", "liability", "critical"],
    relatedPolicies: ["driver-conduct", "vehicle-operations", "insurance-claims"],
    bestPractices: [
      "All accidents must be reported within 1 hour regardless of severity",
      "Scene safety is first priority - secure area and ensure no further injuries",
      "Never admit fault at the scene - provide only factual information",
      "Document everything: photos (360° of damage), measurements, witness info",
      "Conduct preventability review within 48 hours using committee approach",
      "Track trends monthly to identify systemic issues (locations, times, vehicle types)",
      "Provide remedial training for preventable accidents",
      "Maintain confidential investigation files for minimum 7 years"
    ],
    regulatoryReferences: [
      "49 CFR 390.15 - Accident reporting requirements",
      "OSHA 1904 - Recording and reporting occupational injuries",
      "State traffic laws requiring accident reporting"
    ],
    kpis: [
      "Preventable accident rate per million miles",
      "Average days to close investigation",
      "Repeat offender rate",
      "Accident cost trend"
    ]
  },
  {
    name: "Driver Qualification and Authorization",
    description: "Comprehensive driver authorization standards including licensing, training, medical fitness, and ongoing monitoring",
    type: "safety",
    category: "Driver Management",
    mode: "autonomous",
    conditions: [
      { field: "driver.licenseStatus", operator: "not_equals", value: "valid" },
      { field: "driver.licenseExpiry", operator: "less_than_days", value: 30 },
      { field: "driver.medicalCard.expiry", operator: "less_than_days", value: 30 },
      { field: "driver.violations", operator: "count_greater_than", value: 3, period: "12_months" }
    ],
    actions: [
      { type: "suspend-driving-privileges", immediate: true },
      { type: "notify", target: ["driver", "supervisor", "HR", "fleet-manager"] },
      { type: "create-task", title: "Resolve driver qualification issue", assignTo: "HR" },
      { type: "block-vehicle-assignment", until: "qualified" }
    ],
    scope: {
      drivers: "all",
      includesContractors: true,
      includesVolunteers: true
    },
    tags: ["safety", "compliance", "DOT", "CDL", "licensing", "critical"],
    relatedPolicies: ["CDL-compliance", "training-requirements", "medical-fitness"],
    bestPractices: [
      "Verify license before first day of employment and annually thereafter",
      "Run MVR (Motor Vehicle Record) check at hire and annually",
      "For CDL drivers: verify medical card, conduct drug/alcohol testing per DOT",
      "Maintain Driver Qualification Files (DQF) with all required documents",
      "Disqualify drivers with: DUI/DWI, suspended license, 3+ moving violations in 12 months",
      "Require defensive driver training within 30 days of hire",
      "Monitor license status in real-time using third-party verification service",
      "Document all training, violations, and corrective actions",
      "Implement progressive discipline for violations",
      "Conduct fitness-for-duty assessments after serious accidents or incidents"
    ],
    regulatoryReferences: [
      "49 CFR 391 - Qualifications of Drivers",
      "49 CFR 382 - Controlled Substances and Alcohol Use Testing",
      "49 CFR 40 - Procedures for DOT Drug and Alcohol Testing",
      "State CDL requirements"
    ],
    kpis: [
      "Percentage of drivers with valid licenses",
      "MVR violation rate",
      "Training completion rate",
      "Time to resolve qualification issues"
    ]
  },
  {
    name: "Distracted Driving Prevention",
    description: "Prohibition of distracted driving including mobile devices, eating, and other distractions",
    type: "driver-behavior",
    category: "Driver Safety",
    mode: "autonomous",
    conditions: [
      { field: "telematics.phoneUseWhileDriving", operator: "equals", value: true },
      { field: "telematics.handsFreeViolation", operator: "equals", value: true },
      { field: "incident.cause", operator: "contains", value: "distraction" }
    ],
    actions: [
      { type: "alert", target: "driver", severity: "immediate" },
      { type: "notify", target: "supervisor", priority: "high" },
      { type: "log-violation", category: "distracted-driving" },
      { type: "require-coaching", within: "48_hours" },
      { type: "escalate-if-repeat", threshold: 2, action: "suspend" }
    ],
    scope: {
      vehicles: "all",
      drivers: "all",
      enforcement: "zero-tolerance"
    },
    tags: ["safety", "distracted-driving", "mobile-devices", "zero-tolerance"],
    relatedPolicies: ["driver-conduct", "disciplinary-action", "telematics-use"],
    bestPractices: [
      "Absolute prohibition on handheld device use while driving",
      "Hands-free allowed only where legal and with proper equipment",
      "Pull over safely to use phone - no exceptions",
      "Use telematics/cameras to detect and enforce",
      "First violation: mandatory coaching session",
      "Second violation: 1-week suspension",
      "Third violation: termination",
      "Provide driver education on consequences: 23x more likely to crash while texting",
      "Post visible reminders in vehicles",
      "Include distracted driving in new hire orientation",
      "Review company cell phone policy annually"
    ],
    regulatoryReferences: [
      "49 CFR 392.80 - Prohibition on texting (CMV)",
      "49 CFR 392.82 - Using a hand-held mobile telephone (CMV)",
      "State hands-free laws",
      "NHTSA distracted driving guidelines"
    ],
    kpis: [
      "Mobile device use violations per month",
      "Distracted driving incidents",
      "Coaching completion rate",
      "Repeat violation rate"
    ]
  }
]

/**
 * MAINTENANCE POLICY TEMPLATES
 */
export const maintenancePolicyTemplates: PolicyTemplate[] = [
  {
    name: "Preventive Maintenance Compliance",
    description: "Mandatory preventive maintenance program with defined intervals and enforcement",
    type: "maintenance",
    category: "PM Program",
    mode: "autonomous",
    conditions: [
      { field: "vehicle.milesSincePM", operator: "greater_than", value: "pm_interval" },
      { field: "vehicle.daysSincePM", operator: "greater_than", value: "pm_interval_days" },
      { field: "vehicle.pmStatus", operator: "equals", value: "overdue" }
    ],
    actions: [
      { type: "schedule-pm", automatically: true },
      { type: "notify", target: ["fleet-manager", "department-head"], days_before: 14 },
      { type: "escalate", when: "overdue_7_days", to: "senior-management" },
      { type: "ground-vehicle", when: "overdue_30_days", require_approval: "fleet-director" }
    ],
    scope: {
      vehicles: "all",
      equipment: "all",
      enforcement: "mandatory"
    },
    tags: ["maintenance", "PM", "compliance", "reliability", "safety"],
    relatedPolicies: ["vehicle-grounding", "maintenance-scheduling", "downtime-management"],
    bestPractices: [
      "Define PM intervals by vehicle class (e.g., light-duty: 5,000 miles, heavy-duty: 10,000 miles)",
      "Use whichever comes first: mileage, hours, or time-based intervals",
      "Inspect all safety-critical components at each PM",
      "Document all work performed and parts replaced",
      "No exceptions or deferrals without Fleet Director approval",
      "Track PM compliance rate by department (target: 98%+)",
      "Automated notifications at 500 miles/30 days before due",
      "Ground vehicles that are 30+ days overdue",
      "Include PM in annual budget and track costs",
      "Use PM opportunities to identify emerging issues"
    ],
    regulatoryReferences: [
      "49 CFR 396 - Inspection, Repair, and Maintenance (for CMVs)",
      "Manufacturer maintenance schedules",
      "OSHA 1910 - Machine guarding and maintenance"
    ],
    kpis: [
      "PM compliance rate (%)",
      "Average days to PM completion",
      "Number of overdue vehicles",
      "Cost per PM by vehicle class",
      "Breakdown rate correlation to PM compliance"
    ]
  },
  {
    name: "Vehicle Out-of-Service and Grounding",
    description: "Procedures for removing unsafe or non-compliant vehicles from service",
    type: "safety",
    category: "Vehicle Safety",
    mode: "human-in-loop",
    conditions: [
      { field: "inspection.criticalDefect", operator: "exists", value: true },
      { field: "vehicle.pmOverdue", operator: "greater_than_days", value: 30 },
      { field: "vehicle.safetyInspectionExpired", operator: "equals", value: true },
      { field: "damage.severity", operator: "in", value: ["moderate", "severe"] }
    ],
    actions: [
      { type: "ground-vehicle", immediate: true },
      { type: "remove-keys", location: "secure-storage" },
      { type: "update-status", value: "out-of-service", visible: "all" },
      { type: "notify", target: ["assigned-driver", "department", "fleet-manager"] },
      { type: "create-work-order", priority: "urgent" },
      { type: "arrange-replacement", if_critical: true }
    ],
    scope: {
      vehicles: "all",
      authority: ["mechanic", "supervisor", "fleet-manager", "safety-officer"]
    },
    tags: ["safety", "compliance", "vehicle-grounding", "critical"],
    relatedPolicies: ["daily-inspection", "PM-compliance", "replacement-vehicle"],
    bestPractices: [
      "Any safety-critical defect requires immediate grounding",
      "Safety-critical: brakes, steering, lights, tires, suspension, wipers, horn",
      "Place visible OUT OF SERVICE tag on vehicle",
      "Remove keys and disable fuel card",
      "Document reason for grounding in work order",
      "Provide replacement vehicle within 4 hours for mission-critical",
      "Prioritize repair based on operational impact",
      "Require manager approval to un-ground",
      "Conduct post-repair test drive before return to service",
      "Track downtime and communicate status daily"
    ],
    regulatoryReferences: [
      "49 CFR 396.9 - Inspection of motor vehicles in operation",
      "49 CFR 396.11 - Driver vehicle inspection report (DVIR)",
      "OSHA requirements for safe equipment"
    ],
    kpis: [
      "Number of vehicles grounded per month",
      "Average downtime while grounded",
      "Safety defects by type",
      "Critical defect repeat rate"
    ]
  }
]

/**
 * COMPLIANCE POLICY TEMPLATES
 */
export const compliancePolicyTemplates: PolicyTemplate[] = [
  {
    name: "DOT/FMCSA Compliance Program",
    description: "Comprehensive DOT compliance for Commercial Motor Vehicles including hours of service, inspections, and recordkeeping",
    type: "osha",
    category: "Regulatory Compliance",
    mode: "autonomous",
    conditions: [
      { field: "vehicle.gvwr", operator: "greater_than", value: 10001 },
      { field: "driver.hos.violation", operator: "exists", value: true },
      { field: "vehicle.annualInspection.overdue", operator: "equals", value: true },
      { field: "driver.medicalCard.expiry", operator: "less_than_days", value: 30 }
    ],
    actions: [
      { type: "block-dispatch", reason: "DOT-compliance-violation" },
      { type: "notify", target: ["compliance-officer", "fleet-manager", "legal"] },
      { type: "create-corrective-action", deadline: "immediate" },
      { type: "document-violation", system: "DOT-compliance-db" },
      { type: "schedule-audit", if_pattern: true }
    ],
    scope: {
      vehicles: "CMV_only",
      drivers: "CDL_required",
      enforcement: "federal"
    },
    tags: ["DOT", "FMCSA", "compliance", "CMV", "federal", "critical"],
    relatedPolicies: ["CDL-program", "HOS-compliance", "annual-inspections", "driver-qualification"],
    bestPractices: [
      "Maintain DOT numbers and operating authority current",
      "Conduct annual inspections on all CMVs (49 CFR 396.17)",
      "Implement ELD program for HOS compliance",
      "Maintain Driver Qualification Files with all required documents",
      "Conduct pre-employment and random drug/alcohol testing",
      "Maintain medical examiner certificates for all CDL drivers",
      "Perform post-accident testing per 49 CFR 382.303",
      "Train drivers on DOT regulations annually",
      "Conduct internal audits quarterly",
      "Respond to DOT investigations within required timeframes",
      "Maintain records per retention schedule (typically 3-7 years)",
      "Designate qualified Safety Officer",
      "Monitor CSA scores and address adverse trends"
    ],
    regulatoryReferences: [
      "49 CFR 40 - Drug and Alcohol Testing Procedures",
      "49 CFR 382 - Controlled Substances and Alcohol Testing",
      "49 CFR 383 - Commercial Driver's License Standards",
      "49 CFR 391 - Qualifications of Drivers",
      "49 CFR 395 - Hours of Service",
      "49 CFR 396 - Inspection, Repair, and Maintenance",
      "49 CFR 397 - Transportation of Hazardous Materials"
    ],
    kpis: [
      "CSA BASIC scores (all categories)",
      "DOT inspection pass rate",
      "Out-of-service rate",
      "HOS violation rate",
      "Drug/alcohol test positive rate",
      "Days to close violations"
    ]
  },
  {
    name: "Environmental and Hazardous Waste Management",
    description: "EPA/DEP compliance for hazardous waste, spill prevention, and environmental protection",
    type: "environmental",
    category: "Environmental Compliance",
    mode: "human-in-loop",
    conditions: [
      { field: "waste.type", operator: "in", value: ["oil", "antifreeze", "batteries", "tires", "solvents", "refrigerant"] },
      { field: "spill.detected", operator: "equals", value: true },
      { field: "inspection.environmental", operator: "overdue", value: true }
    ],
    actions: [
      { type: "activate-spill-response", if: "spill_detected" },
      { type: "notify", target: ["environmental-officer", "safety", "management"] },
      { type: "document-incident", forms: ["spill-report", "waste-manifest"] },
      { type: "contact-disposal-vendor", for: "hazardous_waste" },
      { type: "update-tracking", system: "waste-management-db" }
    ],
    scope: {
      facilities: "all",
      vehicles: "all",
      activities: ["maintenance", "fueling", "washing"]
    },
    tags: ["EPA", "environmental", "hazardous-waste", "spills", "compliance"],
    relatedPolicies: ["spill-response", "waste-disposal", "facility-operations"],
    bestPractices: [
      "Designate Environmental Compliance Officer",
      "Maintain Spill Prevention Control and Countermeasures (SPCC) plan",
      "Store all hazardous materials in labeled, approved containers",
      "Use certified disposal vendors for all hazardous waste",
      "Maintain waste manifests for 3+ years",
      "Train all shop personnel on hazmat handling annually",
      "Conduct monthly inspections of storage areas",
      "Maintain spill kits at all fuel locations and shop bays",
      "Report reportable quantities spills to EPA/state within 24 hours",
      "Track waste generation by type and volume monthly",
      "Implement waste reduction initiatives",
      "Ensure stormwater compliance at wash bays and fueling areas",
      "Properly manage refrigerant per EPA Section 608/609"
    ],
    regulatoryReferences: [
      "40 CFR 112 - Oil Pollution Prevention (SPCC)",
      "40 CFR 262 - Standards for Generators of Hazardous Waste",
      "40 CFR 82 - Protection of Stratospheric Ozone (refrigerant)",
      "Clean Water Act - NPDES stormwater permits",
      "State DEP regulations",
      "Local environmental ordinances"
    ],
    kpis: [
      "Waste disposal cost per month",
      "Spill incidents per year",
      "Environmental inspection pass rate",
      "Waste reduction trend",
      "Training compliance rate"
    ]
  }
]

/**
 * OPERATIONAL POLICY TEMPLATES
 */
export const operationalPolicyTemplates: PolicyTemplate[] = [
  {
    name: "Fuel Management and Fraud Prevention",
    description: "Controls for fuel authorization, card usage, anomaly detection, and theft prevention",
    type: "payments",
    category: "Fuel Management",
    mode: "autonomous",
    conditions: [
      { field: "fuel.transaction.gallons", operator: "greater_than", value: "tank_capacity_plus_10_percent" },
      { field: "fuel.location", operator: "distance_greater_than", value: "vehicle_location_50_miles" },
      { field: "fuel.time", operator: "outside_hours", value: "normal_operations" },
      { field: "fuel.frequency", operator: "greater_than", value: "2_per_day" },
      { field: "fuel.product", operator: "not_matches", value: "vehicle_fuel_type" }
    ],
    actions: [
      { type: "flag-transaction", reason: "anomaly" },
      { type: "suspend-card", if: "high_confidence_fraud" },
      { type: "notify", target: ["fleet-manager", "supervisor", "finance"] },
      { type: "require-receipt", within: "48_hours" },
      { type: "investigate", assignTo: "fleet-admin" },
      { type: "audit", if_pattern: "multiple_anomalies" }
    ],
    scope: {
      vehicles: "all",
      drivers: "all",
      fuelCards: "all"
    },
    tags: ["fuel", "fraud-prevention", "financial-controls", "audit"],
    relatedPolicies: ["fuel-card-policy", "unauthorized-use", "disciplinary-action"],
    bestPractices: [
      "Issue fuel cards with vehicle-specific PINs",
      "Require odometer entry at every transaction",
      "Set limits: gallons per transaction, transactions per day, dollar limits",
      "Review all fuel transactions within 48 hours",
      "Flag anomalies: over-fueling, wrong fuel type, off-hours, distant locations",
      "Require receipts for all transactions",
      "Reconcile fuel transactions with telematics data monthly",
      "Suspend cards immediately when suspected fraud",
      "Conduct random audits of high-volume users",
      "Terminate fuel privileges for violations",
      "Track fuel economy by vehicle and investigate deviations",
      "Use city fueling sites when available (lower cost + better control)",
      "Disable cards when vehicles are out of service or employees separate",
      "Report suspected fraud to law enforcement if criminal"
    ],
    regulatoryReferences: [
      "IRS Publication 463 - Fuel tax deductions",
      "Internal control standards (COSO framework)",
      "State fuel tax regulations"
    ],
    kpis: [
      "Fuel cost per mile/gallon",
      "Anomaly rate",
      "Fraud incidents per year",
      "Audit exception rate",
      "Fuel economy by vehicle class"
    ]
  },
  {
    name: "Vehicle Assignment, Utilization, and Right-Sizing",
    description: "Standards for vehicle assignment, pool usage, take-home policies, and utilization monitoring",
    type: "vehicle-use",
    category: "Fleet Utilization",
    mode: "human-in-loop",
    conditions: [
      { field: "vehicle.annualMiles", operator: "less_than", value: "minimum_by_class" },
      { field: "vehicle.daysUnused", operator: "greater_than", value: 30 },
      { field: "vehicle.assignmentType", operator: "equals", value: "personal" },
      { field: "takeHome.justification", operator: "missing", value: true }
    ],
    actions: [
      { type: "flag-underutilization", notify: "fleet-manager" },
      { type: "review-assignment", assignTo: "department-head" },
      { type: "recommend-action", options: ["pool", "reassign", "surplus"] },
      { type: "require-justification", for: "take-home" },
      { type: "calculate-fringe-benefit", if: "personal_use" }
    ],
    scope: {
      vehicles: "all",
      reviewFrequency: "quarterly"
    },
    tags: ["utilization", "right-sizing", "cost-control", "assignment"],
    relatedPolicies: ["take-home-policy", "pool-vehicles", "replacement-planning"],
    bestPractices: [
      "Define minimum utilization by class (e.g., sedans: 10,000 miles/year, trucks: 8,000 miles/year)",
      "Review utilization quarterly and take action on underutilized assets",
      "Require justification for dedicated assignments (vs. pool)",
      "Pool vehicles when possible to maximize utilization",
      "Limit take-home vehicles to positions requiring 24/7 response",
      "Document and track personal use for IRS fringe benefit reporting",
      "Right-size fleet annually: eliminate, reassign, or pool underutilized vehicles",
      "Track vehicle idle time and take corrective action",
      "Provide alternatives: rental vehicles for occasional use, mileage reimbursement",
      "Set department allocation targets and charge back costs",
      "Conduct annual vehicle assignment review with department heads",
      "Include utilization data in replacement decisions"
    ],
    regulatoryReferences: [
      "IRS Publication 15-B - Employer's Tax Guide to Fringe Benefits",
      "GASB standards for fleet asset management",
      "Local government fleet management best practices (NAFA, APWA)"
    ],
    kpis: [
      "Average annual miles/hours by vehicle class",
      "Utilization rate (% meeting minimums)",
      "Pool vehicle utilization rate",
      "Cost per mile by assignment type",
      "Fleet size trend"
    ]
  }
]

/**
 * Get all policy templates organized by category
 */
export function getAllPolicyTemplates(): Record<string, PolicyTemplate[]> {
  return {
    safety: safetyPolicyTemplates,
    maintenance: maintenancePolicyTemplates,
    compliance: compliancePolicyTemplates,
    operational: operationalPolicyTemplates
  }
}

/**
 * Get specific policy template by name
 */
export function getPolicyTemplate(name: string): PolicyTemplate | undefined {
  const allTemplates = [
    ...safetyPolicyTemplates,
    ...maintenancePolicyTemplates,
    ...compliancePolicyTemplates,
    ...operationalPolicyTemplates
  ]
  return allTemplates.find(t => t.name === name)
}

/**
 * Get templates by type
 */
export function getTemplatesByType(type: PolicyType): PolicyTemplate[] {
  const allTemplates = [
    ...safetyPolicyTemplates,
    ...maintenancePolicyTemplates,
    ...compliancePolicyTemplates,
    ...operationalPolicyTemplates
  ]
  return allTemplates.filter(t => t.type === type)
}

// ============================================================================
// SOP TEMPLATES
// ============================================================================

export interface SOPTemplate {
  sopNumber: string
  title: string
  category: string
  purpose: string
  scope: string
  procedure: string
  safetyControls: string
  requiredForms: string[]
  relatedPolicies: string[]
  kpis: string[]
  regulatoryReferences: string[]
}

export const sopTemplates: SOPTemplate[] = [
  {
    sopNumber: "SOP-001",
    title: "Daily Vehicle Inspection (Pre-Trip/Post-Trip)",
    category: "safety",
    purpose: "Ensure all vehicles are inspected daily before operation to identify safety defects and maintain regulatory compliance",
    scope: "All drivers operating city vehicles, with enhanced requirements for Commercial Motor Vehicles (CMVs)",
    procedure: `
1. PREPARATION
   - Obtain vehicle keys and inspection checklist
   - Review previous inspection reports for open items
   - Ensure adequate lighting if conducting inspection in low-light conditions

2. EXTERIOR INSPECTION (Walk-around)
   - Tires: Check pressure, tread depth (min 4/32"), damage, wear pattern
   - Wheels/Lug nuts: Check for cracks, missing/loose lug nuts
   - Lights: Test headlights, tail lights, brake lights, turn signals, emergency lights
   - Mirrors: Check adjustment and condition
   - Windows/Windshield: Check for cracks, chips, obstructions
   - Wipers: Test operation and blade condition
   - Body: Look for new damage, leaks, loose panels
   - License plate: Verify visible and current
   - Fuel cap: Ensure secure
   - Exhaust: Check for leaks, excessive smoke
   - Fluid leaks: Look under vehicle for oil, coolant, fuel leaks

3. INTERIOR INSPECTION
   - Seat belts: Check all positions for function and damage
   - Horn: Test operation
   - Instruments: Verify all gauges functional, no warning lights
   - Brakes: Test pedal feel (should be firm, not spongy)
   - Steering: Check for excessive play or unusual noise
   - Emergency equipment: Verify fire extinguisher, first aid kit, triangle reflectors
   - Cleanliness: Remove debris, ensure professional appearance

4. FUNCTIONAL TESTS
   - Start engine and verify normal operation
   - Test brake lights (use partner or back up to reflective surface)
   - Test parking brake on slight incline
   - Test turn signals and hazards
   - Test windshield wipers and washer fluid

5. CMV-SPECIFIC ADDITIONAL REQUIREMENTS (if applicable)
   - Air brake test (if equipped): Low pressure warning, spring brake activation
   - Coupling devices: Check fifth wheel, pintle hooks, safety chains
   - Cargo securement: Verify load properly secured
   - Placards: Verify hazmat placards if required

6. DOCUMENTATION
   - Complete inspection form (paper or electronic)
   - Note defects clearly with location and description
   - For safety-critical defects: immediately notify supervisor and ground vehicle
   - For non-critical defects: submit work order
   - Sign and date inspection report
   - For CMVs: File DVIR per DOT requirements

7. POST-TRIP INSPECTION
   - Repeat key safety items
   - Note new damage or issues
   - Report fuel level
   - Ensure vehicle is secured: locked, parked properly, keys returned
    `,
    safetyControls: "Do not operate vehicle with safety-critical defects (brakes, steering, lights, tires). Ground vehicle immediately and notify supervisor.",
    requiredForms: [
      "Daily Vehicle Inspection Checklist (light-duty)",
      "Driver Vehicle Inspection Report - DVIR (CMV)",
      "Defect Report / Work Order Request"
    ],
    relatedPolicies: [
      "Vehicle Safety Policy",
      "Vehicle Out-of-Service Policy",
      "DOT/FMCSA Compliance Policy",
      "Driver Responsibilities Policy"
    ],
    kpis: [
      "Inspection completion rate (target: 100%)",
      "Defects identified per 100 inspections",
      "Safety-critical defects found",
      "Time to repair identified defects"
    ],
    regulatoryReferences: [
      "49 CFR 396.11 - Driver Vehicle Inspection Report (DVIR)",
      "49 CFR 396.13 - Driver Vehicle Inspection",
      "State vehicle inspection requirements"
    ]
  },
  {
    sopNumber: "SOP-002",
    title: "Accident Response and Reporting",
    category: "safety",
    purpose: "Provide immediate response procedures for vehicle accidents to ensure safety, preserve evidence, and comply with legal/regulatory requirements",
    scope: "All drivers involved in accidents while operating city vehicles, regardless of severity or fault",
    procedure: `
1. IMMEDIATE RESPONSE (Scene Safety First)
   - Stop immediately - do not leave scene
   - Turn on hazard lights
   - If safe, move vehicles out of traffic
   - Check for injuries - call 911 if anyone injured
   - Render aid if trained (do not move injured unless immediate danger)
   - Set up warning devices if on roadway

2. SCENE MANAGEMENT
   - Do not admit fault or discuss liability
   - Be courteous and professional
   - Exchange information:
     * Names, phone numbers, addresses
     * Insurance information
     * License plate numbers
     * Driver license numbers
     * Make/model/year of all vehicles
   - If other party refuses info, note license plate and call police
   - Request police report if:
     * Any injuries
     * Significant property damage
     * Hit and run
     * Impaired driver suspected
     * Dispute about fault

3. EVIDENCE COLLECTION
   - Take photos/video:
     * All vehicles from multiple angles (360°)
     * License plates (all vehicles)
     * Damage close-ups
     * Debris pattern
     * Road conditions, traffic controls, sight obstructions
     * VIN numbers
   - Measurements: skid marks, final positions
   - Witness information:
     * Names and contact info
     * Written or recorded statements if willing
   - Weather and lighting conditions
   - Time of accident

4. IMMEDIATE NOTIFICATIONS (Within 1 Hour)
   - Call Fleet Emergency Line: [NUMBER]
   - Notify your supervisor
   - Notify Risk Management if injuries or major damage
   - Information to provide:
     * Your name and contact
     * Vehicle number
     * Location (exact address or GPS coordinates)
     * Date and time
     * Brief description of what happened
     * Injuries (if any)
     * Police report number (if applicable)
     * Other parties involved
     * Witness information

5. DOCUMENTATION (Within 24 Hours)
   - Complete Accident Report Form (Form AR-1)
   - Provide detailed narrative:
     * Where you were going and why
     * Your speed
     * Actions you took to avoid accident
     * What the other driver did
     * Point of impact
     * Final resting positions
   - Attach all photos, measurements, diagrams
   - Submit police report when available
   - Submit witness statements
   - Do NOT make written statements to other parties or insurance companies

6. POST-ACCIDENT DRUG/ALCOHOL TESTING (if required)
   - DOT-regulated drivers must submit to testing if:
     * Fatality
     * You received citation
     * Any vehicle towed
   - Proceed immediately to testing facility
   - Do not delay for any reason

7. VEHICLE HANDLING
   - If drivable and safe, return to fleet yard
   - If not drivable, arrange tow to fleet facility
   - Do not authorize outside repairs
   - Secure vehicle and remove valuables
   - Provide keys to Fleet or supervisor

8. FOLLOW-UP
   - Cooperate with investigation
   - Attend preventability review hearing
   - Complete remedial training if required
   - Do not contact other party directly
   - Refer all inquiries to Risk Management
    `,
    safetyControls: "Scene safety is first priority. Do not endanger yourself or others to collect evidence. If impaired driver suspected, do not confront - provide info to police.",
    requiredForms: [
      "Accident Report Form (AR-1)",
      "Witness Statement Form",
      "Accident Scene Diagram",
      "Post-Accident Drug/Alcohol Testing Chain of Custody (if applicable)"
    ],
    relatedPolicies: [
      "Accident Response Policy",
      "Accident Investigation Policy",
      "DOT Post-Accident Testing Policy",
      "Insurance and Claims Policy"
    ],
    kpis: [
      "Percentage of accidents reported within 1 hour",
      "Percentage with complete documentation",
      "Average time to complete investigation",
      "Preventable vs. non-preventable accident rate"
    ],
    regulatoryReferences: [
      "49 CFR 382.303 - Post-accident testing (DOT)",
      "State traffic laws - accident reporting thresholds",
      "OSHA 1904 - Recording work-related injuries"
    ]
  },
  {
    sopNumber: "SOP-003",
    title: "Preventive Maintenance Scheduling and Compliance",
    category: "maintenance",
    purpose: "Ensure all vehicles receive timely preventive maintenance to maximize reliability, safety, and compliance",
    scope: "All fleet vehicles and equipment",
    procedure: `
1. PM INTERVAL DETERMINATION
   - PM intervals by vehicle class:
     * Light-duty (sedans, SUVs, vans): 5,000 miles or 6 months
     * Light trucks (pickups, service trucks): 6,000 miles or 6 months
     * Medium/Heavy duty trucks: 10,000 miles or 6 months
     * Police vehicles: 3,000 miles or 3 months
     * Heavy equipment: 250 hours or 6 months
     * Emergency vehicles: per manufacturer
   - Use whichever comes first: mileage/hours or time
   - Consult manufacturer recommendations for specialty equipment

2. PM NOTIFICATION PROCESS
   - Automated notifications sent:
     * 500 miles / 30 days before due: Driver + Supervisor
     * At due: Driver + Supervisor + Department Head
     * 7 days overdue: Fleet Manager + Department Head (escalation)
     * 30 days overdue: Senior Management + grounding notice
   - Drivers responsible for monitoring PM due date
   - Supervisors responsible for releasing vehicles

3. SCHEDULING PM APPOINTMENT
   - Fleet Shop: Call (XXX) XXX-XXXX or email fleet@city.gov
   - Provide: Vehicle number, current mileage, requested date
   - Standard turnaround: 1 business day (drop off AM, pick up next PM)
   - Priority/rush available for emergency/critical vehicles
   - Alternative: scheduled PM routes (shop comes to you)

4. PREPARING VEHICLE FOR PM
   - Remove personal items
   - Clean interior (facilitates inspection)
   - Fuel to at least 1/4 tank
   - Note any issues on work order or tell service writer
   - Provide keys - do not leave in vehicle

5. PM INSPECTION CHECKLIST
   Technician performs comprehensive inspection including:
   - Fluid levels and condition (oil, coolant, brake, PS, washer, transmission)
   - Filters (air, fuel, cabin)
   - Belts and hoses
   - Battery condition and connections
   - Brake system (pads, rotors, lines, fluid)
   - Suspension and steering components
   - Exhaust system
   - Lights (all)
   - Tires (pressure, tread depth, wear pattern)
   - Wiper blades
   - Body and glass condition
   - Safety equipment (fire extinguisher, first aid, triangles)
   - Diagnostic codes
   - Road test

6. PM SERVICING
   Standard services performed:
   - Oil and filter change
   - Lubrication of chassis fittings
   - Tire rotation
   - Fluid top-off
   - Replace worn components per inspection
   - Reset maintenance reminder
   - Update vehicle records

7. ADDITIONAL REPAIRS
   - If defects found beyond PM scope:
     * Customer notified with estimate
     * Approval required for work >$500
     * Safety items repaired without approval
   - Extended downtime: notify customer and provide ETA

8. PM COMPLETION
   - Quality inspection by shop supervisor
   - Test drive verification
   - Documentation: completed checklist, parts invoice, labor hours
   - Update fleet management system
   - Customer notified for pickup
   - Review findings with customer at pickup

9. OVERDUE PM ENFORCEMENT
   - 30 days overdue: Vehicle grounded
   - Keys removed and secured
   - Fleet Director approval required to defer >30 days
   - Deferrals documented with justification and new deadline
   - Persistent non-compliance: escalate to City Manager

10. RECORDKEEPING
    - Maintain PM records for life of vehicle minimum
    - Include: date, mileage, technician, work performed, parts used
    - Records available for audit, warranty, resale
    `,
    safetyControls: "Do not defer safety-critical items. Vehicles with overdue PM and safety defects must be grounded immediately.",
    requiredForms: [
      "Preventive Maintenance Checklist (by vehicle class)",
      "Work Order",
      "Customer Approval Form (repairs >$500)",
      "Vehicle Grounding Notice"
    ],
    relatedPolicies: [
      "Preventive Maintenance Policy",
      "Vehicle Out-of-Service Policy",
      "Fleet Maintenance Standards",
      "DOT Inspection Requirements (CMV)"
    ],
    kpis: [
      "PM compliance rate (target: 98%+)",
      "Average days to PM completion",
      "PM cost per vehicle by class",
      "Number of vehicles overdue",
      "Breakdown rate vs. PM compliance correlation"
    ],
    regulatoryReferences: [
      "49 CFR 396.3 - Inspection and maintenance requirements (CMV)",
      "Manufacturer warranty requirements",
      "Best practices per NAFA Fleet Management Association"
    ]
  }
]

/**
 * Get SOP template by number
 */
export function getSOPTemplate(sopNumber: string): SOPTemplate | undefined {
  return sopTemplates.find(s => s.sopNumber === sopNumber)
}

/**
 * Get SOP templates by category
 */
export function getSOPsByCategory(category: string): SOPTemplate[] {
  return sopTemplates.filter(s => s.category === category)
}

export default {
  getAllPolicyTemplates,
  getPolicyTemplate,
  getTemplatesByType,
  sopTemplates,
  getSOPTemplate,
  getSOPsByCategory
}
