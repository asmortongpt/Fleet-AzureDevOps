/**
 * Data Integrity Agent
 *
 * Validates end-to-end data flow, multi-tenant isolation, and data formatting
 * using the validation framework.
 *
 * Extends BaseAgent to provide a consistent interface for data integrity validation.
 *
 * @module validation/agents/DataIntegrityAgent
 */

import { BaseAgent, AgentConfig } from './BaseAgent';
import { ScreenshotCapture } from '../ScreenshotCapture';
import {
  DataIntegrityValidator,
  DataFlow,
  TenantIsolation,
  FormatValidation,
  DatabaseConstraints,
  TimeSeriesData
} from '../DataIntegrityValidator';
import { logger } from '../../lib/logger';

/**
 * Data Integrity validation result
 */
export interface DataIntegrityResult {
  dataFlows: DataFlow[];
  tenantIsolation: TenantIsolation;
  formatValidation: FormatValidation;
  databaseConstraints: DatabaseConstraints;
  timeSeriesData: TimeSeriesData;
  timestamp: number;
  duration: number;
}

/**
 * Data Integrity Agent
 *
 * Validates:
 * - End-to-end data flow from UI through APIs to database and back
 * - Multi-tenant isolation (zero cross-tenant data leaks)
 * - Data formatting accuracy (numbers, dates, currency)
 * - Database constraint enforcement
 * - Time-series data accuracy (gaps, duplicates, consistency)
 *
 * Extends BaseAgent for consistent validation agent interface.
 */
export class DataIntegrityAgent extends BaseAgent {
  private screenshotCapture: ScreenshotCapture;
  private validator: DataIntegrityValidator;
  private results: DataIntegrityResult | null = null;
  private readonly baseUrl: string;

  /**
   * Create a new Data Integrity Agent
   *
   * @param config Optional agent configuration
   */
  constructor(config?: AgentConfig) {
    super(config);
    this.baseUrl = config?.baseUrl || 'http://localhost:5173';
    this.screenshotCapture = new ScreenshotCapture(config);
    this.validator = new DataIntegrityValidator();
  }

  /**
   * Initialize the Data Integrity Agent
   *
   * Sets up browser automation and validation infrastructure.
   */
  async initialize(): Promise<void> {
    try {
      logger.debug('Initializing DataIntegrityAgent');
      await this.screenshotCapture.launch();
      logger.debug('DataIntegrityAgent initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize DataIntegrityAgent', { error });
      throw error;
    }
  }

  /**
   * Execute data integrity validation
   *
   * Runs all validation checks:
   * 1. End-to-end data flow tracing
   * 2. Multi-tenant isolation verification
   * 3. Data formatting validation
   * 4. Database constraint enforcement checking
   * 5. Time-series data accuracy validation
   *
   * @returns Data integrity validation results
   */
  async execute<T = DataIntegrityResult>(): Promise<T> {
    try {
      logger.debug('Starting data integrity validation');
      const startTime = Date.now();

      // Run all validation checks in parallel where possible
      const [dataFlows, tenantIsolation, formatValidation, databaseConstraints, timeSeriesData] =
        await Promise.all([
          this.validator.validateDataFlow(),
          this.validator.validateTenantIsolation(),
          this.validator.validateFormatting(),
          this.validator.validateDatabaseConstraints(),
          this.validator.validateTimeSeriesData()
        ]);

      // Compile results
      this.results = {
        dataFlows,
        tenantIsolation,
        formatValidation,
        databaseConstraints,
        timeSeriesData,
        timestamp: Date.now(),
        duration: Date.now() - startTime
      };

      logger.debug('Data integrity validation complete', {
        duration: this.results.duration,
        dataFlowsChecked: dataFlows.length,
        tenantCompliant: tenantIsolation.compliant,
        formatValid: formatValidation.allValid,
        constraintViolations: databaseConstraints.violations.length,
        timeSeriesGaps: timeSeriesData.gaps
      });

      return this.results as T;
    } catch (error) {
      logger.error('Data integrity validation failed', { error });
      throw error;
    }
  }

  /**
   * Get the most recent validation results
   *
   * Returns results from the last execute() call, or null if not yet executed.
   *
   * @returns Last validation results or null
   */
  getResults<T = DataIntegrityResult>(): T | null {
    return this.results as T | null;
  }

  /**
   * Cleanup resources allocated by the agent
   *
   * Closes browser instances and releases resources.
   */
  async cleanup(): Promise<void> {
    try {
      await this.screenshotCapture.close();
    } catch (error) {
      logger.error('Error during DataIntegrityAgent cleanup', { error });
    }
  }
}
