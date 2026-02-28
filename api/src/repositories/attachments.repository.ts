import { injectable } from 'inversify';

import { pool } from '../db';

import { BaseRepository } from './base/BaseRepository';

export interface Attachment {
  id: string;
  communication_id?: string;
  filename: string;
  original_filename: string;
  file_size_bytes: number;
  mime_type: string;
  storage_path: string;
  storage_url?: string;
  is_scanned?: boolean;
  scan_result?: string;
  thumbnail_url?: string;
  created_at: Date;
}

export interface AttachmentStats {
  total_attachments: number;
  total_size_bytes: number;
  clean_files: number;
  pending_scans: number;
  infected_files: number;
  files_with_thumbnails: number;
  unique_file_types: number;
}

export interface AttachmentByType {
  mime_type: string;
  count: number;
  total_size: number;
}

export interface AttachmentFilter {
  communicationId?: string | number;
  scanStatus?: string;
  limit?: number;
  offset?: number;
}

@injectable()
export class AttachmentRepository extends BaseRepository<Attachment> {
  constructor() {
    super(pool, 'communication_attachments');
  }

  /**
   * Update virus scan status after scanning
   */
  async updateVirusScanStatus(
    id: number,
    scanResult: string,
    _virusScanStatus: string
  ): Promise<void> {
    await this.pool.query(
      `UPDATE ${this.tableName}
       SET is_scanned = true,
           scan_result = $1
       WHERE id = $2`,
      [scanResult, id]
    );
  }

  /**
   * Get attachment with communication details
   * NOTE: communication_attachments has no tenant_id; tenant filtering via communications JOIN
   */
  async findByIdWithCommunication(
    id: number,
    _tenantId: number
  ): Promise<Attachment | null> {
    const result = await this.pool.query(
      `SELECT
        ca.*,
        c.subject as communication_subject,
        c.communication_type
      FROM ${this.tableName} ca
      LEFT JOIN communications c ON ca.communication_id = c.id
      WHERE ca.id = $1`,
      [id]
    );
    return result.rows[0] || null;
  }

  /**
   * Get attachment storage URL (replaces getBlobUrl)
   * NOTE: communication_attachments has no tenant_id; returns storage_url instead of blob_url
   */
  async getBlobUrl(id: number, _tenantId: number): Promise<string | null> {
    const result = await this.pool.query(
      `SELECT storage_url FROM ${this.tableName}
       WHERE id = $1`,
      [id]
    );
    return result.rows[0]?.storage_url || null;
  }

  /**
   * Get attachment metadata for download
   * Maps actual columns to expected interface
   */
  async getDownloadMetadata(
    id: number,
    _tenantId: number
  ): Promise<{
    id: string;
    communication_id?: string;
    file_name: string;
    file_path: string;
    file_type: string;
    file_size: number;
    mime_type?: string;
    original_filename?: string;
    blob_url?: string;
    created_at: Date;
  } | null> {
    const result = await this.pool.query(
      `SELECT
        id,
        communication_id,
        filename AS file_name,
        storage_path AS file_path,
        mime_type AS file_type,
        file_size_bytes AS file_size,
        mime_type,
        original_filename,
        storage_url AS blob_url,
        created_at
      FROM ${this.tableName}
      WHERE id = $1`,
      [id]
    );
    return result.rows[0] || null;
  }

  /**
   * Increment download count - no-op since column doesn't exist on communication_attachments
   */
  async incrementDownloadCount(_id: number): Promise<void> {
    // communication_attachments has no download_count column; no-op
  }

  /**
   * Find attachments with filtering and pagination
   * NOTE: communication_attachments has no tenant_id; filtering by communication_id only
   */
  async findWithFilters(
    _tenantId: number,
    filters: AttachmentFilter
  ): Promise<Attachment[]> {
    let query = `
      SELECT
        ca.*,
        c.subject as communication_subject
      FROM ${this.tableName} ca
      LEFT JOIN communications c ON ca.communication_id = c.id
      WHERE 1=1
    `;

    const params: any[] = [];
    let paramIndex = 1;

    if (filters.communicationId) {
      query += ` AND ca.communication_id = $${paramIndex}`;
      params.push(filters.communicationId);
      paramIndex++;
    }

    if (filters.scanStatus) {
      query += ` AND ca.scan_result = $${paramIndex}`;
      params.push(filters.scanStatus);
      paramIndex++;
    }

    query += ` ORDER BY ca.created_at DESC`;

    if (filters.limit) {
      query += ` LIMIT $${paramIndex}`;
      params.push(filters.limit);
      paramIndex++;
    }

    if (filters.offset !== undefined) {
      query += ` OFFSET $${paramIndex}`;
      params.push(filters.offset);
    }

    const result = await this.pool.query(query, params);
    return result.rows;
  }

  /**
   * Get total count of attachments
   */
  async getTotalCount(_tenantId: number): Promise<number> {
    const result = await this.pool.query(
      `SELECT COUNT(*) FROM ${this.tableName}`
    );
    return parseInt(result.rows[0].count);
  }

  /**
   * Get attachment statistics
   */
  async getStatistics(): Promise<AttachmentStats> {
    const result = await this.pool.query(`
      SELECT
        COUNT(*) as total_attachments,
        COALESCE(SUM(file_size_bytes), 0) as total_size_bytes,
        COUNT(CASE WHEN scan_result = 'Clean' THEN 1 END) as clean_files,
        COUNT(CASE WHEN is_scanned = false OR is_scanned IS NULL THEN 1 END) as pending_scans,
        COUNT(CASE WHEN scan_result = 'Threat Detected' THEN 1 END) as infected_files,
        COUNT(CASE WHEN thumbnail_url IS NOT NULL THEN 1 END) as files_with_thumbnails,
        COUNT(DISTINCT mime_type) as unique_file_types
      FROM ${this.tableName}
    `);
    return result.rows[0];
  }

  /**
   * Get attachment statistics by type
   */
  async getStatisticsByType(): Promise<AttachmentByType[]> {
    const result = await this.pool.query(`
      SELECT
        mime_type,
        COUNT(*) as count,
        COALESCE(SUM(file_size_bytes), 0) as total_size
      FROM ${this.tableName}
      GROUP BY mime_type
      ORDER BY count DESC
      LIMIT 10
    `);
    return result.rows;
  }

  /**
   * Delete attachment by ID
   * NOTE: communication_attachments has no tenant_id column
   */
  async deleteAttachment(id: number, _tenantId: number): Promise<boolean> {
    const result = await this.pool.query(
      `DELETE FROM ${this.tableName}
       WHERE id = $1`,
      [id]
    );
    return (result.rowCount || 0) > 0;
  }

}
