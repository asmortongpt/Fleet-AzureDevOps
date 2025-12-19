// src/ctaFleetAgent.ts
export class CTAFleetAgent {
  private modules: Map<string, any> = new Map();
  private loadingPromises: Map<string, Promise<any>> = new Map();

  /**
   * Dynamically loads a module based on the provided module name.
   * Implements lazy loading to improve performance by only loading modules when needed.
   * @param moduleName - The name of the module to load.
   * @returns Promise resolving to the loaded module.
   */
  public async loadModule(moduleName: string): Promise<any> {
    // Return cached module if already loaded
    if (this.modules.has(moduleName)) {
      return this.modules.get(moduleName);
    }

    // Return existing loading promise if module is currently loading
    if (this.loadingPromises.has(moduleName)) {
      return this.loadingPromises.get(moduleName);
    }

    // Create new loading promise for the module
    const loadingPromise = this.dynamicImport(moduleName);
    this.loadingPromises.set(moduleName, loadingPromise);

    try {
      const module = await loadingPromise;
      this.modules.set(moduleName, module);
      this.loadingPromises.delete(moduleName);
      return module;
    } catch (error) {
      this.loadingPromises.delete(moduleName);
      throw new Error(`Failed to load module ${moduleName}: ${error.message}`);
    }
  }

  /**
   * Clears the cache for a specific module or all modules.
   * @param moduleName - Optional specific module name to clear.
   */
  public clearCache(moduleName?: string): void {
    if (moduleName) {
      this.modules.delete(moduleName);
      this.loadingPromises.delete(moduleName);
    } else {
      this.modules.clear();
      this.loadingPromises.clear();
    }
  }

  /**
   * Checks if a module is already loaded.
   * @param moduleName - The name of the module to check.
   * @returns Boolean indicating if the module is loaded.
   */
  public isModuleLoaded(moduleName: string): boolean {
    return this.modules.has(moduleName);
  }

  /**
   * Internal method to handle dynamic imports based on module name.
   * @param moduleName - The name of the module to import.
   * @returns Promise resolving to the imported module.
   */
  private async dynamicImport(moduleName: string): Promise<any> {
    switch (moduleName) {
      case 'tracking':
        return import('./modules/tracking');
      case 'analytics':
        return import('./modules/analytics');
      case 'reporting':
        return import('./modules/reporting');
      default:
        throw new Error(`Unknown module: ${moduleName}`);
    }
  }
}

// src/modules/tracking.ts
export const tracking = {
  trackVehicle: (id: string) => `Tracking vehicle ${id}`,
};

// src/modules/analytics.ts
export const analytics = {
  analyzeData: (data: string) => `Analyzing data: ${data}`,
};

// src/modules/reporting.ts
export const reporting = {
  generateReport: (type: string) => `Generating ${type} report`,
};

// src/ctaFleetAgent.test.ts
import { CTAFleetAgent } from './ctaFleetAgent';

describe('CTAFleetAgent - Lazy Loading', () => {
  let agent: CTAFleetAgent;

  beforeEach(() => {
    agent = new CTAFleetAgent();
  });

  afterEach(() => {
    agent.clearCache();
  });

  test('should lazy load tracking module successfully', async () => {
    const trackingModule = await agent.loadModule('tracking');
    expect(trackingModule).toBeDefined();
    expect(trackingModule.tracking).toBeDefined();
    expect(trackingModule.tracking.trackVehicle('V123')).toBe('Tracking vehicle V123');
    expect(agent.isModuleLoaded('tracking')).toBe(true);
  });

  test('should lazy load analytics module successfully', async () => {
    const analyticsModule = await agent.loadModule('analytics');
    expect(analyticsModule).toBeDefined();
    expect(analyticsModule.analytics).toBeDefined();
    expect(analyticsModule.analytics.analyzeData('test')).toBe('Analyzing data: test');
    expect(agent.isModuleLoaded('analytics')).toBe(true);
  });

  test('should lazy load reporting module successfully', async () => {
    const reportingModule = await agent.loadModule('reporting');
    expect(reportingModule).toBeDefined();
    expect(reportingModule.reporting).toBeDefined();
    expect(reportingModule.reporting.generateReport('daily')).toBe('Generating daily report');
    expect(agent.isModuleLoaded('reporting')).toBe(true);
  });

  test('should return cached module if already loaded', async () => {
    const firstLoad = await agent.loadModule('tracking');
    const secondLoad = await agent.loadModule('tracking');
    expect(firstLoad).toBe(secondLoad);
    expect(agent.isModuleLoaded('tracking')).toBe(true);
  });

  test('should handle concurrent loading of the same module', async () => {
    const load1 = agent.loadModule('tracking');
    const load2 = agent.loadModule('tracking');
    const [result1, result2] = await Promise.all([load1, load2]);
    expect(result1).toBe(result2);
    expect(agent.isModuleLoaded('tracking')).toBe(true);
  });

  test('should throw error for unknown module', async () => {
    await expect(agent.loadModule('unknown')).rejects.toThrow('Unknown module: unknown');
    expect(agent.isModuleLoaded('unknown')).toBe(false);
  });

  test('should clear specific module cache', async () => {
    await agent.loadModule('tracking');
    expect(agent.isModuleLoaded('tracking')).toBe(true);
    agent.clearCache('tracking');
    expect(agent.isModuleLoaded('tracking')).toBe(false);
  });

  test('should clear all module cache', async () => {
    await agent.loadModule('tracking');
    await agent.loadModule('analytics');
    expect(agent.isModuleLoaded('tracking')).toBe(true);
    expect(agent.isModuleLoaded('analytics')).toBe(true);
    agent.clearCache();
    expect(agent.isModuleLoaded('tracking')).toBe(false);
    expect(agent.isModuleLoaded('analytics')).toBe(false);
  });
});

// tsconfig.json
/*
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ES2020",
    "outDir": "./dist",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules"]
}
*/

// package.json (relevant scripts and dependencies)
/*
{
  "scripts": {
    "test": "jest",
    "build": "tsc"
  },
  "dependencies": {},
  "devDependencies": {
    "@types/jest": "^29.5.5",
    "@types/node": "^20.8.7",
    "jest": "^29.7.0",
    "ts-jest": "^29.1.1",
    "typescript": "^5.2.2"
  }
}
*/

// jest.config.js
/*
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
};
*/
