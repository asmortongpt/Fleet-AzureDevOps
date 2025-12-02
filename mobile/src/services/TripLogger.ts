/**
 * Automated Trip Logger Service with OBD2 Integration
 *
 * Features:
 * - Auto-detect trip start (engine on, movement detected)
 * - Auto-detect trip end (engine off, parked)
 * - Read start/end odometer from OBD2
 * - Capture GPS route with breadcrumbs
 * - Log metrics every 10 seconds (speed, RPM, fuel consumption)
 * - Calculate trip statistics (distance, duration, avg speed, fuel efficiency)
 * - Detect harsh events (acceleration, braking, cornering)
 * - Personal vs business classification
 */

import Geolocation from '@react-native-community/geolocation';
import BackgroundGeolocation from 'react-native-background-geolocation';
import AsyncStorage from '@react-native-async-storage/async-storage';
import OBD2Adapter from '../lib/OBD2Adapter'; // OBD2 adapter library

// =====================================================
// Types and Interfaces
// =====================================================

export interface TripLocation {
  latitude: number;
  longitude: number;
  address?: string;
  timestamp: Date;
}

export interface GPS Breadcrumb {
  timestamp: Date;
  latitude: number;
  longitude: number;
  speed_mph: number;
  heading_degrees: number;
  accuracy_meters: number;
  altitude_meters?: number;
  engine_rpm?: number;
  fuel_level_percent?: number;
  coolant_temp_f?: number;
  throttle_position_percent?: number;
}

export interface OBD2Metrics {
  timestamp: Date;
  engine_rpm: number;
  engine_load_percent: number;
  engine_coolant_temp_f: number;
  fuel_level_percent: number;
  fuel_flow_rate_gph: number;
  speed_mph: number;
  throttle_position_percent: number;
  battery_voltage: number;
  odometer_miles: number;
  mil_status: boolean; // Check Engine Light
  dtc_count: number; // Diagnostic Trouble Codes
}

export interface TripEvent {
  type: 'harsh_acceleration' | 'harsh_braking' | 'harsh_cornering' | 'speeding' | 'idling_excessive' | 'low_fuel' | 'engine_warning';
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: Date;
  latitude?: number;
  longitude?: number;
  address?: string;
  speed_mph?: number;
  g_force?: number;
  description: string;
  metadata?: any;
}

export interface Trip {
  id: string;
  status: 'in_progress' | 'completed' | 'cancelled';
  vehicle_id?: number;
  driver_id?: number;

  // Times
  start_time: Date;
  end_time?: Date;
  duration_seconds?: number;

  // Locations
  start_location: TripLocation;
  end_location?: TripLocation;

  // Distance
  start_odometer_miles?: number;
  end_odometer_miles?: number;
  distance_miles?: number;

  // Statistics
  avg_speed_mph?: number;
  max_speed_mph?: number;
  idle_time_seconds?: number;

  // Fuel
  fuel_consumed_gallons?: number;
  fuel_efficiency_mpg?: number;

  // Driver Score
  driver_score?: number;
  harsh_acceleration_count: number;
  harsh_braking_count: number;
  harsh_cornering_count: number;
  speeding_count: number;

  // Classification
  usage_type?: 'business' | 'personal' | 'mixed';
  business_purpose?: string;

  // Data
  breadcrumbs: GPSBreadcrumb[];
  events: TripEvent[];
  metrics: OBD2Metrics[];
}

// =====================================================
// Trip Detection Thresholds
// =====================================================

