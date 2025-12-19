import { Pool } from 'pg';

import { BaseRepository } from './base.repository';

export interface VehicleModel {
  id: number;
  tenant_id: number;
  name: string;
  description?: string;
  vehicle_type?: string;
  make?: string;
  model?: string;
  year?: number;
  file_url: string;
  file_format?: string;
  file_size_mb?: number;
  poly_count?: number;
  source: string;
  source_id?: string;
  license?: string;
  license_url?: string;
  author?: string;
  author_url?: string;
  thumbnail_url?: string;
  preview_images?: string[];
  quality_tier?: string;
  has_interior?: boolean;
  has_pbr_materials?: boolean;
  view_count: number;
  download_count: number;
  is_featured: boolean;
  is_active: boolean;
  tags?: string[];
  created_at?: Date;
  updated_at?: Date;
  deleted_at?: Date | null;
}

export interface ModelSearchParams {
  search?: string;
  vehicleType?: string;
  make?: string;
  source?: string;
  quality?: string;
  limit?: number;
  offset?: number;
}

export interface ModelUploadData {
  name: string;
  description?: string;
  vehicleType?: string;
  make?: string;
  model?: string;
  year?: number;
  fileUrl: string;
  fileFormat?: string;
  fileSizeMb?: number;
  source: string;
  license?: string;
  thumbnailUrl?: string;
  qualityTier?: string;
  tags?: string[];
}

export interface SketchfabImportData {
  name: string;
  description?: string;
  fileUrl: string;
  source: string;
  sourceId: string;
  license?: string;
  licenseUrl?: string;
  author?: string;
  authorUrl?: string;
  thumbnailUrl?: string;
  polyCount?: number;
  viewCount?: number;
}

export class ModelsRepository extends BaseRepository<VehicleModel> {
  constructor(db: Pool) {
    super('vehicle_3d_models', db);
  }

  /**
   * Search models with filters and pagination
   */
  async searchModels(params: ModelSearchParams, tenantId: number): Promise<{ models: VehicleModel[]; total: number }> {
    let query = `
      SELECT
        id, name, description, vehicle_type, make, model, year,
        file_url, file_format, file_size_mb, poly_count,
        source, license, thumbnail_url, preview_images,
        quality_tier, has_interior, has_pbr_materials,
        view_count, download_count, is_featured,
        tags, created_at
      FROM vehicle_3d_models
      WHERE tenant_id = $1 AND is_active = true
    `;

    const queryParams: any[] = [tenantId];
    let paramIndex = 2;

    if (params.search) {
      query += ` AND to_tsvector('english', coalesce(name, '') || ' ' || coalesce(description, '') || ' ' || coalesce(make, '') || ' ' || coalesce(model, ''))
                 @@ plainto_tsquery('english', $${paramIndex})`;
      queryParams.push(params.search);
      paramIndex++;
    }

    if (params.vehicleType) {
      query += ` AND vehicle_type = $${paramIndex}`;
      queryParams.push(params.vehicleType);
      paramIndex++;
    }

    if (params.make) {
      query += ` AND make ILIKE $${paramIndex}`;
      queryParams.push(`%${params.make}%`);
      paramIndex++;
    }

    if (params.source) {
      query += ` AND source = $${paramIndex}`;
      queryParams.push(params.source);
      paramIndex++;
    }

    if (params.quality) {
      query += ` AND quality_tier = $${paramIndex}`;
      queryParams.push(params.quality);
      paramIndex++;
    }

    query += ` ORDER BY is_featured DESC, view_count DESC, created_at DESC`;

    const limit = params.limit || 20;
    const offset = params.offset || 0;
    query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    queryParams.push(limit, offset);

    const result = await this.query<VehicleModel>(query, queryParams);

    // Get total count
    const countQuery = `SELECT COUNT(*) FROM vehicle_3d_models WHERE tenant_id = $1 AND is_active = true`;
    const countResult = await this.query<{ count: string }>(countQuery, [tenantId]);
    const total = parseInt(countResult.rows[0].count);

    return {
      models: result.rows,
      total,
    };
  }

  /**
   * Full-text search using stored procedure
   */
  async fullTextSearch(
    query: string | null,
    vehicleType: string | null,
    make: string | null,
    source: string | null,
    limit: number,
    tenantId: number
  ): Promise<VehicleModel[]> {
    const result = await this.query<VehicleModel>(
      `SELECT * FROM search_vehicle_3d_models($1, $2, $3, $4, $5, $6)`,
      [query, vehicleType, make, source, limit, tenantId]
    );
    return result.rows;
  }

