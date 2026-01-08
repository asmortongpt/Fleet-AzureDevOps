/**
 * WebSocket Status Component
 * Displays real-time connection status with detailed stats
 */

import { Wifi, WifiOff, AlertCircle, Activity } from 'lucide-react';
import React, { useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useWebSocketStatus, useReconnect } from '@/hooks/useWebSocketSubscriptions';
import { cn } from '@/lib/utils';

interface WebSocketStatusProps {
  variant?: 'badge' | 'button' | 'icon';
  showDetails?: boolean;
  className?: string;
}

export function WebSocketStatus({
  variant = 'badge',
  showDetails = false,
  className,
}: WebSocketStatusProps) {
  const { isConnected, connectionStatus, stats } = useWebSocketStatus();
  const reconnect = useReconnect();
  const [showDropdown, setShowDropdown] = useState(false);

  // Format uptime
  const formatUptime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    }
    return `${secs}s`;
  };

  // Get status color and icon
  const getStatusInfo = () => {
    switch (connectionStatus) {
      case 'connected':
        return {
          color: 'bg-emerald-600 hover:bg-emerald-700',
          textColor: 'text-emerald-600',
          label: 'Live',
          icon: <Wifi className="h-3 w-3" />,
          variant: 'default' as const,
        };
      case 'connecting':
        return {
          color: 'bg-amber-500 hover:bg-amber-600',
          textColor: 'text-amber-600',
          label: 'Connecting',
          icon: <Activity className="h-3 w-3 animate-pulse" />,
          variant: 'outline' as const,
        };
      case 'error':
        return {
          color: 'bg-red-500 hover:bg-red-600',
          textColor: 'text-red-600',
          label: 'Error',
          icon: <AlertCircle className="h-3 w-3" />,
          variant: 'destructive' as const,
        };
      default:
        return {
          color: 'bg-slate-500 hover:bg-slate-600',
          textColor: 'text-slate-600',
          label: 'Offline',
          icon: <WifiOff className="h-3 w-3" />,
          variant: 'secondary' as const,
        };
    }
  };

  const statusInfo = getStatusInfo();

  // Badge variant
  if (variant === 'badge') {
    if (!showDetails) {
      return (
        <Badge variant={statusInfo.variant} className={cn('gap-1', className)}>
          {statusInfo.icon}
          <span className="text-xs font-medium">{statusInfo.label}</span>
        </Badge>
      );
    }

    return (
      <DropdownMenu open={showDropdown} onOpenChange={setShowDropdown}>
        <DropdownMenuTrigger asChild>
          <Badge
            variant={statusInfo.variant}
            className={cn('gap-1 cursor-pointer', className)}
          >
            {statusInfo.icon}
            <span className="text-xs font-medium">{statusInfo.label}</span>
          </Badge>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-64">
          <DropdownMenuLabel>WebSocket Connection</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <div className="px-2 py-1.5 text-sm space-y-2">
            <div className="flex justify-between">
              <span className="text-slate-500">Status:</span>
              <span className={cn('font-medium', statusInfo.textColor)}>
                {statusInfo.label}
              </span>
            </div>
            {isConnected && (
              <>
                <div className="flex justify-between">
                  <span className="text-slate-500">Uptime:</span>
                  <span className="font-mono text-xs">
                    {formatUptime(stats.uptime)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Messages:</span>
                  <span className="font-mono text-xs">
                    ↓{stats.messagesReceived} ↑{stats.messagesSent}
                  </span>
                </div>
                {stats.latency !== null && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Latency:</span>
                    <span className="font-mono text-xs">{stats.latency}ms</span>
                  </div>
                )}
              </>
            )}
            {!isConnected && (
              <>
                <div className="flex justify-between">
                  <span className="text-slate-500">Reconnects:</span>
                  <span className="font-mono text-xs">{stats.reconnects}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Errors:</span>
                  <span className="font-mono text-xs">{stats.errors}</span>
                </div>
              </>
            )}
          </div>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => reconnect()}>
            <Activity className="h-4 w-4 mr-2" />
            Reconnect
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  // Button variant
  if (variant === 'button') {
    return (
      <Button
        variant="outline"
        size="sm"
        className={cn('gap-2', className)}
        onClick={() => !isConnected && reconnect()}
        disabled={isConnected}
      >
        {statusInfo.icon}
        <span className="text-xs font-medium">{statusInfo.label}</span>
        {showDetails && isConnected && (
          <span className="text-xs font-mono text-slate-500">
            {formatUptime(stats.uptime)}
          </span>
        )}
      </Button>
    );
  }

  // Icon variant
  return (
    <div
      className={cn(
        'flex items-center justify-center w-8 h-8 rounded-full',
        statusInfo.color,
        'cursor-pointer transition-colors',
        className
      )}
      onClick={() => !isConnected && reconnect()}
      title={`WebSocket ${statusInfo.label}`}
    >
      {statusInfo.icon}
    </div>
  );
}

