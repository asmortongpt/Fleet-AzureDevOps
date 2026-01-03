/**
 * Automatic Version Checker
 * Detects new deployments and auto-refreshes the page
 */

// Generate build version from current timestamp
import logger from '@/utils/logger'
export const BUILD_VERSION = import.meta.env.VITE_BUILD_VERSION || Date.now().toString();

export function startVersionChecker() {
  // Only run in production
  if (import.meta.env.DEV) {
    logger.info('📦 Version checker disabled in development mode');
    return;
  }

  logger.info(`🚀 Fleet Management v${BUILD_VERSION} - Auto-refresh enabled`);

  // Check for new version every 5 minutes
  const CHECK_INTERVAL = 5 * 60 * 1000; // 5 minutes

  setInterval(async () => {
    try {
      // Fetch the HTML with cache-busting query param
      const response = await fetch(`/?v=${Date.now()}`, {
        cache: 'no-cache',
        headers: {
          'Cache-Control': 'no-cache'
        }
      });

      const html = await response.text();

      // Extract version from HTML comment (we'll add this in build)
      const versionMatch = html.match(/<!-- BUILD_VERSION: ([a-zA-Z0-9]+) -->/);

      if (versionMatch) {
        const serverVersion = versionMatch[1];

        if (serverVersion !== BUILD_VERSION) {
          logger.info(`🔄 New version detected: ${serverVersion} (current: ${BUILD_VERSION})`);
          logger.info('♻️  Auto-refreshing to load new version...');

          // Show notification if available
          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('Fleet Update Available', {
              body: 'Loading new version...',
              icon: '/favicon.ico'
            });
          }

          // Wait 2 seconds then hard reload
          setTimeout(() => {
            window.location.reload();
          }, 2000);
        }
      }
    } catch (error) {
      logger.error('Version check failed:', { error });
    }
  }, CHECK_INTERVAL);
}

// Auto-start on import
if (typeof window !== 'undefined') {
  // Run first check after 10 seconds
  setTimeout(startVersionChecker, 10000);
}
