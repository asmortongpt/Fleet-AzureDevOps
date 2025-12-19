/**
 * DispatchEmulator Unit Tests
 * Tests for the Dispatch Radio Communication Emulator
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';

import { DispatchEmulator, DispatchTransmission } from '../emulators/DispatchEmulator';

describe('DispatchEmulator', () => {
  let emulator: DispatchEmulator;

  beforeEach(() => {
    emulator = new DispatchEmulator({
      updateIntervalMs: 1000,
      transmissionProbability: 1.0, // 100% for testing
      emergencyProbability: 0.1,
      channels: ['dispatch', 'emergency', 'maintenance', 'operations'],
      maxActiveTransmissions: 50,
      realisticTiming: true
    });
  });

  afterEach(() => {
    if (emulator) {
      emulator.stop();
    }
  });

  describe('Initialization', () => {
    it('should initialize with default configuration', () => {
      const defaultEmulator = new DispatchEmulator();
      expect(defaultEmulator).toBeDefined();
      expect(defaultEmulator.getAllChannels()).toHaveLength(4);
    });

    it('should initialize with custom configuration', () => {
      const customEmulator = new DispatchEmulator({
        updateIntervalMs: 5000,
        transmissionProbability: 0.5,
        emergencyProbability: 0.1
      });
      expect(customEmulator).toBeDefined();
      customEmulator.stop();
    });

    it('should have all required channels initialized', () => {
      const channels = emulator.getAllChannels();
      expect(channels).toHaveLength(4);

      const channelIds = channels.map(c => c.id);
      expect(channelIds).toContain('dispatch');
      expect(channelIds).toContain('emergency');
      expect(channelIds).toContain('maintenance');
      expect(channelIds).toContain('operations');
    });
  });

  describe('Vehicle Registration', () => {
    it('should register a vehicle successfully', () => {
      const vehicle = {
        id: 'vehicle-001',
        unitNumber: 'Unit-101',
        driverId: 'driver-001',
        currentLocation: { lat: 40.7128, lng: -74.0060, address: 'New York, NY' }
      };

      expect(() => emulator.registerVehicle(vehicle)).not.toThrow();

      const vehicleStatus = emulator.getVehicleStatus('vehicle-001');
      expect(vehicleStatus).toBeDefined();
      expect(vehicleStatus?.unitNumber).toBe('Unit-101');
      expect(vehicleStatus?.vehicleId).toBe('vehicle-001');
    });

    it('should throw error when registering vehicle without required fields', () => {
      expect(() => {
        emulator.registerVehicle({ id: '', unitNumber: '' });
      }).toThrow('Vehicle ID and unit number are required');
    });

    it('should add vehicle to dispatch channel', () => {
      const vehicle = {
        id: 'vehicle-002',
        unitNumber: 'Unit-102'
      };

      emulator.registerVehicle(vehicle);

      const dispatchChannel = emulator.getChannelStatus('dispatch');
      expect(dispatchChannel?.activeUnits).toContain('Unit-102');
    });

    it('should register multiple vehicles', () => {
      const vehicles = [
        { id: 'vehicle-001', unitNumber: 'Unit-101' },
        { id: 'vehicle-002', unitNumber: 'Unit-102' },
        { id: 'vehicle-003', unitNumber: 'Unit-103' }
      ];

      vehicles.forEach(v => emulator.registerVehicle(v));

      const dispatchChannel = emulator.getChannelStatus('dispatch');
      expect(dispatchChannel?.activeUnits).toHaveLength(3);
    });
  });

  describe('Transmission Generation', () => {
    beforeEach(() => {
      // Register test vehicles
      emulator.registerVehicle({
        id: 'vehicle-001',
        unitNumber: 'Unit-101',
        currentLocation: { lat: 40.7128, lng: -74.0060 }
      });
    });

    it('should start generating transmissions', (done) => {
      let transmissionReceived = false;

      emulator.on('transmission', (transmission: DispatchTransmission) => {
        transmissionReceived = true;
        expect(transmission).toBeDefined();
        expect(transmission.id).toBeDefined();
        expect(transmission.vehicleId).toBe('vehicle-001');
        expect(transmission.channel).toBeDefined();
        expect(transmission.message).toBeDefined();
        done();
      });

      emulator.start();
    }, 10000);

    it('should generate transmissions with proper structure', (done) => {
      emulator.on('transmission', (transmission: DispatchTransmission) => {
        expect(transmission).toHaveProperty('id');
        expect(transmission).toHaveProperty('vehicleId');
        expect(transmission).toHaveProperty('channel');
        expect(transmission).toHaveProperty('type');
        expect(transmission).toHaveProperty('priority');
        expect(transmission).toHaveProperty('message');
        expect(transmission).toHaveProperty('timestamp');
        expect(transmission).toHaveProperty('duration');
        expect(transmission).toHaveProperty('metadata');
        expect(transmission.metadata).toHaveProperty('signalStrength');
        expect(transmission.metadata).toHaveProperty('batteryLevel');
        expect(transmission.metadata).toHaveProperty('transmission_quality');
        done();
      });

      emulator.start();
    }, 10000);

    it('should generate different types of transmissions', (done) => {
      const types = new Set<string>();
      let count = 0;

      emulator.on('transmission', (transmission: DispatchTransmission) => {
        types.add(transmission.type);
        count++;

        // Check after receiving 10 transmissions
        if (count >= 10) {
          expect(types.size).toBeGreaterThan(1);
          done();
        }
      });

      emulator.start();
    }, 15000);

    it('should validate transmission priorities', (done) => {
      emulator.on('transmission', (transmission: DispatchTransmission) => {
        expect(['low', 'medium', 'high', 'critical']).toContain(transmission.priority);
        done();
      });

      emulator.start();
    }, 10000);

    it('should validate transmission channels', (done) => {
      emulator.on('transmission', (transmission: DispatchTransmission) => {
        expect(['dispatch', 'emergency', 'maintenance', 'operations']).toContain(transmission.channel);
        done();
      });

      emulator.start();
    }, 10000);
  });

  describe('Emergency Transmissions', () => {
    beforeEach(() => {
      emulator.registerVehicle({
        id: 'vehicle-001',
        unitNumber: 'Unit-101',
        currentLocation: { lat: 40.7128, lng: -74.0060 }
      });
    });

    it('should emit emergency-transmission event for critical priority', (done) => {
      emulator.on('emergency-transmission', (transmission: DispatchTransmission) => {
        expect(transmission.priority).toBe('critical');
        expect(transmission.channel).toBe('emergency');
        done();
      });

      emulator.start();
    }, 20000);
  });

  describe('Channel Management', () => {
    it('should switch vehicle channel', () => {
      emulator.registerVehicle({
        id: 'vehicle-001',
        unitNumber: 'Unit-101'
      });

      const result = emulator.switchVehicleChannel('vehicle-001', 'emergency');
      expect(result).toBe(true);

      const vehicleStatus = emulator.getVehicleStatus('vehicle-001');
      expect(vehicleStatus?.currentChannel).toBe('emergency');
    });

    it('should emit channel-switch event', (done) => {
      emulator.registerVehicle({
        id: 'vehicle-001',
        unitNumber: 'Unit-101'
      });

      emulator.on('channel-switch', (data) => {
        expect(data.vehicleId).toBe('vehicle-001');
        expect(data.channel).toBe('maintenance');
        done();
      });

      emulator.switchVehicleChannel('vehicle-001', 'maintenance');
    });

    it('should return false for invalid channel', () => {
      emulator.registerVehicle({
        id: 'vehicle-001',
        unitNumber: 'Unit-101'
      });

      const result = emulator.switchVehicleChannel('vehicle-001', 'invalid' as any);
      expect(result).toBe(false);
    });

    it('should update active units when switching channels', () => {
      emulator.registerVehicle({
        id: 'vehicle-001',
        unitNumber: 'Unit-101'
      });

      emulator.switchVehicleChannel('vehicle-001', 'emergency');

      const dispatchChannel = emulator.getChannelStatus('dispatch');
      const emergencyChannel = emulator.getChannelStatus('emergency');

      expect(dispatchChannel?.activeUnits).not.toContain('Unit-101');
      expect(emergencyChannel?.activeUnits).toContain('Unit-101');
    });
  });

  describe('Transmission Acknowledgment', () => {
    it('should acknowledge a transmission', (done) => {
      emulator.registerVehicle({
        id: 'vehicle-001',
        unitNumber: 'Unit-101'
      });

      emulator.on('transmission', (transmission: DispatchTransmission) => {
        const result = emulator.acknowledgeTransmission(transmission.id);
        expect(result).toBe(true);
        done();
      });

      emulator.start();
    }, 10000);

    it('should emit transmission-acknowledged event', (done) => {
      emulator.registerVehicle({
        id: 'vehicle-001',
        unitNumber: 'Unit-101'
      });

      let transmissionId: string;

      emulator.on('transmission', (transmission: DispatchTransmission) => {
        transmissionId = transmission.id;
        emulator.acknowledgeTransmission(transmissionId);
      });

      emulator.on('transmission-acknowledged', (transmission: DispatchTransmission) => {
        expect(transmission.acknowledged).toBe(true);
        done();
      });

      emulator.start();
    }, 10000);

    it('should return false for non-existent transmission', () => {
      const result = emulator.acknowledgeTransmission('non-existent-id');
      expect(result).toBe(false);
    });
  });

  describe('State Management', () => {
    it('should start successfully', () => {
      expect(() => emulator.start()).not.toThrow();
      const state = emulator.getCurrentState();
      expect(state.isRunning).toBe(true);
    });

    it('should stop successfully', () => {
      emulator.start();
      expect(() => emulator.stop()).not.toThrow();
      const state = emulator.getCurrentState();
      expect(state.isRunning).toBe(false);
    });

    it('should pause successfully', () => {
      emulator.start();
      expect(() => emulator.pause()).not.toThrow();
    });

    it('should resume successfully', () => {
      emulator.start();
      emulator.pause();
      expect(() => emulator.resume()).not.toThrow();
    });

    it('should emit started event', (done) => {
      emulator.on('started', () => {
        done();
      });
      emulator.start();
    });

    it('should emit stopped event', (done) => {
      emulator.on('stopped', () => {
        done();
      });
      emulator.start();
      emulator.stop();
    });
  });

  describe('Transmission History', () => {
    beforeEach(() => {
      emulator.registerVehicle({
        id: 'vehicle-001',
        unitNumber: 'Unit-101'
      });
    });

    it('should store transmission history', (done) => {
      let count = 0;

      emulator.on('transmission', () => {
        count++;
        if (count >= 5) {
          const history = emulator.getTransmissionHistory();
          expect(history.length).toBeGreaterThanOrEqual(5);
          done();
        }
      });

      emulator.start();
    }, 15000);

    it('should limit transmission history', (done) => {
      emulator.on('transmission', () => {
        const history = emulator.getTransmissionHistory(10);
        expect(history.length).toBeLessThanOrEqual(10);
        done();
      });

      emulator.start();
    }, 10000);

    it('should return active transmissions', (done) => {
      emulator.on('transmission', () => {
        const active = emulator.getActiveTransmissions();
        expect(Array.isArray(active)).toBe(true);
        expect(active.length).toBeGreaterThan(0);
        done();
      });

      emulator.start();
    }, 10000);
  });

  describe('Current State', () => {
    it('should return current state', () => {
      const state = emulator.getCurrentState();
      expect(state).toHaveProperty('isRunning');
      expect(state).toHaveProperty('emergencyActive');
      expect(state).toHaveProperty('activeVehicles');
      expect(state).toHaveProperty('activeTransmissions');
      expect(state).toHaveProperty('channels');
      expect(state).toHaveProperty('recentTransmissions');
    });

    it('should reflect correct running state', () => {
      let state = emulator.getCurrentState();
      expect(state.isRunning).toBe(false);

      emulator.start();
      state = emulator.getCurrentState();
      expect(state.isRunning).toBe(true);

      emulator.stop();
      state = emulator.getCurrentState();
      expect(state.isRunning).toBe(false);
    });

    it('should show active vehicles count', () => {
      emulator.registerVehicle({ id: 'v1', unitNumber: 'U1' });
      emulator.registerVehicle({ id: 'v2', unitNumber: 'U2' });

      const state = emulator.getCurrentState();
      expect(state.activeVehicles).toBe(2);
    });
  });

  describe('Message Quality', () => {
    beforeEach(() => {
      emulator.registerVehicle({
        id: 'vehicle-001',
        unitNumber: 'Unit-101'
      });
    });

    it('should have valid transmission quality', (done) => {
      emulator.on('transmission', (transmission: DispatchTransmission) => {
        expect(['clear', 'static', 'weak', 'broken']).toContain(
          transmission.metadata.transmission_quality
        );
        done();
      });

      emulator.start();
    }, 10000);

    it('should have valid signal strength', (done) => {
      emulator.on('transmission', (transmission: DispatchTransmission) => {
        expect(transmission.metadata.signalStrength).toBeGreaterThanOrEqual(0);
        expect(transmission.metadata.signalStrength).toBeLessThanOrEqual(100);
        done();
      });

      emulator.start();
    }, 10000);

    it('should have valid battery level', (done) => {
      emulator.on('transmission', (transmission: DispatchTransmission) => {
        expect(transmission.metadata.batteryLevel).toBeGreaterThanOrEqual(0);
        expect(transmission.metadata.batteryLevel).toBeLessThanOrEqual(100);
        done();
      });

      emulator.start();
    }, 10000);
  });

  describe('Realistic Radio Chatter', () => {
    beforeEach(() => {
      emulator.registerVehicle({
        id: 'vehicle-001',
        unitNumber: 'Unit-101',
        currentLocation: { lat: 40.7128, lng: -74.0060 }
      });
    });

    it('should generate messages with unit numbers', (done) => {
      emulator.on('transmission', (transmission: DispatchTransmission) => {
        expect(transmission.message).toContain('Unit-101');
        done();
      });

      emulator.start();
    }, 10000);

    it('should calculate realistic transmission duration', (done) => {
      emulator.on('transmission', (transmission: DispatchTransmission) => {
        expect(transmission.duration).toBeGreaterThan(0);
        expect(transmission.duration).toBeLessThan(60); // Less than 60 seconds
        done();
      });

      emulator.start();
    }, 10000);

    it('should have proper message structure for different types', (done) => {
      const messages: string[] = [];

      emulator.on('transmission', (transmission: DispatchTransmission) => {
        messages.push(transmission.message);

        if (messages.length >= 10) {
          // Check that messages are varied
          const uniqueMessages = new Set(messages);
          expect(uniqueMessages.size).toBeGreaterThan(1);
          done();
        }
      });

      emulator.start();
    }, 15000);
  });

  describe('Security and Validation', () => {
    it('should generate secure transmission IDs', (done) => {
      const ids = new Set<string>();

      emulator.registerVehicle({
        id: 'vehicle-001',
        unitNumber: 'Unit-101'
      });

      emulator.on('transmission', (transmission: DispatchTransmission) => {
        ids.add(transmission.id);

        if (ids.size >= 5) {
          // All IDs should be unique
          expect(ids.size).toBe(5);
          done();
        }
      });

      emulator.start();
    }, 15000);

    it('should have properly formatted timestamps', (done) => {
      emulator.registerVehicle({
        id: 'vehicle-001',
        unitNumber: 'Unit-101'
      });

      emulator.on('transmission', (transmission: DispatchTransmission) => {
        expect(transmission.timestamp).toBeInstanceOf(Date);
        expect(transmission.timestamp.getTime()).toBeLessThanOrEqual(Date.now());
        done();
      });

      emulator.start();
    }, 10000);
  });
});
