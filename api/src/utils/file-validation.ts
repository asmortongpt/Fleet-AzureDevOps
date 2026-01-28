/**
 * File Validation and Security Utilities
 * Production-ready file upload security with real virus scanning
 */

import crypto from 'crypto';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import logger from '../config/logger';

const execAsync = promisify(exec);

/**
 * Allowed file extensions by category
 */
const ALLOWED_EXTENSIONS = {
  images: ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'],
  documents: ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.txt', '.csv'],
  videos: ['.mp4', '.mov', '.avi', '.mkv', '.webm'],
  archives: ['.zip', '.tar', '.gz', '.7z'],
};

const ALL_ALLOWED_EXTENSIONS = Object.values(ALLOWED_EXTENSIONS).flat();

/**
 * File size limits by type (in bytes)
 */
const SIZE_LIMITS = {
  image: 10 * 1024 * 1024,     // 10MB
  document: 25 * 1024 * 1024,  // 25MB
  video: 100 * 1024 * 1024,    // 100MB
  default: 50 * 1024 * 1024,   // 50MB
};

/**
 * Dangerous file signatures (magic bytes)
 */
const DANGEROUS_SIGNATURES = [
  { signature: Buffer.from([0x4D, 0x5A]), name: 'PE Executable (.exe)' },
  { signature: Buffer.from([0x7F, 0x45, 0x4C, 0x46]), name: 'ELF Executable' },
  { signature: Buffer.from([0xCA, 0xFE, 0xBA, 0xBE]), name: 'Mach-O Executable' },
  { signature: Buffer.from([0xD0, 0xCF, 0x11, 0xE0]), name: 'Microsoft Office (potential macro)' },
];

/**
 * Sanitize filename for safe storage
 * Removes dangerous characters and prevents directory traversal
 */
export function sanitizeFilename(filename: string): string {
  // Remove path components to prevent directory traversal
  const basename = path.basename(filename);

  // Replace dangerous characters with underscores
  const safe = basename.replace(/[^a-zA-Z0-9._-]/g, '_');

  // Prevent hidden files
  if (safe.startsWith('.')) {
    return `file_${safe}`;
  }

  // Limit filename length
  if (safe.length > 200) {
    const ext = path.extname(safe);
    const name = safe.substring(0, 200 - ext.length);
    return `${name}${ext}`;
  }

  return safe;
}

/**
 * Generate secure random filename with original extension
 */
export function generateSecureFilename(originalFilename: string): string {
  const ext = path.extname(originalFilename).toLowerCase();
  const hash = crypto.randomBytes(16).toString('hex');
  const timestamp = Date.now();
  return `${timestamp}_${hash}${ext}`;
}

/**
 * Validate file extension
 */
export function validateFileExtension(filename: string): {
  valid: boolean;
  extension: string;
  error?: string;
} {
  const ext = path.extname(filename).toLowerCase();

  if (!ext) {
    return { valid: false, extension: '', error: 'File has no extension' };
  }

  if (!ALL_ALLOWED_EXTENSIONS.includes(ext)) {
    return {
      valid: false,
      extension: ext,
      error: `File extension '${ext}' is not allowed. Allowed: ${ALL_ALLOWED_EXTENSIONS.join(', ')}`
    };
  }

  return { valid: true, extension: ext };
}

/**
 * Validate file size
 */
export function validateFileSize(size: number, mimeType?: string): {
  valid: boolean;
  size: number;
  limit: number;
  error?: string;
} {
  let limit = SIZE_LIMITS.default;

  if (mimeType) {
    if (mimeType.startsWith('image/')) limit = SIZE_LIMITS.image;
    else if (mimeType.startsWith('video/')) limit = SIZE_LIMITS.video;
    else if (mimeType.includes('pdf') || mimeType.includes('document')) limit = SIZE_LIMITS.document;
  }

  if (size > limit) {
    return {
      valid: false,
      size,
      limit,
      error: `File size ${(size / 1024 / 1024).toFixed(2)}MB exceeds limit of ${(limit / 1024 / 1024).toFixed(2)}MB`
    };
  }

  return { valid: true, size, limit };
}

/**
 * Check for dangerous file signatures (magic bytes)
 */
