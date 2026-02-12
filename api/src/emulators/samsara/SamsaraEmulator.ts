/**
 * ============================================================================
 * Samsara Fleet Telematics Emulator
 * ============================================================================
 *
 * Emulates Samsara API responses for testing without real hardware/API access.
 *
 * Features:
 * - GPS tracking with realistic movement patterns
 * - Driver safety events (harsh braking, acceleration, collisions)
 * - Video dash cam clips
 * - Hours of Service (HOS) tracking
 * - Temperature monitoring (reefer trucks)
 * - Vehicle diagnostics (fuel, tire pressure, check engine)
 *
 * Created: 2026-01-08
 * ============================================================================
 */

import { EventEmitter } from 'events';

// ============================================================================
// Types
// ============================================================================

export interface SamsaraVehicle {
  id: string;
  name: string;
  vin: string;
  licensePlate: string;
  location: {
    latitude: number;
    longitude: number;
    heading: number;
    speed: number; // mph
    address?: string;
  };
  engineState: 'on' | 'off';
  fuelPercent: number;
  odometerMeters: number;
  gps: {
    latitude: number;
    longitude: number;
    heading: number;
    speed: number;
    time: Date;
  };
}

export interface SamsaraSafetyEvent {
  id: string;
  type: 'harsh_acceleration' | 'harsh_braking' | 'harsh_turn' | 'collision' | 'distracted_driving' | 'following_distance';
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: Date;
  location: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  vehicleId: string;
  driverId?: string;
  driverName?: string;
  speed: number; // mph at time of event
  gForce?: number;
  videoClipUrl?: string;
  downloadUrl?: string;
}

export interface SamsaraVideoClip {
  id: string;
  vehicleId: string;
  driverId?: string;
  timestamp: Date;
  duration: number; // seconds
  type: 'safety_event' | 'manual_request' | 'scheduled';
  cameras: ('road_facing' | 'driver_facing' | 'interior')[];
  downloadUrl: string;
  thumbnailUrl: string;
  tags: string[];
}

export interface SamsaraHOSLog {
  id: string;
  driverId: string;
  driverName: string;
  date: Date;
  status: 'off_duty' | 'sleeper_berth' | 'driving' | 'on_duty_not_driving';
  startTime: Date;
  endTime?: Date;
  duration: number; // minutes
  location?: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  vehicleId?: string;
  odometer?: number;
  notes?: string;
}

export interface SamsaraTemperature {
  id: string;
  vehicleId: string;
  probeId: string;
  probeName: string;
  temperature: number; // Celsius
  setpoint?: number; // Target temperature for reefer
  timestamp: Date;
  unit: 'celsius' | 'fahrenheit';
}

export interface SamsaraDiagnostic {
  vehicleId: string;
  timestamp: Date;
  fuelPercent: number;
  batteryVoltage: number;
  engineRpm: number;
  engineCoolantTemp: number; // Celsius
  engineOilPressure: number; // PSI
  tirePressure: {
    frontLeft: number;
    frontRight: number;
    rearLeft: number;
    rearRight: number;
  };
  checkEngineLight: boolean;
  faultCodes: string[];
}

// ============================================================================
// Emulator Configuration
// ============================================================================

export interface SamsaraEmulatorConfig {
  vehicleId?: string;
  vehicleName?: string;
  vin?: string;
  licensePlate?: string;
  updateFrequency?: number; // milliseconds
  enableSafetyEvents?: boolean;
  enableHOS?: boolean;
  enableTemperature?: boolean;
  enableVideo?: boolean;
  startLocation?: { latitude: number; longitude: number };
  driverId?: string;
  driverName?: string;
}

// ============================================================================
// Samsara Emulator Class
// ============================================================================

export class SamsaraEmulator extends EventEmitter {
  private config: Required<SamsaraEmulatorConfig>;
  private updateInterval: NodeJS.Timeout | null = null;
  private isPaused: boolean = false;
  private isConnected: boolean = false;

