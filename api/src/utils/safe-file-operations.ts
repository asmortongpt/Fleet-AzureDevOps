/**
 * Safe File Operations Utility
 *
 * Prevents path traversal attacks and file inclusion vulnerabilities by:
 * 1. Validating that resolved paths are within allowed directories
 * 2. Sanitizing user input to remove ../, absolute paths, etc.
 * 3. Providing safe wrappers around fs operations
 *
 * SECURITY: Always use these functions when dealing with user-provided file paths
 */

import fs from 'fs/promises';
import fsSync from 'fs';
import path from 'path';
import { Readable } from 'stream';

/**
 * Security error for path traversal attempts
 */
export class PathTraversalError extends Error {
  constructor(attemptedPath: string, allowedDirectory: string) {
    super(`Path traversal detected: "${attemptedPath}" is outside allowed directory "${allowedDirectory}"`);
    this.name = 'PathTraversalError';
  }
}

/**
 * Validate that a resolved path is within an allowed directory
 * Prevents path traversal attacks using ../ or absolute paths
 */
export function validatePathWithinDirectory(
  filePath: string,
  allowedDirectory: string
): string {
  // Resolve both paths to absolute paths
  const resolvedAllowedDir = path.resolve(allowedDirectory);
  const resolvedPath = path.resolve(allowedDirectory, filePath);

  // Check if the resolved path starts with the allowed directory
  // Use path.relative to ensure we're checking properly across platforms
  const relativePath = path.relative(resolvedAllowedDir, resolvedPath);

  // If relative path starts with .. or is absolute, it's outside the allowed directory
  if (relativePath.startsWith('..') || path.isAbsolute(relativePath)) {
    throw new PathTraversalError(filePath, allowedDirectory);
  }

  return resolvedPath;
}

/**
 * Sanitize a file path by removing dangerous patterns
 * Removes: ../, ..\, absolute paths, null bytes
 */
export function sanitizeFilePath(filePath: string): string {
  if (!filePath) {
    throw new Error('File path cannot be empty');
  }

  // Remove null bytes
  let sanitized = filePath.replace(/\0/g, '');

  // Remove leading slashes (prevent absolute paths)
  sanitized = sanitized.replace(/^[/\\]+/, '');

  // Normalize path separators
  sanitized = sanitized.split(path.sep).join('/');

  // Remove parent directory references
  const parts = sanitized.split('/').filter(part => {
    return part !== '..' && part !== '.' && part !== '';
  });

  return parts.join('/');
}

/**
 * Safe file read - ensures path is within allowed directory
 */
export async function safeReadFile(
  filePath: string,
  allowedDirectory: string,
  options?: { encoding?: BufferEncoding }
): Promise<string | Buffer> {
  const validatedPath = validatePathWithinDirectory(filePath, allowedDirectory);

  // Check if file exists
  try {
    await fs.access(validatedPath, fsSync.constants.R_OK);
  } catch {
    throw new Error(`File not found or not readable: ${filePath}`);
  }

  if (options?.encoding) {
    return await fs.readFile(validatedPath, options.encoding);
  }
  return await fs.readFile(validatedPath);
}

/**
 * Safe file read (synchronous) - ensures path is within allowed directory
 */
export function safeReadFileSync(
  filePath: string,
  allowedDirectory: string,
  options?: { encoding?: BufferEncoding }
): string | Buffer {
  const validatedPath = validatePathWithinDirectory(filePath, allowedDirectory);

  // Check if file exists
  try {
    fsSync.accessSync(validatedPath, fsSync.constants.R_OK);
  } catch {
    throw new Error(`File not found or not readable: ${filePath}`);
  }

  if (options?.encoding) {
    return fsSync.readFileSync(validatedPath, options.encoding);
  }
  return fsSync.readFileSync(validatedPath);
}

/**
 * Safe file write - ensures path is within allowed directory
 */
export async function safeWriteFile(
  filePath: string,
  allowedDirectory: string,
  data: string | Buffer,
  options?: { encoding?: BufferEncoding; flag?: string }
): Promise<void> {
  const validatedPath = validatePathWithinDirectory(filePath, allowedDirectory);

  // Ensure parent directory exists
  await fs.mkdir(path.dirname(validatedPath), { recursive: true });

  await fs.writeFile(validatedPath, data, options);
}