const THRESHOLDS = {
  // Trip start detection
  MIN_SPEED_FOR_MOVEMENT: 3, // mph - consider vehicle moving
  MIN_MOVEMENT_DURATION: 10, // seconds - sustained movement to start trip
  ENGINE_RPM_THRESHOLD: 500, // RPM - engine is running

  // Trip end detection
  MAX_SPEED_FOR_STOPPED: 1, // mph - vehicle is stopped
  STOP_DURATION_FOR_TRIP_END: 300, // seconds (5 min) - parked duration to end trip
  ENGINE_OFF_TRIP_END: 60, // seconds - end trip after engine off

  // Harsh event detection
  HARSH_ACCELERATION_G: 0.35, // g-force threshold
  HARSH_BRAKING_G: -0.40, // g-force threshold (negative)
  HARSH_CORNERING_G: 0.50, // g-force threshold
  SPEEDING_THRESHOLD: 10, // mph over speed limit

  // Data collection
  GPS_UPDATE_INTERVAL: 5000, // ms - update GPS every 5 seconds
  OBD2_UPDATE_INTERVAL: 10000, // ms - read OBD2 every 10 seconds
  BREADCRUMB_INTERVAL: 15000, // ms - save breadcrumb every 15 seconds

  // Fuel tracking
  LOW_FUEL_THRESHOLD: 15, // % - alert on low fuel
  EXCESSIVE_IDLE_TIME: 300, // seconds (5 min) - excessive idling
};

// =====================================================
// Trip Logger Service
// =====================================================

class TripLoggerService {
  private currentTrip: Trip | null = null;
  private obd2Adapter: OBD2Adapter | null = null;
  private locationWatchId: number | null = null;
  private obd2Interval: NodeJS.Timeout | null = null;
  private metricsInterval: NodeJS.Timeout | null = null;

  // State tracking
  private lastLocation: TripLocation | null = null;
  private lastSpeed: number = 0;
  private lastAcceleration: { x: number; y: number; z: number; timestamp: Date } | null = null;
  private stoppedStartTime: Date | null = null;
  private movementStartTime: Date | null = null;
  private idleStartTime: Date | null = null;

  // API configuration
  private apiBaseUrl: string = '';
  private authToken: string = '';

  constructor() {
    this.initializeService();
  }

  // =====================================================
  // Initialization
  // =====================================================

  private async initializeService(): Promise<void> {
    try {
      // Load configuration
      const config = await AsyncStorage.getItem('tripLoggerConfig');
      if (config) {
        const { apiBaseUrl, authToken } = JSON.parse(config);
        this.apiBaseUrl = apiBaseUrl;
        this.authToken = authToken;
      }

      // Check for active trip
      const activeTrip = await AsyncStorage.getItem('activeTrip');
      if (activeTrip) {
        this.currentTrip = JSON.parse(activeTrip);
        await this.resumeTrip();
      }

      console.log('TripLogger initialized');
    } catch (error) {
      console.error('Failed to initialize TripLogger:', error);
    }
  }

  public async configure(apiBaseUrl: string, authToken: string): Promise<void> {
    this.apiBaseUrl = apiBaseUrl;
    this.authToken = authToken;

    await AsyncStorage.setItem('tripLoggerConfig', JSON.stringify({
      apiBaseUrl,
      authToken
    }));
  }

  // =====================================================
  // OBD2 Connection
  // =====================================================

  public async connectOBD2(deviceId?: string): Promise<boolean> {
    try {
      this.obd2Adapter = new OBD2Adapter();
      const connected = await this.obd2Adapter.connect(deviceId);

      if (connected) {
        console.log('OBD2 adapter connected');
        await this.startMonitoring();
      }

      return connected;
    } catch (error) {
      console.error('Failed to connect OBD2:', error);
      return false;
    }
  }

  public async disconnectOBD2(): Promise<void> {
    if (this.obd2Adapter) {
      await this.obd2Adapter.disconnect();
      this.obd2Adapter = null;
    }
  }

  // =====================================================
  // Trip Detection & Monitoring
  // =====================================================

  private async startMonitoring(): Promise<void> {
    // Monitor OBD2 data for trip detection
    this.obd2Interval = setInterval(async () => {
      await this.checkTripStatus();
    }, THRESHOLDS.OBD2_UPDATE_INTERVAL);

    // Monitor GPS location
    await this.startLocationTracking();

    console.log('Trip monitoring started');
  }

