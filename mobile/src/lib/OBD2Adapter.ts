/**
 * OBD2 Adapter Library
 *
 * Interface for connecting to OBD2 adapters via Bluetooth/WiFi
 * Supports ELM327, OBDLink, and other standard OBD2 protocols
 *
 * Required native modules:
 * - react-native-bluetooth-classic (for ELM327 Bluetooth)
 * - react-native-tcp-socket (for WiFi adapters)
 *
 * Install:
 * npm install react-native-bluetooth-classic react-native-tcp-socket
 * npm install @types/react-native-bluetooth-classic --save-dev
 */

import BluetoothClassic from 'react-native-bluetooth-classic';

// =====================================================
// OBD2 PIDs (Parameter IDs)
// =====================================================

const OBD2_PIDS = {
  ENGINE_RPM: '010C',              // Engine RPM
  VEHICLE_SPEED: '010D',           // Vehicle Speed
  ENGINE_LOAD: '0104',             // Calculated Engine Load
  COOLANT_TEMP: '0105',            // Engine Coolant Temperature
  FUEL_LEVEL: '012F',              // Fuel Tank Level
  FUEL_FLOW_RATE: '015E',          // Engine Fuel Flow Rate
  THROTTLE_POSITION: '0111',       // Throttle Position
  MAF_FLOW: '0110',                // MAF Air Flow Rate
  INTAKE_TEMP: '010F',             // Intake Air Temperature
  BATTERY_VOLTAGE: 'ATRV',         // Battery Voltage (ELM327 command)
  ODOMETER: '01A6',                // Odometer
  FUEL_PRESSURE: '010A',           // Fuel Pressure
  MANIFOLD_PRESSURE: '010B',       // Intake Manifold Pressure
  OIL_TEMP: '015C',                // Engine Oil Temperature
  TRANSMISSION_TEMP: '01B4',       // Transmission Actual Gear Ratio
  MIL_STATUS: '0101',              // Malfunction Indicator Lamp (Check Engine)
  DTC_COUNT: '0101',               // Diagnostic Trouble Codes count
  ACCELERATOR_POSITION: '0149',    // Accelerator Pedal Position
  TRANSMISSION_GEAR: '01A4',       // Transmission Actual Gear
};

// =====================================================
// OBD2 Adapter Class
// =====================================================

export default class OBD2Adapter {
  private device: any = null;
  private isConnected: boolean = false;
  private responseBuffer: string = '';

  constructor() {}

  // =====================================================
  // Connection Management
  // =====================================================

  /**
   * Connect to OBD2 adapter
   * @param deviceId Optional device ID (if known), otherwise scans for devices
   * @returns Promise<boolean> Connection success
   */
  async connect(deviceId?: string): Promise<boolean> {
    try {
      // Enable Bluetooth
      const isEnabled = await BluetoothClassic.isBluetoothEnabled();
      if (!isEnabled) {
        await BluetoothClassic.requestBluetoothEnabled();
      }

      // Find device
      if (!deviceId) {
        const devices = await this.scanDevices();
        const obd2Device = devices.find(d =>
          d.name?.includes('OBD') ||
          d.name?.includes('ELM327') ||
          d.name?.includes('OBDII')
        );

        if (!obd2Device) {
          throw new Error('No OBD2 device found');
        }

        deviceId = obd2Device.id;
      }

      // Connect to device
      this.device = await BluetoothClassic.connectToDevice(deviceId);
      this.isConnected = true;

      // Initialize OBD2 connection
      await this.initializeOBD2();

      console.log('OBD2 adapter connected');
      return true;
    } catch (error) {
      console.error('Failed to connect to OBD2 adapter:', error);
      this.isConnected = false;
      return false;
    }
  }

  /**
   * Disconnect from OBD2 adapter
   */
  async disconnect(): Promise<void> {
    if (this.device) {
      try {
        await this.device.disconnect();
        this.isConnected = false;
        this.device = null;
        console.log('OBD2 adapter disconnected');
      } catch (error) {
        console.error('Failed to disconnect:', error);
      }
    }
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.isConnected;
  }

  /**
   * Scan for Bluetooth devices
   */
  private async scanDevices(): Promise<any[]> {
    try {
      // Get paired devices first
      const pairedDevices = await BluetoothClassic.getBondedDevices();

      // Also scan for new devices
      await BluetoothClassic.startDiscovery();

      // Wait for discovery
      await new Promise(resolve => setTimeout(resolve, 5000));

      const discoveredDevices = await BluetoothClassic.cancelDiscovery();

      return [...pairedDevices, ...discoveredDevices];
    } catch (error) {
      console.error('Failed to scan devices:', error);
      return [];
    }
  }

