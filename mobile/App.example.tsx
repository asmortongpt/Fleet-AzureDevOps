/**
 * Fleet Mobile App - Example Implementation
 *
 * This example shows how to integrate the offline queue system
 * into your React Native app.
 */

import React, { useEffect, useState } from 'react';
import {
  SafeAreaView,
  StyleSheet,
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Provider as PaperProvider, Button, Card, Title, Paragraph } from 'react-native-paper';

// Import offline system components
import { OfflineIndicator } from './src/components/OfflineIndicator';
import { useSync } from './src/hooks/useSync';
import SyncManager from './src/services/SyncManager';
import OfflineQueueService from './src/services/OfflineQueueService';
import DataPersistence from './src/services/DataPersistence';
import { Priority, HttpMethod, OperationType } from './src/types/queue';

/**
 * Main App Component
 */
function App(): JSX.Element {
  const [isInitialized, setIsInitialized] = useState(false);

  /**
   * Initialize services on app start
   */
  useEffect(() => {
    initializeServices();
  }, []);

  /**
   * Initialize all offline services
   */
  const initializeServices = async () => {
    try {
      console.log('[App] Initializing services...');

      // Initialize data persistence
      await DataPersistence.initialize();

      // Initialize sync manager (this also initializes queue and conflict resolver)
      await SyncManager.getInstance().initialize();

      // Setup request interceptor for auth token
      OfflineQueueService.addRequestInterceptor(async (queueItem) => {
        // Add auth token to all requests
        const token = await getAuthToken();
        return {
          ...queueItem,
          headers: {
            ...queueItem.headers,
            Authorization: `Bearer ${token}`,
          },
        };
      });

      // Setup response interceptor for caching
      OfflineQueueService.addResponseInterceptor(async (result, queueItem) => {
        // Cache successful GET requests
        if (result.success && queueItem.method === HttpMethod.GET) {
          await DataPersistence.setCache(
            queueItem.url,
            result.response,
            3600000 // 1 hour
          );
        }
        return result;
      });

      setIsInitialized(true);
      console.log('[App] Services initialized successfully');
    } catch (error) {
      console.error('[App] Failed to initialize services:', error);
      Alert.alert('Error', 'Failed to initialize app services');
    }
  };

  /**
   * Get auth token (mock implementation)
   */
  const getAuthToken = async (): Promise<string> => {
    // In production, get token from secure storage
    return 'mock_auth_token_12345';
  };

  if (!isInitialized) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text>Initializing...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <PaperProvider>
      <SafeAreaView style={styles.container}>
        {/* Offline Indicator - shows at top of screen */}
        <OfflineIndicator
          autoHide={true}
          position="top"
          showSyncButton={true}
          showConflictCount={true}
        />

        <ScrollView style={styles.scrollView}>
          <HomeScreen />
        </ScrollView>
      </SafeAreaView>
    </PaperProvider>
  );
}

/**
 * Home Screen Component
 */
