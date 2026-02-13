/**
 * Vehicle 3D Models Service
 *
 * High-level service for managing 3D vehicle models including:
 * - 3D model asset management (GLTF/GLB/USDZ)
 * - Vehicle customization (colors, trim, accessories)
 * - AR session tracking and analytics
 * - Damage overlay integration
 * - Performance monitoring
 * - Render generation for marketing
 */

import { Pool } from 'pg';

interface Vehicle3DModel {
  id: string;
  make: string;
  model: string;
  year: number;
  trim?: string;
  bodyStyle?: string;
  glbModelUrl?: string;
  usdzModelUrl?: string;
  gltfModelUrl?: string;
  highPolyUrl?: string;
  mediumPolyUrl?: string;
  lowPolyUrl?: string;
  diffuseMapUrl?: string;
  normalMapUrl?: string;
  metallicMapUrl?: string;
  roughnessMapUrl?: string;
  aoMapUrl?: string;
  emissiveMapUrl?: string;
  polygonCount?: number;
  fileSizeMb?: number;
  bboxWidthM?: number;
  bboxHeightM?: number;
  bboxLengthM?: number;
  defaultCameraPosition?: any;
  cameraPresets?: any;
  isPublished: boolean;
  supportsAr: boolean;
}

interface Vehicle3DInstance {
  id: string;
  vehicleId: string;
  model3dId: string;
  exteriorColorHex?: string;
  exteriorColorName?: string;
  interiorColorHex?: string;
  interiorColorName?: string;
  wheelStyle?: string;
  trimPackage?: string;
  accessories?: any[];
  modifications?: any[];
  damageMarkers?: DamageMarker[];
  lastDamageScan?: Date;
}

interface DamageMarker {
  location: { x: number; y: number; z: number };
  severity: 'minor' | 'moderate' | 'severe';
  type: string;
  description?: string;
  detectedAt?: Date;
}

interface CustomizationOption {
  id: string;
  category: string;
  itemName: string;
  itemCode?: string;
  previewImageUrl?: string;
  modelUrl?: string;
  textureUrl?: string;
  colorHex?: string;
  metallicValue?: number;
  roughnessValue?: number;
  priceUsd?: number;
  isAvailable: boolean;
}

interface ARSessionData {
  vehicleId: string;
  userId?: string;
  platform: 'iOS' | 'Android' | 'WebXR';
  arFramework: string;
  deviceModel?: string;
  osVersion?: string;
  placementAttempts?: number;
  successfulPlacements?: number;
  screenshotsTaken?: number;
  viewedAngles?: number;
  sessionRating?: number;
}

interface RenderRequest {
  vehicleId: string;
  instance3dId?: string;
  renderName: string;
  cameraAngle: 'front' | 'rear' | 'side' | '3quarter' | 'interior' | 'overhead';
  resolutionWidth?: number;
  resolutionHeight?: number;
  renderQuality?: 'low' | 'medium' | 'high' | 'ultra';
  backgroundType?: 'studio' | 'outdoor' | 'showroom' | 'transparent';
  timeOfDay?: 'morning' | 'noon' | 'sunset' | 'night';
}

class VehicleModelsService {
  private db: Pool;

  constructor(database: Pool) {
    this.db = database;
  }

  /**
   * Get 3D model for a vehicle
   */
  async getVehicle3DModel(vehicleId: string): Promise<any> {
    const baseSelect = `
      SELECT
        id,
        tenant_id,
        vehicle_id,
        model_name,
        model_type,
        file_url as glb_model_url,
        thumbnail_url,
        poly_count,
        status,
        metadata,
        created_at,
        updated_at
      FROM vehicle_3d_models
      WHERE status = 'active'
    `;

    const direct = await this.db.query(
      `${baseSelect} AND vehicle_id = $1 ORDER BY created_at DESC LIMIT 1`,
      [vehicleId]
    );

    if (direct.rows.length > 0) {
      return direct.rows[0];
    }

    const vehicleResult = await this.db.query(
      `SELECT type FROM vehicles WHERE id = $1`,
      [vehicleId]
    );
    const vehicleType = vehicleResult.rows[0]?.type;

    if (vehicleType) {
      const generic = await this.db.query(
        `${baseSelect} AND model_type = $1 AND vehicle_id IS NULL ORDER BY created_at DESC LIMIT 1`,
        [vehicleType]
      );

      if (generic.rows.length > 0) {
        return generic.rows[0];
      }
    }

    const fallback = await this.db.query(
      `${baseSelect} ORDER BY created_at DESC LIMIT 1`
    );
    return fallback.rows[0] || null;
  }

