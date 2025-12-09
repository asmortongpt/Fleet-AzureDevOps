/**
 * Driver Form Validation Schema (Zod)
 *
 * 33 fields organized into 3 sections:
 * 1. Personal Information (15 fields)
 * 2. License & Certifications (10 fields)
 * 3. Employment Details (8 fields)
 *
 * Real-time validation with actionable error messages
 */

import { z } from 'zod'

// Email and phone regex
const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
const phoneRegex = /^\+?1?\d{10,14}$/
const ssnRegex = /^\d{3}-?\d{2}-?\d{4}$/
const licenseRegex = /^[A-Z0-9-]{5,20}$/

// ============================================================================
// SECTION 1: PERSONAL INFORMATION
// ============================================================================

export const driverPersonalInfoSchema = z.object({
  // Required Core Fields
  firstName: z.string()
    .min(1, 'First name is required')
    .max(50, 'First name must be less than 50 characters')
    .regex(/^[a-zA-Z\s'-]+$/, 'First name can only contain letters, spaces, hyphens, and apostrophes'),

  lastName: z.string()
    .min(1, 'Last name is required')
    .max(50, 'Last name must be less than 50 characters')
    .regex(/^[a-zA-Z\s'-]+$/, 'Last name can only contain letters, spaces, hyphens, and apostrophes'),

  email: z.string()
    .min(1, 'Email is required')
    .email('Invalid email format')
    .regex(emailRegex, 'Email format invalid')
    .transform(val => val.toLowerCase()),

  phone: z.string()
    .min(1, 'Phone number is required')
    .regex(phoneRegex, 'Phone number must be 10-14 digits (e.g., 555-123-4567 or +1-555-123-4567)')
    .transform(val => val.replace(/\D/g, '')), // Remove non-digits

  dateOfBirth: z.coerce.date()
    .min(new Date(1900, 0, 1), 'Date of birth must be after 1900')
    .max(new Date(new Date().getFullYear() - 16, new Date().getMonth(), new Date().getDate()), 'Driver must be at least 16 years old'),

  // Optional Fields
  middleName: z.string()
    .max(50, 'Middle name must be less than 50 characters')
    .regex(/^[a-zA-Z\s'-]*$/, 'Middle name can only contain letters, spaces, hyphens, and apostrophes')
    .optional()
    .nullable(),

  suffix: z.enum(['Jr.', 'Sr.', 'II', 'III', 'IV', 'V'])
    .optional()
    .nullable(),

  ssn: z.string()
    .regex(ssnRegex, 'SSN must be in format XXX-XX-XXXX')
    .transform(val => val.replace(/-/g, '')) // Store without dashes
    .optional()
    .nullable(),

  address: z.string()
    .max(200, 'Address must be less than 200 characters')
    .optional()
    .nullable(),

  city: z.string()
    .max(100, 'City must be less than 100 characters')
    .optional()
    .nullable(),

  state: z.string()
    .length(2, 'State must be 2-letter code (e.g., FL, CA)')
    .regex(/^[A-Z]{2}$/, 'State must be uppercase 2-letter code')
    .transform(val => val.toUpperCase())
    .optional()
    .nullable(),

  zipCode: z.string()
    .regex(/^\d{5}(-\d{4})?$/, 'ZIP code must be 5 digits or ZIP+4 format')
    .optional()
    .nullable(),

  emergencyContactName: z.string()
    .max(100, 'Emergency contact name must be less than 100 characters')
    .optional()
    .nullable(),

  emergencyContactPhone: z.string()
    .regex(phoneRegex, 'Phone number must be 10-14 digits')
    .transform(val => val.replace(/\D/g, ''))
    .optional()
    .nullable(),

  emergencyContactRelationship: z.string()
    .max(50, 'Relationship must be less than 50 characters')
    .optional()
    .nullable(),
})

// ============================================================================
// SECTION 2: LICENSE & CERTIFICATIONS
// ============================================================================

export const driverLicenseSchema = z.object({
  // Required License Fields
  licenseNumber: z.string()
    .min(1, 'License number is required')
    .max(20, 'License number must be less than 20 characters')
    .regex(licenseRegex, 'License number format invalid')
    .transform(val => val.toUpperCase()),

  licenseState: z.string()
    .length(2, 'License state must be 2-letter code')
    .regex(/^[A-Z]{2}$/, 'State must be uppercase 2-letter code')
    .transform(val => val.toUpperCase()),

  licenseClass: z.enum([
    'A',      // Commercial - Combination vehicles
    'B',      // Commercial - Heavy straight vehicles
    'C',      // Commercial - Small vehicles
    'D',      // Standard passenger vehicle
    'E',      // Motorcycle
    'M',      // Motorcycle (some states)
  ]),

  licenseExpiration: z.coerce.date()
    .min(new Date(), 'License is expired or expires today'),

  // Optional Certifications
  cdlEndorsements: z.array(z.enum([
    'H',   // Hazardous materials
    'N',   // Tank vehicles
    'P',   // Passenger transport
    'S',   // School bus
    'T',   // Double/triple trailers
    'X',   // Combination of H and N
  ])).optional().nullable(),

  medicalCertificateExpiration: z.coerce.date()
    .optional()
    .nullable(),

  backgroundCheckDate: z.coerce.date()
    .max(new Date(), 'Background check date cannot be in the future')
    .optional()
    .nullable(),

  backgroundCheckStatus: z.enum([
    'passed',
    'failed',
    'pending',
    'expired',
    'not-required'
  ]).optional().nullable(),

  drugTestDate: z.coerce.date()
    .max(new Date(), 'Drug test date cannot be in the future')
    .optional()
    .nullable(),

  drugTestStatus: z.enum([
    'passed',
    'failed',
    'pending',
    'expired',
    'not-required'
  ]).optional().nullable(),
})

// ============================================================================
// SECTION 3: EMPLOYMENT DETAILS
// ============================================================================

export const driverEmploymentSchema = z.object({
  // Required Employment Fields
  employeeId: z.string()
    .min(1, 'Employee ID is required')
    .max(20, 'Employee ID must be less than 20 characters'),

  hireDate: z.coerce.date()
    .max(new Date(), 'Hire date cannot be in the future'),

  status: z.enum([
    'active',
    'inactive',
    'on-leave',
    'suspended',
    'terminated'
  ]).default('active'),

  // Optional Employment Fields
  department: z.string()
    .max(100, 'Department name must be less than 100 characters')
    .optional()
    .nullable(),

  jobTitle: z.string()
    .max(100, 'Job title must be less than 100 characters')
    .optional()
    .nullable(),

  supervisor: z.string()
    .max(100, 'Supervisor name must be less than 100 characters')
    .optional()
    .nullable(),

  payRate: z.coerce.number()
    .min(0, 'Pay rate cannot be negative')
    .max(500, 'Pay rate seems unreasonably high (max $500/hour)')
    .optional()
    .nullable(),

  notes: z.string()
    .max(1000, 'Notes must be less than 1000 characters')
    .optional()
    .nullable(),
})

// ============================================================================
// COMBINED DRIVER SCHEMA (ALL 33 FIELDS)
// ============================================================================

export const driverSchema = driverPersonalInfoSchema
  .merge(driverLicenseSchema)
  .merge(driverEmploymentSchema)
  .refine(
    (data) => {
      // Cross-field validation: License must not expire before medical certificate
      if (data.licenseExpiration && data.medicalCertificateExpiration) {
        return new Date(data.medicalCertificateExpiration) >= new Date(data.licenseExpiration)
      }
      return true
    },
    {
      message: 'Medical certificate must be valid through license expiration date',
      path: ['medicalCertificateExpiration'],
    }
  )
  .refine(
    (data) => {
      // Cross-field validation: Hire date must be after 16th birthday
      if (data.hireDate && data.dateOfBirth) {
        const sixteenthBirthday = new Date(data.dateOfBirth)
        sixteenthBirthday.setFullYear(sixteenthBirthday.getFullYear() + 16)
        return new Date(data.hireDate) >= sixteenthBirthday
      }
      return true
    },
    {
      message: 'Driver must be at least 16 years old at hire date',
      path: ['hireDate'],
    }
  )
  .refine(
    (data) => {
      // Cross-field validation: CDL Class A/B/C requires medical certificate
      if (['A', 'B', 'C'].includes(data.licenseClass)) {
        return data.medicalCertificateExpiration !== null && data.medicalCertificateExpiration !== undefined
      }
      return true
    },
    {
      message: 'Commercial license requires medical certificate',
      path: ['medicalCertificateExpiration'],
    }
  )
  .refine(
    (data) => {
      // Cross-field validation: Background check required for commercial licenses
      if (['A', 'B', 'C'].includes(data.licenseClass)) {
        return data.backgroundCheckDate !== null && data.backgroundCheckDate !== undefined
      }
      return true
    },
    {
      message: 'Commercial license requires background check',
      path: ['backgroundCheckDate'],
    }
  )

// TypeScript type inferred from schema
export type DriverFormData = z.infer<typeof driverSchema>

// Partial schema for updates (all fields optional)
export const driverUpdateSchema = driverSchema.partial()

// Export schemas for each section
export const driverSectionSchemas = {
  personalInfo: driverPersonalInfoSchema,
  license: driverLicenseSchema,
  employment: driverEmploymentSchema,
}

// Helper function to calculate driver age
export function calculateDriverAge(dateOfBirth: Date): number {
  const today = new Date()
  const birthDate = new Date(dateOfBirth)
  let age = today.getFullYear() - birthDate.getFullYear()
  const monthDiff = today.getMonth() - birthDate.getMonth()

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--
  }

  return age
}

// Helper function to check if license is CDL
export function isCDL(licenseClass: string): boolean {
  return ['A', 'B', 'C'].includes(licenseClass)
}

// Helper function to get days until expiration
export function getDaysUntilExpiration(expirationDate: Date): number {
  const today = new Date()
  const expDate = new Date(expirationDate)
  const diff = expDate.getTime() - today.getTime()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}
