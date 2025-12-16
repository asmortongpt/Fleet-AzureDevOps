/**
 * Offline Banner Component
 * Displays when the app is offline and shows sync status
 */

import React, { useEffect, useState } from 'react'
import { offlineManager, type OfflineState } from '@/lib/offline-manager'
import { WifiOff, Wifi, RefreshCw } from 'lucide-react'

import logger from '@/utils/logger';
export function OfflineBanner() {
  const [offlineState, setOfflineState] = useState<OfflineState | null>(null)
  const [isSyncing, setIsSyncing] = useState(false)

  useEffect(() => {
    // Subscribe to offline state changes
    const unsubscribe = offlineManager.subscribe((state) => {
      setOfflineState(state)
    })

    // Get initial state
    offlineManager.getState().then(setOfflineState)

    return unsubscribe
  }, [])

  if (!offlineState) {
    return null
  }

  const { isOnline, queuedRequests } = offlineState

  // Don't show banner if online and no queued requests
  if (isOnline && queuedRequests.length === 0) {
    return null
  }

  const handleSync = async () => {
    setIsSyncing(true)
    // Trigger sync (Service Worker will handle actual sync)
    if ('serviceWorker' in navigator && 'sync' in ServiceWorkerRegistration.prototype) {
      try {
        const registration = await navigator.serviceWorker.ready
        await (registration as ServiceWorkerRegistration & { sync: { register: (tag: string) => Promise<void> } }).sync.register('sync-queued-requests')
      } catch (error) {
        logger.error('[OfflineBanner] Sync failed:', error)
      }
    }
    setIsSyncing(false)
  }

  return (
    <div
      className={`fixed top-0 left-0 right-0 z-[9999] ${
        isOnline ? 'bg-green-600' : 'bg-orange-600'
      } text-white shadow-lg transition-all duration-300 ease-in-out`}
      role="alert"
      aria-live="polite"
    >
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {isOnline ? (
              <Wifi className="w-5 h-5" aria-hidden="true" />
            ) : (
              <WifiOff className="w-5 h-5" aria-hidden="true" />
            )}

            <div className="flex-1">
              <p className="font-medium text-sm md:text-base">
                {isOnline ? 'Back online' : 'You are offline'}
              </p>
              {queuedRequests.length > 0 && (
                <p className="text-xs md:text-sm opacity-90">
                  {queuedRequests.length} pending request
                  {queuedRequests.length !== 1 ? 's' : ''} will sync when online
                </p>
              )}
            </div>
          </div>

          {isOnline && queuedRequests.length > 0 && (
            <button
              onClick={handleSync}
              disabled={isSyncing}
              className="flex items-center gap-2 px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded-md text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Sync pending requests"
            >
              <RefreshCw
                className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`}
                aria-hidden="true"
              />
              <span className="hidden sm:inline">
                {isSyncing ? 'Syncing...' : 'Sync Now'}
              </span>
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
