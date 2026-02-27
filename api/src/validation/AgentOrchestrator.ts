import { logger } from '../lib/logger';
import { AgentResult } from './ValidationFramework';
import { VisualQAAgent } from './agents/VisualQAAgent';
import { ResponsiveDesignAgent } from './agents/ResponsiveDesignAgent';
import { ScrollingAuditAgent } from './agents/ScrollingAuditAgent';
import { TypographyAgent } from './agents/TypographyAgent';
import { InteractionQualityAgent } from './agents/InteractionQualityAgent';
import { DataIntegrityAgent } from './agents/DataIntegrityAgent';

/**
 * Orchestrates parallel execution of all 6 validation agents
 */
export interface ExecutionResults {
  visualQA: AgentResult;
  responsiveDesign: AgentResult;
  scrollingAudit: AgentResult;
  typography: AgentResult;
  interactions: AgentResult;
  dataIntegrity: AgentResult;
}

/**
 * Agent interface for cleanup
 */
export interface Agent {
  initialize(): Promise<void>;
  execute(): Promise<AgentResult>;
  cleanup(): Promise<void>;
}

/**
 * Agent orchestrator for coordinating parallel validation execution
 * Manages the lifecycle and execution of all 6 specialized validation agents
 * Guarantees cleanup even if agents fail
 */
export class AgentOrchestrator {
  private static readonly EXECUTION_TIMEOUT = 5 * 60 * 1000; // 5 minutes

  /**
   * Execute all 6 validation agents in parallel
   * Guarantees cleanup via finally block even if agents fail
   * @returns Results from all agents
   * @throws Error if execution fails or times out
   */
  async executeAllAgents(): Promise<ExecutionResults> {
    const agents: Agent[] = [];

    try {
      // Create real validation agents
      const agentsToCreate = this.createRealAgents();
      agents.push(...agentsToCreate);

      logger.info(`Starting execution of ${agents.length} validation agents`);

      // Execute all agents in parallel with timeout protection
      const executionPromise = Promise.all(
        agents.map(async (agent) => {
          try {
            await agent.initialize();
            const result = await agent.execute();
            logger.debug(`Agent ${agent.constructor.name} completed execution`);
            return result;
          } catch (error) {
            logger.error(`Agent execution error for ${agent.constructor.name}`, { error });
            // Continue with other agents instead of failing entirely
            return { issues: [], error: error instanceof Error ? error.message : 'Unknown error' };
          }
        })
      );

      // Race between execution and timeout
      const timeout = new Promise<AgentResult[]>((_, reject) =>
        setTimeout(() => {
          logger.error('Validation execution timeout');
          reject(new Error('Validation timeout after 5 minutes'));
        }, AgentOrchestrator.EXECUTION_TIMEOUT)
      );

      const results = await Promise.race([executionPromise, timeout]);

      logger.info('Agent execution completed successfully', {
        agentCount: agents.length,
        resultsCount: results.length
      });

      return {
        visualQA: results[0] || { issues: [] },
        responsiveDesign: results[1] || { issues: [] },
        scrollingAudit: results[2] || { issues: [] },
        typography: results[3] || { issues: [] },
        interactions: results[4] || { issues: [] },
        dataIntegrity: results[5] || { issues: [] }
      };
    } catch (error) {
      logger.error('Agent orchestration failed', { error });
      throw error;
    } finally {
      // Guarantee cleanup of all agents even if execution fails
      await this.cleanupAllAgents(agents);
    }
  }

  /**
   * Create real validation agents
   */
  private createRealAgents(): Agent[] {
    return [
      new VisualQAAgent(),
      new ResponsiveDesignAgent(),
      new ScrollingAuditAgent(),
      new TypographyAgent(),
      new InteractionQualityAgent(),
      new DataIntegrityAgent()
    ];
  }

  /**
   * Cleanup all agents with error handling
   * Attempts cleanup on all agents even if some fail
   */
  private async cleanupAllAgents(agents: Agent[]): Promise<void> {
    const cleanupResults = await Promise.allSettled(
      agents.map(async (agent) => {
        try {
          await agent.cleanup();
        } catch (error) {
          logger.error('Error during agent cleanup', { error });
          // Don't throw - we want all agents to attempt cleanup
        }
      })
    );

    // Log any cleanup failures
    cleanupResults.forEach((result, index) => {
      if (result.status === 'rejected') {
        logger.warn(`Agent ${index} cleanup failed`, { reason: result.reason });
      }
    });
  }
}
