import { injectable } from 'inversify';

import { pool } from '../db';

import { BaseRepository } from './base.repository';

export interface Attachment {
  id: number;
  communication_id?: number;
  file_name: string;
  file_path: string;
  file_type: string;
  file_size: number;
  blob_url?: string;
  mime_type?: string;
  original_filename?: string;
  file_size_bytes?: number;
  is_scanned?: boolean;
  scan_result?: string;
  virus_scan_status?: string;
  download_count?: number;
  last_accessed_at?: Date;
  thumbnail_url?: string;
  tenant_id: number;
  created_at: Date;
  updated_at?: Date;
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
    super('communication_attachments');
  }

  /**
   * Update virus scan status after scanning
   */
  async updateVirusScanStatus(
    id: number,
    scanResult: string,
    virusScanStatus: string
  ): Promise<void> {
    await this.pool.query(
      `UPDATE ${this.tableName}
       SET is_scanned = true,
           scan_result = $1,
           virus_scan_status = $2,
           updated_at = NOW()
       WHERE id = $3`,
      [scanResult, virusScanStatus, id]
    );
  }

  /**
   * Get attachment with communication details
   */
  async findByIdWithCommunication(
    id: number,
    tenantId: number
  ): Promise<Attachment | null> {
    const result = await this.pool.query(
      `SELECT
        ca.*,
        c.subject as communication_subject,
        c.communication_type
      FROM ${this.tableName} ca
      LEFT JOIN communications c ON ca.communication_id = c.id
      WHERE ca.id = $1 AND ca.tenant_id = $2`,
      [id, tenantId]
    );
    return result.rows[0] || null;
  }

  /**
   * Get attachment blob URL
   */
  async getBlobUrl(id: number, tenantId: number): Promise<string | null> {
    const result = await this.pool.query(
      `SELECT blob_url FROM ${this.tableName}
       WHERE id = $1 AND tenant_id = $2`,
      [id, tenantId]
    );
    return result.rows[0]?.blob_url || null;
  }

  /**
   * Get attachment metadata for download
   */
  async getDownloadMetadata(
    id: number,
    tenantId: number
  ): Promise<{
    id: number;
    communication_id?: number;
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
        file_name,
        file_path,
        file_type,
        file_size,
        mime_type,
        original_filename,
        blob_url,
        created_at
      FROM ${this.tableName}
      WHERE id = $1 AND tenant_id = $2`,
      [id, tenantId]
    );
    return result.rows[0] || null;
  }

  /**
   * Update download count and last accessed time
   */
  async incrementDownloadCount(id: number): Promise<void> {
    await this.pool.query(
      `UPDATE ${this.tableName}
       SET download_count = COALESCE(download_count, 0) + 1,
           last_accessed_at = NOW()
       WHERE id = $1`,
      [id]
    );
  }

  /**
   * Find attachments with filtering and pagination
   */
  async findWithFilters(
    tenantId: number,
    filters: AttachmentFilter
  ): Promise<Attachment[]> {
    let query = `
      SELECT
        ca.*,
        c.subject as communication_subject
      FROM ${this.tableName} ca
      LEFT JOIN communications c ON ca.communication_id = c.id
      WHERE ca.tenant_id = $1
    `;

    const params: any[] = [tenantId];
    let paramIndex = 2;

    if (filters.communicationId) {
      query += ` AND ca.communication_id = $${paramIndex}`;
      params.push(filters.communicationId);
      paramIndex++;
    }

    if (filters.scanStatus) {
      query += ` AND ca.virus_scan_status = $${paramIndex}`;
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
  async getTotalCount(tenantId: number): Promise<number> {
    const result = await this.pool.query(
      `SELECT COUNT(*) FROM ${this.tableName} WHERE tenant_id = $1`,
      [tenantId]
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
        SUM(file_size_bytes) as total_size_bytes,
        COUNT(CASE WHEN virus_scan_status = 'clean' THEN 1 END) as clean_files,
        COUNT(CASE WHEN virus_scan_status = 'pending' THEN 1 END) as pending_scans,
        COUNT(CASE WHEN virus_scan_status = 'infected' THEN 1 END) as infected_files,
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
        SUM(file_size_bytes) as total_size
      FROM ${this.tableName}
      GROUP BY mime_type
      ORDER BY count DESC
      LIMIT 10
    `);
    return result.rows;
  }

  /**
   * Delete attachment (overrides base to use pool directly)
   */
  async deleteAttachment(id: number, tenantId: number): Promise<boolean> {
    const result = await this.pool.query(
      `DELETE FROM ${this.tableName}
       WHERE id = $1 AND tenant_id = $2`,
      [id, tenantId]
    );
    return (result.rowCount || 0) > 0;
  }

  // Expose pool for BaseRepository
  protected get pool() {
    return pool;
  }
}
