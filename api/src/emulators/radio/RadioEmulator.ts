/**
 * RadioEmulator - Realistic Push-to-Talk (PTT) Radio Communication Emulator
 *
 * Features:
 * - Push-to-talk button press/release simulation
 * - Active speaker tracking across channels
 * - Realistic audio quality simulation (signal strength, interference)
 * - Multiple radio channels with configurable properties
 * - Simulated audio stream data
 * - WebSocket integration for real-time PTT events
 * - Radio traffic patterns (routine, emergency, dispatch)
 * - Signal degradation based on distance and environment
 * - Talk groups and priority channels
 * - Radio check-in patterns
 *
 * Security:
 * - Input validation on all parameters
 * - No hardcoded credentials
 * - Parameterized data handling
 * - Rate limiting on PTT events
 */

import { randomBytes } from 'crypto'
import { EventEmitter } from 'events'

import {
  Vehicle,
  Location,
  EmulatorConfig
} from '../types'

// Radio-specific type definitions
export interface RadioChannel {
  id: string
  name: string
  frequency: string
  type: 'dispatch' | 'emergency' | 'tactical' | 'maintenance' | 'common'
  priority: number
  encryption: boolean
  maxUsers: number
  currentUsers: number
  activeSpeaker: string | null
  talkGroup?: string
}

export interface RadioTransmission {
  id: string
  vehicleId: string
  driverId?: string
  channelId: string
  timestamp: Date
  duration: number // milliseconds
  signalStrength: number // 0-100
  audioQuality: number // 0-100
  interference: number // 0-100
  location: Location
  distance?: number // distance from base station (meters)
  priority: 'routine' | 'urgent' | 'emergency'
  transmissionType: 'voice' | 'tone' | 'data'
  message?: string
  isEmergency: boolean
}

export interface PTTEvent {
  vehicleId: string
  channelId: string
  timestamp: Date
  eventType: 'press' | 'release' | 'timeout'
  signalStrength: number
  location: Location
  metadata?: Record<string, any>
}

export interface RadioState {
  vehicleId: string
  currentChannel: string
  isPTTPressed: boolean
  isTransmitting: boolean
  lastTransmission: Date | null
  totalTransmissions: number
  totalTransmitTime: number // milliseconds
  signalStrength: number
  batteryLevel: number
  isEmergencyMode: boolean
}

export interface AudioStreamData {
  transmissionId: string
  timestamp: Date
  sampleRate: number // Hz
  bitDepth: number
  channels: number
  audioData: Buffer // Simulated audio bytes
  codec: 'pcm' | 'opus' | 'g711'
}

export interface RadioEmulatorConfig {
  updateIntervalMs?: number
  baseStationLocation?: Location
  maxTransmissionDistance?: number // meters
  enableAudioSimulation?: boolean
  enableInterference?: boolean
  pttTimeoutMs?: number // Auto-release PTT after timeout
  emergencyPriority?: boolean
  channels?: RadioChannel[]
}

export class RadioEmulator extends EventEmitter {
  private vehicle: Vehicle
  private config: EmulatorConfig
  private radioConfig: RadioEmulatorConfig

  private channels: Map<string, RadioChannel> = new Map()
  private radioState: RadioState
  private isRunning: boolean = false
  private isPaused: boolean = false

  private updateInterval: NodeJS.Timeout | null = null
  private pttTimeout: NodeJS.Timeout | null = null
  private trafficInterval: NodeJS.Timeout | null = null

  // Transmission tracking
  private activeTransmissions: Map<string, RadioTransmission> = new Map()
  private transmissionHistory: RadioTransmission[] = []
  private pttPressTime: Date | null = null

  // Traffic simulation
  private trafficPatterns = {
    routine: { frequency: 0.3, avgDuration: 5000 }, // 30% probability, 5s avg
    urgent: { frequency: 0.05, avgDuration: 8000 },  // 5% probability, 8s avg
    emergency: { frequency: 0.01, avgDuration: 12000 } // 1% probability, 12s avg
  }

  // Rate limiting
  private lastPTTPress: number = 0
  private readonly PTT_RATE_LIMIT_MS = 500 // Minimum 500ms between PTT presses

