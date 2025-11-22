/**
 * Service Worker Registration Module
 *
 * Handles registration, updates, and lifecycle management of the Service Worker.
 * Provides update notifications when a new version is available.
 */

export interface ServiceWorkerConfig {
  /** Callback when service worker is ready */
  onReady?: (registration: ServiceWorkerRegistration) => void;
  /** Callback when a new version is available */
  onUpdate?: (registration: ServiceWorkerRegistration) => void;
  /** Callback when content is cached for offline use */
  onSuccess?: (registration: ServiceWorkerRegistration) => void;
  /** Callback when registration fails */
  onError?: (error: Error) => void;
  /** Callback when service worker sends a message */
  onMessage?: (message: MessageEvent) => void;
}

// Store the current registration globally
let swRegistration: ServiceWorkerRegistration | null = null;

/**
 * Check if service workers are supported in the current browser
 */
export function isServiceWorkerSupported(): boolean {
  return 'serviceWorker' in navigator;
}

/**
 * Register the service worker with optional callbacks
 */
export async function registerServiceWorker(
  config: ServiceWorkerConfig = {}
): Promise<ServiceWorkerRegistration | null> {
  if (!isServiceWorkerSupported()) {
    console.warn('[ServiceWorker] Service workers are not supported in this browser');
    return null;
  }

  // Only register in production or when explicitly enabled
  const shouldRegister =
    import.meta.env.PROD ||
    import.meta.env.VITE_ENABLE_SW === 'true';

  if (!shouldRegister) {
    console.log('[ServiceWorker] Skipping registration in development mode');
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/',
      updateViaCache: 'none', // Always check for updates
    });

    swRegistration = registration;

    console.log('[ServiceWorker] Registration successful:', registration.scope);

    // Handle different registration states
    if (registration.installing) {
      console.log('[ServiceWorker] Installing...');
      trackInstallation(registration.installing, config);
    } else if (registration.waiting) {
      console.log('[ServiceWorker] New version waiting');
      config.onUpdate?.(registration);
    } else if (registration.active) {
      console.log('[ServiceWorker] Active');
      config.onReady?.(registration);
    }

    // Listen for update found events
    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing;
      if (newWorker) {
        console.log('[ServiceWorker] Update found, new version installing...');
        trackInstallation(newWorker, config);
      }
    });

    // Listen for messages from the service worker
    navigator.serviceWorker.addEventListener('message', (event) => {
      console.log('[ServiceWorker] Message from SW:', event.data);
      config.onMessage?.(event);

      // Handle specific message types
      if (event.data?.type === 'SW_ACTIVATED') {
        console.log(`[ServiceWorker] New version activated: ${event.data.version}`);
      }
    });

    // Check for updates periodically (every 60 minutes)
    setInterval(() => {
      console.log('[ServiceWorker] Checking for updates...');
      registration.update().catch((err) => {
        console.warn('[ServiceWorker] Update check failed:', err);
      });
    }, 60 * 60 * 1000);

    return registration;
  } catch (error) {
    console.error('[ServiceWorker] Registration failed:', error);
    config.onError?.(error as Error);
    return null;
  }
}

/**
 * Track the installation state of a service worker
 */
function trackInstallation(
  worker: ServiceWorker,
  config: ServiceWorkerConfig
): void {
  worker.addEventListener('statechange', () => {
    console.log('[ServiceWorker] State changed:', worker.state);

    switch (worker.state) {
      case 'installed':
        if (navigator.serviceWorker.controller) {
          // New version installed while old one was active
          console.log('[ServiceWorker] New version available');
          if (swRegistration) {
            config.onUpdate?.(swRegistration);
          }
        } else {
          // First install
          console.log('[ServiceWorker] Content cached for offline use');
          if (swRegistration) {
            config.onSuccess?.(swRegistration);
          }
        }
        break;

      case 'activated':
        console.log('[ServiceWorker] Activated');
        if (swRegistration) {
          config.onReady?.(swRegistration);
        }
        break;

      case 'redundant':
        console.log('[ServiceWorker] Redundant (replaced by newer version)');
        break;
    }
  });
}

/**
 * Unregister all service workers
 */
export async function unregisterServiceWorker(): Promise<boolean> {
  if (!isServiceWorkerSupported()) {
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.getRegistration();
    if (registration) {
      const success = await registration.unregister();
      console.log('[ServiceWorker] Unregistered:', success);
      swRegistration = null;
      return success;
    }
    return false;
  } catch (error) {
    console.error('[ServiceWorker] Unregister failed:', error);
    return false;
  }
}

/**
 * Tell the waiting service worker to skip waiting and activate immediately
 */
