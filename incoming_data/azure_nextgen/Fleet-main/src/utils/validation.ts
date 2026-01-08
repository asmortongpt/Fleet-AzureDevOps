// Validation utilities
export function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export function validateRequired(value: unknown): boolean {
  return value !== null && value !== undefined && value !== ''
}

export function validateTenantId(tenantId: unknown): boolean {
  return typeof tenantId === 'string' && tenantId.length > 0
}

export function validateLicenseData(data: unknown): boolean {
  return data !== null && data !== undefined
}

export function validateInput(input: unknown): boolean {
  return input !== null && input !== undefined
}
