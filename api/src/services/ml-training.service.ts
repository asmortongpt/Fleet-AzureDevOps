/**
 * ML Training Service
 * Manages automated model training, retraining, versioning, and A/B testing
 */

import pool from '../config/database'
import { logger } from '../utils/logger'

export interface TrainingConfig {
  model_name: string
  model_type: string
  algorithm: string
  hyperparameters: Record<string, any>
  data_source: string
  data_filters?: Record<string, any>
  train_start_date?: Date
  train_end_date?: Date
  test_split_ratio?: number
  validation_split_ratio?: number
}

export interface TrainingResult {
  job_id: string
  model_id: string
  status: 'completed' | 'failed'
  performance_metrics: Record<string, any>
  duration_seconds: number
  error_message?: string
}

export interface ABTestConfig {
  test_name: string
  model_a_id: string
  model_b_id: string
  traffic_split_percent: number
  duration_days: number
}

class MLTrainingService {
  private trainingQueue: Map<string, any> = new Map()
  private trainingSchedule: NodeJS.Timeout | null = null

  constructor() {
    this.startScheduledTraining()
  }

  /**
   * Create and execute a training job
   */
  async trainModel(
    tenantId: string,
    userId: string,
    config: TrainingConfig
  ): Promise<TrainingResult> {
    logger.info('Starting model training', { tenantId, modelType: config.model_type })

    const startTime = Date.now()

    try {
      // 1. Create training job
      const jobId = await this.createTrainingJob(tenantId, userId, config)

      // 2. Update job status to running
      await this.updateJobStatus(jobId, 'running', null)

      // 3. Fetch training data
      const trainingData = await this.fetchTrainingData(tenantId, config)

      if (trainingData.length === 0) {
        throw new Error('No training data available')
      }

      // 4. Split data into train/validation/test sets
      const dataSplits = this.splitDataset(
        trainingData,
        config.test_split_ratio || 0.20,
        config.validation_split_ratio || 0.10
      )

      // 5. Train model
      const trainedModel = await this.executeTraining(
        config.model_type,
        config.algorithm,
        config.hyperparameters,
        dataSplits
      )

      // 6. Evaluate model performance
      const performanceMetrics = await this.evaluateModel(trainedModel, dataSplits.test)

      // 7. Create model version
      const modelId = await this.createModelVersion(
        tenantId,
        userId,
        config,
        trainedModel,
        performanceMetrics,
        {
          training_samples: dataSplits.train.length,
          validation_samples: dataSplits.validation.length,
          test_samples: dataSplits.test.length
        }
      )

      // 8. Store performance metrics
      await this.storePerformanceMetrics(modelId, tenantId, performanceMetrics, 'training')

      const duration = Math.round((Date.now() - startTime) / 1000)

      // 9. Update job status to completed
      await this.updateJobStatus(jobId, 'completed', null)
      await this.updateJobWithModel(jobId, modelId, duration, dataSplits)

      logger.info('Model training completed', {
        tenantId,
        jobId,
        modelId,
        duration
      })

      return {
        job_id: jobId,
        model_id: modelId,
        status: 'completed',
        performance_metrics: performanceMetrics,
        duration_seconds: duration
      }
    } catch (error: any) {
      logger.error('Model training failed', { error: error.message, config })

      return {
        job_id: 'unknown',
        model_id: 'unknown',
        status: 'failed',
        performance_metrics: {},
        duration_seconds: Math.round((Date.now() - startTime) / 1000),
        error_message: error.message
      }
    }
  }