  /**
   * Initialize OBD2 connection with ELM327 commands
   */
  private async initializeOBD2(): Promise<void> {
    // Reset adapter
    await this.sendCommand('ATZ');
    await this.delay(1000);

    // Turn off echo
    await this.sendCommand('ATE0');

    // Set protocol to automatic
    await this.sendCommand('ATSP0');

    // Set headers off
    await this.sendCommand('ATH0');

    // Set line feed off
    await this.sendCommand('ATL0');

    console.log('OBD2 adapter initialized');
  }

  // =====================================================
  // Data Reading Methods
  // =====================================================

  /**
   * Get Engine RPM
   * @returns Engine RPM (0-16383)
   */
  async getEngineRPM(): Promise<number> {
    const response = await this.sendCommand(OBD2_PIDS.ENGINE_RPM);
    return this.parseRPM(response);
  }

  /**
   * Get Vehicle Speed
   * @returns Speed in MPH
   */
  async getSpeed(): Promise<number> {
    const response = await this.sendCommand(OBD2_PIDS.VEHICLE_SPEED);
    return this.parseSpeed(response);
  }

  /**
   * Get Engine Load
   * @returns Engine load percentage (0-100)
   */
  async getEngineLoad(): Promise<number> {
    const response = await this.sendCommand(OBD2_PIDS.ENGINE_LOAD);
    return this.parsePercentage(response);
  }

  /**
   * Get Coolant Temperature
   * @returns Temperature in Fahrenheit
   */
  async getCoolantTemp(): Promise<number> {
    const response = await this.sendCommand(OBD2_PIDS.COOLANT_TEMP);
    return this.parseTemperature(response);
  }

  /**
   * Get Fuel Level
   * @returns Fuel level percentage (0-100)
   */
  async getFuelLevel(): Promise<number> {
    const response = await this.sendCommand(OBD2_PIDS.FUEL_LEVEL);
    return this.parsePercentage(response);
  }

  /**
   * Get Fuel Flow Rate
   * @returns Fuel flow rate in gallons per hour
   */
  async getFuelFlowRate(): Promise<number> {
    const response = await this.sendCommand(OBD2_PIDS.FUEL_FLOW_RATE);
    return this.parseFuelFlowRate(response);
  }

  /**
   * Get Throttle Position
   * @returns Throttle position percentage (0-100)
   */
  async getThrottlePosition(): Promise<number> {
    const response = await this.sendCommand(OBD2_PIDS.THROTTLE_POSITION);
    return this.parsePercentage(response);
  }

  /**
   * Get Battery Voltage
   * @returns Battery voltage
   */
  async getBatteryVoltage(): Promise<number> {
    const response = await this.sendCommand(OBD2_PIDS.BATTERY_VOLTAGE);
    return this.parseVoltage(response);
  }

  /**
   * Get Odometer Reading
   * @returns Odometer in miles
   */
  async getOdometer(): Promise<number> {
    const response = await this.sendCommand(OBD2_PIDS.ODOMETER);
    return this.parseOdometer(response);
  }

  /**
   * Get MIL (Malfunction Indicator Lamp) Status
   * @returns true if Check Engine Light is on
   */
  async getMILStatus(): Promise<boolean> {
    const response = await this.sendCommand(OBD2_PIDS.MIL_STATUS);
    return this.parseMILStatus(response);
  }

  /**
   * Get Diagnostic Trouble Code Count
   * @returns Number of DTCs
   */
  async getDTCCount(): Promise<number> {
    const response = await this.sendCommand(OBD2_PIDS.DTC_COUNT);
    return this.parseDTCCount(response);
  }

  /**
   * Get Oil Temperature
   * @returns Temperature in Fahrenheit
   */
  async getOilTemp(): Promise<number> {
    const response = await this.sendCommand(OBD2_PIDS.OIL_TEMP);
    return this.parseTemperature(response);
  }

  /**
   * Get Intake Air Temperature
   * @returns Temperature in Fahrenheit
   */
  async getIntakeAirTemp(): Promise<number> {
    const response = await this.sendCommand(OBD2_PIDS.INTAKE_TEMP);
    return this.parseTemperature(response);
  }

  /**
   * Get Mass Air Flow
   * @returns MAF in grams per second
   */
  async getMAF(): Promise<number> {
    const response = await this.sendCommand(OBD2_PIDS.MAF_FLOW);
    return this.parseMAF(response);
  }

  /**
   * Get Manifold Pressure
   * @returns Pressure in PSI
   */
  async getManifoldPressure(): Promise<number> {
    const response = await this.sendCommand(OBD2_PIDS.MANIFOLD_PRESSURE);
    return this.parsePressure(response);
  }

  // =====================================================
  // Communication Methods
  // =====================================================

  /**
   * Send OBD2 command and wait for response
   */
  private async sendCommand(command: string): Promise<string> {
    if (!this.device || !this.isConnected) {
      throw new Error('OBD2 adapter not connected');
    }

    try {
      // Clear buffer
      this.responseBuffer = '';

      // Send command
      await this.device.write(`${command}\r`);

      // Wait for response (with timeout)
      const response = await this.waitForResponse(2000);

      return response;
    } catch (error) {
      console.error('Failed to send OBD2 command:', error);
      throw error;
    }
  }

