/**
 * OBD2 Service for Fleet Mobile App
 *
 * Provides OBD2 adapter connectivity and diagnostics:
 * - Scan for nearby adapters (Bluetooth/WiFi)
 * - Connect/disconnect from adapters
 * - Read VIN automatically
 * - Read/clear diagnostic trouble codes (DTCs)
 * - Stream real-time PID data (RPM, speed, temp, etc.)
 * - Support for ELM327, Vgate, OBDLink adapters
 *
 * Protocol: ELM327 command set (AT commands and OBD-II PIDs)
 *
 * Business Value: $800,000/year (vehicle diagnostics, predictive maintenance)
 */

import logger from '@/utils/logger'

// Type definitions for Bluetooth libraries
// These would be imported from actual libraries:
// import BluetoothClassic from 'react-native-bluetooth-classic'
// import BleManager from 'react-native-ble-manager'

// Mock types for now (replace with actual library imports)
type BluetoothDevice = {
  id: string
  name: string
  address: string // MAC address
  rssi?: number
  bonded?: boolean
}

type BleDevice = {
  id: string
  name?: string
  rssi?: number
}

// =====================================================
// OBD2 PID Definitions (SAE J1979)
// =====================================================

export enum OBD2_MODE {
  SHOW_CURRENT_DATA = '01',
  SHOW_FREEZE_FRAME_DATA = '02',
  SHOW_STORED_DTC = '03',
  CLEAR_DTC = '04',
  TEST_RESULTS_O2_SENSOR = '05',
  TEST_RESULTS_OTHER = '06',
  SHOW_PENDING_DTC = '07',
  CONTROL_OPERATION = '08',
  REQUEST_VEHICLE_INFO = '09',
  PERMANENT_DTC = '0A'
}

export interface OBD2_PID {
  mode: string
  pid: string
  name: string
  description: string
  bytes: number
  formula: (data: number[]) => number | number[]
  unit: string
  min: number
  max: number
}

