import { BaseAgent, AgentConfig } from './BaseAgent';
import { ScreenshotCapture } from '../ScreenshotCapture';
import {
  InteractionValidator,
  ComponentStateTest,
  FocusIndicator,
  FormValidationStates,
  AnimationMetrics,
} from '../InteractionValidator';
import { logger } from '../../lib/logger';

/**
 * Interaction quality validation result
 */
export interface InteractionQualityResult {
  componentStates: ComponentStateTest[];
  focusIndicators: FocusIndicator[];
  formValidation: FormValidationStates;
  animationMetrics: AnimationMetrics;
  timestamp: number;
  duration: number;
}

/**
 * Interaction Quality Agent
 * Validates all component states (hover, focus, active, disabled, loading)
 * and animation smoothness using strict validation rules
 */
export class InteractionQualityAgent extends BaseAgent {
  private screenshotCapture: ScreenshotCapture;
  private validator: InteractionValidator;
  private results: InteractionQualityResult | null = null;

  private readonly baseUrl: string;
  private readonly PAGES = ['/', '/vehicles', '/drivers', '/dashboard'];

  /**
   * Initialize the agent with configuration
   */
  constructor(config?: AgentConfig) {
    super(config);
    this.baseUrl = config?.baseUrl || 'http://localhost:5173';
    this.screenshotCapture = new ScreenshotCapture(config);
    this.validator = new InteractionValidator();
  }

  /**
   * Initialize the agent
   * Sets up browser resources and validation framework
   */
  async initialize(): Promise<void> {
    try {
      logger.debug('Initializing InteractionQualityAgent');
      await this.screenshotCapture.launch();
      logger.debug('InteractionQualityAgent initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize InteractionQualityAgent', { error });
      throw error;
    }
  }

  /**
   * Execute interaction quality validation
   * Tests component states, focus indicators, form validation, and animations
   */
  async execute<T = InteractionQualityResult>(): Promise<T> {
    try {
      logger.debug('Starting interaction quality validation');
      const startTime = Date.now();

      // Validate component states (default, hover, focus, active, disabled, loading)
      logger.debug('Validating component states');
      const componentStates = await this.validator.validateComponentStates();

      // Validate focus indicators for accessibility compliance
      logger.debug('Validating focus indicators');
      const focusIndicators = await this.validator.validateFocusIndicators();

      // Validate form validation states (error, success, warning)
      logger.debug('Validating form states');
      const formValidation = await this.validator.validateFormStates();

      // Measure animation performance and smoothness
      logger.debug('Measuring animation performance');
      const animationMetrics = await this.validator.measureAnimationPerformance();

      // Verify animation smoothness meets requirements
      const isSmooth = this.validator.isAnimationSmooth(animationMetrics.fps);
      logger.debug('Animation smoothness check', {
        fps: animationMetrics.fps,
        smooth: isSmooth,
        droppedFrames: animationMetrics.droppedFrames,
      });

      // Compile results
      this.results = {
        componentStates,
        focusIndicators,
        formValidation,
        animationMetrics,
        timestamp: Date.now(),
        duration: Date.now() - startTime,
      };

      logger.debug('Interaction quality validation complete', {
        duration: this.results.duration,
        componentsTestedCount: componentStates.length,
        focusIndicatorsCount: focusIndicators.length,
        animationSmooth: animationMetrics.smooth,
        fps: animationMetrics.fps,
      });

      return this.results as T;
    } catch (error) {
      logger.error('Interaction quality validation failed', { error });
      throw error;
    }
  }

  /**
   * Get the validation results
   * Returns the last executed validation results or null
   */
  getResults<T = InteractionQualityResult>(): T | null {
    return this.results as T | null;
  }

  /**
   * Cleanup resources allocated by the agent
   * Closes browser and cleans up resources
   */
  async cleanup(): Promise<void> {
    try {
      logger.debug('Cleaning up InteractionQualityAgent resources');
      await this.screenshotCapture.close();
      logger.debug('InteractionQualityAgent cleanup complete');
    } catch (error) {
      logger.warn('Error during InteractionQualityAgent cleanup', { error });
    }
  }
}
