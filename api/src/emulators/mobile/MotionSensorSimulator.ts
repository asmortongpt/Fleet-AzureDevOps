/**
 * MotionSensorSimulator - Simple motion sensor events from mobile devices
 */

import { EventEmitter } from 'events'

export interface MotionEvent {
  vehicle_id: string
  driver_id: string
  event_type: 'harsh_braking' | 'rapid_acceleration' | 'sharp_turn' | 'impact'
  timestamp: Date
  location: { lat: number; lng: number }
  severity: 'low' | 'medium' | 'high'
  g_force: number
  speed_mph: number
}

export class MotionSensorSimulator extends EventEmitter {
  /**
   * Generate a random motion event
   */
  public generateMotionEvent(
    vehicleId: string,
    driverId: string,
    currentSpeed: number,
    location: { lat: number; lng: number }
  ): MotionEvent {
    const eventTypes: MotionEvent['event_type'][] = [
      'harsh_braking',
      'rapid_acceleration',
      'sharp_turn',
      'impact'
    ]

    // Weighted selection (harsh braking most common)
    const rand = Math.random()
    const eventType =
      rand < 0.5
        ? 'harsh_braking'
        : rand < 0.8
        ? 'rapid_acceleration'
        : rand < 0.95
        ? 'sharp_turn'
        : 'impact'

    // Calculate G-force based on event type
    let gForce: number
    let severity: MotionEvent['severity']

    switch (eventType) {
      case 'harsh_braking':
        gForce = Math.random() * 0.6 + 0.4 // 0.4-1.0g
        severity = gForce > 0.8 ? 'high' : gForce > 0.6 ? 'medium' : 'low'
        break
      case 'rapid_acceleration':
        gForce = Math.random() * 0.5 + 0.3 // 0.3-0.8g
        severity = gForce > 0.65 ? 'high' : gForce > 0.5 ? 'medium' : 'low'
        break
      case 'sharp_turn':
        gForce = Math.random() * 0.7 + 0.4 // 0.4-1.1g
        severity = gForce > 0.9 ? 'high' : gForce > 0.7 ? 'medium' : 'low'
        break
      case 'impact':
        gForce = Math.random() * 2.0 + 1.0 // 1.0-3.0g
        severity = gForce > 2.0 ? 'high' : gForce > 1.5 ? 'medium' : 'low'
        break
      default:
        gForce = 0.5
        severity = 'low'
    }

    return {
      vehicle_id: vehicleId,
      driver_id: driverId,
      event_type: eventType,
      timestamp: new Date(),
      location,
      severity,
      g_force: Math.round(gForce * 100) / 100,
      speed_mph: currentSpeed
    }
  }
}
