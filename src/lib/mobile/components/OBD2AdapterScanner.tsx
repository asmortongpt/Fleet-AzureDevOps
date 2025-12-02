/**
 * OBD2 Adapter Scanner Component
 *
 * React Native component for:
 * - Scanning for nearby OBD2 adapters
 * - Displaying connection status
 * - Pairing interface
 * - Saving adapter to vehicle
 *
 * Usage:
 * ```tsx
 * <OBD2AdapterScanner
 *   vehicleId={vehicle.id}
 *   onAdapterConnected={(adapter) => console.log('Connected:', adapter)}
 *   onError={(error) => console.error(error)}
 * />
 * ```
 */

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

import OBD2Service, {
  OBD2Adapter,
  AdapterType,
  ConnectionType,
  DiagnosticTroubleCode,
  LiveOBD2Data
} from '../services/OBD2Service'

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
  vehicleId,
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
      // TODO: Load from AsyncStorage
    }

    return () => {
      // Cleanup on unmount
      if (OBD2Service.isConnected()) {
        OBD2Service.disconnect()
      }
    }
  }, [])

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
        console.error('Permission request error:', error)
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
    } catch (error: any) {
      setConnectionStatus('Scan failed')
      onError?.(error)
      Alert.alert('Scan Error', error.message)
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

      // Read VIN
      setConnectionStatus('Reading VIN...')
      try {
        const vehicleVIN = await OBD2Service.readVIN()
        setVin(vehicleVIN)
        onAdapterConnected?.(adapter, vehicleVIN)
      } catch (error) {
        console.warn('Could not read VIN:', error)
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
          console.warn('Could not read DTCs:', error)
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
    } catch (error: any) {
      setConnectionStatus('Connection failed')
      setConnectedAdapter(null)
      onError?.(error)
      Alert.alert('Connection Error', error.message)
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

      onAdapterDisconnected?.()

      Alert.alert('Disconnected', 'Disconnected from OBD2 adapter')
    } catch (error: any) {
      onError?.(error)
      Alert.alert('Disconnect Error', error.message)
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
    } catch (error: any) {
      onError?.(error)
      Alert.alert('Error Reading DTCs', error.message)
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
            } catch (error: any) {
              setConnectionStatus('Connected')
              onError?.(error)
              Alert.alert('Error Clearing Codes', error.message)
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

    OBD2Service.startLiveDataStream(pidKeys, 1000, (data) => {
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

          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={readDiagnostics}
            >
              <Text style={styles.actionButtonText}>Read DTCs</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, styles.actionButtonDanger]}
              onPress={clearDiagnostics}
            >
              <Text style={styles.actionButtonText}>Clear DTCs</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, styles.actionButtonSecondary]}
              onPress={disconnectAdapter}
            >
              <Text style={styles.actionButtonText}>Disconnect</Text>
            </TouchableOpacity>
          </View>

          {/* Live Data */}
          {liveData && (
            <View style={styles.liveDataSection}>
              <Text style={styles.liveDataTitle}>Live Data</Text>
              <View style={styles.liveDataGrid}>
                {liveData.engineRPM !== undefined && (
                  <View style={styles.liveDataItem}>
                    <Text style={styles.liveDataLabel}>RPM</Text>
                    <Text style={styles.liveDataValue}>{Math.round(liveData.engineRPM)}</Text>
                  </View>
                )}
                {liveData.vehicleSpeed !== undefined && (
                  <View style={styles.liveDataItem}>
                    <Text style={styles.liveDataLabel}>Speed</Text>
                    <Text style={styles.liveDataValue}>{Math.round(liveData.vehicleSpeed)} km/h</Text>
                  </View>
                )}
                {liveData.coolantTemp !== undefined && (
                  <View style={styles.liveDataItem}>
                    <Text style={styles.liveDataLabel}>Coolant</Text>
                    <Text style={styles.liveDataValue}>{Math.round(liveData.coolantTemp)}°C</Text>
                  </View>
                )}
                {liveData.throttlePosition !== undefined && (
                  <View style={styles.liveDataItem}>
                    <Text style={styles.liveDataLabel}>Throttle</Text>
                    <Text style={styles.liveDataValue}>{Math.round(liveData.throttlePosition)}%</Text>
                  </View>
                )}
                {liveData.fuelLevel !== undefined && (
                  <View style={styles.liveDataItem}>
                    <Text style={styles.liveDataLabel}>Fuel</Text>
                    <Text style={styles.liveDataValue}>{Math.round(liveData.fuelLevel)}%</Text>
                  </View>
                )}
                {liveData.batteryVoltage !== undefined && (
                  <View style={styles.liveDataItem}>
                    <Text style={styles.liveDataLabel}>Battery</Text>
                    <Text style={styles.liveDataValue}>{liveData.batteryVoltage.toFixed(1)}V</Text>
                  </View>
                )}
              </View>

              <TouchableOpacity
                style={[styles.actionButton, styles.actionButtonSecondary]}
                onPress={stopLiveDataStream}
              >
                <Text style={styles.actionButtonText}>Stop Live Data</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* DTCs */}
          {dtcs.length > 0 && (
            <View style={styles.dtcsSection}>
              <Text style={styles.dtcsTitle}>
                Diagnostic Codes ({dtcs.length})
              </Text>
              <FlatList
                data={dtcs}
                renderItem={renderDTC}
                keyExtractor={(item) => item.code}
                scrollEnabled={false}
              />
            </View>
          )}
        </View>
      )}

      {/* Scan Button */}
      {!connectedAdapter && (
        <TouchableOpacity
          style={styles.scanButton}
          onPress={scanForAdapters}
          disabled={isScanning}
        >
          {isScanning ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.scanButtonText}>
              {adapters.length > 0 ? 'Refresh Scan' : 'Scan for Adapters'}
            </Text>
          )}
        </TouchableOpacity>
      )}

      {/* Adapter List */}
      {!connectedAdapter && adapters.length > 0 && (
        <View style={styles.adapterList}>
          <Text style={styles.adapterListTitle}>Available Adapters</Text>
          <FlatList
            data={adapters}
            renderItem={renderAdapter}
            keyExtractor={(item) => item.id}
            refreshControl={
              <RefreshControl
                refreshing={isScanning}
                onRefresh={scanForAdapters}
              />
            }
          />
        </View>
      )}

      {/* Loading Overlay */}
      {isConnecting && (
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingCard}>
            <ActivityIndicator size="large" color="#0066CC" />
            <Text style={styles.loadingText}>{connectionStatus}</Text>
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
    backgroundColor: '#f5f5f5'
  },
  header: {
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0'
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8
  },
  status: {
    fontSize: 14,
    color: '#666'
  },
  connectedSection: {
    backgroundColor: '#fff',
    padding: 20,
    marginBottom: 10
  },
  connectedInfo: {
    marginBottom: 15
  },
  connectedTitle: {
    fontSize: 12,
    color: '#666',
    marginBottom: 5,
    textTransform: 'uppercase'
  },
  connectedName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0066CC',
    marginBottom: 5
  },
  vinText: {
    fontSize: 14,
    color: '#333',
    marginTop: 5
  },
  firmwareText: {
    fontSize: 12,
    color: '#666',
    marginTop: 5
  },
  actionButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 15
  },
  actionButton: {
    backgroundColor: '#0066CC',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
    marginRight: 10,
    marginBottom: 10
  },
  actionButtonSecondary: {
    backgroundColor: '#666'
  },
  actionButtonDanger: {
    backgroundColor: '#DC3545'
  },
  actionButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14
  },
  liveDataSection: {
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0'
  },
  liveDataTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10
  },
  liveDataGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 15
  },
  liveDataItem: {
    backgroundColor: '#f9f9f9',
    padding: 10,
    borderRadius: 8,
    minWidth: 100,
    alignItems: 'center'
  },
  liveDataLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 5
  },
  liveDataValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0066CC'
  },
  dtcsSection: {
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0'
  },
  dtcsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10
  },
  dtcCard: {
    backgroundColor: '#fff3cd',
    padding: 15,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#ffc107',
    marginBottom: 10
  },
  dtcCardCritical: {
    backgroundColor: '#f8d7da',
    borderLeftColor: '#DC3545'
  },
  dtcCardMajor: {
    backgroundColor: '#fff3cd',
    borderLeftColor: '#ff9800'
  },
  dtcHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5
  },
  dtcCode: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333'
  },
  milBadge: {
    backgroundColor: '#DC3545',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4
  },
  milBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold'
  },
  dtcDescription: {
    fontSize: 14,
    color: '#333',
    marginBottom: 5
  },
  dtcType: {
    fontSize: 12,
    color: '#666'
  },
  scanButton: {
    backgroundColor: '#0066CC',
    margin: 20,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center'
  },
  scanButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold'
  },
  adapterList: {
    flex: 1,
    padding: 20
  },
  adapterListTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15
  },
  adapterCard: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e0e0e0'
  },
  adapterCardConnected: {
    borderColor: '#0066CC',
    borderWidth: 2
  },
  adapterHeader: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  adapterIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15
  },
  adapterIconText: {
    fontSize: 24
  },
  adapterInfo: {
    flex: 1
  },
  adapterName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4
  },
  adapterDetails: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2
  },
  adapterAddress: {
    fontSize: 10,
    color: '#999'
  },
  adapterStatus: {
    alignItems: 'flex-end'
  },
  connectedBadge: {
    backgroundColor: '#28a745',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
    marginBottom: 5
  },
  connectedBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold'
  },
  pairedBadge: {
    backgroundColor: '#0066CC',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
    marginBottom: 5
  },
  pairedBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold'
  },
  signalStrength: {
    fontSize: 10,
    color: '#999'
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  loadingCard: {
    backgroundColor: '#fff',
    padding: 30,
    borderRadius: 10,
    alignItems: 'center'
  },
  loadingText: {
    marginTop: 15,
    fontSize: 14,
    color: '#333'
  }
})

export default OBD2AdapterScanner