  // Vehicle state
  private latitude: number;
  private longitude: number;
  private heading: number = 0;
  private speed: number = 0; // mph
  private engineState: 'on' | 'off' = 'off';
  private fuelPercent: number = 75;
  private odometerMeters: number = 50000000; // 50,000 km
  private batteryVoltage: number = 12.6;
  private engineRpm: number = 0;
  private engineCoolantTemp: number = 20;
  private checkEngineLight: boolean = false;
  private faultCodes: string[] = [];

  // Temperature monitoring (for reefer trucks)
  private temperature: number = -18; // Celsius (typical freezer)
  private temperatureSetpoint: number = -18;

  // HOS tracking
  private currentHOSStatus: 'off_duty' | 'sleeper_berth' | 'driving' | 'on_duty_not_driving' = 'off_duty';
  private hosLogs: SamsaraHOSLog[] = [];
  private currentHOSStartTime: Date = new Date();

  // Safety events
  private safetyEventCount: number = 0;

  constructor(config: SamsaraEmulatorConfig = {}) {
    super();

    // Default configuration
    this.config = {
      vehicleId: config.vehicleId || `samsara_${Math.random().toString(36).substr(2, 9)}`,
      vehicleName: config.vehicleName || 'Fleet Vehicle',
      vin: config.vin || this.generateVIN(),
      licensePlate: config.licensePlate || this.generateLicensePlate(),
      updateFrequency: config.updateFrequency || 5000, // 5 seconds
      enableSafetyEvents: config.enableSafetyEvents ?? true,
      enableHOS: config.enableHOS ?? true,
      enableTemperature: config.enableTemperature ?? false,
      enableVideo: config.enableVideo ?? true,
      startLocation: config.startLocation || { latitude: 40.7128, longitude: -74.0060 }, // NYC
      driverId: config.driverId || `driver_${Math.random().toString(36).substr(2, 9)}`,
      driverName: config.driverName || 'John Doe'
    };

    // Initialize location
    this.latitude = this.config.startLocation.latitude;
    this.longitude = this.config.startLocation.longitude;
  }

  // ============================================================================
  // Emulator Control
  // ============================================================================

  public async start(): Promise<void> {
    if (this.isConnected) {
      throw new Error('Samsara emulator is already running');
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
      vehicleId: this.config.vehicleId,
      timestamp: new Date()
    });