/**
 * Safe file delete - ensures path is within allowed directory
 */
export async function safeDeleteFile(
  filePath: string,
  allowedDirectory: string
): Promise<void> {
  const validatedPath = validatePathWithinDirectory(filePath, allowedDirectory);

  try {
    await fs.unlink(validatedPath);
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      throw new Error(`File not found: ${filePath}`);
    }
    throw error;
  }
}

/**
 * Safe file stat - ensures path is within allowed directory
 */
export async function safeStatFile(
  filePath: string,
  allowedDirectory: string
): Promise<fs.Stats> {
  const validatedPath = validatePathWithinDirectory(filePath, allowedDirectory);

  try {
    return await fs.stat(validatedPath);
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      throw new Error(`File not found: ${filePath}`);
    }
    throw error;
  }
}

/**
 * Safe file exists check - ensures path is within allowed directory
 */
export async function safeFileExists(
  filePath: string,
  allowedDirectory: string
): Promise<boolean> {
  try {
    const validatedPath = validatePathWithinDirectory(filePath, allowedDirectory);
    await fs.access(validatedPath, fsSync.constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

/**
 * Safe create read stream - ensures path is within allowed directory
 */
export function safeCreateReadStream(
  filePath: string,
  allowedDirectory: string,
  options?: {
    flags?: string;
    encoding?: BufferEncoding;
    fd?: number;
    mode?: number;
    autoClose?: boolean;
    start?: number;
    end?: number;
    highWaterMark?: number;
  }
): fsSync.ReadStream {
  const validatedPath = validatePathWithinDirectory(filePath, allowedDirectory);

  // Check if file exists and is readable
  try {
    fsSync.accessSync(validatedPath, fsSync.constants.R_OK);
  } catch {
    throw new Error(`File not found or not readable: ${filePath}`);
  }

  return fsSync.createReadStream(validatedPath, options);
}

/**
 * Safe create write stream - ensures path is within allowed directory
 */
export function safeCreateWriteStream(
  filePath: string,
  allowedDirectory: string,
  options?: {
    flags?: string;
    encoding?: BufferEncoding;
    fd?: number;
    mode?: number;
    autoClose?: boolean;
    start?: number;
  }
): fsSync.WriteStream {
  const validatedPath = validatePathWithinDirectory(filePath, allowedDirectory);

  // Ensure parent directory exists
  const parentDir = path.dirname(validatedPath);
  if (!fsSync.existsSync(parentDir)) {
    fsSync.mkdirSync(parentDir, { recursive: true });
  }

  return fsSync.createWriteStream(validatedPath, options);
}

/**
 * Safe file copy - ensures both paths are within allowed directory
 */
export async function safeCopyFile(
  sourcePath: string,
  destPath: string,
  allowedDirectory: string
): Promise<void> {
  const validatedSourcePath = validatePathWithinDirectory(sourcePath, allowedDirectory);
  const validatedDestPath = validatePathWithinDirectory(destPath, allowedDirectory);

  // Ensure destination directory exists
  await fs.mkdir(path.dirname(validatedDestPath), { recursive: true });

  await fs.copyFile(validatedSourcePath, validatedDestPath);
}

/**
 * Safe file move/rename - ensures both paths are within allowed directory
 */
export async function safeMoveFile(
  sourcePath: string,
  destPath: string,
  allowedDirectory: string
): Promise<void> {
  const validatedSourcePath = validatePathWithinDirectory(sourcePath, allowedDirectory);
  const validatedDestPath = validatePathWithinDirectory(destPath, allowedDirectory);

  // Ensure destination directory exists
  await fs.mkdir(path.dirname(validatedDestPath), { recursive: true });

  await fs.rename(validatedSourcePath, validatedDestPath);
}

/**
 * Get safe file path - validates and returns the absolute path
 * Useful when you need the validated path for other operations
 */
export function getSafeFilePath(
  filePath: string,
  allowedDirectory: string
): string {
  return validatePathWithinDirectory(filePath, allowedDirectory);
}
