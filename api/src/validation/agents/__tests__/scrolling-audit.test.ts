import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ScrollingAuditAgent } from '../ScrollingAuditAgent';

describe('ScrollingAuditAgent', () => {
  let agent: ScrollingAuditAgent;

  beforeEach(async () => {
    agent = new ScrollingAuditAgent();
    await agent.initialize();
  });

  afterEach(async () => {
    if (agent) {
      await agent.cleanup();
    }
  });

  it('should detect all scrolling instances', async () => {
    const results = await agent.execute();

    expect(results).toHaveProperty('scrollInstances');
    expect(Array.isArray(results.scrollInstances)).toBe(true);
    expect(results).toHaveProperty('timestamp');
  });

  it('should identify scrolling root causes', async () => {
    const results = await agent.execute();
    const scrolls = results.scrollInstances;

    scrolls.forEach((scroll: any) => {
      expect(scroll).toHaveProperty('selector');
      expect(scroll).toHaveProperty('direction');
      expect(scroll).toHaveProperty('height');
      expect(scroll).toHaveProperty('scrollHeight');
      expect(scroll).toHaveProperty('rootCause');
    });
  });

  it('should propose solutions for each scroll', async () => {
    const results = await agent.execute();
    const scrolls = results.scrollInstances;

    if (scrolls.length > 0) {
      expect(scrolls[0]).toHaveProperty('proposedSolutions');
      expect(Array.isArray(scrolls[0].proposedSolutions)).toBe(true);

      if (scrolls[0].proposedSolutions.length > 0) {
        expect(scrolls[0].proposedSolutions[0]).toHaveProperty('type');
        expect(scrolls[0].proposedSolutions[0]).toHaveProperty('description');
      }
    }
  });

  it('should categorize scrolling by severity', async () => {
    const results = await agent.execute();

    expect(results).toHaveProperty('summary');
    expect(results.summary).toHaveProperty('totalScrolls');
    expect(results.summary).toHaveProperty('criticalScrolls');
    expect(results.summary).toHaveProperty('highScrolls');
  });

  it('should return results via getResults', async () => {
    await agent.execute();
    const results = agent.getResults();

    expect(results).toBeDefined();
    expect(results).toHaveProperty('scrollInstances');
    expect(results).toHaveProperty('summary');
  });
});
