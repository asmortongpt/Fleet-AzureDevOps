/**
 * Live Region Component
 * For screen reader announcements
 */

import { LiveRegionProps } from '@/lib/accessibility';

export function LiveRegion({
  message,
  ariaLive = 'polite',
  ariaAtomic = true,
  className = '',
}: LiveRegionProps) {
  if (!message) return null;

  return (
    <div
      role="status"
      aria-live={ariaLive}
      aria-atomic={ariaAtomic}
      className={`sr-only ${className}`}
    >
      {message}
    </div>
  );
}
