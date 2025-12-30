/**
 * DispatchEmulator - Realistic dispatch radio communication emulator
 * Generates authentic radio transmissions with emergency calls, routine check-ins,
 * incident reports, and multi-channel communication
 *
 * Security: Fortune 50 standards with input validation and secure event handling
 */

import crypto from 'crypto';
import { EventEmitter } from 'events';

export interface DispatchTransmission {
  id: string;
  vehicleId: string;
  driverId?: string;
  channel: 'dispatch' | 'emergency' | 'maintenance' | 'operations';
  type: 'emergency' | 'routine' | 'incident' | 'status' | 'acknowledgment' | 'request';
  priority: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  timestamp: Date;
  duration: number; // seconds
  location?: {
    lat: number;
    lng: number;
    address?: string;
  };
  unitNumber?: string;
  incidentNumber?: string;
  responseRequired: boolean;
  acknowledged: boolean;
  audioClipId?: string;
  metadata: {
    signalStrength: number;
    batteryLevel: number;
    backgroundNoise: number;
    transmission_quality: 'clear' | 'static' | 'weak' | 'broken';
  };
}

export interface DispatchChannel {
  id: string;
  name: string;
  frequency: string;
  activeUnits: string[];
  status: 'active' | 'standby' | 'emergency';
  description: string;
}

export interface EmulatorConfig {
  updateIntervalMs: number;
  transmissionProbability: number;
  emergencyProbability: number;
  channels: string[];
  maxActiveTransmissions: number;
  realisticTiming: boolean;
}

/**
 * Dispatch Radio Emulator
 * Simulates realistic dispatch radio communications for fleet vehicles
 */
export class DispatchEmulator extends EventEmitter {
  private config: EmulatorConfig;
  private vehicles: Map<string, VehicleRadioState> = new Map();
  private activeTransmissions: DispatchTransmission[] = [];
  private transmissionHistory: DispatchTransmission[] = [];
  private channels: Map<string, DispatchChannel>;
  private isRunning: boolean = false;
  private intervalHandle?: NodeJS.Timeout;
  private transmissionQueue: DispatchTransmission[] = [];
  private emergencyActive: boolean = false;