  private async stopMonitoring(): Promise<void> {
    if (this.obd2Interval) {
      clearInterval(this.obd2Interval);
      this.obd2Interval = null;
    }

    if (this.metricsInterval) {
      clearInterval(this.metricsInterval);
      this.metricsInterval = null;
    }

    await this.stopLocationTracking();

    console.log('Trip monitoring stopped');
  }

  private async checkTripStatus(): Promise<void> {
    if (!this.obd2Adapter) return;

    try {
      // Read engine status
      const engineRPM = await this.obd2Adapter.getEngineRPM();
      const speed = await this.obd2Adapter.getSpeed();
      const engineRunning = engineRPM > THRESHOLDS.ENGINE_RPM_THRESHOLD;

      // Check for trip start
      if (!this.currentTrip && engineRunning) {
        await this.detectTripStart(speed);
      }

      // Check for trip end
      if (this.currentTrip) {
        await this.detectTripEnd(engineRunning, speed);
        await this.collectTripData();
        await this.detectDrivingEvents();
      }
    } catch (error) {
      console.error('Error checking trip status:', error);
    }
  }

  private async detectTripStart(currentSpeed: number): Promise<void> {
    const isMoving = currentSpeed >= THRESHOLDS.MIN_SPEED_FOR_MOVEMENT;

    if (isMoving) {
      if (!this.movementStartTime) {
        this.movementStartTime = new Date();
      }

      const movementDuration = (new Date().getTime() - this.movementStartTime.getTime()) / 1000;

      // Start trip if moving for sustained duration
      if (movementDuration >= THRESHOLDS.MIN_MOVEMENT_DURATION) {
        await this.startTrip();
      }
    } else {
      this.movementStartTime = null;
    }
  }

  private async detectTripEnd(engineRunning: boolean, currentSpeed: number): Promise<void> {
    if (!this.currentTrip) return;

    const isStopped = currentSpeed <= THRESHOLDS.MAX_SPEED_FOR_STOPPED;

    // End trip if engine off
    if (!engineRunning) {
      const engineOffDuration = this.stoppedStartTime
        ? (new Date().getTime() - this.stoppedStartTime.getTime()) / 1000
        : 0;

      if (engineOffDuration >= THRESHOLDS.ENGINE_OFF_TRIP_END) {
        await this.endTrip();
        return;
      }

      if (!this.stoppedStartTime) {
        this.stoppedStartTime = new Date();
      }
    } else {
      this.stoppedStartTime = null;
    }

    // End trip if stopped for extended duration
    if (isStopped) {
      if (!this.stoppedStartTime) {
        this.stoppedStartTime = new Date();
      }

      const stopDuration = (new Date().getTime() - this.stoppedStartTime.getTime()) / 1000;

      if (stopDuration >= THRESHOLDS.STOP_DURATION_FOR_TRIP_END) {
        await this.endTrip();
      }
    } else {
      this.stoppedStartTime = null;
    }
  }

  // =====================================================
  // Trip Lifecycle
  // =====================================================

  public async startTrip(vehicleId?: number, driverId?: number): Promise<Trip> {
    if (this.currentTrip) {
      throw new Error('Trip already in progress');
    }

    try {
      // Get current location
      const location = await this.getCurrentLocation();

      // Read OBD2 start values
      let startOdometer: number | undefined;
      if (this.obd2Adapter) {
        startOdometer = await this.obd2Adapter.getOdometer();
      }

      // Create trip
      this.currentTrip = {
        id: this.generateTripId(),
        status: 'in_progress',
        vehicle_id: vehicleId,
        driver_id: driverId,
        start_time: new Date(),
        start_location: location,
        start_odometer_miles: startOdometer,
        harsh_acceleration_count: 0,
        harsh_braking_count: 0,
        harsh_cornering_count: 0,
        speeding_count: 0,
        breadcrumbs: [],
        events: [],
        metrics: []
      };

      // Save to local storage
      await AsyncStorage.setItem('activeTrip', JSON.stringify(this.currentTrip));

      // Start data collection
      await this.startDataCollection();

      // Notify server
      await this.syncTripToServer('start');

      console.log('Trip started:', this.currentTrip.id);

      return this.currentTrip;
    } catch (error) {
      console.error('Failed to start trip:', error);
      throw error;
    }
  }

