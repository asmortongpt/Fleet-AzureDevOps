```typescript
// ctaFleetAgent.ts
export class CTAFleetAgent {
  private fleetId: string;
  private status: 'active' | 'inactive' | 'maintenance';
  private location: { lat: number; lng: number };
  private batteryLevel: number;

  constructor(fleetId: string) {
    this.fleetId = fleetId;
    this.status = 'inactive';
    this.location = { lat: 0, lng: 0 };
    this.batteryLevel = 100;
  }

  public getFleetId(): string {
    return this.fleetId;
  }

  public getStatus(): 'active' | 'inactive' | 'maintenance' {
    return this.status;
  }

  public setStatus(status: 'active' | 'inactive' | 'maintenance'): void {
    this.status = status;
  }

  public getLocation(): { lat: number; lng: number } {
    return { ...this.location };
  }

  public updateLocation(lat: number, lng: number): void {
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      throw new Error('Invalid coordinates');
    }
    this.location = { lat, lng };
  }

  public getBatteryLevel(): number {
    return this.batteryLevel;
  }

  public updateBatteryLevel(level: number): void {
    if (level < 0 || level > 100) {
      throw new Error('Battery level must be between 0 and 100');
    }
    this.batteryLevel = level;
  }

  public isOperational(): boolean {
    return this.status === 'active' && this.batteryLevel > 20;
  }
}

// ctaFleetAgent.test.ts
import { CTAFleetAgent } from './ctaFleetAgent';
import { describe, it, expect } from 'vitest';

describe('CTAFleetAgent', () => {
  let agent: CTAFleetAgent;

  beforeEach(() => {
    agent = new CTAFleetAgent('FLEET-001');
  });

  it('should initialize with correct default values', () => {
    expect(agent.getFleetId()).toBe('FLEET-001');
    expect(agent.getStatus()).toBe('inactive');
    expect(agent.getLocation()).toEqual({ lat: 0, lng: 0 });
    expect(agent.getBatteryLevel()).toBe(100);
  });

  it('should update and get status correctly', () => {
    agent.setStatus('active');
    expect(agent.getStatus()).toBe('active');
    agent.setStatus('maintenance');
    expect(agent.getStatus()).toBe('maintenance');
  });

  it('should update and get location correctly', () => {
    agent.updateLocation(40.7128, -74.0060);
    expect(agent.getLocation()).toEqual({ lat: 40.7128, lng: -74.0060 });
  });

  it('should throw error for invalid coordinates', () => {
    expect(() => agent.updateLocation(91, 0)).toThrow('Invalid coordinates');
    expect(() => agent.updateLocation(-91, 0)).toThrow('Invalid coordinates');
    expect(() => agent.updateLocation(0, 181)).toThrow('Invalid coordinates');
    expect(() => agent.updateLocation(0, -181)).toThrow('Invalid coordinates');
  });

  it('should update and get battery level correctly', () => {
    agent.updateBatteryLevel(75);
    expect(agent.getBatteryLevel()).toBe(75);
  });

  it('should throw error for invalid battery level', () => {
    expect(() => agent.updateBatteryLevel(-1)).toThrow('Battery level must be between 0 and 100');
    expect(() => agent.updateBatteryLevel(101)).toThrow('Battery level must be between 0 and 100');
  });

  it('should determine operational status correctly', () => {
    agent.setStatus('active');
    agent.updateBatteryLevel(25);
    expect(agent.isOperational()).toBe(true);

    agent.updateBatteryLevel(20);
    expect(agent.isOperational()).toBe(false);

    agent.setStatus('inactive');
    agent.updateBatteryLevel(100);
    expect(agent.isOperational()).toBe(false);
  });

  it('should return a copy of location object', () => {
    const location = agent.getLocation();
    location.lat = 50;
    expect(agent.getLocation().lat).toBe(0);
  });
});
```
