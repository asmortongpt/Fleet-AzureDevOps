import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { VisualQAAgent } from '../VisualQAAgent';

describe('VisualQAAgent', () => {
  let agent: VisualQAAgent;

  beforeEach(async () => {
    agent = new VisualQAAgent();
    await agent.initialize();
  });

  afterEach(async () => {
    if (agent) {
      await (agent as any).cleanup?.();
    }
  });

  it('should capture screenshots at all 6 breakpoints', async () => {
    const breakpoints = [375, 480, 768, 1024, 1440, 1920];
    const screenshots = await agent.captureBreakpoints({
      pages: ['/', '/dashboard'],
      breakpoints
    });

    expect(screenshots).toBeDefined();
    expect(Object.keys(screenshots).length).toBeGreaterThan(0);
    breakpoints.forEach(bp => {
      expect(screenshots[bp]).toBeDefined();
      expect(screenshots[bp]['/'] || screenshots[bp]['/dashboard']).toBeDefined();
    });
  });

  it('should detect text overflow issues', async () => {
    const result = await agent.analyzeForTextOverflow('/');

    expect(result).toHaveProperty('page', '/');
    expect(result).toHaveProperty('screenshot');
    expect(result).toHaveProperty('issues');
    expect(Array.isArray(result.issues)).toBe(true);

    // If issues found, they should have structure
    if (result.issues.length > 0) {
      expect(result.issues[0]).toHaveProperty('type', 'text-overflow');
      expect(result.issues[0]).toHaveProperty('selector');
      expect(result.issues[0]).toHaveProperty('text');
    }
  });

  it('should compare current state against baseline', async () => {
    const current = await agent.captureCurrentState('/', 1920);
    const baseline = await agent.getBaseline('/', 1920);

    expect(current).toBeDefined();
    expect(baseline).toBeDefined();

    const diff = await agent.compareWithBaseline(current, baseline);

    expect(diff).toHaveProperty('pixelDifference');
    expect(diff).toHaveProperty('percentChanged');
    expect(diff).toHaveProperty('screenshot');
    expect(typeof diff.pixelDifference).toBe('number');
    expect(typeof diff.percentChanged).toBe('number');
  });

  it('should execute complete visual QA validation', async () => {
    const results = await agent.execute();

    expect(results).toHaveProperty('screenshots');
    expect(results).toHaveProperty('issues');
    expect(Array.isArray(results.issues)).toBe(true);
    expect(results).toHaveProperty('timestamp');
  });

  it('should return results via getResults', async () => {
    await agent.execute();
    const results = agent.getResults();

    expect(results).toBeDefined();
    expect(results.screenshots).toBeDefined();
  });
});