  // Realistic radio call templates
  private readonly RADIO_TEMPLATES = {
    emergency: [
      "Unit {unit}, 10-33, officer needs assistance at {location}",
      "All units, 10-34, pursuit in progress, {direction} on {street}",
      "Unit {unit}, 10-39, emergency traffic only, Code 3 to {location}",
      "Dispatch to Unit {unit}, 10-52, ambulance needed at {location}",
      "Unit {unit} reporting 10-50, vehicle accident with injuries at {location}",
      "Code Red, Unit {unit}, vehicle fire reported at {location}",
      "All units, APB for stolen vehicle, plate {plate}, last seen {location}",
      "Unit {unit}, 10-18, urgent response to hazmat incident at {location}",
      "Emergency, Unit {unit}, driver medical emergency at {location}",
      "Unit {unit}, requesting immediate backup at {location}, 10-78"
    ],
    routine: [
      "Unit {unit}, 10-4, en route to {location}",
      "Dispatch, Unit {unit}, 10-8, in service",
      "Unit {unit} to dispatch, arriving at {location}",
      "Dispatch, Unit {unit}, 10-23, standing by for assignment",
      "Unit {unit}, 10-7, out of service for meal break",
      "Unit {unit} clear from {location}, available for assignment",
      "Dispatch, Unit {unit}, requesting route guidance to {location}",
      "Unit {unit}, 10-97, arrived at scene",
      "Unit {unit} to dispatch, delivery complete at {location}",
      "Dispatch, Unit {unit} requesting 10-28, vehicle registration check",
      "Unit {unit}, 10-6, busy on detail at {location}",
      "Unit {unit} to dispatch, 10-76, en route to {location}, ETA 15 minutes"
    ],
    incident: [
      "Unit {unit}, 10-50, minor vehicle accident at {location}, no injuries",
      "Dispatch, Unit {unit} reporting road hazard at {location}",
      "Unit {unit}, 10-55, intoxicated driver suspected at {location}",
      "Unit {unit} to dispatch, reporting aggressive driver, plate {plate}",
      "Dispatch, Unit {unit}, traffic signal malfunction at {intersection}",
      "Unit {unit}, 10-57, hit and run suspect vehicle at {location}",
      "Unit {unit} reporting suspicious activity at {location}",
      "Dispatch, Unit {unit}, vehicle breakdown at {location}, requesting tow",
      "Unit {unit}, 10-91, stray animal on roadway at {location}",
      "Unit {unit} to dispatch, debris in roadway at {location}"
    ],
    status: [
      "Unit {unit}, 10-20, current location {location}",
      "Dispatch, Unit {unit}, odometer reading {odometer}",
      "Unit {unit}, fuel level at {fuel_percent}%, requesting refuel authorization",
      "Unit {unit} to dispatch, vehicle maintenance light on, code {code}",
      "Dispatch, Unit {unit}, 10-25, contact supervisor",
      "Unit {unit}, completing inspection at {location}",
      "Unit {unit} to dispatch, passenger count {passengers}",
      "Dispatch, Unit {unit}, requesting weather update for route",
      "Unit {unit}, tire pressure warning, pulling over at {location}",
      "Unit {unit} to dispatch, 10-22, disregard last transmission"
    ],
    acknowledgment: [
      "Unit {unit}, 10-4, copy that dispatch",
      "Dispatch, Unit {unit} acknowledges, will comply",
      "Unit {unit}, roger, proceeding as directed",
      "10-4 dispatch, Unit {unit} en route",
      "Unit {unit}, affirmative, understood",
      "Copy that dispatch, Unit {unit} standing by",
      "Unit {unit}, 10-4, message received",
      "Roger dispatch, Unit {unit} will advise",
      "Unit {unit}, confirmed, executing orders",
      "10-4, Unit {unit} copies all"
    ],
    request: [
      "Dispatch, Unit {unit} requesting traffic status for {route}",
      "Unit {unit} to dispatch, requesting backup at {location}",
      "Dispatch, Unit {unit}, need plate check on {plate}",
      "Unit {unit} requesting permission to break from route",
      "Dispatch, Unit {unit}, requesting supervisor at {location}",
      "Unit {unit} to dispatch, need ETA for tow truck",
      "Dispatch, Unit {unit} requesting detour around {location}",
      "Unit {unit}, requesting facility access code for {location}",
      "Unit {unit} to dispatch, requesting customer contact information",
      "Dispatch, Unit {unit}, need confirmation on delivery address"
    ]
  };

  // Location templates
  private readonly LOCATIONS = [
    "Interstate 95 northbound mile marker 47",
    "Main Street and 5th Avenue intersection",
    "Washington Boulevard near Oak Park",
    "Highway 101 southbound at exit 23",
    "Distribution Center Alpha",
    "Downtown Terminal Building",
    "Industrial Park loading dock 7",
    "City Center Plaza parking structure",
    "Airport cargo facility gate 12",
    "Riverside warehouse complex",
    "Market Street between 2nd and 3rd",
    "Highway rest area mile marker 89",
    "Shopping center delivery entrance",
    "Medical district parking garage",
    "Convention center loading zone",
    "Harbor freight terminal pier 6",
    "University campus south entrance",
    "Suburban office park building C",
    "Railroad crossing at Elm Street",
    "Highway interchange ramp B"
  ];

