// src/ctaFleetAgent65.ts
import { randomInt } from 'crypto';

import { Logger } from 'winston';
import * as winston from 'winston';

// Interface for system components to be tested
interface SystemComponent {
  name: string;
  simulateFailure(): void;
  recover(): void;
  isHealthy(): boolean;
}

// Mock system component for testing chaos
class MockDatabase implements SystemComponent {
  name = 'Database';
  private healthy = true;

  simulateFailure(): void {
    this.healthy = false;
    console.log('Database failure simulated');
  }

  recover(): void {
    this.healthy = true;
    console.log('Database recovered');
  }

  isHealthy(): boolean {
    return this.healthy;
  }
}

class MockAPIService implements SystemComponent {
  name = 'API Service';
  private healthy = true;

  simulateFailure(): void {
    this.healthy = false;
    console.log('API Service failure simulated');
  }

  recover(): void {
    this.healthy = true;
    console.log('API Service recovered');
  }

  isHealthy(): boolean {
    return this.healthy;
  }
}

// Chaos Engineering Agent for CTAFleet
export class CTAFleetAgent65 {
  private components: SystemComponent[] = [];
  private logger: Logger;

  constructor() {
    // Initialize logger
    this.logger = winston.createLogger({
      level: 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      ),
      transports: [
        new winston.transports.Console(),
        new winston.transports.File({ filename: 'chaos-agent.log' }),
      ],
    });

    // Register system components
    this.components.push(new MockDatabase());
    this.components.push(new MockAPIService());
  }

  // Run chaos experiment with random failure injection
  async runChaosExperiment(durationSeconds: number, failureProbability: number = 0.3): Promise<void> {
    this.logger.info('Starting chaos experiment', { durationSeconds, failureProbability });

    const endTime = Date.now() + durationSeconds * 1000;
    while (Date.now() < endTime) {
      // Randomly select a component to fail based on probability
      if (Math.random() < failureProbability) {
        const targetComponent = this.components[randomInt(this.components.length)];
        this.logger.info(`Injecting failure into ${targetComponent.name}`);
        targetComponent.simulateFailure();
      }

      // Check system health and recover if needed
      await this.checkAndRecover();

      // Wait for a short interval before next iteration
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // Ensure all components are recovered at the end
    await this.recoverAll();
    this.logger.info('Chaos experiment completed');
  }

  // Check system health and recover unhealthy components
  private async checkAndRecover(): Promise<void> {
    for (const component of this.components) {
      if (!component.isHealthy()) {
        this.logger.warn(`Component ${component.name} is unhealthy, attempting recovery`);
        component.recover();
      }
    }
  }

  // Recover all components
  private async recoverAll(): Promise<void> {
    for (const component of this.components) {
      if (!component.isHealthy()) {
        component.recover();
      }
    }
    this.logger.info('All components recovered');
  }

  // Get current system health status
  getSystemHealth(): Record<string, boolean> {
    const healthStatus: Record<string, boolean> = {};
    for (const component of this.components) {
      healthStatus[component.name] = component.isHealthy();
    }
    return healthStatus;
  }
}

// src/ctaFleetAgent65.test.ts
import { CTAFleetAgent65 } from './ctaFleetAgent65';

import { describe, it, expect, jest } from '@jest/globals';

describe('CTAFleetAgent65 - Chaos Engineering', () => {
  let agent: CTAFleetAgent65;

  beforeEach(() => {
    agent = new CTAFleetAgent65();
    jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should initialize with healthy components', () => {
    const healthStatus = agent.getSystemHealth();
    expect(healthStatus['Database']).toBe(true);
    expect(healthStatus['API Service']).toBe(true);
  });

  it('should run chaos experiment and recover components', async () => {
    // Run a short experiment with high failure probability for testing
    await agent.runChaosExperiment(2, 1.0);

    const healthStatus = agent.getSystemHealth();
    expect(healthStatus['Database']).toBe(true);
    expect(healthStatus['API Service']).toBe(true);
  });

  it('should handle component failures and recoveries', async () => {
    // Run a short experiment
    await agent.runChaosExperiment(1, 0.5);

    // Check if components are recovered after experiment
    const healthStatus = agent.getSystemHealth();
    expect(Object.values(healthStatus).every(status => status === true)).toBe(true);
  });

  it('should log experiment start and completion', async () => {
    const consoleSpy = jest.spyOn(console, 'log');
    await agent.runChaosExperiment(1, 0.0);

    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('recovered'));
  });
});

// Usage example (can be in a separate main.ts file)
async function main() {
  const agent = new CTAFleetAgent65();
  console.log('Initial system health:', agent.getSystemHealth());

  await agent.runChaosExperiment(10, 0.3);
  console.log('Final system health:', agent.getSystemHealth());
}

if (require.main === module) {
  main().catch(console.error);
}
