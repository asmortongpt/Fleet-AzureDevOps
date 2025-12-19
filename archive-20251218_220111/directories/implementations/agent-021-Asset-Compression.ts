```typescript
// src/agents/CTAFleetAgent21.ts
import { Agent, AgentContext } from '../core/Agent';
import { Asset, AssetType } from '../models/Asset';
import { Logger } from '../utils/Logger';
import { PerformanceMetrics } from '../metrics/PerformanceMetrics';

export class CTAFleetAgent21 implements Agent {
  private readonly name = 'CTAFleet Agent 21: Asset Compression';
  private readonly version = '1.0.0';
  private readonly supportedTypes: AssetType[] = [
    AssetType.IMAGE,
    AssetType.VIDEO,
    AssetType.AUDIO,
  ];

  constructor(
    private logger: Logger,
    private metrics: PerformanceMetrics
  ) {}

  getName(): string {
    return this.name;
  }

  getVersion(): string {
    return this.version;
  }

  async execute(context: AgentContext): Promise<void> {
    try {
      this.logger.info(`Starting asset compression for fleet: ${context.fleetId}`);
      const startTime = Date.now();

      const assets = await this.fetchAssets(context);
      const compressionResults = await this.compressAssets(assets);

      await this.storeResults(compressionResults, context);
      const duration = Date.now() - startTime;
      this.metrics.recordOperation('assetCompression', duration);
      this.logger.info(`Completed asset compression for fleet: ${context.fleetId} in ${duration}ms`);
    } catch (error) {
      this.logger.error(`Error during asset compression: ${error.message}`);
      this.metrics.recordError('assetCompression');
      throw error;
    }
  }

  private async fetchAssets(context: AgentContext): Promise<Asset[]> {
    this.logger.debug(`Fetching assets for fleet: ${context.fleetId}`);
    // Simulated asset fetching - in production, this would call a real API
    return context.assets.filter(asset =>
      this.supportedTypes.includes(asset.type) && asset.size > 1024 * 1024 // Assets > 1MB
    );
  }

  private async compressAssets(assets: Asset[]): Promise<Asset[]> {
    const compressedAssets: Asset[] = [];
    for (const asset of assets) {
      try {
        const startTime = Date.now();
        const compressedAsset = await this.compressSingleAsset(asset);
        const duration = Date.now() - startTime;
        this.metrics.recordOperation(`compress_${asset.type}`, duration);
        compressedAssets.push(compressedAsset);
        this.logger.debug(`Compressed asset: ${asset.id}, new size: ${compressedAsset.size}`);
      } catch (error) {
        this.logger.error(`Failed to compress asset ${asset.id}: ${error.message}`);
        this.metrics.recordError(`compress_${asset.type}`);
      }
    }
    return compressedAssets;
  }

  private async compressSingleAsset(asset: Asset): Promise<Asset> {
    // Simulated compression - in production, use real compression libraries
    const compressionRatio = this.getCompressionRatio(asset.type);
    const newSize = Math.round(asset.size * compressionRatio);
    return {
      ...asset,
      size: newSize,
      metadata: {
        ...asset.metadata,
        compressed: true,
        compressionDate: new Date().toISOString(),
        originalSize: asset.size,
      },
    };
  }

  private getCompressionRatio(type: AssetType): number {
    switch (type) {
      case AssetType.IMAGE:
        return 0.6; // 40% reduction
      case AssetType.VIDEO:
        return 0.5; // 50% reduction
      case AssetType.AUDIO:
        return 0.7; // 30% reduction
      default:
        return 1.0; // No compression
    }
  }

  private async storeResults(assets: Asset[], context: AgentContext): Promise<void> {
    this.logger.debug(`Storing compressed assets for fleet: ${context.fleetId}`);
    // Simulated storage - in production, this would update a database or storage system
    context.updateAssets(assets);
  }
}

// src/core/Agent.ts
export interface Agent {
  getName(): string;
  getVersion(): string;
  execute(context: AgentContext): Promise<void>;
}

export interface AgentContext {
  fleetId: string;
  assets: Asset[];
  updateAssets(assets: Asset[]): void;
}

// src/models/Asset.ts
export enum AssetType {
  IMAGE = 'IMAGE',
  VIDEO = 'VIDEO',
  AUDIO = 'AUDIO',
  DOCUMENT = 'DOCUMENT',
}

export interface Asset {
  id: string;
  type: AssetType;
  size: number;
  metadata: Record<string, any>;
}

// src/utils/Logger.ts
export class Logger {
  info(message: string): void {
    console.log(`[INFO] ${message}`);
  }

  debug(message: string): void {
    console.log(`[DEBUG] ${message}`);
  }

  error(message: string): void {
    console.error(`[ERROR] ${message}`);
  }
}

// src/metrics/PerformanceMetrics.ts
export class PerformanceMetrics {
  private metrics: Record<string, number[]> = {};
  private errors: Record<string, number> = {};

  recordOperation(operation: string, duration: number): void {
    if (!this.metrics[operation]) {
      this.metrics[operation] = [];
    }
    this.metrics[operation].push(duration);
  }

  recordError(operation: string): void {
    if (!this.errors[operation]) {
      this.errors[operation] = 0;
    }
    this.errors[operation]++;
  }

  getMetrics(): Record<string, number[]> {
    return this.metrics;
  }

  getErrors(): Record<string, number> {
    return this.errors;
  }
}

// test/agents/CTAFleetAgent21.test.ts
import { CTAFleetAgent21 } from '../src/agents/CTAFleetAgent21';
import { Logger } from '../src/utils/Logger';
import { PerformanceMetrics } from '../src/metrics/PerformanceMetrics';
import { Asset, AssetType } from '../src/models/Asset';
import { AgentContext } from '../src/core/Agent';

describe('CTAFleetAgent21 - Asset Compression', () => {
  let agent: CTAFleetAgent21;
  let logger: Logger;
  let metrics: PerformanceMetrics;
  let mockContext: AgentContext;
  let mockAssets: Asset[];

  beforeEach(() => {
    logger = new Logger();
    metrics = new PerformanceMetrics();
    agent = new CTAFleetAgent21(logger, metrics);

    mockAssets = [
      {
        id: 'asset1',
        type: AssetType.IMAGE,
        size: 2000000, // 2MB
        metadata: {},
      },
      {
        id: 'asset2',
        type: AssetType.VIDEO,
        size: 5000000, // 5MB
        metadata: {},
      },
      {
        id: 'asset3',
        type: AssetType.AUDIO,
        size: 1500000, // 1.5MB
        metadata: {},
      },
      {
        id: 'asset4',
        type: AssetType.DOCUMENT,
        size: 2000000, // 2MB but unsupported type
        metadata: {},
      },
    ];

    mockContext = {
      fleetId: 'fleet123',
      assets: mockAssets,
      updateAssets: jest.fn(),
    };
  });

  test('should initialize agent with correct name and version', () => {
    expect(agent.getName()).toBe('CTAFleet Agent 21: Asset Compression');
    expect(agent.getVersion()).toBe('1.0.0');
  });

  test('should compress supported assets and update context', async () => {
    await agent.execute(mockContext);

    expect(mockContext.updateAssets).toHaveBeenCalled();
    const updatedAssets = (mockContext.updateAssets as jest.Mock).mock.calls[0][0];
    expect(updatedAssets.length).toBe(3); // Only supported types

    // Check compression ratios
    const imageAsset = updatedAssets.find(a => a.type === AssetType.IMAGE);
    const videoAsset = updatedAssets.find(a => a.type === AssetType.VIDEO);
    const audioAsset = updatedAssets.find(a => a.type === AssetType.AUDIO);

    expect(imageAsset.size).toBeCloseTo(2000000 * 0.6, 0); // 40% reduction
    expect(videoAsset.size).toBeCloseTo(5000000 * 0.5, 0); // 50% reduction
    expect(audioAsset.size).toBeCloseTo(1500000 * 0.7, 0); // 30% reduction

    // Check metadata
    expect(imageAsset.metadata.compressed).toBe(true);
    expect(imageAsset.metadata.originalSize).toBe(2000000);
  });

  test('should record performance metrics', async () => {
    await agent.execute(mockContext);
    const metricsData = metrics.getMetrics();
    expect(metricsData['assetCompression']).toBeDefined();
    expect(metricsData['compress_IMAGE']).toBeDefined();
    expect(metricsData['compress_VIDEO']).toBeDefined();
    expect(metricsData['compress_AUDIO']).toBeDefined();
  });

  test('should handle empty asset list', async () => {
    mockContext.assets = [];
    await agent.execute(mockContext);
    expect(mockContext.updateAssets).toHaveBeenCalledWith([]);
  });
});
```
