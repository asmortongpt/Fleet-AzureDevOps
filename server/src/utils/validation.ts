/**
 * Input validation utilities for fleet management system
 * Enforces strict validation rules for security and data integrity
 */

/**
 * Validate tenant ID format
 * Ensures tenant IDs are valid UUIDs or numeric strings
 */
export function validateTenantId(tenantId: string | number | undefined): boolean {
  if (!tenantId) return false;

  const id = String(tenantId);

  // Allow numeric IDs
  if (/^\d+$/.test(id)) return true;

  // Allow UUIDs
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
}

/**
 * Validate asset ID format
 */
export function validateAssetId(assetId: string | number | undefined): boolean {
  if (!assetId) return false;

  const id = String(assetId);
  return /^\d+$/.test(id) || /^[A-Z0-9-]+$/i.test(id);
}

/**
 * Validate vehicle ID format
 */
export function validateVehicleId(vehicleId: string | number | undefined): boolean {
  return validateAssetId(vehicleId);
}

/**
 * Validate user ID format
 */
export function validateUserId(userId: string | number | undefined): boolean {
  if (!userId) return false;

  const id = String(userId);
  return /^\d+$/.test(id) || /^[0-9a-f-]{36}$/i.test(id);
}

/**
 * Validate email format
 */
export function validateEmail(email: string | undefined): boolean {
  if (!email) return false;

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Sanitize SQL input to prevent injection
 * Returns null if input contains suspicious patterns
 */
export function sanitizeSqlInput(input: string | undefined): string | null {
  if (!input) return null;

  // Block obvious SQL injection patterns
  const dangerousPatterns = [
    /(\bOR\b.*=.*)/i,
    /(\bAND\b.*=.*)/i,
    /(--)/,
    /(;.*DROP)/i,
    /(;.*DELETE)/i,
    /(UNION.*SELECT)/i,
    /('.*OR.*')/i
  ];

  for (const pattern of dangerousPatterns) {
    if (pattern.test(input)) {
      return null;
    }
  }

  return input.trim();
}

/**
 * Validate pagination parameters
 */
export function validatePagination(page?: number, limit?: number): { page: number; limit: number } {
  const validPage = Math.max(1, Math.floor(Number(page) || 1));
  const validLimit = Math.min(100, Math.max(1, Math.floor(Number(limit) || 10)));

  return { page: validPage, limit: validLimit };
}

/**
 * Validate date range
 */
export function validateDateRange(startDate?: string, endDate?: string): boolean {
  if (!startDate || !endDate) return false;

  const start = new Date(startDate);
  const end = new Date(endDate);

  if (isNaN(start.getTime()) || isNaN(end.getTime())) return false;

  return start <= end;
}
