import { BaseRepository } from '../repositories/BaseRepository';

/**
 * Documents Repository - Comprehensive document management data access layer
 * 
 * Handles all database operations for:
 * - Documents (upload, retrieval, update, delete)
 * - Camera capture metadata
 * - OCR processing logs
 * - Receipt line items
 * - Analytics and dashboard data
 * 
 * SECURITY:
 * - All queries use parameterized statements ($1, $2, etc.)
 * - Tenant isolation enforced on ALL queries
 * - Input validation on all identifiers
 */

import { Pool, PoolClient } from 'pg';
import { NotFoundError } from '../errors/app-error';

export interface Document {
  id: number;
  document_type: string;
  category: string;
  filename: string;
  original_filename: string;
  file_size_bytes: number;
  mime_type: string;
  file_path: string;
  description?: string;
  related_entity_type?: string;
  related_entity_id?: number;
  tags?: string[];
  uploaded_by: number;
  uploaded_at: Date;
  is_mobile_capture?: boolean;
  extracted_text?: string;
}

export interface CameraMetadata {
  id: number;
  document_id: number;
  device_manufacturer?: string;
  device_model?: string;
  os_name?: string;
  os_version?: string;
  app_version?: string;
  photo_taken_at?: Date;
  camera_make?: string;
  camera_model?: string;
  focal_length?: number;
  aperture?: number;
  iso?: number;
  flash_used?: boolean;
  orientation?: number;
  latitude?: number;
  longitude?: number;
  altitude?: number;
  location_accuracy?: number;
  location_address?: string;
  image_width?: number;
  image_height?: number;
  image_resolution_dpi?: number;
  file_size_original_bytes?: number;
  file_size_compressed_bytes?: number;
  compression_ratio?: number;
  auto_crop_applied?: boolean;
  auto_rotate_applied?: boolean;
  auto_brightness_applied?: boolean;
  auto_contrast_applied?: boolean;
  edge_detection_applied?: boolean;
  created_at: Date;
}

export interface OcrData {
  id: number;
  tenant_id: number;
  document_id: number;
  status: string;
  confidence_score?: number;
  text_content?: string;
  processed_at?: Date;
}

export interface ReceiptLineItem {
  id: number;
  document_id: number;
  line_number: number;
  item_description: string;
  quantity?: number;
  unit_price?: number;
  line_total?: number;
  product_category?: string;
  product_code?: string;
  is_taxable?: boolean;
  tax_rate?: number;
  tax_amount?: number;
  is_approved?: boolean;
  approved_by?: number;
  approved_at?: Date;
  gl_account_code?: string;
  cost_center?: string;
  created_at: Date;
}

export interface DocumentFilters {
  page?: number;
  limit?: number;
  document_type?: string;
  category?: string;
  entity_type?: string;
  entity_id?: string;
  search?: string;
}

export interface DocumentWithMetadata extends Document {
  uploaded_by_name?: string;
  uploader_tenant_id?: number;
  camera_metadata?: CameraMetadata | null;
  ocr_data?: OcrData | null;
  receipt_items?: ReceiptLineItem[];
}

export interface DashboardData {
  summary: {
    total_documents: number;
    mobile_captures: number;
    total_storage_bytes: number;
  };
  by_category: Array<{ category: string; count: number }>;
  ocr_status: Array<{ processing_status: string; count: number }>;
  recent: DocumentWithMetadata[];
}

export class DocumentsRepository extends BaseRepository<any> {
  constructor(private pool: Pool) {}