  public async endTrip(): Promise<Trip> {
    if (!this.currentTrip) {
      throw new Error('No trip in progress');
    }

    try {
      // Get end location
      const location = await this.getCurrentLocation();

      // Read OBD2 end values
      let endOdometer: number | undefined;
      if (this.obd2Adapter) {
        endOdometer = await this.obd2Adapter.getOdometer();
      }

      // Update trip
      this.currentTrip.end_time = new Date();
      this.currentTrip.end_location = location;
      this.currentTrip.end_odometer_miles = endOdometer;
      this.currentTrip.status = 'completed';

      // Calculate statistics
      await this.calculateTripStatistics();

      // Stop data collection
      await this.stopDataCollection();

      // Sync to server
      await this.syncTripToServer('end');

      // Clear active trip
      const completedTrip = { ...this.currentTrip };
      this.currentTrip = null;
      await AsyncStorage.removeItem('activeTrip');

      console.log('Trip ended:', completedTrip.id);

      return completedTrip;
    } catch (error) {
      console.error('Failed to end trip:', error);
      throw error;
    }
  }

  private async resumeTrip(): Promise<void> {
    if (!this.currentTrip) return;

    console.log('Resuming trip:', this.currentTrip.id);
    await this.startDataCollection();
  }

  public async cancelTrip(): Promise<void> {
    if (!this.currentTrip) return;

    this.currentTrip.status = 'cancelled';
    await this.stopDataCollection();
    await this.syncTripToServer('cancel');

    this.currentTrip = null;
    await AsyncStorage.removeItem('activeTrip');

    console.log('Trip cancelled');
  }

  // =====================================================
  // Data Collection
  // =====================================================

  private async startDataCollection(): Promise<void> {
    // Start background location tracking
    await BackgroundGeolocation.start();

    // Start metrics collection
    this.metricsInterval = setInterval(async () => {
      await this.collectOBD2Metrics();
      await this.collectGPSBreadcrumb();
    }, THRESHOLDS.OBD2_UPDATE_INTERVAL);
  }

  private async stopDataCollection(): Promise<void> {
    await BackgroundGeolocation.stop();

    if (this.metricsInterval) {
      clearInterval(this.metricsInterval);
      this.metricsInterval = null;
    }
  }

  private async collectOBD2Metrics(): Promise<void> {
    if (!this.currentTrip || !this.obd2Adapter) return;

    try {
      const metrics: OBD2Metrics = {
        timestamp: new Date(),
        engine_rpm: await this.obd2Adapter.getEngineRPM(),
        engine_load_percent: await this.obd2Adapter.getEngineLoad(),
        engine_coolant_temp_f: await this.obd2Adapter.getCoolantTemp(),
        fuel_level_percent: await this.obd2Adapter.getFuelLevel(),
        fuel_flow_rate_gph: await this.obd2Adapter.getFuelFlowRate(),
        speed_mph: await this.obd2Adapter.getSpeed(),
        throttle_position_percent: await this.obd2Adapter.getThrottlePosition(),
        battery_voltage: await this.obd2Adapter.getBatteryVoltage(),
        odometer_miles: await this.obd2Adapter.getOdometer(),
        mil_status: await this.obd2Adapter.getMILStatus(),
        dtc_count: await this.obd2Adapter.getDTCCount()
      };

      this.currentTrip.metrics.push(metrics);

      // Check for alerts
      await this.checkForAlerts(metrics);

      // Sync metrics to server periodically
      if (this.currentTrip.metrics.length % 10 === 0) {
        await this.syncMetricsToServer();
      }
    } catch (error) {
      console.error('Error collecting OBD2 metrics:', error);
    }
  }

