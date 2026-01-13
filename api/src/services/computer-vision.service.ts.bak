import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';

/**
 * Computer Vision Analysis Service
 * Simulates advanced AI-powered video analysis including:
 * - Object detection (vehicles, pedestrians, cyclists, animals, obstacles)
 * - Driver behavior monitoring (distraction, drowsiness, seatbelt, phone use)
 * - Lane detection and departure warnings
 * - Traffic sign recognition
 * - Collision prediction
 * - Parking assistance
 * - Blind spot detection
 * - Facial recognition and driver identification
 * - Weather and road condition detection
 */

// ============================================================================
// INTERFACES
// ============================================================================

export interface ObjectDetection {
  id: string;
  type: ObjectType;
  boundingBox: BoundingBox;
  confidence: number;
  distance: number; // meters
  velocity: number; // m/s, negative = approaching
  trackingId?: string; // For multi-frame tracking
  attributes?: {
    color?: string;
    make?: string;
    model?: string;
    licensePlate?: string;
    posture?: 'standing' | 'sitting' | 'walking' | 'running' | 'cycling';
  };
}

export type ObjectType =
  | 'vehicle'
  | 'pedestrian'
  | 'cyclist'
  | 'motorcycle'
  | 'truck'
  | 'bus'
  | 'animal'
  | 'traffic_sign'
  | 'traffic_light'
  | 'obstacle'
  | 'lane_marking';

export interface BoundingBox {
  x: number; // Top-left x (0-1 normalized)
  y: number; // Top-left y (0-1 normalized)
  width: number; // Width (0-1 normalized)
  height: number; // Height (0-1 normalized)
}

export interface DriverBehaviorAnalysis {
  timestamp: Date;
  driverId?: string;
  alerts: DriverAlert[];
  attention: {
    level: 'focused' | 'distracted' | 'drowsy' | 'severely_distracted';
    eyeGazeDirection: 'forward' | 'left' | 'right' | 'down' | 'closed';
    headPose: { yaw: number; pitch: number; roll: number };
    blinkRate: number; // blinks per minute
    yawnDetected: boolean;
  };
  compliance: {
    seatbeltOn: boolean;
    phoneInHand: boolean;
    smoking: boolean;
    eating: boolean;
    handsOnWheel: 'both' | 'one' | 'none';
  };
  emotion?: {
    primary: 'neutral' | 'happy' | 'angry' | 'stressed' | 'tired';
    confidence: number;
  };
  facialRecognition?: {
    recognized: boolean;
    driverId?: string;
    confidence: number;
  };
}

export type DriverAlert =
  | 'distracted_driving'
  | 'drowsy_driving'
  | 'no_seatbelt'
  | 'phone_use'
  | 'smoking'
  | 'eating'
  | 'eyes_closed'
  | 'looking_away'
  | 'unauthorized_driver';

export interface LaneAnalysis {
  timestamp: Date;
  lanes: DetectedLane[];
  vehiclePosition: {
    laneNumber: number;
    centerOffset: number; // meters, negative = left, positive = right
    laneWidth: number;
  };
  warnings: LaneWarning[];
}

export interface DetectedLane {
  id: string;
  side: 'left' | 'right' | 'center';
  type: 'solid' | 'dashed' | 'double' | 'yellow' | 'white';
  confidence: number;
  curvature: number; // radius in meters
  points: Array<{ x: number; y: number }>; // Polynomial fit points
}

export type LaneWarning =
  | 'lane_departure_left'
  | 'lane_departure_right'
  | 'unsafe_lane_change'
  | 'lane_marking_unclear';

export interface TrafficSignRecognition {
  timestamp: Date;
  signs: DetectedSign[];
}

export interface DetectedSign {
  id: string;
  type: SignType;
  boundingBox: BoundingBox;
  confidence: number;
  distance: number;
  value?: string; // e.g., "50" for speed limit
  compliant: boolean; // Is driver complying?
}