  /**
   * Schedule automated retraining
   */
  async scheduleRetraining(
    tenantId: string,
    modelId: string,
    schedule: 'daily' | 'weekly' | 'monthly'
  ): Promise<void> {
    logger.info('Scheduling model retraining', { tenantId, modelId, schedule })

    // Store retraining schedule in model metadata
    await pool.query(
      `UPDATE ml_models
       SET hyperparameters = jsonb_set(
         COALESCE(hyperparameters, '{}'::jsonb),
         '{retraining_schedule}',
         $1::jsonb
       )
       WHERE id = $2 AND tenant_id = $3',
      [JSON.stringify({ schedule, last_retrain: null }), modelId, tenantId]
    )

    logger.info('Retraining scheduled', { modelId, schedule })
  }

  /**
   * Create A/B test for model comparison
   */
  async createABTest(
    tenantId: string,
    userId: string,
    config: ABTestConfig
  ): Promise<string> {
    logger.info('Creating A/B test', { tenantId, testName: config.test_name })

    // SECURITY: Use parameterized interval to prevent SQL injection
    const result = await pool.query(
      `INSERT INTO model_ab_tests (
        tenant_id, test_name, model_a_id, model_b_id,
        traffic_split_percent, status, start_date, end_date, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW() + ($8::integer * INTERVAL '1 day'), $7)
      RETURNING id`,
      [
        tenantId,
        config.test_name,
        config.model_a_id,
        config.model_b_id,
        config.traffic_split_percent,
        'running',
        userId,
        config.duration_days
      ]
    )

    const testId = result.rows[0].id

    logger.info('A/B test created', { testId, testName: config.test_name })

    return testId
  }

  /**
   * Get A/B test results
   */
  async getABTestResults(testId: string, tenantId: string): Promise<any> {
    const result = await pool.query(
      `SELECT 
      id,
      tenant_id,
      test_name,
      model_a_id,
      model_b_id,
      traffic_split_percent,
      status,
      start_date,
      end_date,
      model_a_predictions,
      model_b_predictions,
      model_a_metrics,
      model_b_metrics,
      winner,
      notes,
      created_by,
      created_at,
      updated_at FROM model_ab_tests WHERE id = $1 AND tenant_id = $2',
      [testId, tenantId]
    )

    if (result.rows.length === 0) {
      throw new Error('A/B test not found')
    }

    const test = result.rows[0]

    // Get predictions for each model during test period
    const modelAMetrics = await this.getModelTestMetrics(
      test.model_a_id,
      test.start_date,
      test.end_date
    )

    const modelBMetrics = await this.getModelTestMetrics(
      test.model_b_id,
      test.start_date,
      test.end_date
    )

    // Determine winner
    const winner = this.determineABTestWinner(modelAMetrics, modelBMetrics)

    // Update test with results
    await pool.query(
      `UPDATE model_ab_tests
       SET model_a_metrics = $1,
           model_b_metrics = $2,
           model_a_predictions = $3,
           model_b_predictions = $4,
           winner = $5,
           status = 'completed',
           updated_at = NOW()
       WHERE id = $6`,
      [
        JSON.stringify(modelAMetrics),
        JSON.stringify(modelBMetrics),
        modelAMetrics.prediction_count,
        modelBMetrics.prediction_count,
        winner,
        testId
      ]
    )

    return {
      test_id: testId,
      test_name: test.test_name,
      model_a: {
        id: test.model_a_id,
        metrics: modelAMetrics
      },
      model_b: {
        id: test.model_b_id,
        metrics: modelBMetrics
      },
      winner,
      recommendation: this.generateABTestRecommendation(winner, modelAMetrics, modelBMetrics)
    }
  }