  constructor(config: Partial<EmulatorConfig> = {}) {
    super();

    this.config = {
      updateIntervalMs: config.updateIntervalMs || 15000, // Every 15 seconds
      transmissionProbability: config.transmissionProbability || 0.3,
      emergencyProbability: config.emergencyProbability || 0.05,
      channels: config.channels || ['dispatch', 'emergency', 'maintenance', 'operations'],
      maxActiveTransmissions: config.maxActiveTransmissions || 50,
      realisticTiming: config.realisticTiming ?? true
    };

    // Initialize channels
    this.channels = new Map([
      ['dispatch', {
        id: 'dispatch',
        name: 'Main Dispatch',
        frequency: '154.280',
        activeUnits: [],
        status: 'active',
        description: 'Primary dispatch and coordination channel'
      }],
      ['emergency', {
        id: 'emergency',
        name: 'Emergency Operations',
        frequency: '155.475',
        activeUnits: [],
        status: 'standby',
        description: 'Emergency and high-priority communications'
      }],
      ['maintenance', {
        id: 'maintenance',
        name: 'Maintenance Operations',
        frequency: '154.570',
        activeUnits: [],
        status: 'active',
        description: 'Vehicle maintenance and support'
      }],
      ['operations', {
        id: 'operations',
        name: 'Field Operations',
        frequency: '155.160',
        activeUnits: [],
        status: 'active',
        description: 'General field operations and logistics'
      }]
    ]);
  }

  /**
   * Register a vehicle for dispatch radio communications
   */
  public registerVehicle(vehicle: {
    id: string;
    unitNumber: string;
    driverId?: string;
    currentLocation?: { lat: number; lng: number; address?: string };
  }): void {
    if (!vehicle.id || !vehicle.unitNumber) {
      throw new Error('Vehicle ID and unit number are required');
    }

    this.vehicles.set(vehicle.id, {
      vehicleId: vehicle.id,
      unitNumber: vehicle.unitNumber,
      driverId: vehicle.driverId,
      currentChannel: 'dispatch',
      lastTransmission: null,
      batteryLevel: 100,
      signalStrength: 90 + Math.random() * 10,
      isActive: true,
      currentLocation: vehicle.currentLocation
    });

    // Add to dispatch channel
    const dispatchChannel = this.channels.get('dispatch');
    if (dispatchChannel) {
      dispatchChannel.activeUnits.push(vehicle.unitNumber);
    }

    console.log(`Vehicle ${vehicle.unitNumber} registered for dispatch radio`);
  }

  /**
   * Start the dispatch emulator
   */
  public start(): void {
    if (this.isRunning) {
      console.warn('DispatchEmulator is already running');
      return;
    }

    this.isRunning = true;
    console.log('DispatchEmulator started');

    // Generate initial transmissions for realism
    this.generateInitialTransmissions();

    // Start transmission generation loop
    this.intervalHandle = setInterval(() => {
      this.generateTransmissions();
      this.processTransmissionQueue();
      this.cleanupOldTransmissions();
    }, this.config.updateIntervalMs);

    this.emit('started', { timestamp: new Date() });
  }

  /**
   * Stop the dispatch emulator
   */
  public stop(): void {
    if (!this.isRunning) {
      return;
    }

    if (this.intervalHandle) {
      clearInterval(this.intervalHandle);
      this.intervalHandle = undefined;
    }

    this.isRunning = false;
    console.log('DispatchEmulator stopped');
    this.emit('stopped', { timestamp: new Date() });
  }

  /**
   * Pause transmission generation
   */
  public pause(): void {
    if (this.intervalHandle) {
      clearInterval(this.intervalHandle);
      this.intervalHandle = undefined;
    }
    this.emit('paused', { timestamp: new Date() });
  }

  /**
   * Resume transmission generation
   */
  public resume(): void {
    if (!this.isRunning) {
      return;
    }

    this.intervalHandle = setInterval(() => {
      this.generateTransmissions();
      this.processTransmissionQueue();
      this.cleanupOldTransmissions();
    }, this.config.updateIntervalMs);

    this.emit('resumed', { timestamp: new Date() });
  }

