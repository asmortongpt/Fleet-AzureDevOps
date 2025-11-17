/**
 * EV Charging Emulator
 * Simulates electric vehicle charging sessions, station usage, and battery management
 */

import { EventEmitter } from 'events';
import type { EVChargingSession, ChargingStation, BatteryHealth } from '../types';

interface EVChargingConfig {
  updateIntervalMs: number;
  maxConcurrentSessions: number;
  stations: ChargingStation[];
  batteryDegradationRate: number; // % per year
}

interface Vehicle {
  id: string;
  batteryCapacity: number; // kWh
  currentCharge: number; // %
  isElectric: boolean;
  batteryHealth: number; // %
  chargingEfficiency: number; // 0.85-0.95
}

export class EVChargingEmulator extends EventEmitter {
  private config: EVChargingConfig;
  private activeSessions: Map<string, EVChargingSession>;
  private vehicles: Map<string, Vehicle>;
  private stations: Map<string, ChargingStation>;
  private isRunning: boolean = false;
  private intervalId?: NodeJS.Timeout;

  constructor(config: EVChargingConfig) {
    super();
    this.config = config;
    this.activeSessions = new Map();
    this.vehicles = new Map();
    this.stations = new Map();

    // Initialize charging stations
    config.stations.forEach(station => {
      this.stations.set(station.id, station);
    });
  }

  /**
   * Register an electric vehicle
   */
  registerVehicle(vehicle: Vehicle): void {
    if (!vehicle.isElectric) {
      throw new Error('Only electric vehicles can be registered for charging');
    }
    this.vehicles.set(vehicle.id, vehicle);
    this.emit('vehicle-registered', { vehicleId: vehicle.id, vehicle });
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

    // End all active sessions
    this.activeSessions.forEach(session => {
      this.endChargingSession(session.id, 'emulator_stopped');
    });

    this.emit('stopped', { timestamp: new Date() });
  }

  /**
   * Main update function
   */
  private update(): void {
    // Update active charging sessions
    this.updateChargingSessions();

    // Check for vehicles that need charging
    this.checkVehiclesNeedingCharge();

    // Update battery health
    this.updateBatteryHealth();

    // Emit status update
    this.emit('update', {
      activeSessions: this.activeSessions.size,
      totalVehicles: this.vehicles.size,
      availableStations: this.getAvailableStations().length,
      timestamp: new Date()
    });
  }

  /**
   * Update all active charging sessions
   */
  private updateChargingSessions(): void {
    this.activeSessions.forEach(session => {
      const vehicle = this.vehicles.get(session.vehicleId);
      const station = this.stations.get(session.stationId);

      if (!vehicle || !station) {
        this.endChargingSession(session.id, 'error');
        return;
      }

      // Calculate charge added this interval (in seconds)
      const intervalSeconds = this.config.updateIntervalMs / 1000;
      const chargeRateKwh = station.powerKw * (vehicle.chargingEfficiency || 0.90);
      const chargeAddedKwh = (chargeRateKwh / 3600) * intervalSeconds;
      const chargeAddedPercent = (chargeAddedKwh / vehicle.batteryCapacity) * 100;

      // Update vehicle charge
      vehicle.currentCharge = Math.min(100, vehicle.currentCharge + chargeAddedPercent);

      // Update session
      session.energyDelivered += chargeAddedKwh;
      session.currentCharge = vehicle.currentCharge;
      session.cost = this.calculateChargingCost(session.energyDelivered, station.pricePerKwh);

      this.emit('charging-progress', {
        sessionId: session.id,
        vehicleId: vehicle.id,
        currentCharge: vehicle.currentCharge,
        energyDelivered: session.energyDelivered,
        cost: session.cost,
        estimatedTimeRemaining: this.estimateTimeRemaining(vehicle, station)
      });

      // Check if charging complete
      if (vehicle.currentCharge >= 95 || vehicle.currentCharge >= session.targetCharge) {
        this.endChargingSession(session.id, 'complete');
      }
    });
  }

  /**
   * Check which vehicles need charging and start sessions
   */
  private checkVehiclesNeedingCharge(): void {
    // Don't start new sessions if at max capacity
    if (this.activeSessions.size >= this.config.maxConcurrentSessions) {
      return;
    }

    this.vehicles.forEach(vehicle => {
      // Skip if already charging
      if (this.isVehicleCharging(vehicle.id)) {
        return;
      }

      // Check if vehicle needs charging (below 30% or randomly if below 60%)
      const needsCharging =
        vehicle.currentCharge < 30 ||
        (vehicle.currentCharge < 60 && Math.random() < 0.05); // 5% chance per interval

      if (needsCharging) {
        this.startChargingSession(vehicle.id);
      }
    });
  }

  /**
   * Start a charging session
   */
  private startChargingSession(vehicleId: string): void {
    const vehicle = this.vehicles.get(vehicleId);
    if (!vehicle) return;

    // Find available station
    const availableStations = this.getAvailableStations();
    if (availableStations.length === 0) {
      this.emit('no-stations-available', { vehicleId, timestamp: new Date() });
      return;
    }

    // Select station (prefer fast chargers for low battery)
    const station = vehicle.currentCharge < 20
      ? this.selectFastestStation(availableStations)
      : this.selectCheapestStation(availableStations);

    const sessionId = `charging-${Date.now()}-${vehicleId}`;
    const session: EVChargingSession = {
      id: sessionId,
      vehicleId: vehicleId,
      stationId: station.id,
      stationName: station.name,
      stationType: station.type,
      startTime: new Date(),
      startCharge: vehicle.currentCharge,
      currentCharge: vehicle.currentCharge,
      targetCharge: this.selectTargetCharge(vehicle.currentCharge),
      energyDelivered: 0,
      cost: 0,
      powerKw: station.powerKw,
      pricePerKwh: station.pricePerKwh,
      status: 'charging'
    };

    this.activeSessions.set(sessionId, session);
    station.inUse = true;

    this.emit('charging-started', {
      session,
      vehicle,
      station,
      timestamp: new Date()
    });
  }

