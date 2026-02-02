/**
 * ============================================================================
 * Teltonika GPS Tracker Emulator
 * ============================================================================
 *
 * Emulates Teltonika FM-series GPS trackers for testing without real hardware.
 *
 * Features:
 * - GPS location tracking with realistic movement patterns
 * - RFID driver authentication events
 * - Remote starter disable/enable via digital outputs (DOUT1)
 * - Digital inputs (DIN1-DIN4) - ignition, door sensors, panic button
 * - Digital outputs (DOUT1-DOUT2) - starter relay, alarm control
 * - Analog inputs (AIN1-AIN4) - fuel sensor, temperature sensors
 * - IO data tracking and event generation
 * - Vehicle state (ignition on/off, movement detection)
 * - External/internal voltage monitoring
 * - CAN bus data simulation (RPM, fuel level, odometer)
 *
 * Supported Models: FM1120, FM3200, FM4200, FM5300
 *
 * Created: 2026-01-08
 * ============================================================================
 */

import { EventEmitter } from 'events';

// ============================================================================
// Types
// ============================================================================

export type TeltonikaModel = 'FM1120' | 'FM3200' | 'FM4200' | 'FM5300';

export interface TeltonikaLocation {
  imei: string;
  latitude: number;
  longitude: number;
  altitude: number; // meters
  speed: number; // km/h
  heading: number; // degrees (0-360)
  satellites: number;
  ignition: boolean;
  movement: boolean;
  timestamp: Date;
  hdop: number; // Horizontal dilution of precision
}

export interface TeltonikaDigitalInputs {
  din1: boolean; // Ignition
  din2: boolean; // Door sensor
  din3: boolean; // Panic button
  din4: boolean; // Auxiliary input
}

export interface TeltonikaDigitalOutputs {
  dout1: boolean; // Starter relay (false = disabled)
  dout2: boolean; // Alarm/Horn
}

export interface TeltonikaAnalogInputs {
  ain1: number; // Fuel level sensor (0-100%)
  ain2: number; // Temperature sensor 1 (-40 to 125°C)
  ain3: number; // Temperature sensor 2 (-40 to 125°C)
  ain4: number; // Custom analog input (voltage 0-30V)
}

export interface TeltonikaCANData {
  rpm: number; // Engine RPM
  fuelLevel: number; // Fuel level percentage (0-100)
  fuelUsed: number; // Total fuel used (liters)
  odometer: number; // Total distance (km)
  engineTemperature: number; // Coolant temp (°C)
  throttlePosition: number; // Throttle percentage (0-100)
  engineLoad: number; // Engine load percentage (0-100)
}

export interface TeltonikaVoltage {
  external: number; // External power supply voltage (V)
  internal: number; // Internal battery voltage (V)
  externalLow: boolean; // Alert if external < 11V
  internalLow: boolean; // Alert if internal < 3.3V
}

export interface TeltonikaIOData {
  imei: string;
  timestamp: Date;
  digitalInputs: TeltonikaDigitalInputs;
  digitalOutputs: TeltonikaDigitalOutputs;
  analogInputs: TeltonikaAnalogInputs;
  voltage: TeltonikaVoltage;
  canData: TeltonikaCANData;
  gsmSignal: number; // GSM signal strength (0-5)
  temperature: number; // Device internal temperature (°C)
}

export interface TeltonikaRFIDAuth {
  imei: string;
  rfidTag: string;
  authorized: boolean;
  driverId?: string;
  driverName?: string;
  timestamp: Date;
  location?: {
    latitude: number;
    longitude: number;
  };
}

export interface TeltonikaStarterControl {
  imei: string;
  enabled: boolean;
  reason: string;
  initiator: 'remote' | 'rfid' | 'auto' | 'manual';
  timestamp: Date;
}

// ============================================================================
// Emulator Configuration
// ============================================================================

