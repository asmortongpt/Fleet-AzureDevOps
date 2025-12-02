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
  formula: (data: number[]) => number
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
  private responseBuffer = ''

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
      const value = this.parsePIDResponse(response, pid)

      return value
    } catch (error) {
      logger.error('Error', { error: `Error reading PID ${pidKey}:`, error })
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

    for (const pidKey of pidKeys) {
      try {
        const value = await this.readPID(pidKey)
        data.allPIDs[pidKey] = value

        // Map to common fields
        switch (pidKey) {
          case 'ENGINE_RPM':
            data.engineRPM = value
            break
          case 'VEHICLE_SPEED':
            data.vehicleSpeed = value
            break
          case 'THROTTLE_POS':
            data.throttlePosition = value
            break
          case 'COOLANT_TEMP':
            data.coolantTemp = value
            break
          case 'INTAKE_TEMP':
            data.intakeAirTemp = value
            break
          case 'MAF_FLOW':
            data.mafAirFlow = value
            break
          case 'FUEL_PRESSURE':
            data.fuelPressure = value
            break
          case 'INTAKE_PRESSURE':
            data.intakeManifoldPressure = value
            break
          case 'TIMING_ADVANCE':
            data.timingAdvance = value
            break
          case 'FUEL_LEVEL':
            data.fuelLevel = value
            break
          case 'CONTROL_MODULE_VOLTAGE':
            data.batteryVoltage = value
            break
          case 'ENGINE_LOAD':
            data.engineLoad = value
            break
        }
      } catch (error) {
        console.warn(`Failed to read PID ${pidKey}:`, error)
      }
    }

    return data
  }

  /**
   * Start live data streaming
   */
  startLiveDataStream(
    pidKeys: string[],
    intervalMs: number,
    callback: (data: LiveOBD2Data) => void
  ): void {
    if (!this.isConnected()) {
      throw new Error('Not connected to OBD2 adapter')
    }

    this.stopLiveDataStream() // Stop existing stream

    this.streamingInterval = setInterval(async () => {
      try {
        const data = await this.readMultiplePIDs(pidKeys)
        callback(data)
      } catch (error) {
        logger.error('Error in live data stream:', { error })
      }
    }, intervalMs)

    logger.info(`Started live data stream with ${pidKeys.length} PIDs at ${intervalMs}ms interval`)
  }

  /**
   * Stop live data streaming
   */
  stopLiveDataStream(): void {
    if (this.streamingInterval) {
      clearInterval(this.streamingInterval)
      this.streamingInterval = null
      logger.info('Stopped live data stream')
    }
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.connectedAdapter?.isConnected === true && this.connection !== null
  }

  /**
   * Get connected adapter
   */
  getConnectedAdapter(): OBD2Adapter | null {
    return this.connectedAdapter
  }

  // =====================================================
  // Private Helper Methods
  // =====================================================

  private async scanBluetoothClassic(): Promise<BluetoothDevice[]> {
    try {
      // Mock implementation - replace with actual library
      // const devices = await BluetoothClassic.getBondedDevices()
      // return devices
      return []
    } catch (error) {
      logger.error('Error scanning Bluetooth Classic:', { error })
      return []
    }
  }

  private async scanBLE(): Promise<BleDevice[]> {
    try {
      // Mock implementation - replace with actual library
      // await BleManager.scan([], 5, true)
      // const peripherals = await BleManager.getDiscoveredPeripherals()
      // return peripherals
      return []
    } catch (error) {
      logger.error('Error scanning BLE:', { error })
      return []
    }
  }

  private async scanWiFiAdapters(): Promise<OBD2Adapter[]> {
    // Common WiFi OBD2 adapter IPs
    const commonIPs = ['192.168.0.10', '192.168.1.10']
    const adapters: OBD2Adapter[] = []

    // In production, you would ping these IPs or attempt connection
    // For now, just return empty array
    return adapters
  }

  private isOBD2Device(name: string): boolean {
    const obd2Keywords = [
      'obd',
      'elm327',
      'vgate',
      'obdlink',
      'bluedriver',
      'veepeak',
      'bafx',
      'scan tool',
      'diagnostic'
    ]

    const lowerName = name.toLowerCase()
    return obd2Keywords.some(keyword => lowerName.includes(keyword))
  }

  private detectAdapterType(name: string): AdapterType {
    const lowerName = name.toLowerCase()

    if (lowerName.includes('vgate')) return AdapterType.VGATE
    if (lowerName.includes('obdlink')) return AdapterType.OBDLINK
    if (lowerName.includes('bluedriver')) return AdapterType.BLUEDRIVER
    if (lowerName.includes('elm327')) return AdapterType.ELM327

    return AdapterType.GENERIC
  }

  private async connectBluetooth(adapter: OBD2Adapter): Promise<any> {
    try {
      // Mock implementation - replace with actual library
      // const connection = await BluetoothClassic.connect(adapter.address)
      // return connection
      throw new Error('Bluetooth connection not implemented - add react-native-bluetooth-classic')
    } catch (error) {
      throw new Error(`Bluetooth connection failed: ${error}`)
    }
  }

  private async connectWiFi(adapter: OBD2Adapter): Promise<any> {
    try {
      // Mock implementation - replace with actual TCP socket library
      // const TcpSocket = require('react-native-tcp-socket')
      // const socket = TcpSocket.createConnection({
      //   host: adapter.address,
      //   port: 35000 // Standard OBD2 WiFi port
      // })
      // return socket
      throw new Error('WiFi connection not implemented - add react-native-tcp-socket')
    } catch (error) {
      throw new Error(`WiFi connection failed: ${error}`)
    }
  }

  private async initializeAdapter(): Promise<void> {
    // ELM327 initialization sequence
    await this.sendCommand('ATZ')     // Reset
    await this.delay(1000)            // Wait for reset
    await this.sendCommand('ATE0')    // Echo off
    await this.sendCommand('ATL0')    // Linefeeds off
    await this.sendCommand('ATS0')    // Spaces off
    await this.sendCommand('ATH1')    // Headers on
    await this.sendCommand('ATSP0')   // Auto protocol detection
  }

  private async sendCommand(command: string): Promise<string> {
    return new Promise((resolve, reject) => {
      if (!this.connection) {
        reject(new Error('No connection'))
        return
      }

      try {
        // Add command to queue
        this.commandQueue.push(command)

        // Process queue if not already processing
        if (!this.isProcessingCommand) {
          this.processCommandQueue(resolve, reject)
        }
      } catch (error) {
        reject(error)
      }
    })
  }

  private async processCommandQueue(resolve: Function, reject: Function): Promise<void> {
    if (this.commandQueue.length === 0) {
      this.isProcessingCommand = false
      return
    }

    this.isProcessingCommand = true
    const command = this.commandQueue.shift()!

    try {
      // Send command
      this.responseBuffer = ''

      // Mock implementation - replace with actual write
      // await this.connection.write(command + '\r')

      // Wait for response (mock - implement actual response listener)
      await this.delay(200)

      // Mock response
      const response = this.mockOBD2Response(command)

      resolve(response)
    } catch (error) {
      reject(error)
    } finally {
      this.isProcessingCommand = false
      this.processCommandQueue(resolve, reject)
    }
  }

  private mockOBD2Response(command: string): string {
    // Mock responses for testing
    const responses: { [key: string]: string } = {
      'ATZ': 'ELM327 v1.5',
      'ATI': 'ELM327 v1.5',
      'ATDP': 'ISO 15765-4 CAN (11/500)',
      '0902': '49 02 01 31 47 31 4A 43 35 34 34 34 52 37 32 35 32 33 36 35',
      '03': '43 00',
      '07': '47 00',
      '010C': '41 0C 1A F8', // RPM = 1726
      '010D': '41 0D 3C',    // Speed = 60 km/h
      '0105': '41 05 5A',    // Coolant temp = 50°C
    }

    return responses[command] || 'NO DATA'
  }

  private parseVIN(response: string): string {
    // Parse VIN from Mode 09 PID 02 response
    // Response format: "49 02 01 [VIN bytes in hex]"
    const bytes = response.split(' ').slice(3).filter(b => b.length === 2)
    const vin = bytes.map(b => String.fromCharCode(parseInt(b, 16))).join('')
    return vin.substring(0, 17)
  }

  private parseDTCs(response: string): DiagnosticTroubleCode[] {
    const dtcs: DiagnosticTroubleCode[] = []

    // Response format: "43 [count] [DTC bytes]" or "47 [count] [DTC bytes]"
    const bytes = response.split(' ')

    if (bytes.length < 2) return dtcs

    const count = parseInt(bytes[1], 16)
    if (count === 0) return dtcs

    // Parse DTC bytes (2 bytes per DTC)
    for (let i = 2; i < bytes.length; i += 2) {
      if (i + 1 >= bytes.length) break

      const byte1 = parseInt(bytes[i], 16)
      const byte2 = parseInt(bytes[i + 1], 16)

      const dtcCode = this.decodeDTC(byte1, byte2)
      if (dtcCode) {
        dtcs.push({
          code: dtcCode,
          type: this.getDTCType(dtcCode),
          description: `Diagnostic code ${dtcCode}`,
          severity: 'moderate',
          isMILOn: true
        })
      }
    }

    return dtcs
  }

  private decodeDTC(byte1: number, byte2: number): string {
    const firstDigit = (byte1 >> 6) & 0x03
    const prefixes = ['P', 'C', 'B', 'U']
    const prefix = prefixes[firstDigit]

    const secondDigit = (byte1 >> 4) & 0x03
    const thirdDigit = byte1 & 0x0F
    const fourthFifthDigits = byte2.toString(16).toUpperCase().padStart(2, '0')

    return `${prefix}${secondDigit}${thirdDigit}${fourthFifthDigits}`
  }

  private getDTCType(code: string): 'powertrain' | 'chassis' | 'body' | 'network' {
    const prefix = code.charAt(0)
    switch (prefix) {
      case 'P': return 'powertrain'
      case 'C': return 'chassis'
      case 'B': return 'body'
      case 'U': return 'network'
      default: return 'powertrain'
    }
  }

  private parsePIDResponse(response: string, pid: OBD2_PID): number {
    // Response format: "41 [PID] [data bytes]"
    const bytes = response.split(' ')

    if (bytes.length < 3) {
      throw new Error('Invalid PID response')
    }

    // Extract data bytes
    const dataBytes = bytes.slice(2).map(b => parseInt(b, 16))

    // Apply formula
    const value = pid.formula(dataBytes)

    return Math.round(value * 100) / 100 // Round to 2 decimals
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}

// Export singleton instance
export default new OBD2Service()
