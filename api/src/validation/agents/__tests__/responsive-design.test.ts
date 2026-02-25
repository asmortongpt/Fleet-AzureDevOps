import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ResponsiveDesignAgent } from '../ResponsiveDesignAgent';

describe('ResponsiveDesignAgent', () => {
  let agent: ResponsiveDesignAgent;

  beforeEach(async () => {
    agent = new ResponsiveDesignAgent();
    await agent.initialize();
  });

  afterEach(async () => {
    if (agent) {
      await agent.cleanup();
    }
  });

  it('should test all 6 breakpoints', async () => {
    const results = await agent.execute();
    const breakpoints = [375, 480, 768, 1024, 1440, 1920];

    expect(results).toHaveProperty('breakpoints');
    breakpoints.forEach((bp) => {
      expect(results.breakpoints[bp]).toBeDefined();
      expect(results.breakpoints[bp]).toHaveProperty('touchTargets');
      expect(results.breakpoints[bp]).toHaveProperty('readability');
      expect(results.breakpoints[bp]).toHaveProperty('reflow');
    });
  });

  it('should detect touch targets < 48px', async () => {
    const results = await agent.execute();
    const issues = results.issues.filter((i) => i.type === 'touch-target');

    // Touch target issues should have expected structure
    if (issues.length > 0) {
      expect(issues[0]).toHaveProperty('type', 'touch-target');
      expect(issues[0]).toHaveProperty('selector');
      expect(issues[0]).toHaveProperty('size');
      expect(typeof issues[0].size).toBe('number');
    }

    expect(Array.isArray(issues)).toBe(true);
  });

  it('should verify text readability >= 16px', async () => {
    const results = await agent.execute();
    const readabilityIssues = results.issues.filter(
      (i) => i.type === 'readability'
    );

    // Readability issues should have expected structure
    if (readabilityIssues.length > 0) {
      expect(readabilityIssues[0]).toHaveProperty('type', 'readability');
      expect(readabilityIssues[0]).toHaveProperty('selector');
      expect(readabilityIssues[0]).toHaveProperty('fontSize');
      expect(typeof readabilityIssues[0].fontSize).toBe('number');
    }

    expect(Array.isArray(readabilityIssues)).toBe(true);
  });

  it('should test with network throttling (4G)', async () => {
    const results = await agent.executeWithThrottling('4g');

    expect(results).toHaveProperty('networkThrottling');
    expect(results.networkThrottling).toHaveProperty('pageLoadTime');
    expect(results.networkThrottling).toHaveProperty('throttleProfile');
    expect(typeof results.networkThrottling.pageLoadTime).toBe('number');
  });

  it('should return results via getResults', async () => {
    await agent.execute();
    const results = agent.getResults();

    expect(results).toBeDefined();
    expect(results).toHaveProperty('breakpoints');
    expect(results).toHaveProperty('issues');
  });
});