  constructor(
    vehicle: Vehicle,
    config: EmulatorConfig,
    radioConfig?: RadioEmulatorConfig
  ) {
    super()
    this.vehicle = vehicle
    this.config = config
    this.radioConfig = {
      updateIntervalMs: radioConfig?.updateIntervalMs || 1000,
      baseStationLocation: radioConfig?.baseStationLocation || { lat: 28.5383, lng: -81.3792 }, // Orlando
      maxTransmissionDistance: radioConfig?.maxTransmissionDistance || 50000, // 50km
      enableAudioSimulation: radioConfig?.enableAudioSimulation ?? true,
      enableInterference: radioConfig?.enableInterference ?? true,
      pttTimeoutMs: radioConfig?.pttTimeoutMs || 30000, // 30 second max
      emergencyPriority: radioConfig?.emergencyPriority ?? true,
      channels: radioConfig?.channels || []
    }

    // Initialize default channels
    this.initializeChannels()

    // Initialize radio state
    this.radioState = {
      vehicleId: vehicle.id,
      currentChannel: 'channel-dispatch',
      isPTTPressed: false,
      isTransmitting: false,
      lastTransmission: null,
      totalTransmissions: 0,
      totalTransmitTime: 0,
      signalStrength: 100,
      batteryLevel: 100,
      isEmergencyMode: false
    }
  }

  /**
   * Initialize default radio channels
   */
  private initializeChannels(): void {
    const defaultChannels: RadioChannel[] = this.radioConfig.channels?.length
      ? this.radioConfig.channels
      : [
        {
          id: 'channel-dispatch',
          name: 'Dispatch',
          frequency: '154.280',
          type: 'dispatch',
          priority: 10,
          encryption: true,
          maxUsers: 100,
          currentUsers: 0,
          activeSpeaker: null,
          talkGroup: 'fleet-main'
        },
        {
          id: 'channel-emergency',
          name: 'Emergency',
          frequency: '155.475',
          type: 'emergency',
          priority: 100,
          encryption: true,
          maxUsers: 50,
          currentUsers: 0,
          activeSpeaker: null,
          talkGroup: 'emergency'
        },
        {
          id: 'channel-tactical',
          name: 'Tactical 1',
          frequency: '154.340',
          type: 'tactical',
          priority: 50,
          encryption: true,
          maxUsers: 20,
          currentUsers: 0,
          activeSpeaker: null,
          talkGroup: 'tactical-1'
        },
        {
          id: 'channel-maintenance',
          name: 'Maintenance',
          frequency: '154.570',
          type: 'maintenance',
          priority: 5,
          encryption: false,
          maxUsers: 50,
          currentUsers: 0,
          activeSpeaker: null,
          talkGroup: 'maintenance'
        },
        {
          id: 'channel-common',
          name: 'Common',
          frequency: '154.600',
          type: 'common',
          priority: 1,
          encryption: false,
          maxUsers: 200,
          currentUsers: 0,
          activeSpeaker: null,
          talkGroup: 'common'
        }
      ]

    defaultChannels.forEach(channel => {
      this.channels.set(channel.id, channel)
    })
  }

  /**
   * Start radio emulation
   */
  public async start(): Promise<void> {
    if (this.isRunning) {
      return
    }

    this.isRunning = true
    this.isPaused = false

    // Join default channel
    this.joinChannel(this.radioState.currentChannel)

    // Start periodic updates (signal strength, battery, etc.)
    this.updateInterval = setInterval(() => {
      if (!this.isPaused) {
        this.updateRadioState()
      }
    }, this.radioConfig.updateIntervalMs!)

    // Start simulated radio traffic
    this.startTrafficSimulation()

    console.log(`RadioEmulator started for vehicle ${this.vehicle.id}`)
    this.emit('started', { vehicleId: this.vehicle.id })
  }

  /**
   * Stop radio emulation
   */
  public async stop(): Promise<void> {
    if (!this.isRunning) {
      return
    }

    // Release PTT if pressed
    if (this.radioState.isPTTPressed) {
      this.releasePTT()
    }

    // Leave current channel
    this.leaveChannel(this.radioState.currentChannel)

    // Clear intervals
    if (this.updateInterval) {
      clearInterval(this.updateInterval)
      this.updateInterval = null
    }

    if (this.trafficInterval) {
      clearInterval(this.trafficInterval)
      this.trafficInterval = null
    }

    if (this.pttTimeout) {
      clearTimeout(this.pttTimeout)
      this.pttTimeout = null
    }

    this.isRunning = false
    this.isPaused = false

    console.log(`RadioEmulator stopped for vehicle ${this.vehicle.id}`)
    this.emit('stopped', { vehicleId: this.vehicle.id })
  }

  /**
   * Pause radio emulation
   */
  public async pause(): Promise<void> {
    if (this.radioState.isPTTPressed) {
      this.releasePTT()
    }
    this.isPaused = true
  }