  /**
   * Generate initial transmissions for realism
   */
  private generateInitialTransmissions(): void {
    const vehicleArray = Array.from(this.vehicles.values());

    // Generate 5-10 recent transmissions
    const count = 5 + Math.floor(Math.random() * 6);

    for (let i = 0; i < count && i < vehicleArray.length; i++) {
      const vehicleState = vehicleArray[i];
      const transmission = this.createRandomTransmission(vehicleState);

      // Backdate the timestamp
      transmission.timestamp = new Date(Date.now() - (count - i) * 60000);

      this.transmissionHistory.push(transmission);
      this.emit('transmission', transmission);
    }
  }

  /**
   * Generate new transmissions based on probability
   */
  private generateTransmissions(): void {
    const vehicleArray = Array.from(this.vehicles.values());

    for (const vehicleState of vehicleArray) {
      if (!vehicleState.isActive) continue;

      // Check if vehicle should transmit
      const shouldTransmit = Math.random() < this.config.transmissionProbability;

      if (shouldTransmit) {
        const transmission = this.createRandomTransmission(vehicleState);
        this.queueTransmission(transmission);
      }

      // Update vehicle state
      this.updateVehicleState(vehicleState);
    }

    // Occasionally generate emergency transmissions
    if (Math.random() < this.config.emergencyProbability && !this.emergencyActive) {
      this.generateEmergencySequence();
    }
  }

  /**
   * Create a random transmission for a vehicle
   */
  private createRandomTransmission(vehicleState: VehicleRadioState): DispatchTransmission {
    // Determine transmission type and priority
    const isEmergency = Math.random() < 0.05;
    const type = isEmergency ? 'emergency' : this.selectTransmissionType();
    const priority = this.selectPriority(type);
    const channel = this.selectChannel(type, priority);

    // Select and populate template
    const template = this.selectTemplate(type);
    const message = this.populateTemplate(template, vehicleState);

    // Generate transmission
    const transmission: DispatchTransmission = {
      id: this.generateTransmissionId(),
      vehicleId: vehicleState.vehicleId,
      driverId: vehicleState.driverId,
      channel,
      type,
      priority,
      message,
      timestamp: new Date(),
      duration: this.calculateDuration(message),
      location: vehicleState.currentLocation,
      unitNumber: vehicleState.unitNumber,
      responseRequired: priority === 'high' || priority === 'critical',
      acknowledged: false,
      metadata: {
        signalStrength: vehicleState.signalStrength,
        batteryLevel: vehicleState.batteryLevel,
        backgroundNoise: Math.random() * 30,
        transmission_quality: this.determineTransmissionQuality(vehicleState.signalStrength)
      }
    };

    // Update vehicle state
    vehicleState.lastTransmission = transmission.timestamp;

    return transmission;
  }

  /**
   * Generate an emergency transmission sequence
   */
  private generateEmergencySequence(): void {
    this.emergencyActive = true;

    const vehicleArray = Array.from(this.vehicles.values());
    if (vehicleArray.length === 0) return;

    const emergencyVehicle = vehicleArray[Math.floor(Math.random() * vehicleArray.length)];

    // Initial emergency call
    const template = this.RADIO_TEMPLATES.emergency[Math.floor(Math.random() * this.RADIO_TEMPLATES.emergency.length)];
    const emergencyTransmission = this.createEmergencyTransmission(emergencyVehicle, template);
    this.queueTransmission(emergencyTransmission);

    // Queue acknowledgment
    setTimeout(() => {
      const ackTransmission = this.createAcknowledgment(emergencyVehicle, emergencyTransmission.id);
      this.queueTransmission(ackTransmission);
    }, 3000);

    // Queue status update
    setTimeout(() => {
      const statusTransmission = this.createStatusUpdate(emergencyVehicle);
      this.queueTransmission(statusTransmission);
      this.emergencyActive = false;
    }, 10000);

    // Switch emergency channel to emergency status
    const emergencyChannel = this.channels.get('emergency');
    if (emergencyChannel) {
      emergencyChannel.status = 'emergency';
      setTimeout(() => {
        emergencyChannel.status = 'standby';
      }, 15000);
    }
  }