/* ============================================================
   Detailed Status Panel
   ============================================================ */

export function WebSocketStatusPanel({ className }: { className?: string }) {
  const { isConnected, connectionStatus, stats } = useWebSocketStatus();
  const reconnect = useReconnect();

  const statusInfo = (() => {
    switch (connectionStatus) {
      case 'connected':
        return {
          color: 'text-emerald-600',
          bgColor: 'bg-emerald-50',
          borderColor: 'border-emerald-200',
          label: 'Connected',
          icon: <Wifi className="h-5 w-5" />,
        };
      case 'connecting':
        return {
          color: 'text-amber-600',
          bgColor: 'bg-amber-50',
          borderColor: 'border-amber-200',
          label: 'Connecting...',
          icon: <Activity className="h-5 w-5 animate-pulse" />,
        };
      case 'error':
        return {
          color: 'text-red-600',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          label: 'Connection Error',
          icon: <AlertCircle className="h-5 w-5" />,
        };
      default:
        return {
          color: 'text-slate-600',
          bgColor: 'bg-slate-50',
          borderColor: 'border-slate-200',
          label: 'Disconnected',
          icon: <WifiOff className="h-5 w-5" />,
        };
    }
  })();

  return (
    <div
      className={cn(
        'p-4 rounded-lg border-2',
        statusInfo.bgColor,
        statusInfo.borderColor,
        className
      )}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={statusInfo.color}>{statusInfo.icon}</div>
          <div>
            <h3 className="font-semibold text-slate-900">{statusInfo.label}</h3>
            <p className="text-xs text-slate-500">Real-time connection status</p>
          </div>
        </div>
        {!isConnected && (
          <Button size="sm" onClick={() => reconnect()}>
            Reconnect
          </Button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4 text-sm">
        {isConnected && (
          <>
            <div>
              <div className="text-slate-500 mb-1">Uptime</div>
              <div className="font-mono text-lg font-semibold text-slate-900">
                {Math.floor(stats.uptime / 60)}m {stats.uptime % 60}s
              </div>
            </div>
            <div>
              <div className="text-slate-500 mb-1">Messages</div>
              <div className="font-mono text-lg font-semibold text-slate-900">
                ↓{stats.messagesReceived} ↑{stats.messagesSent}
              </div>
            </div>
          </>
        )}
        {!isConnected && (
          <>
            <div>
              <div className="text-slate-500 mb-1">Reconnects</div>
              <div className="font-mono text-lg font-semibold text-slate-900">
                {stats.reconnects}
              </div>
            </div>
            <div>
              <div className="text-slate-500 mb-1">Errors</div>
              <div className="font-mono text-lg font-semibold text-slate-900">
                {stats.errors}
              </div>
            </div>
          </>
        )}
      </div>

      {stats.lastConnectedAt && (
        <div className="mt-4 pt-4 border-t border-slate-200">
          <div className="text-xs text-slate-500">
            Last connected:{' '}
            <span className="font-mono">
              {stats.lastConnectedAt.toLocaleTimeString()}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
