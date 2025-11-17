/**
 * Field masking utility for PII and sensitive data
 * Implements role-based field-level access control
 */

import { AuthRequest } from '../middleware/auth'
import pool from '../config/database'

export type FieldClassification = 'Internal' | 'Confidential' | 'Restricted' | 'Sensitive'

interface MaskingRule {
  field: string
  classification: FieldClassification
  allowedRoles: string[]
  maskingStrategy: 'full' | 'partial' | 'redact' | 'remove'
}

/**
 * Masking rules by resource type
 */
const maskingRules: Record<string, MaskingRule[]> = {
  driver: [
    {
      field: 'license_number',
      classification: 'Confidential',
      allowedRoles: ['FleetAdmin', 'Manager', 'SafetyOfficer', 'Auditor'],
      maskingStrategy: 'partial'
    },
    {
      field: 'license_state',
      classification: 'Internal',
      allowedRoles: ['FleetAdmin', 'Manager', 'SafetyOfficer', 'Dispatcher', 'Auditor'],
      maskingStrategy: 'full'
    },
    {
      field: 'medical_card_expiration',
      classification: 'Confidential',
      allowedRoles: ['FleetAdmin', 'SafetyOfficer', 'Auditor'],
      maskingStrategy: 'full'
    },
    {
      field: 'emergency_contact_name',
      classification: 'Confidential',
      allowedRoles: ['FleetAdmin', 'Manager', 'Auditor'],
      maskingStrategy: 'full'
    },
    {
      field: 'emergency_contact_phone',
      classification: 'Confidential',
      allowedRoles: ['FleetAdmin', 'Manager', 'Auditor'],
      maskingStrategy: 'partial'
    },
    {
      field: 'ssn',
      classification: 'Restricted',
      allowedRoles: ['FleetAdmin', 'Auditor'],
      maskingStrategy: 'partial'
    }
  ],
  vehicle: [
    {
      field: 'purchase_price',
      classification: 'Confidential',
      allowedRoles: ['FleetAdmin', 'Manager', 'Finance', 'Auditor'],
      maskingStrategy: 'remove'
    },
    {
      field: 'current_value',
      classification: 'Confidential',
      allowedRoles: ['FleetAdmin', 'Manager', 'Finance', 'Auditor'],
      maskingStrategy: 'remove'
    },
    {
      field: 'latitude',
      classification: 'Sensitive',
      allowedRoles: ['FleetAdmin', 'Manager', 'Dispatcher', 'SafetyOfficer', 'Auditor'],
      maskingStrategy: 'full'
    },
    {
      field: 'longitude',
      classification: 'Sensitive',
      allowedRoles: ['FleetAdmin', 'Manager', 'Dispatcher', 'SafetyOfficer', 'Auditor'],
      maskingStrategy: 'full'
    }
  ],
  work_order: [
    {
      field: 'labor_cost',
      classification: 'Confidential',
      allowedRoles: ['FleetAdmin', 'Manager', 'Finance', 'Auditor'],
      maskingStrategy: 'remove'
    },
    {
      field: 'parts_cost',
      classification: 'Confidential',
      allowedRoles: ['FleetAdmin', 'Manager', 'Finance', 'Auditor'],
      maskingStrategy: 'remove'
    },
    {
      field: 'total_cost',
      classification: 'Confidential',
      allowedRoles: ['FleetAdmin', 'Manager', 'Finance', 'Auditor'],
      maskingStrategy: 'remove'
    }
  ],
  purchase_order: [
    {
      field: 'subtotal',
      classification: 'Confidential',
      allowedRoles: ['FleetAdmin', 'Manager', 'Finance', 'Auditor'],
      maskingStrategy: 'remove'
    },
    {
      field: 'tax',
      classification: 'Confidential',
      allowedRoles: ['FleetAdmin', 'Manager', 'Finance', 'Auditor'],
      maskingStrategy: 'remove'
    },
    {
      field: 'total',
      classification: 'Confidential',
      allowedRoles: ['FleetAdmin', 'Manager', 'Finance', 'Auditor'],
      maskingStrategy: 'remove'
    },
    {
      field: 'line_items',
      classification: 'Confidential',
      allowedRoles: ['FleetAdmin', 'Manager', 'Finance', 'Auditor'],
      maskingStrategy: 'remove'
    }
  ],
  fuel_transaction: [
    {
      field: 'fuel_card_number',
      classification: 'Confidential',
      allowedRoles: ['FleetAdmin', 'Finance', 'Auditor'],
      maskingStrategy: 'partial'
    }
  ],
  user: [
    {
      field: 'email',
      classification: 'Confidential',
      allowedRoles: ['FleetAdmin', 'Auditor'],
      maskingStrategy: 'partial'
    },
    {
      field: 'phone',
      classification: 'Confidential',
      allowedRoles: ['FleetAdmin', 'Auditor'],
      maskingStrategy: 'partial'
    },
    {
      field: 'password_hash',
      classification: 'Restricted',
      allowedRoles: [],
      maskingStrategy: 'remove'
    },
    {
      field: 'mfa_secret',
      classification: 'Restricted',
      allowedRoles: [],
      maskingStrategy: 'remove'
    }
  ],
  safety_incident: [
    {
      field: 'property_damage_cost',
      classification: 'Confidential',
      allowedRoles: ['FleetAdmin', 'Manager', 'SafetyOfficer', 'Finance', 'Auditor'],
      maskingStrategy: 'full'
    },
    {
      field: 'insurance_claim_number',
      classification: 'Confidential',
      allowedRoles: ['FleetAdmin', 'SafetyOfficer', 'Finance', 'Auditor'],
      maskingStrategy: 'full'
    }
  ]
}

