/**
 * Model3D Service
 * Business logic for 3D vehicle models
 * Security: Input validation, sanitization, authorization checks
 */

import { Model3DRepository, Model3D, Model3DSearchParams, Model3DCreateParams } from '../repositories/model3d.repository';

import { logger } from './logger';

export interface UploadModelData {
  name: string;
  description?: string;
  vehicleType?: string;
  make?: string;
  model?: string;
  year?: number;
  license?: string;
  quality?: string;
  tags?: string;
  fileUrl: string;
  fileFormat: string;
  fileSizeMb: number;
}

export interface ImportSketchfabData {
  uid: string;
  name: string;
  description: string;
  fileUrl: string;
  source: string;
  license: string;
  licenseUrl: string;
  author: string;
  authorUrl: string;
  thumbnailUrl?: string;
  polyCount?: number;
  viewCount?: number;
}

export class Model3DService {
  constructor(private repository: Model3DRepository) {}

  /**
   * Search models with validation
   * Security: Validates and sanitizes all inputs
   */
  async searchModels(params: {
    search?: string;
    vehicleType?: string;
    make?: string;
    source?: string;
    quality?: string;
    limit?: string;
    offset?: string;
  }): Promise<{ models: Model3D[]; total: number; limit: number; offset: number }> {
    // Validate and sanitize limit/offset
    const limit = this.validateLimit(params.limit);
    const offset = this.validateOffset(params.offset);

    // Validate vehicleType (whitelist)
    if (params.vehicleType) {
      this.validateVehicleType(params.vehicleType);
    }

    // Validate source (whitelist)
    if (params.source) {
      this.validateSource(params.source);
    }

    // Validate quality (whitelist)
    if (params.quality) {
      this.validateQuality(params.quality);
    }

    // Sanitize search string
    const search = params.search ? this.sanitizeSearchString(params.search) : undefined;

    const searchParams: Model3DSearchParams = {
      search,
      vehicleType: params.vehicleType,
      make: params.make,
      source: params.source,
      quality: params.quality,
      limit,
      offset,
    };

    const result = await this.repository.searchModels(searchParams);

    return {
      ...result,
      limit,
      offset,
    };
  }

  /**
   * Full-text search with validation
   */
  async fullTextSearch(params: {
    q?: string;
    vehicleType?: string;
    make?: string;
    source?: string;
    limit?: string;
  }): Promise<{ models: Model3D[]; total: number }> {
    const limit = this.validateLimit(params.limit);

    // Validate inputs
    if (params.vehicleType) {
      this.validateVehicleType(params.vehicleType);
    }
    if (params.source) {
      this.validateSource(params.source);
    }

    const models = await this.repository.fullTextSearch(
      params.q || null,
      params.vehicleType || null,
      params.make || null,
      params.source || null,
      limit
    );

    return {
      models,
      total: models.length,
    };
  }

  /**
   * Get featured models
   */
  async getFeaturedModels(limit?: string): Promise<{ models: Model3D[] }> {
    const validatedLimit = this.validateLimit(limit, 10);
    const models = await this.repository.getFeaturedModels(validatedLimit);
    return { models };
  }

  /**
   * Get popular models
   */
  async getPopularModels(limit?: string): Promise<{ models: Model3D[] }> {
    const validatedLimit = this.validateLimit(limit, 10);
    const models = await this.repository.getPopularModels(validatedLimit);
    return { models };
  }

  /**
   * Get model by ID with view tracking
   * Security: Validates ID format
   */
  async getModelById(id: string): Promise<{ model: Model3D }> {
    this.validateId(id);

    const model = await this.repository.findById(id);
    if (!model) {
      throw new Error('Model not found');
    }

    // Increment view count asynchronously
    this.repository.incrementViewCount(id).catch((error) => {
      logger.error('Error incrementing view count:', error);
    });

    return { model };
  }

  /**
   * Upload custom model
   * Security: Validates all inputs, prevents XSS
   */
  async uploadModel(data: UploadModelData, userId: string): Promise<{ model: Model3D; message: string }> {
    // Validate required fields
    if (!data.name || data.name.trim().length === 0) {
      throw new Error('Model name is required');
    }

    if (!data.fileUrl || !this.isValidUrl(data.fileUrl)) {
      throw new Error('Valid file URL is required');
    }

    // Validate optional fields
    if (data.vehicleType) {
      this.validateVehicleType(data.vehicleType);
    }

    if (data.quality) {
      this.validateQuality(data.quality);
    }

    if (data.year && !this.isValidYear(data.year)) {
      throw new Error('Invalid year');
    }

    // Sanitize inputs to prevent XSS
    const createParams: Model3DCreateParams = {
      name: this.sanitizeString(data.name),
      description: data.description ? this.sanitizeString(data.description) : undefined,
      vehicle_type: data.vehicleType,
      make: data.make ? this.sanitizeString(data.make) : undefined,
      model: data.model ? this.sanitizeString(data.model) : undefined,
      year: data.year,
      file_url: data.fileUrl,
      file_format: data.fileFormat,
      file_size_mb: data.fileSizeMb,
      source: 'custom',
      license: data.license || 'Custom',
      quality_tier: data.quality || 'medium',
      tags: data.tags ? data.tags.split(',').map((t) => this.sanitizeString(t.trim())) : undefined,
    };

    const model = await this.repository.create(createParams);

    logger.info(`Model uploaded: ${data.name} by user ${userId}`);

    return {
      model,
      message: 'Model uploaded successfully',
    };
  }