    console.log(`[Samsara Emulator] Started for vehicle ${this.config.vehicleId}`);
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
      vehicleId: this.config.vehicleId,
      timestamp: new Date()
    });

    console.log(`[Samsara Emulator] Stopped for vehicle ${this.config.vehicleId}`);
  }

  public pause(): void {
    this.isPaused = true;
    this.emit('paused', { vehicleId: this.config.vehicleId });
  }

  public resume(): void {
    this.isPaused = false;
    this.emit('resumed', { vehicleId: this.config.vehicleId });
  }

  public isRunning(): boolean {
    return this.isConnected && !this.isPaused;
  }

  // ============================================================================
  // Emulation Logic
  // ============================================================================

  private update(): void {
    // Update vehicle state based on engine status
    if (this.engineState === 'on') {
      this.updateDriving();
    } else {
      this.updateParked();
    }

    // Emit location update
    this.emitLocationUpdate();

    // Randomly generate safety events (if enabled and driving)
    if (this.config.enableSafetyEvents && this.engineState === 'on') {
      this.maybeGenerateSafetyEvent();
    }

    // Update temperature (if enabled)
    if (this.config.enableTemperature) {
      this.updateTemperature();
    }

    // Emit diagnostic data
    this.emitDiagnostics();
  }

  private updateDriving(): void {
    // Vary speed (30-65 mph typical city/highway)
    this.speed += (Math.random() - 0.5) * 5;
    this.speed = Math.max(0, Math.min(65, this.speed));

    // Update heading (slight variations)
    this.heading += (Math.random() - 0.5) * 10;
    this.heading = (this.heading + 360) % 360;

    // Update location based on speed and heading
    const speedMps = this.speed * 0.44704; // mph to m/s
    const distanceMeters = speedMps * (this.config.updateFrequency / 1000);

    const headingRad = this.heading * (Math.PI / 180);
    const latChange = (Math.cos(headingRad) * distanceMeters) / 111320; // meters to degrees
    const lonChange = (Math.sin(headingRad) * distanceMeters) / (111320 * Math.cos(this.latitude * Math.PI / 180));

    this.latitude += latChange;
    this.longitude += lonChange;

    // Update odometer
    this.odometerMeters += distanceMeters;

    // Engine parameters
    this.engineRpm = 1500 + (this.speed / 65) * 2000; // 1500-3500 RPM
    this.engineCoolantTemp = Math.min(95, 20 + (this.engineRpm / 3500) * 75);
    this.batteryVoltage = 13.8 + (Math.random() - 0.5) * 0.2; // Charging

    // Fuel consumption
    this.fuelPercent -= 0.001 * (this.speed / 65);
    this.fuelPercent = Math.max(0, this.fuelPercent);

    // Update HOS to driving
    if (this.config.enableHOS && this.currentHOSStatus !== 'driving') {
      this.changeHOSStatus('driving');
    }
  }

  private updateParked(): void {
    this.speed = 0;
    this.engineRpm = 0;
    this.engineCoolantTemp = Math.max(20, this.engineCoolantTemp - 0.5); // Cooling down
    this.batteryVoltage = 12.4 + (Math.random() - 0.5) * 0.1;
  }

  private updateTemperature(): void {
    // Simulate temperature fluctuations around setpoint
    const deviation = (Math.random() - 0.5) * 2;
    this.temperature = this.temperatureSetpoint + deviation;

    // Occasionally emit temperature alert
    if (Math.abs(this.temperature - this.temperatureSetpoint) > 3) {
      this.emit('temperature:alert', {
        vehicleId: this.config.vehicleId,
        probeId: 'probe_1',
        probeName: 'Cargo Hold',
        temperature: this.temperature,
        setpoint: this.temperatureSetpoint,
        deviation: this.temperature - this.temperatureSetpoint,
        timestamp: new Date()
      });
    }
  }

  private emitLocationUpdate(): void {
    const vehicleData: SamsaraVehicle = {
      id: this.config.vehicleId,
      name: this.config.vehicleName,
      vin: this.config.vin,
      licensePlate: this.config.licensePlate,
      location: {
        latitude: this.latitude,
        longitude: this.longitude,
        heading: this.heading,
        speed: this.speed
      },
      engineState: this.engineState,
      fuelPercent: this.fuelPercent,
      odometerMeters: this.odometerMeters,
      gps: {
        latitude: this.latitude,
        longitude: this.longitude,
        heading: this.heading,
        speed: this.speed,
        time: new Date()
      }
    };

    this.emit('location', vehicleData);
  }

  private emitDiagnostics(): void {
    const diagnostics: SamsaraDiagnostic = {
      vehicleId: this.config.vehicleId,
      timestamp: new Date(),
      fuelPercent: this.fuelPercent,
      batteryVoltage: this.batteryVoltage,
      engineRpm: this.engineRpm,
      engineCoolantTemp: this.engineCoolantTemp,
      engineOilPressure: 40 + (Math.random() - 0.5) * 5,
      tirePressure: {
        frontLeft: 32 + (Math.random() - 0.5) * 2,
        frontRight: 32 + (Math.random() - 0.5) * 2,
        rearLeft: 32 + (Math.random() - 0.5) * 2,
        rearRight: 32 + (Math.random() - 0.5) * 2
      },
      checkEngineLight: this.checkEngineLight,
      faultCodes: this.faultCodes
    };

    this.emit('diagnostics', diagnostics);
  }

  private maybeGenerateSafetyEvent(): void {
    // 0.5% chance per update (rare events)
    if (Math.random() < 0.005) {
      const eventTypes: SamsaraSafetyEvent['type'][] = [
        'harsh_acceleration',
        'harsh_braking',
        'harsh_turn',
        'distracted_driving',
        'following_distance'
      ];

      const severities: SamsaraSafetyEvent['severity'][] = ['low', 'medium', 'high'];

      const eventType = eventTypes[Math.floor(Math.random() * eventTypes.length)];
      const severity = severities[Math.floor(Math.random() * severities.length)];

      const safetyEvent: SamsaraSafetyEvent = {
        id: `safety_${Date.now()}_${this.safetyEventCount++}`,
        type: eventType,
        severity,
        timestamp: new Date(),
        location: {
          latitude: this.latitude,
          longitude: this.longitude
        },
        vehicleId: this.config.vehicleId,
        driverId: this.config.driverId,
        driverName: this.config.driverName,
        speed: this.speed,
        gForce: severity === 'high' || severity === 'critical' ? 0.8 + Math.random() * 0.4 : 0.3 + Math.random() * 0.3
      };

      // Generate video clip URL if video enabled
      if (this.config.enableVideo) {
        safetyEvent.videoClipUrl = `https://videos.samsara.com/clips/${safetyEvent.id}`;
        safetyEvent.downloadUrl = `https://api.samsara.com/v1/fleet/vehicles/${this.config.vehicleId}/safety_events/${safetyEvent.id}/video`;

        // Emit video clip
        this.emitVideoClip(safetyEvent);
      }

      this.emit('safety:event', safetyEvent);
      console.log(`[Samsara Emulator] Safety event: ${eventType} (${severity})`);
    }
  }

  private emitVideoClip(safetyEvent: SamsaraSafetyEvent): void {
    const videoClip: SamsaraVideoClip = {
      id: safetyEvent.id,
      vehicleId: this.config.vehicleId,
      driverId: this.config.driverId,
      timestamp: safetyEvent.timestamp,
      duration: 30, // 30 second clips (before + after event)
      type: 'safety_event',
      cameras: ['road_facing', 'driver_facing'],
      downloadUrl: safetyEvent.downloadUrl!,
      thumbnailUrl: `https://videos.samsara.com/clips/${safetyEvent.id}/thumbnail.jpg`,
      tags: [safetyEvent.type, safetyEvent.severity]
    };

    this.emit('video:clip', videoClip);
  }

  private changeHOSStatus(newStatus: SamsaraHOSLog['status']): void {
    if (this.currentHOSStatus === newStatus) {
      return;
    }

    // Close previous HOS log
    const duration = Math.floor((Date.now() - this.currentHOSStartTime.getTime()) / 60000); // minutes

    const previousLog: SamsaraHOSLog = {
      id: `hos_${Date.now()}`,
      driverId: this.config.driverId,
      driverName: this.config.driverName,
      date: this.currentHOSStartTime,
      status: this.currentHOSStatus,
      startTime: this.currentHOSStartTime,
      endTime: new Date(),
      duration,
      location: {
        latitude: this.latitude,
        longitude: this.longitude
      },
      vehicleId: this.config.vehicleId,
      odometer: this.odometerMeters
    };

    this.hosLogs.push(previousLog);
    this.emit('hos:log', previousLog);

    // Start new HOS log
    this.currentHOSStatus = newStatus;
    this.currentHOSStartTime = new Date();

    console.log(`[Samsara Emulator] HOS status changed to: ${newStatus}`);
  }

  // ============================================================================
  // Public API - Vehicle Control
  // ============================================================================

  public startEngine(): void {
    if (this.engineState === 'off') {
      this.engineState = 'on';
      this.speed = 0;
      this.emit('engine:started', { vehicleId: this.config.vehicleId, timestamp: new Date() });

      if (this.config.enableHOS) {
        this.changeHOSStatus('driving');
      }
    }
  }

  public stopEngine(): void {
    if (this.engineState === 'on') {
      this.engineState = 'off';
      this.speed = 0;
      this.engineRpm = 0;
      this.emit('engine:stopped', { vehicleId: this.config.vehicleId, timestamp: new Date() });

      if (this.config.enableHOS) {
        this.changeHOSStatus('off_duty');
      }
    }
  }

  public setSpeed(speed: number): void {
    this.speed = Math.max(0, Math.min(80, speed));
  }

  public setLocation(latitude: number, longitude: number): void {
    this.latitude = latitude;
    this.longitude = longitude;
  }

  public setFuelLevel(percent: number): void {
    this.fuelPercent = Math.max(0, Math.min(100, percent));
  }

  public setTemperatureSetpoint(celsius: number): void {
    this.temperatureSetpoint = celsius;
  }

  public triggerSafetyEvent(type: SamsaraSafetyEvent['type'], severity: SamsaraSafetyEvent['severity']): void {
    const safetyEvent: SamsaraSafetyEvent = {
      id: `safety_manual_${Date.now()}`,
      type,
      severity,
      timestamp: new Date(),
      location: {
        latitude: this.latitude,
        longitude: this.longitude
      },
      vehicleId: this.config.vehicleId,
      driverId: this.config.driverId,
      driverName: this.config.driverName,
      speed: this.speed,
      gForce: severity === 'critical' ? 1.0 : 0.6
    };

    if (this.config.enableVideo) {
      safetyEvent.videoClipUrl = `https://videos.samsara.com/clips/${safetyEvent.id}`;
      safetyEvent.downloadUrl = `https://api.samsara.com/v1/fleet/vehicles/${this.config.vehicleId}/safety_events/${safetyEvent.id}/video`;
      this.emitVideoClip(safetyEvent);
    }

    this.emit('safety:event', safetyEvent);
  }

  // ============================================================================
  // Public API - Data Retrieval
  // ============================================================================

  public getVehicleData(): SamsaraVehicle {
    return {
      id: this.config.vehicleId,
      name: this.config.vehicleName,
      vin: this.config.vin,
      licensePlate: this.config.licensePlate,
      location: {
        latitude: this.latitude,
        longitude: this.longitude,
        heading: this.heading,
        speed: this.speed
      },
      engineState: this.engineState,
      fuelPercent: this.fuelPercent,
      odometerMeters: this.odometerMeters,
      gps: {
        latitude: this.latitude,
        longitude: this.longitude,
        heading: this.heading,
        speed: this.speed,
        time: new Date()
      }
    };
  }

  public getDiagnostics(): SamsaraDiagnostic {
    return {
      vehicleId: this.config.vehicleId,
      timestamp: new Date(),
      fuelPercent: this.fuelPercent,
      batteryVoltage: this.batteryVoltage,
      engineRpm: this.engineRpm,
      engineCoolantTemp: this.engineCoolantTemp,
      engineOilPressure: 40,
      tirePressure: {
        frontLeft: 32,
        frontRight: 32,
        rearLeft: 32,
        rearRight: 32
      },
      checkEngineLight: this.checkEngineLight,
      faultCodes: this.faultCodes
    };
  }

  public getHOSLogs(): SamsaraHOSLog[] {
    return [...this.hosLogs];
  }

  public getCurrentHOSStatus(): SamsaraHOSLog['status'] {
    return this.currentHOSStatus;
  }

  public getTemperature(): SamsaraTemperature {
    return {
      id: 'probe_1',
      vehicleId: this.config.vehicleId,
      probeId: 'probe_1',
      probeName: 'Cargo Hold',
      temperature: this.temperature,
      setpoint: this.temperatureSetpoint,
      timestamp: new Date(),
      unit: 'celsius'
    };
  }

  // ============================================================================
  // Utility Functions
  // ============================================================================

  private generateVIN(): string {
    const chars = 'ABCDEFGHJKLMNPRSTUVWXYZ0123456789';
    let vin = '';
    for (let i = 0; i < 17; i++) {
      vin += chars[Math.floor(Math.random() * chars.length)];
    }
    return vin;
  }

  private generateLicensePlate(): string {
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const numbers = '0123456789';
    let plate = '';

    // Format: ABC1234
    for (let i = 0; i < 3; i++) {
      plate += letters[Math.floor(Math.random() * letters.length)];
    }
    for (let i = 0; i < 4; i++) {
      plate += numbers[Math.floor(Math.random() * numbers.length)];
    }

    return plate;
  }
}