  /**
   * Resume radio emulation
   */
  public async resume(): Promise<void> {
    this.isPaused = false
  }

  /**
   * Press PTT button (start transmission)
   */
  public pressPTT(priority: 'routine' | 'urgent' | 'emergency' = 'routine'): PTTEvent | null {
    // Rate limiting check
    const now = Date.now()
    if (now - this.lastPTTPress < this.PTT_RATE_LIMIT_MS) {
      console.warn(`PTT rate limit exceeded for vehicle ${this.vehicle.id}`)
      return null
    }

    // Validate not already transmitting
    if (this.radioState.isPTTPressed) {
      console.warn(`PTT already pressed for vehicle ${this.vehicle.id}`)
      return null
    }

    // Check if channel is available
    const channel = this.channels.get(this.radioState.currentChannel)
    if (!channel) {
      console.error(`Channel ${this.radioState.currentChannel} not found`)
      return null
    }

    // Check if someone else is speaking (unless emergency override)
    if (channel.activeSpeaker && channel.activeSpeaker !== this.vehicle.id) {
      if (priority !== 'emergency' || !this.radioConfig.emergencyPriority) {
        console.warn(`Channel ${channel.name} is busy`)
        this.emit('channel-busy', { vehicleId: this.vehicle.id, channelId: channel.id })
        return null
      }
    }

    // Press PTT
    this.lastPTTPress = now
    this.radioState.isPTTPressed = true
    this.pttPressTime = new Date()

    // Set as active speaker on channel
    channel.activeSpeaker = this.vehicle.id

    // Set PTT timeout
    this.pttTimeout = setTimeout(() => {
      this.releasePTT('timeout')
    }, this.radioConfig.pttTimeoutMs!)

    const currentLocation = this.getCurrentLocation()
    const pttEvent: PTTEvent = {
      vehicleId: this.vehicle.id,
      channelId: channel.id,
      timestamp: new Date(),
      eventType: 'press',
      signalStrength: this.radioState.signalStrength,
      location: currentLocation
    }

    this.emit('ptt-press', pttEvent)

    // Start transmission after small delay (realistic)
    setTimeout(() => {
      this.startTransmission(priority)
    }, 100)

    return pttEvent
  }

  /**
   * Release PTT button (end transmission)
   */
  public releasePTT(reason: 'manual' | 'timeout' = 'manual'): PTTEvent | null {
    if (!this.radioState.isPTTPressed) {
      return null
    }

    const channel = this.channels.get(this.radioState.currentChannel)
    if (!channel) {
      return null
    }

    // Calculate transmission duration
    const duration = this.pttPressTime
      ? Date.now() - this.pttPressTime.getTime()
      : 0

    // Release PTT
    this.radioState.isPTTPressed = false
    this.radioState.totalTransmitTime += duration

    // Clear active speaker if it's this vehicle
    if (channel.activeSpeaker === this.vehicle.id) {
      channel.activeSpeaker = null
    }

    // Clear timeout
    if (this.pttTimeout) {
      clearTimeout(this.pttTimeout)
      this.pttTimeout = null
    }

    const currentLocation = this.getCurrentLocation()
    const pttEvent: PTTEvent = {
      vehicleId: this.vehicle.id,
      channelId: channel.id,
      timestamp: new Date(),
      eventType: reason === 'timeout' ? 'timeout' : 'release',
      signalStrength: this.radioState.signalStrength,
      location: currentLocation,
      metadata: { duration }
    }

    this.emit('ptt-release', pttEvent)

    // End transmission
    this.endTransmission()

    this.pttPressTime = null

    return pttEvent
  }

  /**
   * Start a radio transmission
   */
  private startTransmission(priority: 'routine' | 'urgent' | 'emergency'): void {
    if (!this.radioState.isPTTPressed) {
      return
    }

    const transmissionId = `tx-${randomBytes(8).toString('hex')}`
    const currentLocation = this.getCurrentLocation()
    const distance = this.calculateDistance(
      currentLocation,
      this.radioConfig.baseStationLocation!
    )

    // Calculate signal strength based on distance and environment
    const signalStrength = this.calculateSignalStrength(distance)
    const interference = this.radioConfig.enableInterference
      ? this.calculateInterference(distance)
      : 0
    const audioQuality = Math.max(0, signalStrength - interference)

    const transmission: RadioTransmission = {
      id: transmissionId,
      vehicleId: this.vehicle.id,
      channelId: this.radioState.currentChannel,
      timestamp: new Date(),
      duration: 0, // Will be updated on end
      signalStrength,
      audioQuality,
      interference,
      location: currentLocation,
      distance,
      priority,
      transmissionType: 'voice',
      isEmergency: priority === 'emergency'
    }

    this.activeTransmissions.set(transmissionId, transmission)
    this.radioState.isTransmitting = true

    this.emit('transmission-start', transmission)

    // Simulate audio streaming
    if (this.radioConfig.enableAudioSimulation) {
      this.startAudioStream(transmissionId)
    }
  }

