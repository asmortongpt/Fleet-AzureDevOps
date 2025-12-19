// src/ctaFleetAgent68.ts
import { Logger } from './logger';

export class CTAFleetAgent68 {
  private logger: Logger;
  private isRunning: boolean = false;
  private testResults: TestResult[] = [];

  constructor(logger: Logger = new Logger()) {
    this.logger = logger;
  }

  public start(): void {
    if (this.isRunning) {
      this.logger.log('Agent is already running');
      return;
    }
    this.isRunning = true;
    this.logger.log('CTAFleet Agent 68 started for Test Automation');
  }

  public stop(): void {
    if (!this.isRunning) {
      this.logger.log('Agent is not running');
      return;
    }
    this.isRunning = false;
    this.logger.log('CTAFleet Agent 68 stopped');
  }

  public runTestSuite(testSuite: TestSuite): TestResult[] {
    if (!this.isRunning) {
      this.logger.log('Cannot run tests: Agent is not running');
      return [];
    }

    this.logger.log(`Running test suite: ${testSuite.name}`);
    const results: TestResult[] = testSuite.tests.map(test => {
      const startTime = Date.now();
      let status: 'PASSED' | 'FAILED' = 'PASSED';
      let errorMessage: string | undefined;

      try {
        test.testFn();
      } catch (error) {
        status = 'FAILED';
        errorMessage = error instanceof Error ? error.message : String(error);
      }

      const duration = Date.now() - startTime;
      const result: TestResult = {
        testName: test.name,
        status,
        duration,
        errorMessage,
      };

      this.testResults.push(result);
      this.logger.log(`Test ${test.name}: ${status} (${duration}ms)`);
      return result;
    });

    return results;
  }

  public getTestResults(): TestResult[] {
    return [...this.testResults];
  }

  public clearTestResults(): void {
    this.testResults = [];
    this.logger.log('Test results cleared');
  }
}

// src/logger.ts
export class Logger {
  public log(message: string): void {
    console.log(`[CTAFleetAgent68] ${message}`);
  }
}

// src/types.ts
export interface Test {
  name: string;
  testFn: () => void;
}

export interface TestSuite {
  name: string;
  tests: Test[];
}

export interface TestResult {
  testName: string;
  status: 'PASSED' | 'FAILED';
  duration: number;
  errorMessage?: string;
}

// tests/ctaFleetAgent68.test.ts
import { CTAFleetAgent68 } from '../src/ctaFleetAgent68';
import { Logger } from '../src/logger';
import { TestSuite } from '../src/types';

class MockLogger extends Logger {
  public logs: string[] = [];
  public log(message: string): void {
    this.logs.push(message);
  }
}

describe('CTAFleetAgent68', () => {
  let agent: CTAFleetAgent68;
  let mockLogger: MockLogger;

  beforeEach(() => {
    mockLogger = new MockLogger();
    agent = new CTAFleetAgent68(mockLogger);
  });

  test('should initialize with correct state', () => {
    expect(agent.getTestResults()).toEqual([]);
    expect(mockLogger.logs).toEqual([]);
  });

  test('should start and stop agent correctly', () => {
    agent.start();
    expect(mockLogger.logs).toContain('CTAFleet Agent 68 started for Test Automation');

    agent.start();
    expect(mockLogger.logs).toContain('Agent is already running');

    agent.stop();
    expect(mockLogger.logs).toContain('CTAFleet Agent 68 stopped');

    agent.stop();
    expect(mockLogger.logs).toContain('Agent is not running');
  });

  test('should not run tests when agent is not started', () => {
    const testSuite: TestSuite = {
      name: 'Sample Suite',
      tests: [],
    };

    const results = agent.runTestSuite(testSuite);
    expect(results).toEqual([]);
    expect(mockLogger.logs).toContain('Cannot run tests: Agent is not running');
  });

  test('should run test suite and record results', () => {
    agent.start();

    const testSuite: TestSuite = {
      name: 'Sample Suite',
      tests: [
        {
          name: 'Passing Test',
          testFn: () => {
            expect(true).toBe(true);
          },
        },
        {
          name: 'Failing Test',
          testFn: () => {
            throw new Error('Test failed');
          },
        },
      ],
    };

    const results = agent.runTestSuite(testSuite);
    expect(results).toHaveLength(2);
    expect(results[0].testName).toBe('Passing Test');
    expect(results[0].status).toBe('PASSED');
    expect(results[1].testName).toBe('Failing Test');
    expect(results[1].status).toBe('FAILED');
    expect(results[1].errorMessage).toBe('Test failed');
    expect(agent.getTestResults()).toEqual(results);
  });

  test('should clear test results', () => {
    agent.start();

    const testSuite: TestSuite = {
      name: 'Sample Suite',
      tests: [
        {
          name: 'Passing Test',
          testFn: () => {
            expect(true).toBe(true);
          },
        },
      ],
    };

    agent.runTestSuite(testSuite);
    expect(agent.getTestResults()).toHaveLength(1);

    agent.clearTestResults();
    expect(agent.getTestResults()).toHaveLength(0);
    expect(mockLogger.logs).toContain('Test results cleared');
  });
});

// package.json (for reference, not part of code to run directly)
{
  "name": "cta-fleet-agent-68",
  "version": "1.0.0",
  "description": "Test Automation Agent for CTAFleet",
  "main": "dist/ctaFleetAgent68.js",
  "scripts": {
    "build": "tsc",
    "test": "jest"
  },
  "devDependencies": {
    "@types/jest": "^29.5.5",
    "@types/node": "^20.8.7",
    "jest": "^29.7.0",
    "ts-jest": "^29.1.1",
    "typescript": "^5.2.2"
  }
}

// tsconfig.json (for reference, not part of code to run directly)
{
  "compilerOptions": {
    "target": "es6",
    "module": "commonjs",
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "tests"]
}

// jest.config.js (for reference, not part of code to run directly)
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testPathIgnorePatterns: ['/node_modules/', '/dist/'],
  testMatch: ['**/tests/**/*.test.ts'],
};
