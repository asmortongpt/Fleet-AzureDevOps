/**
 * RouteEmulator - Route planning and traffic simulation
 */

import { EventEmitter } from 'events'
import { Vehicle, Route, EmulatorConfig } from '../types'

export class RouteEmulator extends EventEmitter {
  private vehicle: Vehicle
  private config: EmulatorConfig
  private routes: Map<string, Route>
  private isRunning: boolean = false
  private isPaused: boolean = false

  private currentRoute: Route | null = null
  private trafficLevel: string = 'moderate'

  constructor(vehicle: Vehicle, config: EmulatorConfig, routes: Map<string, Route>) {
    super()
    this.vehicle = vehicle
    this.config = config
    this.routes = routes
  }

  public async start(): Promise<void> {
    if (this.isRunning) return
    this.isRunning = true
    this.isPaused = false

    // Assign random route to vehicle
    const routeArray = Array.from(this.routes.values())
    this.currentRoute = routeArray[Math.floor(Math.random() * routeArray.length)]

    console.log(`Route Emulator started for vehicle ${this.vehicle.id}`)
  }

  public async stop(): Promise<void> {
    this.isRunning = false
  }

  public async pause(): Promise<void> { this.isPaused = true }
  public async resume(): Promise<void> { this.isPaused = false }

  public assignRoute(routeId: string): void {
    const route = this.routes.get(routeId)
    if (route) {
      this.currentRoute = route
      this.emit('data', { vehicleId: this.vehicle.id, route, timestamp: new Date() })
    }
  }

  public setTrafficLevel(level: string): void {
    this.trafficLevel = level
  }

  public getCurrentState(): any {
    return {
      currentRoute: this.currentRoute?.id,
      trafficLevel: this.trafficLevel
    }
  }
}
