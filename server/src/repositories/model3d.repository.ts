/**
 * Model3D Repository
 * Handles all database operations for 3D vehicle models
 * Security: Parameterized queries only, input validation, no SQL injection
 */

import { Pool, QueryResult } from 'pg';

export interface Model3D {
  id: number;
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
  source?: string;
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
  view_count?: number;
  download_count?: number;
  is_featured?: boolean;
  is_active?: boolean;
  tags?: string[];
  created_at?: Date;
  updated_at?: Date;
}

export interface Model3DSearchParams {
  search?: string;
  vehicleType?: string;
  make?: string;
  source?: string;
  quality?: string;
  limit: number;
  offset: number;
}

export interface Model3DCreateParams {
  name: string;
  description?: string;
  vehicle_type?: string;
  make?: string;
  model?: string;
  year?: number;
  file_url: string;
  file_format?: string;
  file_size_mb?: number;
  source?: string;
  source_id?: string;
  license?: string;
  license_url?: string;
  author?: string;
  author_url?: string;
  thumbnail_url?: string;
  poly_count?: number;
  view_count?: number;
  quality_tier?: string;
  tags?: string[];
}

export class Model3DRepository {
  constructor(private db: Pool) {}

  /**
   * Execute parameterized query with error handling
   */
  private async query<T>(queryText: string, params: any[]): Promise<QueryResult<T>> {
    try {
      return await this.db.query<T>(queryText, params);
    } catch (error) {
      console.error('Database query error:', error);
      throw new Error('Database query failed');
    }
  }

  /**
   * Search models with filtering
   * Security: All parameters are sanitized via parameterized queries
   */
  async searchModels(params: Model3DSearchParams): Promise<{ models: Model3D[]; total: number }> {
    let query = `
      SELECT
        id, name, description, vehicle_type, make, model, year,
        file_url, file_format, file_size_mb, poly_count,
        source, license, thumbnail_url, preview_images,
        quality_tier, has_interior, has_pbr_materials,
        view_count, download_count, is_featured,
        tags, created_at
      FROM vehicle_3d_models
      WHERE is_active = true
    `;

    const queryParams: any[] = [];
    let paramIndex = 1;

    // Full-text search (parameterized)
    if (params.search) {
      query += ` AND to_tsvector('english', coalesce(name, '') || ' ' || coalesce(description, '') || ' ' || coalesce(make, '') || ' ' || coalesce(model, ''))
                 @@ plainto_tsquery('english', $${paramIndex})`;
      queryParams.push(params.search);
      paramIndex++;
    }

    // Filter by vehicle type (parameterized)
    if (params.vehicleType) {
      query += ` AND vehicle_type = $${paramIndex}`;
      queryParams.push(params.vehicleType);
      paramIndex++;
    }

    // Filter by make (parameterized LIKE)
    if (params.make) {
      query += ` AND make ILIKE $${paramIndex}`;
      queryParams.push(`%${params.make}%`);
      paramIndex++;
    }

    // Filter by source (parameterized)
    if (params.source) {
      query += ` AND source = $${paramIndex}`;
      queryParams.push(params.source);
      paramIndex++;
    }

    // Filter by quality (parameterized)
    if (params.quality) {
      query += ` AND quality_tier = $${paramIndex}`;
      queryParams.push(params.quality);
      paramIndex++;
    }

    // Ordering and pagination
    query += ` ORDER BY is_featured DESC, view_count DESC, created_at DESC`;
    query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    queryParams.push(params.limit, params.offset);

    const result = await this.query<Model3D>(query, queryParams);

    // Get total count with same filters
    let countQuery = `SELECT COUNT(*) FROM vehicle_3d_models WHERE is_active = true`;
    const countParams: any[] = [];
    let countParamIndex = 1;

    if (params.search) {
      countQuery += ` AND to_tsvector('english', coalesce(name, '') || ' ' || coalesce(description, '') || ' ' || coalesce(make, '') || ' ' || coalesce(model, ''))
                      @@ plainto_tsquery('english', $${countParamIndex})`;
      countParams.push(params.search);
      countParamIndex++;
    }

    if (params.vehicleType) {
      countQuery += ` AND vehicle_type = $${countParamIndex}`;
      countParams.push(params.vehicleType);
      countParamIndex++;
    }

    if (params.make) {
      countQuery += ` AND make ILIKE $${countParamIndex}`;
      countParams.push(`%${params.make}%`);
      countParamIndex++;
    }

    if (params.source) {
      countQuery += ` AND source = $${countParamIndex}`;
      countParams.push(params.source);
      countParamIndex++;
    }

    if (params.quality) {
      countQuery += ` AND quality_tier = $${countParamIndex}`;
      countParams.push(params.quality);
      countParamIndex++;
    }

    const countResult = await this.query<{ count: string }>(countQuery, countParams);
    const total = parseInt(countResult.rows[0].count);

    return { models: result.rows, total };
  }