  private async collectGPSBreadcrumb(): Promise<void> {
    if (!this.currentTrip) return;

    try {
      const location = await this.getCurrentLocation();

      // Get OBD2 data for breadcrumb
      let obd2Data: Partial<GPSBreadcrumb> = {};
      if (this.obd2Adapter) {
        obd2Data = {
          engine_rpm: await this.obd2Adapter.getEngineRPM(),
          fuel_level_percent: await this.obd2Adapter.getFuelLevel(),
          coolant_temp_f: await this.obd2Adapter.getCoolantTemp(),
          throttle_position_percent: await this.obd2Adapter.getThrottlePosition()
        };
      }

      const breadcrumb: GPSBreadcrumb = {
        timestamp: location.timestamp,
        latitude: location.latitude,
        longitude: location.longitude,
        speed_mph: this.lastSpeed || 0,
        heading_degrees: 0, // TODO: Calculate from location history
        accuracy_meters: 0,
        ...obd2Data
      };

      this.currentTrip.breadcrumbs.push(breadcrumb);
      this.lastLocation = location;
    } catch (error) {
      console.error('Error collecting GPS breadcrumb:', error);
    }
  }

  // =====================================================
  // Event Detection
  // =====================================================

  private async detectDrivingEvents(): Promise<void> {
    if (!this.currentTrip || !this.obd2Adapter) return;

    try {
      const speed = await this.obd2Adapter.getSpeed();
      const acceleration = await this.getAcceleration();

      // Detect harsh acceleration
      if (acceleration.x > THRESHOLDS.HARSH_ACCELERATION_G) {
        await this.recordEvent({
          type: 'harsh_acceleration',
          severity: this.calculateEventSeverity(acceleration.x, THRESHOLDS.HARSH_ACCELERATION_G),
          timestamp: new Date(),
          speed_mph: speed,
          g_force: acceleration.x,
          description: `Harsh acceleration detected: ${acceleration.x.toFixed(2)}g`
        });
        this.currentTrip.harsh_acceleration_count++;
      }

      // Detect harsh braking
      if (acceleration.x < THRESHOLDS.HARSH_BRAKING_G) {
        await this.recordEvent({
          type: 'harsh_braking',
          severity: this.calculateEventSeverity(Math.abs(acceleration.x), Math.abs(THRESHOLDS.HARSH_BRAKING_G)),
          timestamp: new Date(),
          speed_mph: speed,
          g_force: acceleration.x,
          description: `Harsh braking detected: ${acceleration.x.toFixed(2)}g`
        });
        this.currentTrip.harsh_braking_count++;
      }

      // Detect harsh cornering
      const lateralG = Math.sqrt(acceleration.y ** 2 + acceleration.z ** 2);
      if (lateralG > THRESHOLDS.HARSH_CORNERING_G) {
        await this.recordEvent({
          type: 'harsh_cornering',
          severity: this.calculateEventSeverity(lateralG, THRESHOLDS.HARSH_CORNERING_G),
          timestamp: new Date(),
          speed_mph: speed,
          g_force: lateralG,
          description: `Harsh cornering detected: ${lateralG.toFixed(2)}g`
        });
        this.currentTrip.harsh_cornering_count++;
      }

      // Detect speeding (requires speed limit data - TODO: integrate with maps API)
      // const speedLimit = await this.getSpeedLimit();
      // if (speed > speedLimit + THRESHOLDS.SPEEDING_THRESHOLD) {
      //   this.recordEvent({ ... });
      // }

      this.lastSpeed = speed;
      this.lastAcceleration = { ...acceleration, timestamp: new Date() };
    } catch (error) {
      console.error('Error detecting driving events:', error);
    }
  }

