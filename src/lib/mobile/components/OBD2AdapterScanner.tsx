import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Platform,
  PermissionsAndroid
} from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'

import OBD2Service, {
  OBD2Adapter,
  ConnectionType,
  DiagnosticTroubleCode,
  LiveOBD2Data
} from '../services/OBD2Service'

import logger from '@/utils/logger';

// =====================================================
// Component Props
// =====================================================

export interface OBD2AdapterScannerProps {
  vehicleId?: number
  onAdapterConnected?: (adapter: OBD2Adapter, vin?: string) => void
  onAdapterDisconnected?: () => void
  onDTCsDetected?: (dtcs: DiagnosticTroubleCode[]) => void
  onLiveDataUpdate?: (data: LiveOBD2Data) => void
  onError?: (error: Error) => void
  autoConnect?: boolean // Auto-connect to previously paired adapter
  showDiagnostics?: boolean // Show DTCs after connection
  enableLiveData?: boolean // Enable live data streaming
}

// =====================================================
// Main Component
// =====================================================

export const OBD2AdapterScanner: React.FC<OBD2AdapterScannerProps> = ({
  vehicleId: _vehicleId,
  onAdapterConnected,
  onAdapterDisconnected,
  onDTCsDetected,
  onLiveDataUpdate,
  onError,
  autoConnect = false,
  showDiagnostics = true,
  enableLiveData = false
}) => {
  const [adapters, setAdapters] = useState<OBD2Adapter[]>([])
  const [isScanning, setIsScanning] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [connectedAdapter, setConnectedAdapter] = useState<OBD2Adapter | null>(null)
  const [connectionStatus, setConnectionStatus] = useState<string>('Disconnected')
  const [dtcs, setDtcs] = useState<DiagnosticTroubleCode[]>([])
  const [liveData, setLiveData] = useState<LiveOBD2Data | null>(null)
  const [vin, setVin] = useState<string | null>(null)

  useEffect(() => {
    requestPermissions()

    if (autoConnect) {
      // Auto-connect to previously paired adapter
      loadSavedAdapter()
    }

    return () => {
      // Cleanup on unmount
      if (OBD2Service.isConnected()) {
        OBD2Service.disconnect()
      }
    }
  }, [autoConnect])

  // =====================================================
  // Saved Adapter Management
  // =====================================================

  const loadSavedAdapter = async () => {
    try {
      const savedAdapterJson = await AsyncStorage.getItem('savedOBD2Adapter')
      if (savedAdapterJson) {
        const savedAdapter: OBD2Adapter = JSON.parse(savedAdapterJson)

        // Attempt to reconnect to saved adapter
        setConnectionStatus('Reconnecting to saved adapter...')
        const success = await OBD2Service.connect(savedAdapter)

        if (success) {
          setConnectedAdapter(savedAdapter)
          setConnectionStatus('Connected')
          onAdapterConnected?.(savedAdapter)

          // Read diagnostics if enabled
          if (showDiagnostics) {
            try {
              const diagnosticCodes = await OBD2Service.readDTCs()
              setDtcs(diagnosticCodes)
              onDTCsDetected?.(diagnosticCodes)
            } catch (error) {
              logger.warn('Could not read DTCs on reconnect:', error)
            }
          }

          // Start live data if enabled
          if (enableLiveData) {
            startLiveDataStream()
          }
        } else {
          setConnectionStatus('Failed to reconnect')
          logger.warn('Could not reconnect to saved adapter')
        }
      }
    } catch (error) {
      logger.error('Error loading saved adapter:', error)
      setConnectionStatus('Disconnected')
    }
  }

  const savePairedAdapter = async (adapter: OBD2Adapter) => {
    try {
      await AsyncStorage.setItem('savedOBD2Adapter', JSON.stringify(adapter))
      logger.debug('Saved paired adapter:', adapter.name)
    } catch (error) {
      logger.error('Error saving adapter:', error)
    }
  }

  const clearSavedAdapter = async () => {
    try {
      await AsyncStorage.removeItem('savedOBD2Adapter')
      logger.debug('Cleared saved adapter')
    } catch (error) {
      logger.error('Error clearing saved adapter:', error)
    }
  }

  // =====================================================
  // Permissions
  // =====================================================

  const requestPermissions = async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
        ])

        const allGranted = Object.values(granted).every(
          status => status === PermissionsAndroid.RESULTS.GRANTED
        )

        if (!allGranted) {
          Alert.alert(
            'Permissions Required',
            'Bluetooth and location permissions are required to scan for OBD2 adapters.'
          )
        }
      } catch (error) {
        logger.error('Permission request error:', error)
      }
    }
  }

  // =====================================================
  // Scanning
  // =====================================================

  const scanForAdapters = async () => {
    try {
      setIsScanning(true)
      setConnectionStatus('Scanning for adapters...')

      const foundAdapters = await OBD2Service.scanForAdapters()

      setAdapters(foundAdapters)
      setConnectionStatus(`Found ${foundAdapters.length} adapter(s)`)

      if (foundAdapters.length === 0) {
        Alert.alert(
          'No Adapters Found',
          'Make sure your OBD2 adapter is plugged in and turned on. Check that Bluetooth is enabled on your device.'
        )
      }
    } catch (error: unknown) {
      setConnectionStatus('Scan failed')
      onError?.(error as Error)
      Alert.alert('Scan Error', (error as Error).message)
    } finally {
      setIsScanning(false)
    }
  }

  // =====================================================
  // Connection
  // =====================================================

  const connectToAdapter = async (adapter: OBD2Adapter) => {
    try {
      setIsConnecting(true)
      setConnectionStatus(`Connecting to ${adapter.name}...`)

      // Connect
      const success = await OBD2Service.connect(adapter)

      if (!success) {
        throw new Error('Connection failed')
      }

      setConnectedAdapter(adapter)
      setConnectionStatus('Connected')

      // Save adapter for auto-reconnect
      await savePairedAdapter(adapter)

      // Read VIN
      setConnectionStatus('Reading VIN...')
      try {
        const vehicleVIN = await OBD2Service.readVIN()
        setVin(vehicleVIN)
        onAdapterConnected?.(adapter, vehicleVIN)
      } catch (error) {
        logger.warn('Could not read VIN:', error)
        onAdapterConnected?.(adapter)
      }

      // Read DTCs if enabled
      if (showDiagnostics) {
        setConnectionStatus('Reading diagnostic codes...')
        try {
          const diagnosticCodes = await OBD2Service.readDTCs()
          setDtcs(diagnosticCodes)
          onDTCsDetected?.(diagnosticCodes)

          if (diagnosticCodes.length > 0) {
            Alert.alert(
              'Diagnostic Codes Found',
              `Found ${diagnosticCodes.length} diagnostic trouble code(s). Check the diagnostics tab for details.`,
              [{ text: 'OK' }]
            )
          }
        } catch (error) {
          logger.warn('Could not read DTCs:', error)
        }
      }

      // Start live data if enabled
      if (enableLiveData) {
        startLiveDataStream()
      }

      setConnectionStatus('Connected')

      Alert.alert(
        'Connected Successfully',
        `Connected to ${adapter.name}${vin ? `\nVIN: ${vin}` : ''}`,
        [{ text: 'OK' }]
      )
    } catch (error: unknown) {
      setConnectionStatus('Connection failed')
      setConnectedAdapter(null)
      onError?.(error as Error)
      Alert.alert('Connection Error', (error as Error).message)
    } finally {
      setIsConnecting(false)
    }
  }

  const disconnectAdapter = async () => {
    try {
      setConnectionStatus('Disconnecting...')

      await OBD2Service.disconnect()

      setConnectedAdapter(null)
      setDtcs([])
      setLiveData(null)
      setVin(null)
      setConnectionStatus('Disconnected')

      // Clear saved adapter on manual disconnect
      await clearSavedAdapter()

      onAdapterDisconnected?.()

      Alert.alert('Disconnected', 'Disconnected from OBD2 adapter')
    } catch (error: unknown) {
      onError?.(error as Error)
      Alert.alert('Disconnect Error', (error as Error).message)
    }
  }

  // =====================================================
  // Diagnostics
  // =====================================================

  const readDiagnostics = async () => {
    if (!connectedAdapter) {
      Alert.alert('Not Connected', 'Please connect to an adapter first')
      return
    }

    try {
      setConnectionStatus('Reading diagnostic codes...')

      const diagnosticCodes = await OBD2Service.readDTCs()
      setDtcs(diagnosticCodes)
      onDTCsDetected?.(diagnosticCodes)

      setConnectionStatus('Connected')

      if (diagnosticCodes.length === 0) {
        Alert.alert('No Codes Found', 'No diagnostic trouble codes detected. Vehicle is healthy!')
      }
    } catch (error: unknown) {
      onError?.(error as Error)
      Alert.alert('Error Reading DTCs', (error as Error).message)
    }
  }

  const clearDiagnostics = async () => {
    if (!connectedAdapter) {
      Alert.alert('Not Connected', 'Please connect to an adapter first')
      return
    }

    Alert.alert(
      'Clear Diagnostic Codes?',
      'This will clear all diagnostic trouble codes and turn off the check engine light. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear Codes',
          style: 'destructive',
          onPress: async () => {
            try {
              setConnectionStatus('Clearing codes...')

              const success = await OBD2Service.clearDTCs()

              if (success) {
                setDtcs([])
                setConnectionStatus('Connected')
                Alert.alert('Success', 'Diagnostic codes cleared successfully')
              } else {
                throw new Error('Failed to clear codes')
              }
            } catch (error: unknown) {
              setConnectionStatus('Connected')
              onError?.(error as Error)
              Alert.alert('Error Clearing Codes', (error as Error).message)
            }
          }
        }
      ]
    )
  }

  // =====================================================
  // Live Data
  // =====================================================

  const startLiveDataStream = () => {
    const pidKeys = [
      'ENGINE_RPM',
      'VEHICLE_SPEED',
      'THROTTLE_POS',
      'COOLANT_TEMP',
      'INTAKE_TEMP',
      'MAF_FLOW',
      'FUEL_LEVEL',
      'CONTROL_MODULE_VOLTAGE',
      'ENGINE_LOAD'
    ]

    OBD2Service.startLiveDataStream(pidKeys, 1000, (data: LiveOBD2Data) => {
      setLiveData(data)
      onLiveDataUpdate?.(data)
    })

    setConnectionStatus('Connected - Live Data Active')
  }

  const stopLiveDataStream = () => {
    OBD2Service.stopLiveDataStream()
    setLiveData(null)
    setConnectionStatus('Connected')
  }

  // =====================================================
  // Render Helpers
  // =====================================================

  const renderAdapter = ({ item }: { item: OBD2Adapter }) => (
    <TouchableOpacity
      style={[
        styles.adapterCard,
        item.isConnected && styles.adapterCardConnected
      ]}
      onPress={() => connectToAdapter(item)}
      disabled={isConnecting || item.isConnected}
    >
      <View style={styles.adapterHeader}>
        <View style={styles.adapterIcon}>
          <Text style={styles.adapterIconText}>
            {item.connectionType === ConnectionType.BLUETOOTH ? '📶' : '📡'}
          </Text>
        </View>
        <View style={styles.adapterInfo}>
          <Text style={styles.adapterName}>{item.name}</Text>
          <Text style={styles.adapterDetails}>
            {item.type} • {item.connectionType.toUpperCase()}
          </Text>
          <Text style={styles.adapterAddress}>{item.address}</Text>
        </View>
        <View style={styles.adapterStatus}>
          {item.isConnected ? (
            <View style={styles.connectedBadge}>
              <Text style={styles.connectedBadgeText}>Connected</Text>
            </View>
          ) : item.isPaired ? (
            <View style={styles.pairedBadge}>
              <Text style={styles.pairedBadgeText}>Paired</Text>
            </View>
          ) : null}
          {item.rssi && (
            <Text style={styles.signalStrength}>
              Signal: {item.rssi} dBm
            </Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  )

  const renderDTC = ({ item }: { item: DiagnosticTroubleCode }) => (
    <View style={[
      styles.dtcCard,
      item.severity === 'critical' && styles.dtcCardCritical,
      item.severity === 'major' && styles.dtcCardMajor
    ]}>
      <View style={styles.dtcHeader}>
        <Text style={styles.dtcCode}>{item.code}</Text>
        {item.isMILOn && (
          <View style={styles.milBadge}>
            <Text style={styles.milBadgeText}>⚠️ MIL ON</Text>
          </View>
        )}
      </View>
      <Text style={styles.dtcDescription}>{item.description}</Text>
      <Text style={styles.dtcType}>
        Type: {item.type} • Severity: {item.severity}
      </Text>
    </View>
  )

  // =====================================================
  // Main Render
  // =====================================================

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>OBD2 Adapter Scanner</Text>
        <Text style={styles.status}>{connectionStatus}</Text>
      </View>

      {/* Connected Adapter Info */}
      {connectedAdapter && (
        <View style={styles.connectedSection}>
          <View style={styles.connectedInfo}>
            <Text style={styles.connectedTitle}>Connected Adapter</Text>
            <Text style={styles.connectedName}>{connectedAdapter.name}</Text>
            {vin && <Text style={styles.vinText}>VIN: {vin}</Text>}
            {connectedAdapter.firmwareVersion && (
              <Text style={styles.firmwareText}>
                Firmware: {connectedAdapter.firmwareVersion}
              </Text>
            )}
          </View>
        </View>
      )}
    </View>
  )
}

