/**
 * Log Sanitization Utility
 * SECURITY FIX (P0): Prevents log injection attacks (CWE-117)
 *
 * Log injection occurs when untrusted user input is directly logged without
 * sanitization, allowing attackers to forge log entries, evade SIEM detection,
 * or inject malicious payloads into log aggregation systems.
 */

/**
 * Sanitizes user input for safe logging
 *
 * @param input - Raw user input that needs to be logged
 * @param maxLength - Maximum length of sanitized output (default: 200)
 * @returns Sanitized string safe for logging
 *
 * Security Controls:
 * - Removes newline characters (\n, \r) to prevent log forging
 * - Truncates to max length to prevent log flooding
 * - Handles null/undefined safely
 * - Preserves readability while ensuring safety
 */
export function sanitizeForLog(input: unknown, maxLength: number = 200): string {
  // Handle null/undefined
  if (input === null || input === undefined) {
    return String(input);
  }

  // Convert to string
  let sanitized = String(input);

  // Remove newline characters to prevent log injection
  // Replace \n, \r, \r\n with space to maintain readability
  sanitized = sanitized.replace(/[\n\r]+/g, ' ');

  // Truncate to max length to prevent log flooding
  if (sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength) + '...';
  }

  return sanitized;
}

/**
 * Sanitizes an object's properties for safe logging
 *
 * @param obj - Object with user-controlled values
 * @param fieldsToSanitize - Array of field names to sanitize
 * @param maxLength - Maximum length per field (default: 200)
 * @returns New object with sanitized fields
 */
export function sanitizeObjectForLog<T extends Record<string, unknown>>(
  obj: T,
  fieldsToSanitize: (keyof T)[],
  maxLength: number = 200
): T {
  const sanitized = { ...obj };

  for (const field of fieldsToSanitize) {
    if (field in sanitized) {
      sanitized[field] = sanitizeForLog(sanitized[field], maxLength) as T[typeof field];
    }
  }

  return sanitized;
}

/**
 * Sanitizes HTTP request metadata for logging
 *
 * @param req - Express request object
 * @returns Sanitized request metadata object
 */
export function sanitizeRequestForLog(req: {
  method?: string;
  url?: string;
  ip?: string;
  headers?: Record<string, unknown>;
  user?: { id?: string | number; email?: string };
}): Record<string, unknown> {
  return {
    method: req.method,
    url: sanitizeForLog(req.url, 100),
    ip: req.ip,
    userAgent: sanitizeForLog(req.headers?.['user-agent'], 150),
    userId: req.user?.id,
    userEmail: sanitizeForLog(req.user?.email, 100),
  };
}
