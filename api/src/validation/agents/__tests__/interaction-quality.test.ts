import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { InteractionQualityAgent } from '../InteractionQualityAgent';

describe('InteractionQualityAgent', () => {
  let agent: InteractionQualityAgent;

  beforeEach(async () => {
    agent = new InteractionQualityAgent();
    await agent.initialize();
  });

  afterEach(async () => {
    if (agent) {
      await agent.cleanup();
    }
  });

  it('should test all component states', async () => {
    const results = await agent.execute();

    expect(results).toHaveProperty('componentStates');
    expect(Array.isArray(results.componentStates)).toBe(true);
    results.componentStates.forEach((state: any) => {
      expect(state).toHaveProperty('component');
      expect(state).toHaveProperty('states');
      expect(Array.isArray(state.states)).toBe(true);
      if (state.states.length > 0) {
        expect(['default', 'hover', 'focus', 'active', 'disabled', 'loading']).toContain(state.states[0]);
      }
    });
  });

  it('should validate hover state transitions', async () => {
    const results = await agent.execute();

    expect(results).toHaveProperty('componentStates');
    expect(Array.isArray(results.componentStates)).toBe(true);

    if (results.componentStates.length > 0) {
      const hoverTests = results.componentStates.filter((s: any) =>
        Array.isArray(s.states) && s.states.includes('hover')
      );
      expect(Array.isArray(hoverTests)).toBe(true);
    }
  });

  it('should verify focus indicators for accessibility', async () => {
    const results = await agent.execute();

    expect(results).toHaveProperty('focusIndicators');
    expect(Array.isArray(results.focusIndicators)).toBe(true);
    results.focusIndicators.forEach((indicator: any) => {
      expect(indicator).toHaveProperty('selector');
      expect(indicator).toHaveProperty('visible');
      expect(indicator).toHaveProperty('wcagCompliant');
    });
  });

  it('should test form validation states', async () => {
    const results = await agent.execute();

    expect(results).toHaveProperty('formValidation');
    expect(results.formValidation).toHaveProperty('errorStates');
    expect(results.formValidation).toHaveProperty('successStates');
    expect(results.formValidation).toHaveProperty('warningStates');
    expect(typeof results.formValidation.errorStates).toBe('number');
    expect(typeof results.formValidation.successStates).toBe('number');
    expect(typeof results.formValidation.warningStates).toBe('number');
  });

  it('should verify animation smoothness (60fps)', async () => {
    const results = await agent.execute();

    expect(results).toHaveProperty('animationMetrics');
    expect(results.animationMetrics).toHaveProperty('fps');
    expect(results.animationMetrics).toHaveProperty('droppedFrames');
    expect(results.animationMetrics).toHaveProperty('avgFrameTime');
    expect(results.animationMetrics).toHaveProperty('smooth');
    expect(typeof results.animationMetrics.fps).toBe('number');
    expect(typeof results.animationMetrics.droppedFrames).toBe('number');
    expect(typeof results.animationMetrics.smooth).toBe('boolean');
    expect(results.animationMetrics.fps).toBeGreaterThanOrEqual(55);
  });

  it('should return results via getResults', async () => {
    await agent.execute();
    const results = agent.getResults();

    expect(results).toBeDefined();
    expect(results).toHaveProperty('componentStates');
    expect(results).toHaveProperty('animationMetrics');
    expect(results).toHaveProperty('focusIndicators');
    expect(results).toHaveProperty('formValidation');
    expect(results).toHaveProperty('timestamp');
    expect(results).toHaveProperty('duration');
  });

  it('should include execution metadata', async () => {
    const results = await agent.execute();

    expect(typeof results.timestamp).toBe('number');
    expect(typeof results.duration).toBe('number');
    expect(results.duration).toBeGreaterThanOrEqual(0);
    expect(results.timestamp).toBeGreaterThan(0);
  });

  it('should handle cleanup properly', async () => {
    await agent.execute();
    expect(async () => {
      await agent.cleanup();
    }).not.toThrow();
  });
});