  /**
   * Get all published 3D models
   */
  async getPublished3DModels(filters?: {
    make?: string;
    model?: string;
    year?: number;
    bodyStyle?: string;
  }): Promise<Vehicle3DModel[]> {
    let query = `
      SELECT
        id,
        tenant_id,
        vehicle_id,
        model_name,
        model_type,
        file_url as glb_model_url,
        thumbnail_url,
        poly_count,
        status,
        metadata,
        created_at,
        updated_at
      FROM vehicle_3d_models
      WHERE status = 'active'
    `;
    const params: any[] = [];
    let paramIndex = 1;

    if (filters?.make) {
      query += ` AND (metadata->>'make') = $${paramIndex}`;
      params.push(filters.make);
      paramIndex++;
    }
    if (filters?.model) {
      query += ` AND (metadata->>'model') = $${paramIndex}`;
      params.push(filters.model);
      paramIndex++;
    }
    if (filters?.year) {
      query += ` AND (metadata->>'year') = $${paramIndex}`;
      params.push(String(filters.year));
      paramIndex++;
    }
    if (filters?.bodyStyle) {
      query += ` AND (metadata->>'bodyStyle' = $${paramIndex} OR model_type = $${paramIndex})`;
      params.push(filters.bodyStyle);
      paramIndex++;
    }

    query += ` ORDER BY created_at DESC`;

    const result = await this.db.query(query, params);
    return result.rows;
  }

  /**
   * Create or update vehicle 3D instance
   */
  async upsertVehicle3DInstance(data: Partial<Vehicle3DInstance>): Promise<Vehicle3DInstance> {
    const query = `
      INSERT INTO vehicle_3d_instances (
        vehicle_id, model_3d_id, exterior_color_hex, exterior_color_name,
        interior_color_hex, interior_color_name, wheel_style, trim_package,
        accessories, modifications, damage_markers
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      ON CONFLICT (vehicle_id)
      DO UPDATE SET
        exterior_color_hex = EXCLUDED.exterior_color_hex,
        exterior_color_name = EXCLUDED.exterior_color_name,
        interior_color_hex = EXCLUDED.interior_color_hex,
        interior_color_name = EXCLUDED.interior_color_name,
        wheel_style = EXCLUDED.wheel_style,
        trim_package = EXCLUDED.trim_package,
        accessories = EXCLUDED.accessories,
        modifications = EXCLUDED.modifications,
        damage_markers = EXCLUDED.damage_markers,
        updated_at = NOW()
      RETURNING *
    `;

    const result = await this.db.query(query, [
      data.vehicleId,
      data.model3dId,
      data.exteriorColorHex,
      data.exteriorColorName,
      data.interiorColorHex,
      data.interiorColorName,
      data.wheelStyle,
      data.trimPackage,
      JSON.stringify(data.accessories || []),
      JSON.stringify(data.modifications || []),
      JSON.stringify(data.damageMarkers || [])
    ]);

    return result.rows[0];
  }

  /**
   * Update vehicle customization
   */
  async updateCustomization(vehicleId: string, customization: {
    exteriorColorHex?: string;
    exteriorColorName?: string;
    interiorColorHex?: string;
    interiorColorName?: string;
    wheelStyle?: string;
    trimPackage?: string;
  }): Promise<Vehicle3DInstance> {
    const instanceTable = await this.db.query(
      `SELECT to_regclass('public.vehicle_3d_instances') as table_name`
    );

    if (!instanceTable.rows[0]?.table_name) {
      const metadataPatch = {
        customization: {
          exteriorColorHex: customization.exteriorColorHex,
          exteriorColorName: customization.exteriorColorName,
          interiorColorHex: customization.interiorColorHex,
          interiorColorName: customization.interiorColorName,
          wheelStyle: customization.wheelStyle,
          trimPackage: customization.trimPackage
        }
      };

      await this.db.query(
        `UPDATE vehicle_3d_models
         SET metadata = COALESCE(metadata, '{}'::jsonb) || $2::jsonb, updated_at = NOW()
         WHERE vehicle_id = $1`,
        [vehicleId, JSON.stringify(metadataPatch)]
      );

      const fallback = await this.db.query(
        `SELECT id, vehicle_id as "vehicleId", file_url as "glbModelUrl", metadata
         FROM vehicle_3d_models
         WHERE vehicle_id = $1
         ORDER BY created_at DESC
         LIMIT 1`,
        [vehicleId]
      );

      if (fallback.rows.length === 0) {
        throw new Error('Vehicle 3D model not found');
      }

      return fallback.rows[0] as Record<string, unknown>;
    }

    const query = `
      UPDATE vehicle_3d_instances
      SET
        exterior_color_hex = COALESCE($2, exterior_color_hex),
        exterior_color_name = COALESCE($3, exterior_color_name),
        interior_color_hex = COALESCE($4, interior_color_hex),
        interior_color_name = COALESCE($5, interior_color_name),
        wheel_style = COALESCE($6, wheel_style),
        trim_package = COALESCE($7, trim_package),
        updated_at = NOW()
      WHERE vehicle_id = $1
      RETURNING *
    `;

    const result = await this.db.query(query, [
      vehicleId,
      customization.exteriorColorHex,
      customization.exteriorColorName,
      customization.interiorColorHex,
      customization.interiorColorName,
      customization.wheelStyle,
      customization.trimPackage
    ]);

    if (result.rows.length === 0) {
      throw new Error(`Vehicle 3D instance not found`);
    }

    return result.rows[0];
  }

