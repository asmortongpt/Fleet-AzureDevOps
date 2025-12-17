// src/ctaFleetAgent.ts
import { Logger } from './logger';

export class CTAFleetAgent {
  private cdnUrl: string;
  private fallbackUrl: string;
  private logger: Logger;

  constructor(cdnUrl: string, fallbackUrl: string) {
    this.cdnUrl = cdnUrl;
    this.fallbackUrl = fallbackUrl;
    this.logger = new Logger('CTAFleetAgent');
  }

  /**
   * Attempts to load a resource from CDN with fallback to secondary URL
   * @param resourcePath The path to the resource
   * @returns Promise with the resource URL to use
   */
  async loadResource(resourcePath: string): Promise<string> {
    const cdnResourceUrl = `${this.cdnUrl}/${resourcePath}`;
    try {
      this.logger.info(`Attempting to load resource from CDN: ${cdnResourceUrl}`);
      const response = await fetch(cdnResourceUrl, { method: 'HEAD' });
      if (response.ok) {
        this.logger.info('CDN resource loaded successfully');
        return cdnResourceUrl;
      }
      throw new Error('CDN resource not available');
    } catch (error) {
      this.logger.warn(`CDN load failed, falling back: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return `${this.fallbackUrl}/${resourcePath}`;
    }
  }

  /**
   * Preloads critical resources to improve performance
   * @param resources Array of resource paths to preload
   */
  async preloadResources(resources: string[]): Promise<void> {
    try {
      const preloadPromises = resources.map(async (resource) => {
        const url = await this.loadResource(resource);
        this.logger.info(`Preloading resource: ${url}`);
        const link = document.createElement('link');
        link.rel = 'preload';
        link.href = url;
        document.head.appendChild(link);
      });
      await Promise.all(preloadPromises);
      this.logger.info('All resources preloaded successfully');
    } catch (error) {
      this.logger.error(`Preload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Gets the optimal resource URL based on network conditions
   * @param resourcePath The path to the resource
   * @returns Promise with the optimal URL
   */
  async getOptimalResourceUrl(resourcePath: string): Promise<string> {
    if (this.isHighPerformanceNetwork()) {
      return this.loadResource(resourcePath);
    }
    this.logger.info('Using fallback due to poor network conditions');
    return `${this.fallbackUrl}/${resourcePath}`;
  }

  /**
   * Checks if the network conditions are suitable for CDN usage
   * @returns boolean indicating if network performance is high
   */
  private isHighPerformanceNetwork(): boolean {
    const connection = (navigator as any).connection;
    if (!connection) return true; // Default to CDN if no connection info
    return connection.effectiveType === '4g' || connection.downlink > 2;
  }
}

// src/logger.ts
export class Logger {
  private context: string;

  constructor(context: string) {
    this.context = context;
  }

  info(message: string): void {
    console.log(`[INFO][${this.context}] ${message}`);
  }

  warn(message: string): void {
    console.warn(`[WARN][${this.context}] ${message}`);
  }

  error(message: string): void {
    console.error(`[ERROR][${this.context}] ${message}`);
  }
}

// src/index.ts
import { CTAFleetAgent } from './ctaFleetAgent';

export default CTAFleetAgent;

// tests/ctaFleetAgent.test.ts
import { CTAFleetAgent } from '../src/ctaFleetAgent';

describe('CTAFleetAgent', () => {
  let agent: CTAFleetAgent;
  const cdnUrl = 'https://cdn.example.com';
  const fallbackUrl = 'https://fallback.example.com';

  beforeEach(() => {
    agent = new CTAFleetAgent(cdnUrl, fallbackUrl);
    jest.spyOn(global.console, 'log').mockImplementation(() => {});
    jest.spyOn(global.console, 'warn').mockImplementation(() => {});
    jest.spyOn(global.console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.spyOn(global.console, 'log').mockRestore();
    jest.spyOn(global.console, 'warn').mockRestore();
    jest.spyOn(global.console, 'error').mockRestore();
    jest.spyOn(global, 'fetch').mockRestore();
  });

  describe('loadResource', () => {
    it('should return CDN URL when resource is available', async () => {
      jest.spyOn(global, 'fetch').mockResolvedValue({
        ok: true,
      } as Response);

      const result = await agent.loadResource('test.js');
      expect(result).toBe(`${cdnUrl}/test.js`);
    });

    it('should return fallback URL when CDN fails', async () => {
      jest.spyOn(global, 'fetch').mockRejectedValue(new Error('Network error'));

      const result = await agent.loadResource('test.js');
      expect(result).toBe(`${fallbackUrl}/test.js`);
    });
  });

  describe('preloadResources', () => {
    it('should preload resources successfully', async () => {
      jest.spyOn(global, 'fetch').mockResolvedValue({
        ok: true,
      } as Response);

      const appendChildSpy = jest.spyOn(document.head, 'appendChild').mockImplementation(() => {});

      await agent.preloadResources(['test1.js', 'test2.css']);
      expect(appendChildSpy).toHaveBeenCalledTimes(2);
    });

    it('should handle preload errors', async () => {
      jest.spyOn(global, 'fetch').mockRejectedValue(new Error('Preload error'));
      const appendChildSpy = jest.spyOn(document.head, 'appendChild').mockImplementation(() => {});

      await agent.preloadResources(['test1.js']);
      expect(appendChildSpy).not.toHaveBeenCalled();
    });
  });

  describe('getOptimalResourceUrl', () => {
    it('should use CDN for high performance network', async () => {
      jest.spyOn(global, 'fetch').mockResolvedValue({
        ok: true,
      } as Response);

      Object.defineProperty(navigator, 'connection', {
        value: { effectiveType: '4g', downlink: 5 },
        writable: true,
      });

      const result = await agent.getOptimalResourceUrl('test.js');
      expect(result).toBe(`${cdnUrl}/test.js`);
    });

    it('should use fallback for poor network', async () => {
      Object.defineProperty(navigator, 'connection', {
        value: { effectiveType: '2g', downlink: 0.5 },
        writable: true,
      });

      const result = await agent.getOptimalResourceUrl('test.js');
      expect(result).toBe(`${fallbackUrl}/test.js`);
    });
  });
});

// jest.config.js
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  testPathIgnorePatterns: ['/node_modules/', '/dist/'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  collectCoverage: true,
  collectCoverageFrom: ['src/**/*.{ts,tsx}', '!src/**/*.d.ts'],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov'],
};

// tests/setup.ts
import 'jest-environment-jsdom';

Object.defineProperty(window, 'fetch', {
  value: jest.fn(),
});

Object.defineProperty(document, 'head', {
  value: {
    appendChild: jest.fn(),
  },
});

// package.json
{
  "name": "cta-fleet-agent",
  "version": "1.0.0",
  "description": "CTAFleet Agent for CDN Integration and Performance",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "scripts": {
    "build": "tsc",
    "test": "jest",
    "lint": "eslint . --ext .ts"
  },
  "devDependencies": {
    "@types/jest": "^29.5.5",
    "@types/node": "^20.8.7",
    "@typescript-eslint/eslint-plugin": "^6.7.5",
    "@typescript-eslint/parser": "^6.7.5",
    "eslint": "^8.51.0",
    "jest": "^29.7.0",
    "jest-environment-jsdom": "^29.7.0",
    "ts-jest": "^29.1.1",
    "typescript": "^5.2.2"
  }
}

// tsconfig.json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "declaration": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "tests"]
}