export const OBD2_PIDS: { [key: string]: OBD2_PID } = {
  // Mode 01 - Show current data
  ENGINE_LOAD: {
    mode: '01',
    pid: '04',
    name: 'Engine Load',
    description: 'Calculated engine load',
    bytes: 1,
    formula: (data) => (data[0] * 100) / 255,
    unit: '%',
    min: 0,
    max: 100
  },
  COOLANT_TEMP: {
    mode: '01',
    pid: '05',
    name: 'Coolant Temperature',
    description: 'Engine coolant temperature',
    bytes: 1,
    formula: (data) => data[0] - 40,
    unit: '°C',
    min: -40,
    max: 215
  },
  SHORT_FUEL_TRIM_1: {
    mode: '01',
    pid: '06',
    name: 'Short Term Fuel Trim - Bank 1',
    description: 'Short term fuel % trim - Bank 1',
    bytes: 1,
    formula: (data) => (data[0] - 128) * (100 / 128),
    unit: '%',
    min: -100,
    max: 99.2
  },
  LONG_FUEL_TRIM_1: {
    mode: '01',
    pid: '07',
    name: 'Long Term Fuel Trim - Bank 1',
    description: 'Long term fuel % trim - Bank 1',
    bytes: 1,
    formula: (data) => (data[0] - 128) * (100 / 128),
    unit: '%',
    min: -100,
    max: 99.2
  },
  FUEL_PRESSURE: {
    mode: '01',
    pid: '0A',
    name: 'Fuel Pressure',
    description: 'Fuel pressure',
    bytes: 1,
    formula: (data) => data[0] * 3,
    unit: 'kPa',
    min: 0,
    max: 765
  },
  INTAKE_PRESSURE: {
    mode: '01',
    pid: '0B',
    name: 'Intake Manifold Pressure',
    description: 'Intake manifold absolute pressure',
    bytes: 1,
    formula: (data) => data[0],
    unit: 'kPa',
    min: 0,
    max: 255
  },
  ENGINE_RPM: {
    mode: '01',
    pid: '0C',
    name: 'Engine RPM',
    description: 'Engine revolutions per minute',
    bytes: 2,
    formula: (data) => ((data[0] * 256) + data[1]) / 4,
    unit: 'RPM',
    min: 0,
    max: 16383.75
  },
  VEHICLE_SPEED: {
    mode: '01',
    pid: '0D',
    name: 'Vehicle Speed',
    description: 'Vehicle speed',
    bytes: 1,
    formula: (data) => data[0],
    unit: 'km/h',
    min: 0,
    max: 255
  },
  TIMING_ADVANCE: {
    mode: '01',
    pid: '0E',
    name: 'Timing Advance',
    description: 'Timing advance',
    bytes: 1,
    formula: (data) => (data[0] / 2) - 64,
    unit: '°',
    min: -64,
    max: 63.5
  },
  INTAKE_TEMP: {
    mode: '01',
    pid: '0F',
    name: 'Intake Air Temperature',
    description: 'Intake air temperature',
    bytes: 1,
    formula: (data) => data[0] - 40,
    unit: '°C',
    min: -40,
    max: 215
  },
  MAF_FLOW: {
    mode: '01',
    pid: '10',
    name: 'MAF Air Flow Rate',
    description: 'Mass air flow sensor air flow rate',
    bytes: 2,
    formula: (data) => ((data[0] * 256) + data[1]) / 100,
    unit: 'g/s',
    min: 0,
    max: 655.35
  },
  THROTTLE_POS: {
    mode: '01',
    pid: '11',
    name: 'Throttle Position',
    description: 'Throttle position',
    bytes: 1,
    formula: (data) => (data[0] * 100) / 255,
    unit: '%',
    min: 0,
    max: 100
  },
  O2_SENSOR_1: {
    mode: '01',
    pid: '14',
    name: 'O2 Sensor 1',
    description: 'Oxygen sensor 1 voltage',
    bytes: 2,
    formula: (data) => data[0] / 200,
    unit: 'V',
    min: 0,
    max: 1.275
  },
  FUEL_LEVEL: {
    mode: '01',
    pid: '2F',
    name: 'Fuel Level',
    description: 'Fuel tank level input',
    bytes: 1,
    formula: (data) => (data[0] * 100) / 255,
    unit: '%',
    min: 0,
    max: 100
  },
  DISTANCE_WITH_MIL: {
    mode: '01',
    pid: '21',
    name: 'Distance with MIL',
    description: 'Distance traveled with malfunction indicator lamp on',
    bytes: 2,
    formula: (data) => (data[0] * 256) + data[1],
    unit: 'km',
    min: 0,
    max: 65535
  },
  CONTROL_MODULE_VOLTAGE: {
    mode: '01',
    pid: '42',
    name: 'Control Module Voltage',
    description: 'Control module voltage',
    bytes: 2,
    formula: (data) => ((data[0] * 256) + data[1]) / 1000,
    unit: 'V',
    min: 0,
    max: 65.535
  },
  ABSOLUTE_LOAD: {
    mode: '01',
    pid: '43',
    name: 'Absolute Load Value',
    description: 'Absolute load value',
    bytes: 2,
    formula: (data) => ((data[0] * 256) + data[1]) * 100 / 255,
    unit: '%',
    min: 0,
    max: 25700
  },
  AMBIENT_TEMP: {
    mode: '01',
    pid: '46',
    name: 'Ambient Air Temperature',
    description: 'Ambient air temperature',
    bytes: 1,
    formula: (data) => data[0] - 40,
    unit: '°C',
    min: -40,
    max: 215
  },
  ENGINE_OIL_TEMP: {
    mode: '01',
    pid: '5C',
    name: 'Engine Oil Temperature',
    description: 'Engine oil temperature',
    bytes: 1,
    formula: (data) => data[0] - 40,
    unit: '°C',
    min: -40,
    max: 215
  },

  // Mode 09 - Request vehicle information
  VIN: {
    mode: '09',
    pid: '02',
    name: 'VIN',
    description: 'Vehicle Identification Number',
    bytes: 17,
    formula: (data) => data, // Returns array of ASCII values
    unit: '',
    min: 0,
    max: 0
  }
}

// =====================================================
// OBD2 Adapter Types
// =====================================================

export enum AdapterType {
  ELM327 = 'ELM327',
  VGATE = 'Vgate',
  OBDLINK = 'OBDLink',
  BLUEDRIVER = 'BlueDriver',
  GENERIC = 'Generic'
}

export enum ConnectionType {
  BLUETOOTH = 'bluetooth',
  WIFI = 'wifi',
  USB = 'usb'
}

export interface OBD2Adapter {
  id: string
  name: string
  type: AdapterType
  connectionType: ConnectionType
  address: string // MAC address or IP
  rssi?: number
  isConnected: boolean
  isPaired: boolean
  firmwareVersion?: string
  supportedProtocols?: string[]
}

export interface DiagnosticTroubleCode {
  code: string
  type: 'powertrain' | 'chassis' | 'body' | 'network'
  description: string
  severity: 'critical' | 'major' | 'moderate' | 'minor' | 'informational'
  isMILOn: boolean
  freezeFrameData?: any
}