export type SignType =
  | 'speed_limit'
  | 'stop'
  | 'yield'
  | 'no_entry'
  | 'one_way'
  | 'do_not_enter'
  | 'school_zone'
  | 'construction'
  | 'pedestrian_crossing'
  | 'railroad_crossing'
  | 'traffic_light'
  | 'parking_sign'
  | 'turn_restriction';

export interface CollisionPrediction {
  timestamp: Date;
  riskLevel: 'none' | 'low' | 'medium' | 'high' | 'critical';
  timeToCollision?: number; // seconds
  targetObject?: ObjectDetection;
  recommendedAction: 'none' | 'brake' | 'steer_left' | 'steer_right' | 'emergency_brake';
  confidence: number;
}

export interface BlindSpotDetection {
  timestamp: Date;
  leftBlindSpot: {
    occupied: boolean;
    objects: ObjectDetection[];
    warning: boolean;
  };
  rightBlindSpot: {
    occupied: boolean;
    objects: ObjectDetection[];
    warning: boolean;
  };
}

export interface RoadConditionAnalysis {
  timestamp: Date;
  surface: {
    type: 'dry' | 'wet' | 'icy' | 'snowy' | 'muddy';
    quality: 'excellent' | 'good' | 'fair' | 'poor';
    visibility: number; // meters
  };
  weather: {
    condition: 'clear' | 'cloudy' | 'rain' | 'snow' | 'fog' | 'sleet';
    intensity: 'light' | 'moderate' | 'heavy';
  };
  lighting: {
    level: 'daylight' | 'dusk' | 'night' | 'low_light';
    headlightsRecommended: boolean;
  };
}

export interface ParkingAssist {
  timestamp: Date;
  mode: 'parallel' | 'perpendicular' | 'angle';
  spaceDetected: boolean;
  spaceWidth?: number;
  spaceLength?: number;
  guidanceInstructions?: string[];
  obstacles: ObjectDetection[];
  distanceToObstacle?: number;
}

export interface VisionAnalysisFrame {
  id: string;
  timestamp: Date;
  vehicleId: string;
  cameraPosition: string;
  objects: ObjectDetection[];
  driverBehavior?: DriverBehaviorAnalysis;
  laneAnalysis?: LaneAnalysis;
  trafficSigns?: TrafficSignRecognition;
  collisionPrediction?: CollisionPrediction;
  blindSpot?: BlindSpotDetection;
  roadCondition?: RoadConditionAnalysis;
  parkingAssist?: ParkingAssist;
  processingTimeMs: number;
}

export interface VisionServiceConfig {
  enableObjectDetection: boolean;
  enableDriverMonitoring: boolean;
  enableLaneDetection: boolean;
  enableSignRecognition: boolean;
  enableCollisionPrediction: boolean;
  enableBlindSpotDetection: boolean;
  enableRoadConditionAnalysis: boolean;
  enableParkingAssist: boolean;
  enableFacialRecognition: boolean;
  processingFps: number; // How many frames per second to analyze
  alertThresholds: {
    collisionWarningTimeSeconds: number;
    drowsinessBlinkRate: number;
    distractionTimeSeconds: number;
    laneDepartureDistance: number;
  };
}

// ============================================================================
// COMPUTER VISION SERVICE
// ============================================================================

export class ComputerVisionService extends EventEmitter {
  private config: VisionServiceConfig;
  private vehicleContexts: Map<string, VehicleVisionContext> = new Map();
  private isRunning = false;
  private processingInterval: NodeJS.Timeout | null = null;

  constructor(config?: Partial<VisionServiceConfig>) {
    super();
    this.config = {
      enableObjectDetection: true,
      enableDriverMonitoring: true,
      enableLaneDetection: true,
      enableSignRecognition: true,
      enableCollisionPrediction: true,
      enableBlindSpotDetection: true,
      enableRoadConditionAnalysis: true,
      enableParkingAssist: false,
      enableFacialRecognition: true,
      processingFps: 10,
      alertThresholds: {
        collisionWarningTimeSeconds: 2.5,
        drowsinessBlinkRate: 5, // < 5 blinks/min = drowsy
        distractionTimeSeconds: 2.0,
        laneDepartureDistance: 0.3 // meters
      },
      ...config
    };
  }