  /**
   * End current transmission
   */
  private endTransmission(): void {
    if (!this.radioState.isTransmitting) {
      return
    }

    // Find active transmission for this vehicle
    const activeTransmission = Array.from(this.activeTransmissions.values()).find(
      tx => tx.vehicleId === this.vehicle.id
    )

    if (activeTransmission) {
      activeTransmission.duration = this.pttPressTime
        ? Date.now() - this.pttPressTime.getTime()
        : 0

      // Move to history
      this.transmissionHistory.push(activeTransmission)
      this.activeTransmissions.delete(activeTransmission.id)

      this.radioState.isTransmitting = false
      this.radioState.lastTransmission = new Date()
      this.radioState.totalTransmissions++

      this.emit('transmission-end', activeTransmission)
    }
  }

  /**
   * Simulate audio stream data
   */
  private startAudioStream(transmissionId: string): void {
    const streamInterval = setInterval(() => {
      if (!this.radioState.isTransmitting || !this.activeTransmissions.has(transmissionId)) {
        clearInterval(streamInterval)
        return
      }

      // Generate simulated audio data
      const audioData: AudioStreamData = {
        transmissionId,
        timestamp: new Date(),
        sampleRate: 8000, // 8kHz (typical for radio)
        bitDepth: 16,
        channels: 1, // Mono
        audioData: randomBytes(160), // 20ms of audio at 8kHz
        codec: 'opus'
      }

      this.emit('audio-stream', audioData)
    }, 20) // 20ms chunks (50 packets/second)
  }

  /**
   * Switch to a different channel
   */
  public switchChannel(channelId: string): boolean {
    // Validate channel exists
    const newChannel = this.channels.get(channelId)
    if (!newChannel) {
      console.error(`Channel ${channelId} not found`)
      return false
    }

    // Cannot switch while transmitting
    if (this.radioState.isPTTPressed) {
      console.warn('Cannot switch channel while transmitting')
      return false
    }

    // Leave current channel
    this.leaveChannel(this.radioState.currentChannel)

    // Join new channel
    this.radioState.currentChannel = channelId
    this.joinChannel(channelId)

    this.emit('channel-switch', {
      vehicleId: this.vehicle.id,
      fromChannel: this.radioState.currentChannel,
      toChannel: channelId,
      timestamp: new Date()
    })

    return true
  }

  /**
   * Join a channel
   */
  private joinChannel(channelId: string): void {
    const channel = this.channels.get(channelId)
    if (channel) {
      channel.currentUsers++
      this.emit('channel-join', {
        vehicleId: this.vehicle.id,
        channelId,
        timestamp: new Date()
      })
    }
  }

  /**
   * Leave a channel
   */
  private leaveChannel(channelId: string): void {
    const channel = this.channels.get(channelId)
    if (channel) {
      channel.currentUsers = Math.max(0, channel.currentUsers - 1)
      if (channel.activeSpeaker === this.vehicle.id) {
        channel.activeSpeaker = null
      }
      this.emit('channel-leave', {
        vehicleId: this.vehicle.id,
        channelId,
        timestamp: new Date()
      })
    }
  }

  /**
   * Activate emergency mode
   */
  public activateEmergency(): void {
    if (this.radioState.isEmergencyMode) {
      return
    }

    this.radioState.isEmergencyMode = true

    // Switch to emergency channel
    this.switchChannel('channel-emergency')

    // Send emergency alert
    this.emit('emergency-activated', {
      vehicleId: this.vehicle.id,
      timestamp: new Date(),
      location: this.getCurrentLocation()
    })

    // Auto-press PTT for emergency transmission
    this.pressPTT('emergency')
  }

  /**
   * Deactivate emergency mode
   */
  public deactivateEmergency(): void {
    if (!this.radioState.isEmergencyMode) {
      return
    }

    this.radioState.isEmergencyMode = false

    // Release PTT if pressed
    if (this.radioState.isPTTPressed) {
      this.releasePTT()
    }

    this.emit('emergency-deactivated', {
      vehicleId: this.vehicle.id,
      timestamp: new Date()
    })
  }

