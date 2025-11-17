/**
 * useSync Hook
 *
 * React hook for managing sync state in components
 */

import { useState, useEffect, useCallback } from 'react';
import SyncManager from '../services/SyncManager';
import { SyncProgress, NetworkState } from '../types/queue';

interface UseSyncReturn {
  isOnline: boolean;
  isSyncing: boolean;
  syncProgress: SyncProgress | null;
  pendingCount: number;
  lastSyncTime: number | null;
  networkState: NetworkState | null;
  startSync: () => Promise<void>;
  forceSync: () => Promise<void>;
  cancelSync: () => void;
  enableAutoSync: () => void;
  disableAutoSync: () => void;
  isAutoSyncEnabled: boolean;
}

/**
 * Hook for managing sync state
 */
export const useSync = (): UseSyncReturn => {
  const syncManager = SyncManager.getInstance();

  const [isOnline, setIsOnline] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState<SyncProgress | null>(null);
  const [pendingCount, setPendingCount] = useState(0);
  const [lastSyncTime, setLastSyncTime] = useState<number | null>(null);
  const [networkState, setNetworkState] = useState<NetworkState | null>(null);
  const [isAutoSyncEnabled, setIsAutoSyncEnabled] = useState(true);

  /**
   * Load sync state
   */
  const loadSyncState = useCallback(async () => {
    const state = syncManager.getSyncState();
    setIsOnline(syncManager.isOnline());
    setIsSyncing(state.isSyncing);
    setSyncProgress(state.syncProgress);
    setLastSyncTime(state.lastSyncTime);
    setNetworkState(state.networkState);
    setIsAutoSyncEnabled(syncManager.isAutoSyncEnabled());

    const pending = await syncManager.getPendingCount();
    setPendingCount(pending);
  }, []);

  /**
   * Setup sync state listener
   */
  useEffect(() => {
    // Initial load
    loadSyncState();

    // Listen to state changes
    const listener = (state: any) => {
      setIsOnline(syncManager.isOnline());
      setIsSyncing(state.isSyncing);
      setSyncProgress(state.syncProgress);
      setLastSyncTime(state.lastSyncTime);
      setNetworkState(state.networkState);
      loadSyncState(); // Reload counts
    };

    syncManager.addStateListener(listener);

    return () => {
      syncManager.removeStateListener(listener);
    };
  }, [loadSyncState]);

  /**
   * Start sync
   */
  const startSync = useCallback(async () => {
    await syncManager.startSync();
  }, []);

  /**
   * Force sync
   */
  const forceSync = useCallback(async () => {
    await syncManager.forceSync();
  }, []);

  /**
   * Cancel sync
   */
  const cancelSync = useCallback(() => {
    syncManager.cancelSync();
  }, []);

  /**
   * Enable auto sync
   */
  const enableAutoSync = useCallback(() => {
    syncManager.enableAutoSync();
    setIsAutoSyncEnabled(true);
  }, []);

  /**
   * Disable auto sync
   */
  const disableAutoSync = useCallback(() => {
    syncManager.disableAutoSync();
    setIsAutoSyncEnabled(false);
  }, []);

  return {
    isOnline,
    isSyncing,
    syncProgress,
    pendingCount,
    lastSyncTime,
    networkState,
    startSync,
    forceSync,
    cancelSync,
    enableAutoSync,
    disableAutoSync,
    isAutoSyncEnabled,
  };
};

export default useSync;