/**
 * Get user roles
 */
async function getUserRoles(userId: string): Promise<string[]> {
  try {
    const result = await pool.query(`
      SELECT r.name
      FROM roles r
      JOIN user_roles ur ON r.id = ur.role_id
      WHERE ur.user_id = $1
      AND ur.is_active = true
      AND (ur.expires_at IS NULL OR ur.expires_at > NOW())
    `, [userId])

    return result.rows.map(row => row.name)
  } catch (error) {
    console.error('Error fetching user roles:', error)
    return []
  }
}

/**
 * Mask a field value based on strategy
 */
function maskValue(value: any, strategy: MaskingRule['maskingStrategy']): any {
  if (value === null || value === undefined) {
    return value
  }

  const strValue = String(value)

  switch (strategy) {
    case 'full':
      // Return the value as-is (user has access)
      return value

    case 'partial':
      // Show first and last few characters
      if (strValue.length <= 4) {
        return '***'
      }
      return `${strValue.slice(0, 2)}${'*'.repeat(strValue.length - 4)}${strValue.slice(-2)}`

    case 'redact':
      // Replace with placeholder
      return '[REDACTED]'

    case 'remove':
      // Remove the field entirely
      return undefined

    default:
      return value
  }
}

/**
 * Apply field masking to a single record
 */
export async function maskRecord(
  record: any,
  resourceType: string,
  userId: string
): Promise<any> {
  if (!record) {
    return record
  }

  const userRoles = await getUserRoles(userId)
  const rules = maskingRules[resourceType] || []

  const maskedRecord = { ...record }

  for (const rule of rules) {
    if (maskedRecord[rule.field] !== undefined) {
      // Check if user's role allows access to this field
      const hasAccess = userRoles.some(role => rule.allowedRoles.includes(role))

      if (!hasAccess) {
        const maskedValue = maskValue(maskedRecord[rule.field], rule.maskingStrategy)
        if (maskedValue === undefined) {
          delete maskedRecord[rule.field]
        } else {
          maskedRecord[rule.field] = maskedValue
        }
      }
    }
  }

  return maskedRecord
}

/**
 * Apply field masking to an array of records
 */
export async function maskRecords(
  records: any[],
  resourceType: string,
  userId: string
): Promise<any[]> {
  if (!records || !Array.isArray(records)) {
    return records
  }

  const userRoles = await getUserRoles(userId)
  const rules = maskingRules[resourceType] || []

  return records.map(record => {
    const maskedRecord = { ...record }

    for (const rule of rules) {
      if (maskedRecord[rule.field] !== undefined) {
        const hasAccess = userRoles.some(role => rule.allowedRoles.includes(role))

        if (!hasAccess) {
          const maskedValue = maskValue(maskedRecord[rule.field], rule.maskingStrategy)
          if (maskedValue === undefined) {
            delete maskedRecord[rule.field]
          } else {
            maskedRecord[rule.field] = maskedValue
          }
        }
      }
    }

    return maskedRecord
  })
}

/**
 * Express middleware for automatic field masking
 */
export function applyFieldMasking(resourceType: string) {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next()
    }

    // Store original json method
    const originalJson = res.json.bind(res)

    // Override json method to mask data before sending
    res.json = function (data: any): Response {
      if (!data) {
        return originalJson(data)
      }

      // Mask the data
      const mask = async () => {
        try {
          let maskedData

          if (Array.isArray(data)) {
            maskedData = await maskRecords(data, resourceType, req.user!.id)
          } else if (data.data && Array.isArray(data.data)) {
            // Handle paginated response format
            maskedData = {
              ...data,
              data: await maskRecords(data.data, resourceType, req.user!.id)
            }
          } else {
            maskedData = await maskRecord(data, resourceType, req.user!.id)
          }

          return originalJson(maskedData)
        } catch (error) {
          console.error('Field masking error:', error)
          return originalJson(data) // Fall back to original data
        }
      }

      // Execute masking asynchronously
      mask()

      return res
    }

    next()
  }
}

/**
 * Utility to check if a field should be masked for a user
 */
export async function shouldMaskField(
  resourceType: string,
  fieldName: string,
  userId: string
): Promise<boolean> {
  const userRoles = await getUserRoles(userId)
  const rules = maskingRules[resourceType] || []

  const rule = rules.find(r => r.field === fieldName)
  if (!rule) {
    return false // No rule means no masking
  }

  return !userRoles.some(role => rule.allowedRoles.includes(role))
}

// Type guard for Express Response
import { Response, NextFunction } from 'express'
