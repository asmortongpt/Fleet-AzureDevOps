/**
 * Offline Indicator Component
 *
 * Real-time network status indicator with sync progress
 *
 * Features:
 * - Network status detection
 * - Sync progress display
 * - Pending operations count
 * - Manual sync trigger
 * - Animated status transitions
 *
 * Security: Read-only component, no security concerns
 */

import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff, RefreshCw, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { offlineSyncService, type SyncStatus } from '../../services/offline-sync.service';

interface OfflineIndicatorProps {
  showDetails?: boolean;
  position?: 'top' | 'bottom';
  compact?: boolean;
}

export const OfflineIndicator: React.FC<OfflineIndicatorProps> = ({
  showDetails = true,
  position = 'top',
  compact = false,
}) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null);
  const [pendingCount, setPendingCount] = useState(0);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    // Setup network listeners
    const handleOnline = () => {
      setIsOnline(true);
      offlineSyncService.syncWhenOnline();
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Setup sync listener
    offlineSyncService.onSyncStatusChange((status) => {
      setSyncStatus(status);
      if (status.status === 'synced') {
        setLastSyncTime(new Date());
      }
    });

    // Load initial pending count
    loadPendingCount();

    // Poll for pending count updates
    const interval = setInterval(loadPendingCount, 5000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, []);

  const loadPendingCount = async () => {
    try {
      const count = await offlineSyncService.getPendingSyncCount();
      setPendingCount(count);
    } catch (error) {
      console.error('Failed to load pending count:', error);
    }
  };

  const handleManualSync = async () => {
    if (!isOnline) {
      alert('Cannot sync while offline');
      return;
    }

    try {
      await offlineSyncService.syncWhenOnline();
    } catch (error) {
      console.error('Manual sync failed:', error);
      alert('Sync failed. Please try again.');
    }
  };

  const getStatusIcon = () => {
    if (!isOnline) {
      return <WifiOff className="text-red-500" size={20} />;
    }

    if (syncStatus?.status === 'syncing') {
      return <RefreshCw className="text-blue-800 animate-spin" size={20} />;
    }

    if (syncStatus?.status === 'error') {
      return <AlertCircle className="text-orange-500" size={20} />;
    }

    if (pendingCount > 0) {
      return <Clock className="text-yellow-500" size={20} />;
    }

    return <Wifi className="text-green-500" size={20} />;
  };

  const getStatusText = () => {
    if (!isOnline) {
      return 'Offline';
    }

    if (syncStatus?.status === 'syncing') {
      const progress = syncStatus.progress;
      if (progress) {
        return `Syncing ${progress.current}/${progress.total}`;
      }
      return 'Syncing...';
    }

    if (syncStatus?.status === 'error') {
      return 'Sync Error';
    }

    if (pendingCount > 0) {
      return `${pendingCount} pending`;
    }

    if (lastSyncTime) {
      const timeDiff = Date.now() - lastSyncTime.getTime();
      const minutes = Math.floor(timeDiff / 60000);
      if (minutes < 1) {
        return 'Just synced';
      } else if (minutes < 60) {
        return `Synced ${minutes}m ago`;
      } else {
        const hours = Math.floor(minutes / 60);
        return `Synced ${hours}h ago`;
      }
    }

    return 'Online';
  };

  const getStatusColor = () => {
    if (!isOnline) return 'bg-red-50 border-red-200';
    if (syncStatus?.status === 'syncing') return 'bg-blue-50 border-blue-200';
    if (syncStatus?.status === 'error') return 'bg-orange-50 border-orange-200';
    if (pendingCount > 0) return 'bg-yellow-50 border-yellow-200';
    return 'bg-green-50 border-green-200';
  };

  // Compact version
  if (compact) {
    return (
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={`flex items-center space-x-2 px-3 py-2 rounded-full ${getStatusColor()} border transition-all hover:shadow-sm`}
      >
        {getStatusIcon()}
        {isExpanded && (
          <span className="text-sm font-medium text-gray-700">{getStatusText()}</span>
        )}
      </button>
    );
  }

  // Full version
  return (
    <div
      className={`${
        position === 'top' ? 'top-0' : 'bottom-0'
      } left-0 right-0 z-50 transition-all duration-300`}
    >
      <div className={`${getStatusColor()} border-b px-2 py-3`}>
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          {/* Status */}
          <div className="flex items-center space-x-3">
            {getStatusIcon()}
            <div>
              <p className="text-sm font-medium text-gray-800">{getStatusText()}</p>
              {syncStatus?.message && (
                <p className="text-xs text-slate-700">{syncStatus.message}</p>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-2">
            {showDetails && pendingCount > 0 && (
              <div className="bg-white px-3 py-1 rounded-full">
                <p className="text-xs font-medium text-gray-700">
                  {pendingCount} operation{pendingCount !== 1 ? 's' : ''}
                </p>
              </div>
            )}

            {isOnline && !syncStatus?.status.includes('syncing') && (
              <button
                onClick={handleManualSync}
                className="bg-white hover:bg-gray-50 p-2 rounded-full transition-colors"
                title="Sync now"
              >
                <RefreshCw size={16} className="text-slate-700" />
              </button>
            )}

            {!compact && (
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="text-xs font-medium text-slate-700 hover:text-gray-800 transition-colors"
              >
                {isExpanded ? 'Hide' : 'Details'}
              </button>
            )}
          </div>
        </div>

        {/* Expanded Details */}
        {showDetails && isExpanded && (
          <div className="mt-3 pt-3 border-t border-gray-200">
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <p className="text-gray-500">Network Status</p>
                <p className="font-medium text-gray-800">
                  {isOnline ? 'Connected' : 'Disconnected'}
                </p>
              </div>
              <div>
                <p className="text-gray-500">Pending Operations</p>
                <p className="font-medium text-gray-800">{pendingCount}</p>
              </div>
              {lastSyncTime && (
                <div className="col-span-2">
                  <p className="text-gray-500">Last Sync</p>
                  <p className="font-medium text-gray-800">
                    {lastSyncTime.toLocaleString()}
                  </p>
                </div>
              )}
              {syncStatus?.error && (
                <div className="col-span-2">
                  <p className="text-gray-500">Error</p>
                  <p className="font-medium text-red-600 text-xs">
                    {typeof syncStatus.error === 'string'
                      ? syncStatus.error
                      : 'An error occurred during sync'}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Sync Progress Bar */}
        {syncStatus?.status === 'syncing' && syncStatus.progress && (
          <div className="mt-3">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                style={{
                  width: `${(syncStatus.progress.current / syncStatus.progress.total) * 100}%`,
                }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Offline Banner (persistent) */}
      {!isOnline && (
        <div className="bg-red-500 text-white px-2 py-2 text-center text-sm font-medium">
          You are working offline. Changes will sync when connection is restored.
        </div>
      )}
    </div>
  );
};

export default OfflineIndicator;
