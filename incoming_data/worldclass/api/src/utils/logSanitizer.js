"use strict";
/**
 * Log Sanitization Utility
 * SECURITY FIX (P0): Prevents log injection attacks (CWE-117)
 *
 * Log injection occurs when untrusted user input is directly logged without
 * sanitization, allowing attackers to forge log entries, evade SIEM detection,
 * or inject malicious payloads into log aggregation systems.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.sanitizeForLog = sanitizeForLog;
exports.sanitizeObjectForLog = sanitizeObjectForLog;
exports.sanitizeRequestForLog = sanitizeRequestForLog;
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
function sanitizeForLog(input, maxLength = 200) {
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
function sanitizeObjectForLog(obj, fieldsToSanitize, maxLength = 200) {
    const sanitized = { ...obj };
    for (const field of fieldsToSanitize) {
        if (field in sanitized) {
            sanitized[field] = sanitizeForLog(sanitized[field], maxLength);
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
function sanitizeRequestForLog(req) {
    return {
        method: req.method,
        url: sanitizeForLog(req.url, 100),
        ip: req.ip,
        userAgent: sanitizeForLog(req.headers?.['user-agent'], 150),
        userId: req.user?.id,
        userEmail: sanitizeForLog(req.user?.email, 100),
    };
}
//# sourceMappingURL=logSanitizer.js.map