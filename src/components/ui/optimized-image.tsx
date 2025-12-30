import { useState, useEffect, useRef } from 'react';

interface OptimizedImageProps {
  src: string;
  alt: string;
  width: number;
  height: number;
  priority?: boolean;
}

export function OptimizedImage({
  src,
  alt,
  width,
  height,
  priority = false
}: OptimizedImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(priority);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (priority) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { rootMargin: '50px' }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, [priority]);

  const srcSet = `
    ${src}.avif 1x,
    ${src}@2x.avif 2x,
    ${src}.webp 1x,
    ${src}@2x.webp 2x,
    ${src}.jpg 1x,
    ${src}@2x.jpg 2x
  `;

  return (
    <div
      className="relative overflow-hidden"
      style={{ width, height }}
    >
      {!isLoaded && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse" />
      )}
      {isInView && (
        <img
          ref={imgRef}
          src={`${src}.jpg`}
          srcSet={srcSet}
          alt={alt}
          width={width}
          height={height}
          loading={priority ? 'eager' : 'lazy'}
          onLoad={() => setIsLoaded(true)}
          className="w-full h-full object-cover"
          style={{ transition: 'opacity 0.3s ease-in-out' }}
        />
      )}
    </div>
  );
}