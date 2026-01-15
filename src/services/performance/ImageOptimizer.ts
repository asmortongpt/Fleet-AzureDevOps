// Image Optimization Service
// Lazy loading, WebP conversion, responsive images

export class ImageOptimizer {
  static observeLazyImages(): void {
    if ('IntersectionObserver' in window) {
      const imageObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const img = entry.target as HTMLImageElement;
            const dataSrc = img.getAttribute('data-src');

            if (dataSrc) {
              img.src = dataSrc;
              img.removeAttribute('data-src');
              imageObserver.unobserve(img);
            }
          }
        });
      });

      document.querySelectorAll('img[data-src]').forEach(img => {
        imageObserver.observe(img);
      });
    }
  }

  static getSrcSet(imagePath: string, sizes: number[]): string {
    return sizes
      .map(size => `${imagePath}?w=${size} ${size}w`)
      .join(', ');
  }

  static supportsWebP(): Promise<boolean> {
    return new Promise(resolve => {
      const webP = new Image();
      webP.onload = webP.onerror = () => {
        resolve(webP.height === 2);
      };
      webP.src = 'data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA';
    });
  }

  static async convertToWebP(blob: Blob): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const reader = new FileReader();

      reader.onload = (e) => {
        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;

          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0);

          canvas.toBlob((webpBlob) => {
            if (webpBlob) {
              resolve(webpBlob);
            } else {
              reject(new Error('WebP conversion failed'));
            }
          }, 'image/webp', 0.8);
        };
        img.src = e.target?.result as string;
      };

      reader.readAsDataURL(blob);
    });
  }
}