  /**
   * Register a vehicle for vision analysis
   */
  public registerVehicle(
    vehicleId: string,
    options?: {
      driverId?: string;
      cameraPositions?: string[];
    }
  ): void {
    if (!this.vehicleContexts.has(vehicleId)) {
      this.vehicleContexts.set(vehicleId, {
        vehicleId,
        driverId: options?.driverId,
        cameraPositions: options?.cameraPositions || ['forward', 'driver_facing'],
        lastFrame: null,
        trackedObjects: new Map(),
        alertHistory: [],
        statistics: {
          framesProcessed: 0,
          objectsDetected: 0,
          alertsTriggered: 0,
          averageProcessingTimeMs: 0
        }
      });
    }
  }

  /**
   * Unregister a vehicle
   */
  public unregisterVehicle(vehicleId: string): void {
    this.vehicleContexts.delete(vehicleId);
  }

  /**
   * Start processing vision analysis
   */
  public start(): void {
    if (this.isRunning) return;

    this.isRunning = true;
    const intervalMs = 1000 / this.config.processingFps;

    this.processingInterval = setInterval(() => {
      this.processAllVehicles();
    }, intervalMs);

    this.emit('started');
  }

  /**
   * Stop processing
   */
  public stop(): void {
    if (!this.isRunning) return;

    this.isRunning = false;
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = null;
    }

