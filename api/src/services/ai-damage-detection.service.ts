/**
 * AI Damage Detection Service
 *
 * High-level service for vehicle damage detection and work order creation
 *
 * Features:
 * - Process damage images using ML models
 * - Automatically create work orders for detected damages
 * - Cost estimation and prioritization
 * - Integration with mobile apps
 * - Audit logging and notifications
 *
 * @module services/ai-damage-detection
 */

import { Pool } from 'pg';

import logger from '../config/logger';
import {
  getDamageDetectionModel,
  DamageDetectionResult,
  DetectedDamage,
  DamageSeverity,
  DamageType,
  DamageZone
} from '../ml-models/damage-detection.model';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface DamageDetectionRequest {
  vehicleId: string;
  imageUrl?: string;
  imageBase64?: string;
  imageBuffer?: Buffer;
  reportedBy: string; // User ID
  autoCreateWorkOrder?: boolean;
  notes?: string;
  location?: string;
  incidentDate?: Date;
}

export interface DamageDetectionResponse {
  detectionId: string;
  vehicleId: string;
  detectionResult: DamageDetectionResult;
  workOrdersCreated: Array<{
    workOrderId: number;
    damageId: string;
    status: string;
  }>;
  summary: {
    totalDamages: number;
    criticalDamages: number;
    severeDamages: number;
    totalEstimatedCost: {
      min: number;
      max: number;
      currency: string;
    };
  };
  processingTimeMs: number;
  timestamp: Date;
}

export interface WorkOrderCreationParams {
  vehicleId: string;
  damage: DetectedDamage;
  reportedBy: string;
  detectionId: string;
  notes?: string;
}

// ============================================================================
// AI DAMAGE DETECTION SERVICE
// ============================================================================

export class AiDamageDetectionService {
  private db: Pool;
  private model = getDamageDetectionModel();

  constructor(db: Pool) {
    this.db = db;
    logger.info('AI Damage Detection Service initialized');
  }

  /**
   * Process damage detection request
   * Main entry point for damage detection
   */
  async detectDamage(request: DamageDetectionRequest): Promise<DamageDetectionResponse> {
    const startTime = Date.now();

    try {
      logger.info('Processing damage detection request', {
        vehicleId: request.vehicleId,
        reportedBy: request.reportedBy
      });

      // Validate request
      this.validateRequest(request);

      // Get image input
      const imageInput = request.imageBase64 || request.imageUrl || request.imageBuffer;
      if (!imageInput) {
        throw new Error('No image provided');
      }

      // Run ML model detection
      const detectionResult = await this.model.detectDamage(imageInput, request.vehicleId);

      // Save detection record to database
      const detectionId = await this.saveDamageDetection(request, detectionResult);

      // Auto-create work orders if requested
      const workOrdersCreated: DamageDetectionResponse['workOrdersCreated'] = [];
      if (request.autoCreateWorkOrder !== false) {
        for (const damage of detectionResult.detectedDamages) {
          try {
            const workOrderId = await this.createWorkOrderForDamage({
              vehicleId: request.vehicleId,
              damage,
              reportedBy: request.reportedBy,
              detectionId,
              notes: request.notes
            });

            workOrdersCreated.push({
              workOrderId,
              damageId: damage.id,
              status: 'created'
            });
          } catch (error) {
            logger.error('Failed to create work order', { damage: damage.id, error });
            workOrdersCreated.push({
              workOrderId: -1,
              damageId: damage.id,
              status: 'failed'
            });
          }
        }
      }

      // Calculate summary
      const summary = this.calculateSummary(detectionResult);

      const processingTime = Date.now() - startTime;

      const response: DamageDetectionResponse = {
        detectionId,
        vehicleId: request.vehicleId,
        detectionResult,
        workOrdersCreated,
        summary,
        processingTimeMs: processingTime,
        timestamp: new Date()
      };

      // Send notifications if critical damages found
      if (summary.criticalDamages > 0) {
        await this.sendCriticalDamageAlert(request.vehicleId, summary);
      }

      logger.info('Damage detection completed', {
        detectionId,
        vehicleId: request.vehicleId,
        damageCount: summary.totalDamages,
        workOrdersCreated: workOrdersCreated.length,
        processingTimeMs: processingTime
      });

      return response;
    } catch (error) {
      logger.error('Damage detection failed', { error, vehicleId: request.vehicleId });
      throw error;
    }
  }