function HomeScreen(): JSX.Element {
  const {
    isOnline,
    isSyncing,
    pendingCount,
    startSync,
    forceSync,
  } = useSync();

  /**
   * Example: Create vehicle inspection (offline-capable)
   */
  const createInspection = async () => {
    try {
      const inspectionData = {
        vehicleId: 'V123',
        driverId: 'D456',
        timestamp: Date.now(),
        status: 'passed',
        checklist: {
          tires: true,
          lights: true,
          brakes: true,
          fluids: true,
        },
        notes: 'All systems normal',
      };

      // This will be queued if offline, or sent immediately if online
      await OfflineQueueService.enqueue(
        'https://api.fleet.com/v1/inspections',
        HttpMethod.POST,
        {
          body: inspectionData,
          priority: Priority.HIGH,
          operationType: OperationType.CREATE,
          resourceType: 'inspection',
        }
      );

      Alert.alert(
        'Success',
        isOnline
          ? 'Inspection submitted successfully'
          : 'Inspection saved. Will sync when online.'
      );
    } catch (error) {
      console.error('Failed to create inspection:', error);
      Alert.alert('Error', 'Failed to create inspection');
    }
  };

  /**
   * Example: Update vehicle location (offline-capable)
   */
  const updateVehicleLocation = async () => {
    try {
      const locationData = {
        vehicleId: 'V123',
        latitude: 37.7749,
        longitude: -122.4194,
        timestamp: Date.now(),
        speed: 45,
        heading: 90,
      };

      await OfflineQueueService.enqueue(
        'https://api.fleet.com/v1/vehicles/V123/location',
        HttpMethod.PUT,
        {
          body: locationData,
          priority: Priority.MEDIUM,
          operationType: OperationType.UPDATE,
          resourceType: 'vehicle',
          resourceId: 'V123',
        }
      );

      Alert.alert('Success', 'Location updated');
    } catch (error) {
      console.error('Failed to update location:', error);
      Alert.alert('Error', 'Failed to update location');
    }
  };

  /**
   * Example: Get vehicles from cache or API
   */
  const getVehicles = async () => {
    try {
      // Try cache first
      const cached = await DataPersistence.getCache('vehicles');
      if (cached) {
        Alert.alert('Vehicles', `Found ${cached.length} vehicles (from cache)`);
        return;
      }

      // If online, fetch from API
      if (isOnline) {
        await OfflineQueueService.enqueue(
          'https://api.fleet.com/v1/vehicles',
          HttpMethod.GET,
          {
            priority: Priority.LOW,
            operationType: OperationType.CREATE, // GET doesn't have specific operation
            resourceType: 'vehicle',
          }
        );
        Alert.alert('Vehicles', 'Fetching vehicles...');
      } else {
        Alert.alert('Offline', 'No cached data available');
      }
    } catch (error) {
      console.error('Failed to get vehicles:', error);
      Alert.alert('Error', 'Failed to get vehicles');
    }
  };

  /**
   * Get storage statistics
   */
  const showStorageStats = async () => {
    try {
      const stats = await DataPersistence.getStorageStats();
      Alert.alert(
        'Storage Statistics',
        `Queue items: ${stats.queueItemCount}\n` +
        `Cache items: ${stats.cacheItemCount}\n` +
        `Database size: ${(stats.databaseSize / 1024 / 1024).toFixed(2)} MB\n` +
        `Available space: ${(stats.availableSize / 1024 / 1024 / 1024).toFixed(2)} GB`
      );
    } catch (error) {
      console.error('Failed to get storage stats:', error);
      Alert.alert('Error', 'Failed to get storage statistics');
    }
  };

  return (
    <View style={styles.content}>
      <Card style={styles.card}>
        <Card.Content>
          <Title>Fleet Mobile App</Title>
          <Paragraph>
            Status: {isOnline ? '🟢 Online' : '🔴 Offline'}
          </Paragraph>
          <Paragraph>
            Pending operations: {pendingCount}
          </Paragraph>
          {isSyncing && <Paragraph>⏳ Syncing...</Paragraph>}
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Content>
          <Title>Offline-Capable Operations</Title>
        </Card.Content>
        <Card.Actions>
          <Button mode="contained" onPress={createInspection}>
            Create Inspection
          </Button>
        </Card.Actions>
        <Card.Actions>
          <Button mode="contained" onPress={updateVehicleLocation}>
            Update Location
          </Button>
        </Card.Actions>
        <Card.Actions>
          <Button mode="outlined" onPress={getVehicles}>
            Get Vehicles
          </Button>
        </Card.Actions>
      </Card>

      <Card style={styles.card}>
        <Card.Content>
          <Title>Sync Controls</Title>
        </Card.Content>
        <Card.Actions>
          <Button
            mode="contained"
            onPress={startSync}
            disabled={!isOnline || isSyncing}
          >
            Sync Now
          </Button>
        </Card.Actions>
        <Card.Actions>
          <Button
            mode="outlined"
            onPress={forceSync}
            disabled={isSyncing}
          >
            Force Sync
          </Button>
        </Card.Actions>
      </Card>

      <Card style={styles.card}>
        <Card.Content>
          <Title>Storage Management</Title>
        </Card.Content>
        <Card.Actions>
          <Button mode="outlined" onPress={showStorageStats}>
            Storage Stats
          </Button>
        </Card.Actions>
        <Card.Actions>
          <Button
            mode="outlined"
            onPress={async () => {
              await OfflineQueueService.clearCompleted();
              Alert.alert('Success', 'Cleared completed items');
            }}
          >
            Clear Completed
          </Button>
        </Card.Actions>
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  card: {
    marginBottom: 16,
  },
});

export default App;
