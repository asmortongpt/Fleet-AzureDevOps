/**
 * Image Optimization Utilities
 * Provides client-side image optimization and lazy loading
 */

export interface ImageOptimizationOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: 'jpeg' | 'png' | 'webp';
}

/**
 * Compress and optimize an image file
 */
export async function optimizeImage(
  file: File,
  options: ImageOptimizationOptions = {}
): Promise<Blob> {
  const {
    maxWidth = 1920,
    maxHeight = 1080,
    quality = 0.85,
    format = 'jpeg',
  } = options;

  return new Promise((resolve, reject) => {
    const img = new Image();
    const reader = new FileReader();

    reader.onload = (e) => {
      img.src = e.target?.result as string;
    };

    reader.onerror = reject;

    img.onload = () => {
      try {
        // Calculate new dimensions maintaining aspect ratio
        let { width, height } = img;

        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }

        if (height > maxHeight) {
          width = (width * maxHeight) / height;
          height = maxHeight;
        }

        // Create canvas and draw resized image
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        // Convert to blob
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Failed to create blob'));
            }
          },
          `image/${format}`,
          quality
        );
      } catch (error) {
        reject(error);
      }
    };

    img.onerror = reject;

    reader.readAsDataURL(file);
  });
}

/**
 * Generate responsive image URLs for different screen sizes
 */
export function generateResponsiveUrls(baseUrl: string): {
  sm: string;
  md: string;
  lg: string;
  xl: string;
} {
  // This assumes a CDN or image service that supports URL parameters
  // Adjust based on your image service (e.g., Cloudinary, imgix)
  return {
    sm: `${baseUrl}?w=640&q=75`,
    md: `${baseUrl}?w=768&q=80`,
    lg: `${baseUrl}?w=1024&q=85`,
    xl: `${baseUrl}?w=1920&q=90`,
  };
}

/**
 * Get optimal image format based on browser support
 */
export function getOptimalFormat(): 'webp' | 'jpeg' {
  const canvas = document.createElement('canvas');
  canvas.width = 1;
  canvas.height = 1;

  const webpSupport = canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;

  return webpSupport ? 'webp' : 'jpeg';
}

/**
 * Lazy load images with Intersection Observer
 */
export function setupLazyLoading(selector = 'img[data-src]') {
  if ('IntersectionObserver' in window) {
    const lazyImages = document.querySelectorAll(selector);

    const imageObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const img = entry.target as HTMLImageElement;
            const src = img.dataset.src;

            if (src) {
              img.src = src;
              img.classList.remove('lazy');
              img.classList.add('loaded');
              observer.unobserve(img);
            }
          }
        });
      },
      {
        rootMargin: '50px 0px',
        threshold: 0.01,
      }
    );

    lazyImages.forEach((img) => imageObserver.observe(img));

    return () => {
      lazyImages.forEach((img) => imageObserver.unobserve(img));
    };
  } else {
    // Fallback for browsers without Intersection Observer
    const lazyImages = document.querySelectorAll(selector) as NodeListOf<HTMLImageElement>;
    lazyImages.forEach((img) => {
      if (img.dataset.src) {
        img.src = img.dataset.src;
      }
    });
  }
}

/**
 * Preload critical images
 */
export function preloadImage(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = reject;
    img.src = src;
  });
}

/**
 * Preload multiple images
 */
export async function preloadImages(urls: string[]): Promise<void> {
  await Promise.all(urls.map((url) => preloadImage(url)));
}

/**
 * Convert image to base64
 */
export async function imageToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Failed to convert to base64'));
      }
    };

    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Get image dimensions
 */
export async function getImageDimensions(
  file: File
): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const reader = new FileReader();

    reader.onload = (e) => {
      img.src = e.target?.result as string;
    };

    reader.onerror = reject;

    img.onload = () => {
      resolve({
        width: img.width,
        height: img.height,
      });
    };

    img.onerror = reject;

    reader.readAsDataURL(file);
  });
}

/**
 * Generate thumbnail from image
 */
export async function generateThumbnail(
  file: File,
  size: number = 150
): Promise<Blob> {
  return optimizeImage(file, {
    maxWidth: size,
    maxHeight: size,
    quality: 0.7,
  });
}

/**
 * Batch optimize images
 */
export async function batchOptimizeImages(
  files: File[],
  options: ImageOptimizationOptions = {}
): Promise<Blob[]> {
  return Promise.all(files.map((file) => optimizeImage(file, options)));
}

/**
 * Calculate image file size reduction
 */
export function calculateSizeReduction(originalSize: number, newSize: number): {
  reduction: number;
  percentage: number;
} {
  const reduction = originalSize - newSize;
  const percentage = (reduction / originalSize) * 100;

  return {
    reduction,
    percentage: Math.round(percentage * 100) / 100,
  };
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${Math.round((bytes / Math.pow(k, i)) * 100) / 100} ${sizes[i]}`;
}

/**
 * Check if file is an image
 */
export function isImageFile(file: File): boolean {
  return file.type.startsWith('image/');
}

/**
 * Validate image file
 */
export interface ImageValidationOptions {
  maxSize?: number; // in bytes
  minWidth?: number;
  minHeight?: number;
  maxWidth?: number;
  maxHeight?: number;
  allowedFormats?: string[];
}

export async function validateImageFile(
  file: File,
  options: ImageValidationOptions = {}
): Promise<{ valid: boolean; error?: string }> {
  const {
    maxSize = 10 * 1024 * 1024, // 10MB default
    minWidth = 0,
    minHeight = 0,
    maxWidth = 10000,
    maxHeight = 10000,
    allowedFormats = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  } = options;

  // Check file type
  if (!allowedFormats.includes(file.type)) {
    return {
      valid: false,
      error: `Invalid file format. Allowed formats: ${allowedFormats.join(', ')}`,
    };
  }

  // Check file size
  if (file.size > maxSize) {
    return {
      valid: false,
      error: `File size exceeds maximum allowed size of ${formatFileSize(maxSize)}`,
    };
  }

  // Check image dimensions
  try {
    const { width, height } = await getImageDimensions(file);

    if (width < minWidth || height < minHeight) {
      return {
        valid: false,
        error: `Image dimensions must be at least ${minWidth}x${minHeight}px`,
      };
    }

    if (width > maxWidth || height > maxHeight) {
      return {
        valid: false,
        error: `Image dimensions must not exceed ${maxWidth}x${maxHeight}px`,
      };
    }

    return { valid: true };
  } catch (error) {
    return {
      valid: false,
      error: 'Failed to validate image dimensions',
    };
  }
}