  /**
   * Create emergency transmission
   */
  private createEmergencyTransmission(vehicleState: VehicleRadioState, template: string): DispatchTransmission {
    const message = this.populateTemplate(template, vehicleState);

    return {
      id: this.generateTransmissionId(),
      vehicleId: vehicleState.vehicleId,
      driverId: vehicleState.driverId,
      channel: 'emergency',
      type: 'emergency',
      priority: 'critical',
      message,
      timestamp: new Date(),
      duration: this.calculateDuration(message),
      location: vehicleState.currentLocation,
      unitNumber: vehicleState.unitNumber,
      incidentNumber: this.generateIncidentNumber(),
      responseRequired: true,
      acknowledged: false,
      metadata: {
        signalStrength: vehicleState.signalStrength,
        batteryLevel: vehicleState.batteryLevel,
        backgroundNoise: Math.random() * 50,
        transmission_quality: 'clear'
      }
    };
  }

  /**
   * Create acknowledgment transmission
   */
  private createAcknowledgment(vehicleState: VehicleRadioState, originalId: string): DispatchTransmission {
    const template = this.RADIO_TEMPLATES.acknowledgment[Math.floor(Math.random() * this.RADIO_TEMPLATES.acknowledgment.length)];
    const message = this.populateTemplate(template, vehicleState);

    return {
      id: this.generateTransmissionId(),
      vehicleId: 'DISPATCH-01',
      channel: 'emergency',
      type: 'acknowledgment',
      priority: 'high',
      message,
      timestamp: new Date(),
      duration: this.calculateDuration(message),
      unitNumber: 'Dispatch',
      responseRequired: false,
      acknowledged: true,
      metadata: {
        signalStrength: 100,
        batteryLevel: 100,
        backgroundNoise: 5,
        transmission_quality: 'clear'
      }
    };
  }

  /**
   * Create status update transmission
   */
  private createStatusUpdate(vehicleState: VehicleRadioState): DispatchTransmission {
    const statusMessages = [
      `Unit ${vehicleState.unitNumber}, 10-4, situation under control`,
      `Dispatch, Unit ${vehicleState.unitNumber}, 10-24, assignment completed`,
      `Unit ${vehicleState.unitNumber}, all clear, resuming normal operations`
    ];

    const message = statusMessages[Math.floor(Math.random() * statusMessages.length)];

    return {
      id: this.generateTransmissionId(),
      vehicleId: vehicleState.vehicleId,
      driverId: vehicleState.driverId,
      channel: 'dispatch',
      type: 'status',
      priority: 'medium',
      message,
      timestamp: new Date(),
      duration: this.calculateDuration(message),
      location: vehicleState.currentLocation,
      unitNumber: vehicleState.unitNumber,
      responseRequired: false,
      acknowledged: false,
      metadata: {
        signalStrength: vehicleState.signalStrength,
        batteryLevel: vehicleState.batteryLevel,
        backgroundNoise: Math.random() * 20,
        transmission_quality: this.determineTransmissionQuality(vehicleState.signalStrength)
      }
    };
  }

  /**
   * Queue a transmission for processing
   */
  private queueTransmission(transmission: DispatchTransmission): void {
    this.transmissionQueue.push(transmission);
  }

  /**
   * Process queued transmissions
   */
  private processTransmissionQueue(): void {
    while (this.transmissionQueue.length > 0) {
      const transmission = this.transmissionQueue.shift();
      if (!transmission) continue;

      this.activeTransmissions.push(transmission);
      this.transmissionHistory.push(transmission);

      // Emit transmission event
      this.emit('transmission', transmission);

      // Emit channel-specific event
      this.emit('transmission:${transmission.channel}', transmission);

      // If emergency, emit special event
      if (transmission.priority === 'critical') {
        this.emit('emergency-transmission', transmission);
      }

      // Limit active transmissions
      if (this.activeTransmissions.length > this.config.maxActiveTransmissions) {
        this.activeTransmissions.shift();
      }
    }
  }

