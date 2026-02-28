/**
 * BuildVersion Component
 *
 * Displays the current build version and timestamp
 */

import { formatDate } from '@/utils/format-helpers';

export function BuildVersion() {
  const version = import.meta.env.VITE_APP_VERSION || '1.0.0';
  const buildDate = formatDate(new Date());

  return (
    <div
      className="fixed bottom-2 left-2 z-[100] text-[10px] text-[var(--text-secondary)] dark:text-[var(--text-primary)] font-mono pointer-events-none select-none"
      aria-label={`Build version ${version} built on ${buildDate}`}
    >
      v{version} | {buildDate}
    </div>
  );
}