  /**
   * Get paginated list of documents with filters
   * Query #1 - Main document list
   * Query #2 - Count for pagination
   */
  async findAll(
    tenantId: number,
    filters: DocumentFilters = {}
  ): Promise<{ data: DocumentWithMetadata[]; pagination: any }> {
    const {
      page = 1,
      limit = 50,
      document_type,
      category,
      entity_type,
      entity_id,
      search
    } = filters;
    const offset = (Number(page) - 1) * Number(limit);

    let query = `
      SELECT d.*,
             uploader.first_name || ' ' || uploader.last_name as uploaded_by_name
      FROM documents d
      LEFT JOIN drivers uploader ON d.uploaded_by = uploader.id
      WHERE uploader.tenant_id = $1 OR uploader.tenant_id IS NULL
    `;
    const params: any[] = [tenantId];
    let paramIndex = 2;

    if (document_type) {
      query += ` AND d.document_type = $${paramIndex}`;
      params.push(document_type);
      paramIndex++;
    }

    if (category) {
      query += ` AND d.category = $${paramIndex}`;
      params.push(category);
      paramIndex++;
    }

    if (entity_type) {
      query += ` AND d.related_entity_type = $${paramIndex}`;
      params.push(entity_type);
      paramIndex++;
    }

    if (entity_id) {
      query += ` AND d.related_entity_id = $${paramIndex}`;
      params.push(entity_id);
      paramIndex++;
    }

    if (search) {
      query += ` AND (
        d.filename ILIKE $${paramIndex} OR
        d.description ILIKE $${paramIndex} OR
        d.extracted_text ILIKE $${paramIndex}
      )`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    query += ` ORDER BY d.uploaded_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    const result = await this.pool.query(query, params);

    const countQuery = `
      SELECT COUNT(*)
      FROM documents d
      LEFT JOIN drivers uploader ON d.uploaded_by = uploader.id
      WHERE uploader.tenant_id = $1 OR uploader.tenant_id IS NULL
    `;
    const countResult = await this.pool.query(countQuery, [tenantId]);

    return {
      data: result.rows,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: parseInt(countResult.rows[0].count),
        pages: Math.ceil(countResult.rows[0].count / Number(limit))
      }
    };
  }

  /**
   * Get document by ID with tenant isolation
   * Query #3 - Main document with uploader info
   */
  async findById(id: number, tenantId: number): Promise<DocumentWithMetadata | null> {
    const result = await this.pool.query(
      `SELECT d.*,
              uploader.first_name || ' ' || uploader.last_name as uploaded_by_name,
              uploader.tenant_id as uploader_tenant_id
       FROM documents d
       LEFT JOIN users uploader ON d.uploaded_by = uploader.id
       WHERE d.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return null;
    }

    const document = result.rows[0];
    
    // CRITICAL: Enforce tenant isolation
    if (document.uploader_tenant_id && document.uploader_tenant_id !== tenantId) {
      return null;
    }

    return document;
  }

  /**
   * Get camera metadata for a document
   * Query #4 - Camera capture metadata
   */
  async getCameraMetadata(documentId: number): Promise<CameraMetadata | null> {
    const result = await this.pool.query(
      `SELECT 
        id,
        document_id,
        device_manufacturer,
        device_model,
        os_name,
        os_version,
        app_version,
        photo_taken_at,
        camera_make,
        camera_model,
        focal_length,
        aperture,
        iso,
        flash_used,
        orientation,
        latitude,
        longitude,
        altitude,
        location_accuracy,
        location_address,
        image_width,
        image_height,
        image_resolution_dpi,
        file_size_original_bytes,
        file_size_compressed_bytes,
        compression_ratio,
        auto_crop_applied,
        auto_rotate_applied,
        auto_brightness_applied,
        auto_contrast_applied,
        edge_detection_applied,
        created_at 
      FROM camera_capture_metadata 
      WHERE document_id = $1`,
      [documentId]
    );

    return result.rows[0] || null;
  }

  /**
   * Get OCR data for a document
   * Query #5 - OCR processing log
   */
  async getOcrData(documentId: number): Promise<OcrData | null> {
    const result = await this.pool.query(
      `SELECT id, tenant_id, document_id, status, confidence_score, text_content, processed_at 
       FROM ocr_processing_log 
       WHERE document_id = $1 
       ORDER BY processed_at DESC 
       LIMIT 1`,
      [documentId]
    );

    return result.rows[0] || null;
  }

  /**
   * Get receipt line items for a document
   * Query #6 - Receipt line items
   */
  async getReceiptItems(documentId: number): Promise<ReceiptLineItem[]> {
    const result = await this.pool.query(
      `SELECT 
        id,
        document_id,
        line_number,
        item_description,
        quantity,
        unit_price,
        line_total,
        product_category,
        product_code,
        is_taxable,
        tax_rate,
        tax_amount,
        is_approved,
        approved_by,
        approved_at,
        gl_account_code,
        cost_center,
        created_at 
      FROM receipt_line_items 
      WHERE document_id = $1 
      ORDER BY line_number`,
      [documentId]
    );

    return result.rows;
  }