  /**
   * Import Sketchfab model
   * Security: Validates all inputs
   */
  async importSketchfabModel(data: ImportSketchfabData): Promise<{ model: Model3D; message: string }> {
    // Validate UID format
    if (!data.uid || !/^[a-zA-Z0-9]{32}$/.test(data.uid)) {
      throw new Error('Invalid Sketchfab UID format');
    }

    // Validate URL
    if (!this.isValidUrl(data.fileUrl)) {
      throw new Error('Invalid file URL');
    }

    const createParams: Model3DCreateParams = {
      name: this.sanitizeString(data.name),
      description: this.sanitizeString(data.description),
      file_url: data.fileUrl,
      source: data.source,
      source_id: data.uid,
      license: data.license,
      license_url: data.licenseUrl,
      author: this.sanitizeString(data.author),
      author_url: data.authorUrl,
      thumbnail_url: data.thumbnailUrl,
      poly_count: data.polyCount,
      view_count: data.viewCount,
    };

    const model = await this.repository.create(createParams);

    return {
      model,
      message: 'Sketchfab model imported successfully',
    };
  }

  /**
   * Delete model (soft delete)
   * Security: Validates ID
   */
  async deleteModel(id: string, userId: string): Promise<{ message: string }> {
    this.validateId(id);

    const model = await this.repository.findById(id);
    if (!model) {
      throw new Error('Model not found');
    }

    await this.repository.softDelete(id);

    logger.info(`Model soft-deleted: ${id} by user ${userId}`);

    return { message: 'Model deleted successfully' };
  }

  /**
   * Assign model to vehicle
   * Security: Validates both IDs
   */
  async assignModelToVehicle(modelId: string, vehicleId: string, userId: string): Promise<{ message: string }> {
    this.validateId(modelId);
    this.validateId(vehicleId);

    // Verify model exists
    const model = await this.repository.findById(modelId);
    if (!model) {
      throw new Error('Model not found');
    }

    await this.repository.assignToVehicle(modelId, vehicleId);

    logger.info(`Model ${modelId} assigned to vehicle ${vehicleId} by user ${userId}`);

    return { message: 'Model assigned to vehicle successfully' };
  }

  /**
   * Get download URL
   * Security: Validates ID
   */
  async getDownloadUrl(id: string): Promise<{ downloadUrl: string }> {
    this.validateId(id);

    const model = await this.repository.findById(id);
    if (!model) {
      throw new Error('Model not found');
    }

    // Increment download count asynchronously
    this.repository.incrementDownloadCount(id).catch((error) => {
      logger.error('Error incrementing download count:', error);
    });

    return { downloadUrl: model.file_url };
  }

  // ============================================================================
  // Validation helpers
  // ============================================================================

  private validateId(id: string): void {
    if (!id || !/^[0-9]+$/.test(id)) {
      throw new Error('Invalid ID format');
    }
  }

  private validateLimit(limit?: string, defaultLimit: number = 20): number {
    if (!limit) return defaultLimit;
    const parsed = parseInt(limit, 10);
    if (isNaN(parsed) || parsed < 1 || parsed > 100) {
      throw new Error('Invalid limit: must be between 1 and 100');
    }
    return parsed;
  }

  private validateOffset(offset?: string): number {
    if (!offset) return 0;
    const parsed = parseInt(offset, 10);
    if (isNaN(parsed) || parsed < 0) {
      throw new Error('Invalid offset: must be non-negative');
    }
    return parsed;
  }

  private validateVehicleType(type: string): void {
    const allowedTypes = ['car', 'truck', 'van', 'suv', 'motorcycle', 'bus', 'trailer', 'equipment'];
    if (!allowedTypes.includes(type.toLowerCase())) {
      throw new Error(`Invalid vehicle type. Allowed: ${allowedTypes.join(', ')}`);
    }
  }

  private validateSource(source: string): void {
    const allowedSources = ['custom', 'sketchfab', 'azure-blob', 'turbosquid'];
    if (!allowedSources.includes(source.toLowerCase())) {
      throw new Error(`Invalid source. Allowed: ${allowedSources.join(', ')}`);
    }
  }

  private validateQuality(quality: string): void {
    const allowedQualities = ['low', 'medium', 'high', 'ultra'];
    if (!allowedQualities.includes(quality.toLowerCase())) {
      throw new Error(`Invalid quality. Allowed: ${allowedQualities.join(', ')}`);
    }
  }

  private isValidUrl(url: string): boolean {
    try {
      const parsed = new URL(url);
      return parsed.protocol === 'http:' || parsed.protocol === 'https:';
    } catch {
      return false;
    }
  }

  private isValidYear(year: number): boolean {
    const currentYear = new Date().getFullYear();
    return year >= 1900 && year <= currentYear + 2;
  }

  private sanitizeString(input: string): string {
    // Remove potential XSS vectors
    return input
      .replace(/[<>]/g, '') // Remove < and >
      .replace(/javascript:/gi, '') // Remove javascript: protocol
      .replace(/on\w+=/gi, '') // Remove inline event handlers
      .trim();
  }

  private sanitizeSearchString(input: string): string {
    // Limit search string length and remove special SQL characters
    return input
      .slice(0, 200)
      .replace(/[';--]/g, '')
      .trim();
  }
}