  /**
   * Get damage detection history for a vehicle
   */
  async getVehicleDamageHistory(vehicleId: string, limit: number = 50): Promise<any[]> {
    try {
      const query = `
        SELECT
          id,
          vehicle_id,
          detected_damages,
          overall_severity,
          total_estimated_cost,
          reported_by,
          detection_date,
          work_orders_created,
          notes
        FROM ai_damage_detections
        WHERE vehicle_id = $1
        ORDER BY detection_date DESC
        LIMIT $2
      `;

      const result = await this.db.query(query, [vehicleId, limit]);
      return result.rows;
    } catch (error) {
      logger.error('Failed to get damage history', { vehicleId, error });
      throw error;
    }
  }

  /**
   * Get detection by ID
   */
  async getDetectionById(detectionId: string): Promise<any> {
    try {
      const query = `
        SELECT * FROM ai_damage_detections WHERE id = $1
      `;

      const result = await this.db.query(query, [detectionId]);
      return result.rows[0] || null;
    } catch (error) {
      logger.error('Failed to get detection', { detectionId, error });
      throw error;
    }
  }

  /**
   * Get all pending damages (not yet repaired)
   */
  async getPendingDamages(vehicleId?: string): Promise<any[]> {
    try {
      let query = `
        SELECT
          d.id,
          d.vehicle_id,
          d.detected_damages,
          d.overall_severity,
          d.total_estimated_cost,
          d.detection_date,
          v.vehicle_number,
          v.make,
          v.model
        FROM ai_damage_detections d
        LEFT JOIN vehicles v ON d.vehicle_id = v.id::text
        WHERE d.repair_status = 'pending'
      `;

      const params: any[] = [];
      if (vehicleId) {
        query += ` AND d.vehicle_id = $1`;
        params.push(vehicleId);
      }

      query += ` ORDER BY d.detection_date DESC`;

      const result = await this.db.query(query, params);
      return result.rows;
    } catch (error) {
      logger.error('Failed to get pending damages', { error });
      throw error;
    }
  }

  /**
   * Update repair status for a detection
   */
  async updateRepairStatus(
    detectionId: string,
    status: 'pending' | 'in_progress' | 'completed' | 'cancelled',
    completedBy?: string
  ): Promise<void> {
    try {
      const query = `
        UPDATE ai_damage_detections
        SET
          repair_status = $1,
          repair_completed_by = $2,
          repair_completed_date = CASE WHEN $1 = 'completed' THEN NOW() ELSE repair_completed_date END,
          updated_at = NOW()
        WHERE id = $3
      `;

      await this.db.query(query, [status, completedBy || null, detectionId]);

      logger.info('Repair status updated', { detectionId, status });
    } catch (error) {
      logger.error('Failed to update repair status', { detectionId, error });
      throw error;
    }
  }

  /**
   * Get damage detection statistics
   */
  async getStatistics(vehicleId?: string, days: number = 30): Promise<any> {
    try {
      let query = `
        SELECT
          COUNT(*) as total_detections,
          SUM(jsonb_array_length(detected_damages)) as total_damages,
          SUM(CASE WHEN overall_severity = 'critical' THEN 1 ELSE 0 END) as critical_detections,
          SUM(CASE WHEN overall_severity = 'severe' THEN 1 ELSE 0 END) as severe_detections,
          SUM(CASE WHEN overall_severity = 'moderate' THEN 1 ELSE 0 END) as moderate_detections,
          SUM(CASE WHEN overall_severity = 'minor' THEN 1 ELSE 0 END) as minor_detections,
          AVG((total_estimated_cost->>'min')::numeric) as avg_cost_min,
          AVG((total_estimated_cost->>'max')::numeric) as avg_cost_max
        FROM ai_damage_detections
        WHERE detection_date >= NOW() - INTERVAL '${days} days'
      `;

      const params: any[] = [];
      if (vehicleId) {
        query += ` AND vehicle_id = $1`;
        params.push(vehicleId);
      }

      const result = await this.db.query(query, params);
      return result.rows[0];
    } catch (error) {
      logger.error('Failed to get statistics', { error });
      throw error;
    }
  }

  // ============================================================================
  // PRIVATE METHODS
  // ============================================================================

  /**
   * Validate damage detection request
   */
  private validateRequest(request: DamageDetectionRequest): void {
    if (!request.vehicleId) {
      throw new Error('Vehicle ID is required');
    }
    if (!request.reportedBy) {
      throw new Error('Reported by user ID is required');
    }
    if (!request.imageUrl && !request.imageBase64 && !request.imageBuffer) {
      throw new Error('Image input is required (URL, base64, or buffer)');
    }
  }