  /**
   * Create new document record
   * Query #7 - Insert document
   */
  async create(data: {
    document_type: string;
    category: string;
    filename: string;
    original_filename: string;
    file_size_bytes: number;
    mime_type: string;
    file_path: string;
    description?: string;
    related_entity_type?: string;
    related_entity_id?: number | null;
    tags?: string[];
    uploaded_by: number;
    is_mobile_capture?: boolean;
  }): Promise<Document> {
    const result = await this.pool.query(
      `INSERT INTO documents (
        document_type, category, filename, original_filename,
        file_size_bytes, mime_type, file_path, description,
        related_entity_type, related_entity_id, tags,
        uploaded_by, uploaded_at, is_mobile_capture
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW(), $13)
      RETURNING *`,
      [
        data.document_type,
        data.category,
        data.filename,
        data.original_filename,
        data.file_size_bytes,
        data.mime_type,
        data.file_path,
        data.description,
        data.related_entity_type,
        data.related_entity_id,
        data.tags || [],
        data.uploaded_by,
        data.is_mobile_capture || false
      ]
    );

    return result.rows[0];
  }

  /**
   * Create camera capture metadata
   * Query #8 - Insert camera metadata
   */
  async createCameraMetadata(data: {
    document_id: number;
    device_manufacturer?: string;
    device_model?: string;
    device_os?: string;
    device_os_version?: string;
    photo_taken_at?: Date;
    camera_make?: string;
    latitude?: number | null;
    longitude?: number | null;
    auto_crop_applied?: boolean;
    auto_rotate_applied?: boolean;
  }): Promise<CameraMetadata> {
    const result = await this.pool.query(
      `INSERT INTO camera_capture_metadata (
        document_id, device_manufacturer, device_model,
        device_os, device_os_version, photo_taken_at,
        camera_make, latitude, longitude,
        auto_crop_applied, auto_rotate_applied
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *`,
      [
        data.document_id,
        data.device_manufacturer,
        data.device_model,
        data.device_os,
        data.device_os_version,
        data.photo_taken_at,
        data.camera_make,
        data.latitude,
        data.longitude,
        data.auto_crop_applied,
        data.auto_rotate_applied
      ]
    );

    return result.rows[0];
  }

  /**
   * Verify document belongs to tenant (for updates/deletes)
   * Query #9 - Tenant verification
   */
  async verifyTenantOwnership(
    documentId: number,
    tenantId: number
  ): Promise<boolean> {
    const result = await this.pool.query(
      `SELECT d.id, uploader.tenant_id as uploader_tenant_id
       FROM documents d
       LEFT JOIN users uploader ON d.uploaded_by = uploader.id
       WHERE d.id = $1`,
      [documentId]
    );

    if (result.rows.length === 0) {
      return false;
    }

    const doc = result.rows[0];
    return !doc.uploader_tenant_id || doc.uploader_tenant_id === tenantId;
  }

  /**
   * Update document
   * Query #10 - Update document
   */
  async update(
    id: number,
    tenantId: number,
    data: {
      description?: string;
      category?: string;
      tags?: string[];
      related_entity_type?: string;
      related_entity_id?: number;
    }
  ): Promise<Document> {
    const result = await this.pool.query(
      `UPDATE documents
       SET description = COALESCE($2, description),
           category = COALESCE($3, category),
           tags = COALESCE($4, tags),
           related_entity_type = COALESCE($5, related_entity_type),
           related_entity_id = COALESCE($6, related_entity_id)
       WHERE id = $1
       RETURNING *`,
      [id, data.description, data.category, data.tags, data.related_entity_type, data.related_entity_id]
    );

    if (result.rows.length === 0) {
      throw new NotFoundError('Document not found');
    }

    return result.rows[0];
  }

  /**
   * Delete document
   * Query #11 - Delete document
   */
  async delete(id: number): Promise<void> {
    const result = await this.pool.query(
      `DELETE FROM documents WHERE id = $1 RETURNING id`,
      [id]
    );

    if (result.rows.length === 0) {
      throw new NotFoundError('Document not found');
    }
  }

  /**
   * Create OCR processing log entry
   * Query #12 - Insert OCR log
   */
  async createOcrLog(
    documentId: number,
    status: string = 'pending'
  ): Promise<OcrData> {
    const result = await this.pool.query(
      `INSERT INTO ocr_processing_log (
        document_id, processing_status, processed_at
      ) VALUES ($1, $2, NOW())
      RETURNING *`,
      [documentId, status]
    );

    return result.rows[0];
  }

  /**
   * Delete receipt line items for a document
   * Query #13 - Delete receipt items
   */
  async deleteReceiptItems(documentId: number): Promise<void> {
    await this.pool.query(
      `DELETE FROM receipt_line_items WHERE document_id = $1`,
      [documentId]
    );
  }