// =====================================================
// Styles
// =====================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 16
  },
  header: {
    marginBottom: 20,
    alignItems: 'center'
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 8
  },
  status: {
    fontSize: 16,
    color: '#666'
  },
  connectedSection: {
    marginBottom: 24,
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2
  },
  connectedInfo: {
    alignItems: 'center'
  },
  connectedTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8
  },
  connectedName: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4
  },
  vinText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4
  },
  firmwareText: {
    fontSize: 14,
    color: '#666'
  },
  adapterCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2
  },
  adapterCardConnected: {
    borderColor: '#4CAF50',
    borderWidth: 2
  },
  adapterHeader: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  adapterIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12
  },
  adapterIconText: {
    fontSize: 20
  },
  adapterInfo: {
    flex: 1
  },
  adapterName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 2
  },
  adapterDetails: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2
  },
  adapterAddress: {
    fontSize: 12,
    color: '#999'
  },
  adapterStatus: {
    alignItems: 'flex-end'
  },
  connectedBadge: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginBottom: 4
  },
  connectedBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold'
  },
  pairedBadge: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginBottom: 4
  },
  pairedBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold'
  },
  signalStrength: {
    fontSize: 12,
    color: '#666'
  },
  dtcCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2
  },
  dtcCardCritical: {
    borderLeftColor: '#F44336',
    borderLeftWidth: 4
  },
  dtcCardMajor: {
    borderLeftColor: '#FF9800',
    borderLeftWidth: 4
  },
  dtcHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8
  },
  dtcCode: {
    fontSize: 18,
    fontWeight: 'bold'
  },
  milBadge: {
    backgroundColor: '#F44336',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4
  },
  milBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold'
  },
  dtcDescription: {
    fontSize: 14,
    marginBottom: 8
  },
  dtcType: {
    fontSize: 12,
    color: '#666'
  }
})