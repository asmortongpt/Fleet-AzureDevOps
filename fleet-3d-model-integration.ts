/**
 * Fleet Management 3D Model Integration
 *
 * Complete integration of Meshy.ai 3D models into the fleet management system
 * Includes database schema, API endpoints, and model management
 */

import { Pool } from 'pg';
import FordLightningGenerator from './meshy-ford-lightning-generator';

// ============================================================================
// Database Schema
// ============================================================================

export const DATABASE_SCHEMA = `
-- ============================================================================
-- 3D Vehicle Models Table
-- ============================================================================
CREATE TABLE IF NOT EXISTS vehicle_3d_models (
  id SERIAL PRIMARY KEY,
  vehicle_id INTEGER REFERENCES vehicles(id) ON DELETE CASCADE,

  -- Meshy Task Information
  meshy_task_id VARCHAR(255) UNIQUE NOT NULL,
  meshy_task_type VARCHAR(50) NOT NULL, -- 'text-to-3d', 'image-to-3d', 'retexture'
  generation_status VARCHAR(50) DEFAULT 'PENDING', -- PENDING, IN_PROGRESS, SUCCEEDED, FAILED

  -- Model Configuration
  paint_color VARCHAR(100),
  paint_hex VARCHAR(7),
  trim_level VARCHAR(50),
  wheel_type VARCHAR(50),

  -- Model URLs (stored after generation completes)
  model_url_glb TEXT,
  model_url_fbx TEXT,
  model_url_obj TEXT,
  model_url_usdz TEXT,

  -- Texture URLs (PBR maps)
  texture_base_color TEXT,
  texture_metallic TEXT,
  texture_roughness TEXT,
  texture_normal TEXT,

  thumbnail_url TEXT,

  -- Features
  features JSONB DEFAULT '{}', -- {bedLiner: true, tonneau_cover: false, etc}

  -- Model Metadata
  polycount INTEGER,
  file_size_mb DECIMAL(10, 2),
  generation_time_seconds INTEGER,

  -- Versioning
  is_current BOOLEAN DEFAULT true,
  version INTEGER DEFAULT 1,
  parent_model_id INTEGER REFERENCES vehicle_3d_models(id),

  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  downloaded_at TIMESTAMP,

  -- Credits usage tracking
  credits_used INTEGER DEFAULT 0
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_vehicle_3d_models_vehicle_id ON vehicle_3d_models(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_3d_models_meshy_task_id ON vehicle_3d_models(meshy_task_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_3d_models_status ON vehicle_3d_models(generation_status);
CREATE INDEX IF NOT EXISTS idx_vehicle_3d_models_current ON vehicle_3d_models(vehicle_id, is_current);

-- ============================================================================
-- Model Generation Jobs Queue
-- ============================================================================
CREATE TABLE IF NOT EXISTS model_generation_queue (
  id SERIAL PRIMARY KEY,
  vehicle_id INTEGER REFERENCES vehicles(id) ON DELETE CASCADE,

  job_type VARCHAR(50) NOT NULL, -- 'initial', 'color_change', 'damage_add', 'feature_update'
  priority INTEGER DEFAULT 0, -- Higher number = higher priority

  -- Generation parameters
  generation_params JSONB NOT NULL,

  -- Job status
  status VARCHAR(50) DEFAULT 'queued', -- queued, processing, completed, failed
  attempts INTEGER DEFAULT 0,
  max_attempts INTEGER DEFAULT 3,

  -- Timing
  queued_at TIMESTAMP DEFAULT NOW(),
  started_at TIMESTAMP,
  completed_at TIMESTAMP,

  -- Results
  model_id INTEGER REFERENCES vehicle_3d_models(id),
  error_message TEXT
);

CREATE INDEX IF NOT EXISTS idx_generation_queue_status ON model_generation_queue(status, priority DESC);

-- ============================================================================
-- Vehicle Damage Records (for damage texturing)
-- ============================================================================
CREATE TABLE IF NOT EXISTS vehicle_damage_records (
  id SERIAL PRIMARY KEY,
  vehicle_id INTEGER REFERENCES vehicles(id) ON DELETE CASCADE,

  -- Damage details
  damage_type VARCHAR(100) NOT NULL, -- 'dent', 'scratch', 'crack', 'paint_chip', etc
  damage_location VARCHAR(100) NOT NULL, -- 'front_bumper', 'driver_door', etc
  severity VARCHAR(50), -- 'minor', 'moderate', 'severe'

  -- Damage description for texture generation
  description TEXT,

  -- Reference images
  damage_photos JSONB DEFAULT '[]', -- Array of image URLs

  -- 3D Model with damage
  damaged_model_id INTEGER REFERENCES vehicle_3d_models(id),

  -- Timestamps
  occurred_at TIMESTAMP,
  reported_at TIMESTAMP DEFAULT NOW(),
  repaired_at TIMESTAMP,

  -- Insurance/cost tracking
  estimated_cost DECIMAL(10, 2),
  actual_cost DECIMAL(10, 2)
);

CREATE INDEX IF NOT EXISTS idx_vehicle_damage_vehicle_id ON vehicle_damage_records(vehicle_id);

-- ============================================================================
-- Model Generation History & Analytics
-- ============================================================================
CREATE TABLE IF NOT EXISTS model_generation_analytics (
  id SERIAL PRIMARY KEY,
  date DATE DEFAULT CURRENT_DATE,

  -- Usage metrics
  total_generations INTEGER DEFAULT 0,
  text_to_3d_count INTEGER DEFAULT 0,
  image_to_3d_count INTEGER DEFAULT 0,
  retexture_count INTEGER DEFAULT 0,

  -- Credits tracking
  total_credits_used INTEGER DEFAULT 0,

  -- Performance metrics
  avg_generation_time_seconds DECIMAL(10, 2),
  success_rate DECIMAL(5, 2),

  UNIQUE(date)
);
`;

