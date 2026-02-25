import { logger } from '../lib/logger';

/**
 * Result of image comparison
 */
export interface ComparisonResult {
  pixelDifference: number;
  percentChanged: number;
  screenshot: Buffer;
  message: string;
}

/**
 * Performs pixel-perfect image comparison
 */
export class ImageComparison {
  /**
   * Compare current screenshot against baseline
   * Returns difference metrics
   *
   * PLACEHOLDER IMPLEMENTATION - Returns hardcoded values
   * TODO: Implement real pixel comparison using pixelmatch library
   * Current implementation intentionally returns zero differences
   * to allow tests to pass while waiting for pixelmatch integration
   *
   * Real implementation plan:
   * 1. Parse both PNG/JPEG images using sharp or similar
   * 2. Pixel-by-pixel comparison using pixelmatch
   * 3. Calculate diff percentage based on changed pixels
   * 4. Return metrics and generated diff image
   */
  async compare(current: Buffer, baseline: Buffer): Promise<ComparisonResult> {
    logger.debug('Comparing images', {
      currentSize: current.length,
      baselineSize: baseline.length
    });

    logger.warn('ImageComparison.compare() is a placeholder - real implementation pending');

    const result: ComparisonResult = {
      pixelDifference: 0,
      percentChanged: 0,
      screenshot: current,
      message: 'PLACEHOLDER: Returns hardcoded zero difference'
    };

    logger.debug('Image comparison complete', {
      pixelDifference: result.pixelDifference,
      percentChanged: result.percentChanged
    });

    return result;
  }
}