  /**
   * Wait for response from OBD2 adapter
   */
  private async waitForResponse(timeout: number): Promise<string> {
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error('OBD2 command timeout'));
      }, timeout);

      // Listen for data
      const listener = this.device.onDataReceived((event: any) => {
        this.responseBuffer += event.data;

        // Check if response is complete (ends with '>')
        if (this.responseBuffer.includes('>')) {
          clearTimeout(timeoutId);
          listener.remove();
          resolve(this.responseBuffer.trim());
        }
      });
    });
  }

  // =====================================================
  // Parsing Methods
  // =====================================================

  /**
   * Parse RPM from OBD2 response
   */
  private parseRPM(response: string): number {
    const hex = this.extractHex(response);
    if (hex.length >= 4) {
      const a = parseInt(hex.substring(0, 2), 16);
      const b = parseInt(hex.substring(2, 4), 16);
      return ((a * 256) + b) / 4;
    }
    return 0;
  }

  /**
   * Parse speed from OBD2 response
   */
  private parseSpeed(response: string): number {
    const hex = this.extractHex(response);
    if (hex.length >= 2) {
      const kmh = parseInt(hex.substring(0, 2), 16);
      return kmh * 0.621371; // Convert to MPH
    }
    return 0;
  }

  /**
   * Parse percentage value
   */
  private parsePercentage(response: string): number {
    const hex = this.extractHex(response);
    if (hex.length >= 2) {
      const value = parseInt(hex.substring(0, 2), 16);
      return (value * 100) / 255;
    }
    return 0;
  }

  /**
   * Parse temperature (Celsius to Fahrenheit)
   */
  private parseTemperature(response: string): number {
    const hex = this.extractHex(response);
    if (hex.length >= 2) {
      const celsius = parseInt(hex.substring(0, 2), 16) - 40;
      return (celsius * 9/5) + 32; // Convert to Fahrenheit
    }
    return 0;
  }

  /**
   * Parse fuel flow rate
   */
  private parseFuelFlowRate(response: string): number {
    const hex = this.extractHex(response);
    if (hex.length >= 4) {
      const a = parseInt(hex.substring(0, 2), 16);
      const b = parseInt(hex.substring(2, 4), 16);
      const lph = ((a * 256) + b) * 0.05; // Liters per hour
      return lph * 0.264172; // Convert to gallons per hour
    }
    return 0;
  }

  /**
   * Parse voltage
   */
  private parseVoltage(response: string): number {
    const match = response.match(/[\d.]+V/);
    if (match) {
      return parseFloat(match[0]);
    }
    return 0;
  }

  /**
   * Parse odometer
   */
  private parseOdometer(response: string): number {
    const hex = this.extractHex(response);
    if (hex.length >= 8) {
      const a = parseInt(hex.substring(0, 2), 16);
      const b = parseInt(hex.substring(2, 4), 16);
      const c = parseInt(hex.substring(4, 6), 16);
      const d = parseInt(hex.substring(6, 8), 16);
      const km = (a * 16777216) + (b * 65536) + (c * 256) + d;
      return km * 0.621371; // Convert to miles
    }
    return 0;
  }

  /**
   * Parse MIL status
   */
  private parseMILStatus(response: string): boolean {
    const hex = this.extractHex(response);
    if (hex.length >= 2) {
      const value = parseInt(hex.substring(0, 2), 16);
      return (value & 0x80) !== 0; // Check bit 7
    }
    return false;
  }

  /**
   * Parse DTC count
   */
  private parseDTCCount(response: string): number {
    const hex = this.extractHex(response);
    if (hex.length >= 2) {
      const value = parseInt(hex.substring(0, 2), 16);
      return value & 0x7F; // Lower 7 bits
    }
    return 0;
  }

  /**
   * Parse MAF
   */
  private parseMAF(response: string): number {
    const hex = this.extractHex(response);
    if (hex.length >= 4) {
      const a = parseInt(hex.substring(0, 2), 16);
      const b = parseInt(hex.substring(2, 4), 16);
      return ((a * 256) + b) / 100; // grams/sec
    }
    return 0;
  }

  /**
   * Parse pressure
   */
  private parsePressure(response: string): number {
    const hex = this.extractHex(response);
    if (hex.length >= 2) {
      const kpa = parseInt(hex.substring(0, 2), 16);
      return kpa * 0.145038; // Convert to PSI
    }
    return 0;
  }

  /**
   * Extract hex data from OBD2 response
   */
  private extractHex(response: string): string {
    // Remove spaces, prompt, and command echo
    const cleaned = response.replace(/\s/g, '').replace(/>/g, '');

    // Find hex response (after command)
    const match = cleaned.match(/[0-9A-F]{2,}/);
    if (match) {
      // Skip first 2 bytes (mode + PID)
      return match[0].substring(4);
    }

    return '';
  }

  /**
   * Delay helper
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
