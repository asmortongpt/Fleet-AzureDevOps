import { BaseAgent, AgentConfig } from './BaseAgent';
import { ScreenshotCapture } from '../ScreenshotCapture';
import { WorkflowExecutor, Scenario, APICall } from '../WorkflowExecutor';
import { logger } from '../../lib/logger';

/**
 * Complete workflow orchestration results with comprehensive session capture
 */
export interface WorkflowOrchestrationResult {
  scenarios: Scenario[];
  apiCalls: APICall[];
  errorScenarios: Array<{
    scenario: string;
    error: string;
    timestamp: number;
  }>;
  summary: {
    totalScenarios: number;
    passedScenarios: number;
    failedScenarios: number;
    totalDuration: number;
    averageStepDuration: number;
  };
  timestamp: number;
  duration: number;
}

/**
 * WorkflowOrchestrationAgent - Executes 30+ complete user journey scenarios
 *
 * Responsibilities:
 * - Load and execute 30+ workflow scenarios end-to-end
 * - Capture complete session state changes with screenshots
 * - Record all API calls with request/response details
 * - Handle errors gracefully and track failures
 * - Calculate comprehensive workflow statistics
 * - Support auth, CRUD, permission, error, and edge-case workflows
 *
 * Extends BaseAgent with workflow orchestration capabilities
 */
export class WorkflowOrchestrationAgent extends BaseAgent {
  private screenshotCapture: ScreenshotCapture;
  private executor: WorkflowExecutor;
  private results: WorkflowOrchestrationResult | null = null;

  private readonly baseUrl: string;

  constructor(config?: AgentConfig) {
    super(config);
    this.baseUrl = config?.baseUrl || 'http://localhost:5173';
    this.screenshotCapture = new ScreenshotCapture(config);
    this.executor = new WorkflowExecutor();
  }

  /**
   * Initialize the agent
   * - Launch Playwright browser
   * - Prepare screenshot capture
   * - Setup logging and telemetry
   */
  async initialize(): Promise<void> {
    try {
      logger.debug('Initializing WorkflowOrchestrationAgent', {
        baseUrl: this.baseUrl,
        timeout: this.config.timeout,
      });

      await this.screenshotCapture.launch();

      logger.debug('WorkflowOrchestrationAgent initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize WorkflowOrchestrationAgent', {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Execute all workflow scenarios and capture complete session data
   *
   * Process:
   * 1. Load all 30+ workflow scenarios
   * 2. Execute each scenario sequentially
   * 3. Capture state changes and API calls
   * 4. Record errors and failures
   * 5. Calculate comprehensive statistics
   */
  async execute<T = WorkflowOrchestrationResult>(): Promise<T> {
    try {
      logger.debug('Starting workflow orchestration');
      const startTime = Date.now();

      // Load all scenarios
      const scenarios = await this.executor.loadScenarios();
      logger.debug(`Loaded ${scenarios.length} scenarios`, {
        total: scenarios.length,
      });

      // Execute each scenario
      const executedScenarios: Scenario[] = [];
      const errors: WorkflowOrchestrationResult['errorScenarios'] = [];

      for (let i = 0; i < scenarios.length; i++) {
        const scenario = scenarios[i];
        try {
          logger.debug(`Executing scenario ${i + 1}/${scenarios.length}`, {
            name: scenario.name,
            type: scenario.type,
          });

          const result = await this.executor.executeScenario(scenario);
          executedScenarios.push(result);

          logger.debug(`Scenario ${i + 1}/${scenarios.length} completed`, {
            passed: result.passed,
            duration: result.duration,
          });
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : String(error);

          logger.error(`Scenario ${i + 1} failed`, {
            name: scenario.name,
            error: errorMessage,
          });

          errors.push({
            scenario: scenario.name,
            error: errorMessage,
            timestamp: Date.now(),
          });

          // Still include the failed scenario
          executedScenarios.push({
            ...scenario,
            passed: false,
            duration: 0,
          });
        }
      }

      // Get recorded API calls
      const apiCalls = this.executor.getAPICallRecords();

      // Calculate summary statistics
      const passedCount = executedScenarios.filter((s) => s.passed).length;
      const failedCount = executedScenarios.filter((s) => !s.passed).length;
      const totalDuration = executedScenarios.reduce((sum, s) => sum + s.duration, 0);
      const totalSteps = executedScenarios.reduce((sum, s) => sum + s.steps.length, 0);
      const averageStepDuration =
        totalSteps > 0 ? totalDuration / totalSteps : 0;

      const summary = {
        totalScenarios: executedScenarios.length,
        passedScenarios: passedCount,
        failedScenarios: failedCount,
        totalDuration,
        averageStepDuration,
      };

      const duration = Date.now() - startTime;

      this.results = {
        scenarios: executedScenarios,
        apiCalls,
        errorScenarios: errors,
        summary,
        timestamp: Date.now(),
        duration,
      };

      logger.debug('Workflow orchestration complete', {
        duration,
        scenariosExecuted: executedScenarios.length,
        passed: summary.passedScenarios,
        failed: summary.failedScenarios,
        apiCallsRecorded: apiCalls.length,
        errors: errors.length,
      });

      return this.results as T;
    } catch (error) {
      logger.error('Workflow orchestration failed', {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Get the latest workflow orchestration results
   * Returns null if execute() hasn't been called yet
   */
  getResults<T = WorkflowOrchestrationResult>(): T | null {
    return this.results as T | null;
  }

  /**
   * Cleanup resources
   * - Close browser instances
   * - Release screenshot capture
   * - Clean up temporary files
   */
  async cleanup(): Promise<void> {
    try {
      logger.debug('Cleaning up WorkflowOrchestrationAgent');
      await this.screenshotCapture.close();
      this.executor.clearAPICallRecords();
      logger.debug('WorkflowOrchestrationAgent cleanup complete');
    } catch (error) {
      logger.error('Error during cleanup', {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
}
