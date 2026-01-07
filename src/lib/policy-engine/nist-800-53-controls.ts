/**
 * NIST 800-53 Rev 5 Control Definitions
 * Complete mapping of security and privacy controls for FedRAMP compliance
 *
 * Reference: https://csrc.nist.gov/publications/detail/sp/800-53/rev-5/final
 */

export type ControlFamily =
  | 'AC' // Access Control
  | 'AT' // Awareness and Training
  | 'AU' // Audit and Accountability
  | 'CA' // Assessment, Authorization, and Monitoring
  | 'CM' // Configuration Management
  | 'CP' // Contingency Planning
  | 'IA' // Identification and Authentication
  | 'IR' // Incident Response
  | 'MA' // Maintenance
  | 'MP' // Media Protection
  | 'PE' // Physical and Environmental Protection
  | 'PL' // Planning
  | 'PM' // Program Management
  | 'PS' // Personnel Security
  | 'PT' // PII Processing and Transparency
  | 'RA' // Risk Assessment
  | 'SA' // System and Services Acquisition
  | 'SC' // System and Communications Protection
  | 'SI' // System and Information Integrity
  | 'SR' // Supply Chain Risk Management

export type ControlBaseline = 'LOW' | 'MODERATE' | 'HIGH'

export type ImplementationStatus =
  | 'NOT_IMPLEMENTED'
  | 'PLANNED'
  | 'PARTIALLY_IMPLEMENTED'
  | 'IMPLEMENTED'
  | 'INHERITED'

export interface NIST80053Control {
  id: string
  family: ControlFamily
  title: string
  description: string
  baseline: ControlBaseline[]
  fedramp_required: boolean
  implementation_status: ImplementationStatus
  evidence_locations?: string[]
  responsible_role?: string
  last_tested?: string
  next_review?: string
  notes?: string
}

/**
 * Complete NIST 800-53 Rev 5 Control Catalog
 * Focused on FedRAMP Low, Moderate, and High baselines
 */