export interface TeltonikaEmulatorConfig {
  imei?: string;
  model?: TeltonikaModel;
  updateFrequency?: number; // milliseconds
  enableRFID?: boolean;
  enableCANBus?: boolean;
  startLocation?: { latitude: number; longitude: number };
  authorizedRFIDTags?: Map<string, { driverId: string; driverName: string }>;
  starterEnabled?: boolean;
}

// ============================================================================
// Teltonika Emulator Class
// ============================================================================

export class TeltonikaEmulator extends EventEmitter {
  private config: Required<Omit<TeltonikaEmulatorConfig, 'authorizedRFIDTags'>> & {
    authorizedRFIDTags: Map<string, { driverId: string; driverName: string }>;
  };
  private updateInterval: NodeJS.Timeout | null = null;
  private isPaused: boolean = false;
  private isConnected: boolean = false;

  // Location state
  private latitude: number;
  private longitude: number;
  private altitude: number = 100;
  private heading: number = 0;
  private speed: number = 0; // km/h
  private satellites: number = 12;
  private hdop: number = 1.0;

  // Digital I/O state
  private digitalInputs: TeltonikaDigitalInputs = {
    din1: false, // Ignition off by default
    din2: false, // Door closed
    din3: false, // Panic button not pressed
    din4: false, // Auxiliary off
  };

  private digitalOutputs: TeltonikaDigitalOutputs = {
    dout1: true, // Starter enabled by default
    dout2: false, // Alarm off
  };

  // Analog inputs state
  private analogInputs: TeltonikaAnalogInputs = {
    ain1: 75, // 75% fuel level
    ain2: 22, // 22°C engine temp
    ain3: 20, // 20°C ambient temp
    ain4: 12.5, // 12.5V auxiliary voltage
  };

  // Voltage monitoring
  private voltage: TeltonikaVoltage = {
    external: 12.8,
    internal: 3.8,
    externalLow: false,
    internalLow: false,
  };

  // CAN bus data
  private canData: TeltonikaCANData = {
    rpm: 0,
    fuelLevel: 75,
    fuelUsed: 0,
    odometer: 125000, // 125,000 km
    engineTemperature: 20,
    throttlePosition: 0,
    engineLoad: 0,
  };

  // Device state
  private gsmSignal: number = 4; // Good signal (0-5)
  private deviceTemperature: number = 35; // Device internal temp
  private movement: boolean = false;

  // RFID state
  private currentRFIDTag: string | null = null;
  private currentDriverId: string | null = null;

  constructor(config: TeltonikaEmulatorConfig = {}) {
    super();

    // Default configuration
    this.config = {
      imei: config.imei || this.generateIMEI(),
      model: config.model || 'FM4200',
      updateFrequency: config.updateFrequency || 5000, // 5 seconds
      enableRFID: config.enableRFID ?? true,
      enableCANBus: config.enableCANBus ?? true,
      startLocation: config.startLocation || { latitude: 40.7128, longitude: -74.0060 }, // NYC
      authorizedRFIDTags: config.authorizedRFIDTags || new Map([
        ['RFID001234', { driverId: 'DRV001', driverName: 'John Smith' }],
        ['RFID005678', { driverId: 'DRV002', driverName: 'Jane Doe' }],
        ['RFID009012', { driverId: 'DRV003', driverName: 'Mike Johnson' }],
      ]),
      starterEnabled: config.starterEnabled ?? true,
    };

    // Initialize location
    this.latitude = this.config.startLocation.latitude;
    this.longitude = this.config.startLocation.longitude;

    // Set initial starter state
    this.digitalOutputs.dout1 = this.config.starterEnabled;
  }

  // ============================================================================
  // Emulator Control
  // ============================================================================

