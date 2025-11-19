import { useState, useEffect, useRef, ImgHTMLAttributes } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

interface OptimizedImageProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'src'> {
  src: string;
  alt: string;
  fallbackSrc?: string;
  placeholderSrc?: string;
  lazy?: boolean;
  aspectRatio?: number;
  objectFit?: 'cover' | 'contain' | 'fill' | 'none' | 'scale-down';
  onLoad?: () => void;
  onError?: () => void;
  showSkeleton?: boolean;
}

export function OptimizedImage({
  src,
  alt,
  fallbackSrc = '/images/placeholder.png',
  placeholderSrc,
  lazy = true,
  aspectRatio,
  objectFit = 'cover',
  onLoad,
  onError,
  showSkeleton = true,
  className = '',
  ...props
}: OptimizedImageProps) {
  const [imageSrc, setImageSrc] = useState<string>(placeholderSrc || src);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const [isInView, setIsInView] = useState(!lazy);

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (!lazy) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            observer.disconnect();
          }
        });
      },
      {
        rootMargin: '50px',
        threshold: 0.01,
      }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => {
      observer.disconnect();
    };
  }, [lazy]);

  // Load image when in view
  useEffect(() => {
    if (!isInView) return;

    const img = new Image();

    img.onload = () => {
      setImageSrc(src);
      setIsLoading(false);
      setHasError(false);
      onLoad?.();
    };

    img.onerror = () => {
      setImageSrc(fallbackSrc);
      setIsLoading(false);
      setHasError(true);
      onError?.();
    };

    img.src = src;

    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, [src, isInView, fallbackSrc, onLoad, onError]);

  const containerStyle: React.CSSProperties = aspectRatio
    ? {
        position: 'relative',
        paddingBottom: `${(1 / aspectRatio) * 100}%`,
        overflow: 'hidden',
      }
    : {};

  const imageStyle: React.CSSProperties = aspectRatio
    ? {
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        objectFit,
      }
    : {
        objectFit,
      };

  if (aspectRatio) {
    return (
      <div style={containerStyle} className={className}>
        {isLoading && showSkeleton && <Skeleton className="absolute inset-0" />}
        <img
          ref={imgRef}
          src={imageSrc}
          alt={alt}
          style={imageStyle}
          className={`transition-opacity duration-300 ${
            isLoading ? 'opacity-0' : 'opacity-100'
          }`}
          {...props}
        />
      </div>
    );
  }

  return (
    <>
      {isLoading && showSkeleton && (
        <Skeleton className={`${className} absolute inset-0`} />
      )}
      <img
        ref={imgRef}
        src={imageSrc}
        alt={alt}
        style={imageStyle}
        className={`${className} transition-opacity duration-300 ${
          isLoading ? 'opacity-0' : 'opacity-100'
        }`}
        {...props}
      />
    </>
  );
}

// Responsive image component with srcset support
interface ResponsiveImageProps extends OptimizedImageProps {
  srcSet?: {
    sm?: string;
    md?: string;
    lg?: string;
    xl?: string;
  };
}

export function ResponsiveImage({
  src,
  srcSet,
  ...props
}: ResponsiveImageProps) {
  const srcSetString = srcSet
    ? `
      ${srcSet.sm} 640w,
      ${srcSet.md} 768w,
      ${srcSet.lg} 1024w,
      ${srcSet.xl} 1920w
    `.trim()
    : undefined;

  const sizes = srcSet
    ? `
      (max-width: 640px) 640px,
      (max-width: 768px) 768px,
      (max-width: 1024px) 1024px,
      1920px
    `.trim()
    : undefined;

  return (
    <OptimizedImage
      src={src}
      srcSet={srcSetString}
      sizes={sizes}
      {...props}
    />
  );
}

// Avatar image component with fallback initials
interface AvatarImageProps extends Omit<OptimizedImageProps, 'alt'> {
  name: string;
  size?: number;
}

export function AvatarImage({ name, size = 40, src, ...props }: AvatarImageProps) {
  const [hasError, setHasError] = useState(false);

  const getInitials = (fullName: string) => {
    const names = fullName.split(' ');
    if (names.length >= 2) {
      return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
    }
    return fullName.slice(0, 2).toUpperCase();
  };

  if (!src || hasError) {
    return (
      <div
        className="flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600 text-white font-semibold rounded-full"
        style={{ width: size, height: size, fontSize: size * 0.4 }}
      >
        {getInitials(name)}
      </div>
    );
  }

  return (
    <OptimizedImage
      src={src}
      alt={name}
      className="rounded-full"
      style={{ width: size, height: size }}
      onError={() => setHasError(true)}
      objectFit="cover"
      {...props}
    />
  );
}