// ============================================================================
// Database Service
// ============================================================================

export class FleetModelDatabase {
  private pool: Pool;

  constructor(connectionString: string) {
    this.pool = new Pool({
      connectionString,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined,
    });
  }

  async initialize(): Promise<void> {
    await this.pool.query(DATABASE_SCHEMA);
    console.log('✅ Database schema initialized');
  }

  // ------------------------------------------------------------------------
  // Vehicle 3D Models
  // ------------------------------------------------------------------------

  async createModelRecord(data: {
    vehicleId: number;
    meshyTaskId: string;
    taskType: string;
    paintColor?: string;
    paintHex?: string;
    trimLevel?: string;
    wheelType?: string;
    features?: any;
    creditsUsed: number;
  }) {
    const query = `
      INSERT INTO vehicle_3d_models (
        vehicle_id, meshy_task_id, meshy_task_type, paint_color, paint_hex,
        trim_level, wheel_type, features, credits_used
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `;

    const result = await this.pool.query(query, [
      data.vehicleId,
      data.meshyTaskId,
      data.taskType,
      data.paintColor,
      data.paintHex,
      data.trimLevel,
      data.wheelType,
      JSON.stringify(data.features || {}),
      data.creditsUsed,
    ]);

    return result.rows[0];
  }

  async updateModelStatus(meshyTaskId: string, status: string, progress?: number) {
    const query = `
      UPDATE vehicle_3d_models
      SET generation_status = $1, updated_at = NOW()
      WHERE meshy_task_id = $2
      RETURNING *
    `;

    const result = await this.pool.query(query, [status, meshyTaskId]);
    return result.rows[0];
  }

  async updateModelUrls(meshyTaskId: string, urls: {
    glb?: string;
    fbx?: string;
    obj?: string;
    usdz?: string;
    baseColor?: string;
    metallic?: string;
    roughness?: string;
    normal?: string;
    thumbnail?: string;
  }) {
    const query = `
      UPDATE vehicle_3d_models
      SET
        model_url_glb = $1,
        model_url_fbx = $2,
        model_url_obj = $3,
        model_url_usdz = $4,
        texture_base_color = $5,
        texture_metallic = $6,
        texture_roughness = $7,
        texture_normal = $8,
        thumbnail_url = $9,
        generation_status = 'SUCCEEDED',
        updated_at = NOW()
      WHERE meshy_task_id = $10
      RETURNING *
    `;

    const result = await this.pool.query(query, [
      urls.glb,
      urls.fbx,
      urls.obj,
      urls.usdz,
      urls.baseColor,
      urls.metallic,
      urls.roughness,
      urls.normal,
      urls.thumbnail,
      meshyTaskId,
    ]);

    return result.rows[0];
  }

  async getCurrentModel(vehicleId: number) {
    const query = `
      SELECT * FROM vehicle_3d_models
      WHERE vehicle_id = $1 AND is_current = true
      ORDER BY created_at DESC
      LIMIT 1
    `;

    const result = await this.pool.query(query, [vehicleId]);
    return result.rows[0];
  }

