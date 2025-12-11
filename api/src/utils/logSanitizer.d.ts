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
export declare function sanitizeForLog(input: unknown, maxLength?: number): string;
/**
 * Sanitizes an object's properties for safe logging
 *
 * @param obj - Object with user-controlled values
 * @param fieldsToSanitize - Array of field names to sanitize
 * @param maxLength - Maximum length per field (default: 200)
 * @returns New object with sanitized fields
 */
export declare function sanitizeObjectForLog<T extends Record<string, unknown>>(obj: T, fieldsToSanitize: (keyof T)[], maxLength?: number): T;
/**
 * Sanitizes HTTP request metadata for logging
 *
 * @param req - Express request object
 * @returns Sanitized request metadata object
 */
export declare function sanitizeRequestForLog(req: {
    method?: string;
    url?: string;
    ip?: string;
    headers?: Record<string, unknown>;
    user?: {
        id?: string | number;
        email?: string;
    };
}): Record<string, unknown>;
//# sourceMappingURL=logSanitizer.d.ts.map