  /**
   * Populate message template with vehicle data
   */
  private populateTemplate(template: string, vehicleState: VehicleRadioState): string {
    let message = template;

    message = message.replace(/{unit}/g, vehicleState.unitNumber);
    message = message.replace(/{location}/g, this.getRandomLocation());
    message = message.replace(/{direction}/g, this.getRandomDirection());
    message = message.replace(/{street}/g, this.getRandomStreet());
    message = message.replace(/{intersection}/g, this.getRandomIntersection());
    message = message.replace(/{plate}/g, this.generatePlateNumber());
    message = message.replace(/{route}/g, this.getRandomRoute());
    message = message.replace(/{odometer}/g, Math.floor(50000 + Math.random() * 100000).toString());
    message = message.replace(/{fuel_percent}/g, Math.floor(20 + Math.random() * 60).toString());
    message = message.replace(/{code}/g, `P${Math.floor(100 + Math.random() * 900)}`);
    message = message.replace(/{passengers}/g, Math.floor(Math.random() * 4).toString());

    return message;
  }

  /**
   * Helper methods for template population
   */
  private getRandomLocation(): string {
    return this.LOCATIONS[Math.floor(Math.random() * this.LOCATIONS.length)];
  }

  private getRandomDirection(): string {
    const directions = ['northbound', 'southbound', 'eastbound', 'westbound'];
    return directions[Math.floor(Math.random() * directions.length)];
  }

  private getRandomStreet(): string {
    const streets = ['Main Street', 'Oak Avenue', 'Washington Boulevard', 'Interstate 95', 'Highway 101'];
    return streets[Math.floor(Math.random() * streets.length)];
  }

  private getRandomIntersection(): string {
    return `${this.getRandomStreet()} and ${this.getRandomStreet()}`;
  }

  private getRandomRoute(): string {
    const routes = ['Route 7', 'Route 12', 'Route 23', 'Interstate 95', 'Highway 101'];
    return routes[Math.floor(Math.random() * routes.length)];
  }

  private generatePlateNumber(): string {
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const digits = '0123456789';
    return `${letters.charAt(Math.floor(Math.random() * 26))}${letters.charAt(Math.floor(Math.random() * 26))}${letters.charAt(Math.floor(Math.random() * 26))}-${digits.charAt(Math.floor(Math.random() * 10))}${digits.charAt(Math.floor(Math.random() * 10))}${digits.charAt(Math.floor(Math.random() * 10))}${digits.charAt(Math.floor(Math.random() * 10))}`;
  }

  /**
   * Helper methods
   */
  private selectTransmissionType(): DispatchTransmission['type'] {
    const rand = Math.random();
    if (rand < 0.35) return 'routine';
    if (rand < 0.55) return 'status';
    if (rand < 0.70) return 'acknowledgment';
    if (rand < 0.85) return 'request';
    return 'incident';
  }

  private selectPriority(type: DispatchTransmission['type']): DispatchTransmission['priority'] {
    if (type === 'emergency') return 'critical';
    if (type === 'incident') return Math.random() < 0.3 ? 'high' : 'medium';
    if (type === 'request') return 'medium';
    return 'low';
  }

  private selectChannel(type: DispatchTransmission['type'], priority: DispatchTransmission['priority']): DispatchTransmission['channel'] {
    if (type === 'emergency' || priority === 'critical') return 'emergency';
    if (Math.random() < 0.1) return 'maintenance';
    if (Math.random() < 0.2) return 'operations';
    return 'dispatch';
  }

  private selectTemplate(type: DispatchTransmission['type']): string {
    const templates = this.RADIO_TEMPLATES[type] || this.RADIO_TEMPLATES.routine;
    return templates[Math.floor(Math.random() * templates.length)];
  }

  private calculateDuration(message: string): number {
    // Average speech rate: 150 words per minute
    const words = message.split(' ').length;
    const baseDuration = (words / 150) * 60;

    // Add random variation (radio pauses, etc.)
    const variation = baseDuration * (0.2 + Math.random() * 0.3);

    return Math.max(2, Math.round(baseDuration + variation));
  }

