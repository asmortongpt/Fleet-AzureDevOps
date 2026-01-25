
import { Pool } from 'pg'
import { NotFoundError, ValidationError } from '../lib/errors'
import { BaseRepository } from './base/BaseRepository';

export interface Document {
  id: string
  tenantId: string
  name: string
  type: string
  category?: string
  mimeType: string
  fileSize: number
  fileUrl: string
  expiryDate?: Date
  isPublic: boolean
  tags?: string[]
  uploadedById: string
  relatedEntityType?: string
  relatedEntityId?: string
  version?: number
  description?: string
  metadata?: any
  createdAt: Date
  updatedAt: Date
}

/**
 * DocumentsRepository
 * Data access layer for document management
 */
export class DocumentsRepository extends BaseRepository<Document> {
  constructor(pool: Pool) {
    super(pool, 'documents');
  }

  async findById(id: string, tenantId: string): Promise<Document | null> {
    const result = await this.pool.query(
      `SELECT id, tenant_id AS "tenantId", name, type, category, mime_type AS "mimeType", 
              file_size AS "fileSize", file_url AS "fileUrl", expiry_date AS "expiryDate", 
              is_public AS "isPublic", tags, uploaded_by_id AS "uploadedById", 
              related_entity_type AS "relatedEntityType", related_entity_id AS "relatedEntityId", 
              version, description, metadata, created_at AS "createdAt", updated_at AS "updatedAt"
       FROM documents WHERE id = $1 AND tenant_id = $2`,
      [id, tenantId]
    )
    return result.rows[0] || null
  }

  async findByTenant(tenantId: string): Promise<Document[]> {
    const result = await this.pool.query(
      `SELECT id, name, type, category, file_url AS "fileUrl", uploaded_by_id AS "uploadedById", 
              created_at AS "createdAt"
       FROM documents WHERE tenant_id = $1 ORDER BY created_at DESC`,
      [tenantId]
    )
    return result.rows
  }

  async findByEntity(entityType: string, entityId: string, tenantId: string): Promise<Document[]> {
    const result = await this.pool.query(
      `SELECT id, name, type, category, file_url AS "fileUrl", created_at AS "createdAt"
       FROM documents 
       WHERE related_entity_type = $1 AND related_entity_id = $2 AND tenant_id = $3
       ORDER BY created_at DESC`,
      [entityType, entityId, tenantId]
    )
    return result.rows
  }

  async create(data: Partial<Document>, tenantId: string): Promise<Document> {
    if (!data.name || !data.fileUrl || !data.mimeType) {
      throw new ValidationError('Name, file URL, and mime type are required')
    }

    const result = await this.pool.query(
      `INSERT INTO documents (
        tenant_id, name, type, category, mime_type, file_size, file_url, 
        expiry_date, is_public, tags, uploaded_by_id, related_entity_type, 
        related_entity_id, version, description
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      RETURNING id, name, type, file_url AS "fileUrl"`,
      [
        tenantId,
        data.name,
        data.type || 'generic',
        data.category || null,
        data.mimeType,
        data.fileSize || 0,
        data.fileUrl,
        data.expiryDate || null,
        data.isPublic ?? false,
        data.tags || [],
        data.uploadedById,
        data.relatedEntityType || null,
        data.relatedEntityId || null,
        data.version || 1,
        data.description || null
      ]
    )
    return result.rows[0]
  }

  async update(id: string, data: Partial<Document>, tenantId: string): Promise<Document> {
    const existing = await this.findById(id, tenantId)
    if (!existing) {
      throw new NotFoundError('Document')
    }

    const result = await this.pool.query(
      `UPDATE documents 
       SET name = COALESCE($1, name),
           type = COALESCE($2, type),
           category = COALESCE($3, category),
           description = COALESCE($4, description),
           updated_at = NOW()
       WHERE id = $5 AND tenant_id = $6
       RETURNING id, name, type, file_url AS "fileUrl"`,
      [
        data.name,
        data.type,
        data.category,
        data.description,
        id,
        tenantId
      ]
    )
    return result.rows[0]
  }

  async delete(id: string, tenantId: string): Promise<boolean> {
    const result = await this.pool.query(
      'DELETE FROM documents WHERE id = $1 AND tenant_id = $2',
      [id, tenantId]
    )
    return (result.rowCount ?? 0) > 0
  }
}