  private async recordEvent(event: TripEvent): Promise<void> {
    if (!this.currentTrip) return;

    // Add location to event
    if (this.lastLocation) {
      event.latitude = this.lastLocation.latitude;
      event.longitude = this.lastLocation.longitude;
    }

    this.currentTrip.events.push(event);

    // Update active trip storage
    await AsyncStorage.setItem('activeTrip', JSON.stringify(this.currentTrip));

    console.log('Event recorded:', event.type, event.severity);
  }

  private calculateEventSeverity(value: number, threshold: number): 'low' | 'medium' | 'high' | 'critical' {
    const ratio = value / threshold;

    if (ratio >= 2.0) return 'critical';
    if (ratio >= 1.5) return 'high';
    if (ratio >= 1.2) return 'medium';
    return 'low';
  }

  private async checkForAlerts(metrics: OBD2Metrics): Promise<void> {
    if (!this.currentTrip) return;

    // Low fuel alert
    if (metrics.fuel_level_percent < THRESHOLDS.LOW_FUEL_THRESHOLD) {
      await this.recordEvent({
        type: 'low_fuel',
        severity: 'medium',
        timestamp: new Date(),
        description: `Low fuel: ${metrics.fuel_level_percent.toFixed(1)}%`
      });
    }

    // Engine warning (Check Engine Light)
    if (metrics.mil_status) {
      await this.recordEvent({
        type: 'engine_warning',
        severity: 'high',
        timestamp: new Date(),
        description: `Check engine light on. ${metrics.dtc_count} diagnostic codes detected.`
      });
    }

    // Excessive idling
    if (metrics.engine_rpm > THRESHOLDS.ENGINE_RPM_THRESHOLD && metrics.speed_mph < 1) {
      if (!this.idleStartTime) {
        this.idleStartTime = new Date();
      }

      const idleDuration = (new Date().getTime() - this.idleStartTime.getTime()) / 1000;

      if (idleDuration >= THRESHOLDS.EXCESSIVE_IDLE_TIME) {
        await this.recordEvent({
          type: 'idling_excessive',
          severity: 'low',
          timestamp: new Date(),
          description: `Excessive idling: ${(idleDuration / 60).toFixed(1)} minutes`
        });

        // Update idle time in trip
        this.currentTrip.idle_time_seconds = (this.currentTrip.idle_time_seconds || 0) + idleDuration;
      }
    } else {
      this.idleStartTime = null;
    }
  }

  // =====================================================
  // Statistics Calculation
  // =====================================================

  private async calculateTripStatistics(): Promise<void> {
    if (!this.currentTrip) return;

    const trip = this.currentTrip;

    // Calculate duration
    if (trip.end_time) {
      trip.duration_seconds = Math.floor((trip.end_time.getTime() - trip.start_time.getTime()) / 1000);
    }

    // Calculate distance
    if (trip.start_odometer_miles && trip.end_odometer_miles) {
      trip.distance_miles = trip.end_odometer_miles - trip.start_odometer_miles;
    }

    // Calculate speed statistics from breadcrumbs
    if (trip.breadcrumbs.length > 0) {
      const speeds = trip.breadcrumbs.map(b => b.speed_mph).filter(s => s > 0);
      trip.avg_speed_mph = speeds.reduce((a, b) => a + b, 0) / speeds.length;
      trip.max_speed_mph = Math.max(...speeds);
    }

    // Calculate fuel consumption
    if (trip.metrics.length > 1) {
      const fuelLevels = trip.metrics.map(m => m.fuel_level_percent);
      const fuelDrop = fuelLevels[0] - fuelLevels[fuelLevels.length - 1];

      // Estimate tank capacity (TODO: get from vehicle config)
      const tankCapacity = 15; // gallons
      trip.fuel_consumed_gallons = (fuelDrop / 100) * tankCapacity;

      // Calculate MPG
      if (trip.distance_miles && trip.fuel_consumed_gallons > 0) {
        trip.fuel_efficiency_mpg = trip.distance_miles / trip.fuel_consumed_gallons;
      }
    }

    // Calculate driver score
    trip.driver_score = this.calculateDriverScore();

    console.log('Trip statistics calculated');
  }

