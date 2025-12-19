/**
 * PWA Install Prompt Component
 * Prompts users to install the app on their device
 */

import { X, Download, Smartphone } from 'lucide-react'
import React, { useEffect, useState } from 'react'

import logger from '@/utils/logger';
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showPrompt, setShowPrompt] = useState(false)
  const [isIOS, setIsIOS] = useState(false)
  const [isStandalone, setIsStandalone] = useState(false)

  useEffect(() => {
    // Check if already installed
    const isInStandaloneMode = window.matchMedia('(display-mode: standalone)').matches
    setIsStandalone(isInStandaloneMode)

    // Check if iOS
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent)
    setIsIOS(isIOSDevice)

    // Check if user has already dismissed the prompt
    const hasPromptBeenDismissed = localStorage.getItem('pwa-prompt-dismissed') === 'true'

    if (isInStandaloneMode || hasPromptBeenDismissed) {
      return
    }

    // Listen for beforeinstallprompt event (Android/Chrome)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)

      // Show prompt after 30 seconds of use
      setTimeout(() => {
        setShowPrompt(true)
      }, 30000)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

    // For iOS, show prompt after 30 seconds if not standalone
    if (isIOSDevice && !isInStandaloneMode) {
      setTimeout(() => {
        setShowPrompt(true)
      }, 30000)
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    }
  }, [])

  const handleInstallClick = async () => {
    if (!deferredPrompt) return

    // Show the install prompt
    deferredPrompt.prompt()

    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice

    if (outcome === 'accepted') {
      logger.debug('[PWA] User accepted the install prompt')
    } else {
      logger.debug('[PWA] User dismissed the install prompt')
    }

    // Clear the deferred prompt
    setDeferredPrompt(null)
    setShowPrompt(false)
  }

  const handleDismiss = () => {
    setShowPrompt(false)
    localStorage.setItem('pwa-prompt-dismissed', 'true')
  }

  // Don't show if already installed or prompt is hidden
  if (isStandalone || !showPrompt) {
    return null
  }

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-[9998] bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-2xl"
      role="dialog"
      aria-labelledby="pwa-install-title"
      aria-describedby="pwa-install-description"
    >
      <div className="container mx-auto px-4 py-4 md:py-6">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 p-2 bg-white/10 rounded-lg">
            <Smartphone className="w-6 h-6 md:w-8 md:h-8" aria-hidden="true" />
          </div>

          <div className="flex-1 min-w-0">
            <h3 id="pwa-install-title" className="font-semibold text-base md:text-lg mb-1">
              Install Fleet Manager
            </h3>
            <p id="pwa-install-description" className="text-sm md:text-base opacity-90">
              {isIOS
                ? 'Install this app on your device for a better experience. Tap the share button and select "Add to Home Screen".'
                : 'Install this app for quick access, offline support, and a native-like experience.'}
            </p>

            <div className="flex items-center gap-3 mt-4">
              {!isIOS && deferredPrompt && (
                <button
                  onClick={handleInstallClick}
                  className="flex items-center gap-2 px-4 py-2 bg-white text-blue-700 rounded-lg font-medium hover:bg-blue-50 transition-colors text-sm md:text-base"
                >
                  <Download className="w-4 h-4" aria-hidden="true" />
                  Install Now
                </button>
              )}

              <button
                onClick={handleDismiss}
                className="px-4 py-2 text-white hover:bg-white/10 rounded-lg font-medium transition-colors text-sm md:text-base"
              >
                Maybe Later
              </button>
            </div>
          </div>

          <button
            onClick={handleDismiss}
            className="flex-shrink-0 p-2 hover:bg-white/10 rounded-lg transition-colors"
            aria-label="Close install prompt"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* iOS Instructions Visual */}
      {isIOS && (
        <div className="border-t border-white/20 bg-white/5 px-4 py-3">
          <div className="flex items-center gap-3 text-xs md:text-sm">
            <span>Tap</span>
            <div className="p-1.5 bg-white/20 rounded">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M16 5l-1.42 1.42-1.59-1.59V16h-1.98V4.83L9.42 6.42 8 5l4-4 4 4zm4 5v11c0 1.1-.9 2-2 2H6c-1.11 0-2-.9-2-2V10c0-1.11.89-2 2-2h3v2H6v11h12V10h-3V8h3c1.1 0 2 .89 2 2z" />
              </svg>
            </div>
            <span>then scroll down to "Add to Home Screen"</span>
          </div>
        </div>
      )}
    </div>
  )
}
