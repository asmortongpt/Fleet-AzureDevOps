/**
 * SmartcarConnectButton — Reusable button for Smartcar OAuth connection flow.
 *
 * Three visual states:
 *  1. Not connected — "Connect to Smartcar" CTA
 *  2. Connected — green badge, last sync, Sync Now / Disconnect actions
 *  3. Error — red badge, reconnect button
 */

import {
  Car,
  Check,
  Loader2,
  RefreshCw,
  Unplug,
  AlertCircle,
  ExternalLink,
} from 'lucide-react'
import { useState } from 'react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useSmartcar } from '@/hooks/use-smartcar'
import { cn } from '@/lib/utils'
import { formatDateTime } from '@/utils/format-helpers'

interface SmartcarConnectButtonProps {
  vehicleId: string
  compact?: boolean
  className?: string
}

export function SmartcarConnectButton({
  vehicleId,
  compact = false,
  className,
}: SmartcarConnectButtonProps) {
  const {
    isConnected,
    connectionStatus,
    lastSync,
    isLoading,
    connect,
    disconnect,
    sync,
  } = useSmartcar(vehicleId)

  const [isSyncing, setIsSyncing] = useState(false)
  const [isDisconnecting, setIsDisconnecting] = useState(false)

  const handleSync = async () => {
    setIsSyncing(true)
    await sync()
    setIsSyncing(false)
  }

  const handleDisconnect = async () => {
    setIsDisconnecting(true)
    await disconnect()
    setIsDisconnecting(false)
  }

  const hasError = connectionStatus?.syncStatus === 'error'

  if (isLoading) {
    return (
      <div className={cn('flex items-center gap-2 text-xs text-white/40', className)}>
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
        Checking Smartcar...
      </div>
    )
  }

  // ---- Error state ----
  if (hasError && isConnected) {
    return (
      <div className={cn('rounded-lg border border-rose-500/20 bg-rose-500/5 p-2.5', className)}>
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <AlertCircle className="h-4 w-4 text-rose-400 shrink-0" />
            <div className="min-w-0">
              <span className="text-xs font-medium text-rose-400">Connection Error</span>
              {connectionStatus?.syncError && (
                <p className="text-[10px] text-white/40 truncate">{connectionStatus.syncError}</p>
              )}
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleSync}
            disabled={isSyncing}
            className="shrink-0 text-xs"
          >
            {isSyncing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
            Retry
          </Button>
        </div>
      </div>
    )
  }

  // ---- Connected state ----
  if (isConnected) {
    if (compact) {
      return (
        <div className={cn('flex items-center gap-2', className)}>
          <Badge variant="default" className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-[10px]">
            <Check className="h-3 w-3 mr-1" />
            Smartcar
          </Badge>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSync}
            disabled={isSyncing}
            className="h-6 px-1.5 text-[10px]"
            aria-label="Sync Smartcar data"
          >
            {isSyncing ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
          </Button>
        </div>
      )
    }

    return (
      <div className={cn('rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-2.5', className)}>
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <Car className="h-4 w-4 text-emerald-400 shrink-0" />
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-medium text-emerald-400">Smartcar Connected</span>
              </div>
              {lastSync && (
                <p className="text-[10px] text-white/40">Last sync: {formatDateTime(lastSync)}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={handleSync}
              disabled={isSyncing}
              className="text-xs h-7"
              aria-label="Sync Smartcar data now"
            >
              {isSyncing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
              Sync
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDisconnect}
              disabled={isDisconnecting}
              className="text-xs h-7 text-white/40 hover:text-rose-400"
              aria-label="Disconnect Smartcar"
            >
              {isDisconnecting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Unplug className="h-3.5 w-3.5" />}
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // ---- Not connected state ----
  if (compact) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={connect}
        className={cn('text-xs h-7', className)}
        aria-label="Connect vehicle to Smartcar"
      >
        <ExternalLink className="h-3.5 w-3.5" />
        Connect Smartcar
      </Button>
    )
  }

  return (
    <div className={cn('rounded-lg border border-white/[0.08] bg-white/[0.02] p-2.5', className)}>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="p-1.5 rounded-md bg-emerald-500/10">
            <Car className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="min-w-0">
            <span className="text-xs font-medium text-white/80">Smartcar</span>
            <p className="text-[10px] text-white/40">Connect for live vehicle data</p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={connect}
          className="shrink-0 text-xs"
          aria-label="Connect vehicle to Smartcar"
        >
          <ExternalLink className="h-3.5 w-3.5" />
          Connect
        </Button>
      </div>
    </div>
  )
}