export interface LiveOBD2Data {
  timestamp: Date
  engineRPM?: number
  vehicleSpeed?: number
  throttlePosition?: number
  coolantTemp?: number
  intakeAirTemp?: number
  mafAirFlow?: number
  fuelPressure?: number
  intakeManifoldPressure?: number
  timingAdvance?: number
  fuelLevel?: number
  batteryVoltage?: number
  engineLoad?: number
  allPIDs: { [key: string]: number }
}

// =====================================================
// OBD2 Service
// =====================================================

export class OBD2Service {
  private connectedAdapter: OBD2Adapter | null = null
  private connection: any = null // Bluetooth/WiFi connection object
  private streamingInterval: NodeJS.Timeout | null = null
  private commandQueue: string[] = []
  private isProcessingCommand = false

  /**
   * Scan for nearby OBD2 adapters
   */
  async scanForAdapters(): Promise<OBD2Adapter[]> {
    const adapters: OBD2Adapter[] = []

    try {
      // Scan Bluetooth Classic devices
      const bluetoothDevices = await this.scanBluetoothClassic()
      for (const device of bluetoothDevices) {
        if (this.isOBD2Device(device.name)) {
          adapters.push({
            id: device.id,
            name: device.name,
            type: this.detectAdapterType(device.name),
            connectionType: ConnectionType.BLUETOOTH,
            address: device.address,
            rssi: device.rssi,
            isConnected: false,
            isPaired: device.bonded || false
          })
        }
      }

      // Scan BLE devices
      const bleDevices = await this.scanBLE()
      for (const device of bleDevices) {
        if (device.name && this.isOBD2Device(device.name)) {
          adapters.push({
            id: device.id,
            name: device.name,
            type: this.detectAdapterType(device.name),
            connectionType: ConnectionType.BLUETOOTH,
            address: device.id,
            rssi: device.rssi,
            isConnected: false,
            isPaired: false
          })
        }
      }

      // Scan WiFi adapters (common WiFi OBD2 adapter IP: 192.168.0.10)
      const wifiAdapters = await this.scanWiFiAdapters()
      adapters.push(...wifiAdapters)

      return adapters
    } catch (error) {
      logger.error('Error scanning for OBD2 adapters:', { error })
      throw new Error(`Failed to scan for adapters: ${error}`)
    }
  }

  /**
   * Connect to OBD2 adapter
   */
  async connect(adapter: OBD2Adapter): Promise<boolean> {
    try {
      logger.info(`Connecting to OBD2 adapter: ${adapter.name} (${adapter.address})`)

      if (adapter.connectionType === ConnectionType.BLUETOOTH) {
        this.connection = await this.connectBluetooth(adapter)
      } else if (adapter.connectionType === ConnectionType.WIFI) {
        this.connection = await this.connectWiFi(adapter)
      } else {
        throw new Error(`Unsupported connection type: ${adapter.connectionType}`)
      }

      // Initialize ELM327 adapter
      await this.initializeAdapter()

      // Get adapter info
      const version = await this.sendCommand('ATI') // Get version
      const protocols = await this.sendCommand('ATDP') // Get protocol

      adapter.firmwareVersion = version
      adapter.supportedProtocols = [protocols]
      adapter.isConnected = true

      this.connectedAdapter = adapter

      logger.info(`Successfully connected to ${adapter.name}`)
      return true
    } catch (error) {
      logger.error('Error connecting to OBD2 adapter:', { error })
      throw new Error(`Failed to connect: ${error}`)
    }
  }

  /**
   * Disconnect from adapter
   */
  async disconnect(): Promise<void> {
    try {
      this.stopLiveDataStream()

      if (this.connection) {
        // Send reset command
        await this.sendCommand('ATZ')

        // Close connection
        if (this.connection.disconnect) {
          await this.connection.disconnect()
        } else if (this.connection.close) {
          await this.connection.close()
        }

        this.connection = null
      }

      if (this.connectedAdapter) {
        this.connectedAdapter.isConnected = false
        this.connectedAdapter = null
      }

      logger.info('Disconnected from OBD2 adapter')
    } catch (error) {
      logger.error('Error disconnecting:', { error })
    }
  }