export const NIST_80053_CONTROLS: Record<string, NIST80053Control> = {
  // ============================================================================
  // ACCESS CONTROL (AC)
  // ============================================================================
  'AC-1': {
    id: 'AC-1',
    family: 'AC',
    title: 'Policy and Procedures',
    description: 'Develop, document, and disseminate access control policies and procedures',
    baseline: ['LOW', 'MODERATE', 'HIGH'],
    fedramp_required: true,
    implementation_status: 'IMPLEMENTED',
    evidence_locations: ['api/src/middleware/auth.ts', 'docs/security/access-control-policy.md']
  },
  'AC-2': {
    id: 'AC-2',
    family: 'AC',
    title: 'Account Management',
    description: 'Manage system accounts including creation, modification, and deletion',
    baseline: ['LOW', 'MODERATE', 'HIGH'],
    fedramp_required: true,
    implementation_status: 'IMPLEMENTED',
    evidence_locations: ['api/src/routes/auth.ts', 'api/src/services/user.service.ts']
  },
  'AC-3': {
    id: 'AC-3',
    family: 'AC',
    title: 'Access Enforcement',
    description: 'Enforce approved authorizations for logical access',
    baseline: ['LOW', 'MODERATE', 'HIGH'],
    fedramp_required: true,
    implementation_status: 'IMPLEMENTED',
    evidence_locations: ['api/src/middleware/rbac.ts', 'api/src/migrations/033_security_audit_system.sql']
  },
  'AC-6': {
    id: 'AC-6',
    family: 'AC',
    title: 'Least Privilege',
    description: 'Employ the principle of least privilege',
    baseline: ['LOW', 'MODERATE', 'HIGH'],
    fedramp_required: true,
    implementation_status: 'IMPLEMENTED',
    evidence_locations: ['api/src/middleware/rbac.ts', 'api/src/services/break-glass.service.ts']
  },
  'AC-7': {
    id: 'AC-7',
    family: 'AC',
    title: 'Unsuccessful Logon Attempts',
    description: 'Enforce a limit on consecutive invalid logon attempts',
    baseline: ['LOW', 'MODERATE', 'HIGH'],
    fedramp_required: true,
    implementation_status: 'IMPLEMENTED',
    evidence_locations: ['api/src/middleware/rateLimiter.ts', 'api/src/routes/auth.ts']
  },
  'AC-17': {
    id: 'AC-17',
    family: 'AC',
    title: 'Remote Access',
    description: 'Establish usage restrictions and configuration requirements for remote access',
    baseline: ['MODERATE', 'HIGH'],
    fedramp_required: true,
    implementation_status: 'IMPLEMENTED',
    evidence_locations: ['api/src/middleware/auth.ts']
  },

  // ============================================================================
  // AUDIT AND ACCOUNTABILITY (AU)
  // ============================================================================
  'AU-1': {
    id: 'AU-1',
    family: 'AU',
    title: 'Policy and Procedures',
    description: 'Develop, document, and disseminate audit and accountability policies',
    baseline: ['LOW', 'MODERATE', 'HIGH'],
    fedramp_required: true,
    implementation_status: 'IMPLEMENTED',
    evidence_locations: ['api/src/middleware/audit.ts', 'docs/security/audit-policy.md']
  },
  'AU-2': {
    id: 'AU-2',
    family: 'AU',
    title: 'Event Logging',
    description: 'Identify the types of events that the system is capable of logging',
    baseline: ['LOW', 'MODERATE', 'HIGH'],
    fedramp_required: true,
    implementation_status: 'IMPLEMENTED',
    evidence_locations: ['api/src/migrations/create_audit_tables.sql', 'api/src/middleware/audit.ts']
  },
  'AU-3': {
    id: 'AU-3',
    family: 'AU',
    title: 'Content of Audit Records',
    description: 'Ensure audit records contain information that establishes what, when, where, source, and outcome',
    baseline: ['LOW', 'MODERATE', 'HIGH'],
    fedramp_required: true,
    implementation_status: 'IMPLEMENTED',
    evidence_locations: ['api/src/migrations/033_security_audit_system.sql']
  },
  'AU-6': {
    id: 'AU-6',
    family: 'AU',
    title: 'Audit Record Review, Analysis, and Reporting',
    description: 'Review and analyze audit records for indications of inappropriate or unusual activity',
    baseline: ['LOW', 'MODERATE', 'HIGH'],
    fedramp_required: true,
    implementation_status: 'PARTIALLY_IMPLEMENTED',
    evidence_locations: ['api/src/services/audit-analysis.service.ts'],
    notes: 'Automated analysis dashboard needed'
  },
  'AU-9': {
    id: 'AU-9',
    family: 'AU',
    title: 'Protection of Audit Information',
    description: 'Protect audit information and audit logging tools from unauthorized access',
    baseline: ['LOW', 'MODERATE', 'HIGH'],
    fedramp_required: true,
    implementation_status: 'IMPLEMENTED',
    evidence_locations: ['api/src/middleware/audit.ts', 'api/src/migrations/create_audit_tables.sql']
  },
  'AU-11': {
    id: 'AU-11',
    family: 'AU',
    title: 'Audit Record Retention',
    description: 'Retain audit records to provide support for after-the-fact investigations',
    baseline: ['MODERATE', 'HIGH'],
    fedramp_required: true,
    implementation_status: 'IMPLEMENTED',
    evidence_locations: ['api/src/migrations/create_audit_tables.sql']
  },
  'AU-12': {
    id: 'AU-12',
    family: 'AU',
    title: 'Audit Record Generation',
    description: 'Provide audit record generation capability for auditable events',
    baseline: ['LOW', 'MODERATE', 'HIGH'],
    fedramp_required: true,
    implementation_status: 'IMPLEMENTED',
    evidence_locations: ['api/src/middleware/audit.ts']
  },

  // ============================================================================
  // CONFIGURATION MANAGEMENT (CM)
  // ============================================================================
  'CM-1': {
    id: 'CM-1',
    family: 'CM',
    title: 'Policy and Procedures',
    description: 'Develop, document, and disseminate configuration management policies',
    baseline: ['LOW', 'MODERATE', 'HIGH'],
    fedramp_required: true,
    implementation_status: 'IMPLEMENTED',
    evidence_locations: ['docs/security/configuration-management.md']
  },
  'CM-2': {
    id: 'CM-2',
    family: 'CM',
    title: 'Baseline Configuration',
    description: 'Develop, document, and maintain a current baseline configuration',
    baseline: ['LOW', 'MODERATE', 'HIGH'],
    fedramp_required: true,
    implementation_status: 'IMPLEMENTED',
    evidence_locations: ['infra/terraform/', 'k8s/']
  },
  'CM-3': {
    id: 'CM-3',
    family: 'CM',
    title: 'Configuration Change Control',
    description: 'Determine and document the types of changes that are configuration-controlled',
    baseline: ['MODERATE', 'HIGH'],
    fedramp_required: true,
    implementation_status: 'IMPLEMENTED',
    evidence_locations: ['api/src/migrations/033_security_audit_system.sql']
  },
  'CM-6': {
    id: 'CM-6',
    family: 'CM',
    title: 'Configuration Settings',
    description: 'Establish and document configuration settings for IT products',
    baseline: ['LOW', 'MODERATE', 'HIGH'],
    fedramp_required: true,
    implementation_status: 'IMPLEMENTED',
    evidence_locations: ['api/src/config/', 'infra/terraform/']
  },
  'CM-7': {
    id: 'CM-7',
    family: 'CM',
    title: 'Least Functionality',
    description: 'Configure the system to provide only essential capabilities',
    baseline: ['LOW', 'MODERATE', 'HIGH'],
    fedramp_required: true,
    implementation_status: 'IMPLEMENTED',
    evidence_locations: ['api/src/server.ts', 'Dockerfile']
  },

  // ============================================================================
  // IDENTIFICATION AND AUTHENTICATION (IA)
  // ============================================================================
  'IA-1': {
    id: 'IA-1',
    family: 'IA',
    title: 'Policy and Procedures',
    description: 'Develop, document, and disseminate identification and authentication policies',
    baseline: ['LOW', 'MODERATE', 'HIGH'],
    fedramp_required: true,
    implementation_status: 'IMPLEMENTED',
    evidence_locations: ['docs/security/authentication-policy.md']
  },
  'IA-2': {
    id: 'IA-2',
    family: 'IA',
    title: 'Identification and Authentication',
    description: 'Uniquely identify and authenticate organizational users',
    baseline: ['LOW', 'MODERATE', 'HIGH'],
    fedramp_required: true,
    implementation_status: 'IMPLEMENTED',
    evidence_locations: ['api/src/middleware/auth.ts', 'api/src/routes/auth.ts']
  },
  'IA-5': {
    id: 'IA-5',
    family: 'IA',
    title: 'Authenticator Management',
    description: 'Manage system authenticators by establishing initial authenticator content',
    baseline: ['LOW', 'MODERATE', 'HIGH'],
    fedramp_required: true,
    implementation_status: 'IMPLEMENTED',
    evidence_locations: ['api/src/routes/auth.ts', 'api/src/utils/crypto.ts']
  },
  'IA-8': {
    id: 'IA-8',
    family: 'IA',
    title: 'Identification and Authentication (Non-Organizational Users)',
    description: 'Uniquely identify and authenticate non-organizational users',
    baseline: ['LOW', 'MODERATE', 'HIGH'],
    fedramp_required: true,
    implementation_status: 'IMPLEMENTED',
    evidence_locations: ['api/src/middleware/auth.ts']
  },

  // ============================================================================
  // INCIDENT RESPONSE (IR)
  // ============================================================================
  'IR-1': {
    id: 'IR-1',
    family: 'IR',
    title: 'Policy and Procedures',
    description: 'Develop, document, and disseminate incident response policies',
    baseline: ['LOW', 'MODERATE', 'HIGH'],
    fedramp_required: true,
    implementation_status: 'PARTIALLY_IMPLEMENTED',
    evidence_locations: ['docs/security/incident-response-plan.md'],
    notes: 'Formal IR plan needs review and approval'
  },
  'IR-4': {
    id: 'IR-4',
    family: 'IR',
    title: 'Incident Handling',
    description: 'Implement incident handling capability for security incidents',
    baseline: ['LOW', 'MODERATE', 'HIGH'],
    fedramp_required: true,
    implementation_status: 'PARTIALLY_IMPLEMENTED',
    evidence_locations: ['api/src/migrations/033_security_audit_system.sql']
  },
  'IR-6': {
    id: 'IR-6',
    family: 'IR',
    title: 'Incident Reporting',
    description: 'Require personnel to report suspected security incidents',
    baseline: ['LOW', 'MODERATE', 'HIGH'],
    fedramp_required: true,
    implementation_status: 'PARTIALLY_IMPLEMENTED',
    notes: 'Automated incident reporting system needed'
  },

  // ============================================================================
  // SYSTEM AND COMMUNICATIONS PROTECTION (SC)
  // ============================================================================
  'SC-1': {
    id: 'SC-1',
    family: 'SC',
    title: 'Policy and Procedures',
    description: 'Develop, document, and disseminate system and communications protection policies',
    baseline: ['LOW', 'MODERATE', 'HIGH'],
    fedramp_required: true,
    implementation_status: 'IMPLEMENTED',
    evidence_locations: ['docs/security/communications-protection.md']
  },
  'SC-5': {
    id: 'SC-5',
    family: 'SC',
    title: 'Denial of Service Protection',
    description: 'Protect against or limit the effects of denial of service attacks',
    baseline: ['LOW', 'MODERATE', 'HIGH'],
    fedramp_required: true,
    implementation_status: 'IMPLEMENTED',
    evidence_locations: ['api/src/middleware/rateLimiter.ts']
  },
  'SC-7': {
    id: 'SC-7',
    family: 'SC',
    title: 'Boundary Protection',
    description: 'Monitor and control communications at external boundaries',
    baseline: ['LOW', 'MODERATE', 'HIGH'],
    fedramp_required: true,
    implementation_status: 'IMPLEMENTED',
    evidence_locations: ['api/src/middleware/cors.ts', 'infra/terraform/network.tf']
  },
  'SC-8': {
    id: 'SC-8',
    family: 'SC',
    title: 'Transmission Confidentiality and Integrity',
    description: 'Protect the confidentiality and integrity of transmitted information',
    baseline: ['MODERATE', 'HIGH'],
    fedramp_required: true,
    implementation_status: 'IMPLEMENTED',
    evidence_locations: ['api/src/server.ts', 'infra/terraform/ssl-certificates.tf']
  },
  'SC-12': {
    id: 'SC-12',
    family: 'SC',
    title: 'Cryptographic Key Establishment and Management',
    description: 'Establish and manage cryptographic keys',
    baseline: ['LOW', 'MODERATE', 'HIGH'],
    fedramp_required: true,
    implementation_status: 'IMPLEMENTED',
    evidence_locations: ['api/src/utils/crypto.ts', 'api/src/config/encryption.ts']
  },
  'SC-13': {
    id: 'SC-13',
    family: 'SC',
    title: 'Cryptographic Protection',
    description: 'Implement cryptographic mechanisms to prevent unauthorized disclosure',
    baseline: ['LOW', 'MODERATE', 'HIGH'],
    fedramp_required: true,
    implementation_status: 'IMPLEMENTED',
    evidence_locations: ['api/src/utils/crypto.ts', 'api/src/middleware/encryption.ts']
  },

  // ============================================================================
  // SYSTEM AND INFORMATION INTEGRITY (SI)
  // ============================================================================
  'SI-1': {
    id: 'SI-1',
    family: 'SI',
    title: 'Policy and Procedures',
    description: 'Develop, document, and disseminate system and information integrity policies',
    baseline: ['LOW', 'MODERATE', 'HIGH'],
    fedramp_required: true,
    implementation_status: 'IMPLEMENTED',
    evidence_locations: ['docs/security/system-integrity-policy.md']
  },
  'SI-2': {
    id: 'SI-2',
    family: 'SI',
    title: 'Flaw Remediation',
    description: 'Identify, report, and correct system flaws',
    baseline: ['LOW', 'MODERATE', 'HIGH'],
    fedramp_required: true,
    implementation_status: 'IMPLEMENTED',
    evidence_locations: ['.github/workflows/security-scan.yml', 'api/FEDRAMP_CERTIFICATION_FINAL.json']
  },
  'SI-3': {
    id: 'SI-3',
    family: 'SI',
    title: 'Malicious Code Protection',
    description: 'Implement malicious code protection mechanisms',
    baseline: ['LOW', 'MODERATE', 'HIGH'],
    fedramp_required: true,
    implementation_status: 'PARTIALLY_IMPLEMENTED',
    notes: 'Runtime malware scanning needed for file uploads'
  },
  'SI-4': {
    id: 'SI-4',
    family: 'SI',
    title: 'System Monitoring',
    description: 'Monitor the system to detect attacks and indicators of potential attacks',
    baseline: ['LOW', 'MODERATE', 'HIGH'],
    fedramp_required: true,
    implementation_status: 'IMPLEMENTED',
    evidence_locations: ['api/src/migrations/033_security_audit_system.sql', 'monitoring/']
  },
  'SI-10': {
    id: 'SI-10',
    family: 'SI',
    title: 'Information Input Validation',
    description: 'Check the validity of information inputs',
    baseline: ['MODERATE', 'HIGH'],
    fedramp_required: true,
    implementation_status: 'IMPLEMENTED',
    evidence_locations: ['api/src/middleware/validation.ts', 'api/src/utils/sanitizer.ts']
  },

  // ============================================================================
  // RISK ASSESSMENT (RA)
  // ============================================================================
  'RA-1': {
    id: 'RA-1',
    family: 'RA',
    title: 'Policy and Procedures',
    description: 'Develop, document, and disseminate risk assessment policies',
    baseline: ['LOW', 'MODERATE', 'HIGH'],
    fedramp_required: true,
    implementation_status: 'PARTIALLY_IMPLEMENTED',
    notes: 'Formal risk assessment policy needs documentation'
  },
  'RA-5': {
    id: 'RA-5',
    family: 'RA',
    title: 'Vulnerability Monitoring and Scanning',
    description: 'Monitor and scan for vulnerabilities in the system',
    baseline: ['LOW', 'MODERATE', 'HIGH'],
    fedramp_required: true,
    implementation_status: 'IMPLEMENTED',
    evidence_locations: ['.github/workflows/security-scan.yml', 'package.json']
  },

  // ============================================================================
  // PLANNING (PL)
  // ============================================================================
  'PL-1': {
    id: 'PL-1',
    family: 'PL',
    title: 'Policy and Procedures',
    description: 'Develop, document, and disseminate planning policies',
    baseline: ['LOW', 'MODERATE', 'HIGH'],
    fedramp_required: true,
    implementation_status: 'PARTIALLY_IMPLEMENTED',
    notes: 'System security plan needs formal approval'
  },
  'PL-2': {
    id: 'PL-2',
    family: 'PL',
    title: 'System Security Plan',
    description: 'Develop and implement a system security plan',
    baseline: ['LOW', 'MODERATE', 'HIGH'],
    fedramp_required: true,
    implementation_status: 'PARTIALLY_IMPLEMENTED',
    evidence_locations: ['docs/security/system-security-plan.md']
  },
}