  /**
   * Get featured models
   */
  async getFeaturedModels(limit: number, tenantId: number): Promise<VehicleModel[]> {
    const result = await this.query<VehicleModel>(
      `SELECT * FROM v_featured_vehicle_3d_models WHERE tenant_id = $1 LIMIT $2`,
      [tenantId, limit]
    );
    return result.rows;
  }

  /**
   * Get popular models
   */
  async getPopularModels(limit: number, tenantId: number): Promise<VehicleModel[]> {
    const result = await this.query<VehicleModel>(
      `SELECT * FROM v_popular_vehicle_3d_models WHERE tenant_id = $1 LIMIT $2`,
      [tenantId, limit]
    );
    return result.rows;
  }

  /**
   * Get model by ID and increment view count
   */
  async getModelById(id: number, tenantId: number): Promise<VehicleModel | null> {
    const result = await this.query<VehicleModel>(
      `SELECT * FROM vehicle_3d_models WHERE id = $1 AND tenant_id = $2 AND is_active = true`,
      [id, tenantId]
    );

    if (result.rows.length === 0) {
      return null;
    }

    // Increment view count
    await this.query(`SELECT increment_model_view_count($1)`, [id]);

    return result.rows[0];
  }

  /**
   * Upload custom model
   */
  async uploadModel(data: ModelUploadData, tenantId: number): Promise<VehicleModel> {
    const result = await this.query<VehicleModel>(
      `INSERT INTO vehicle_3d_models (
        tenant_id, name, description, vehicle_type, make, model, year,
        file_url, file_format, file_size_mb,
        source, license, thumbnail_url, quality_tier, tags,
        created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, NOW(), NOW())
      RETURNING *`,
      [
        tenantId,
        data.name,
        data.description || null,
        data.vehicleType || null,
        data.make || null,
        data.model || null,
        data.year || null,
        data.fileUrl,
        data.fileFormat || null,
        data.fileSizeMb || null,
        data.source,
        data.license || 'Custom',
        data.thumbnailUrl || null,
        data.qualityTier || 'medium',
        data.tags || null,
      ]
    );
    return result.rows[0];
  }

  /**
   * Import model from Sketchfab
   */
  async importSketchfabModel(data: SketchfabImportData, tenantId: number): Promise<VehicleModel> {
    const result = await this.query<VehicleModel>(
      `INSERT INTO vehicle_3d_models (
        tenant_id, name, description, file_url, source, source_id,
        license, license_url, author, author_url,
        thumbnail_url, poly_count, view_count,
        created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW(), NOW())
      RETURNING *`,
      [
        tenantId,
        data.name,
        data.description || null,
        data.fileUrl,
        data.source,
        data.sourceId,
        data.license || null,
        data.licenseUrl || null,
        data.author || null,
        data.authorUrl || null,
        data.thumbnailUrl || null,
        data.polyCount || null,
        data.viewCount || 0,
      ]
    );
    return result.rows[0];
  }

  /**
   * Soft delete model
   */
  async softDeleteModel(id: number, tenantId: number): Promise<void> {
    await this.query(
      `UPDATE vehicle_3d_models SET is_active = false, updated_at = NOW() WHERE id = $1 AND tenant_id = $2`,
      [id, tenantId]
    );
  }

  /**
   * Assign model to vehicle
   */
  async assignModelToVehicle(vehicleId: number, modelId: number, tenantId: number): Promise<void> {
    // Verify model exists
    const modelResult = await this.query<VehicleModel>(
      `SELECT id FROM vehicle_3d_models WHERE id = $1 AND tenant_id = $2 AND is_active = true`,
      [modelId, tenantId]
    );

    if (modelResult.rows.length === 0) {
      throw new Error('Model not found');
    }

    // Update vehicle
    await this.query(
      `UPDATE vehicles SET model_3d_id = $1, updated_at = NOW() WHERE id = $2 AND tenant_id = $3`,
      [modelId, vehicleId, tenantId]
    );
  }

  /**
   * Get download URL for model
   */
  async getModelForDownload(id: number, tenantId: number): Promise<VehicleModel | null> {
    const result = await this.query<VehicleModel>(
      `SELECT * FROM vehicle_3d_models WHERE id = $1 AND tenant_id = $2 AND is_active = true`,
      [id, tenantId]
    );

    if (result.rows.length === 0) {
      return null;
    }

    // Increment download count
    await this.query(`SELECT increment_model_download_count($1)`, [id]);

    return result.rows[0];
  }
}