  /**
   * Save damage detection to database
   */
  private async saveDamageDetection(
    request: DamageDetectionRequest,
    result: DamageDetectionResult
  ): Promise<string> {
    try {
      const query = `
        INSERT INTO ai_damage_detections (
          vehicle_id,
          detected_damages,
          overall_severity,
          total_estimated_cost,
          reported_by,
          detection_date,
          model_version,
          processing_time_ms,
          image_url,
          notes,
          location,
          incident_date,
          repair_status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        RETURNING id
      `;

      const values = [
        request.vehicleId,
        JSON.stringify(result.detectedDamages),
        result.overallSeverity,
        JSON.stringify(result.totalEstimatedCost),
        request.reportedBy,
        result.timestamp,
        result.modelVersion,
        result.processingTimeMs,
        request.imageUrl || null,
        request.notes || null,
        request.location || null,
        request.incidentDate || new Date(),
        'pending'
      ];

      const queryResult = await this.db.query(query, values);
      return queryResult.rows[0].id;
    } catch (error) {
      logger.error('Failed to save damage detection', { error });
      throw new Error('Database error: Could not save damage detection');
    }
  }

  /**
   * Create work order for a detected damage
   */
  private async createWorkOrderForDamage(params: WorkOrderCreationParams): Promise<number> {
    try {
      const { vehicleId, damage, reportedBy, detectionId, notes } = params;

      // Generate work order title and description
      const title = `AI Detected: ${this.formatDamageType(damage.type)} - ${this.formatDamageZone(damage.zone)}`;
      const description = `
${damage.description}

Severity: ${damage.severity.toUpperCase()}
Confidence: ${(damage.confidence * 100).toFixed(1)}%
Estimated Cost: $${damage.estimatedRepairCost.min} - $${damage.estimatedRepairCost.max}
Priority: ${damage.repairPriority}/10

Recommended Action: ${damage.recommendedAction}

Detection ID: ${detectionId}
Damage ID: ${damage.id}
      `.trim();

      const query = `
        INSERT INTO work_orders (
          vehicle_id,
          title,
          description,
          priority,
          status,
          estimated_cost,
          damage_type,
          damage_zone,
          ai_detection_id,
          ai_damage_id,
          created_by,
          created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW())
        RETURNING id
      `;

      const values = [
        vehicleId,
        title,
        description,
        this.mapSeverityToPriority(damage.severity),
        'pending',
        damage.estimatedRepairCost.max,
        damage.type,
        damage.zone,
        detectionId,
        damage.id,
        reportedBy
      ];

      const result = await this.db.query(query, values);
      return result.rows[0].id;
    } catch (error) {
      logger.error('Failed to create work order', { error, params });
      throw error;
    }
  }

  /**
   * Calculate summary statistics
   */
  private calculateSummary(result: DamageDetectionResult): DamageDetectionResponse['summary'] {
    const criticalDamages = result.detectedDamages.filter(d => d.severity === 'critical').length;
    const severeDamages = result.detectedDamages.filter(d => d.severity === 'severe').length;

    return {
      totalDamages: result.detectedDamages.length,
      criticalDamages,
      severeDamages,
      totalEstimatedCost: result.totalEstimatedCost
    };
  }

  /**
   * Send critical damage alert
   */
  private async sendCriticalDamageAlert(vehicleId: string, summary: any): Promise<void> {
    try {
      logger.warn('CRITICAL DAMAGE DETECTED', {
        vehicleId,
        criticalDamages: summary.criticalDamages,
        totalEstimatedCost: summary.totalEstimatedCost
      });

      // TODO: Implement actual notification system (email, SMS, push notifications)
      // For now, just log the alert
    } catch (error) {
      logger.error('Failed to send critical damage alert', { error });
    }
  }

  /**
   * Map severity to work order priority
   */
  private mapSeverityToPriority(severity: DamageSeverity): 'low' | 'medium' | 'high' | 'critical' {
    const mapping: Record<DamageSeverity, 'low' | 'medium' | 'high' | 'critical'> = {
      minor: 'low',
      moderate: 'medium',
      severe: 'high',
      critical: 'critical'
    };
    return mapping[severity];
  }

  /**
   * Format damage type for display
   */
  private formatDamageType(type: DamageType): string {
    return type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  }

  /**
   * Format damage zone for display
   */
  private formatDamageZone(zone: DamageZone): string {
    return zone.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  }
}

// ============================================================================
// FACTORY FUNCTION
// ============================================================================

export function createAiDamageDetectionService(db: Pool): AiDamageDetectionService {
  return new AiDamageDetectionService(db);
}
