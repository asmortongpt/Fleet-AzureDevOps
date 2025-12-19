```typescript
// src/deployment/BlueGreenDeployment.ts
import { execSync } from 'child_process';
import { Logger } from '../utils/Logger';

export class BlueGreenDeployment {
  private activeEnvironment: 'blue' | 'green' = 'blue';
  private logger: Logger;

  constructor() {
    this.logger = new Logger('BlueGreenDeployment');
    this.determineActiveEnvironment();
  }

  private determineActiveEnvironment(): void {
    try {
      // Check which environment is currently active (mocked for demo)
      const status = this.getLoadBalancerStatus();
      this.activeEnvironment = status.includes('blue') ? 'blue' : 'green';
      this.logger.info(`Active environment detected: ${this.activeEnvironment}`);
    } catch (error) {
      this.logger.error('Error determining active environment', error);
      throw new Error('Failed to determine active environment');
    }
  }

  private getLoadBalancerStatus(): string {
    // Mock implementation - in real scenarios, this would query AWS ELB, Nginx, etc.
    return this.activeEnvironment === 'blue' ? 'blue-active' : 'green-active';
  }

  public deployNewVersion(version: string): boolean {
    try {
      const targetEnvironment = this.activeEnvironment === 'blue' ? 'green' : 'blue';
      this.logger.info(`Deploying version ${version} to ${targetEnvironment} environment`);

      // Step 1: Deploy to inactive environment
      this.deployToEnvironment(targetEnvironment, version);

      // Step 2: Run health checks
      if (!this.runHealthChecks(targetEnvironment)) {
        throw new Error(`Health checks failed for ${targetEnvironment}`);
      }

      // Step 3: Switch traffic to new environment
      this.switchTraffic(targetEnvironment);

      // Update active environment
      this.activeEnvironment = targetEnvironment;
      this.logger.info(`Successfully deployed version ${version} to ${targetEnvironment}`);
      return true;
    } catch (error) {
      this.logger.error(`Deployment failed for version ${version}`, error);
      this.rollback();
      return false;
    }
  }

  private deployToEnvironment(environment: 'blue' | 'green', version: string): void {
    this.logger.info(`Deploying version ${version} to ${environment} environment`);
    // Mock deployment - replace with actual deployment logic (e.g., Kubernetes, Docker)
    execSync(`echo "Deploying ${version} to ${environment}"`, { stdio: 'inherit' });
  }

  private runHealthChecks(environment: 'blue' | 'green'): boolean {
    this.logger.info(`Running health checks for ${environment} environment`);
    // Mock health check - replace with actual API calls or service checks
    return true;
  }

  private switchTraffic(environment: 'blue' | 'green'): void {
    this.logger.info(`Switching traffic to ${environment} environment`);
    // Mock traffic switch - replace with load balancer configuration (e.g., AWS ALB/ELB)
    execSync(`echo "Switching traffic to ${environment}"`, { stdio: 'inherit' });
  }

  private rollback(): void {
    this.logger.warn(`Rolling back deployment to ${this.activeEnvironment}`);
    // Mock rollback - maintain current active environment
    execSync(`echo "Rolling back to ${this.activeEnvironment}"`, { stdio: 'inherit' });
  }

  public getActiveEnvironment(): 'blue' | 'green' {
    return this.activeEnvironment;
  }
}

// src/utils/Logger.ts
export class Logger {
  private context: string;

  constructor(context: string) {
    this.context = context;
  }

  public info(message: string): void {
    console.log(`[INFO] [${this.context}] ${message}`);
  }

  public warn(message: string): void {
    console.warn(`[WARN] [${this.context}] ${message}`);
  }

  public error(message: string, error?: Error): void {
    console.error(`[ERROR] [${this.context}] ${message}`, error || '');
  }
}

// src/index.ts
import { BlueGreenDeployment } from './deployment/BlueGreenDeployment';

function main() {
  const deployment = new BlueGreenDeployment();
  console.log('Current active environment:', deployment.getActiveEnvironment());

  // Deploy a new version
  const success = deployment.deployNewVersion('v1.0.1');
  console.log('Deployment successful:', success);
  console.log('New active environment:', deployment.getActiveEnvironment());
}

if (require.main === module) {
  main();
}

// tests/BlueGreenDeployment.test.ts
import { BlueGreenDeployment } from '../src/deployment/BlueGreenDeployment';
import { execSync } from 'child_process';
import { Logger } from '../src/utils/Logger';

// Mock child_process execSync
jest.mock('child_process', () => ({
  execSync: jest.fn().mockImplementation(() => Buffer.from('Mocked output')),
}));

describe('BlueGreenDeployment', () => {
  let deployment: BlueGreenDeployment;
  let loggerSpy: jest.SpyInstance;

  beforeEach(() => {
    deployment = new BlueGreenDeployment();
    loggerSpy = jest.spyOn(Logger.prototype, 'info');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('should initialize with blue as default active environment', () => {
    expect(deployment.getActiveEnvironment()).toBe('blue');
    expect(loggerSpy).toHaveBeenCalledWith('Active environment detected: blue');
  });

  test('should deploy new version and switch to green environment', () => {
    const result = deployment.deployNewVersion('v1.0.1');
    expect(result).toBe(true);
    expect(deployment.getActiveEnvironment()).toBe('green');
    expect(loggerSpy).toHaveBeenCalledWith('Deploying version v1.0.1 to green environment');
    expect(loggerSpy).toHaveBeenCalledWith('Successfully deployed version v1.0.1 to green');
  });

  test('should deploy new version and switch back to blue environment', () => {
    // First deployment to green
    deployment.deployNewVersion('v1.0.1');
    expect(deployment.getActiveEnvironment()).toBe('green');

    // Second deployment back to blue
    const result = deployment.deployNewVersion('v1.0.2');
    expect(result).toBe(true);
    expect(deployment.getActiveEnvironment()).toBe('blue');
    expect(loggerSpy).toHaveBeenCalledWith('Deploying version v1.0.2 to blue environment');
    expect(loggerSpy).toHaveBeenCalledWith('Successfully deployed version v1.0.2 to blue');
  });

  test('should call execSync during deployment and traffic switch', () => {
    deployment.deployNewVersion('v1.0.1');
    expect(execSync).toHaveBeenCalledWith(expect.stringContaining('Deploying v1.0.1 to green'), expect.any(Object));
    expect(execSync).toHaveBeenCalledWith(expect.stringContaining('Switching traffic to green'), expect.any(Object));
  });
});
```
