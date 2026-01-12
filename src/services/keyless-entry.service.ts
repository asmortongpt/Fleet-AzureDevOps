/**
 * Keyless Entry Service
 *
 * Bluetooth and NFC integration for vehicle access
 *
 * Features:
 * - Bluetooth Low Energy (BLE) vehicle connection
 * - NFC tag reading for vehicle identification
 * - Secure vehicle unlock/lock commands
 * - Proximity-based access control
 * - Access logging and audit trail
 *
 * Security:
 * - Encrypted communication
 * - Time-based access tokens
 * - Role-based permissions
 * - Audit logging
 *
 * Browser APIs:
 * - Web Bluetooth API for BLE
 * - Web NFC API for NFC reading
 */

// Bluetooth Service UUIDs (example - replace with actual vehicle system UUIDs)
const VEHICLE_SERVICE_UUID = '0000180a-0000-1000-8000-00805f9b34fb';
const UNLOCK_CHARACTERISTIC_UUID = '00002a29-0000-1000-8000-00805f9b34fb';
const LOCK_CHARACTERISTIC_UUID = '00002a2a-0000-1000-8000-00805f9b34fb';
const STATUS_CHARACTERISTIC_UUID = '00002a2b-0000-1000-8000-00805f9b34fb';

export interface VehicleDevice {
  id: string;
  name: string;
  vehicleId: string;
  connected: boolean;
  rssi?: number; // Signal strength
  battery?: number; // Battery level (0-100)
}

export interface AccessLog {
  timestamp: Date;
  userId: string;
  vehicleId: string;
  action: 'unlock' | 'lock' | 'start' | 'stop';
  method: 'bluetooth' | 'nfc' | 'manual';
  success: boolean;
  error?: string;
  location?: { lat: number; lng: number };
}

export interface NFCVehicleTag {
  vehicleId: string;
  vehicleNumber: string;
  serialNumber: string;
  permissions: string[];
}

export class KeylessEntryService {
  private connectedDevice: BluetoothDevice | null = null;
  private deviceCharacteristics: Map<string, BluetoothRemoteGATTCharacteristic> = new Map();
  private accessLogs: AccessLog[] = [];
  private readonly API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

  constructor() {
    this.loadAccessLogs();
  }

  /**
   * Check if Bluetooth is available
   */
  public isBluetoothAvailable(): boolean {
    return 'bluetooth' in navigator;
  }

  /**
   * Check if NFC is available
   */
  public isNFCAvailable(): boolean {
    return 'NDEFReader' in window;
  }

  /**
   * Scan for nearby vehicle devices via Bluetooth
   */
  public async scanForVehicles(): Promise<VehicleDevice[]> {
    if (!this.isBluetoothAvailable()) {
      throw new Error('Bluetooth not supported in this browser');
    }

    try {
      const device = await navigator.bluetooth.requestDevice({
        filters: [
          { services: [VEHICLE_SERVICE_UUID] },
          { namePrefix: 'FLEET-' }, // Filter for fleet vehicles
        ],
        optionalServices: [VEHICLE_SERVICE_UUID],
      });

      if (!device) {
        return [];
      }

      // Return discovered device
      return [
        {
          id: device.id,
          name: device.name || 'Unknown Vehicle',
          vehicleId: this.extractVehicleId(device.name || ''),
          connected: device.gatt?.connected || false,
        },
      ];
    } catch (error) {
      console.error('[KeylessEntry] Failed to scan for vehicles:', error);
      throw error;
    }
  }

  /**
   * Connect to vehicle via Bluetooth
   */
  public async connectToVehicle(deviceId: string): Promise<boolean> {
    if (!this.isBluetoothAvailable()) {
      throw new Error('Bluetooth not supported');
    }

    try {
      // Request device
      const device = await navigator.bluetooth.requestDevice({
        filters: [{ services: [VEHICLE_SERVICE_UUID] }],
        optionalServices: [VEHICLE_SERVICE_UUID],
      });

      if (!device.gatt) {
        throw new Error('GATT not available on device');
      }

      // Connect to GATT server
      const server = await device.gatt.connect();
      console.log('[KeylessEntry] Connected to GATT server');

      // Get service
      const service = await server.getPrimaryService(VEHICLE_SERVICE_UUID);
      console.log('[KeylessEntry] Got vehicle service');

      // Get characteristics
      const unlockChar = await service.getCharacteristic(UNLOCK_CHARACTERISTIC_UUID);
      const lockChar = await service.getCharacteristic(LOCK_CHARACTERISTIC_UUID);
      const statusChar = await service.getCharacteristic(STATUS_CHARACTERISTIC_UUID);

      this.deviceCharacteristics.set('unlock', unlockChar);
      this.deviceCharacteristics.set('lock', lockChar);
      this.deviceCharacteristics.set('status', statusChar);

      this.connectedDevice = device;

      // Setup disconnect listener
      device.addEventListener('gattserverdisconnected', this.handleDisconnect.bind(this));

      console.log('[KeylessEntry] Vehicle connected successfully');
      return true;
    } catch (error) {
      console.error('[KeylessEntry] Failed to connect to vehicle:', error);
      throw error;
    }
  }

