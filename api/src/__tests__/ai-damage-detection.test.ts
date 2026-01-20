/**
 * AI Damage Detection Integration Tests
 *
 * Tests for the AI damage detection feature including:
 * - ML model damage detection
 * - Service layer functionality
 * - API endpoints
 * - Work order creation
 * - Database operations
 *
 * @module __tests__/ai-damage-detection
 */

import { Pool } from 'pg';
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';

import {
  getDamageDetectionModel,
  DamageDetectionModel
} from '../ml-models/damage-detection.model';
import { createAiDamageDetectionService } from '../services/ai-damage-detection.service';

// ============================================================================
// TEST SETUP
// ============================================================================

describe('AI Damage Detection', () => {
  let db: Pool;
  let model: DamageDetectionModel;
  let testVehicleId: string;

  beforeAll(async () => {
    // Initialize database connection
    db = new Pool({
      connectionString: process.env.DATABASE_URL || process.env.AZURE_SQL_CONNECTION_STRING
    });

    // Initialize model
    model = getDamageDetectionModel({
      confidenceThreshold: 0.5,
      enableCostEstimation: true
    });

    // Create test vehicle
    const vehicleResult = await db.query(`
      INSERT INTO vehicles (vehicle_number, make, model, year, vin, license_plate, fuel_type)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id
    `, ['TEST-AI-001', 'Tesla', 'Model 3', 2023, '5YJ3E1EA0KF000001', 'TEST-AI', 'Electric']);

    testVehicleId = vehicleResult.rows[0].id.toString();
  });

  afterAll(async () => {
    // Cleanup test data
    if (testVehicleId) {
      await db.query('DELETE FROM ai_damage_detections WHERE vehicle_id = $1', [testVehicleId]);
      await db.query('DELETE FROM work_orders WHERE vehicle_id = $1', [testVehicleId]);
      await db.query('DELETE FROM vehicles WHERE id = $1', [testVehicleId]);
    }

    await db.end();
  });

  // ============================================================================
  // ML MODEL TESTS
  // ============================================================================

  describe('Damage Detection Model', () => {
    it('should initialize with correct configuration', () => {
      const modelInfo = model.getModelInfo();

      expect(modelInfo.version).toBe('yolov8-resnet50-v1.2.0');
      expect(modelInfo.architecture).toBe('YOLOv8 + ResNet-50');
      expect(modelInfo.confidenceThreshold).toBe(0.5);
    });

    it('should detect damage from base64 image', async () => {
      // Create a small test image (1x1 red pixel)
      const testImageBase64 = '/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCwAA8A';

      const result = await model.detectDamage(testImageBase64, testVehicleId);

      expect(result).toBeDefined();
      expect(result.vehicleId).toBe(testVehicleId);
      expect(result.modelVersion).toBe('yolov8-resnet50-v1.2.0');
      expect(result.detectedDamages).toBeInstanceOf(Array);
      expect(result.overallSeverity).toBeDefined();
      expect(result.totalEstimatedCost).toBeDefined();
      expect(result.totalEstimatedCost.currency).toBe('USD');
      expect(result.processingTimeMs).toBeGreaterThan(0);
    }, 30000); // 30 second timeout for AI processing

    it('should handle batch detection', async () => {
      const testImageBase64 = '/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCwAA8A';

      const results = await model.detectDamageBatch([
        { imageInput: testImageBase64, vehicleId: testVehicleId },
        { imageInput: testImageBase64, vehicleId: testVehicleId }
      ]);

      expect(results).toHaveLength(2);
      expect(results[0].vehicleId).toBe(testVehicleId);
      expect(results[1].vehicleId).toBe(testVehicleId);
    }, 60000); // 60 second timeout for batch processing

    it('should estimate repair costs correctly', async () => {
      const testImageBase64 = '/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCwAA8A';

      const result = await model.detectDamage(testImageBase64, testVehicleId);

      if (result.detectedDamages.length > 0) {
        const damage = result.detectedDamages[0];
        expect(damage.estimatedRepairCost.min).toBeGreaterThan(0);
        expect(damage.estimatedRepairCost.max).toBeGreaterThan(damage.estimatedRepairCost.min);
        expect(damage.estimatedRepairCost.currency).toBe('USD');
      }
    }, 30000);
  });

  // ============================================================================
  // SERVICE LAYER TESTS
  // ============================================================================

  describe('AI Damage Detection Service', () => {
    let service: ReturnType<typeof createAiDamageDetectionService>;

    beforeEach(() => {
      service = createAiDamageDetectionService(db);
    });

    it('should process damage detection request', async () => {
      const testImageBase64 = '/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCwAA8A';

      const response = await service.detectDamage({
        vehicleId: testVehicleId,
        imageBase64: testImageBase64,
        reportedBy: 'test-user-001',
        autoCreateWorkOrder: false, // Don't create work orders in test
        notes: 'Test damage detection'
      });

      expect(response).toBeDefined();
      expect(response.detectionId).toBeDefined();
      expect(response.vehicleId).toBe(testVehicleId);
      expect(response.summary).toBeDefined();
      expect(response.summary.totalDamages).toBeGreaterThanOrEqual(0);
      expect(response.processingTimeMs).toBeGreaterThan(0);
    }, 30000);

    it('should retrieve damage history for vehicle', async () => {
      const history = await service.getVehicleDamageHistory(testVehicleId, 10);

      expect(history).toBeInstanceOf(Array);
      // May be empty if no detections yet
    });

    it('should get detection statistics', async () => {
      const stats = await service.getStatistics(testVehicleId, 30);

      expect(stats).toBeDefined();
      expect(stats.total_detections).toBeDefined();
      expect(stats.total_damages).toBeDefined();
    });

    it('should validate request parameters', async () => {
      await expect(
        service.detectDamage({
          vehicleId: '',
          imageBase64: 'test',
          reportedBy: 'test-user'
        })
      ).rejects.toThrow('Vehicle ID is required');

      await expect(
        service.detectDamage({
          vehicleId: testVehicleId,
          imageBase64: 'test',
          reportedBy: ''
        })
      ).rejects.toThrow('Reported by user ID is required');
    });
  });

  // ============================================================================
  // INTEGRATION TESTS
  // ============================================================================

  describe('End-to-End Integration', () => {
    it('should complete full workflow: detect damage and create work orders', async () => {
      const service = createAiDamageDetectionService(db);
      const testImageBase64 = '/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCwAA8A';

      // Step 1: Detect damage with work order creation enabled
      const response = await service.detectDamage({
        vehicleId: testVehicleId,
        imageBase64: testImageBase64,
        reportedBy: 'test-user-001',
        autoCreateWorkOrder: true,
        notes: 'Integration test damage',
        location: 'Test Facility'
      });

      expect(response.detectionId).toBeDefined();
      expect(response.workOrdersCreated).toBeInstanceOf(Array);

      // Step 2: Verify detection was saved
      const detection = await service.getDetectionById(response.detectionId);
      expect(detection).toBeDefined();
      expect(detection.vehicle_id).toBe(testVehicleId);

      // Step 3: Verify work orders if any damages were detected
      if (response.summary.totalDamages > 0) {
        expect(response.workOrdersCreated.length).toBeGreaterThan(0);

        for (const wo of response.workOrdersCreated) {
          if (wo.status === 'created') {
            const workOrderCheck = await db.query(
              'SELECT * FROM work_orders WHERE id = $1',
              [wo.workOrderId]
            );
            expect(workOrderCheck.rows.length).toBe(1);
            expect(workOrderCheck.rows[0].ai_detection_id).toBe(response.detectionId);
          }
        }
      }

      // Step 4: Update repair status
      await service.updateRepairStatus(response.detectionId, 'in_progress', 'test-user-001');

      const updatedDetection = await service.getDetectionById(response.detectionId);
      expect(updatedDetection.repair_status).toBe('in_progress');

      // Step 5: Complete repair
      await service.updateRepairStatus(response.detectionId, 'completed', 'test-user-001');

      const completedDetection = await service.getDetectionById(response.detectionId);
      expect(completedDetection.repair_status).toBe('completed');
      expect(completedDetection.repair_completed_date).toBeDefined();
    }, 60000);
  });
});