  /**
   * Full-text search using stored procedure
   * Security: Uses stored procedure with parameterized inputs
   */
  async fullTextSearch(
    query: string | null,
    vehicleType: string | null,
    make: string | null,
    source: string | null,
    limit: number
  ): Promise<Model3D[]> {
    const result = await this.query<Model3D>(
      `SELECT * FROM search_vehicle_3d_models(, , , , )`,
      [query, vehicleType, make, source, limit]
    );
    return result.rows;
  }

  /**
   * Get featured models
   * Security: Uses view with built-in security
   */
  async getFeaturedModels(limit: number): Promise<Model3D[]> {
    const result = await this.query<Model3D>(
      `SELECT * FROM v_featured_vehicle_3d_models LIMIT `,
      [limit]
    );
    return result.rows;
  }

  /**
   * Get popular models
   * Security: Uses view with built-in security
   */
  async getPopularModels(limit: number): Promise<Model3D[]> {
    const result = await this.query<Model3D>(
      `SELECT * FROM v_popular_vehicle_3d_models LIMIT `,
      [limit]
    );
    return result.rows;
  }

  /**
   * Find model by ID
   * Security: Parameterized query prevents SQL injection
   */
  async findById(id: string): Promise<Model3D | null> {
    const result = await this.query<Model3D>(
      `SELECT * FROM vehicle_3d_models WHERE id =  AND is_active = true`,
      [id]
    );
    return result.rows[0] || null;
  }

  /**
   * Increment view count
   * Security: Uses stored procedure
   */
  async incrementViewCount(id: string): Promise<void> {
    await this.query(`SELECT increment_model_view_count()`, [id]);
  }

  /**
   * Increment download count
   * Security: Uses stored procedure
   */
  async incrementDownloadCount(id: string): Promise<void> {
    await this.query(`SELECT increment_model_download_count()`, [id]);
  }

  /**
   * Create new 3D model
   * Security: All values parameterized, no string concatenation
   */
  async create(data: Model3DCreateParams): Promise<Model3D> {
    const result = await this.query<Model3D>(
      `INSERT INTO vehicle_3d_models (
        name, description, vehicle_type, make, model, year,
        file_url, file_format, file_size_mb, poly_count,
        source, source_id, license, license_url,
        author, author_url, thumbnail_url,
        quality_tier, view_count, tags
      ) VALUES (, , , , , , , , , , , , , , , , , , , )
      RETURNING *`,
      [
        data.name,
        data.description || null,
        data.vehicle_type || null,
        data.make || null,
        data.model || null,
        data.year || null,
        data.file_url,
        data.file_format || null,
        data.file_size_mb || null,
        data.poly_count || null,
        data.source || 'custom',
        data.source_id || null,
        data.license || 'Custom',
        data.license_url || null,
        data.author || null,
        data.author_url || null,
        data.thumbnail_url || null,
        data.quality_tier || 'medium',
        data.view_count || 0,
        data.tags || null,
      ]
    );
    return result.rows[0];
  }

  /**
   * Soft delete model
   * Security: Parameterized query
   */
  async softDelete(id: string): Promise<void> {
    await this.query(
      `UPDATE vehicle_3d_models SET is_active = false WHERE id = `,
      [id]
    );
  }

  /**
   * Assign model to vehicle
   * Security: Parameterized query
   */
  async assignToVehicle(modelId: string, vehicleId: string): Promise<void> {
    await this.query(
      `UPDATE vehicles SET model_3d_id =  WHERE id = `,
      [modelId, vehicleId]
    );
  }
}