  public async start(): Promise<void> {
    if (this.isConnected) {
      throw new Error('Teltonika emulator is already running');
    }

    this.isConnected = true;
    this.isPaused = false;

    // Start data updates
    this.updateInterval = setInterval(() => {
      if (!this.isPaused) {
        this.update();
      }
    }, this.config.updateFrequency);

    this.emit('connected', {
      imei: this.config.imei,
      model: this.config.model,
      timestamp: new Date(),
    });

    console.log(`[Teltonika Emulator] Started for device ${this.config.imei} (${this.config.model})`);
  }

  public async stop(): Promise<void> {
    if (!this.isConnected) {
      return;
    }

    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }

    this.isConnected = false;

    this.emit('disconnected', {
      imei: this.config.imei,
      timestamp: new Date(),
    });

    console.log(`[Teltonika Emulator] Stopped for device ${this.config.imei}`);
  }

  public pause(): void {
    this.isPaused = true;
    this.emit('paused', { imei: this.config.imei });
  }

  public resume(): void {
    this.isPaused = false;
    this.emit('resumed', { imei: this.config.imei });
  }

  public isRunning(): boolean {
    return this.isConnected && !this.isPaused;
  }

  // ============================================================================
  // Emulation Logic
  // ============================================================================

  private update(): void {
    // Update vehicle state based on ignition
    if (this.digitalInputs.din1) {
      this.updateDriving();
    } else {
      this.updateParked();
    }

    // Update voltage based on ignition state
    this.updateVoltage();

    // Update device temperature
    this.updateDeviceTemperature();

    // Emit location update
    this.emitLocationUpdate();

    // Emit IO data
    this.emitIOData();

    // Check for low voltage alerts
    this.checkVoltageAlerts();
  }

  private updateDriving(): void {
    // Can only drive if starter is enabled
    if (!this.digitalOutputs.dout1) {
      // Starter disabled, vehicle cannot move
      this.speed = 0;
      this.movement = false;
      this.canData.rpm = 0;
      this.canData.throttlePosition = 0;
      this.canData.engineLoad = 0;
      return;
    }

    // Vary speed (0-120 km/h typical)
    this.speed += (Math.random() - 0.5) * 10;
    this.speed = Math.max(0, Math.min(120, this.speed));

    this.movement = this.speed > 5; // Movement detected above 5 km/h

    // Update heading (slight variations)
    this.heading += (Math.random() - 0.5) * 15;
    this.heading = (this.heading + 360) % 360;

    // Update location based on speed and heading
    const speedMps = (this.speed * 1000) / 3600; // km/h to m/s
    const distanceMeters = speedMps * (this.config.updateFrequency / 1000);

    const headingRad = this.heading * (Math.PI / 180);
    const latChange = (Math.cos(headingRad) * distanceMeters) / 111320;
    const lonChange =
      (Math.sin(headingRad) * distanceMeters) / (111320 * Math.cos((this.latitude * Math.PI) / 180));

    this.latitude += latChange;
    this.longitude += lonChange;

    // Update CAN bus data if enabled
    if (this.config.enableCANBus) {
      this.canData.rpm = 800 + (this.speed / 120) * 4200; // 800-5000 RPM
      this.canData.engineTemperature = Math.min(95, 20 + (this.canData.rpm / 5000) * 75);
      this.canData.throttlePosition = (this.speed / 120) * 100;
      this.canData.engineLoad = 20 + (this.speed / 120) * 60; // 20-80% load
      this.canData.odometer += distanceMeters / 1000; // km

      // Fuel consumption based on speed and load
      const fuelConsumptionRate = 0.00015 * (this.canData.engineLoad / 100); // L per meter
      this.canData.fuelUsed += distanceMeters * fuelConsumptionRate;
      this.canData.fuelLevel -= (distanceMeters * fuelConsumptionRate * 100) / 60; // Assuming 60L tank
      this.canData.fuelLevel = Math.max(0, this.canData.fuelLevel);

      // Sync analog fuel sensor with CAN
      this.analogInputs.ain1 = this.canData.fuelLevel;
      this.analogInputs.ain2 = this.canData.engineTemperature;
    }

    // GPS quality varies with speed/conditions
    this.satellites = 8 + Math.floor(Math.random() * 6); // 8-13 satellites
    this.hdop = 0.8 + Math.random() * 0.6; // 0.8-1.4 (good)
  }

  private updateParked(): void {
    this.speed = 0;
    this.movement = false;

    if (this.config.enableCANBus) {
      this.canData.rpm = 0;
      this.canData.throttlePosition = 0;
      this.canData.engineLoad = 0;

      // Engine cooling down
      this.canData.engineTemperature = Math.max(20, this.canData.engineTemperature - 0.5);
      this.analogInputs.ain2 = this.canData.engineTemperature;
    }

    // Better GPS reception when stationary
    this.satellites = 10 + Math.floor(Math.random() * 5); // 10-14 satellites
    this.hdop = 0.6 + Math.random() * 0.4; // 0.6-1.0 (excellent)
  }

  private updateVoltage(): void {
    if (this.digitalInputs.din1) {
      // Ignition on - charging
      this.voltage.external = 13.8 + (Math.random() - 0.5) * 0.3; // 13.65-13.95V
      this.voltage.internal = 3.9 + (Math.random() - 0.5) * 0.1; // 3.85-3.95V
    } else {
      // Ignition off - discharging slowly
      this.voltage.external = 12.4 + (Math.random() - 0.5) * 0.2; // 12.3-12.5V
      this.voltage.internal = 3.7 + (Math.random() - 0.5) * 0.1; // 3.65-3.75V
    }

    this.voltage.externalLow = this.voltage.external < 11.0;
    this.voltage.internalLow = this.voltage.internal < 3.3;
  }

  private updateDeviceTemperature(): void {
    // Device temperature depends on external conditions and operation
    const targetTemp = this.digitalInputs.din1 ? 45 : 30; // Warmer when operating
    const tempDiff = targetTemp - this.deviceTemperature;
    this.deviceTemperature += tempDiff * 0.05; // Gradual temperature change
    this.deviceTemperature += (Math.random() - 0.5) * 2; // Random fluctuation
  }

  private emitLocationUpdate(): void {
    const locationData: TeltonikaLocation = {
      imei: this.config.imei,
      latitude: this.latitude,
      longitude: this.longitude,
      altitude: this.altitude,
      speed: this.speed,
      heading: this.heading,
      satellites: this.satellites,
      ignition: this.digitalInputs.din1,
      movement: this.movement,
      timestamp: new Date(),
      hdop: this.hdop,
    };

    this.emit('location', locationData);
  }

  private emitIOData(): void {
    const ioData: TeltonikaIOData = {
      imei: this.config.imei,
      timestamp: new Date(),
      digitalInputs: { ...this.digitalInputs },
      digitalOutputs: { ...this.digitalOutputs },
      analogInputs: { ...this.analogInputs },
      voltage: { ...this.voltage },
      canData: { ...this.canData },
      gsmSignal: this.gsmSignal,
      temperature: this.deviceTemperature,
    };

    this.emit('io:data', ioData);
  }

  private checkVoltageAlerts(): void {
    if (this.voltage.externalLow) {
      this.emit('voltage:low:external', {
        imei: this.config.imei,
        voltage: this.voltage.external,
        threshold: 11.0,
        timestamp: new Date(),
      });
    }

    if (this.voltage.internalLow) {
      this.emit('voltage:low:internal', {
        imei: this.config.imei,
        voltage: this.voltage.internal,
        threshold: 3.3,
        timestamp: new Date(),
      });
    }
  }

  // ============================================================================
  // Public API - RFID Authentication
  // ============================================================================

  public registerRFIDTag(rfidTag: string, driverId: string, driverName: string): void {
    this.config.authorizedRFIDTags.set(rfidTag, { driverId, driverName });
    console.log(`[Teltonika Emulator] Registered RFID tag: ${rfidTag} (${driverName})`);
  }

  public unregisterRFIDTag(rfidTag: string): void {
    this.config.authorizedRFIDTags.delete(rfidTag);
    console.log(`[Teltonika Emulator] Unregistered RFID tag: ${rfidTag}`);
  }

  public authenticateRFID(rfidTag: string): void {
    const driverInfo = this.config.authorizedRFIDTags.get(rfidTag);
    const authorized = !!driverInfo;

    const authEvent: TeltonikaRFIDAuth = {
      imei: this.config.imei,
      rfidTag,
      authorized,
      driverId: driverInfo?.driverId,
      driverName: driverInfo?.driverName,
      timestamp: new Date(),
      location: {
        latitude: this.latitude,
        longitude: this.longitude,
      },
    };

    if (authorized) {
      this.currentRFIDTag = rfidTag;
      this.currentDriverId = driverInfo.driverId;
      console.log(`[Teltonika Emulator] RFID authenticated: ${driverInfo.driverName}`);
    } else {
      console.log(`[Teltonika Emulator] RFID authentication failed: ${rfidTag}`);
    }

    this.emit('rfid:auth', authEvent);
  }

  public clearRFID(): void {
    if (this.currentRFIDTag) {
      const previousTag = this.currentRFIDTag;
      this.currentRFIDTag = null;
      this.currentDriverId = null;

      this.emit('rfid:cleared', {
        imei: this.config.imei,
        previousTag,
        timestamp: new Date(),
      });

      console.log(`[Teltonika Emulator] RFID cleared: ${previousTag}`);
    }
  }

  // ============================================================================
  // Public API - Starter Control
  // ============================================================================

  public disableStarter(reason: string = 'Remote command', initiator: 'remote' | 'rfid' | 'auto' | 'manual' = 'remote'): void {
    if (this.digitalOutputs.dout1) {
      this.digitalOutputs.dout1 = false;

      // If vehicle was running, stop it
      if (this.digitalInputs.din1) {
        this.triggerIgnition(false);
      }

      const event: TeltonikaStarterControl = {
        imei: this.config.imei,
        enabled: false,
        reason,
        initiator,
        timestamp: new Date(),
      };

      this.emit('starter:disabled', event);
      console.log(`[Teltonika Emulator] Starter disabled: ${reason}`);
    }
  }

  public enableStarter(reason: string = 'Remote command', initiator: 'remote' | 'rfid' | 'auto' | 'manual' = 'remote'): void {
    if (!this.digitalOutputs.dout1) {
      this.digitalOutputs.dout1 = true;

      const event: TeltonikaStarterControl = {
        imei: this.config.imei,
        enabled: true,
        reason,
        initiator,
        timestamp: new Date(),
      };

      this.emit('starter:enabled', event);
      console.log(`[Teltonika Emulator] Starter enabled: ${reason}`);
    }
  }

  // ============================================================================
  // Public API - Vehicle Control
  // ============================================================================

  public triggerIgnition(state: boolean): void {
    if (this.digitalInputs.din1 === state) {
      return; // No change
    }

    // Check if starter is disabled
    if (state && !this.digitalOutputs.dout1) {
      console.log(`[Teltonika Emulator] Cannot start ignition - starter disabled`);
      this.emit('ignition:blocked', {
        imei: this.config.imei,
        reason: 'Starter disabled',
        timestamp: new Date(),
      });
      return;
    }

    this.digitalInputs.din1 = state;

    this.emit('ignition:changed', {
      imei: this.config.imei,
      ignition: state,
      timestamp: new Date(),
    });

    if (state) {
      console.log(`[Teltonika Emulator] Ignition turned ON`);
    } else {
      console.log(`[Teltonika Emulator] Ignition turned OFF`);
      this.speed = 0;
      this.movement = false;
    }
  }

  public setDoorState(open: boolean): void {
    this.digitalInputs.din2 = open;
    this.emit('door:changed', {
      imei: this.config.imei,
      open,
      timestamp: new Date(),
    });
  }

  public triggerPanicButton(): void {
    this.digitalInputs.din3 = true;

    this.emit('panic:triggered', {
      imei: this.config.imei,
      location: {
        latitude: this.latitude,
        longitude: this.longitude,
      },
      timestamp: new Date(),
    });

    console.log(`[Teltonika Emulator] PANIC BUTTON TRIGGERED`);

    // Auto-reset panic button after 2 seconds
    setTimeout(() => {
      this.digitalInputs.din3 = false;
    }, 2000);
  }

  public setAlarm(active: boolean): void {
    this.digitalOutputs.dout2 = active;
    this.emit('alarm:changed', {
      imei: this.config.imei,
      active,
      timestamp: new Date(),
    });
  }

  public setLocation(latitude: number, longitude: number, altitude?: number): void {
    this.latitude = latitude;
    this.longitude = longitude;
    if (altitude !== undefined) {
      this.altitude = altitude;
    }
  }

  public setSpeed(speed: number): void {
    this.speed = Math.max(0, Math.min(200, speed)); // 0-200 km/h
  }

  public setFuelLevel(percent: number): void {
    const fuelPercent = Math.max(0, Math.min(100, percent));
    this.canData.fuelLevel = fuelPercent;
    this.analogInputs.ain1 = fuelPercent;

    if (fuelPercent < 10) {
      this.emit('fuel:low', {
        imei: this.config.imei,
        fuelLevel: fuelPercent,
        timestamp: new Date(),
      });
    }
  }

  // ============================================================================
  // Public API - Data Retrieval
  // ============================================================================

  public getLocationData(): TeltonikaLocation {
    return {
      imei: this.config.imei,
      latitude: this.latitude,
      longitude: this.longitude,
      altitude: this.altitude,
      speed: this.speed,
      heading: this.heading,
      satellites: this.satellites,
      ignition: this.digitalInputs.din1,
      movement: this.movement,
      timestamp: new Date(),
      hdop: this.hdop,
    };
  }

  public getIOData(): TeltonikaIOData {
    return {
      imei: this.config.imei,
      timestamp: new Date(),
      digitalInputs: { ...this.digitalInputs },
      digitalOutputs: { ...this.digitalOutputs },
      analogInputs: { ...this.analogInputs },
      voltage: { ...this.voltage },
      canData: { ...this.canData },
      gsmSignal: this.gsmSignal,
      temperature: this.deviceTemperature,
    };
  }

  public getCurrentDriver(): { driverId: string; driverName: string } | null {
    if (!this.currentRFIDTag) {
      return null;
    }

    const driverInfo = this.config.authorizedRFIDTags.get(this.currentRFIDTag);
    return driverInfo || null;
  }

  public isStarterEnabled(): boolean {
    return this.digitalOutputs.dout1;
  }

  public getDeviceInfo(): {
    imei: string;
    model: TeltonikaModel;
    connected: boolean;
    paused: boolean;
  } {
    return {
      imei: this.config.imei,
      model: this.config.model,
      connected: this.isConnected,
      paused: this.isPaused,
    };
  }

  // ============================================================================
  // Utility Functions
  // ============================================================================

  private generateIMEI(): string {
    // Generate a valid IMEI (15 digits)
    // Format: TAC (8 digits) + SNR (6 digits) + Luhn check digit
    let imei = '35';
    for (let i = 0; i < 13; i++) {
      imei += Math.floor(Math.random() * 10);
    }

    // Calculate Luhn check digit
    let sum = 0;
    let double = false;
    for (let i = imei.length - 1; i >= 0; i--) {
      let digit = parseInt(imei[i]);
      if (double) {
        digit *= 2;
        if (digit > 9) digit -= 9;
      }
      sum += digit;
      double = !double;
    }

    const checkDigit = (10 - (sum % 10)) % 10;
    return imei + checkDigit;
  }
}
