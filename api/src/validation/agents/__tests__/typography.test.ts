import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { TypographyAgent } from '../TypographyAgent';

describe('TypographyAgent', () => {
  let agent: TypographyAgent;

  beforeEach(async () => {
    agent = new TypographyAgent();
    await agent.initialize();
  });

  afterEach(async () => {
    if (agent) {
      await agent.cleanup();
    }
  });

  it('should detect text truncation issues', async () => {
    const results = await agent.execute();

    expect(results).toHaveProperty('truncationIssues');
    expect(Array.isArray(results.truncationIssues)).toBe(true);
    expect(results).toHaveProperty('timestamp');
  });

  it('should validate text with realistic content', async () => {
    const results = await agent.execute();

    expect(results).toHaveProperty('contentTests');
    expect(results.contentTests).toHaveProperty('longText');
    expect(results.contentTests).toHaveProperty('multiLanguage');
    expect(results.contentTests).toHaveProperty('specialCharacters');
  });

  it('should check font loading and fallbacks', async () => {
    const results = await agent.execute();

    expect(results).toHaveProperty('fontMetrics');
    if (results.fontMetrics.loadedFonts.length > 0) {
      expect(results.fontMetrics.loadedFonts[0]).toHaveProperty('name');
      expect(results.fontMetrics.loadedFonts[0]).toHaveProperty('weight');
      expect(results.fontMetrics.loadedFonts[0]).toHaveProperty('loaded');
    }
  });

  it('should verify contrast compliance (WCAG)', async () => {
    const results = await agent.execute();

    expect(results).toHaveProperty('contrastIssues');
    expect(Array.isArray(results.contrastIssues)).toBe(true);
    results.contrastIssues.forEach((issue: any) => {
      expect(issue).toHaveProperty('selector');
      expect(issue).toHaveProperty('contrast');
      expect(issue).toHaveProperty('wcagLevel');
    });
  });

  it('should return results via getResults', async () => {
    await agent.execute();
    const results = agent.getResults();

    expect(results).toBeDefined();
    expect(results).toHaveProperty('truncationIssues');
    expect(results).toHaveProperty('fontMetrics');
  });
});
