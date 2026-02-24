/**
 * useSmartcar — Hook for Smartcar vehicle connection management and signal retrieval.
 *
 * Provides: connection status, live signals, connect/disconnect/sync actions.
 */

import { useCallback, useRef } from 'react'
import useSWR from 'swr'
import { toast } from 'sonner'

import { apiFetcher } from '@/lib/api-fetcher'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface SmartcarConnectionStatus {
  connected: boolean
  syncStatus: string | null
  syncError: string | null
  lastSync: string | null
  metadata: Record<string, any> | null
}

interface SmartcarLocation {
  latitude: number
  longitude: number
  timestamp: string
}

interface SmartcarOdometer {
  distance: number
  timestamp: string
}

interface SmartcarBattery {
  percentRemaining: number
  range: number
  timestamp: string
}

interface SmartcarFuel {
  percentRemaining: number
  amountRemaining: number
  range: number
  timestamp: string
}

interface SmartcarCharge {
  isPluggedIn: boolean
  state: string
  timestamp: string
}

interface SmartcarTirePressure {
  frontLeft: number | null
  frontRight: number | null
  backLeft: number | null
  backRight: number | null
  timestamp: string
}

interface SmartcarEngineOil {
  lifeRemaining: number | null
  timestamp: string
}

interface SmartcarDiagnostics {
  dtcCount: number
  dtcCodes: string[]
  milStatus: boolean | null
  timestamp: string
}

interface SmartcarLockStatus {
  isLocked: boolean | null
  doors: Array<{ type: string; status: string }> | null
  timestamp: string
}

interface SmartcarExtendedInfo {
  make: string | null
  model: string | null
  year: number | null
  trimLevel: string | null
  exteriorColor: string | null
  nickname: string | null
  timestamp: string
}

export interface SmartcarSignals {
  location: SmartcarLocation | null
  odometer: SmartcarOdometer | null
  speed: { speed: number; timestamp: string } | null
  battery: SmartcarBattery | null
  fuel: SmartcarFuel | null
  charge: SmartcarCharge | null
  tires: SmartcarTirePressure | null
  oil: SmartcarEngineOil | null
  diagnostics: SmartcarDiagnostics | null
  lockStatus: SmartcarLockStatus | null
  vehicleInfo: SmartcarExtendedInfo | null
  vin: string | null
}

export interface UseSmartcarReturn {
  isConnected: boolean
  connectionStatus: SmartcarConnectionStatus | null
  signals: SmartcarSignals | null
  lastSync: string | null
  isLoading: boolean
  isLoadingSignals: boolean
  error: Error | null
  connect: () => void
  disconnect: () => Promise<void>
  sync: () => Promise<void>
  refreshConnection: () => void
  refreshSignals: () => void
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

const SIGNAL_REFRESH_INTERVAL = 60_000 // 60s

export function useSmartcar(vehicleId: string): UseSmartcarReturn {
  const popupRef = useRef<Window | null>(null)

  // Connection status
  const {
    data: connectionStatus,
    error: connectionError,
    isLoading: isLoadingConnection,
    mutate: mutateConnection,
  } = useSWR<SmartcarConnectionStatus>(
    vehicleId ? `/api/smartcar/vehicles/${vehicleId}/connection` : null,
    apiFetcher,
    { shouldRetryOnError: false, revalidateOnFocus: false }
  )

  const isConnected = connectionStatus?.connected === true

  // All signals (only fetch when connected)
  const {
    data: signals,
    isLoading: isLoadingSignals,
    mutate: mutateSignals,
  } = useSWR<SmartcarSignals>(
    isConnected ? `/api/smartcar/vehicles/${vehicleId}/signals` : null,
    apiFetcher,
    {
      shouldRetryOnError: false,
      revalidateOnFocus: false,
      refreshInterval: isConnected ? SIGNAL_REFRESH_INTERVAL : 0,
    }
  )

  // Connect — opens Smartcar OAuth in a popup
  const connect = useCallback(() => {
    const fetchAuthUrl = async () => {
      try {
        const res = await fetch(`/api/smartcar/connect?vehicle_id=${vehicleId}`, {
          credentials: 'include',
        })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const json = await res.json()
        const authUrl = json?.data?.authUrl || json?.authUrl

        if (!authUrl) {
          toast.error('Could not get Smartcar authorization URL')
          return
        }

        // Open OAuth popup
        const width = 500
        const height = 700
        const left = window.screenX + (window.outerWidth - width) / 2
        const top = window.screenY + (window.outerHeight - height) / 2
        popupRef.current = window.open(
          authUrl,
          'smartcar-connect',
          `width=${width},height=${height},left=${left},top=${top},toolbar=no,menubar=no`
        )

        // Poll popup until closed — then refresh connection status
        const pollTimer = setInterval(() => {
          if (!popupRef.current || popupRef.current.closed) {
            clearInterval(pollTimer)
            popupRef.current = null
            // Refresh connection status after popup closes
            setTimeout(() => {
              mutateConnection()
              mutateSignals()
            }, 1000)
          }
        }, 500)
      } catch (err) {
        toast.error('Failed to start Smartcar connection')
      }
    }

    fetchAuthUrl()
  }, [vehicleId, mutateConnection, mutateSignals])

  // Disconnect
  const disconnect = useCallback(async () => {
    try {
      // Need CSRF token for POST/DELETE
      const csrfRes = await fetch('/api/csrf', { credentials: 'include' })
      const csrfData = await csrfRes.json()
      const csrfToken = csrfData?.token || csrfData?.data?.token

      const res = await fetch(`/api/smartcar/vehicles/${vehicleId}/disconnect`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...(csrfToken ? { 'X-CSRF-Token': csrfToken } : {}),
        },
      })

      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      toast.success('Smartcar disconnected')
      mutateConnection()
      mutateSignals(undefined, { revalidate: false })
    } catch {
      toast.error('Failed to disconnect Smartcar')
    }
  }, [vehicleId, mutateConnection, mutateSignals])

  // Sync
  const sync = useCallback(async () => {
    try {
      const csrfRes = await fetch('/api/csrf', { credentials: 'include' })
      const csrfData = await csrfRes.json()
      const csrfToken = csrfData?.token || csrfData?.data?.token

      const res = await fetch(`/api/smartcar/vehicles/${vehicleId}/sync`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...(csrfToken ? { 'X-CSRF-Token': csrfToken } : {}),
        },
      })

      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      toast.success('Vehicle data synced')
      mutateConnection()
      mutateSignals()
    } catch {
      toast.error('Failed to sync vehicle data')
    }
  }, [vehicleId, mutateConnection, mutateSignals])

  return {
    isConnected,
    connectionStatus: connectionStatus ?? null,
    signals: signals ?? null,
    lastSync: connectionStatus?.lastSync ?? null,
    isLoading: isLoadingConnection,
    isLoadingSignals,
    error: connectionError ?? null,
    connect,
    disconnect,
    sync,
    refreshConnection: () => mutateConnection(),
    refreshSignals: () => mutateSignals(),
  }
}
