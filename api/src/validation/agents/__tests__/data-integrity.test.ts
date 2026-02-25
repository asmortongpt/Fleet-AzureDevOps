import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { DataIntegrityAgent } from '../DataIntegrityAgent';

describe('DataIntegrityAgent', () => {
  let agent: DataIntegrityAgent;

  beforeEach(async () => {
    agent = new DataIntegrityAgent();
    await agent.initialize();
  });

  afterEach(async () => {
    if (agent) {
      await agent.cleanup();
    }
  });

  it('should trace end-to-end data flow', async () => {
    const results = await agent.execute();

    expect(results).toHaveProperty('dataFlows');
    expect(Array.isArray(results.dataFlows)).toBe(true);
    results.dataFlows.forEach((flow: any) => {
      expect(flow).toHaveProperty('source');
      expect(flow).toHaveProperty('destination');
      expect(flow).toHaveProperty('dataType');
      expect(flow).toHaveProperty('flowTime');
    });
  });

  it('should verify multi-tenant data isolation', async () => {
    const results = await agent.execute();

    expect(results).toHaveProperty('tenantIsolation');
    expect(results.tenantIsolation).toHaveProperty('violations');
    expect(Array.isArray(results.tenantIsolation.violations)).toBe(true);
    expect(results.tenantIsolation).toHaveProperty('compliant');
  });

  it('should validate data formatting (numbers, dates, currency)', async () => {
    const results = await agent.execute();

    expect(results).toHaveProperty('formatValidation');
    expect(results.formatValidation).toHaveProperty('numbers');
    expect(results.formatValidation).toHaveProperty('dates');
    expect(results.formatValidation).toHaveProperty('currency');
    expect(results.formatValidation).toHaveProperty('allValid');
  });

  it('should check database constraint enforcement', async () => {
    const results = await agent.execute();

    expect(results).toHaveProperty('databaseConstraints');
    expect(Array.isArray(results.databaseConstraints.enforced)).toBe(true);
    expect(Array.isArray(results.databaseConstraints.violations)).toBe(true);
  });

  it('should validate time-series data accuracy', async () => {
    const results = await agent.execute();

    expect(results).toHaveProperty('timeSeriesData');
    expect(results.timeSeriesData).toHaveProperty('gaps');
    expect(results.timeSeriesData).toHaveProperty('duplicates');
    expect(results.timeSeriesData).toHaveProperty('consistency');
  });

  it('should return results via getResults', async () => {
    await agent.execute();
    const results = agent.getResults();

    expect(results).toBeDefined();
    expect(results).toHaveProperty('dataFlows');
    expect(results).toHaveProperty('tenantIsolation');
  });
});