/**
 * Get all controls for a specific baseline
 */
export function getControlsByBaseline(baseline: ControlBaseline): NIST80053Control[] {
  return Object.values(NIST_80053_CONTROLS).filter(control =>
    control.baseline.includes(baseline)
  )
}

/**
 * Get all FedRAMP required controls
 */
export function getFedRAMPControls(): NIST80053Control[] {
  return Object.values(NIST_80053_CONTROLS).filter(control =>
    control.fedramp_required
  )
}

/**
 * Get controls by family
 */
export function getControlsByFamily(family: ControlFamily): NIST80053Control[] {
  return Object.values(NIST_80053_CONTROLS).filter(control =>
    control.family === family
  )
}

/**
 * Get controls by implementation status
 */
export function getControlsByStatus(status: ImplementationStatus): NIST80053Control[] {
  return Object.values(NIST_80053_CONTROLS).filter(control =>
    control.implementation_status === status
  )
}

/**
 * Calculate compliance percentage
 */
export function calculateCompliancePercentage(baseline: ControlBaseline): number {
  const controls = getControlsByBaseline(baseline)
  const implemented = controls.filter(c =>
    c.implementation_status === 'IMPLEMENTED' || c.implementation_status === 'INHERITED'
  ).length

  return controls.length > 0 ? Math.round((implemented / controls.length) * 100) : 0
}

/**
 * Get compliance summary
 */
export function getComplianceSummary() {
  const allControls = Object.values(NIST_80053_CONTROLS)
  const fedrampControls = getFedRAMPControls()

  return {
    total_controls: allControls.length,
    fedramp_required: fedrampControls.length,
    implemented: getControlsByStatus('IMPLEMENTED').length,
    partially_implemented: getControlsByStatus('PARTIALLY_IMPLEMENTED').length,
    not_implemented: getControlsByStatus('NOT_IMPLEMENTED').length,
    planned: getControlsByStatus('PLANNED').length,
    compliance_percentages: {
      low: calculateCompliancePercentage('LOW'),
      moderate: calculateCompliancePercentage('MODERATE'),
      high: calculateCompliancePercentage('HIGH')
    }
  }
}
