/**
 * PWA Install Prompt Component
 *
 * Smart, non-intrusive install prompt with:
 * - Delayed appearance (30 seconds)
 * - User dismissal tracking
 * - Installation analytics
 * - Beautiful UI design
 * - Mobile and desktop support
 */

import { Download, X, Smartphone, Monitor } from 'lucide-react';
import { useState, useEffect } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import logger from '@/utils/logger';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

interface InstallPromptProps {
  /**
   * Delay before showing the prompt (milliseconds)
   * @default 30000
   */
  delay?: number;

  /**
   * Callback when user installs the app
   */
  onInstall?: () => void;

  /**
   * Callback when user dismisses the prompt
   */
  onDismiss?: () => void;

  /**
   * Custom title
   */
  title?: string;

  /**
   * Custom description
   */
  description?: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const STORAGE_KEY = 'fleet-install-prompt-dismissed';
const STORAGE_TIMESTAMP_KEY = 'fleet-install-prompt-timestamp';
const DISMISS_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days

// ============================================================================
// COMPONENT
// ============================================================================

export function InstallPrompt({
  delay = 30000,
  onInstall,
  onDismiss,
  title,
  description,
}: InstallPromptProps) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);
  const [platform, setPlatform] = useState<'mobile' | 'desktop'>('desktop');

  useEffect(() => {
    // Detect platform
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    setPlatform(isMobile ? 'mobile' : 'desktop');

    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      logger.info('[InstallPrompt] App is already installed');
      return;
    }

    // Check if prompt was recently dismissed
    const dismissedTimestamp = localStorage.getItem(STORAGE_TIMESTAMP_KEY);
    if (dismissedTimestamp) {
      const timeSinceDismissal = Date.now() - parseInt(dismissedTimestamp, 10);
      if (timeSinceDismissal < DISMISS_DURATION) {
        logger.info('[InstallPrompt] Prompt recently dismissed, not showing');
        return;
      }
    }

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      const event = e as BeforeInstallPromptEvent;

      logger.info('[InstallPrompt] beforeinstallprompt event captured');
      setDeferredPrompt(event);

      // Show prompt after delay
      const timer = setTimeout(() => {
        const wasDismissed = localStorage.getItem(STORAGE_KEY) === 'true';
        if (!wasDismissed) {
          logger.info('[InstallPrompt] Showing install prompt');
          setShowPrompt(true);
        }
      }, delay);

      return () => clearTimeout(timer);
    };

    // Listen for app installed event
    const handleAppInstalled = () => {
      logger.info('[InstallPrompt] App was installed');
      setShowPrompt(false);
      setDeferredPrompt(null);

      // Track installation
      trackInstallation('success');

      if (onInstall) {
        onInstall();
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [delay, onInstall]);

  /**
   * Handle install button click
   */
  const handleInstall = async () => {
    if (!deferredPrompt) {
      logger.warn('[InstallPrompt] No deferred prompt available');
      return;
    }

    setIsInstalling(true);

    try {
      // Show the install prompt
      await deferredPrompt.prompt();

      // Wait for the user to respond
      const { outcome } = await deferredPrompt.userChoice;

      logger.info('[InstallPrompt] User choice:', outcome);

      if (outcome === 'accepted') {
        logger.info('[InstallPrompt] User accepted the install');
        trackInstallation('accepted');

        if (onInstall) {
          onInstall();
        }
      } else {
        logger.info('[InstallPrompt] User dismissed the install');
        trackInstallation('dismissed');
      }

      // Clear the prompt
      setDeferredPrompt(null);
      setShowPrompt(false);
    } catch (error) {
      logger.error('[InstallPrompt] Install prompt failed:', error);
      trackInstallation('error');
    } finally {
      setIsInstalling(false);
    }
  };

  /**
   * Handle dismiss button click
   */
  const handleDismiss = () => {
    logger.info('[InstallPrompt] User dismissed the prompt');

    setShowPrompt(false);
    localStorage.setItem(STORAGE_KEY, 'true');
    localStorage.setItem(STORAGE_TIMESTAMP_KEY, Date.now().toString());

    trackInstallation('user-dismissed');

    if (onDismiss) {
      onDismiss();
    }
  };

  /**
   * Track installation events
   */
  const trackInstallation = (action: string) => {
    // Send to analytics (if available)
    if (typeof window !== 'undefined' && 'gtag' in window) {
      (window as any).gtag('event', 'pwa_install', {
        event_category: 'PWA',
        event_label: action,
        value: 1,
      });
    }

    // Send to backend analytics
    fetch('/api/v1/analytics/pwa-install', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action,
        platform,
        timestamp: Date.now(),
        userAgent: navigator.userAgent,
      }),
    }).catch((error) => {
      logger.error('[InstallPrompt] Failed to track installation:', error);
    });
  };

  // Don't render if not showing
  if (!showPrompt) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm animate-in slide-in-from-bottom-5">
      <Card className="shadow-sm border-2 border-primary/20">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2">
              {platform === 'mobile' ? (
                <Smartphone className="h-5 w-5 text-primary" />
              ) : (
                <Monitor className="h-5 w-5 text-primary" />
              )}
              <CardTitle className="text-sm">
                {title || 'Install Fleet Manager'}
              </CardTitle>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 shrink-0"
              onClick={handleDismiss}
              aria-label="Dismiss install prompt"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <CardDescription className="mt-1.5">
            {description ||
              'Install our app for quick access, offline support, and a native experience'}
          </CardDescription>
        </CardHeader>

        <CardContent className="pt-0">
          <div className="flex flex-col gap-2">
            {/* Benefits list */}
            <div className="text-sm text-muted-foreground space-y-1 mb-2">
              <div className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                <span>Works offline</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                <span>Faster loading times</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                <span>Home screen shortcut</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                <span>Push notifications</span>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex gap-2">
              <Button
                onClick={handleInstall}
                disabled={isInstalling || !deferredPrompt}
                className="flex-1"
                size="sm"
              >
                {isInstalling ? (
                  <>
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    Installing...
                  </>
                ) : (
                  <>
                    <Download className="mr-2 h-4 w-4" />
                    Install App
                  </>
                )}
              </Button>
              <Button onClick={handleDismiss} variant="outline" size="sm">
                Not now
              </Button>
            </div>

            {/* Privacy note */}
            <p className="text-xs text-muted-foreground text-center mt-1">
              No extra permissions required
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Check if app is installed
 */
export function isAppInstalled(): boolean {
  return window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone === true;
}

/**
 * Manually trigger install prompt
 */
export function showInstallPrompt(): void {
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(STORAGE_TIMESTAMP_KEY);
  window.location.reload();
}

/**
 * Check if install prompt is available
 */
export function isInstallPromptAvailable(): boolean {
  // Check if browser supports PWA installation
  if (!('onbeforeinstallprompt' in window)) {
    return false;
  }

  // Check if app is already installed
  if (isAppInstalled()) {
    return false;
  }

  return true;
}

/**
 * Get installation status
 */
export function getInstallationStatus(): {
  isInstalled: boolean;
  canInstall: boolean;
  wasDismissed: boolean;
} {
  const isInstalled = isAppInstalled();
  const canInstall = isInstallPromptAvailable();
  const wasDismissed = localStorage.getItem(STORAGE_KEY) === 'true';

  return {
    isInstalled,
    canInstall,
    wasDismissed,
  };
}

export default InstallPrompt;