  /**
   * Get customization options for a model
   */
  async getCustomizationOptions(model3dId?: string, category?: string): Promise<CustomizationOption[]> {
    const existsResult = await this.db.query(
      `SELECT to_regclass('public.vehicle_3d_customization_catalog') as table_name`
    );
    if (!existsResult.rows[0]?.table_name) {
      return [];
    }

    let query = `
      SELECT
        id,
        model_3d_id as "model3dId",
        category,
        item_name as "itemName",
        item_code as "itemCode",
        preview_image_url as "previewImageUrl",
        model_url as "modelUrl",
        texture_url as "textureUrl",
        color_hex as "colorHex",
        metallic_value as "metallicValue",
        roughness_value as "roughnessValue",
        price_usd as "priceUsd",
        is_available as "isAvailable",
        display_order as "displayOrder",
        description
      FROM vehicle_3d_customization_catalog
      WHERE is_available = true
    `;
    const params: any[] = [];
    let paramIndex = 1;

    if (model3dId) {
      query += ` AND (model_3d_id = $${paramIndex} OR model_3d_id IS NULL)`;
      params.push(model3dId);
      paramIndex++;
    }

    if (category) {
      query += ` AND category = $${paramIndex}`;
      params.push(category);
      paramIndex++;
    }

    query += ` ORDER BY category, display_order, item_name`;

    const result = await this.db.query(query, params);
    return result.rows;
  }

  /**
   * Update damage markers from AI detection
   */
  async updateDamageMarkers(vehicleId: string, damageMarkers: DamageMarker[]): Promise<void> {
    const instanceTable = await this.db.query(
      `SELECT to_regclass('public.vehicle_3d_instances') as table_name`
    );

    if (!instanceTable.rows[0]?.table_name) {
      const metadataPatch = {
        damageMarkers
      };

      await this.db.query(
        `UPDATE vehicle_3d_models
         SET metadata = COALESCE(metadata, '{}'::jsonb) || $2::jsonb, updated_at = NOW()
         WHERE vehicle_id = $1`,
        [vehicleId, JSON.stringify(metadataPatch)]
      );
      return;
    }

    const query = `
      UPDATE vehicle_3d_instances
      SET
        damage_markers = $2,
        last_damage_scan = NOW(),
        updated_at = NOW()
      WHERE vehicle_id = $1
    `;

    await this.db.query(query, [vehicleId, JSON.stringify(damageMarkers)]);
  }

  /**
   * Track AR session
   */
  async trackARSession(sessionData: ARSessionData): Promise<string> {
    const query = `
      INSERT INTO ar_sessions (
        vehicle_id, user_id, platform, ar_framework, device_model, os_version,
        placement_attempts, successful_placements, screenshots_taken,
        viewed_angles, session_rating, started_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW())
      RETURNING id
    `;

    const result = await this.db.query(query, [
      sessionData.vehicleId,
      sessionData.userId,
      sessionData.platform,
      sessionData.arFramework,
      sessionData.deviceModel,
      sessionData.osVersion,
      sessionData.placementAttempts || 0,
      sessionData.successfulPlacements || 0,
      sessionData.screenshotsTaken || 0,
      sessionData.viewedAngles || 0,
      sessionData.sessionRating
    ]);

    return result.rows[0].id;
  }