    this.emit('stopped');
  }

  /**
   * Process vision analysis for all registered vehicles
   */
  private processAllVehicles(): void {
    for (const [vehicleId, context] of this.vehicleContexts) {
      const frame = this.analyzeFrame(vehicleId, context);
      if (frame) {
        this.emit('frame-analyzed', frame);

        // Check for alerts
        this.checkForAlerts(frame, context);
      }
    }
  }

  /**
   * Analyze a single frame
   */
  private analyzeFrame(vehicleId: string, context: VehicleVisionContext): VisionAnalysisFrame | null {
    const startTime = Date.now();

    const frame: VisionAnalysisFrame = {
      id: uuidv4(),
      timestamp: new Date(),
      vehicleId,
      cameraPosition: 'forward',
      objects: [],
      processingTimeMs: 0
    };

    // Object Detection
    if (this.config.enableObjectDetection) {
      frame.objects = this.detectObjects(vehicleId, context);
    }

    // Driver Monitoring
    if (this.config.enableDriverMonitoring) {
      frame.driverBehavior = this.analyzeDriverBehavior(vehicleId, context);
    }

    // Lane Detection
    if (this.config.enableLaneDetection) {
      frame.laneAnalysis = this.analyzeLanes(vehicleId, context);
    }

    // Traffic Sign Recognition
    if (this.config.enableSignRecognition) {
      frame.trafficSigns = this.recognizeTrafficSigns(vehicleId, context);
    }

    // Collision Prediction
    if (this.config.enableCollisionPrediction) {
      frame.collisionPrediction = this.predictCollision(frame.objects, context);
    }

    // Blind Spot Detection
    if (this.config.enableBlindSpotDetection) {
      frame.blindSpot = this.detectBlindSpots(frame.objects, context);
    }

    // Road Condition Analysis
    if (this.config.enableRoadConditionAnalysis) {
      frame.roadCondition = this.analyzeRoadConditions(vehicleId, context);
    }

    // Parking Assist
    if (this.config.enableParkingAssist) {
      frame.parkingAssist = this.provideParkingAssist(frame.objects, context);
    }

    frame.processingTimeMs = Date.now() - startTime;

    // Update context
    context.lastFrame = frame;
    context.statistics.framesProcessed++;
    context.statistics.objectsDetected += frame.objects.length;
    context.statistics.averageProcessingTimeMs =
      (context.statistics.averageProcessingTimeMs * (context.statistics.framesProcessed - 1) +
        frame.processingTimeMs) /
      context.statistics.framesProcessed;

    return frame;
  }

  /**
   * Simulate object detection
   */
  private detectObjects(vehicleId: string, context: VehicleVisionContext): ObjectDetection[] {
    const objects: ObjectDetection[] = [];

    // Simulate random object detection with realistic probabilities
    const scenarios = [
      { type: 'vehicle' as ObjectType, probability: 0.7, distance: [10, 100] },
      { type: 'pedestrian' as ObjectType, probability: 0.3, distance: [5, 50] },
      { type: 'cyclist' as ObjectType, probability: 0.15, distance: [5, 40] },
      { type: 'traffic_sign' as ObjectType, probability: 0.4, distance: [20, 80] },
      { type: 'traffic_light' as ObjectType, probability: 0.25, distance: [30, 100] }
    ];

    for (const scenario of scenarios) {
      if (Math.random() < scenario.probability) {
        const distance = scenario.distance[0] + Math.random() * (scenario.distance[1] - scenario.distance[0]);
        const velocity = -5 + Math.random() * 20; // -5 to 15 m/s

        objects.push({
          id: uuidv4(),
          type: scenario.type,
          boundingBox: this.generateRealisticBoundingBox(scenario.type, distance),
          confidence: 0.75 + Math.random() * 0.25,
          distance,
          velocity,
          trackingId: `track-${Math.floor(Math.random() * 1000)}`
        });
      }
    }

    return objects;
  }

  /**
   * Generate realistic bounding boxes based on object type and distance
   */
  private generateRealisticBoundingBox(type: ObjectType, distance: number): BoundingBox {
    // Closer objects = larger bounding boxes
    const sizeFactor = Math.max(0.05, 1 / (distance / 10));

    const baseWidth = type === 'vehicle' ? 0.2 : type === 'pedestrian' ? 0.1 : 0.08;
    const baseHeight = type === 'vehicle' ? 0.15 : type === 'pedestrian' ? 0.25 : 0.12;

    return {
      x: 0.2 + Math.random() * 0.6,
      y: 0.3 + Math.random() * 0.4,
      width: baseWidth * sizeFactor,
      height: baseHeight * sizeFactor
    };
  }

  /**
   * Analyze driver behavior
   */
  private analyzeDriverBehavior(vehicleId: string, context: VehicleVisionContext): DriverBehaviorAnalysis {
    const alerts: DriverAlert[] = [];

    // Simulate driver attention
    const attentionRoll = Math.random();
    let attentionLevel: 'focused' | 'distracted' | 'drowsy' | 'severely_distracted';
    let eyeGaze: 'forward' | 'left' | 'right' | 'down' | 'closed';

    if (attentionRoll < 0.7) {
      attentionLevel = 'focused';
      eyeGaze = 'forward';
    } else if (attentionRoll < 0.85) {
      attentionLevel = 'distracted';
      eyeGaze = ['left', 'right', 'down'][Math.floor(Math.random() * 3)] as any;
      alerts.push('looking_away');
    } else if (attentionRoll < 0.95) {
      attentionLevel = 'drowsy';
      eyeGaze = Math.random() < 0.5 ? 'closed' : 'down';
      alerts.push('drowsy_driving');
    } else {
      attentionLevel = 'severely_distracted';
      eyeGaze = 'down';
      alerts.push('distracted_driving');
    }

    const blinkRate = attentionLevel === 'drowsy' ? 3 + Math.random() * 4 : 12 + Math.random() * 8;
    const yawnDetected = attentionLevel === 'drowsy' && Math.random() < 0.3;

    // Compliance checks
    const seatbeltOn = Math.random() < 0.95;
    const phoneInHand = Math.random() < 0.05;
    const smoking = Math.random() < 0.02;
    const eating = Math.random() < 0.03;
    const handsOnWheel: 'both' | 'one' | 'none' =
      Math.random() < 0.85 ? 'both' : Math.random() < 0.5 ? 'one' : 'none';

    if (!seatbeltOn) alerts.push('no_seatbelt');
    if (phoneInHand) alerts.push('phone_use');
    if (smoking) alerts.push('smoking');
    if (eating) alerts.push('eating');

    // Facial recognition
    const recognized = this.config.enableFacialRecognition && Math.random() < 0.9;
    const facialRecognition = this.config.enableFacialRecognition
      ? {
          recognized,
          driverId: recognized ? context.driverId : undefined,
          confidence: recognized ? 0.85 + Math.random() * 0.15 : 0.3 + Math.random() * 0.4
        }
      : undefined;

    if (this.config.enableFacialRecognition && !recognized && context.driverId) {
      alerts.push('unauthorized_driver');
    }

    return {
      timestamp: new Date(),
      driverId: context.driverId,
      alerts,
      attention: {
        level: attentionLevel,
        eyeGazeDirection: eyeGaze,
        headPose: {
          yaw: -15 + Math.random() * 30,
          pitch: -10 + Math.random() * 20,
          roll: -5 + Math.random() * 10
        },
        blinkRate,
        yawnDetected
      },
      compliance: {
        seatbeltOn,
        phoneInHand,
        smoking,
        eating,
        handsOnWheel
      },
      emotion: {
        primary: ['neutral', 'happy', 'angry', 'stressed', 'tired'][Math.floor(Math.random() * 5)] as any,
        confidence: 0.6 + Math.random() * 0.4
      },
      facialRecognition
    };
  }

  /**
   * Analyze lane markings
   */
  private analyzeLanes(vehicleId: string, context: VehicleVisionContext): LaneAnalysis {
    const lanes: DetectedLane[] = [
      {
        id: 'left-lane',
        side: 'left',
        type: Math.random() < 0.5 ? 'dashed' : 'solid',
        confidence: 0.85 + Math.random() * 0.15,
        curvature: 1000 + Math.random() * 2000,
        points: []
      },
      {
        id: 'right-lane',
        side: 'right',
        type: Math.random() < 0.5 ? 'dashed' : 'solid',
        confidence: 0.85 + Math.random() * 0.15,
        curvature: 1000 + Math.random() * 2000,
        points: []
      }
    ];

    const centerOffset = -0.5 + Math.random(); // -0.5 to 0.5 meters
    const warnings: LaneWarning[] = [];

    if (centerOffset < -this.config.alertThresholds.laneDepartureDistance) {
      warnings.push('lane_departure_left');
    } else if (centerOffset > this.config.alertThresholds.laneDepartureDistance) {
      warnings.push('lane_departure_right');
    }

    return {
      timestamp: new Date(),
      lanes,
      vehiclePosition: {
        laneNumber: 1,
        centerOffset,
        laneWidth: 3.5 + Math.random() * 0.5
      },
      warnings
    };
  }

  /**
   * Recognize traffic signs
   */
  private recognizeTrafficSigns(vehicleId: string, context: VehicleVisionContext): TrafficSignRecognition {
    const signs: DetectedSign[] = [];

    if (Math.random() < 0.3) {
      const speedLimit = [25, 30, 35, 40, 45, 50, 55, 60, 65, 70][Math.floor(Math.random() * 10)];
      signs.push({
        id: uuidv4(),
        type: 'speed_limit',
        boundingBox: { x: 0.7, y: 0.2, width: 0.08, height: 0.08 },
        confidence: 0.9 + Math.random() * 0.1,
        distance: 40 + Math.random() * 40,
        value: speedLimit.toString(),
        compliant: Math.random() < 0.85
      });
    }

    return {
      timestamp: new Date(),
      signs
    };
  }

  /**
   * Predict potential collisions
   */
  private predictCollision(objects: ObjectDetection[], context: VehicleVisionContext): CollisionPrediction {
    let riskLevel: 'none' | 'low' | 'medium' | 'high' | 'critical' = 'none';
    let timeToCollision: number | undefined;
    let targetObject: ObjectDetection | undefined;
    let recommendedAction: 'none' | 'brake' | 'steer_left' | 'steer_right' | 'emergency_brake' = 'none';

    // Find objects directly ahead with negative velocity (approaching)
    const threateningObjects = objects.filter(
      obj => obj.velocity < 0 && obj.distance < 50 && Math.abs(obj.boundingBox.x - 0.5) < 0.2
    );

    if (threateningObjects.length > 0) {
      const closest = threateningObjects.sort((a, b) => a.distance - b.distance)[0];
      const relativeSpeed = Math.abs(closest.velocity);
      timeToCollision = closest.distance / relativeSpeed;

      if (timeToCollision < 1.0) {
        riskLevel = 'critical';
        recommendedAction = 'emergency_brake';
      } else if (timeToCollision < 2.0) {
        riskLevel = 'high';
        recommendedAction = 'brake';
      } else if (timeToCollision < 4.0) {
        riskLevel = 'medium';
        recommendedAction = 'brake';
      } else {
        riskLevel = 'low';
      }

      targetObject = closest;
    }

    return {
      timestamp: new Date(),
      riskLevel,
      timeToCollision,
      targetObject,
      recommendedAction,
      confidence: 0.8 + Math.random() * 0.2
    };
  }

  /**
   * Detect objects in blind spots
   */
  private detectBlindSpots(objects: ObjectDetection[], context: VehicleVisionContext): BlindSpotDetection {
    const leftObjects = objects.filter(obj => obj.boundingBox.x < 0.3 && obj.distance < 10);
    const rightObjects = objects.filter(obj => obj.boundingBox.x > 0.7 && obj.distance < 10);

    return {
      timestamp: new Date(),
      leftBlindSpot: {
        occupied: leftObjects.length > 0,
        objects: leftObjects,
        warning: leftObjects.length > 0
      },
      rightBlindSpot: {
        occupied: rightObjects.length > 0,
        objects: rightObjects,
        warning: rightObjects.length > 0
      }
    };
  }

  /**
   * Analyze road conditions
   */
  private analyzeRoadConditions(vehicleId: string, context: VehicleVisionContext): RoadConditionAnalysis {
    const hour = new Date().getHours();
    const isDaylight = hour >= 6 && hour < 19;

    const weatherRoll = Math.random();
    let weather: 'clear' | 'cloudy' | 'rain' | 'snow' | 'fog' | 'sleet';
    let surface: 'dry' | 'wet' | 'icy' | 'snowy' | 'muddy';

    if (weatherRoll < 0.6) {
      weather = 'clear';
      surface = 'dry';
    } else if (weatherRoll < 0.8) {
      weather = 'cloudy';
      surface = 'dry';
    } else if (weatherRoll < 0.9) {
      weather = 'rain';
      surface = 'wet';
    } else if (weatherRoll < 0.95) {
      weather = 'fog';
      surface = 'dry';
    } else {
      weather = 'snow';
      surface = 'snowy';
    }

    return {
      timestamp: new Date(),
      surface: {
        type: surface,
        quality: ['excellent', 'good', 'fair', 'poor'][Math.floor(Math.random() * 4)] as any,
        visibility: weather === 'fog' ? 20 + Math.random() * 50 : 100 + Math.random() * 400
      },
      weather: {
        condition: weather,
        intensity: ['light', 'moderate', 'heavy'][Math.floor(Math.random() * 3)] as any
      },
      lighting: {
        level: isDaylight ? 'daylight' : hour < 6 || hour > 20 ? 'night' : 'dusk',
        headlightsRecommended: !isDaylight || weather === 'fog' || weather === 'rain'
      }
    };
  }

  /**
   * Provide parking assistance
   */
  private provideParkingAssist(objects: ObjectDetection[], context: VehicleVisionContext): ParkingAssist {
    const nearbyObstacles = objects.filter(obj => obj.distance < 5);
    const spaceDetected = Math.random() < 0.4;

    return {
      timestamp: new Date(),
      mode: 'parallel',
      spaceDetected,
      spaceWidth: spaceDetected ? 2.2 + Math.random() * 0.5 : undefined,
      spaceLength: spaceDetected ? 5.5 + Math.random() * 1.0 : undefined,
      guidanceInstructions: spaceDetected
        ? ['Turn wheel full left', 'Reverse slowly', 'Straighten wheel when aligned']
        : undefined,
      obstacles: nearbyObstacles,
      distanceToObstacle: nearbyObstacles.length > 0 ? Math.min(...nearbyObstacles.map(o => o.distance)) : undefined
    };
  }

  /**
   * Check for alerts and emit events
   */
  private checkForAlerts(frame: VisionAnalysisFrame, context: VehicleVisionContext): void {
    // Collision alerts
    if (frame.collisionPrediction?.riskLevel === 'critical' || frame.collisionPrediction?.riskLevel === 'high') {
      this.emit('collision-warning', {
        vehicleId: frame.vehicleId,
        prediction: frame.collisionPrediction,
        frame
      });
      context.statistics.alertsTriggered++;
    }

    // Driver behavior alerts
    if (frame.driverBehavior?.alerts.length) {
      this.emit('driver-alert', {
        vehicleId: frame.vehicleId,
        alerts: frame.driverBehavior.alerts,
        behavior: frame.driverBehavior,
        frame
      });
      context.statistics.alertsTriggered += frame.driverBehavior.alerts.length;
    }

    // Lane departure alerts
    if (frame.laneAnalysis?.warnings.length) {
      this.emit('lane-warning', {
        vehicleId: frame.vehicleId,
        warnings: frame.laneAnalysis.warnings,
        laneAnalysis: frame.laneAnalysis,
        frame
      });
      context.statistics.alertsTriggered += frame.laneAnalysis.warnings.length;
    }

    // Blind spot alerts
    if (frame.blindSpot?.leftBlindSpot.warning || frame.blindSpot?.rightBlindSpot.warning) {
      this.emit('blindspot-warning', {
        vehicleId: frame.vehicleId,
        blindSpot: frame.blindSpot,
        frame
      });
      context.statistics.alertsTriggered++;
    }
  }

  /**
   * Get statistics for a vehicle
   */
  public getVehicleStatistics(vehicleId: string): VehicleVisionContext['statistics'] | null {
    return this.vehicleContexts.get(vehicleId)?.statistics || null;
  }

  /**
   * Get last frame for a vehicle
   */
  public getLastFrame(vehicleId: string): VisionAnalysisFrame | null {
    return this.vehicleContexts.get(vehicleId)?.lastFrame || null;
  }

  /**
   * Get all vehicle statistics
   */
  public getAllStatistics(): Record<string, VehicleVisionContext['statistics']> {
    const stats: Record<string, VehicleVisionContext['statistics']> = {};
    for (const [vehicleId, context] of this.vehicleContexts) {
      stats[vehicleId] = context.statistics;
    }
    return stats;
  }

  /**
   * Get service configuration
   */
  public getConfig(): VisionServiceConfig {
    return { ...this.config };
  }

  /**
   * Update configuration
   */
  public updateConfig(updates: Partial<VisionServiceConfig>): void {
    this.config = { ...this.config, ...updates };
    this.emit('config-updated', this.config);
  }
}

// ============================================================================
// INTERNAL TYPES
// ============================================================================

interface VehicleVisionContext {
  vehicleId: string;
  driverId?: string;
  cameraPositions: string[];
  lastFrame: VisionAnalysisFrame | null;
  trackedObjects: Map<string, ObjectDetection>;
  alertHistory: any[];
  statistics: {
    framesProcessed: number;
    objectsDetected: number;
    alertsTriggered: number;
    averageProcessingTimeMs: number;
  };
}

// ============================================================================
// SINGLETON EXPORT
// ============================================================================

let visionServiceInstance: ComputerVisionService | null = null;

export function getComputerVisionService(config?: Partial<VisionServiceConfig>): ComputerVisionService {
  if (!visionServiceInstance) {
    visionServiceInstance = new ComputerVisionService(config);
  }
  return visionServiceInstance;
}

export function resetComputerVisionService(): void {
  if (visionServiceInstance) {
    visionServiceInstance.stop();
    visionServiceInstance = null;
  }
}
