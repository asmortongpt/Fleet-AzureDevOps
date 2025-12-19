```typescript
// src/agents/CTAFleetAgent021.ts
import { createReadStream, createWriteStream } from 'fs';
import { pipeline } from 'stream';
import { promisify } from 'util';
import * as zlib from 'zlib';
import * as path from 'path';
import { Logger } from '../utils/Logger';
import { PerformanceMetrics } from '../metrics/PerformanceMetrics';
import { sanitizePath } from '../security/PathSanitizer';

const pipelineAsync = promisify(pipeline);

export class CTAFleetAgent021 {
  private readonly logger: Logger;
  private readonly metrics: PerformanceMetrics;
  private readonly compressionLevel: number;

  constructor(compressionLevel: number = 6) {
    this.logger = new Logger('CTAFleetAgent021');
    this.metrics = new PerformanceMetrics();
    this.compressionLevel = Math.max(0, Math.min(9, compressionLevel));
  }

  /**
   * Compresses an asset file using gzip compression
   * @param inputPath Path to the input file
   * @param outputPath Path for the compressed output file
   * @returns Promise with compression result
   */
  public async compressAsset(inputPath: string, outputPath: string): Promise<{ originalSize: number; compressedSize: number }> {
    try {
      // Sanitize file paths to prevent path traversal
      const safeInputPath = sanitizePath(inputPath);
      const safeOutputPath = sanitizePath(outputPath);

      // Validate file extension for output
      if (!safeOutputPath.endsWith('.gz')) {
        throw new Error('Output path must end with .gz extension');
      }

      const startTime = process.hrtime.bigint();
      this.logger.info(`Starting compression for ${safeInputPath}`);

      // Create streams for compression
      const inputStream = createReadStream(safeInputPath);
      const outputStream = createWriteStream(safeOutputPath);
      const gzip = zlib.createGzip({ level: this.compressionLevel });

      // Get original file size
      const originalSize = (await inputStream.stat()).size;

      // Perform compression using pipeline
      await pipelineAsync(inputStream, gzip, outputStream);

      // Get compressed file size
      const compressedSize = (await outputStream.stat()).size;

      const endTime = process.hrtime.bigint();
      const duration = Number(endTime - startTime) / 1e6; // Convert to milliseconds

      // Log metrics
      this.metrics.recordCompression({
        originalSize,
        compressedSize,
        duration,
        inputPath: safeInputPath,
      });

      this.logger.info(`Compression completed for ${safeInputPath}. Original: ${originalSize} bytes, Compressed: ${compressedSize} bytes`);

      return { originalSize, compressedSize };
    } catch (error) {
      this.logger.error(`Compression failed for ${inputPath}: ${error.message}`);
      throw new CompressionError(`Failed to compress asset: ${error.message}`, error);
    }
  }

  /**
   * Decompresses a gzip compressed asset
   * @param inputPath Path to the compressed file
   * @param outputPath Path for the decompressed output file
   * @returns Promise with decompression result
   */
  public async decompressAsset(inputPath: string, outputPath: string): Promise<{ compressedSize: number; decompressedSize: number }> {
    try {
      // Sanitize file paths
      const safeInputPath = sanitizePath(inputPath);
      const safeOutputPath = sanitizePath(outputPath);

      // Validate input file extension
      if (!safeInputPath.endsWith('.gz')) {
        throw new Error('Input path must end with .gz extension');
      }

      const startTime = process.hrtime.bigint();
      this.logger.info(`Starting decompression for ${safeInputPath}`);

      // Create streams for decompression
      const inputStream = createReadStream(safeInputPath);
      const outputStream = createWriteStream(safeOutputPath);
      const gunzip = zlib.createGunzip();

      // Get compressed file size
      const compressedSize = (await inputStream.stat()).size;

      // Perform decompression
      await pipelineAsync(inputStream, gunzip, outputStream);

      // Get decompressed file size
      const decompressedSize = (await outputStream.stat()).size;

      const endTime = process.hrtime.bigint();
      const duration = Number(endTime - startTime) / 1e6;

      // Log metrics
      this.metrics.recordDecompression({
        compressedSize,
        decompressedSize,
        duration,
        inputPath: safeInputPath,
      });

      this.logger.info(`Decompression completed for ${safeInputPath}. Compressed: ${compressedSize} bytes, Decompressed: ${decompressedSize} bytes`);

      return { compressedSize, decompressedSize };
    } catch (error) {
      this.logger.error(`Decompression failed for ${inputPath}: ${error.message}`);
      throw new CompressionError(`Failed to decompress asset: ${error.message}`, error);
    }
  }
}

// Custom error class for compression operations
export class CompressionError extends Error {
  constructor(message: string, public readonly cause?: Error) {
    super(message);
    this.name = 'CompressionError';
  }
}

// src/utils/Logger.ts
export class Logger {
  private readonly context: string;

  constructor(context: string) {
    this.context = context;
  }

  public info(message: string): void {
    console.log(`[INFO] [${this.context}] ${message}`);
  }

  public error(message: string): void {
    console.error(`[ERROR] [${this.context}] ${message}`);
  }
}

// src/metrics/PerformanceMetrics.ts
export class PerformanceMetrics {
  public recordCompression(data: {
    originalSize: number;
    compressedSize: number;
    duration: number;
    inputPath: string;
  }): void {
    console.log(`[METRICS] Compression - Path: ${data.inputPath}, Original: ${data.originalSize}B, Compressed: ${data.compressedSize}B, Duration: ${data.duration}ms`);
  }

  public recordDecompression(data: {
    compressedSize: number;
    decompressedSize: number;
    duration: number;
    inputPath: string;
  }): void {
    console.log(`[METRICS] Decompression - Path: ${data.inputPath}, Compressed: ${data.compressedSize}B, Decompressed: ${data.decompressedSize}B, Duration: ${data.duration}ms`);
  }
}

// src/security/PathSanitizer.ts
export function sanitizePath(filePath: string): string {
  // Normalize path to prevent directory traversal
  const normalizedPath = path.normalize(filePath);
  
  // Check if path attempts to access parent directories
  if (normalizedPath.includes('..')) {
    throw new Error('Invalid path: Directory traversal detected');
  }
  
  // Ensure path is absolute or convert to absolute
  return path.isAbsolute(normalizedPath) ? normalizedPath : path.resolve(normalizedPath);
}

// src/tests/CTAFleetAgent021.test.ts
import { CTAFleetAgent021, CompressionError } from '../agents/CTAFleetAgent021';
import { promises as fs } from 'fs';
import { join } from 'path';
import { expect } from 'bun:test';

describe('CTAFleetAgent021 - Asset Compression', () => {
  const agent = new CTAFleetAgent021();
  const testDir = join(__dirname, 'test-assets');
  const testFile = join(testDir, 'test.txt');
  const compressedFile = join(testDir, 'test.txt.gz');
  const decompressedFile = join(testDir, 'test-decompressed.txt');

  beforeAll(async () => {
    // Create test directory and file
    await fs.mkdir(testDir, { recursive: true });
    await fs.writeFile(testFile, 'This is a test content for compression');
  });

  afterAll(async () => {
    // Clean up test files
    await fs.rm(testDir, { recursive: true, force: true });
  });

  test('should compress a file successfully', async () => {
    const result = await agent.compressAsset(testFile, compressedFile);
    expect(result.originalSize).toBeGreaterThan(0);
    expect(result.compressedSize).toBeGreaterThan(0);
    expect(result.compressedSize).toBeLessThanOrEqual(result.originalSize);
    expect(await fs.exists(compressedFile)).toBe(true);
  });

  test('should decompress a file successfully', async () => {
    await agent.compressAsset(testFile, compressedFile);
    const result = await agent.decompressAsset(compressedFile, decompressedFile);
    expect(result.compressedSize).toBeGreaterThan(0);
    expect(result.decompressedSize).toBeGreaterThan(0);
    expect(result.decompressedSize).toBeGreaterThanOrEqual(result.compressedSize);
    expect(await fs.exists(decompressedFile)).toBe(true);

    // Verify content is the same
    const originalContent = await fs.readFile(testFile, 'utf-8');
    const decompressedContent = await fs.readFile(decompressedFile, 'utf-8');
    expect(decompressedContent).toBe(originalContent);
  });

  test('should throw error for invalid output extension during compression', async () => {
    await expect(agent.compressAsset(testFile, join(testDir, 'invalid.txt'))).rejects.toThrow(CompressionError);
  });

  test('should throw error for invalid input extension during decompression', async () => {
    await expect(agent.decompressAsset(testFile, decompressedFile)).rejects.toThrow(CompressionError);
  });

  test('should throw error for path traversal attempt', async () => {
    await expect(agent.compressAsset('../malicious/path.txt', compressedFile)).rejects.toThrow(Error);
  });
});
```