  /**
   * End AR session
   */
  async endARSession(sessionId: string, updates: {
    placementAttempts?: number;
    successfulPlacements?: number;
    screenshotsTaken?: number;
    viewedAngles?: number;
    ledToInquiry?: boolean;
    sessionRating?: number;
  }): Promise<void> {
    const query = `
      UPDATE ar_sessions
      SET
        ended_at = NOW(),
        placement_attempts = COALESCE($2, placement_attempts),
        successful_placements = COALESCE($3, successful_placements),
        screenshots_taken = COALESCE($4, screenshots_taken),
        viewed_angles = COALESCE($5, viewed_angles),
        led_to_inquiry = COALESCE($6, led_to_inquiry),
        session_rating = COALESCE($7, session_rating)
      WHERE id = $1
    `;

    await this.db.query(query, [
      sessionId,
      updates.placementAttempts,
      updates.successfulPlacements,
      updates.screenshotsTaken,
      updates.viewedAngles,
      updates.ledToInquiry,
      updates.sessionRating
    ]);
  }

  /**
   * Get AR analytics
   */
  async getARAnalytics(days: number = 30): Promise<any> {
    // Validate and sanitize days parameter
    const daysNum = Math.max(1, Math.min(365, days || 30))

    const query = `
      SELECT *
      FROM ar_session_analytics
      WHERE session_date >= CURRENT_DATE - INTERVAL '${daysNum} days'
      ORDER BY session_date DESC
    `;

    const result = await this.db.query(query, [daysNum]);
    return result.rows;
  }

  /**
   * Create render request
   */
  async createRenderRequest(renderData: RenderRequest): Promise<string> {
    const query = `
      INSERT INTO vehicle_3d_renders (
        vehicle_id, instance_3d_id, render_name, camera_angle,
        resolution_width, resolution_height, render_quality,
        background_type, time_of_day, rendered_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
      RETURNING id
    `;

    const result = await this.db.query(query, [
      renderData.vehicleId,
      renderData.instance3dId,
      renderData.renderName,
      renderData.cameraAngle,
      renderData.resolutionWidth || 1920,
      renderData.resolutionHeight || 1080,
      renderData.renderQuality || 'high',
      renderData.backgroundType || 'studio',
      renderData.timeOfDay || 'noon'
    ]);

    return result.rows[0].id;
  }

  /**
   * Update render with generated image URL
   */
  async updateRenderUrl(renderId: number, renderUrl: string, thumbnailUrl?: string): Promise<void> {
    const query = `
      UPDATE vehicle_3d_renders
      SET
        render_url = $2,
        thumbnail_url = $3
      WHERE id = $1
    `;

    await this.db.query(query, [renderId, renderUrl, thumbnailUrl]);
  }

  /**
   * Get renders for vehicle
   */
  async getVehicleRenders(vehicleId: number, featured?: boolean): Promise<any[]> {
    let query = `
      SELECT id, tenant_id, render_type, render_data, created_at FROM vehicle_3d_renders
      WHERE vehicle_id = $1
    `;
    const params: any[] = [vehicleId];

    if (featured !== undefined) {
      query += ` AND is_featured = $2`;
      params.push(featured);
    }

    query += ` ORDER BY rendered_at DESC`;

    const result = await this.db.query(query, params);
    return result.rows;
  }

  /**
   * Track 3D viewer performance
   */
  async trackPerformance(metrics: {
    sessionId: string;
    vehicleId?: number;
    model3dId?: number;
    platform: string;
    deviceType: string;
    gpuInfo?: string;
    loadTimeMs: number;
    fpsAverage: number;
    fpsMin: number;
    memoryUsageMb?: number;
    qualityLevel: string;
    polygonCount?: number;
    shadowsEnabled?: boolean;
    reflectionsEnabled?: boolean;
    sessionDurationSeconds?: number;
  }): Promise<void> {
    const query = `
      INSERT INTO vehicle_3d_performance_metrics (
        session_id, vehicle_id, model_3d_id, platform, device_type, gpu_info,
        load_time_ms, fps_average, fps_min, memory_usage_mb, quality_level,
        polygon_count, shadows_enabled, reflections_enabled, session_duration_seconds
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
    `;

    await this.db.query(query, [
      metrics.sessionId,
      metrics.vehicleId,
      metrics.model3dId,
      metrics.platform,
      metrics.deviceType,
      metrics.gpuInfo,
      metrics.loadTimeMs,
      metrics.fpsAverage,
      metrics.fpsMin,
      metrics.memoryUsageMb,
      metrics.qualityLevel,
      metrics.polygonCount,
      metrics.shadowsEnabled,
      metrics.reflectionsEnabled,
      metrics.sessionDurationSeconds
    ]);
  }

  /**
   * Get performance summary
   */
  async getPerformanceSummary(): Promise<any[]> {
    const query = `SELECT * FROM performance_3d_summary`;
    const result = await this.db.query(query);
    return result.rows;
  }

