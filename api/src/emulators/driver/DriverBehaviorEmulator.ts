/**
 * DriverBehaviorEmulator - Driving patterns and safety scoring
 */

import { EventEmitter } from 'events'
import { Vehicle, DriverBehaviorEvent, EmulatorConfig, Location } from '../types'

export class DriverBehaviorEmulator extends EventEmitter {
  private vehicle: Vehicle
  private config: EmulatorConfig
  private isRunning: boolean = false
  private isPaused: boolean = false
  private updateInterval: NodeJS.Timeout | null = null

  private currentSpeed: number = 0
  private driverScore: number = 100
  private events: DriverBehaviorEvent[] = []

  constructor(vehicle: Vehicle, config: EmulatorConfig) {
    super()
    this.vehicle = vehicle
    this.config = config
  }

  public async start(): Promise<void> {
    if (this.isRunning) return
    this.isRunning = true
    this.isPaused = false

    this.updateInterval = setInterval(() => {
      if (!this.isPaused) {
        this.checkBehavior()
      }
    }, 10000) // Check every 10 seconds

    console.log(`Driver Behavior Emulator started for vehicle ${this.vehicle.id}`)
  }

  public async stop(): Promise<void> {
    if (this.updateInterval) {
      clearInterval(this.updateInterval)
      this.updateInterval = null
    }
    this.isRunning = false
  }

  public async pause(): Promise<void> { this.isPaused = true }
  public async resume(): Promise<void> { this.isPaused = false }

  public updateSpeed(speed: number): void {
    const previousSpeed = this.currentSpeed
    this.currentSpeed = speed

    // Check for hard acceleration/braking
    const speedChange = speed - previousSpeed
    if (speedChange > 15) {
      this.generateEvent('hardAcceleration', 'medium')
    } else if (speedChange < -15) {
      this.generateEvent('hardBraking', 'medium')
    }
  }

  private checkBehavior(): void {
    const behavior = this.vehicle.driverBehavior

    // Generate events based on driver behavior profile
    if (behavior === 'aggressive') {
      if (Math.random() < 0.3) this.generateEvent('speeding', 'high')
      if (Math.random() < 0.2) this.generateEvent('hardBraking', 'medium')
      if (Math.random() < 0.2) this.generateEvent('hardAcceleration', 'medium')
    } else if (behavior === 'normal') {
      if (Math.random() < 0.05) this.generateEvent('speeding', 'low')
      if (Math.random() < 0.03) this.generateEvent('idling', 'low')
    } else if (behavior === 'cautious') {
      if (Math.random() < 0.01) this.generateEvent('idling', 'low')
    }

    // Random seatbelt/distraction events (very rare)
    if (Math.random() < 0.001) this.generateEvent('seatbeltViolation', 'high')
    if (Math.random() < 0.005) this.generateEvent('distraction', 'medium')
  }

  private generateEvent(
    eventType: 'speeding' | 'hardBraking' | 'hardAcceleration' | 'idling' | 'seatbeltViolation' | 'distraction',
    severity: 'low' | 'medium' | 'high'
  ): void {
    const event: DriverBehaviorEvent = {
      vehicleId: this.vehicle.id,
      timestamp: new Date(),
      eventType,
      severity,
      location: this.getRandomLocation(),
      speed: this.currentSpeed,
      speedLimit: eventType === 'speeding' ? this.currentSpeed - 15 : undefined,
      duration: eventType === 'idling' ? Math.floor(Math.random() * 600) : undefined,
      score: this.calculateEventScore(eventType, severity)
    }

    this.events.push(event)
    this.updateDriverScore(event.score)

    this.emit('data', event)
  }

  private calculateEventScore(eventType: string, severity: string): number {
    const baseScores: Record<string, number> = {
      speeding: -10,
      hardBraking: -8,
      hardAcceleration: -6,
      idling: -3,
      seatbeltViolation: -15,
      distraction: -12
    }

    const severityMultiplier: Record<string, number> = {
      low: 0.5,
      medium: 1.0,
      high: 1.5
    }

    return baseScores[eventType] * severityMultiplier[severity]
  }

  private updateDriverScore(change: number): void {
    this.driverScore = Math.max(0, Math.min(100, this.driverScore + change))
  }

  private getRandomLocation(): Location {
    return {
      lat: this.vehicle.homeBase.lat + (Math.random() - 0.5) * 0.1,
      lng: this.vehicle.homeBase.lng + (Math.random() - 0.5) * 0.1
    }
  }

  public getCurrentState(): any {
    return {
      driverScore: this.driverScore,
      eventCount: this.events.length,
      recentEvents: this.events.slice(-10)
    }
  }
}