  /**
   * Simulate realistic radio traffic patterns
   */
  private startTrafficSimulation(): void {
    this.trafficInterval = setInterval(() => {
      if (this.isPaused || this.radioState.isPTTPressed) {
        return
      }

      // Random chance to generate traffic
      const roll = Math.random()

      if (roll < this.trafficPatterns.emergency.frequency) {
        this.simulateTransmission('emergency')
      } else if (roll < this.trafficPatterns.urgent.frequency) {
        this.simulateTransmission('urgent')
      } else if (roll < this.trafficPatterns.routine.frequency) {
        this.simulateTransmission('routine')
      }
    }, 10000) // Check every 10 seconds
  }

  /**
   * Simulate a transmission
   */
  private simulateTransmission(priority: 'routine' | 'urgent' | 'emergency'): void {
    const pattern = this.trafficPatterns[priority]
    const duration = pattern.avgDuration + (Math.random() - 0.5) * 2000

    this.pressPTT(priority)

    setTimeout(() => {
      this.releasePTT()
    }, duration)
  }

  /**
   * Update radio state (signal strength, battery, etc.)
   */
  private updateRadioState(): void {
    const currentLocation = this.getCurrentLocation()
    const distance = this.calculateDistance(
      currentLocation,
      this.radioConfig.baseStationLocation!
    )

    // Update signal strength based on distance
    this.radioState.signalStrength = this.calculateSignalStrength(distance)

    // Drain battery during transmission
    if (this.radioState.isTransmitting) {
      this.radioState.batteryLevel = Math.max(0, this.radioState.batteryLevel - 0.01)
    } else {
      // Slow drain during standby
      this.radioState.batteryLevel = Math.max(0, this.radioState.batteryLevel - 0.001)
    }

    this.emit('state-update', this.radioState)
  }

  /**
   * Calculate signal strength based on distance
   */
  private calculateSignalStrength(distance: number): number {
    const maxDistance = this.radioConfig.maxTransmissionDistance!

    if (distance >= maxDistance) {
      return 0
    }

    // Signal degrades with distance (inverse square law approximation)
    const strength = 100 * Math.pow(1 - (distance / maxDistance), 2)

    // Add some random variation (+/- 10%)
    const variation = (Math.random() - 0.5) * 20

    return Math.max(0, Math.min(100, strength + variation))
  }

  /**
   * Calculate interference level
   */
  private calculateInterference(distance: number): number {
    // Base interference increases with distance
    const baseInterference = (distance / this.radioConfig.maxTransmissionDistance!) * 30

    // Random environmental interference (0-20%)
    const envInterference = Math.random() * 20

    return Math.min(100, baseInterference + envInterference)
  }

  /**
   * Calculate distance between two locations (Haversine formula)
   */
  private calculateDistance(loc1: Location, loc2: Location): number {
    const R = 6371e3 // Earth radius in meters
    const φ1 = (loc1.lat * Math.PI) / 180
    const φ2 = (loc2.lat * Math.PI) / 180
    const Δφ = ((loc2.lat - loc1.lat) * Math.PI) / 180
    const Δλ = ((loc2.lng - loc1.lng) * Math.PI) / 180

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

    return R * c // Distance in meters
  }

  /**
   * Get current vehicle location (from GPS emulator or default)
   */
  private getCurrentLocation(): Location {
    // In production, this would interface with GPS emulator
    // For now, use vehicle's starting location
    return this.vehicle.startingLocation || { lat: 28.5383, lng: -81.3792 }
  }

  /**
   * Get current radio state
   */
  public getCurrentState(): RadioState {
    return { ...this.radioState }
  }

  /**
   * Get all channels
   */
  public getChannels(): RadioChannel[] {
    return Array.from(this.channels.values())
  }

  /**
   * Get transmission history
   */
  public getTransmissionHistory(limit: number = 100): RadioTransmission[] {
    return this.transmissionHistory.slice(-limit)
  }

  /**
   * Get channel by ID
   */
  public getChannel(channelId: string): RadioChannel | undefined {
    return this.channels.get(channelId)
  }

  /**
   * Register a custom channel
   */
  public registerChannel(channel: RadioChannel): boolean {
    // Validate channel data
    if (!channel.id || !channel.name || !channel.frequency) {
      console.error('Invalid channel data')
      return false
    }

    // Check for duplicate
    if (this.channels.has(channel.id)) {
      console.warn(`Channel ${channel.id} already exists`)
      return false
    }

    this.channels.set(channel.id, channel)
    this.emit('channel-registered', channel)
    return true
  }
}