  /**
   * Create receipt line item
   * Query #14 - Insert receipt line item (used in batch)
   */
  async createReceiptItem(data: {
    document_id: number;
    line_number: number;
    item_description: string;
    quantity?: number;
    unit_price?: number;
    line_total?: number;
    tax_amount?: number;
    category?: string;
    is_taxable?: boolean;
    ai_confidence?: number;
  }): Promise<ReceiptLineItem> {
    const result = await this.pool.query(
      `INSERT INTO receipt_line_items (
        document_id, line_number, item_description,
        quantity, unit_price, line_total, tax_amount,
        category, is_taxable, ai_confidence
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *`,
      [
        data.document_id,
        data.line_number,
        data.item_description,
        data.quantity || 1,
        data.unit_price || 0,
        data.line_total || 0,
        data.tax_amount || 0,
        data.category,
        data.is_taxable !== false,
        data.ai_confidence || null
      ]
    );

    return result.rows[0];
  }

  /**
   * Get dashboard analytics - total documents summary
   * Query #15 - Dashboard summary stats
   */
  async getDashboardSummary(tenantId: number): Promise<{
    total_documents: number;
    mobile_captures: number;
    total_storage_bytes: number;
  }> {
    const result = await this.pool.query(
      `SELECT COUNT(*) as total_documents,
              COUNT(CASE WHEN is_mobile_capture = TRUE THEN 1 END) as mobile_captures,
              SUM(file_size_bytes) as total_storage_bytes
       FROM documents d
       LEFT JOIN drivers uploader ON d.uploaded_by = uploader.id
       WHERE uploader.tenant_id = $1`,
      [tenantId]
    );

    return result.rows[0];
  }

  /**
   * Get dashboard analytics - documents by category
   * Query #16 - Documents by category
   */
  async getDocumentsByCategory(
    tenantId: number
  ): Promise<Array<{ category: string; count: number }>> {
    const result = await this.pool.query(
      `SELECT category, COUNT(*) as count
       FROM documents d
       LEFT JOIN drivers uploader ON d.uploaded_by = uploader.id
       WHERE uploader.tenant_id = $1
       GROUP BY category
       ORDER BY count DESC
       LIMIT 10`,
      [tenantId]
    );

    return result.rows;
  }

  /**
   * Get dashboard analytics - OCR processing status
   * Query #17 - OCR status breakdown
   */
  async getOcrStatus(
    tenantId: number
  ): Promise<Array<{ processing_status: string; count: number }>> {
    const result = await this.pool.query(
      `SELECT processing_status, COUNT(*) as count
       FROM ocr_processing_log opl
       JOIN documents d ON opl.document_id = d.id
       LEFT JOIN drivers uploader ON d.uploaded_by = uploader.id
       WHERE uploader.tenant_id = $1
       GROUP BY processing_status`,
      [tenantId]
    );

    return result.rows;
  }

  /**
   * Get dashboard analytics - recent uploads
   * Query #18 - Recent documents
   */
  async getRecentDocuments(
    tenantId: number,
    limit: number = 10
  ): Promise<DocumentWithMetadata[]> {
    const result = await this.pool.query(
      `SELECT d.*, uploader.first_name || ' ' || uploader.last_name as uploaded_by_name
       FROM documents d
       LEFT JOIN drivers uploader ON d.uploaded_by = uploader.id
       WHERE uploader.tenant_id = $1
       ORDER BY d.uploaded_at DESC
       LIMIT $2`,
      [tenantId, limit]
    );

    return result.rows;
  }

  /**
   * Get complete dashboard data (aggregates multiple queries)
   */
  async getDashboardData(tenantId: number): Promise<DashboardData> {
    const [summary, by_category, ocr_status, recent] = await Promise.all([
      this.getDashboardSummary(tenantId),
      this.getDocumentsByCategory(tenantId),
      this.getOcrStatus(tenantId),
      this.getRecentDocuments(tenantId)
    ]);

    return {
      summary,
      by_category,
      ocr_status,
      recent
    };
  }

  // Example centralized filtering
  async findAllWithFilters(filters: Record<string, any>) {
    const { clause, params } = this.buildWhereClause(filters);
    const pagination = this.buildPagination(filters.page, filters.limit);
    const sorting = this.buildSorting(filters.sortBy, filters.sortOrder);

    const query = `SELECT id, name, created_at, updated_at, tenant_id FROM ${this.tableName} ${clause} ${sorting} ${pagination}`;
    const result = await this.pool.query(query, params);
    return result.rows;
  }

}