  /**
   * Find or create 3D model for vehicle
   */
  async findOrCreateModelForVehicle(
    vehicleId: string,
    vehicleInfo: { make: string; model: string; year: number; trim?: string }
  ): Promise<Vehicle3DInstance> {
    const existing = await this.db.query(
      `SELECT
        id,
        vehicle_id as "vehicleId",
        model_name as "modelName",
        model_type as "modelType",
        file_url as "glbModelUrl",
        thumbnail_url as "thumbnailUrl",
        poly_count as "polyCount",
        metadata,
        created_at,
        updated_at
       FROM vehicle_3d_models
       WHERE vehicle_id = $1
       ORDER BY created_at DESC
       LIMIT 1`,
      [vehicleId]
    );

    if (existing.rows.length > 0) {
      return existing.rows[0] as Record<string, unknown>;
    }

    const vehicleResult = await this.db.query(
      `SELECT tenant_id, type FROM vehicles WHERE id = $1`,
      [vehicleId]
    );
    const tenantId = vehicleResult.rows[0]?.tenant_id;
    const vehicleType = vehicleResult.rows[0]?.type;

    if (!tenantId) {
      throw new Error('Vehicle not found');
    }

    const templateResult = await this.db.query(
      `SELECT
         model_name,
         model_type,
         file_url,
         thumbnail_url,
         poly_count,
         metadata
       FROM vehicle_3d_models
       WHERE status = 'active' AND vehicle_id IS NULL
         AND ($1::text IS NULL OR metadata->>'make' = $1)
         AND ($2::text IS NULL OR metadata->>'model' = $2)
       ORDER BY created_at DESC
       LIMIT 1`,
      [vehicleInfo.make || null, vehicleInfo.model || null]
    );

    const template = templateResult.rows[0]
      || (await this.db.query(
        `SELECT model_name, model_type, file_url, thumbnail_url, poly_count, metadata
         FROM vehicle_3d_models
         WHERE status = 'active'
         ORDER BY created_at DESC
         LIMIT 1`
      )).rows[0];

    if (!template) {
      throw new Error('No 3D models available');
    }

    const insertResult = await this.db.query(
      `INSERT INTO vehicle_3d_models (
        tenant_id,
        vehicle_id,
        model_name,
        model_type,
        file_url,
        thumbnail_url,
        poly_count,
        status,
        metadata,
        created_at,
        updated_at
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,'active',$8,NOW(),NOW())
      RETURNING
        id,
        vehicle_id as "vehicleId",
        model_name as "modelName",
        model_type as "modelType",
        file_url as "glbModelUrl",
        thumbnail_url as "thumbnailUrl",
        poly_count as "polyCount",
        metadata,
        created_at,
        updated_at`,
      [
        tenantId,
        vehicleId,
        template.model_name || vehicleInfo.model || 'Fleet Model',
        template.model_type || vehicleType || null,
        template.file_url,
        template.thumbnail_url,
        template.poly_count,
        template.metadata || {}
      ]
    );

    return insertResult.rows[0] as Record<string, unknown>;
  }

  /**
   * Get model makes/models for catalog
   */
  async getModelCatalog(): Promise<{
    makes: string[];
    modelsByMake: Record<string, string[]>;
    yearRange: { min: number; max: number };
  }> {
    const makesQuery = `
      SELECT DISTINCT COALESCE(metadata->>'make', model_name) as make
      FROM vehicle_3d_models
      WHERE status = 'active'
      ORDER BY make
    `;
    const makesResult = await this.db.query(makesQuery);
    const makes = makesResult.rows.map(r => r.make).filter(Boolean);

    const modelsByMake: Record<string, string[]> = {};
    for (const make of makes) {
      const modelsQuery = `
        SELECT DISTINCT COALESCE(metadata->>'model', model_name) as model
        FROM vehicle_3d_models
        WHERE status = 'active' AND (metadata->>'make' = $1 OR model_name = $1)
        ORDER BY model
      `;
      const modelsResult = await this.db.query(modelsQuery, [make]);
      modelsByMake[make] = modelsResult.rows.map(r => r.model).filter(Boolean);
    }

    const yearsQuery = `
      SELECT MIN((metadata->>'year')::int) as min_year, MAX((metadata->>'year')::int) as max_year
      FROM vehicle_3d_models
      WHERE status = 'active' AND metadata ? 'year'
    `;
    const yearsResult = await this.db.query(yearsQuery);
    const yearRange = {
      min: yearsResult.rows[0].min_year || 0,
      max: yearsResult.rows[0].max_year || 0
    };

    return { makes, modelsByMake, yearRange };
  }
}

export default VehicleModelsService;