  /**
   * End a charging session
   */
  private endChargingSession(sessionId: string, reason: 'complete' | 'error' | 'user_stopped' | 'emulator_stopped'): void {
    const session = this.activeSessions.get(sessionId);
    if (!session) return;

    const station = this.stations.get(session.stationId);
    if (station) {
      station.inUse = false;
    }

    session.endTime = new Date();
    session.status = reason === 'complete' ? 'completed' : 'interrupted';

    // Calculate session duration
    const durationMs = session.endTime.getTime() - session.startTime.getTime();
    session.duration = Math.floor(durationMs / 1000); // seconds

    this.emit('charging-complete', {
      session,
      reason,
      finalCharge: session.currentCharge,
      totalEnergy: session.energyDelivered,
      totalCost: session.cost,
      duration: session.duration,
      timestamp: new Date()
    });

    this.activeSessions.delete(sessionId);
  }

  /**
   * Update battery health for all vehicles
   */
  private updateBatteryHealth(): void {
    const yearlyDegradation = this.config.batteryDegradationRate;
    const intervalHours = this.config.updateIntervalMs / (1000 * 60 * 60);
    const degradationThisInterval = (yearlyDegradation / (365 * 24)) * intervalHours;

    this.vehicles.forEach(vehicle => {
      // Battery health degrades over time
      vehicle.batteryHealth = Math.max(70, vehicle.batteryHealth - degradationThisInterval);

      // Fast charging degrades battery faster
      if (this.isVehicleFastCharging(vehicle.id)) {
        vehicle.batteryHealth -= degradationThisInterval * 0.5; // 50% additional degradation
      }

      // Emit battery health warning if below threshold
      if (vehicle.batteryHealth < 80 && Math.random() < 0.01) {
        this.emit('battery-health-warning', {
          vehicleId: vehicle.id,
          batteryHealth: vehicle.batteryHealth,
          recommendation: 'Schedule battery inspection',
          timestamp: new Date()
        });
      }
    });
  }

  /**
   * Helper: Check if vehicle is currently charging
   */
  private isVehicleCharging(vehicleId: string): boolean {
    for (const session of this.activeSessions.values()) {
      if (session.vehicleId === vehicleId) {
        return true;
      }
    }
    return false;
  }

  /**
   * Helper: Check if vehicle is fast charging
   */
  private isVehicleFastCharging(vehicleId: string): boolean {
    for (const session of this.activeSessions.values()) {
      if (session.vehicleId === vehicleId && session.powerKw > 50) {
        return true;
      }
    }
    return false;
  }

  /**
   * Helper: Get available charging stations
   */
  private getAvailableStations(): ChargingStation[] {
    return Array.from(this.stations.values()).filter(station => !station.inUse);
  }

  /**
   * Helper: Select fastest available station
   */
  private selectFastestStation(stations: ChargingStation[]): ChargingStation {
    return stations.reduce((fastest, station) =>
      station.powerKw > fastest.powerKw ? station : fastest
    );
  }

  /**
   * Helper: Select cheapest available station
   */
  private selectCheapestStation(stations: ChargingStation[]): ChargingStation {
    return stations.reduce((cheapest, station) =>
      station.pricePerKwh < cheapest.pricePerKwh ? station : cheapest
    );
  }

  /**
   * Helper: Select target charge percentage
   */
  private selectTargetCharge(currentCharge: number): number {
    if (currentCharge < 20) return 90; // Low battery: charge to 90%
    if (currentCharge < 50) return 80; // Medium battery: charge to 80%
    return 70; // High battery: top up to 70%
  }

  /**
   * Helper: Estimate time remaining for charging session
   */
  private estimateTimeRemaining(vehicle: Vehicle, station: ChargingStation): number {
    const chargeNeeded = 100 - vehicle.currentCharge;
    const energyNeeded = (chargeNeeded / 100) * vehicle.batteryCapacity;
    const chargeRateKwh = station.powerKw * (vehicle.chargingEfficiency || 0.90);
    return Math.ceil((energyNeeded / chargeRateKwh) * 60); // minutes
  }

  /**
   * Helper: Calculate charging cost
   */
  private calculateChargingCost(energyKwh: number, pricePerKwh: number): number {
    return parseFloat((energyKwh * pricePerKwh).toFixed(2));
  }

  /**
   * Manually discharge vehicle battery (for testing)
   */
  dischargeVehicle(vehicleId: string, percent: number): void {
    const vehicle = this.vehicles.get(vehicleId);
    if (vehicle) {
      vehicle.currentCharge = Math.max(0, vehicle.currentCharge - percent);
      this.emit('vehicle-discharged', { vehicleId, newCharge: vehicle.currentCharge });
    }
  }

  /**
   * Get current status
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      activeSessions: Array.from(this.activeSessions.values()),
      vehicles: Array.from(this.vehicles.values()),
      stations: Array.from(this.stations.values()),
      availableStations: this.getAvailableStations().length,
      utilizationRate: (this.activeSessions.size / this.config.maxConcurrentSessions) * 100
    };
  }
}
