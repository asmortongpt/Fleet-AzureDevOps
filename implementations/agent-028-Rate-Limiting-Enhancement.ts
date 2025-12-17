// src/rateLimiter.ts
import { setTimeout } from 'timers/promises';

export class RateLimiter {
  private readonly maxRequests: number;
  private readonly windowMs: number;
  private requests: number[] = [];

  constructor(maxRequests: number, windowMs: number) {
    if (maxRequests <= 0 || windowMs <= 0) {
      throw new Error('Rate limiter parameters must be positive numbers');
    }
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
  }

  public async acquire(): Promise<void> {
    const now = Date.now();
    this.requests = this.requests.filter(timestamp => now - timestamp < this.windowMs);

    if (this.requests.length >= this.maxRequests) {
      const oldestRequest = this.requests[0];
      const waitTime = this.windowMs - (now - oldestRequest);
      await setTimeout(waitTime);
      return this.acquire();
    }

    this.requests.push(now);
  }

  public getRemainingRequests(): number {
    const now = Date.now();
    this.requests = this.requests.filter(timestamp => now - timestamp < this.windowMs);
    return this.maxRequests - this.requests.length;
  }

  public getWindowMs(): number {
    return this.windowMs;
  }

  public getMaxRequests(): number {
    return this.maxRequests;
  }
}

// src/agent.ts
import { RateLimiter } from './rateLimiter';

export class CTAFleetAgent {
  private readonly rateLimiter: RateLimiter;
  private readonly agentId: string;

  constructor(agentId: string, maxRequests: number, windowMs: number) {
    this.agentId = agentId;
    this.rateLimiter = new RateLimiter(maxRequests, windowMs);
  }

  public async processRequest(requestData: string): Promise<string> {
    await this.rateLimiter.acquire();
    console.log(`Agent ${this.agentId} processing request: ${requestData}`);
    return `Processed by ${this.agentId}: ${requestData}`;
  }

  public getRateLimitStatus(): { remaining: number; windowMs: number; maxRequests: number } {
    return {
      remaining: this.rateLimiter.getRemainingRequests(),
      windowMs: this.rateLimiter.getWindowMs(),
      maxRequests: this.rateLimiter.getMaxRequests(),
    };
  }
}

// tests/rateLimiter.test.ts
import { expect } from 'chai';
import { RateLimiter } from '../src/rateLimiter';
import { CTAFleetAgent } from '../src/agent';

describe('RateLimiter', () => {
  it('should throw error for invalid parameters', () => {
    expect(() => new RateLimiter(0, 1000)).to.throw('Rate limiter parameters must be positive numbers');
    expect(() => new RateLimiter(5, -1000)).to.throw('Rate limiter parameters must be positive numbers');
  });

  it('should allow requests within limit', async () => {
    const limiter = new RateLimiter(3, 1000);
    await limiter.acquire();
    await limiter.acquire();
    await limiter.acquire();
    expect(limiter.getRemainingRequests()).to.equal(0);
  });

  it('should delay requests exceeding limit', async () => {
    const limiter = new RateLimiter(2, 500);
    const start = Date.now();
    await Promise.all([
      limiter.acquire(),
      limiter.acquire(),
      limiter.acquire(),
    ]);
    const duration = Date.now() - start;
    expect(duration).to.be.greaterThanOrEqual(500);
  });
});

describe('CTAFleetAgent', () => {
  it('should process requests with rate limiting', async () => {
    const agent = new CTAFleetAgent('Agent28', 2, 500);
    const start = Date.now();
    const results = await Promise.all([
      agent.processRequest('Request1'),
      agent.processRequest('Request2'),
      agent.processRequest('Request3'),
    ]);
    const duration = Date.now() - start;
    expect(duration).to.be.greaterThanOrEqual(500);
    expect(results[0]).to.equal('Processed by Agent28: Request1');
    expect(results[1]).to.equal('Processed by Agent28: Request2');
    expect(results[2]).to.equal('Processed by Agent28: Request3');
  });

  it('should return correct rate limit status', () => {
    const agent = new CTAFleetAgent('Agent28', 5, 1000);
    const status = agent.getRateLimitStatus();
    expect(status.remaining).to.equal(5);
    expect(status.windowMs).to.equal(1000);
    expect(status.maxRequests).to.equal(5);
  });
});

// package.json
{
  "name": "cta-fleet-agent",
  "version": "1.0.0",
  "description": "CTAFleet Agent with Rate Limiting",
  "main": "dist/index.js",
  "scripts": {
    "build": "tsc",
    "test": "mocha -r ts-node/register tests/**/*.test.ts",
    "start": "node dist/index.js"
  },
  "dependencies": {},
  "devDependencies": {
    "@types/chai": "^4.3.5",
    "@types/mocha": "^10.0.1",
    "@types/node": "^20.4.5",
    "chai": "^4.3.7",
    "mocha": "^10.2.0",
    "ts-node": "^10.9.1",
    "typescript": "^5.1.6"
  }
}

// tsconfig.json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "outDir": "./dist",
    "rootDir": "./",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  },
  "include": ["src/**/*", "tests/**/*"],
  "exclude": ["node_modules"]
}
