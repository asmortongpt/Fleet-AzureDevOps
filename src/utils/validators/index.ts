export function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export function validateRequired(value: unknown): boolean {
  return value !== null && value !== undefined && value !== ''
}
