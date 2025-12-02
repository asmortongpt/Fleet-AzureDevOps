/**
 * Offline Indicator Component
 *
 * Displays:
 * - Network status banner
 * - Pending sync count
 * - Force sync button
 * - Sync progress bar
 * - Conflict count
 */

import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Platform,
} from 'react-native';
import {
  Banner,
  Button,
  ProgressBar,
  Text,
  IconButton,
  Badge,
  Portal,
  Dialog,
  Paragraph,
} from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import SyncManager from '../services/SyncManager';
import ConflictResolverService from '../services/ConflictResolver';
import { SyncProgress, NetworkState } from '../types/queue';
import { formatDistanceToNow } from 'date-fns';

interface OfflineIndicatorProps {
  autoHide?: boolean; // Auto-hide when online and synced
  position?: 'top' | 'bottom';
  showSyncButton?: boolean;
  showConflictCount?: boolean;
  onConflictPress?: () => void;
}

export const OfflineIndicator: React.FC<OfflineIndicatorProps> = ({
  autoHide = true,
  position = 'top',
  showSyncButton = true,
  showConflictCount = true,
  onConflictPress,
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const [networkState, setNetworkState] = useState<NetworkState | null>(null);
  const [pendingCount, setPendingCount] = useState(0);
  const [conflictCount, setConflictCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState<SyncProgress | null>(null);
  const [lastSyncTime, setLastSyncTime] = useState<number | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [slideAnim] = useState(new Animated.Value(0));

  const syncManager = SyncManager.getInstance();
  const conflictResolver = ConflictResolverService.getInstance();

  /**
   * Load initial data
   */
  useEffect(() => {
    loadData();
    setupListeners();

    return () => {
      // Cleanup listeners
    };
  }, []);

  /**
   * Load data
   */
  const loadData = useCallback(async () => {
    try {
      const state = syncManager.getSyncState();
      setNetworkState(state.networkState);
      setIsSyncing(state.isSyncing);
      setSyncProgress(state.syncProgress);
      setLastSyncTime(state.lastSyncTime);

      const pending = await syncManager.getPendingCount();
      setPendingCount(pending);

      const unresolved = await conflictResolver.getUnresolvedCount();
      setConflictCount(unresolved);
    } catch (error) {
      console.error('[OfflineIndicator] Failed to load data:', error);
    }
  }, []);

  /**
   * Setup listeners
   */
  const setupListeners = useCallback(() => {
    // Listen to sync state changes
    syncManager.addStateListener((state) => {
      setNetworkState(state.networkState);
      setIsSyncing(state.isSyncing);
      setSyncProgress(state.syncProgress);
      setLastSyncTime(state.lastSyncTime);

      // Reload counts
      loadData();
    });
  }, [loadData]);

  /**
   * Animate banner visibility
   */
  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: isVisible ? 1 : 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [isVisible]);

  /**
   * Auto-hide when conditions met
   */
  useEffect(() => {
    if (autoHide) {
      const shouldHide =
        networkState?.isConnected &&
        !isSyncing &&
        pendingCount === 0 &&
        conflictCount === 0;

      setIsVisible(!shouldHide);
    } else {
      setIsVisible(true);
    }
  }, [autoHide, networkState, isSyncing, pendingCount, conflictCount]);

  /**
   * Handle sync button press
   */
  const handleSyncPress = useCallback(async () => {
    try {
      await syncManager.forceSync();
    } catch (error) {
      console.error('[OfflineIndicator] Sync failed:', error);
    }
  }, []);

  /**
   * Get connection status text
   */
  const getConnectionStatus = (): string => {
    if (!networkState) return 'Checking connection...';

    if (!networkState.isConnected) {
      return 'Offline';
    }

    if (networkState.isInternetReachable === false) {
      return 'No Internet';
    }

    return networkState.type === 'wifi' ? 'Online (WiFi)' : 'Online (Cellular)';
  };

  /**
   * Get connection icon
   */
  const getConnectionIcon = (): string => {
    if (!networkState?.isConnected) return 'wifi-off';
    if (networkState.type === 'wifi') return 'wifi';
    if (networkState.type === 'cellular') return 'signal';
    return 'network';
  };

  /**
   * Get connection color
   */
  const getConnectionColor = (): string => {
    if (!networkState?.isConnected) return '#f44336';
    if (networkState.isInternetReachable === false) return '#ff9800';
    return '#4caf50';
  };

  /**
   * Format last sync time
   */
  const formatLastSync = (): string => {
    if (!lastSyncTime) return 'Never';
    return formatDistanceToNow(lastSyncTime, { addSuffix: true });
  };

  if (!isVisible) {
    return null;
  }

  const translateY = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: position === 'top' ? [-100, 0] : [100, 0],
  });

  return (
    <>
      <Animated.View
        style={[
          styles.container,
          position === 'top' ? styles.top : styles.bottom,
          { transform: [{ translateY }] },
        ]}
      >
        <Banner
          visible={true}
          icon={({ size }) => (
            <Icon
              name={getConnectionIcon()}
              size={size}
              color={getConnectionColor()}
            />
          )}
          actions={
            showSyncButton && !isSyncing
              ? [
                  {
                    label: 'Sync',
                    onPress: handleSyncPress,
                    disabled: !networkState?.isConnected,
                  },
                ]
              : []
          }
          elevation={2}
          style={styles.banner}
        >
          <View style={styles.content}>
            <View style={styles.statusRow}>
              <Text style={styles.statusText}>{getConnectionStatus()}</Text>

              {pendingCount > 0 && (
                <View style={styles.badge}>
                  <Icon name="sync" size={16} color="#666" />
                  <Text style={styles.badgeText}>{pendingCount} pending</Text>
                </View>
              )}

              {showConflictCount && conflictCount > 0 && (
                <TouchableOpacity
                  style={styles.badge}
                  onPress={onConflictPress}
                >
                  <Icon name="alert" size={16} color="#f44336" />
                  <Text style={[styles.badgeText, styles.conflictText]}>
                    {conflictCount} conflicts
                  </Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={styles.detailsButton}
                onPress={() => setShowDetails(true)}
              >
                <Icon name="information" size={20} color="#666" />
              </TouchableOpacity>
            </View>

            {isSyncing && syncProgress && (
              <View style={styles.progressContainer}>
                <ProgressBar
                  progress={syncProgress.percentage / 100}
                  color="#2196f3"
                  style={styles.progressBar}
                />
                <Text style={styles.progressText}>
                  Syncing... {syncProgress.completed}/{syncProgress.total} (
                  {Math.round(syncProgress.percentage)}%)
                </Text>
              </View>
            )}

            {!isSyncing && lastSyncTime && (
              <Text style={styles.lastSyncText}>
                Last synced: {formatLastSync()}
              </Text>
            )}
          </View>
        </Banner>
      </Animated.View>

      {/* Details Dialog */}
      <Portal>
        <Dialog visible={showDetails} onDismiss={() => setShowDetails(false)}>
          <Dialog.Title>Sync Status</Dialog.Title>
          <Dialog.Content>
            <View style={styles.dialogRow}>
              <Text style={styles.dialogLabel}>Status:</Text>
              <Text style={styles.dialogValue}>{getConnectionStatus()}</Text>
            </View>

            <View style={styles.dialogRow}>
              <Text style={styles.dialogLabel}>Pending items:</Text>
              <Text style={styles.dialogValue}>{pendingCount}</Text>
            </View>

            <View style={styles.dialogRow}>
              <Text style={styles.dialogLabel}>Conflicts:</Text>
              <Text style={styles.dialogValue}>{conflictCount}</Text>
            </View>

            <View style={styles.dialogRow}>
              <Text style={styles.dialogLabel}>Last sync:</Text>
              <Text style={styles.dialogValue}>{formatLastSync()}</Text>
            </View>

            <View style={styles.dialogRow}>
              <Text style={styles.dialogLabel}>Auto-sync:</Text>
              <Text style={styles.dialogValue}>
                {syncManager.isAutoSyncEnabled() ? 'Enabled' : 'Disabled'}
              </Text>
            </View>

            {isSyncing && syncProgress && (
              <>
                <View style={styles.dialogDivider} />
                <Paragraph style={styles.dialogTitle}>
                  Sync Progress
                </Paragraph>

                <View style={styles.dialogRow}>
                  <Text style={styles.dialogLabel}>Total:</Text>
                  <Text style={styles.dialogValue}>{syncProgress.total}</Text>
                </View>

                <View style={styles.dialogRow}>
                  <Text style={styles.dialogLabel}>Completed:</Text>
                  <Text style={styles.dialogValue}>
                    {syncProgress.completed}
                  </Text>
                </View>

                <View style={styles.dialogRow}>
                  <Text style={styles.dialogLabel}>Failed:</Text>
                  <Text style={styles.dialogValue}>{syncProgress.failed}</Text>
                </View>

                <View style={styles.dialogRow}>
                  <Text style={styles.dialogLabel}>Progress:</Text>
                  <Text style={styles.dialogValue}>
                    {Math.round(syncProgress.percentage)}%
                  </Text>
                </View>
              </>
            )}
          </Dialog.Content>
          <Dialog.Actions>
            {networkState?.isConnected && !isSyncing && (
              <Button onPress={handleSyncPress}>Sync Now</Button>
            )}
            <Button onPress={() => setShowDetails(false)}>Close</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 1000,
    elevation: 5,
  },
  top: {
    top: 0,
  },
  bottom: {
    bottom: 0,
  },
  banner: {
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginBottom: 4,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
    marginRight: 12,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
  },
  badgeText: {
    fontSize: 12,
    marginLeft: 4,
    color: '#666',
  },
  conflictText: {
    color: '#f44336',
    fontWeight: '600',
  },
  detailsButton: {
    marginLeft: 'auto',
    padding: 4,
  },
  progressContainer: {
    marginTop: 8,
  },
  progressBar: {
    height: 4,
    borderRadius: 2,
  },
  progressText: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  lastSyncText: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  dialogRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  dialogLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  dialogValue: {
    fontSize: 14,
    color: '#333',
  },
  dialogDivider: {
    height: 1,
    backgroundColor: '#e0e0e0',
    marginVertical: 16,
  },
  dialogTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
});

export default OfflineIndicator;
