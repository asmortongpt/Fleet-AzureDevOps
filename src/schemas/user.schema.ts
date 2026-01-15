/**
 * User Management Form Validation Schema (Zod)
 *
 * 15 fields organized into 2 sections:
 * 1. User Details (8 fields)
 * 2. Permissions & Roles (7 fields)
 *
 * Real-time validation with actionable error messages
 */

import { z } from 'zod'

// Email and password validation
const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/
const usernameRegex = /^[a-zA-Z0-9_-]{3,20}$/

// ============================================================================
// SECTION 1: USER DETAILS
// ============================================================================

export const userDetailsSchema = z.object({
  // Required Core Fields
  username: z.string()
    .min(3, 'Username must be at least 3 characters')
    .max(20, 'Username must be less than 20 characters')
    .regex(usernameRegex, 'Username can only contain letters, numbers, underscores, and hyphens')
    .transform(val => val.toLowerCase()),

  email: z.string()
    .min(1, 'Email is required')
    .email('Invalid email format')
    .regex(emailRegex, 'Email format invalid')
    .transform(val => val.toLowerCase()),

  firstName: z.string()
    .min(1, 'First name is required')
    .max(50, 'First name must be less than 50 characters')
    .regex(/^[a-zA-Z\s'-]+$/, 'First name can only contain letters, spaces, hyphens, and apostrophes'),

  lastName: z.string()
    .min(1, 'Last name is required')
    .max(50, 'Last name must be less than 50 characters')
    .regex(/^[a-zA-Z\s'-]+$/, 'Last name can only contain letters, spaces, hyphens, and apostrophes'),

  // Password (required for new users)
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(passwordRegex, 'Password must contain uppercase, lowercase, number, and special character (@$!%*?&)')
    .optional()
    .nullable(),

  confirmPassword: z.string()
    .optional()
    .nullable(),

  // Optional Fields
  phone: z.string()
    .regex(/^\+?1?\d{10,14}$/, 'Phone number must be 10-14 digits')
    .transform(val => val.replace(/\D/g, ''))
    .optional()
    .nullable(),

  department: z.string()
    .max(100, 'Department name must be less than 100 characters')
    .optional()
    .nullable(),
})
  .refine(
    (data: { password?: string | null; confirmPassword?: string | null }) => {
      // Password confirmation must match
      if (data.password && data.confirmPassword) {
        return data.password === data.confirmPassword
      }
      return true
    },
    {
      message: 'Passwords must match',
      path: ['confirmPassword'],
    }
  )

// ============================================================================
// SECTION 2: PERMISSIONS & ROLES
// ============================================================================

export const userPermissionsSchema = z.object({
  // User Role
  role: z.enum([
    'super-admin',
    'admin',
    'fleet-manager',
    'dispatcher',
    'mechanic',
    'driver',
    'viewer'
  ]),

  // Status
  status: z.enum([
    'active',
    'inactive',
    'suspended',
    'pending-activation'
  ]).default('pending-activation'),

  // Granular Permissions (boolean flags)
  canViewVehicles: z.boolean().default(true),
  canEditVehicles: z.boolean().default(false),
  canDeleteVehicles: z.boolean().default(false),

  canViewDrivers: z.boolean().default(true),
  canEditDrivers: z.boolean().default(false),
  canDeleteDrivers: z.boolean().default(false),

  canViewWorkOrders: z.boolean().default(true),
  canEditWorkOrders: z.boolean().default(false),
  canDeleteWorkOrders: z.boolean().default(false),
  canApproveWorkOrders: z.boolean().default(false),

  canViewReports: z.boolean().default(true),
  canExportData: z.boolean().default(false),

  canManageUsers: z.boolean().default(false),
  canManageSettings: z.boolean().default(false),

  // Optional Fields
  notes: z.string()
    .max(500, 'Notes must be less than 500 characters')
    .optional()
    .nullable(),

  lastLoginDate: z.coerce.date()
    .optional()
    .nullable(),

  createdDate: z.coerce.date()
    .default(() => new Date()),

  expirationDate: z.coerce.date()
    .optional()
    .nullable(),
})

// ============================================================================
// COMBINED USER SCHEMA (ALL 15 FIELDS + PERMISSIONS)
// ============================================================================

const userSchemaBase = z.intersection(userDetailsSchema, userPermissionsSchema)

export const userSchema = userSchemaBase
  .refine(
    (data: { role: string; canManageUsers: boolean; canManageSettings: boolean }) => {
      // Validation: Super admin and admin must have management permissions
      if (data.role === 'super-admin' || data.role === 'admin') {
        return data.canManageUsers && data.canManageSettings
      }
      return true
    },
    {
      message: 'Admin roles must have user and settings management permissions',
      path: ['role'],
    }
  )
  .refine(
    (data: {
      canDeleteVehicles: boolean;
      canEditVehicles: boolean;
      canDeleteDrivers: boolean;
      canEditDrivers: boolean;
      canDeleteWorkOrders: boolean;
      canEditWorkOrders: boolean
    }) => {
      // Validation: Cannot delete without edit permission
      if (data.canDeleteVehicles && !data.canEditVehicles) {
        return false
      }
      if (data.canDeleteDrivers && !data.canEditDrivers) {
        return false
      }
      if (data.canDeleteWorkOrders && !data.canEditWorkOrders) {
        return false
      }
      return true
    },
    {
      message: 'Delete permission requires edit permission',
      path: ['role'],
    }
  )
  .refine(
    (data: { expirationDate?: Date | null }) => {
      // Validation: Expiration date must be in the future
      if (data.expirationDate) {
        return new Date(data.expirationDate) > new Date()
      }
      return true
    },
    {
      message: 'Expiration date must be in the future',
      path: ['expirationDate'],
    }
  )

// TypeScript type inferred from schema
export type UserFormData = z.infer<typeof userSchema>

// Partial schema for updates (all fields optional except required ones)
export const userUpdateSchema = (userSchemaBase as any).partial().omit({ password: true, confirmPassword: true })

// Password change schema
export const passwordChangeSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(passwordRegex, 'Password must contain uppercase, lowercase, number, and special character'),
  confirmNewPassword: z.string(),
})
  .refine(
    (data) => data.newPassword === data.confirmNewPassword,
    {
      message: 'Passwords must match',
      path: ['confirmNewPassword'],
    }
  )
  .refine(
    (data) => data.currentPassword !== data.newPassword,
    {
      message: 'New password must be different from current password',
      path: ['newPassword'],
    }
  )

// Export schemas for each section
export const userSectionSchemas = {
  details: userDetailsSchema,
  permissions: userPermissionsSchema,
}

// ============================================================================
// ROLE-BASED PERMISSION PRESETS
// ============================================================================

export const rolePermissions = {
  'super-admin': {
    canViewVehicles: true,
    canEditVehicles: true,
    canDeleteVehicles: true,
    canViewDrivers: true,
    canEditDrivers: true,
    canDeleteDrivers: true,
    canViewWorkOrders: true,
    canEditWorkOrders: true,
    canDeleteWorkOrders: true,
    canApproveWorkOrders: true,
    canViewReports: true,
    canExportData: true,
    canManageUsers: true,
    canManageSettings: true,
  },
  'admin': {
    canViewVehicles: true,
    canEditVehicles: true,
    canDeleteVehicles: true,
    canViewDrivers: true,
    canEditDrivers: true,
    canDeleteDrivers: true,
    canViewWorkOrders: true,
    canEditWorkOrders: true,
    canDeleteWorkOrders: true,
    canApproveWorkOrders: true,
    canViewReports: true,
    canExportData: true,
    canManageUsers: true,
    canManageSettings: true,
  },
  'fleet-manager': {
    canViewVehicles: true,
    canEditVehicles: true,
    canDeleteVehicles: false,
    canViewDrivers: true,
    canEditDrivers: true,
    canDeleteDrivers: false,
    canViewWorkOrders: true,
    canEditWorkOrders: true,
    canDeleteWorkOrders: false,
    canApproveWorkOrders: true,
    canViewReports: true,
    canExportData: true,
    canManageUsers: false,
    canManageSettings: false,
  },
  'dispatcher': {
    canViewVehicles: true,
    canEditVehicles: false,
    canDeleteVehicles: false,
    canViewDrivers: true,
    canEditDrivers: false,
    canDeleteDrivers: false,
    canViewWorkOrders: true,
    canEditWorkOrders: true,
    canDeleteWorkOrders: false,
    canApproveWorkOrders: false,
    canViewReports: true,
    canExportData: false,
    canManageUsers: false,
    canManageSettings: false,
  },
  'mechanic': {
    canViewVehicles: true,
    canEditVehicles: false,
    canDeleteVehicles: false,
    canViewDrivers: false,
    canEditDrivers: false,
    canDeleteDrivers: false,
    canViewWorkOrders: true,
    canEditWorkOrders: true,
    canDeleteWorkOrders: false,
    canApproveWorkOrders: false,
    canViewReports: false,
    canExportData: false,
    canManageUsers: false,
    canManageSettings: false,
  },
  'driver': {
    canViewVehicles: true,
    canEditVehicles: false,
    canDeleteVehicles: false,
    canViewDrivers: false,
    canEditDrivers: false,
    canDeleteDrivers: false,
    canViewWorkOrders: false,
    canEditWorkOrders: false,
    canDeleteWorkOrders: false,
    canApproveWorkOrders: false,
    canViewReports: false,
    canExportData: false,
    canManageUsers: false,
    canManageSettings: false,
  },
  'viewer': {
    canViewVehicles: true,
    canEditVehicles: false,
    canDeleteVehicles: false,
    canViewDrivers: true,
    canEditDrivers: false,
    canDeleteDrivers: false,
    canViewWorkOrders: true,
    canEditWorkOrders: false,
    canDeleteWorkOrders: false,
    canApproveWorkOrders: false,
    canViewReports: true,
    canExportData: false,
    canManageUsers: false,
    canManageSettings: false,
  },
}

// Helper function to get default permissions for a role
export function getDefaultPermissionsForRole(role: keyof typeof rolePermissions) {
  return rolePermissions[role]
}

// Helper function to check if user has permission
export function hasPermission(user: Partial<UserFormData>, permission: string): boolean {
  return (user as Record<string, unknown>)[permission] === true
}

// Helper function to check if password meets requirements
export function validatePasswordStrength(password: string): {
  isValid: boolean
  strength: 'weak' | 'medium' | 'strong'
  issues: string[]
} {
  const issues: string[] = []
  let strength: 'weak' | 'medium' | 'strong' = 'weak'

  if (password.length < 8) issues.push('Must be at least 8 characters')
  if (!/[a-z]/.test(password)) issues.push('Must contain lowercase letter')
  if (!/[A-Z]/.test(password)) issues.push('Must contain uppercase letter')
  if (!/\d/.test(password)) issues.push('Must contain number')
  if (!/[@$!%*?&]/.test(password)) issues.push('Must contain special character')

  const isValid = issues.length === 0

  if (isValid) {
    if (password.length >= 12 && /[^a-zA-Z\d@$!%*?&]/.test(password)) {
      strength = 'strong'
    } else if (password.length >= 10) {
      strength = 'medium'
    }
  }

  return { isValid, strength, issues }
}