  /**
   * Read VIN from vehicle
   */
  async readVIN(): Promise<string> {
    try {
      if (!this.isConnected()) {
        throw new Error('Not connected to OBD2 adapter')
      }

      // Request VIN (Mode 09, PID 02)
      const response = await this.sendCommand('0902')

      // Parse VIN from response
      const vin = this.parseVIN(response)

      logger.info(`VIN read: ${vin}`)
      return vin
    } catch (error) {
      logger.error('Error reading VIN:', { error })
      throw new Error(`Failed to read VIN: ${error}`)
    }
  }

  /**
   * Read diagnostic trouble codes (DTCs)
   */
  async readDTCs(): Promise<DiagnosticTroubleCode[]> {
    try {
      if (!this.isConnected()) {
        throw new Error('Not connected to OBD2 adapter')
      }

      // Request stored DTCs (Mode 03)
      const response = await this.sendCommand('03')

      // Parse DTCs
      const dtcs = this.parseDTCs(response)

      logger.info(`Read ${dtcs.length} DTCs`)
      return dtcs
    } catch (error) {
      logger.error('Error reading DTCs:', { error })
      throw new Error(`Failed to read DTCs: ${error}`)
    }
  }

  /**
   * Read pending DTCs
   */
  async readPendingDTCs(): Promise<DiagnosticTroubleCode[]> {
    try {
      if (!this.isConnected()) {
        throw new Error('Not connected to OBD2 adapter')
      }

      // Request pending DTCs (Mode 07)
      const response = await this.sendCommand('07')

      // Parse DTCs
      const dtcs = this.parseDTCs(response)

      logger.info(`Read ${dtcs.length} pending DTCs`)
      return dtcs
    } catch (error) {
      logger.error('Error reading pending DTCs:', { error })
      throw new Error(`Failed to read pending DTCs: ${error}`)
    }
  }

  /**
   * Clear DTCs (with confirmation)
   */
  async clearDTCs(): Promise<boolean> {
    try {
      if (!this.isConnected()) {
        throw new Error('Not connected to OBD2 adapter')
      }

      // Clear DTCs (Mode 04)
      const response = await this.sendCommand('04')

      // Verify DTCs were cleared
      const remainingDTCs = await this.readDTCs()

      const success = remainingDTCs.length === 0
      logger.info(`Clear DTCs ${success ? 'successful' : 'failed'}`)

      return success
    } catch (error) {
      logger.error('Error clearing DTCs:', { error })
      throw new Error(`Failed to clear DTCs: ${error}`)
    }
  }

  /**
   * Read single PID
   */
  async readPID(pidKey: string): Promise<number> {
    try {
      if (!this.isConnected()) {
        throw new Error('Not connected to OBD2 adapter')
      }

      const pid = OBD2_PIDS[pidKey]
      if (!pid) {
        throw new Error(`Unknown PID: ${pidKey}`)
      }

      // Send command (Mode + PID)
      const command = pid.mode + pid.pid
      const response = await this.sendCommand(command)

      // Parse response
      const value = this.parsePIDResponse(response, pid) as number

      return value
    } catch (error) {
      logger.error(`Error reading PID ${pidKey}:`, error)
      throw new Error(`Failed to read PID: ${error}`)
    }
  }

  /**
   * Read multiple PIDs at once
   */
  async readMultiplePIDs(pidKeys: string[]): Promise<LiveOBD2Data> {
    const data: LiveOBD2Data = {
      timestamp: new Date(),
      allPIDs: {}
    }

    try {
      if (!this.isConnected()) {
        throw new Error('Not connected to OBD2 adapter')
      }

      for (const pidKey of pidKeys) {
        const value = await this.readPID(pidKey);
        data.allPIDs[pidKey] = value;

        // Map to specific fields if needed
        switch (pidKey) {
          case 'ENGINE_RPM':
            data.engineRPM = value;
            break;
          case 'VEHICLE_SPEED':
            data.vehicleSpeed = value;
            break;
          case 'THROTTLE_POS':
            data.throttlePosition = value;
            break;
          case 'COOLANT_TEMP':
            data.coolantTemp = value;
            break;
          case 'INTAKE_TEMP':
            data.intakeAirTemp = value;
            break;
          case 'MAF_FLOW':
            data.mafAirFlow = value;
            break;
          case 'FUEL_PRESSURE':
            data.fuelPressure = value;
            break;
          case 'INTAKE_PRESSURE':
            data.intakeManifoldPressure = value;
            break;
          case 'TIMING_ADVANCE':
            data.timingAdvance = value;
            break;
          case 'FUEL_LEVEL':
            data.fuelLevel = value;
            break;
          case 'CONTROL_MODULE_VOLTAGE':
            data.batteryVoltage = value;
            break;
          case 'ENGINE_LOAD':
            data.engineLoad = value;
            break;
        }
      }

      return data;
    } catch (error) {
      logger.error('Error reading multiple PIDs:', { error });
      throw new Error(`Failed to read multiple PIDs: ${error}`);
    }
  }

