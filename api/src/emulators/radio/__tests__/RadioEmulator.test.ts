/**
 * RadioEmulator Tests
 *
 * Comprehensive test suite for Push-to-Talk radio functionality
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

import { Vehicle, EmulatorConfig } from '../../types'
import { RadioEmulator } from '../RadioEmulator'

describe('RadioEmulator', () => {
  let radioEmulator: RadioEmulator
  let mockVehicle: Vehicle
  let mockConfig: EmulatorConfig

  beforeEach(() => {
    // Mock vehicle configuration
    mockVehicle = {
      id: 'test-vehicle-001',
      make: 'Ford',
      model: 'Transit',
      year: 2023,
      type: 'van',
      vin: 'TEST123456789',
      licensePlate: 'ABC-123',
      tankSize: 25,
      fuelEfficiency: 18,
      startingLocation: { lat: 28.5383, lng: -81.3792 },
      homeBase: { lat: 28.5383, lng: -81.3792, name: 'Orlando HQ' },
      driverBehavior: 'normal',
      features: ['radio', 'ptt', 'gps']
    }

    // Mock emulator config
    mockConfig = {
      emulator: {
        version: '1.0.0',
        name: 'Fleet Emulator',
        description: 'Test'
      },
      timeCompression: {
        enabled: false,
        ratio: 1,
        description: 'Real-time'
      },
      persistence: {
        enabled: false,
        database: 'test',
        redis: { enabled: false, ttl: 3600 }
      },
      realtime: {
        websocket: { enabled: false, port: 8080, path: '/ws' },
        broadcasting: { interval: 1000, batchSize: 100 }
      },
      performance: {
        maxVehicles: 10,
        maxConcurrentEmulators: 50,
        updateInterval: 1000,
        memoryLimit: '1GB'
      }
    }

    // Create emulator instance
    radioEmulator = new RadioEmulator(mockVehicle, mockConfig, {
      updateIntervalMs: 100, // Fast for testing
      enableAudioSimulation: true,
      enableInterference: true,
      pttTimeoutMs: 5000,
      emergencyPriority: true
    })
  })

  afterEach(async () => {
    if (radioEmulator) {
      await radioEmulator.stop()
    }
  })

  describe('Initialization', () => {
    it('should create radio emulator with default channels', () => {
      const channels = radioEmulator.getChannels()
      expect(channels).toBeDefined()
      expect(channels.length).toBeGreaterThan(0)
    })

    it('should initialize with dispatch channel as default', () => {
      const state = radioEmulator.getCurrentState()
      expect(state.currentChannel).toBe('channel-dispatch')
    })

    it('should have all required channels', () => {
      const channels = radioEmulator.getChannels()
      const channelIds = channels.map(c => c.id)

      expect(channelIds).toContain('channel-dispatch')
      expect(channelIds).toContain('channel-emergency')
      expect(channelIds).toContain('channel-tactical')
      expect(channelIds).toContain('channel-maintenance')
      expect(channelIds).toContain('channel-common')
    })

    it('should set correct channel priorities', () => {
      const emergencyChannel = radioEmulator.getChannel('channel-emergency')
      const dispatchChannel = radioEmulator.getChannel('channel-dispatch')
      const commonChannel = radioEmulator.getChannel('channel-common')

      expect(emergencyChannel?.priority).toBeGreaterThan(dispatchChannel?.priority || 0)
      expect(dispatchChannel?.priority).toBeGreaterThan(commonChannel?.priority || 0)
    })
  })

  describe('Start/Stop Operations', () => {
    it('should start emulator successfully', async () => {
      const startedSpy = vi.fn()
      radioEmulator.on('started', startedSpy)

      await radioEmulator.start()

      expect(startedSpy).toHaveBeenCalled()
      expect(startedSpy).toHaveBeenCalledWith({ vehicleId: mockVehicle.id })
    })

    it('should stop emulator successfully', async () => {
      const stoppedSpy = vi.fn()
      radioEmulator.on('stopped', stoppedSpy)

      await radioEmulator.start()
      await radioEmulator.stop()

      expect(stoppedSpy).toHaveBeenCalled()
    })

    it('should not start if already running', async () => {
      await radioEmulator.start()
      await radioEmulator.start() // Second start should be ignored

      const state = radioEmulator.getCurrentState()
      expect(state).toBeDefined()
    })
  })

  describe('PTT Button Operations', () => {
    beforeEach(async () => {
      await radioEmulator.start()
    })

    it('should press PTT button successfully', () => {
      const pttPressSpy = vi.fn()
      radioEmulator.on('ptt-press', pttPressSpy)

      const pttEvent = radioEmulator.pressPTT('routine')

      expect(pttEvent).toBeDefined()
      expect(pttEvent?.eventType).toBe('press')
      expect(pttEvent?.vehicleId).toBe(mockVehicle.id)
      expect(pttPressSpy).toHaveBeenCalled()
    })

    it('should release PTT button successfully', () => {
      const pttReleaseSpy = vi.fn()
      radioEmulator.on('ptt-release', pttReleaseSpy)

      radioEmulator.pressPTT('routine')
      const releaseEvent = radioEmulator.releasePTT('manual')

      expect(releaseEvent).toBeDefined()
      expect(releaseEvent?.eventType).toBe('release')
      expect(pttReleaseSpy).toHaveBeenCalled()
    })

    it('should not allow double PTT press', () => {
      const firstPress = radioEmulator.pressPTT('routine')
      const secondPress = radioEmulator.pressPTT('routine')

      expect(firstPress).toBeDefined()
      expect(secondPress).toBeNull()
    })

    it('should enforce PTT rate limiting', () => {
      radioEmulator.pressPTT('routine')
      radioEmulator.releasePTT('manual')

      // Immediate second press should be rate limited
      const quickPress = radioEmulator.pressPTT('routine')
      expect(quickPress).toBeNull()
    })

    it('should timeout PTT after configured duration', async () => {
      const pttTimeoutSpy = vi.fn()
      radioEmulator.on('ptt-release', pttTimeoutSpy)

      radioEmulator.pressPTT('routine')

      // Wait for timeout
      await new Promise(resolve => setTimeout(resolve, 5500))

      expect(pttTimeoutSpy).toHaveBeenCalled()
      const lastCall = pttTimeoutSpy.mock.calls[pttTimeoutSpy.mock.calls.length - 1][0]
      expect(lastCall.eventType).toBe('timeout')
    })
  })

  describe('Radio Transmission', () => {
    beforeEach(async () => {
      await radioEmulator.start()
    })

    it('should start transmission after PTT press', async () => {
      const transmissionStartSpy = vi.fn()
      radioEmulator.on('transmission-start', transmissionStartSpy)

      radioEmulator.pressPTT('routine')

      // Wait for transmission to start (100ms delay)
      await new Promise(resolve => setTimeout(resolve, 200))

      expect(transmissionStartSpy).toHaveBeenCalled()
      const transmission = transmissionStartSpy.mock.calls[0][0]
      expect(transmission.vehicleId).toBe(mockVehicle.id)
      expect(transmission.priority).toBe('routine')
    })

    it('should end transmission after PTT release', async () => {
      const transmissionEndSpy = vi.fn()
      radioEmulator.on('transmission-end', transmissionEndSpy)

      radioEmulator.pressPTT('routine')
      await new Promise(resolve => setTimeout(resolve, 200))
      radioEmulator.releasePTT('manual')

      expect(transmissionEndSpy).toHaveBeenCalled()
    })

    it('should calculate signal strength correctly', async () => {
      const transmissionStartSpy = vi.fn()
      radioEmulator.on('transmission-start', transmissionStartSpy)

      radioEmulator.pressPTT('routine')
      await new Promise(resolve => setTimeout(resolve, 200))

      const transmission = transmissionStartSpy.mock.calls[0][0]
      expect(transmission.signalStrength).toBeGreaterThanOrEqual(0)
      expect(transmission.signalStrength).toBeLessThanOrEqual(100)
    })

    it('should simulate audio quality degradation', async () => {
      const transmissionStartSpy = vi.fn()
      radioEmulator.on('transmission-start', transmissionStartSpy)

      radioEmulator.pressPTT('routine')
      await new Promise(resolve => setTimeout(resolve, 200))

      const transmission = transmissionStartSpy.mock.calls[0][0]
      expect(transmission.audioQuality).toBeDefined()
      expect(transmission.audioQuality).toBeGreaterThanOrEqual(0)
      expect(transmission.audioQuality).toBeLessThanOrEqual(100)
    })

    it('should mark emergency transmissions correctly', async () => {
      const transmissionStartSpy = vi.fn()
      radioEmulator.on('transmission-start', transmissionStartSpy)

      radioEmulator.pressPTT('emergency')
      await new Promise(resolve => setTimeout(resolve, 200))

      const transmission = transmissionStartSpy.mock.calls[0][0]
      expect(transmission.isEmergency).toBe(true)
      expect(transmission.priority).toBe('emergency')
    })
  })

  describe('Audio Streaming', () => {
    beforeEach(async () => {
      await radioEmulator.start()
    })

    it('should generate audio stream data during transmission', async () => {
      const audioStreamSpy = vi.fn()
      radioEmulator.on('audio-stream', audioStreamSpy)

      radioEmulator.pressPTT('routine')

      // Wait for audio packets
      await new Promise(resolve => setTimeout(resolve, 500))

      expect(audioStreamSpy).toHaveBeenCalled()
      const audioData = audioStreamSpy.mock.calls[0][0]
      expect(audioData.sampleRate).toBe(8000)
      expect(audioData.bitDepth).toBe(16)
      expect(audioData.channels).toBe(1)
      expect(audioData.codec).toBe('opus')
      expect(audioData.audioData).toBeDefined()
    })

    it('should stop audio stream when PTT released', async () => {
      const audioStreamSpy = vi.fn()
      radioEmulator.on('audio-stream', audioStreamSpy)

      radioEmulator.pressPTT('routine')
      await new Promise(resolve => setTimeout(resolve, 300))

      const callCountDuringTransmission = audioStreamSpy.mock.calls.length

      radioEmulator.releasePTT('manual')
      await new Promise(resolve => setTimeout(resolve, 300))

      const callCountAfterRelease = audioStreamSpy.mock.calls.length

      // Should not increase significantly after release
      expect(callCountAfterRelease - callCountDuringTransmission).toBeLessThan(3)
    })
  })

  describe('Channel Management', () => {
    beforeEach(async () => {
      await radioEmulator.start()
    })

    it('should switch channels successfully', () => {
      const channelSwitchSpy = vi.fn()
      radioEmulator.on('channel-switch', channelSwitchSpy)

      const switched = radioEmulator.switchChannel('channel-emergency')

      expect(switched).toBe(true)
      expect(channelSwitchSpy).toHaveBeenCalled()

      const state = radioEmulator.getCurrentState()
      expect(state.currentChannel).toBe('channel-emergency')
    })

    it('should not switch to non-existent channel', () => {
      const switched = radioEmulator.switchChannel('channel-nonexistent')
      expect(switched).toBe(false)
    })

    it('should not switch channel while transmitting', () => {
      radioEmulator.pressPTT('routine')
      const switched = radioEmulator.switchChannel('channel-emergency')

      expect(switched).toBe(false)
      const state = radioEmulator.getCurrentState()
      expect(state.currentChannel).toBe('channel-dispatch')
    })

    it('should join channel on switch', () => {
      const channelJoinSpy = vi.fn()
      radioEmulator.on('channel-join', channelJoinSpy)

      radioEmulator.switchChannel('channel-tactical')

      expect(channelJoinSpy).toHaveBeenCalled()
    })

    it('should leave previous channel on switch', () => {
      const channelLeaveSpy = vi.fn()
      radioEmulator.on('channel-leave', channelLeaveSpy)

      radioEmulator.switchChannel('channel-tactical')

      expect(channelLeaveSpy).toHaveBeenCalled()
    })
  })

  describe('Emergency Mode', () => {
    beforeEach(async () => {
      await radioEmulator.start()
    })

    it('should activate emergency mode', () => {
      const emergencyActivatedSpy = vi.fn()
      radioEmulator.on('emergency-activated', emergencyActivatedSpy)

      radioEmulator.activateEmergency()

      expect(emergencyActivatedSpy).toHaveBeenCalled()

      const state = radioEmulator.getCurrentState()
      expect(state.isEmergencyMode).toBe(true)
      expect(state.currentChannel).toBe('channel-emergency')
    })

    it('should auto-press PTT on emergency activation', async () => {
      const pttPressSpy = vi.fn()
      radioEmulator.on('ptt-press', pttPressSpy)

      radioEmulator.activateEmergency()

      expect(pttPressSpy).toHaveBeenCalled()
    })

    it('should deactivate emergency mode', () => {
      const emergencyDeactivatedSpy = vi.fn()
      radioEmulator.on('emergency-deactivated', emergencyDeactivatedSpy)

      radioEmulator.activateEmergency()
      radioEmulator.deactivateEmergency()

      expect(emergencyDeactivatedSpy).toHaveBeenCalled()

      const state = radioEmulator.getCurrentState()
      expect(state.isEmergencyMode).toBe(false)
    })

    it('should release PTT when deactivating emergency', async () => {
      const pttReleaseSpy = vi.fn()
      radioEmulator.on('ptt-release', pttReleaseSpy)

      radioEmulator.activateEmergency()
      await new Promise(resolve => setTimeout(resolve, 200))
      radioEmulator.deactivateEmergency()

      expect(pttReleaseSpy).toHaveBeenCalled()
    })
  })

  describe('Channel Busy Detection', () => {
    beforeEach(async () => {
      await radioEmulator.start()
    })

    it('should detect channel busy when another speaker is active', () => {
      const channelBusySpy = vi.fn()
      radioEmulator.on('channel-busy', channelBusySpy)

      // Simulate another speaker
      const channel = radioEmulator.getChannel('channel-dispatch')
      if (channel) {
        channel.activeSpeaker = 'other-vehicle-123'
      }

      radioEmulator.pressPTT('routine')

      expect(channelBusySpy).toHaveBeenCalled()
    })

    it('should override busy channel with emergency priority', async () => {
      const transmissionStartSpy = vi.fn()
      radioEmulator.on('transmission-start', transmissionStartSpy)

      // Simulate another speaker
      const channel = radioEmulator.getChannel('channel-dispatch')
      if (channel) {
        channel.activeSpeaker = 'other-vehicle-123'
      }

      radioEmulator.pressPTT('emergency')

      await new Promise(resolve => setTimeout(resolve, 200))

      // Emergency should override
      expect(transmissionStartSpy).toHaveBeenCalled()
    })
  })

  describe('Custom Channel Registration', () => {
    it('should register custom channel', () => {
      const customChannel = {
        id: 'channel-custom',
        name: 'Custom Channel',
        frequency: '156.000',
        type: 'tactical' as const,
        priority: 25,
        encryption: true,
        maxUsers: 10,
        currentUsers: 0,
        activeSpeaker: null
      }

      const registered = radioEmulator.registerChannel(customChannel)
      expect(registered).toBe(true)

      const retrieved = radioEmulator.getChannel('channel-custom')
      expect(retrieved).toBeDefined()
      expect(retrieved?.name).toBe('Custom Channel')
    })

    it('should not register duplicate channel', () => {
      const channel = radioEmulator.getChannel('channel-dispatch')
      if (channel) {
        const registered = radioEmulator.registerChannel(channel)
        expect(registered).toBe(false)
      }
    })

    it('should validate channel data on registration', () => {
      const invalidChannel = {
        id: '',
        name: 'Invalid',
        frequency: '',
        type: 'dispatch' as const,
        priority: 0,
        encryption: false,
        maxUsers: 0,
        currentUsers: 0,
        activeSpeaker: null
      }

      const registered = radioEmulator.registerChannel(invalidChannel)
      expect(registered).toBe(false)
    })
  })

  describe('State Tracking', () => {
    beforeEach(async () => {
      await radioEmulator.start()
    })

    it('should track total transmissions', async () => {
      radioEmulator.pressPTT('routine')
      await new Promise(resolve => setTimeout(resolve, 200))
      radioEmulator.releasePTT('manual')

      // Wait for rate limit
      await new Promise(resolve => setTimeout(resolve, 600))

      radioEmulator.pressPTT('routine')
      await new Promise(resolve => setTimeout(resolve, 200))
      radioEmulator.releasePTT('manual')

      const state = radioEmulator.getCurrentState()
      expect(state.totalTransmissions).toBe(2)
    })

    it('should track total transmit time', async () => {
      radioEmulator.pressPTT('routine')
      await new Promise(resolve => setTimeout(resolve, 500))
      radioEmulator.releasePTT('manual')

      const state = radioEmulator.getCurrentState()
      expect(state.totalTransmitTime).toBeGreaterThan(400)
    })

    it('should track last transmission time', async () => {
      radioEmulator.pressPTT('routine')
      await new Promise(resolve => setTimeout(resolve, 200))
      radioEmulator.releasePTT('manual')

      const state = radioEmulator.getCurrentState()
      expect(state.lastTransmission).toBeDefined()
    })

    it('should update signal strength periodically', async () => {
      const stateUpdateSpy = vi.fn()
      radioEmulator.on('state-update', stateUpdateSpy)

      await new Promise(resolve => setTimeout(resolve, 500))

      expect(stateUpdateSpy).toHaveBeenCalled()
    })
  })

  describe('Transmission History', () => {
    beforeEach(async () => {
      await radioEmulator.start()
    })

    it('should record transmission history', async () => {
      radioEmulator.pressPTT('routine')
      await new Promise(resolve => setTimeout(resolve, 200))
      radioEmulator.releasePTT('manual')

      const history = radioEmulator.getTransmissionHistory()
      expect(history.length).toBe(1)
      expect(history[0].vehicleId).toBe(mockVehicle.id)
    })

    it('should limit history to specified count', async () => {
      // Create multiple transmissions
      for (let i = 0; i < 5; i++) {
        radioEmulator.pressPTT('routine')
        await new Promise(resolve => setTimeout(resolve, 700))
        radioEmulator.releasePTT('manual')
      }

      const history = radioEmulator.getTransmissionHistory(3)
      expect(history.length).toBe(3)
    })
  })
})