  private calculateDriverScore(): number {
    if (!this.currentTrip) return 100;

    const trip = this.currentTrip;
    let score = 100;

    // Deduct points for harsh events (normalized by distance)
    const distance = trip.distance_miles || 1;
    const eventsPerMile = (
      trip.harsh_acceleration_count +
      trip.harsh_braking_count +
      trip.harsh_cornering_count +
      trip.speeding_count
    ) / distance;

    score -= Math.min(50, eventsPerMile * 100);

    // Deduct points for excessive speeding events
    score -= trip.speeding_count * 5;

    // Ensure score is between 0 and 100
    return Math.max(0, Math.min(100, Math.round(score)));
  }

  // =====================================================
  // Classification
  // =====================================================

  public async classifyTrip(usageType: 'business' | 'personal' | 'mixed', businessPurpose?: string): Promise<void> {
    if (!this.currentTrip) {
      throw new Error('No trip in progress');
    }

    this.currentTrip.usage_type = usageType;
    if (businessPurpose) {
      this.currentTrip.business_purpose = businessPurpose;
    }

    await AsyncStorage.setItem('activeTrip', JSON.stringify(this.currentTrip));

    // Sync classification to server
    await this.syncTripToServer('classify');

    console.log('Trip classified as:', usageType);
  }

  // =====================================================
  // Server Synchronization
  // =====================================================

