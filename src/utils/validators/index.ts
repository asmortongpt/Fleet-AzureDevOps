export function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export function validateRequired(value: unknown): boolean {
  return value !== null && value !== undefined && value !== ''
}

export function validateCategory(category: unknown): boolean {
  return typeof category === 'string' && category.length > 0
}

export function validateStatus(status: unknown): boolean {
  return typeof status === 'string' && status.length > 0
}
