import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { AccessibilityPerformanceAgent } from '../AccessibilityPerformanceAgent';

describe('AccessibilityPerformanceAgent', () => {
  let agent: AccessibilityPerformanceAgent;

  beforeEach(async () => {
    agent = new AccessibilityPerformanceAgent();
    await agent.initialize();
  });

  afterEach(async () => {
    if (agent) {
      await agent.cleanup();
    }
  });

  it('should audit WCAG 2.1 AA compliance', async () => {
    const results = await agent.execute();

    expect(results).toHaveProperty('wcagAudit');
    expect(results.wcagAudit).toHaveProperty('level', 'AA');
    expect(results.wcagAudit).toHaveProperty('violations');
    expect(Array.isArray(results.wcagAudit.violations)).toBe(true);
  });

  it('should check Lighthouse performance score', async () => {
    const results = await agent.execute();

    expect(results).toHaveProperty('lighthouseScores');
    expect(results.lighthouseScores).toHaveProperty('performance');
    expect(results.lighthouseScores).toHaveProperty('accessibility');
    expect(results.lighthouseScores).toHaveProperty('bestPractices');
    expect(results.lighthouseScores).toHaveProperty('seo');
    ['performance', 'accessibility', 'bestPractices', 'seo'].forEach(metric => {
      expect(typeof results.lighthouseScores[metric]).toBe('number');
      expect(results.lighthouseScores[metric]).toBeGreaterThanOrEqual(0);
      expect(results.lighthouseScores[metric]).toBeLessThanOrEqual(100);
    });
  });

  it('should measure Core Web Vitals', async () => {
    const results = await agent.execute();

    expect(results).toHaveProperty('coreWebVitals');
    expect(results.coreWebVitals).toHaveProperty('lcp'); // Largest Contentful Paint
    expect(results.coreWebVitals).toHaveProperty('fid'); // First Input Delay
    expect(results.coreWebVitals).toHaveProperty('cls'); // Cumulative Layout Shift

    expect(typeof results.coreWebVitals.lcp).toBe('number');
    expect(typeof results.coreWebVitals.fid).toBe('number');
    expect(typeof results.coreWebVitals.cls).toBe('number');
  });

  it('should check keyboard navigation', async () => {
    const results = await agent.execute();

    expect(results).toHaveProperty('keyboardNavigation');
    expect(results.keyboardNavigation).toHaveProperty('issues');
    expect(Array.isArray(results.keyboardNavigation.issues)).toBe(true);
    expect(results.keyboardNavigation).toHaveProperty('tabOrderCorrect');
  });

  it('should validate screen reader compatibility', async () => {
    const results = await agent.execute();

    expect(results).toHaveProperty('screenReaderCompatibility');
    expect(results.screenReaderCompatibility).toHaveProperty('ariaLabelsUsed');
    expect(results.screenReaderCompatibility).toHaveProperty('landmarksPresent');
    expect(results.screenReaderCompatibility).toHaveProperty('headingStructure');
  });

  it('should return results via getResults', async () => {
    await agent.execute();
    const results = agent.getResults();

    expect(results).toBeDefined();
    expect(results).toHaveProperty('wcagAudit');
    expect(results).toHaveProperty('lighthouseScores');
    expect(results).toHaveProperty('coreWebVitals');
    expect(results).toHaveProperty('keyboardNavigation');
    expect(results).toHaveProperty('screenReaderCompatibility');
  });
});