export function checkFileSignature(buffer: Buffer): {
  safe: boolean;
  detectedType?: string;
  error?: string;
} {
  for (const { signature, name } of DANGEROUS_SIGNATURES) {
    if (buffer.slice(0, signature.length).equals(signature)) {
      return {
        safe: false,
        detectedType: name,
        error: `Dangerous file type detected: ${name}`
      };
    }
  }

  return { safe: true };
}

/**
 * Validate MIME type matches file extension
 */
export function validateMimeType(mimeType: string, extension: string): {
  valid: boolean;
  mismatch?: boolean;
  error?: string;
} {
  const commonMimeTypes: Record<string, string[]> = {
    '.jpg': ['image/jpeg'],
    '.jpeg': ['image/jpeg'],
    '.png': ['image/png'],
    '.gif': ['image/gif'],
    '.pdf': ['application/pdf'],
    '.doc': ['application/msword'],
    '.docx': ['application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
    '.xls': ['application/vnd.ms-excel'],
    '.xlsx': ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
    '.zip': ['application/zip', 'application/x-zip-compressed'],
    '.mp4': ['video/mp4'],
  };

  const expectedTypes = commonMimeTypes[extension];
  if (!expectedTypes) {
    return { valid: true }; // Unknown extension, skip MIME validation
  }

  if (!expectedTypes.includes(mimeType)) {
    return {
      valid: false,
      mismatch: true,
      error: `MIME type '${mimeType}' does not match extension '${extension}'. Expected: ${expectedTypes.join(' or ')}`
    };
  }

  return { valid: true };
}

/**
 * Production-ready virus scanning using ClamAV
 * Falls back to heuristics if ClamAV is not available
 */
export async function scanForVirus(buffer: Buffer, filename: string): Promise<{
  clean: boolean;
  threat?: string;
  engine?: 'clamav' | 'heuristic';
  error?: string;
}> {
  try {
    // Try ClamAV first (production)
    const clamavResult = await scanWithClamAV(buffer, filename);
    if (clamavResult.available) {
      return {
        clean: clamavResult.clean,
        threat: clamavResult.threat,
        engine: 'clamav'
      };
    }

    logger.warn('[VIRUS_SCAN] ClamAV not available, falling back to heuristic scanning', { filename });
  } catch (error: any) {
    logger.error('[VIRUS_SCAN] ClamAV error, falling back to heuristics', { error: error.message, filename });
  }

  // Fallback to heuristic scanning
  return heuristicVirusScan(buffer, filename);
}

/**
 * Scan file using ClamAV daemon (clamd) or clamscan CLI
 */
async function scanWithClamAV(buffer: Buffer, filename: string): Promise<{
  available: boolean;
  clean: boolean;
  threat?: string;
}> {
  try {
    // Check if ClamAV is installed
    try {
      await execAsync('which clamscan');
    } catch {
      // ClamAV not installed
      return { available: false, clean: false };
    }

    // Write buffer to temporary file for scanning
    const fs = require('fs').promises;
    const tempFile = `/tmp/scan_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`;

    try {
      await fs.writeFile(tempFile, buffer);

      // Run ClamAV scan (timeout after 30 seconds)
      const { stdout, stderr } = await execAsync(`clamscan --no-summary ${tempFile}`, {
        timeout: 30000
      });

      // Clean up temp file
      await fs.unlink(tempFile);

      const output = stdout + stderr;

      // Check if virus was found
      if (output.includes('FOUND')) {
        const threatMatch = output.match(/: (.+) FOUND/);
        const threat = threatMatch ? threatMatch[1] : 'Unknown threat';

        logger.warn('[VIRUS_SCAN] ClamAV detected threat', { filename, threat });
        return {
          available: true,
          clean: false,
          threat
        };
      }

      // File is clean
      logger.info('[VIRUS_SCAN] ClamAV scan passed', { filename });
      return {
        available: true,
        clean: true
      };
    } catch (error: any) {
      // Clean up temp file on error
      try {
        await fs.unlink(tempFile);
      } catch {}

      // If timeout or scan error, treat as unavailable
      if (error.code === 'ETIMEDOUT' || error.killed) {
        logger.error('[VIRUS_SCAN] ClamAV scan timeout', { filename });
        return { available: false, clean: false };
      }

      throw error;
    }
  } catch (error: any) {
    logger.error('[VIRUS_SCAN] ClamAV error', { error: error.message });
    return { available: false, clean: false };
  }
}

/**
 * Heuristic virus scanning (fallback when ClamAV unavailable)
 * Checks for common malware patterns and suspicious content
 */
function heuristicVirusScan(buffer: Buffer, filename: string): {
  clean: boolean;
  threat?: string;
  engine: 'heuristic';
  error?: string;
} {
  // 1. Size check - extremely large files are suspicious
  if (buffer.length > 100 * 1024 * 1024) { // 100MB
    return {
      clean: false,
      threat: 'File exceeds maximum safe size',
      engine: 'heuristic'
    };
  }

  // 2. Check file signature for executables
  const signatureCheck = checkFileSignature(buffer);
  if (!signatureCheck.safe) {
    return {
      clean: false,
      threat: signatureCheck.detectedType,
      engine: 'heuristic'
    };
  }

  // 3. Check for embedded scripts in text-based files
  const content = buffer.toString('binary');
  const suspiciousPatterns = [
    { pattern: 'eval(', threat: 'JavaScript eval() detected' },
    { pattern: '<script', threat: 'Embedded script tag detected' },
    { pattern: 'javascript:', threat: 'JavaScript protocol detected' },
    { pattern: 'vbscript:', threat: 'VBScript protocol detected' },
    { pattern: 'onclick=', threat: 'Inline event handler detected' },
    { pattern: 'onerror=', threat: 'Error handler detected' },
    { pattern: /powershell.*-enc/i, threat: 'PowerShell encoded command detected' },
    { pattern: /cmd\.exe.*\/c/i, threat: 'Command execution detected' },
  ];

  for (const { pattern, threat } of suspiciousPatterns) {
    const regex = pattern instanceof RegExp ? pattern : new RegExp(pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    if (regex.test(content)) {
      logger.warn('[VIRUS_SCAN] Heuristic detected suspicious pattern', { filename, threat });
      return {
        clean: false,
        threat,
        engine: 'heuristic'
      };
    }
  }

  // 4. Check for Office macro indicators
  if (content.includes('macrosheet') || content.includes('xl/macrosheets')) {
    return {
      clean: false,
      threat: 'Excel 4.0 macro detected',
      engine: 'heuristic'
    };
  }

  logger.info('[VIRUS_SCAN] Heuristic scan passed', { filename });
  return {
    clean: true,
    engine: 'heuristic'
  };
}

/**
 * Complete file security validation pipeline
 */
export async function secureFileValidation(buffer: Buffer, originalFilename: string): Promise<{
  valid: boolean;
  secureFilename?: string;
  errors: string[];
  warnings: string[];
}> {
  const errors: string[] = [];
  const warnings: string[] = [];

  try {
    // 1. Sanitize filename
    const sanitized = sanitizeFilename(originalFilename);
    const secureFilename = generateSecureFilename(sanitized);

    // 2. Validate extension
    const extValidation = validateFileExtension(originalFilename);
    if (!extValidation.valid) {
      errors.push(extValidation.error!);
    }

    // 3. Validate file size
    const sizeValidation = validateFileSize(buffer.length);
    if (!sizeValidation.valid) {
      errors.push(sizeValidation.error!);
    }

    // 4. Check file signature
    const signatureCheck = checkFileSignature(buffer);
    if (!signatureCheck.safe) {
      errors.push(signatureCheck.error!);
    }

    // 5. Virus scan
    const virusScanResult = await scanForVirus(buffer, sanitized);
    if (!virusScanResult.clean) {
      errors.push(`Virus/malware detected: ${virusScanResult.threat || 'Unknown threat'}`);
    }

    if (virusScanResult.engine === 'heuristic') {
      warnings.push('ClamAV unavailable - using heuristic scanning');
    }

    return {
      valid: errors.length === 0,
      secureFilename,
      errors,
      warnings
    };
  } catch (error: any) {
    logger.error('[FILE_VALIDATION] Validation error', { error: error.message });
    errors.push(`Validation failed: ${error.message}`);
    return {
      valid: false,
      errors,
      warnings
    };
  }
}