  private async syncTripToServer(action: 'start' | 'end' | 'classify' | 'cancel'): Promise<void> {
    if (!this.currentTrip || !this.apiBaseUrl) return;

    try {
      let url: string;
      let method: string;
      let body: any;

      switch (action) {
        case 'start':
          url = `${this.apiBaseUrl}/api/mobile/trips/start`;
          method = 'POST';
          body = {
            vehicle_id: this.currentTrip.vehicle_id,
            driver_id: this.currentTrip.driver_id,
            start_time: this.currentTrip.start_time.toISOString(),
            start_location: this.currentTrip.start_location,
            start_odometer_miles: this.currentTrip.start_odometer_miles
          };
          break;

        case 'end':
          url = `${this.apiBaseUrl}/api/mobile/trips/${this.currentTrip.id}/end`;
          method = 'POST';
          body = {
            end_time: this.currentTrip.end_time?.toISOString(),
            end_location: this.currentTrip.end_location,
            end_odometer_miles: this.currentTrip.end_odometer_miles,
            duration_seconds: this.currentTrip.duration_seconds,
            distance_miles: this.currentTrip.distance_miles,
            avg_speed_mph: this.currentTrip.avg_speed_mph,
            max_speed_mph: this.currentTrip.max_speed_mph,
            idle_time_seconds: this.currentTrip.idle_time_seconds,
            fuel_consumed_gallons: this.currentTrip.fuel_consumed_gallons,
            fuel_efficiency_mpg: this.currentTrip.fuel_efficiency_mpg,
            driver_score: this.currentTrip.driver_score,
            harsh_acceleration_count: this.currentTrip.harsh_acceleration_count,
            harsh_braking_count: this.currentTrip.harsh_braking_count,
            harsh_cornering_count: this.currentTrip.harsh_cornering_count,
            speeding_count: this.currentTrip.speeding_count
          };
          break;

        case 'classify':
          url = `${this.apiBaseUrl}/api/mobile/trips/${this.currentTrip.id}/classify`;
          method = 'PATCH';
          body = {
            usage_type: this.currentTrip.usage_type,
            business_purpose: this.currentTrip.business_purpose
          };
          break;

        case 'cancel':
          url = `${this.apiBaseUrl}/api/mobile/trips/${this.currentTrip.id}/end`;
          method = 'POST';
          body = {
            status: 'cancelled'
          };
          break;

        default:
          return;
      }

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.authToken}`
        },
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        throw new Error(`Server sync failed: ${response.statusText}`);
      }

      const result = await response.json();

      // Update trip ID from server if starting
      if (action === 'start' && result.trip_id) {
        this.currentTrip.id = result.trip_id;
        await AsyncStorage.setItem('activeTrip', JSON.stringify(this.currentTrip));
      }

      console.log('Trip synced to server:', action);
    } catch (error) {
      console.error('Failed to sync trip to server:', error);
      // TODO: Queue for retry
    }
  }

  private async syncMetricsToServer(): Promise<void> {
    if (!this.currentTrip || !this.apiBaseUrl) return;

    try {
      // Get unsyncedmetrics (last 10)
      const metrics = this.currentTrip.metrics.slice(-10);
      const events = this.currentTrip.events.filter(e => !e.metadata?.synced);

      if (metrics.length === 0 && events.length === 0) return;

      const response = await fetch(`${this.apiBaseUrl}/api/mobile/trips/${this.currentTrip.id}/metrics`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.authToken}`
        },
        body: JSON.stringify({
          metrics,
          events,
          breadcrumbs: this.currentTrip.breadcrumbs.slice(-5) // Last 5 breadcrumbs
        })
      });

      if (response.ok) {
        // Mark events as synced
        events.forEach(e => {
          if (!e.metadata) e.metadata = {};
          e.metadata.synced = true;
        });

        console.log('Metrics synced to server');
      }
    } catch (error) {
      console.error('Failed to sync metrics:', error);
    }
  }

  // =====================================================
  // Utility Methods
  // =====================================================

  private async getCurrentLocation(): Promise<TripLocation> {
    return new Promise((resolve, reject) => {
      Geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            timestamp: new Date(position.timestamp)
          });
        },
        (error) => reject(error),
        { enableHighAccuracy: true, timeout: 20000, maximumAge: 1000 }
      );
    });
  }

  private async startLocationTracking(): Promise<void> {
    await BackgroundGeolocation.ready({
      desiredAccuracy: BackgroundGeolocation.DESIRED_ACCURACY_HIGH,
      distanceFilter: 10, // meters
      stopTimeout: 5, // minutes
      debug: false,
      logLevel: BackgroundGeolocation.LOG_LEVEL_VERBOSE,
      stopOnTerminate: false,
      startOnBoot: true,
      locationUpdateInterval: THRESHOLDS.GPS_UPDATE_INTERVAL,
      fastestLocationUpdateInterval: THRESHOLDS.GPS_UPDATE_INTERVAL / 2
    });
  }

  private async stopLocationTracking(): Promise<void> {
    await BackgroundGeolocation.stop();

    if (this.locationWatchId !== null) {
      Geolocation.clearWatch(this.locationWatchId);
      this.locationWatchId = null;
    }
  }

  private async getAcceleration(): Promise<{ x: number; y: number; z: number }> {
    // TODO: Implement accelerometer integration
    // For now, calculate from speed change
    const currentSpeed = this.lastSpeed || 0;
    const previousSpeed = this.lastAcceleration ? this.lastSpeed : 0;
    const timeDelta = this.lastAcceleration
      ? (new Date().getTime() - this.lastAcceleration.timestamp.getTime()) / 1000
      : 1;

    const acceleration = (currentSpeed - previousSpeed) / timeDelta / 32.2; // Convert to g-force

    return { x: acceleration, y: 0, z: 0 };
  }

  private generateTripId(): string {
    return `trip_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // =====================================================
  // Public Getters
  // =====================================================

  public getCurrentTrip(): Trip | null {
    return this.currentTrip;
  }

  public isOBD2Connected(): boolean {
    return this.obd2Adapter !== null && this.obd2Adapter.isConnected();
  }

  public getTripStatus(): 'idle' | 'in_progress' | 'completed' {
    if (!this.currentTrip) return 'idle';
    return this.currentTrip.status === 'in_progress' ? 'in_progress' : 'completed';
  }
}

// Export singleton instance
export default new TripLoggerService();
