import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { WorkflowOrchestrationAgent } from '../agents/WorkflowOrchestrationAgent';

describe('WorkflowOrchestrationAgent', () => {
  let agent: WorkflowOrchestrationAgent;

  beforeEach(async () => {
    agent = new WorkflowOrchestrationAgent();
    await agent.initialize();
  });

  afterEach(async () => {
    if (agent) {
      await agent.cleanup();
    }
  });

  it('should load all 30+ workflow scenarios', async () => {
    const results = await agent.execute();

    expect(results).toHaveProperty('scenarios');
    expect(results.scenarios.length).toBeGreaterThanOrEqual(30);
  });

  it('should execute complete user journeys', async () => {
    const results = await agent.execute();

    results.scenarios.forEach((scenario: any) => {
      expect(scenario).toHaveProperty('name');
      expect(scenario).toHaveProperty('steps');
      expect(Array.isArray(scenario.steps)).toBe(true);
      expect(scenario.steps.length).toBeGreaterThan(0);
    });
  });

  it('should capture session state changes', async () => {
    const results = await agent.execute();

    if (results.scenarios.length > 0) {
      const scenario = results.scenarios[0];
      scenario.steps.forEach((step: any) => {
        expect(step).toHaveProperty('action');
        expect(step).toHaveProperty('timestamp');
        expect(step).toHaveProperty('resultState');
      });
    }
  });

  it('should record API calls and responses', async () => {
    const results = await agent.execute();

    expect(results).toHaveProperty('apiCalls');
    expect(Array.isArray(results.apiCalls)).toBe(true);
    results.apiCalls.forEach((call: any) => {
      expect(call).toHaveProperty('endpoint');
      expect(call).toHaveProperty('method');
      expect(call).toHaveProperty('statusCode');
      expect(call).toHaveProperty('duration');
    });
  });

  it('should handle errors and edge cases', async () => {
    const results = await agent.execute();

    expect(results).toHaveProperty('errorScenarios');
    expect(Array.isArray(results.errorScenarios)).toBe(true);
  });

  it('should return results via getResults', async () => {
    await agent.execute();
    const results = agent.getResults();

    expect(results).toBeDefined();
    expect(results).toHaveProperty('scenarios');
    expect(results).toHaveProperty('apiCalls');
  });
});
