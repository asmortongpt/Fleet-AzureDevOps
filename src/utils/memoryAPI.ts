/**
 * Memory API Utility
 *
 * Provides memory usage information using the Performance API
 * Falls back to 0 if the API is not available
 */

/**
 * Gets the current memory usage in megabytes (MB)
 *
 * @returns Memory usage in MB, or 0 if performance.memory is not available
 */
export function getMemoryUsage(): number {
  // Check if performance API exists and has memory property
  if (typeof performance !== 'undefined' && 'memory' in performance) {
    const memory = (performance as any).memory;

    // usedJSHeapSize is the total amount of memory being used by JS objects including V8 internal objects
    if (memory && typeof memory.usedJSHeapSize === 'number') {
      // Convert bytes to megabytes
      return memory.usedJSHeapSize / (1024 * 1024);
    }
  }

  // Return 0 if performance.memory is not available (e.g., non-Chromium browsers or disabled)
  return 0;
}

/**
 * Gets detailed memory information if available
 *
 * @returns Memory details object with jsHeapSizeLimit, totalJSHeapSize, and usedJSHeapSize in MB
 */
export function getDetailedMemoryInfo(): { jsHeapSizeLimit: number; totalJSHeapSize: number; usedJSHeapSize: number } | null {
  if (typeof performance !== 'undefined' && 'memory' in performance) {
    const memory = (performance as any).memory;

    if (memory) {
      return {
        jsHeapSizeLimit: memory.jsHeapSizeLimit / (1024 * 1024),
        totalJSHeapSize: memory.totalJSHeapSize / (1024 * 1024),
        usedJSHeapSize: memory.usedJSHeapSize / (1024 * 1024),
      };
    }
  }

  return null;
}