  private determineTransmissionQuality(signalStrength: number): 'clear' | 'static' | 'weak' | 'broken' {
    if (signalStrength >= 80) return 'clear';
    if (signalStrength >= 60) return 'static';
    if (signalStrength >= 40) return 'weak';
    return 'broken';
  }

  private generateTransmissionId(): string {
    return `TX-${crypto.randomBytes(8).toString('hex')}`;
  }

  private generateIncidentNumber(): string {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const number = Math.floor(10000 + Math.random() * 90000);
    return `${year}-${number}`;
  }

  private updateVehicleState(vehicleState: VehicleRadioState): void {
    // Simulate battery drain
    vehicleState.batteryLevel = Math.max(5, vehicleState.batteryLevel - Math.random() * 0.1);

    // Simulate signal strength fluctuation
    const fluctuation = (Math.random() - 0.5) * 5;
    vehicleState.signalStrength = Math.max(20, Math.min(100, vehicleState.signalStrength + fluctuation));
  }

  private cleanupOldTransmissions(): void {
    const cutoff = Date.now() - (3600000); // 1 hour

    this.transmissionHistory = this.transmissionHistory.filter(
      t => t.timestamp.getTime() > cutoff
    );

    // Keep only last 100 in active
    if (this.activeTransmissions.length > 100) {
      this.activeTransmissions = this.activeTransmissions.slice(-100);
    }
  }

  /**
   * Public API methods
   */

  public getActiveTransmissions(): DispatchTransmission[] {
    return [...this.activeTransmissions];
  }

  public getTransmissionHistory(limit: number = 50): DispatchTransmission[] {
    return this.transmissionHistory.slice(-limit);
  }

  public getChannelStatus(channelId: string): DispatchChannel | undefined {
    return this.channels.get(channelId);
  }

  public getAllChannels(): DispatchChannel[] {
    return Array.from(this.channels.values());
  }

  public getVehicleStatus(vehicleId: string): VehicleRadioState | undefined {
    return this.vehicles.get(vehicleId);
  }

  public acknowledgeTransmission(transmissionId: string): boolean {
    const transmission = this.activeTransmissions.find(t => t.id === transmissionId);
    if (transmission) {
      transmission.acknowledged = true;
      this.emit('transmission-acknowledged', transmission);
      return true;
    }
    return false;
  }

  public switchVehicleChannel(vehicleId: string, channel: DispatchTransmission['channel']): boolean {
    const vehicleState = this.vehicles.get(vehicleId);
    if (vehicleState && this.channels.has(channel)) {
      // Remove from old channel
      const oldChannel = this.channels.get(vehicleState.currentChannel);
      if (oldChannel) {
        oldChannel.activeUnits = oldChannel.activeUnits.filter(u => u !== vehicleState.unitNumber);
      }

      // Add to new channel
      vehicleState.currentChannel = channel;
      const newChannel = this.channels.get(channel);
      if (newChannel && !newChannel.activeUnits.includes(vehicleState.unitNumber)) {
        newChannel.activeUnits.push(vehicleState.unitNumber);
      }

      this.emit('channel-switch', { vehicleId, channel });
      return true;
    }
    return false;
  }

  public getCurrentState(): any {
    return {
      isRunning: this.isRunning,
      emergencyActive: this.emergencyActive,
      activeVehicles: this.vehicles.size,
      activeTransmissions: this.activeTransmissions.length,
      channels: Array.from(this.channels.values()),
      recentTransmissions: this.getTransmissionHistory(10)
    };
  }
}

/**
 * Internal types
 */
interface VehicleRadioState {
  vehicleId: string;
  unitNumber: string;
  driverId?: string;
  currentChannel: string;
  lastTransmission: Date | null;
  batteryLevel: number;
  signalStrength: number;
  isActive: boolean;
  currentLocation?: {
    lat: number;
    lng: number;
    address?: string;
  };
}