export function skipWaiting(): void {
  if (swRegistration?.waiting) {
    swRegistration.waiting.postMessage({ type: 'SKIP_WAITING' });
  }
}

/**
 * Force update check
 */
export async function checkForUpdates(): Promise<void> {
  if (swRegistration) {
    try {
      await swRegistration.update();
      console.log('[ServiceWorker] Update check completed');
    } catch (error) {
      console.error('[ServiceWorker] Update check failed:', error);
    }
  }
}

/**
 * Get the current service worker version
 */
export function getServiceWorkerVersion(): Promise<string | null> {
  return new Promise((resolve) => {
    if (!navigator.serviceWorker.controller) {
      resolve(null);
      return;
    }

    const messageChannel = new MessageChannel();

    messageChannel.port1.onmessage = (event) => {
      if (event.data?.type === 'VERSION') {
        resolve(event.data.version);
      } else {
        resolve(null);
      }
    };

    navigator.serviceWorker.controller.postMessage(
      { type: 'GET_VERSION' },
      [messageChannel.port2]
    );

    // Timeout after 5 seconds
    setTimeout(() => resolve(null), 5000);
  });
}

/**
 * Clear all caches managed by the service worker
 */
export async function clearCaches(): Promise<void> {
  const cacheNames = await caches.keys();
  const ctafleetCaches = cacheNames.filter((name) =>
    name.startsWith('ctafleet-')
  );

  await Promise.all(
    ctafleetCaches.map((name) => {
      console.log('[ServiceWorker] Clearing cache:', name);
      return caches.delete(name);
    })
  );

  console.log('[ServiceWorker] All caches cleared');
}

/**
 * Show a notification to the user about a new version
 * Returns true if user wants to update, false otherwise
 */
export function showUpdateNotification(): Promise<boolean> {
  return new Promise((resolve) => {
    // Create a simple notification banner
    const banner = document.createElement('div');
    banner.id = 'sw-update-banner';
    banner.style.cssText = `
      position: fixed;
      bottom: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: #1a1a2e;
      color: white;
      padding: 16px 24px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
      z-index: 10000;
      display: flex;
      align-items: center;
      gap: 16px;
      font-family: system-ui, -apple-system, sans-serif;
    `;

    banner.innerHTML = `
      <span>A new version is available!</span>
      <button id="sw-update-btn" style="
        background: #4a90d9;
        color: white;
        border: none;
        padding: 8px 16px;
        border-radius: 4px;
        cursor: pointer;
        font-weight: 500;
      ">Update Now</button>
      <button id="sw-dismiss-btn" style="
        background: transparent;
        color: #888;
        border: none;
        padding: 8px;
        cursor: pointer;
      ">Later</button>
    `;

    document.body.appendChild(banner);

    const updateBtn = document.getElementById('sw-update-btn');
    const dismissBtn = document.getElementById('sw-dismiss-btn');

    const cleanup = () => {
      banner.remove();
    };

    updateBtn?.addEventListener('click', () => {
      cleanup();
      resolve(true);
    });

    dismissBtn?.addEventListener('click', () => {
      cleanup();
      resolve(false);
    });

    // Auto-dismiss after 30 seconds
    setTimeout(() => {
      if (document.getElementById('sw-update-banner')) {
        cleanup();
        resolve(false);
      }
    }, 30000);
  });
}

/**
 * Initialize service worker with default handlers
 */
export function initializeServiceWorker(): void {
  registerServiceWorker({
    onReady: (registration) => {
      console.log('[App] Service Worker ready');
    },
    onUpdate: async (registration) => {
      console.log('[App] New version available');

      const shouldUpdate = await showUpdateNotification();
      if (shouldUpdate) {
        skipWaiting();
        // Reload after a short delay to allow activation
        setTimeout(() => {
          window.location.reload();
        }, 100);
      }
    },
    onSuccess: (registration) => {
      console.log('[App] Content cached for offline use');
    },
    onError: (error) => {
      console.error('[App] Service Worker error:', error);
    },
    onMessage: (event) => {
      // Handle custom messages from service worker
      if (event.data?.type === 'SW_ACTIVATED') {
        console.log('[App] Service Worker activated with version:', event.data.version);
      }
    },
  });
}

// Auto-initialize when module is imported (can be disabled by checking env)
if (typeof window !== 'undefined' && import.meta.env.VITE_DISABLE_SW_AUTO_INIT !== 'true') {
  // Defer initialization until the page loads
  if (document.readyState === 'complete') {
    initializeServiceWorker();
  } else {
    window.addEventListener('load', initializeServiceWorker);
  }
}
