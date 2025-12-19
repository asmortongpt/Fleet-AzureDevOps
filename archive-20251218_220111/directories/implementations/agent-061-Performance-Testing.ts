```typescript
// ctaFleetAgent61.ts
import { performance } from 'perf_hooks';

// Interface for performance metrics
interface PerformanceMetrics {
  executionTime: number;
  memoryUsage: number;
  cpuUsage: number;
}

// Class to handle performance testing for CTAFleet Agent
export class CTAFleetAgentPerformanceTester {
  private metrics: PerformanceMetrics[] = [];

  constructor() {
    console.log('CTAFleet Agent 61 Performance Tester initialized');
  }

  // Method to simulate workload for testing
  private simulateWorkload(iterations: number): void {
    const start = performance.now();
    let result = 0;
    for (let i = 0; i < iterations; i++) {
      result += Math.sqrt(i) * Math.random();
    }
    const end = performance.now();
    console.log(`Workload simulation completed in ${end - start}ms`);
  }

  // Method to measure performance metrics
  public measurePerformance(iterations: number = 1000000): PerformanceMetrics {
    const startTime = performance.now();
    const startMemory = process.memoryUsage().heapUsed;

    // Simulate workload
    this.simulateWorkload(iterations);

    const endTime = performance.now();
    const endMemory = process.memoryUsage().heapUsed;

    // Calculate metrics
    const metrics: PerformanceMetrics = {
      executionTime: endTime - startTime,
      memoryUsage: (endMemory - startMemory) / 1024 / 1024, // Convert to MB
      cpuUsage: process.cpuUsage().user / 1000000, // Convert to seconds
    };

    this.metrics.push(metrics);
    return metrics;
  }

  // Method to get average performance metrics
  public getAverageMetrics(): PerformanceMetrics {
    if (this.metrics.length === 0) {
      return { executionTime: 0, memoryUsage: 0, cpuUsage: 0 };
    }

    const total = this.metrics.reduce(
      (acc, curr) => ({
        executionTime: acc.executionTime + curr.executionTime,
        memoryUsage: acc.memoryUsage + curr.memoryUsage,
        cpuUsage: acc.cpuUsage + curr.cpuUsage,
      }),
      { executionTime: 0, memoryUsage: 0, cpuUsage: 0 }
    );

    return {
      executionTime: total.executionTime / this.metrics.length,
      memoryUsage: total.memoryUsage / this.metrics.length,
      cpuUsage: total.cpuUsage / this.metrics.length,
    };
  }

  // Method to reset metrics
  public resetMetrics(): void {
    this.metrics = [];
    console.log('Performance metrics reset');
  }
}

// ctaFleetAgent61.test.ts
import { CTAFleetAgentPerformanceTester } from './ctaFleetAgent61';
import { expect } from 'bun:test';

describe('CTAFleet Agent 61 Performance Tester', () => {
  let tester: CTAFleetAgentPerformanceTester;

  beforeEach(() => {
    tester = new CTAFleetAgentPerformanceTester();
    tester.resetMetrics();
  });

  test('should measure performance metrics correctly', () => {
    const metrics = tester.measurePerformance(100000);
    
    expect(metrics.executionTime).toBeGreaterThan(0);
    expect(metrics.memoryUsage).toBeGreaterThanOrEqual(0);
    expect(metrics.cpuUsage).toBeGreaterThanOrEqual(0);
  });

  test('should calculate average metrics correctly', () => {
    // Run multiple performance tests
    tester.measurePerformance(100000);
    tester.measurePerformance(100000);
    const avgMetrics = tester.getAverageMetrics();

    expect(avgMetrics.executionTime).toBeGreaterThan(0);
    expect(avgMetrics.memoryUsage).toBeGreaterThanOrEqual(0);
    expect(avgMetrics.cpuUsage).toBeGreaterThanOrEqual(0);
  });

  test('should return zero metrics when no data is available', () => {
    const avgMetrics = tester.getAverageMetrics();
    
    expect(avgMetrics.executionTime).toBe(0);
    expect(avgMetrics.memoryUsage).toBe(0);
    expect(avgMetrics.cpuUsage).toBe(0);
  });

  test('should reset metrics correctly', () => {
    tester.measurePerformance(100000);
    tester.resetMetrics();
    const avgMetrics = tester.getAverageMetrics();
    
    expect(avgMetrics.executionTime).toBe(0);
    expect(avgMetrics.memoryUsage).toBe(0);
    expect(avgMetrics.cpuUsage).toBe(0);
  });

  test('should handle different workload sizes', () => {
    const smallWorkload = tester.measurePerformance(10000);
    const largeWorkload = tester.measurePerformance(1000000);
    
    expect(largeWorkload.executionTime).toBeGreaterThan(smallWorkload.executionTime);
  });
});

// main.ts - Example usage
async function runPerformanceTests() {
  const tester = new CTAFleetAgentPerformanceTester();
  
  console.log('Running performance tests for CTAFleet Agent 61...');
  
  // Run multiple tests to get average
  for (let i = 0; i < 3; i++) {
    console.log(`Test Run ${i + 1}:`);
    const metrics = tester.measurePerformance();
    console.log('Metrics:', {
      ExecutionTime: `${metrics.executionTime.toFixed(2)} ms`,
      MemoryUsage: `${metrics.memoryUsage.toFixed(2)} MB`,
      CPUUsage: `${metrics.cpuUsage.toFixed(2)} s`
    });
  }
  
  const avgMetrics = tester.getAverageMetrics();
  console.log('\nAverage Metrics:', {
    ExecutionTime: `${avgMetrics.executionTime.toFixed(2)} ms`,
    MemoryUsage: `${avgMetrics.memoryUsage.toFixed(2)} MB`,
    CPUUsage: `${avgMetrics.cpuUsage.toFixed(2)} s`
  });
}

// Run the tests if this is the main module
if (require.main === module) {
  runPerformanceTests().catch(console.error);
}
```
