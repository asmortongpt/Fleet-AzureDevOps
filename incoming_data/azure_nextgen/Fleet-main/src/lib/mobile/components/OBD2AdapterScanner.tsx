import React, { useState, useEffect } from 'react'

import {
  OBD2Service,
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
  // Create OBD2Service instance
  const [obd2Service] = useState(() => new OBD2Service())
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
      if (obd2Service.isConnected()) {
        obd2Service.disconnect()
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoConnect])

  // =====================================================
  // Saved Adapter Management
  // =====================================================

  const loadSavedAdapter = async () => {
    try {
      const savedAdapterJson = localStorage.getItem('savedOBD2Adapter')
      if (savedAdapterJson) {
        const savedAdapter: OBD2Adapter = JSON.parse(savedAdapterJson)

        // Attempt to reconnect to saved adapter
        setConnectionStatus('Reconnecting to saved adapter...')
        const success = await obd2Service.connect(savedAdapter)

        if (success) {
          setConnectedAdapter(savedAdapter)
          setConnectionStatus('Connected')
          onAdapterConnected?.(savedAdapter)

          // Read diagnostics if enabled
          if (showDiagnostics) {
            try {
              const diagnosticCodes = await obd2Service.readDTCs()
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
      localStorage.setItem('savedOBD2Adapter', JSON.stringify(adapter))
      logger.debug('Saved paired adapter:', adapter.name)
    } catch (error) {
      logger.error('Error saving adapter:', error)
    }
  }

  const clearSavedAdapter = async () => {
    try {
      localStorage.removeItem('savedOBD2Adapter')
      logger.debug('Cleared saved adapter')
    } catch (error) {
      logger.error('Error clearing saved adapter:', error)
    }
  }

  // =====================================================
  // Permissions
  // =====================================================

  const requestPermissions = async () => {
    // Web-based permission handling
    try {
      // For web, request necessary permissions using Web Permissions API
      if (navigator.permissions) {
        const permissions = [
          'bluetooth',
          'geolocation'
        ]

        for (const perm of permissions) {
          try {
            await navigator.permissions.query({ name: perm as PermissionName })
          } catch (error) {
            logger.error(`Permission query error for ${perm}:`, error)
          }
        }
      }
    } catch (error) {
      logger.error('Permission request error:', error)
    }
  }

  // =====================================================
  // Scanning
  // =====================================================

  const scanForAdapters = async () => {
    try {
      setIsScanning(true)
      setConnectionStatus('Scanning for adapters...')

      const foundAdapters = await obd2Service.scanForAdapters()

      setAdapters(foundAdapters)
      setConnectionStatus(`Found ${foundAdapters.length} adapter(s)`)

      if (foundAdapters.length === 0) {
        logger.warn('No adapters found during scan')
      }
    } catch (error: unknown) {
      setConnectionStatus('Scan failed')
      onError?.(error as Error)
      logger.error('Scan error:', error)
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
      const success = await obd2Service.connect(adapter)

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
        const vehicleVIN = await obd2Service.readVIN()
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
          const diagnosticCodes = await obd2Service.readDTCs()
          setDtcs(diagnosticCodes)
          onDTCsDetected?.(diagnosticCodes)

          if (diagnosticCodes.length > 0) {
            logger.info(`Found ${diagnosticCodes.length} diagnostic trouble code(s)`)
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

      logger.info(`Connected successfully to ${adapter.name}${vin ? ` - VIN: ${vin}` : ''}`)
    } catch (error: unknown) {
      setConnectionStatus('Connection failed')
      setConnectedAdapter(null)
      onError?.(error as Error)
      logger.error('Connection error:', error)
    } finally {
      setIsConnecting(false)
    }
  }

  const disconnectAdapter = async () => {
    try {
      setConnectionStatus('Disconnecting...')

      await obd2Service.disconnect()

      setConnectedAdapter(null)
      setDtcs([])
      setLiveData(null)
      setVin(null)
      setConnectionStatus('Disconnected')

      // Clear saved adapter on manual disconnect
      await clearSavedAdapter()

      onAdapterDisconnected?.()

      logger.info('Disconnected from OBD2 adapter')
    } catch (error: unknown) {
      onError?.(error as Error)
      logger.error('Disconnect error:', error)
    }
  }

  // =====================================================
  // Diagnostics
  // =====================================================

  const readDiagnostics = async () => {
    if (!connectedAdapter) {
      logger.warn('Not connected to adapter')
      return
    }

    try {
      setConnectionStatus('Reading diagnostic codes...')

      const diagnosticCodes = await obd2Service.readDTCs()
      setDtcs(diagnosticCodes)
      onDTCsDetected?.(diagnosticCodes)

      setConnectionStatus('Connected')

      if (diagnosticCodes.length === 0) {
        logger.info('No diagnostic trouble codes detected')
      }
    } catch (error: unknown) {
      onError?.(error as Error)
      logger.error('Error reading DTCs:', error)
    }
  }

  const clearDiagnostics = async () => {
    if (!connectedAdapter) {
      logger.warn('Not connected to adapter')
      return
    }

    try {
      setConnectionStatus('Clearing codes...')

      const success = await obd2Service.clearDTCs()

      if (success) {
        setDtcs([])
        setConnectionStatus('Connected')
        logger.info('Diagnostic codes cleared successfully')
      } else {
        throw new Error('Failed to clear codes')
      }
    } catch (error: unknown) {
      setConnectionStatus('Connected')
      onError?.(error as Error)
      logger.error('Error clearing codes:', error)
    }
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

    obd2Service.startLiveDataStream(pidKeys, (data: LiveOBD2Data) => {
      setLiveData(data)
      onLiveDataUpdate?.(data)
    }, 1000)

    setConnectionStatus('Connected - Live Data Active')
  }

  const stopLiveDataStream = () => {
    obd2Service.stopLiveDataStream()
    setLiveData(null)
    setConnectionStatus('Connected')
  }

  // =====================================================
  // Render Helpers
  // =====================================================

  const renderAdapter = ({ item }: { item: OBD2Adapter }) => (
    <div
      style={{
        backgroundColor: '#fff',
        borderRadius: 10,
        padding: 16,
        marginBottom: 16,
        border: item.isConnected ? '2px solid #4CAF50' : '1px solid #ddd',
        cursor: isConnecting || item.isConnected ? 'not-allowed' : 'pointer',
        opacity: isConnecting || item.isConnected ? 0.6 : 1
      }}
      onClick={() => !isConnecting && !item.isConnected && connectToAdapter(item)}
    >
      <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
        <div style={{
          width: 40,
          height: 40,
          borderRadius: 20,
          backgroundColor: '#e0e0e0',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          marginRight: 12,
          fontSize: 20
        }}>
          {item.connectionType === ConnectionType.BLUETOOTH ? '📶' : '📡'}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 2 }}>{item.name}</div>
          <div style={{ fontSize: 14, color: '#666', marginBottom: 2 }}>
            {item.type} • {item.connectionType.toUpperCase()}
          </div>
          <div style={{ fontSize: 12, color: '#999' }}>{item.address}</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          {item.isConnected ? (
            <div style={{
              backgroundColor: '#4CAF50',
              paddingLeft: 8,
              paddingRight: 8,
              paddingTop: 2,
              paddingBottom: 2,
              borderRadius: 4,
              marginBottom: 4,
              color: '#fff',
              fontSize: 12,
              fontWeight: 'bold'
            }}>Connected</div>
          ) : item.isPaired ? (
            <div style={{
              backgroundColor: '#2196F3',
              paddingLeft: 8,
              paddingRight: 8,
              paddingTop: 2,
              paddingBottom: 2,
              borderRadius: 4,
              marginBottom: 4,
              color: '#fff',
              fontSize: 12,
              fontWeight: 'bold'
            }}>Paired</div>
          ) : null}
          {item.rssi && (
            <div style={{ fontSize: 12, color: '#666' }}>
              Signal: {item.rssi} dBm
            </div>
          )}
        </div>
      </div>
    </div>
  )

  const renderDTC = ({ item }: { item: DiagnosticTroubleCode }) => (
    <div style={{
      backgroundColor: '#fff',
      borderRadius: 10,
      padding: 16,
      marginBottom: 16,
      borderLeft: item.severity === 'critical' ? '4px solid #F44336' : item.severity === 'major' ? '4px solid #FF9800' : '4px solid #ddd'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <div style={{ fontSize: 18, fontWeight: 'bold' }}>{item.code}</div>
        {item.isMILOn && (
          <div style={{
            backgroundColor: '#F44336',
            paddingLeft: 8,
            paddingRight: 8,
            paddingTop: 2,
            paddingBottom: 2,
            borderRadius: 4,
            color: '#fff',
            fontSize: 12,
            fontWeight: 'bold'
          }}>⚠️ MIL ON</div>
        )}
      </div>
      <div style={{ fontSize: 14, marginBottom: 8 }}>{item.description}</div>
      <div style={{ fontSize: 12, color: '#666' }}>
        Type: {item.type} • Severity: {item.severity}
      </div>
    </div>
  )

  // =====================================================
  // Main Render
  // =====================================================

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      backgroundColor: '#f5f5f5',
      padding: 16,
      minHeight: '100vh'
    }}>
      {/* Header */}
      <div style={{
        marginBottom: 20,
        textAlign: 'center'
      }}>
        <h1 style={{
          fontSize: 22,
          fontWeight: 'bold',
          marginBottom: 8,
          margin: '0 0 8px 0'
        }}>OBD2 Adapter Scanner</h1>
        <div style={{
          fontSize: 16,
          color: '#666'
        }}>{connectionStatus}</div>
      </div>

      {/* Connected Adapter Info */}
      {connectedAdapter && (
        <div style={{
          marginBottom: 24,
          backgroundColor: '#fff',
          borderRadius: 10,
          padding: 16,
          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
        }}>
          <div style={{
            textAlign: 'center'
          }}>
            <div style={{
              fontSize: 18,
              fontWeight: 'bold',
              marginBottom: 8
            }}>Connected Adapter</div>
            <div style={{
              fontSize: 16,
              fontWeight: '500',
              marginBottom: 4
            }}>{connectedAdapter.name}</div>
            {vin && <div style={{
              fontSize: 14,
              color: '#666',
              marginBottom: 4
            }}>VIN: {vin}</div>}
            {connectedAdapter.firmwareVersion && (
              <div style={{
                fontSize: 14,
                color: '#666'
              }}>
                Firmware: {connectedAdapter.firmwareVersion}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}