  /**
   * Deploy model (make it active)
   */
  async deployModel(modelId: string, tenantId: string, userId: string): Promise<void> {
    logger.info('Deploying model', { modelId, tenantId })

    const client = await pool.connect()

    try {
      await client.query('BEGIN')

      // Get model details
      const modelResult = await client.query(
        'SELECT model_type FROM ml_models WHERE id = $1 AND tenant_id = $2',
        [modelId, tenantId]
      )

      if (modelResult.rows.length === 0) {
        throw new Error('Model not found')
      }

      const modelType = modelResult.rows[0].model_type

      // Deactivate current active model of same type
      await client.query(
        `UPDATE ml_models
         SET is_active = false
         WHERE tenant_id = $1 AND model_type = $2 AND is_active = true`,
        [tenantId, modelType]
      )

      // Activate new model
      await client.query(
        `UPDATE ml_models
         SET is_active = true,
             status = 'deployed',
             deployed_at = NOW()
         WHERE id = $1 AND tenant_id = $2',
        [modelId, tenantId]
      )

      await client.query('COMMIT')

      logger.info('Model deployed successfully', { modelId, modelType })
    } catch (error) {
      await client.query('ROLLBACK')
      throw error
    } finally {
      client.release()
    }
  }

  /**
   * Rollback to previous model version
   */
  async rollbackModel(modelType: string, tenantId: string): Promise<string> {
    logger.info('Rolling back model', { modelType, tenantId })

    // Get previous active model
    const result = await pool.query(
      `SELECT id, version FROM ml_models
       WHERE tenant_id = $1 AND model_type = $2 AND status = 'deployed'
       ORDER BY deployed_at DESC
       LIMIT 1 OFFSET 1`,
      [tenantId, modelType]
    )

    if (result.rows.length === 0) {
      throw new Error('No previous model version found')
    }

    const previousModelId = result.rows[0].id

    // Deploy previous version
    await this.deployModel(previousModelId, tenantId, 'system')

    logger.info('Model rolled back', { previousModelId, modelType })

    return previousModelId
  }

  /**
   * Get model performance history
   */
  async getModelPerformanceHistory(
    modelId: string,
    tenantId: string
  ): Promise<any[]> {
    const result = await pool.query(
      `SELECT id, tenant_id, model_name, metric_name, metric_value, evaluation_date FROM model_performance
       WHERE model_id = $1 AND tenant_id = $2
       ORDER BY evaluation_date DESC`,
      [modelId, tenantId]
    )

    return result.rows
  }

  /**
   * Compare model versions
   */
  async compareModelVersions(
    modelIds: string[],
    tenantId: string
  ): Promise<any> {
    const comparisons: any[] = []

    for (const modelId of modelIds) {
      const modelResult = await pool.query(
        `SELECT m.*, mp.metrics
         FROM ml_models m
         LEFT JOIN model_performance mp ON m.id = mp.model_id
         WHERE m.id = $1 AND m.tenant_id = $2
         ORDER BY mp.evaluation_date DESC
         LIMIT 1`,
        [modelId, tenantId]
      )

      if (modelResult.rows.length > 0) {
        comparisons.push(modelResult.rows[0])
      }
    }

    return {
      models: comparisons,
      recommendation: this.generateComparisonRecommendation(comparisons)
    }
  }

  // ============================================================================
  // PRIVATE HELPER METHODS
  // ============================================================================

  private async createTrainingJob(
    tenantId: string,
    userId: string,
    config: TrainingConfig
  ): Promise<string> {
    const result = await pool.query(
      `INSERT INTO training_jobs (
        tenant_id, job_name, model_type, status, training_config,
        data_source, data_filters, train_start_date, train_end_date,
        test_split_ratio, validation_split_ratio, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING id`,
      [
        tenantId,
        `${config.model_name} Training`,
        config.model_type,
        'queued',
        JSON.stringify({
          algorithm: config.algorithm,
          hyperparameters: config.hyperparameters
        }),
        config.data_source,
        JSON.stringify(config.data_filters || {}),
        config.train_start_date,
        config.train_end_date,
        config.test_split_ratio || 0.20,
        config.validation_split_ratio || 0.10,
        userId
      ]
    )

    return result.rows[0].id
  }

  private async updateJobStatus(
    jobId: string,
    status: string,
    errorMessage: string | null
  ): Promise<void> {
    await pool.query(
      `UPDATE training_jobs
       SET status = $1,
           error_message = $2,
           started_at = CASE WHEN $1 = 'running' THEN NOW() ELSE started_at END,
           completed_at = CASE WHEN $1 IN ('completed', 'failed') THEN NOW() ELSE completed_at END,
           updated_at = NOW()
       WHERE id = $3',
      [status, errorMessage, jobId]
    )
  }

  private async updateJobWithModel(
    jobId: string,
    modelId: string,
    duration: number,
    dataSplits: any
  ): Promise<void> {
    await pool.query(
      `UPDATE training_jobs
       SET model_id = $1,
           duration_seconds = $2,
           total_samples = $3,
           training_samples = $4,
           validation_samples = $5,
           test_samples = $6
       WHERE id = $7`,
      [
        modelId,
        duration,
        dataSplits.train.length + dataSplits.validation.length + dataSplits.test.length,
        dataSplits.train.length,
        dataSplits.validation.length,
        dataSplits.test.length,
        jobId
      ]
    )
  }

  private async fetchTrainingData(
    tenantId: string,
    config: TrainingConfig
  ): Promise<any[]> {
    // This would fetch actual training data based on model type
    // For now, return mock data structure
    logger.info('Fetching training data', { modelType: config.model_type })

    // In production, this would query relevant tables based on model type
    // e.g., for predictive maintenance: vehicle history, work orders, telemetry
    // e.g., for driver scoring: trips, safety incidents, telemetry events

    return []
  }

  private splitDataset(
    data: any[],
    testRatio: number,
    validationRatio: number
  ): { train: any[]; validation: any[]; test: any[] } {
    const shuffled = [...data].sort(() => Math.random() - 0.5)

    const testSize = Math.floor(data.length * testRatio)
    const validationSize = Math.floor(data.length * validationRatio)

    const test = shuffled.slice(0, testSize)
    const validation = shuffled.slice(testSize, testSize + validationSize)
    const train = shuffled.slice(testSize + validationSize)

    return { train, validation, test }
  }

  private async executeTraining(
    modelType: string,
    algorithm: string,
    hyperparameters: Record<string, any>,
    dataSplits: any
  ): Promise<any> {
    logger.info('Executing model training', { modelType, algorithm })

    // In production, this would:
    // 1. Use TensorFlow.js, scikit-learn via Python bridge, or cloud ML services
    // 2. Train the actual model with the data
    // 3. Return the trained model artifacts

    // For now, return mock model
    return {
      type: modelType,
      algorithm,
      parameters: hyperparameters,
      trained: true
    }
  }

  private async evaluateModel(model: any, testData: any[]): Promise<Record<string, any>> {
    logger.info('Evaluating model performance')

    // In production, this would evaluate against test set
    // For now, return mock metrics
    return {
      accuracy: 0.87,
      precision: 0.85,
      recall: 0.88,
      f1_score: 0.86,
      mae: 12.5,
      rmse: 18.3,
      r2_score: 0.82
    }
  }

  private async createModelVersion(
    tenantId: string,
    userId: string,
    config: TrainingConfig,
    model: any,
    metrics: Record<string, any>,
    dataInfo: any
  ): Promise<string> {
    // Generate version number
    const versionResult = await pool.query(
      `SELECT COALESCE(MAX(CAST(version AS INTEGER)), 0) + 1 as next_version
       FROM ml_models
       WHERE tenant_id = $1 AND model_name = $2',
      [tenantId, config.model_name]
    )

    const version = versionResult.rows[0].next_version.toString()

    const result = await pool.query(
      `INSERT INTO ml_models (
        tenant_id, model_name, model_type, version, algorithm,
        framework, hyperparameters, feature_importance,
        training_data_size, status, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING id`,
      [
        tenantId,
        config.model_name,
        config.model_type,
        version,
        config.algorithm,
        'custom',
        JSON.stringify(config.hyperparameters),
        JSON.stringify(metrics.feature_importance || {}),
        dataInfo.training_samples + dataInfo.validation_samples + dataInfo.test_samples,
        'trained',
        userId
      ]
    )

    return result.rows[0].id
  }

  private async storePerformanceMetrics(
    modelId: string,
    tenantId: string,
    metrics: Record<string, any>,
    datasetType: string
  ): Promise<void> {
    await pool.query(
      `INSERT INTO model_performance (
        model_id, tenant_id, dataset_type, metrics,
        accuracy, precision_score, recall, f1_score, mae, rmse, r2_score
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
      [
        modelId,
        tenantId,
        datasetType,
        JSON.stringify(metrics),
        metrics.accuracy,
        metrics.precision,
        metrics.recall,
        metrics.f1_score,
        metrics.mae,
        metrics.rmse,
        metrics.r2_score
      ]
    )
  }

  private async getModelTestMetrics(
    modelId: string,
    startDate: Date,
    endDate: Date
  ): Promise<any> {
    const result = await pool.query(
      `SELECT
        COUNT(*) as prediction_count,
        AVG(CASE WHEN is_correct THEN 1.0 ELSE 0.0 END) as accuracy,
        AVG(confidence_score) as avg_confidence,
        AVG(error_magnitude) as avg_error
       FROM predictions
       WHERE model_id = $1
         AND prediction_date BETWEEN $2 AND $3
         AND actual_outcome IS NOT NULL`,
      [modelId, startDate, endDate]
    )

    return result.rows[0] || {
      prediction_count: 0,
      accuracy: 0,
      avg_confidence: 0,
      avg_error: 0
    }
  }

  private determineABTestWinner(modelAMetrics: any, modelBMetrics: any): string {
    if (modelAMetrics.accuracy > modelBMetrics.accuracy) {
      return 'model_a'
    } else if (modelBMetrics.accuracy > modelAMetrics.accuracy) {
      return 'model_b'
    } else {
      return 'tie'
    }
  }

  private generateABTestRecommendation(
    winner: string,
    modelAMetrics: any,
    modelBMetrics: any
  ): string {
    if (winner === 'model_a') {
      return `Model A performs better with ${(modelAMetrics.accuracy * 100).toFixed(1)}% accuracy vs ${(modelBMetrics.accuracy * 100).toFixed(1)}%. Recommend deploying Model A.`
    } else if (winner === 'model_b') {
      return `Model B performs better with ${(modelBMetrics.accuracy * 100).toFixed(1)}% accuracy vs ${(modelAMetrics.accuracy * 100).toFixed(1)}%. Recommend deploying Model B.`
    } else {
      return 'Models perform similarly. Consider other factors such as computational cost.'
    }
  }

  private generateComparisonRecommendation(models: any[]): string {
    if (models.length === 0) {
      return 'No models to compare'
    }

    const sortedByAccuracy = models.sort((a, b) => {
      const aAccuracy = a.metrics?.accuracy || 0
      const bAccuracy = b.metrics?.accuracy || 0
      return bAccuracy - aAccuracy
    })

    const best = sortedByAccuracy[0]
    return `Model version ${best.version} shows the best performance with ${((best.metrics?.accuracy || 0) * 100).toFixed(1)}% accuracy.`
  }

  private startScheduledTraining(): void {
    // Check for scheduled retraining every 24 hours
    this.trainingSchedule = setInterval(async () => {
      try {
        logger.info('Checking for scheduled model retraining')

        const result = await pool.query(`
          SELECT id, tenant_id, model_name, model_type, hyperparameters
          FROM ml_models
          WHERE is_active = true
            AND hyperparameters ? 'retraining_schedule'
        `)

        for (const model of result.rows) {
          const schedule = model.hyperparameters.retraining_schedule
          const lastRetrain = schedule.last_retrain ? new Date(schedule.last_retrain) : null

          const shouldRetrain = this.shouldRetrainNow(schedule.schedule, lastRetrain)

          if (shouldRetrain) {
            logger.info('Triggering scheduled retraining', { modelId: model.id })

            // Trigger retraining (this would be done asynchronously)
            this.trainModel(model.tenant_id, 'system', {
              model_name: model.model_name,
              model_type: model.model_type,
              algorithm: model.hyperparameters.algorithm || 'default',
              hyperparameters: model.hyperparameters,
              data_source: 'production'
            }).catch(error => {
              logger.error('Scheduled retraining failed', { modelId: model.id, error })
            })
          }
        }
      } catch (error) {
        logger.error('Error in scheduled training check', { error })
      }
    }, 24 * 60 * 60 * 1000) // 24 hours
  }

  private shouldRetrainNow(schedule: string, lastRetrain: Date | null): boolean {
    if (!lastRetrain) return true

    const now = new Date()
    const daysSinceRetrain = (now.getTime() - lastRetrain.getTime()) / (1000 * 60 * 60 * 24)

    switch (schedule) {
      case 'daily':
        return daysSinceRetrain >= 1
      case 'weekly':
        return daysSinceRetrain >= 7
      case 'monthly':
        return daysSinceRetrain >= 30
      default:
        return false
    }
  }

  async shutdown(): Promise<void> {
    if (this.trainingSchedule) {
      clearInterval(this.trainingSchedule)
    }
    logger.info('ML training service shut down')
  }
}

export const mlTrainingService = new MLTrainingService()
export default mlTrainingService