  async getModelHistory(vehicleId: number) {
    const query = `
      SELECT * FROM vehicle_3d_models
      WHERE vehicle_id = $1
      ORDER BY version DESC, created_at DESC
    `;

    const result = await this.pool.query(query, [vehicleId]);
    return result.rows;
  }

  // ------------------------------------------------------------------------
  // Generation Queue
  // ------------------------------------------------------------------------

  async queueGeneration(data: {
    vehicleId: number;
    jobType: string;
    params: any;
    priority?: number;
  }) {
    const query = `
      INSERT INTO model_generation_queue (vehicle_id, job_type, generation_params, priority)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;

    const result = await this.pool.query(query, [
      data.vehicleId,
      data.jobType,
      JSON.stringify(data.params),
      data.priority || 0,
    ]);

    return result.rows[0];
  }

  async getNextQueuedJob() {
    const query = `
      UPDATE model_generation_queue
      SET status = 'processing', started_at = NOW()
      WHERE id = (
        SELECT id FROM model_generation_queue
        WHERE status = 'queued' AND attempts < max_attempts
        ORDER BY priority DESC, queued_at ASC
        LIMIT 1
        FOR UPDATE SKIP LOCKED
      )
      RETURNING *
    `;

    const result = await this.pool.query(query);
    return result.rows[0];
  }

  async completeQueuedJob(jobId: number, modelId: number) {
    const query = `
      UPDATE model_generation_queue
      SET status = 'completed', completed_at = NOW(), model_id = $1
      WHERE id = $2
      RETURNING *
    `;

    const result = await this.pool.query(query, [modelId, jobId]);
    return result.rows[0];
  }

  async failQueuedJob(jobId: number, error: string) {
    const query = `
      UPDATE model_generation_queue
      SET status = 'failed', completed_at = NOW(), error_message = $1, attempts = attempts + 1
      WHERE id = $2
      RETURNING *
    `;

    const result = await this.pool.query(query, [error, jobId]);
    return result.rows[0];
  }

  // ------------------------------------------------------------------------
  // Damage Records
  // ------------------------------------------------------------------------

  async createDamageRecord(data: {
    vehicleId: number;
    damageType: string;
    location: string;
    severity?: string;
    description?: string;
    photos?: string[];
    occurredAt?: Date;
    estimatedCost?: number;
  }) {
    const query = `
      INSERT INTO vehicle_damage_records (
        vehicle_id, damage_type, damage_location, severity, description,
        damage_photos, occurred_at, estimated_cost
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `;

    const result = await this.pool.query(query, [
      data.vehicleId,
      data.damageType,
      data.location,
      data.severity,
      data.description,
      JSON.stringify(data.photos || []),
      data.occurredAt,
      data.estimatedCost,
    ]);

    return result.rows[0];
  }

  async linkDamageToModel(damageId: number, modelId: number) {
    const query = `
      UPDATE vehicle_damage_records
      SET damaged_model_id = $1
      WHERE id = $2
      RETURNING *
    `;

    const result = await this.pool.query(query, [modelId, damageId]);
    return result.rows[0];
  }

  async getVehicleDamage(vehicleId: number) {
    const query = `
      SELECT d.*, m.model_url_glb as damage_model_url
      FROM vehicle_damage_records d
      LEFT JOIN vehicle_3d_models m ON d.damaged_model_id = m.id
      WHERE d.vehicle_id = $1 AND d.repaired_at IS NULL
      ORDER BY d.occurred_at DESC
    `;

    const result = await this.pool.query(query, [vehicleId]);
    return result.rows;
  }

  // ------------------------------------------------------------------------
  // Analytics
  // ------------------------------------------------------------------------

  async recordGeneration(type: string, creditsUsed: number, generationTime: number, success: boolean) {
    const query = `
      INSERT INTO model_generation_analytics (
        date, total_generations,
        text_to_3d_count, image_to_3d_count, retexture_count,
        total_credits_used, avg_generation_time_seconds, success_rate
      )
      VALUES (
        CURRENT_DATE, 1,
        CASE WHEN $1 = 'text-to-3d' THEN 1 ELSE 0 END,
        CASE WHEN $1 = 'image-to-3d' THEN 1 ELSE 0 END,
        CASE WHEN $1 = 'retexture' THEN 1 ELSE 0 END,
        $2, $3, CASE WHEN $4 THEN 100.0 ELSE 0.0 END
      )
      ON CONFLICT (date) DO UPDATE SET
        total_generations = model_generation_analytics.total_generations + 1,
        text_to_3d_count = model_generation_analytics.text_to_3d_count + CASE WHEN $1 = 'text-to-3d' THEN 1 ELSE 0 END,
        image_to_3d_count = model_generation_analytics.image_to_3d_count + CASE WHEN $1 = 'image-to-3d' THEN 1 ELSE 0 END,
        retexture_count = model_generation_analytics.retexture_count + CASE WHEN $1 = 'retexture' THEN 1 ELSE 0 END,
        total_credits_used = model_generation_analytics.total_credits_used + $2,
        avg_generation_time_seconds = (
          (model_generation_analytics.avg_generation_time_seconds * model_generation_analytics.total_generations + $3) /
          (model_generation_analytics.total_generations + 1)
        ),
        success_rate = (
          (model_generation_analytics.success_rate * model_generation_analytics.total_generations + CASE WHEN $4 THEN 100.0 ELSE 0.0 END) /
          (model_generation_analytics.total_generations + 1)
        )
    `;

    await this.pool.query(query, [type, creditsUsed, generationTime, success]);
  }

  async close(): Promise<void> {
    await this.pool.end();
  }
}

// ============================================================================
// Fleet Model Service
// ============================================================================

export class FleetModelService {
  private db: FleetModelDatabase;
  private generator: FordLightningGenerator;

  constructor(dbConnectionString: string, meshyApiKey: string) {
    this.db = new FleetModelDatabase(dbConnectionString);
    this.generator = new FordLightningGenerator(meshyApiKey);
  }

  async initialize(): Promise<void> {
    await this.db.initialize();
  }

  /**
   * Generate initial 3D model for a vehicle
   */
  async generateInitialModel(vehicleId: number, options: {
    paintColor: string;
    paintHex?: string;
    trim: 'Pro' | 'XLT' | 'Lariat' | 'Platinum';
    wheels: string;
    features?: any;
    referenceImages?: string[];
  }) {
    const startTime = Date.now();

    try {
      // Queue the generation job
      const job = await this.db.queueGeneration({
        vehicleId,
        jobType: 'initial',
        params: options,
        priority: 5,
      });

      // Determine generation method
      let task;
      let taskType;
      let creditsUsed;

      if (options.referenceImages && options.referenceImages.length > 0) {
        // Use image-based generation (higher quality)
        taskType = 'image-to-3d';
        creditsUsed = 30;

        task = await this.generator.generateFromImages(options.referenceImages, {
          paintColor: options.paintColor as any,
          trim: options.trim,
          wheels: options.wheels as any,
          features: options.features || {},
        });
      } else {
        // Use text-based generation
        taskType = 'text-to-3d';
        creditsUsed = 30; // 20 preview + 10 refine

        task = await this.generator.generateFromText({
          paintColor: options.paintColor as any,
          trim: options.trim,
          wheels: options.wheels as any,
          features: options.features || {},
        });
      }

      // Create database record
      const modelRecord = await this.db.createModelRecord({
        vehicleId,
        meshyTaskId: task.id,
        taskType,
        paintColor: options.paintColor,
        paintHex: options.paintHex,
        trimLevel: options.trim,
        wheelType: options.wheels,
        features: options.features,
        creditsUsed,
      });

      // Update with model URLs
      if (task.model_urls) {
        await this.db.updateModelUrls(task.id, {
          glb: task.model_urls.glb,
          fbx: task.model_urls.fbx,
          obj: task.model_urls.obj,
          usdz: task.model_urls.usdz,
          baseColor: task.texture_urls?.base_color,
          metallic: task.texture_urls?.metallic,
          roughness: task.texture_urls?.roughness,
          normal: task.texture_urls?.normal,
          thumbnail: task.thumbnail_url,
        });
      }

      // Complete job
      await this.db.completeQueuedJob(job.id, modelRecord.id);

      // Record analytics
      const generationTime = Math.floor((Date.now() - startTime) / 1000);
      await this.db.recordGeneration(taskType, creditsUsed, generationTime, true);

      return modelRecord;
    } catch (error) {
      console.error('Error generating initial model:', error);
      const generationTime = Math.floor((Date.now() - startTime) / 1000);
      await this.db.recordGeneration('text-to-3d', 0, generationTime, false);
      throw error;
    }
  }

  /**
   * Change vehicle paint color
   */
  async changePaintColor(vehicleId: number, newColor: string, customHex?: string, customDesc?: string) {
    const startTime = Date.now();

    try {
      // Get current model
      const currentModel = await this.db.getCurrentModel(vehicleId);
      if (!currentModel) {
        throw new Error('No current model found for vehicle');
      }

      // Generate new color variant
      const task = await this.generator.changePaintColor(
        currentModel.meshy_task_id,
        newColor as any,
        customHex,
        customDesc
      );

      // Create new model record
      const modelRecord = await this.db.createModelRecord({
        vehicleId,
        meshyTaskId: task.id,
        taskType: 'retexture',
        paintColor: newColor,
        paintHex: customHex,
        trimLevel: currentModel.trim_level,
        wheelType: currentModel.wheel_type,
        features: currentModel.features,
        creditsUsed: 10,
      });

      // Update with model URLs
      if (task.model_urls) {
        await this.db.updateModelUrls(task.id, {
          glb: task.model_urls.glb,
          fbx: task.model_urls.fbx,
          obj: task.model_urls.obj,
          usdz: task.model_urls.usdz,
          baseColor: task.texture_urls?.base_color,
          metallic: task.texture_urls?.metallic,
          roughness: task.texture_urls?.roughness,
          normal: task.texture_urls?.normal,
          thumbnail: task.thumbnail_url,
        });
      }

      // Record analytics
      const generationTime = Math.floor((Date.now() - startTime) / 1000);
      await this.db.recordGeneration('retexture', 10, generationTime, true);

      return modelRecord;
    } catch (error) {
      console.error('Error changing paint color:', error);
      const generationTime = Math.floor((Date.now() - startTime) / 1000);
      await this.db.recordGeneration('retexture', 0, generationTime, false);
      throw error;
    }
  }

  /**
   * Add damage to vehicle model
   */
  async addDamageToModel(vehicleId: number, damage: {
    type: string;
    location: string;
    severity: string;
    description: string;
    photos?: string[];
    occurredAt?: Date;
    estimatedCost?: number;
  }) {
    const startTime = Date.now();

    try {
      // Create damage record
      const damageRecord = await this.db.createDamageRecord({
        vehicleId,
        damageType: damage.type,
        location: damage.location,
        severity: damage.severity,
        description: damage.description,
        photos: damage.photos,
        occurredAt: damage.occurredAt,
        estimatedCost: damage.estimatedCost,
      });

      // Get current model
      const currentModel = await this.db.getCurrentModel(vehicleId);
      if (!currentModel) {
        throw new Error('No current model found for vehicle');
      }

      // Generate damaged model using retexture
      let task;
      if (damage.photos && damage.photos.length > 0) {
        // Use damage photo as texture reference
        task = await this.generator.applyCustomTexture(
          currentModel.meshy_task_id,
          damage.photos[0]
        );
      } else {
        // Use text description
        const damagePrompt = `${damage.location} with ${damage.type}, ${damage.severity} severity, ${damage.description}`;
        task = await this.generator.changePaintColor(
          currentModel.meshy_task_id,
          'Customize',
          undefined,
          damagePrompt
        );
      }

      // Create damaged model record
      const modelRecord = await this.db.createModelRecord({
        vehicleId,
        meshyTaskId: task.id,
        taskType: 'retexture',
        paintColor: currentModel.paint_color,
        paintHex: currentModel.paint_hex,
        trimLevel: currentModel.trim_level,
        wheelType: currentModel.wheel_type,
        features: currentModel.features,
        creditsUsed: 10,
      });

      // Update with model URLs
      if (task.model_urls) {
        await this.db.updateModelUrls(task.id, {
          glb: task.model_urls.glb,
          fbx: task.model_urls.fbx,
          obj: task.model_urls.obj,
          usdz: task.model_urls.usdz,
          baseColor: task.texture_urls?.base_color,
          metallic: task.texture_urls?.metallic,
          roughness: task.texture_urls?.roughness,
          normal: task.texture_urls?.normal,
          thumbnail: task.thumbnail_url,
        });
      }

      // Link damage to model
      await this.db.linkDamageToModel(damageRecord.id, modelRecord.id);

      // Record analytics
      const generationTime = Math.floor((Date.now() - startTime) / 1000);
      await this.db.recordGeneration('retexture', 10, generationTime, true);

      return { damageRecord, modelRecord };
    } catch (error) {
      console.error('Error adding damage to model:', error);
      const generationTime = Math.floor((Date.now() - startTime) / 1000);
      await this.db.recordGeneration('retexture', 0, generationTime, false);
      throw error;
    }
  }

  async close(): Promise<void> {
    await this.db.close();
  }
}

export default FleetModelService;
