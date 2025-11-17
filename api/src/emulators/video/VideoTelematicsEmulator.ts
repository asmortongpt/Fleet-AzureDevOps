/**
 * Video Telematics Emulator
 * Simulates dashcam and vehicle camera events including:
 * - Harsh braking events
 * - Collision detection
 * - Lane departure warnings
 * - Speeding incidents
 * - Distracted driving alerts
 * - Following distance violations
 *
 * This emulator generates EVENT METADATA only (not actual video files)
 * It correlates with DriverBehaviorEmulator and GPSEmulator for realistic scenarios
 */

import { EventEmitter } from 'events';

export interface VideoEvent {
  id: string;
  vehicleId: string;
  driverId?: string;
  timestamp: Date;
  eventType:
    | 'harsh_braking'
    | 'harsh_acceleration'
    | 'harsh_cornering'
    | 'collision'
    | 'near_miss'
    | 'lane_departure'
    | 'speeding'
    | 'distracted_driving'
    | 'following_distance'
    | 'stop_sign_violation'
    | 'red_light_violation'
    | 'drowsiness_detected';
  severity: 'low' | 'medium' | 'high' | 'critical';
  location: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  speed: number; // mph
  speedLimit?: number;
  gForce?: number; // For acceleration/braking events
  metadata: {
    duration: number; // seconds
    cameraViews: ('forward' | 'driver' | 'rear' | 'side')[];
    videoStartOffset: number; // seconds before event
    videoEndOffset: number; // seconds after event
    confidence: number; // 0-100
    aiAnalysis?: {
      objectsDetected?: string[];
      scenarioClassification?: string;
      riskScore?: number;
    };
  };
  status: 'pending_review' | 'reviewed' | 'cleared' | 'violation_confirmed';
  reviewedBy?: string;
  reviewedAt?: Date;
  notes?: string;
}

interface VideoTelematicsConfig {
  updateIntervalMs: number;
  eventProbability: number; // Base probability per vehicle per interval
  severityDistribution: {
    low: number;
    medium: number;
    high: number;
    critical: number;
  };
  enableAIAnalysis: boolean;
  cameraViews: ('forward' | 'driver' | 'rear' | 'side')[];
}

interface Vehicle {
  id: string;
  currentSpeed: number;
  speedLimit?: number;
  location?: {
    latitude: number;
    longitude: number;
  };
  driverId?: string;
}

export class VideoTelematicsEmulator extends EventEmitter {
  private config: VideoTelematicsConfig;
  private vehicles: Map<string, Vehicle>;
  private activeEvents: Map<string, VideoEvent>;
  private isRunning: boolean = false;
  private intervalId?: NodeJS.Timeout;
  private eventCounter: number = 0;

  constructor(config: VideoTelematicsConfig) {
    super();
    this.config = config;
    this.vehicles = new Map();
    this.activeEvents = new Map();
  }

  /**
   * Register a vehicle for video telematics monitoring
   */
  registerVehicle(vehicle: Vehicle): void {
    this.vehicles.set(vehicle.id, vehicle);
    this.emit('vehicle-registered', { vehicleId: vehicle.id });
  }

  /**
   * Update vehicle state (called by GPS/OBD2 emulators)
   */
  updateVehicleState(vehicleId: string, updates: Partial<Vehicle>): void {
    const vehicle = this.vehicles.get(vehicleId);
    if (vehicle) {
      Object.assign(vehicle, updates);
    }
  }

  /**
   * Start the emulator
   */
  start(): void {
    if (this.isRunning) return;

    this.isRunning = true;
    this.emit('started', { timestamp: new Date() });

    // Main update loop
    this.intervalId = setInterval(() => {
      this.update();
    }, this.config.updateIntervalMs);
  }

  /**
   * Stop the emulator
   */
  stop(): void {
    if (!this.isRunning) return;

    this.isRunning = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }

