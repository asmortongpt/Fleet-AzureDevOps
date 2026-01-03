/**
 * BuildVersion Component
 *
 * Displays the current build version and timestamp
 */

export function BuildVersion() {
  const version = import.meta.env.VITE_APP_VERSION || '1.0.0';
  const buildDate = new Date().toLocaleDateString();

  return (
    <div
      className="fixed bottom-2 left-2 z-[100] text-[10px] text-slate-400 dark:text-slate-600 font-mono pointer-events-none select-none"
      aria-label={`Build version ${version} built on ${buildDate}`}
    >
      v{version} | {buildDate}
    </div>
  );
}
