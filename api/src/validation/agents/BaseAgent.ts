/**
 * Configuration options for validation agents
 */
export interface AgentConfig {
  headless?: boolean;
  timeout?: number;
  retries?: number;
}

/**
 * Abstract base class for all validation agents
 * Provides common interface and configuration management
 */
export abstract class BaseAgent {
  protected config: AgentConfig;

  constructor(config: AgentConfig = {}) {
    this.config = {
      headless: true,
      timeout: 30000,
      retries: 3,
      ...config
    };
  }

  /**
   * Initialize the agent
   * Must be called before execute()
   */
  abstract initialize(): Promise<void>;

  /**
   * Execute the validation
   */
  abstract execute(): Promise<any>;

  /**
   * Get the validation results
   */
  abstract getResults(): any;

  /**
   * Helper: Convert config timeout to seconds
   */
  protected getTimeoutSeconds(): number {
    return Math.ceil((this.config.timeout || 30000) / 1000);
  }
}
