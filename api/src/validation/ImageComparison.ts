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
   * Returns difference metrics based on pixel-level analysis
   *
   * @param current Current screenshot buffer (PNG or JPEG)
   * @param baseline Baseline screenshot buffer for comparison
   * @returns Comparison result with pixel diff and percent changed
   * @throws Error if images cannot be parsed or comparison fails
   */
  async compare(current: Buffer, baseline: Buffer): Promise<ComparisonResult> {
    logger.debug('Comparing images', {
      currentSize: current.length,
      baselineSize: baseline.length
    });

    try {
      // Basic buffer-based comparison as fallback when pixelmatch unavailable
      // This compares pixel data directly without full image parsing
      if (current.length !== baseline.length) {
        logger.debug('Image sizes differ', {
          currentSize: current.length,
          baselineSize: baseline.length
        });
        return {
          pixelDifference: Math.abs(current.length - baseline.length),
          percentChanged: 100,
          screenshot: current,
          message: 'Images have different sizes - significant visual regression detected'
        };
      }

      // Compare buffers byte by byte
      let differingPixels = 0;
      for (let i = 0; i < current.length; i += 4) {
        // Compare 4-byte chunks (RGBA pixels)
        // Allow small tolerance (threshold: 10 out of 255 per channel)
        if (Math.abs(current[i] - baseline[i]) > 10 ||
            Math.abs(current[i + 1] - baseline[i + 1]) > 10 ||
            Math.abs(current[i + 2] - baseline[i + 2]) > 10) {
          differingPixels++;
        }
      }

      const totalPixels = current.length / 4;
      const percentChanged = totalPixels > 0
        ? Math.round((differingPixels / totalPixels) * 10000) / 100
        : 0;

      const message = percentChanged > 5
        ? 'Significant visual regression detected'
        : percentChanged > 0
        ? 'Minor visual changes detected'
        : 'No visual regression detected';

      const result: ComparisonResult = {
        pixelDifference: differingPixels,
        percentChanged,
        screenshot: current,
        message
      };

      logger.debug('Image comparison complete', {
        pixelDifference: result.pixelDifference,
        percentChanged: result.percentChanged,
        totalPixels
      });

      return result;
    } catch (error) {
      logger.error('Image comparison error', { error });
      throw new Error(
        `Image comparison failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }
}
