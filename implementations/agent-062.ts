```typescript
// ctafleet-agent-062-security-testing.ts
import { promisify } from 'util';
import { exec as execCallback } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as winston from 'winston';
import * as sanitizePath from 'sanitize-path';
import { validate } from 'class-validator';
import { IsString, IsNotEmpty, Length } from 'class-validator';

// Promisify exec for async/await usage
const exec = promisify(execCallback);

// Logger configuration for security auditing and debugging
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'security-testing.log' }),
    new winston.transports.Console()
  ],
});

// Data validation class for input parameters
class SecurityTestConfig {
  @IsString()
  @IsNotEmpty()
  @Length(1, 255)
  targetUrl: string;

  @IsString()
  @IsNotEmpty()
  testType: string;

  constructor(targetUrl: string, testType: string) {
    this.targetUrl = targetUrl;
    this.testType = testType;
  }
}

// Main Security Testing Agent class
class CTAFleetAgent062 {
  private readonly agentId: string = 'CTAFleet-Agent-062';
  private readonly allowedTestTypes: string[] = ['xss', 'sql-injection', 'port-scan'];
  private readonly reportsDir: string = path.join(__dirname, 'security-reports');

  constructor() {
    this.initialize();
  }

  private initialize(): void {
    // Ensure reports directory exists
    if (!fs.existsSync(this.reportsDir)) {
      fs.mkdirSync(this.reportsDir, { recursive: true });
    }
    logger.info(`${this.agentId} initialized`);
  }

  // Validate input configuration
  private async validateConfig(config: SecurityTestConfig): Promise<void> {
    const errors = await validate(config);
    if (errors.length > 0) {
      throw new Error(`Validation failed: ${JSON.stringify(errors)}`);
    }
  }

  // Sanitize and validate test type
  private validateTestType(testType: string): void {
    if (!this.allowedTestTypes.includes(testType.toLowerCase())) {
      throw new Error(`Invalid test type: ${testType}. Allowed types: ${this.allowedTestTypes.join(', ')}`);
    }
  }

  // Run security test with proper error handling and logging
  public async runSecurityTest(config: SecurityTestConfig): Promise<string> {
    try {
      // Validate input
      await this.validateConfig(config);
      this.validateTestType(config.testType);

      // Sanitize target URL (basic sanitization, extend as needed)
      const sanitizedUrl = config.targetUrl.replace(/[^a-zA-Z0-9:/.?-]/g, '');
      if (sanitizedUrl !== config.targetUrl) {
        throw new Error('Invalid characters detected in target URL');
      }

      logger.info(`Starting ${config.testType} test on ${sanitizedUrl}`, { agentId: this.agentId });

      // Simulate security test execution (replace with actual tool commands)
      const command = this.buildTestCommand(config.testType, sanitizedUrl);
      const { stdout, stderr } = await exec(command, { timeout: 30000 });

      if (stderr) {
        logger.error(`Test execution error: ${stderr}`, { agentId: this.agentId });
        throw new Error(`Test execution failed: ${stderr}`);
      }

      // Save report
      const reportPath = this.saveReport(config.testType, sanitizedUrl, stdout);
      logger.info(`Test completed. Report saved to ${reportPath}`, { agentId: this.agentId });

      return reportPath;
    } catch (error) {
      logger.error(`Security test failed: ${error.message}`, { agentId: this.agentId });
      throw new Error(`Security test execution failed: ${error.message}`);
    }
  }

  // Build test command based on test type (mock implementation)
  private buildTestCommand(testType: string, targetUrl: string): string {
    switch (testType.toLowerCase()) {
      case 'xss':
        return `echo "Running XSS test on ${targetUrl}"`;
      case 'sql-injection':
        return `echo "Running SQL Injection test on ${targetUrl}"`;
      case 'port-scan':
        return `echo "Running Port Scan on ${targetUrl}"`;
      default:
        throw new Error('Unsupported test type');
    }
  }

  // Save test report to file with sanitized path
  private saveReport(testType: string, targetUrl: string, content: string): string {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const safeTarget = targetUrl.replace(/[^a-zA-Z0-9]/g, '_');
    const filename = `${testType}-${safeTarget}-${timestamp}.txt`;
    const reportPath = path.join(this.reportsDir, filename);

    // Sanitize path to prevent directory traversal
    const sanitizedPath = sanitizePath(reportPath);
    if (sanitizedPath !== reportPath) {
      throw new Error('Invalid report path detected');
    }

    fs.writeFileSync(sanitizedPath, content, { flag: 'wx' });
    return sanitizedPath;
  }
}

// Unit Tests using Jest
import { describe, expect, test, jest } from '@jest/globals';

describe('CTAFleetAgent062 Security Testing', () => {
  let agent: CTAFleetAgent062;

  beforeEach(() => {
    agent = new CTAFleetAgent062();
    jest.spyOn(fs, 'writeFileSync').mockImplementation(() => {});
    jest.spyOn(fs, 'mkdirSync').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('should initialize agent correctly', () => {
    expect(agent).toBeDefined();
  });

  test('should throw error for invalid test type', async () => {
    const config = new SecurityTestConfig('http://example.com', 'invalid-test');
    await expect(agent.runSecurityTest(config)).rejects.toThrow('Invalid test type');
  });

  test('should throw error for invalid URL characters', async () => {
    const config = new SecurityTestConfig('http://example.com<script>alert(1)</script>', 'xss');
    await expect(agent.runSecurityTest(config)).rejects.toThrow('Invalid characters detected in target URL');
  });

  test('should successfully run security test', async () => {
    const config = new SecurityTestConfig('http://example.com', 'xss');
    const reportPath = await agent.runSecurityTest(config);
    expect(reportPath).toBeDefined();
    expect(reportPath).toContain('security-reports');
  });

  test('should throw validation error for empty URL', async () => {
    const config = new SecurityTestConfig('', 'xss');
    await expect(agent.runSecurityTest(config)).rejects.toThrow('Validation failed');
  });
});

// Export for usage
export { CTAFleetAgent062, SecurityTestConfig };

// Example usage
async function main() {
  try {
    const agent = new CTAFleetAgent062();
    const config = new SecurityTestConfig('http://example.com', 'xss');
    const reportPath = await agent.runSecurityTest(config);
    console.log(`Security test completed. Report: ${reportPath}`);
  } catch (error) {
    console.error(`Error: ${error.message}`);
  }
}

if (require.main === module) {
  main();
}
```