  /**
   * Disconnect from vehicle
   */
  public disconnect(): void {
    if (this.connectedDevice?.gatt?.connected) {
      this.connectedDevice.gatt.disconnect();
    }
    this.connectedDevice = null;
    this.deviceCharacteristics.clear();
  }

  /**
   * Unlock vehicle via Bluetooth
   */
  public async unlockVehicle(vehicleId: string): Promise<boolean> {
    if (!this.connectedDevice) {
      throw new Error('No vehicle connected');
    }

    try {
      // Verify authorization
      const authToken = await this.getAccessToken(vehicleId, 'unlock');

      // Send unlock command
      const unlockChar = this.deviceCharacteristics.get('unlock');
      if (!unlockChar) {
        throw new Error('Unlock characteristic not found');
      }

      const command = this.buildCommand('UNLOCK', authToken);
      await unlockChar.writeValue(command);

      // Log access
      await this.logAccess({
        timestamp: new Date(),
        userId: this.getCurrentUserId(),
        vehicleId,
        action: 'unlock',
        method: 'bluetooth',
        success: true,
        location: await this.getCurrentLocation(),
      });

      console.log('[KeylessEntry] Vehicle unlocked successfully');
      return true;
    } catch (error) {
      console.error('[KeylessEntry] Failed to unlock vehicle:', error);

      // Log failed attempt
      await this.logAccess({
        timestamp: new Date(),
        userId: this.getCurrentUserId(),
        vehicleId,
        action: 'unlock',
        method: 'bluetooth',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      throw error;
    }
  }

  /**
   * Lock vehicle via Bluetooth
   */
  public async lockVehicle(vehicleId: string): Promise<boolean> {
    if (!this.connectedDevice) {
      throw new Error('No vehicle connected');
    }

    try {
      // Verify authorization
      const authToken = await this.getAccessToken(vehicleId, 'lock');

      // Send lock command
      const lockChar = this.deviceCharacteristics.get('lock');
      if (!lockChar) {
        throw new Error('Lock characteristic not found');
      }

      const command = this.buildCommand('LOCK', authToken);
      await lockChar.writeValue(command);

      // Log access
      await this.logAccess({
        timestamp: new Date(),
        userId: this.getCurrentUserId(),
        vehicleId,
        action: 'lock',
        method: 'bluetooth',
        success: true,
        location: await this.getCurrentLocation(),
      });

      console.log('[KeylessEntry] Vehicle locked successfully');
      return true;
    } catch (error) {
      console.error('[KeylessEntry] Failed to lock vehicle:', error);

      // Log failed attempt
      await this.logAccess({
        timestamp: new Date(),
        userId: this.getCurrentUserId(),
        vehicleId,
        action: 'lock',
        method: 'bluetooth',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      throw error;
    }
  }

  /**
   * Get vehicle status via Bluetooth
   */
  public async getVehicleStatus(): Promise<any> {
    if (!this.connectedDevice) {
      throw new Error('No vehicle connected');
    }

    try {
      const statusChar = this.deviceCharacteristics.get('status');
      if (!statusChar) {
        throw new Error('Status characteristic not found');
      }

      const value = await statusChar.readValue();
      return this.parseStatusValue(value);
    } catch (error) {
      console.error('[KeylessEntry] Failed to get vehicle status:', error);
      throw error;
    }
  }

  /**
   * Scan NFC tag to identify vehicle
   */
  public async scanNFCTag(): Promise<NFCVehicleTag> {
    if (!this.isNFCAvailable()) {
      throw new Error('NFC not supported in this browser');
    }

    try {
      const ndef = new (window as any).NDEFReader();

      // Start scanning
      await ndef.scan();
      console.log('[KeylessEntry] NFC scan started');

      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('NFC scan timeout'));
        }, 10000); // 10 second timeout

        ndef.addEventListener('reading', ({ message, serialNumber }: any) => {
          clearTimeout(timeout);

          try {
            // Parse NDEF message
            const vehicleData = this.parseNDEFMessage(message);

            resolve({
              vehicleId: vehicleData.vehicleId,
              vehicleNumber: vehicleData.vehicleNumber,
              serialNumber,
              permissions: vehicleData.permissions || [],
            });
          } catch (error) {
            reject(error);
          }
        });

        ndef.addEventListener('readingerror', () => {
          clearTimeout(timeout);
          reject(new Error('NFC reading error'));
        });
      });
    } catch (error) {
      console.error('[KeylessEntry] NFC scan failed:', error);
      throw error;
    }
  }

  /**
   * Get access logs
   */
  public getAccessLogs(limit = 50): AccessLog[] {
    return this.accessLogs.slice(0, limit);
  }

  /**
   * Clear access logs
   */
  public clearAccessLogs(): void {
    this.accessLogs = [];
    localStorage.removeItem('keyless-entry-logs');
  }

  // Helper methods

  private extractVehicleId(deviceName: string): string {
    // Extract vehicle ID from device name (e.g., "FLEET-V123" -> "V123")
    const match = deviceName.match(/FLEET-(.+)/);
    return match ? match[1] : 'unknown';
  }

  private async getAccessToken(vehicleId: string, action: string): Promise<string> {
    try {
      const response = await fetch(`${this.API_BASE_URL}/keyless-entry/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getAuthToken()}`,
        },
        body: JSON.stringify({
          vehicleId,
          action,
          timestamp: Date.now(),
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return data.token;
    } catch (error) {
      console.error('[KeylessEntry] Failed to get access token:', error);
      throw error;
    }
  }

  private buildCommand(action: string, authToken: string): DataView {
    // Build command byte array
    // Format: [ACTION_CODE][AUTH_TOKEN_BYTES][TIMESTAMP_BYTES]
    const encoder = new TextEncoder();
    const actionCode = action === 'UNLOCK' ? 0x01 : 0x02;
    const tokenBytes = encoder.encode(authToken);
    const timestamp = Date.now();

    const buffer = new ArrayBuffer(1 + tokenBytes.length + 8);
    const view = new DataView(buffer);

    view.setUint8(0, actionCode);
    tokenBytes.forEach((byte, i) => view.setUint8(1 + i, byte));
    view.setBigUint64(1 + tokenBytes.length, BigInt(timestamp), false);

    return view;
  }

  private parseStatusValue(value: DataView): any {
    // Parse status bytes
    // Example format: [LOCK_STATE][BATTERY][SIGNAL_STRENGTH]
    return {
      locked: value.getUint8(0) === 1,
      battery: value.getUint8(1),
      signalStrength: value.getUint8(2),
    };
  }

  private parseNDEFMessage(message: any): any {
    // Parse NDEF message records
    const records = message.records;
    const data: any = {};

    for (const record of records) {
      if (record.recordType === 'text') {
        const decoder = new TextDecoder();
        const text = decoder.decode(record.data);
        const [key, value] = text.split(':');
        data[key] = value;
      }
    }

    return {
      vehicleId: data.vehicleId || '',
      vehicleNumber: data.vehicleNumber || '',
      permissions: data.permissions ? data.permissions.split(',') : [],
    };
  }

  private handleDisconnect(): void {
    console.log('[KeylessEntry] Vehicle disconnected');
    this.connectedDevice = null;
    this.deviceCharacteristics.clear();
  }

  private async getCurrentLocation(): Promise<{ lat: number; lng: number } | undefined> {
    try {
      return new Promise((resolve) => {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            resolve({
              lat: position.coords.latitude,
              lng: position.coords.longitude,
            });
          },
          () => {
            resolve(undefined);
          },
          { timeout: 5000 }
        );
      });
    } catch {
      return undefined;
    }
  }

  private async logAccess(log: AccessLog): Promise<void> {
    this.accessLogs.unshift(log);
    this.accessLogs = this.accessLogs.slice(0, 100); // Keep last 100 logs

    // Save to local storage
    localStorage.setItem('keyless-entry-logs', JSON.stringify(this.accessLogs));

    // Send to server
    try {
      await fetch(`${this.API_BASE_URL}/keyless-entry/logs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getAuthToken()}`,
        },
        body: JSON.stringify(log),
      });
    } catch (error) {
      console.error('[KeylessEntry] Failed to send access log to server:', error);
    }
  }

  private loadAccessLogs(): void {
    try {
      const stored = localStorage.getItem('keyless-entry-logs');
      if (stored) {
        this.accessLogs = JSON.parse(stored);
      }
    } catch (error) {
      console.error('[KeylessEntry] Failed to load access logs:', error);
    }
  }

  private getCurrentUserId(): string {
    // Get current user ID from auth context
    return localStorage.getItem('userId') || 'unknown';
  }

  private getAuthToken(): string {
    return localStorage.getItem('authToken') || '';
  }
}

// Export singleton instance
export const keylessEntryService = new KeylessEntryService();