    this.emit('stopped', { timestamp: new Date() });
  }

  /**
   * Main update function
   */
  private update(): void {
    this.vehicles.forEach((vehicle, vehicleId) => {
      // Random chance of event occurring
      if (Math.random() < this.config.eventProbability) {
        this.generateEvent(vehicleId);
      }
    });

    // Emit status update
    this.emit('update', {
      activeVehicles: this.vehicles.size,
      totalEvents: this.activeEvents.size,
      timestamp: new Date()
    });
  }

  /**
   * Generate a video event for a vehicle
   */
  private generateEvent(vehicleId: string): void {
    const vehicle = this.vehicles.get(vehicleId);
    if (!vehicle) return;

    // Determine event type based on vehicle state
    const eventType = this.selectEventType(vehicle);
    if (!eventType) return;

    // Determine severity
    const severity = this.selectSeverity();

    // Generate event ID
    this.eventCounter++;
    const eventId = `video-${Date.now()}-${vehicleId}-${this.eventCounter}`;

    // Calculate g-force for acceleration events
    const gForce = this.calculateGForce(eventType, severity);

    // Select camera views based on event type
    const cameraViews = this.selectCameraViews(eventType);

    // Generate AI analysis if enabled
    const aiAnalysis = this.config.enableAIAnalysis
      ? this.generateAIAnalysis(eventType, severity, vehicle)
      : undefined;

    const event: VideoEvent = {
      id: eventId,
      vehicleId,
      driverId: vehicle.driverId,
      timestamp: new Date(),
      eventType,
      severity,
      location: vehicle.location || {
        latitude: 28.5383 + (Math.random() - 0.5) * 0.5,
        longitude: -81.3792 + (Math.random() - 0.5) * 0.5
      },
      speed: vehicle.currentSpeed,
      speedLimit: vehicle.speedLimit,
      gForce,
      metadata: {
        duration: this.calculateDuration(eventType, severity),
        cameraViews,
        videoStartOffset: eventType === 'collision' ? 30 : 10,
        videoEndOffset: eventType === 'collision' ? 30 : 10,
        confidence: 75 + Math.random() * 25, // 75-100%
        aiAnalysis
      },
      status: severity === 'critical' ? 'pending_review' : 'pending_review'
    };

    this.activeEvents.set(eventId, event);

    this.emit('video-event-detected', {
      event,
      vehicle,
      timestamp: new Date()
    });

    // Auto-clear low severity events after some time
    if (severity === 'low') {
      setTimeout(() => {
        this.clearEvent(eventId, 'auto_cleared');
      }, 60000); // 1 minute
    }
  }

  /**
   * Select event type based on vehicle state
   */
  private selectEventType(vehicle: Vehicle): VideoEvent['eventType'] | null {
    const rand = Math.random();

    // Speeding if vehicle is over limit
    if (vehicle.speedLimit && vehicle.currentSpeed > vehicle.speedLimit * 1.1) {
      if (rand < 0.3) return 'speeding';
    }

    // High speed increases chance of certain events
    if (vehicle.currentSpeed > 70) {
      if (rand < 0.05) return 'following_distance';
      if (rand < 0.1) return 'lane_departure';
    }

    // Random event selection
    const eventTypes: VideoEvent['eventType'][] = [
      'harsh_braking',
      'harsh_acceleration',
      'harsh_cornering',
      'near_miss',
      'lane_departure',
      'distracted_driving',
      'following_distance',
      'stop_sign_violation'
    ];

    // Rare critical events
    if (rand < 0.001) return 'collision';
    if (rand < 0.002) return 'red_light_violation';
    if (rand < 0.005) return 'drowsiness_detected';

    return eventTypes[Math.floor(Math.random() * eventTypes.length)];
  }

  /**
   * Select severity based on distribution
   */
  private selectSeverity(): VideoEvent['severity'] {
    const rand = Math.random();
    const { low, medium, high, critical } = this.config.severityDistribution;

    if (rand < critical) return 'critical';
    if (rand < critical + high) return 'high';
    if (rand < critical + high + medium) return 'medium';
    return 'low';
  }

  /**
   * Calculate g-force for acceleration events
   */
  private calculateGForce(
    eventType: VideoEvent['eventType'],
    severity: VideoEvent['severity']
  ): number | undefined {
    if (!['harsh_braking', 'harsh_acceleration', 'harsh_cornering', 'collision'].includes(eventType)) {
      return undefined;
    }

    const baseForce = eventType === 'collision' ? 5.0 : 0.5;
    const severityMultiplier = {
      low: 0.8,
      medium: 1.0,
      high: 1.3,
      critical: 2.0
    }[severity];

    return parseFloat((baseForce * severityMultiplier * (0.8 + Math.random() * 0.4)).toFixed(2));
  }

  /**
   * Select which camera views captured the event
   */
  private selectCameraViews(eventType: VideoEvent['eventType']): ('forward' | 'driver' | 'rear' | 'side')[] {
    const views: ('forward' | 'driver' | 'rear' | 'side')[] = [];

    switch (eventType) {
      case 'harsh_braking':
      case 'collision':
      case 'near_miss':
      case 'lane_departure':
      case 'stop_sign_violation':
      case 'red_light_violation':
        views.push('forward');
        break;

      case 'distracted_driving':
      case 'drowsiness_detected':
        views.push('driver');
        break;

      case 'harsh_acceleration':
      case 'harsh_cornering':
      case 'following_distance':
        views.push('forward', 'driver');
        break;
    }

    // Always include available camera views from config
    this.config.cameraViews.forEach(view => {
      if (!views.includes(view) && Math.random() < 0.3) {
        views.push(view);
      }
    });

    return views;
  }

  /**
   * Calculate event duration in seconds
   */
  private calculateDuration(eventType: VideoEvent['eventType'], severity: VideoEvent['severity']): number {
    let baseDuration = 5; // seconds

    if (eventType === 'collision') baseDuration = 15;
    if (eventType === 'drowsiness_detected') baseDuration = 30;
    if (eventType === 'distracted_driving') baseDuration = 10;

    const severityMultiplier = {
      low: 0.8,
      medium: 1.0,
      high: 1.2,
      critical: 1.5
    }[severity];

    return Math.floor(baseDuration * severityMultiplier);
  }

  /**
   * Generate AI analysis for the event
   */
  private generateAIAnalysis(
    eventType: VideoEvent['eventType'],
    severity: VideoEvent['severity'],
    vehicle: Vehicle
  ): VideoEvent['metadata']['aiAnalysis'] {
    const objectsDetected: string[] = ['vehicle'];

    // Add contextual objects
    if (Math.random() < 0.7) objectsDetected.push('road_markings');
    if (Math.random() < 0.5) objectsDetected.push('traffic_signs');
    if (Math.random() < 0.3) objectsDetected.push('pedestrian');
    if (Math.random() < 0.2) objectsDetected.push('cyclist');
    if (Math.random() < 0.4) objectsDetected.push('other_vehicles');

    // Scenario classification
    const scenarios = [
      'highway_driving',
      'urban_intersection',
      'residential_area',
      'parking_lot',
      'freeway_merging'
    ];
    const scenarioClassification = scenarios[Math.floor(Math.random() * scenarios.length)];

    // Risk score (0-100)
    const baseRisk = {
      low: 20,
      medium: 40,
      high: 70,
      critical: 90
    }[severity];

    const riskScore = Math.min(100, baseRisk + Math.floor(Math.random() * 20));

    return {
      objectsDetected,
      scenarioClassification,
      riskScore
    };
  }

  /**
   * Clear/resolve an event
   */
  clearEvent(eventId: string, reason: 'reviewed' | 'cleared' | 'violation_confirmed' | 'auto_cleared'): void {
    const event = this.activeEvents.get(eventId);
    if (!event) return;

    event.status = reason === 'violation_confirmed' ? 'violation_confirmed' : 'cleared';
    if (reason === 'reviewed' || reason === 'violation_confirmed') {
      event.reviewedAt = new Date();
      event.reviewedBy = 'system';
    }

    this.emit('video-event-cleared', {
      event,
      reason,
      timestamp: new Date()
    });

    // Remove from active events after a delay
    setTimeout(() => {
      this.activeEvents.delete(eventId);
    }, 5000);
  }

  /**
   * Manually trigger a specific event (for testing)
   */
  triggerEvent(
    vehicleId: string,
    eventType: VideoEvent['eventType'],
    severity: VideoEvent['severity']
  ): VideoEvent | null {
    const vehicle = this.vehicles.get(vehicleId);
    if (!vehicle) return null;

    this.eventCounter++;
    const eventId = `video-manual-${Date.now()}-${vehicleId}-${this.eventCounter}`;

    const event: VideoEvent = {
      id: eventId,
      vehicleId,
      driverId: vehicle.driverId,
      timestamp: new Date(),
      eventType,
      severity,
      location: vehicle.location || {
        latitude: 28.5383,
        longitude: -81.3792
      },
      speed: vehicle.currentSpeed,
      speedLimit: vehicle.speedLimit,
      gForce: this.calculateGForce(eventType, severity),
      metadata: {
        duration: this.calculateDuration(eventType, severity),
        cameraViews: this.selectCameraViews(eventType),
        videoStartOffset: 10,
        videoEndOffset: 10,
        confidence: 100,
        aiAnalysis: this.config.enableAIAnalysis
          ? this.generateAIAnalysis(eventType, severity, vehicle)
          : undefined
      },
      status: 'pending_review'
    };

    this.activeEvents.set(eventId, event);
    this.emit('video-event-detected', { event, vehicle, timestamp: new Date() });

    return event;
  }

  /**
   * Get current status
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      monitoredVehicles: this.vehicles.size,
      activeEvents: Array.from(this.activeEvents.values()),
      eventsByType: this.getEventsByType(),
      eventsBySeverity: this.getEventsBySeverity()
    };
  }

  /**
   * Get events grouped by type
   */
  private getEventsByType() {
    const byType: Record<string, number> = {};
    this.activeEvents.forEach(event => {
      byType[event.eventType] = (byType[event.eventType] || 0) + 1;
    });
    return byType;
  }

  /**
   * Get events grouped by severity
   */
  private getEventsBySeverity() {
    const bySeverity: Record<string, number> = {};
    this.activeEvents.forEach(event => {
      bySeverity[event.severity] = (bySeverity[event.severity] || 0) + 1;
    });
    return bySeverity;
  }

  /**
   * Get events for a specific vehicle
   */
  getVehicleEvents(vehicleId: string): VideoEvent[] {
    return Array.from(this.activeEvents.values()).filter(
      event => event.vehicleId === vehicleId
    );
  }
}