  /**
   * Start live data streaming
   */
  startLiveDataStream(pidKeys: string[], callback: (data: LiveOBD2Data) => void, intervalMs: number = 1000): void {
    if (!this.isConnected()) {
      throw new Error('Not connected to OBD2 adapter')
    }

    if (this.streamingInterval) {
      clearInterval(this.streamingInterval)
    }

    this.streamingInterval = setInterval(async () => {
      try {
        const data = await this.readMultiplePIDs(pidKeys)
        callback(data)
      } catch (error) {
        logger.error('Error in live data stream:', { error })
      }
    }, intervalMs)
  }

  /**
   * Stop live data streaming
   */
  stopLiveDataStream(): void {
    if (this.streamingInterval) {
      clearInterval(this.streamingInterval)
      this.streamingInterval = null
    }
  }

  /**
   * Check if connected to adapter
   */
  isConnected(): boolean {
    return this.connectedAdapter?.isConnected ?? false
  }

  /**
   * Get currently connected adapter
   */
  getConnectedAdapter(): OBD2Adapter | null {
    return this.connectedAdapter
  }

  // =====================================================
  // Private Methods - Connection Handling
  // =====================================================

  private async scanBluetoothClassic(): Promise<BluetoothDevice[]> {
    // Implementation would use react-native-bluetooth-classic
    // Mock implementation for now
    return []
  }

  private async scanBLE(): Promise<BleDevice[]> {
    // Implementation would use react-native-ble-manager
    // Mock implementation for now
    return []
  }

  private async scanWiFiAdapters(): Promise<OBD2Adapter[]> {
    // Mock implementation - would scan for common OBD2 WiFi adapter IPs
    const _commonIPs = ['192.168.0.10', '192.168.1.1']
    return []
  }

  private async connectBluetooth(_adapter: OBD2Adapter): Promise<any> {
    // Mock implementation - would use Bluetooth library
    return {}
  }

  private async connectWiFi(_adapter: OBD2Adapter): Promise<any> {
    // Mock implementation - would establish TCP connection
    return {}
  }

  // =====================================================
  // Private Methods - Command Processing
  // =====================================================

  private async initializeAdapter(): Promise<void> {
    // Reset adapter
    await this.sendCommand('ATZ')
    // Turn off echo
    await this.sendCommand('ATE0')
    // Set protocol to auto
    await this.sendCommand('ATSP0')
  }

  private async sendCommand(command: string): Promise<string> {
    // Mock implementation - would send actual command to adapter
    return new Promise((resolve) => {
      this.commandQueue.push(command)
      this.processCommandQueue()
      resolve('OK')
    })
  }

  private processCommandQueue(): void {
    if (this.isProcessingCommand || this.commandQueue.length === 0) {
      return
    }

    this.isProcessingCommand = true
    const command = this.commandQueue.shift()
    // Process command (mock)
    this.isProcessingCommand = false

    if (this.commandQueue.length > 0) {
      this.processCommandQueue()
    }
  }

  // =====================================================
  // Private Methods - Data Parsing
  // =====================================================

  private isOBD2Device(deviceName: string): boolean {
    if (!deviceName) return false
    const name = deviceName.toLowerCase()
    return name.includes('obd') || name.includes('elm') || name.includes('vgate') || name.includes('obdlink')
  }

  private detectAdapterType(deviceName: string): AdapterType {
    if (!deviceName) return AdapterType.GENERIC
    const name = deviceName.toLowerCase()
    if (name.includes('elm')) return AdapterType.ELM327
    if (name.includes('vgate')) return AdapterType.VGATE
    if (name.includes('obdlink')) return AdapterType.OBDLINK
    if (name.includes('bluedriver')) return AdapterType.BLUEDRIVER
    return AdapterType.GENERIC
  }

  private parseVIN(_response: string): string {
    // Mock implementation - would parse VIN from response
    return 'VIN12345678901234'
  }

  private parseDTCs(_response: string): DiagnosticTroubleCode[] {
    // Mock implementation - would parse DTCs from response
    return []
  }

  private parsePIDResponse(_response: string, pid: OBD2_PID): number | number[] {
    // Mock implementation - would parse raw response data
    const mockData = new Array(pid.bytes).fill(0)
    return pid.formula(mockData)
  }
}