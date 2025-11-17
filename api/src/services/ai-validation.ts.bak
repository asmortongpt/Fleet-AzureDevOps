/**
 * AI-Driven Validation and Anomaly Detection Service
 *
 * Provides intelligent validation with:
 * - Statistical anomaly detection
 * - ML-based pattern recognition
 * - Smart defaults and suggestions
 * - Predictive validation
 */

import OpenAI from 'openai'
import pool from '../config/database'
import {
  getRelevantContext,
  generateRAGResponse

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

export interface ValidationResult {
  isValid: boolean
  confidence: number // 0-1
  warnings: Array<{
    field: string
    message: string
    severity: 'info' | 'warning' | 'error'
    suggestedValue?: any
  }>
  anomalies: Array<{
    type: string
    description: string
    expectedRange?: [number, number]
    actualValue: number
    zScore?: number
  }>
  suggestions: Array<{
    field: string
    value: any
    reason: string
    confidence: number
  }>
  autoCorrections: Array<{
    field: string
    originalValue: any
    correctedValue: any
    reason: string
  }>
}

/**
 * Get or calculate statistical baseline for a metric
 */
async function getStatisticalBaseline(
  tenantId: string,
  metricName: string,
  entityType?: string,
  entityId?: string
): Promise<{
  mean: number
  median: number
  stdDev: number
  min: number
  max: number
  p25: number
  p75: number
  p95: number
  sampleSize: number
} | null> {
  // Check if we have a cached baseline
  const cachedResult = await pool.query(
    `SELECT statistical_data, sample_size, last_calculated
     FROM ai_anomaly_baselines
     WHERE tenant_id = $1 AND metric_name = $2
       AND ($3::VARCHAR IS NULL OR entity_type = $3)
       AND ($4::UUID IS NULL OR entity_id = $4)
       AND last_calculated > NOW() - INTERVAL '24 hours'`,
    [tenantId, metricName, entityType, entityId]
  )

  if (cachedResult.rows.length > 0) {
    return {
      ...cachedResult.rows[0].statistical_data,
      sampleSize: cachedResult.rows[0].sample_size
    }
  }

  // Calculate new baseline (example for fuel prices)
  if (metricName === 'fuel_price_per_gallon') {
    const result = await pool.query(
      `SELECT
        AVG(price_per_gallon) as mean,
        PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY price_per_gallon) as median,
        STDDEV(price_per_gallon) as std_dev,
        MIN(price_per_gallon) as min,
        MAX(price_per_gallon) as max,
        PERCENTILE_CONT(0.25) WITHIN GROUP (ORDER BY price_per_gallon) as p25,
        PERCENTILE_CONT(0.75) WITHIN GROUP (ORDER BY price_per_gallon) as p75,
        PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY price_per_gallon) as p95,
        COUNT(*) as sample_size
       FROM fuel_transactions
       WHERE tenant_id = $1
         AND created_at > NOW() - INTERVAL '90 days'
         AND price_per_gallon > 0 AND price_per_gallon < 100`,
      [tenantId]
    )

    if (result.rows[0].sample_size > 10) {
      const stats = {
        mean: parseFloat(result.rows[0].mean),
        median: parseFloat(result.rows[0].median),
        stdDev: parseFloat(result.rows[0].std_dev),
        min: parseFloat(result.rows[0].min),
        max: parseFloat(result.rows[0].max),
        p25: parseFloat(result.rows[0].p25),
        p75: parseFloat(result.rows[0].p75),
        p95: parseFloat(result.rows[0].p95),
        sampleSize: parseInt(result.rows[0].sample_size)
      }

      // Cache the baseline
      await pool.query(
        `INSERT INTO ai_anomaly_baselines
         (tenant_id, metric_name, entity_type, statistical_data, sample_size)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (tenant_id, metric_name, entity_type, entity_id)
         DO UPDATE SET statistical_data = EXCLUDED.statistical_data,
                       sample_size = EXCLUDED.sample_size,
                       last_calculated = CURRENT_TIMESTAMP`,
        [tenantId, metricName, entityType, JSON.stringify(stats), stats.sampleSize]
      )

      return stats
    }
  }

  // Similar calculations for other metrics...
  if (metricName === 'fuel_consumption') {
    const result = await pool.query(
      `SELECT
        AVG(gallons) as mean,
        PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY gallons) as median,
        STDDEV(gallons) as std_dev,
        MIN(gallons) as min,
        MAX(gallons) as max,
        PERCENTILE_CONT(0.25) WITHIN GROUP (ORDER BY gallons) as p25,
        PERCENTILE_CONT(0.75) WITHIN GROUP (ORDER BY gallons) as p75,
        PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY gallons) as p95,
        COUNT(*) as sample_size
       FROM fuel_transactions
       WHERE tenant_id = $1
         AND ($2::UUID IS NULL OR vehicle_id = $2)
         AND created_at > NOW() - INTERVAL '90 days'
         AND gallons > 0 AND gallons < 200`,
      [tenantId, entityId]
    )

    if (result.rows[0].sample_size > 10) {
      const stats = {
        mean: parseFloat(result.rows[0].mean),
        median: parseFloat(result.rows[0].median),
        stdDev: parseFloat(result.rows[0].std_dev),
        min: parseFloat(result.rows[0].min),
        max: parseFloat(result.rows[0].max),
        p25: parseFloat(result.rows[0].p25),
        p75: parseFloat(result.rows[0].p75),
        p95: parseFloat(result.rows[0].p95),
        sampleSize: parseInt(result.rows[0].sample_size)
      }

      await pool.query(
        `INSERT INTO ai_anomaly_baselines
         (tenant_id, metric_name, entity_type, entity_id, statistical_data, sample_size)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (tenant_id, metric_name, entity_type, entity_id)
         DO UPDATE SET statistical_data = EXCLUDED.statistical_data,
                       sample_size = EXCLUDED.sample_size,
                       last_calculated = CURRENT_TIMESTAMP`,
        [tenantId, metricName, 'vehicle', entityId, JSON.stringify(stats), stats.sampleSize]
      )

      return stats
    }
  }

  return null
}

/**
 * Detect anomalies using statistical methods
 */
async function detectStatisticalAnomalies(
  data: any,
  entityType: string,
  tenantId: string
): Promise<ValidationResult['anomalies']> {
  const anomalies: ValidationResult['anomalies'] = []

  // Fuel transaction anomalies
  if (entityType === 'fuel_transaction') {
    // Check price per gallon
    if (data.price_per_gallon) {
      const baseline = await getStatisticalBaseline(tenantId, 'fuel_price_per_gallon')
      if (baseline && baseline.sampleSize > 10) {
        const zScore = Math.abs((data.price_per_gallon - baseline.mean) / baseline.stdDev)

        if (zScore > 3) {
          anomalies.push({
            type: 'fuel_price_outlier',
            description: `Fuel price $${data.price_per_gallon}/gal is unusually ${data.price_per_gallon > baseline.mean ? 'high' : 'low'}`,
            expectedRange: [baseline.p25, baseline.p75],
            actualValue: data.price_per_gallon,
            zScore
          })
        }
      }
    }

    // Check gallons if vehicle is specified
    if (data.vehicle_id && data.gallons) {
      const baseline = await getStatisticalBaseline(
        tenantId,
        'fuel_consumption',
        'vehicle',
        data.vehicle_id
      )
      if (baseline && baseline.sampleSize > 5) {
        const zScore = Math.abs((data.gallons - baseline.mean) / baseline.stdDev)

        if (zScore > 2.5) {
          anomalies.push({
            type: 'fuel_consumption_outlier',
            description: `Fuel amount ${data.gallons} gallons is unusual for this vehicle`,
            expectedRange: [baseline.p25, baseline.p75],
            actualValue: data.gallons,
            zScore
          })
        }
      }
    }

    // Check for duplicate transactions (same vehicle, similar amount, within 1 hour)
    if (data.vehicle_id && data.total_cost && data.date) {
      const duplicateCheck = await pool.query(
        `SELECT COUNT(*) as count
         FROM fuel_transactions
         WHERE tenant_id = $1
           AND vehicle_id = $2
           AND ABS(total_cost - $3) < 5
           AND ABS(EXTRACT(EPOCH FROM (date - $4::TIMESTAMP))) < 3600
           AND id != $5::UUID`,
        [tenantId, data.vehicle_id, data.total_cost, data.date, data.id || '00000000-0000-0000-0000-000000000000']
      )

      if (parseInt(duplicateCheck.rows[0].count) > 0) {
        anomalies.push({
          type: 'possible_duplicate',
          description: 'Similar transaction found within the last hour for this vehicle',
          actualValue: data.total_cost
        })
      }
    }
  }

  // Work order anomalies
  if (entityType === 'work_order') {
    if (data.estimated_cost) {
      const avgResult = await pool.query(
        `SELECT AVG(actual_cost) as avg_cost, STDDEV(actual_cost) as std_dev
         FROM work_orders
         WHERE tenant_id = $1
           AND actual_cost > 0
           AND created_at > NOW() - INTERVAL '180 days'`,
        [tenantId]
      )

      if (avgResult.rows[0].avg_cost) {
        const mean = parseFloat(avgResult.rows[0].avg_cost)
        const stdDev = parseFloat(avgResult.rows[0].std_dev)
        const zScore = Math.abs((data.estimated_cost - mean) / stdDev)

        if (zScore > 3) {
          anomalies.push({
            type: 'cost_outlier',
            description: `Estimated cost $${data.estimated_cost} is unusually ${data.estimated_cost > mean ? 'high' : 'low'}`,
            expectedRange: [mean - stdDev, mean + stdDev],
            actualValue: data.estimated_cost,
            zScore
          })
        }
      }
    }
  }

  return anomalies
}

/**
 * Generate smart suggestions based on context and history
 */
async function generateSmartSuggestions(
  data: any,
  entityType: string,
  tenantId: string
): Promise<ValidationResult['suggestions']> {
  const suggestions: ValidationResult['suggestions'] = []

  if (entityType === 'fuel_transaction') {
    // Suggest vendor based on location
    if (data.location && !data.vendor_id) {
      const nearbyVendors = await pool.query(
        `SELECT id, name
         FROM vendors
         WHERE tenant_id = $1
           AND type = 'fuel'
         LIMIT 5`,
        [tenantId]
      )

      if (nearbyVendors.rows.length > 0) {
        suggestions.push({
          field: 'vendor_id',
          value: nearbyVendors.rows[0].id,
          reason: `Commonly used vendor: ${nearbyVendors.rows[0].name}`,
          confidence: 0.7
        })
      }
    }

    // Auto-calculate price per gallon if missing
    if (data.total_cost && data.gallons && !data.price_per_gallon) {
      suggestions.push({
        field: 'price_per_gallon',
        value: (data.total_cost / data.gallons).toFixed(3),
        reason: 'Calculated from total cost and gallons',
        confidence: 1.0
      })
    }

    // Suggest fuel type based on vehicle
    if (data.vehicle_id && !data.fuel_type) {
      const vehicleResult = await pool.query(
        'SELECT fuel_type FROM vehicles WHERE id = $1',
        [data.vehicle_id]
      )

      if (vehicleResult.rows.length > 0 && vehicleResult.rows[0].fuel_type) {
        suggestions.push({
          field: 'fuel_type',
          value: vehicleResult.rows[0].fuel_type,
          reason: 'Based on vehicle specifications',
          confidence: 0.95
        })
      }
    }
  }

  if (entityType === 'work_order') {
    // Suggest next maintenance date based on patterns
    if (data.vehicle_id && data.type === 'maintenance') {
      const lastMaintenance = await pool.query(
        `SELECT MAX(completed_at) as last_date
         FROM work_orders
         WHERE vehicle_id = $1 AND type = 'maintenance' AND status = 'completed'`,
        [data.vehicle_id]
      )

      if (lastMaintenance.rows[0].last_date) {
        const avgInterval = 90 // days - could calculate from history
        const nextDate = new Date(lastMaintenance.rows[0].last_date)
        nextDate.setDate(nextDate.getDate() + avgInterval)

        suggestions.push({
          field: 'next_maintenance_date',
          value: nextDate.toISOString().split('T')[0],
          reason: `Based on ${avgInterval}-day maintenance cycle`,
          confidence: 0.8
        })
      }
    }
  }

  return suggestions
}

/**
 * Use AI with RAG to provide contextual warnings based on past validations
 */
async function getAIWarnings(
  data: any,
  entityType: string,
  anomalies: ValidationResult['anomalies'],
  tenantId: string
): Promise<ValidationResult['warnings']> {
  if (anomalies.length === 0) return []

  try {
    const query = `Validate ${entityType} with anomalies: ${JSON.stringify(anomalies)}`

    const ragResponse = await generateRAGResponse(
      query,
      tenantId,
      undefined,
      `You are a fleet management data validation expert.
Analyze anomalies and provide helpful warnings based on past validation patterns.
Be concise and actionable.

Entity: ${entityType}
Data: ${JSON.stringify(data)}
Anomalies: ${JSON.stringify(anomalies)}

Generate 1-3 concise warnings with severity levels (info, warning, error).
Return as JSON with format: { "warnings": [{ "field", "message", "severity", "suggestedValue"? }] }`
    )

    try {
      const result = JSON.parse(ragResponse.response)
      return result.warnings || []
    } catch {
      // If RAG response isn't JSON, return empty array
      return []
    }
  } catch (error) {
    console.error('RAG error in AI warnings:', error)
    return []
  }
}

/**
 * Main validation function
 */
export async function validateWithAI(
  entityType: string,
  data: any,
  tenantId: string,
  userId?: string
): Promise<ValidationResult> {
  try {
    // Detect anomalies
    const anomalies = await detectStatisticalAnomalies(data, entityType, tenantId)

    // Generate suggestions
    const suggestions = await generateSmartSuggestions(data, entityType, tenantId)

    // Get AI-powered warnings with RAG context
    const warnings = await getAIWarnings(data, entityType, anomalies, tenantId)

    // Determine overall validity
    const hasErrors = warnings.some(w => w.severity === 'error')
    const hasCriticalAnomalies = anomalies.some(a => a.zScore && a.zScore > 4)

    const isValid = !hasErrors && !hasCriticalAnomalies

    // Calculate confidence score
    const confidence = anomalies.length === 0 ? 1.0 : Math.max(0.3, 1.0 - (anomalies.length * 0.15))

    const result: ValidationResult = {
      isValid,
      confidence,
      warnings,
      anomalies,
      suggestions,
      autoCorrections: []
    }

    // Auto-apply high-confidence suggestions
    for (const suggestion of suggestions) {
      if (suggestion.confidence >= 0.95 && !data[suggestion.field]) {
        result.autoCorrections.push({
          field: suggestion.field,
          originalValue: data[suggestion.field],
          correctedValue: suggestion.value,
          reason: suggestion.reason
        })
      }
    }

    // Save validation result to database
    await pool.query(
      `INSERT INTO ai_validations
       (tenant_id, user_id, entity_type, validation_result, is_valid, confidence, warnings, anomalies, suggestions)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        tenantId,
        userId || null,
        entityType,
        JSON.stringify(result),
        isValid,
        confidence,
        JSON.stringify(warnings),
        JSON.stringify(anomalies),
        JSON.stringify(suggestions)
      ]
    )

    return result
  } catch (error) {
    console.error('AI validation error:', error)
    throw error
  }
}

/**
 * Get validation history for an entity
 */
export async function getValidationHistory(
  entityType: string,
  entityId: string,
  tenantId: string,
  limit: number = 10
): Promise<any[]> {
  const result = await pool.query(
    `SELECT * FROM ai_validations
     WHERE tenant_id = $1 AND entity_type = $2 AND entity_id = $3
     ORDER BY created_at DESC
     LIMIT $4`,
    [tenantId, entityType, entityId, limit]
  )

  return result.rows
}
