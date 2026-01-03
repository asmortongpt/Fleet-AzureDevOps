/**
 * API Status Indicator Component
 * FEAT-007: Visual indicator for API connection status
 *
 * Features:
 * - Real-time connection status
 * - Network detection
 * - Auto-reconnect attempts
 * - Tooltip with details
 */

import { CheckCircle, AlertCircle, WifiOff, RefreshCw } from 'lucide-react'
import { useEffect, useState } from 'react'

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

interface APIStatusIndicatorProps {
  className?: string
  showLabel?: boolean
}

export function APIStatusIndicator({ className, showLabel = false }: APIStatusIndicatorProps) {
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [apiStatus, setApiStatus] = useState<'connected' | 'disconnected' | 'checking'>('checking')
  const [lastCheck, setLastCheck] = useState<Date>(new Date())

  const checkAPIStatus = async () => {
    if (!isOnline) {
      setApiStatus('disconnected')
      return
    }

    setApiStatus('checking')

    try {
      // Try to fetch CSRF token as a health check
      const response = await fetch('/api/v1/csrf-token', {
        method: 'GET',
        credentials: 'include',
        signal: AbortSignal.timeout(5000) // 5 second timeout
      })

      setApiStatus(response.ok ? 'connected' : 'disconnected')
      setLastCheck(new Date())
    } catch (error) {
      setApiStatus('disconnected')
      setLastCheck(new Date())
    }
  }

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
      checkAPIStatus()
    }

    const handleOffline = () => {
      setIsOnline(false)
      setApiStatus('disconnected')
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Initial check
    checkAPIStatus()

    // Re-check every 30 seconds
    const interval = setInterval(checkAPIStatus, 30000)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      clearInterval(interval)
    }
  }, [isOnline])

  const getStatusConfig = () => {
    if (!isOnline) {
      return {
        icon: WifiOff,
        color: 'text-yellow-500',
        label: 'Offline',
        description: 'No internet connection'
      }
    }

    switch (apiStatus) {
      case 'connected':
        return {
          icon: CheckCircle,
          color: 'text-green-500',
          label: 'Connected',
          description: 'API connected successfully'
        }
      case 'checking':
        return {
          icon: RefreshCw,
          color: 'text-blue-500 animate-spin',
          label: 'Checking',
          description: 'Checking API status...'
        }
      case 'disconnected':
        return {
          icon: AlertCircle,
          color: 'text-destructive',
          label: 'Disconnected',
          description: 'Cannot reach API server'
        }
    }
  }

  const status = getStatusConfig()
  const StatusIcon = status.icon

  const formatLastCheck = () => {
    const seconds = Math.floor((new Date().getTime() - lastCheck.getTime()) / 1000)
    if (seconds < 60) return `${seconds}s ago`
    const minutes = Math.floor(seconds / 60)
    if (minutes < 60) return `${minutes}m ago`
    const hours = Math.floor(minutes / 60)
    return `${hours}h ago`
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={cn(
              'flex items-center gap-2 cursor-default',
              className
            )}
          >
            <StatusIcon className={cn('h-4 w-4', status.color)} />
            {showLabel && (
              <span className="text-sm font-medium">{status.label}</span>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <div className="text-xs">
            <p className="font-semibold">{status.description}</p>
            {apiStatus !== 'checking' && (
              <p className="text-muted-foreground mt-1">
                Last checked: {formatLastCheck()}
              </p>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
