/**
 * Document Version Service
 * Manages document versioning and version history
 */

import pool from '../config/database'
import {
  DocumentVersion,
  CreateVersionOptions,
  VersionHistory,
  DocumentNotFoundError
} from '../types/document-storage.types'
import { generateFileHash, generateUniqueFileName } from '../utils/document-utils'
import { StorageFactory } from './storage/storage-factory'
import { StorageAdapter } from './storage/storage-adapter.base'
import documentAuditService from './document-audit.service'

export class DocumentVersionService {
  private storageAdapter?: StorageAdapter

  /**
   * Initialize storage adapter
   */
  async initialize(): Promise<void> {
    this.storageAdapter = StorageFactory.createDefault()
    await this.storageAdapter.initialize()
  }

  /**
   * Create a new version of a document
   */
  async createVersion(options: CreateVersionOptions): Promise<DocumentVersion> {
    const client = await pool.connect()

    try {
      await client.query('BEGIN')

      // Get current document
      const docResult = await client.query(
        `SELECT 
      id,
      tenant_id,
      file_name,
      file_type,
      file_size,
      file_url,
      file_hash,
      category_id,
      tags,
      description,
      uploaded_by,
      is_public,
      version_number,
      status,
      metadata,
      extracted_text,
      ocr_status,
      ocr_completed_at,
      embedding_status,
      embedding_completed_at,
      created_at,
      updated_at FROM documents WHERE id = $1',
        [options.documentId]
      )

      if (docResult.rows.length === 0) {
        throw new DocumentNotFoundError(options.documentId)
      }

      const currentDoc = docResult.rows[0]

      // Generate file hash
      const fileHash = generateFileHash(options.file.buffer)

      // Check if this version already exists
      const existingVersion = await client.query(
        `SELECT id FROM document_versions
         WHERE document_id = $1 AND file_hash = $2',
        [options.documentId, fileHash]
      )

      if (existingVersion.rows.length > 0) {
        throw new Error('This version already exists')
      }

      // Get storage adapter
      if (!this.storageAdapter) {
        await this.initialize()
      }

      // Generate new file path
      const fileName = generateUniqueFileName(currentDoc.file_name)
      const filePath = `${currentDoc.tenant_id}/versions/${fileName}`

      // Upload new version
      const fileUrl = await this.storageAdapter!.upload(
        options.file.buffer,
        filePath,
        {
          metadata: options.metadata,
          contentType: currentDoc.file_type
        }
      )

      // Save current version to version history
      await client.query(
        `INSERT INTO document_versions (
          document_id, version_number, file_url, file_size, file_hash,
          uploaded_by, change_notes, metadata
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          options.documentId,
          currentDoc.version_number,
          currentDoc.file_url,
          currentDoc.file_size,
          currentDoc.file_hash,
          currentDoc.uploaded_by,
          'Previous version',
          JSON.stringify(currentDoc.metadata || {})
        ]
      )

      // Update document with new version
      const updatedDoc = await client.query(
        `UPDATE documents
         SET
           file_url = $1,
           file_size = $2,
           file_hash = $3,
           version_number = version_number + 1,
           uploaded_by = $4,
           updated_at = NOW()
         WHERE id = $5
         RETURNING *`,
        [fileUrl, options.file.size, fileHash, options.userId, options.documentId]
      )

      // Create version record for the new version
      const versionResult = await client.query(
        `INSERT INTO document_versions (
          document_id, version_number, file_url, file_size, file_hash,
          uploaded_by, change_notes, metadata
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *`,
        [
          options.documentId,
          updatedDoc.rows[0].version_number,
          fileUrl,
          options.file.size,
          fileHash,
          options.userId,
          options.changeNotes || 'New version',
          JSON.stringify(options.metadata || {})
        ]
      )

      // Log version creation
      await documentAuditService.logDocumentAction(
        currentDoc.tenant_id,
        options.documentId,
        options.userId,
        'create_version',
        {
          newValues: {
            version_number: updatedDoc.rows[0].version_number,
            change_notes: options.changeNotes
          }
        }
      )

      await client.query('COMMIT')

      console.log(`✅ Version created: v${updatedDoc.rows[0].version_number}`)
      return versionResult.rows[0]
    } catch (error) {
      await client.query('ROLLBACK')
      console.error('❌ Failed to create version:', error)
      throw error
    } finally {
      client.release()
    }
  }

  /**
   * Get version history for a document
   */
  async getVersionHistory(documentId: string): Promise<VersionHistory> {
    try {
      // Get current version
      const currentResult = await pool.query(
        `SELECT
          d.id,
          d.id as document_id,
          d.version_number,
          d.file_url,
          d.file_size,
          d.file_hash,
          d.uploaded_by,
          'Current version' as change_notes,
          d.metadata,
          d.updated_at as created_at,
          u.first_name || ' ' || u.last_name as uploaded_by_name
        FROM documents d
        LEFT JOIN users u ON d.uploaded_by = u.id
        WHERE d.id = $1',
        [documentId]
      )

      if (currentResult.rows.length === 0) {
        throw new DocumentNotFoundError(documentId)
      }

      // Get version history
      const historyResult = await pool.query(
        `SELECT
          dv.*,
          u.first_name || ' ' || u.last_name as uploaded_by_name
        FROM document_versions dv
        LEFT JOIN users u ON dv.uploaded_by = u.id
        WHERE dv.document_id = $1
        ORDER BY dv.version_number DESC`,
        [documentId]
      )

      return {
        current: currentResult.rows[0],
        history: historyResult.rows
      }
    } catch (error) {
      console.error('❌ Failed to get version history:', error)
      throw error
    }
  }

  /**
   * Get a specific version
   */
  async getVersion(
    documentId: string,
    versionNumber: number
  ): Promise<DocumentVersion | null> {
    try {
      const result = await pool.query(
        `SELECT
          dv.*,
          u.first_name || ' ' || u.last_name as uploaded_by_name
        FROM document_versions dv
        LEFT JOIN users u ON dv.uploaded_by = u.id
        WHERE dv.document_id = $1 AND dv.version_number = $2',
        [documentId, versionNumber]
      )

      return result.rows[0] || null
    } catch (error) {
      console.error('❌ Failed to get version:', error)
      throw error
    }
  }

  /**
   * Restore a previous version
   */
  async restoreVersion(
    documentId: string,
    versionNumber: number,
    userId: string
  ): Promise<DocumentVersion> {
    const client = await pool.connect()

    try {
      await client.query('BEGIN')

      // Get the version to restore
      const versionResult = await client.query(
        `SELECT id, tenant_id, document_id, version_number, file_path, created_at, created_by FROM document_versions
         WHERE document_id = $1 AND version_number = $2',
        [documentId, versionNumber]
      )

      if (versionResult.rows.length === 0) {
        throw new Error(`Version ${versionNumber} not found`)
      }

      const versionToRestore = versionResult.rows[0]

      // Get current document
      const docResult = await client.query(
        `SELECT 
      id,
      tenant_id,
      file_name,
      file_type,
      file_size,
      file_url,
      file_hash,
      category_id,
      tags,
      description,
      uploaded_by,
      is_public,
      version_number,
      status,
      metadata,
      extracted_text,
      ocr_status,
      ocr_completed_at,
      embedding_status,
      embedding_completed_at,
      created_at,
      updated_at FROM documents WHERE id = $1',
        [documentId]
      )

      const currentDoc = docResult.rows[0]

      // Save current version to history
      await client.query(
        `INSERT INTO document_versions (
          document_id, version_number, file_url, file_size, file_hash,
          uploaded_by, change_notes, metadata
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          documentId,
          currentDoc.version_number,
          currentDoc.file_url,
          currentDoc.file_size,
          currentDoc.file_hash,
          currentDoc.uploaded_by,
          `Before restore to v${versionNumber}`,
          JSON.stringify(currentDoc.metadata || {})
        ]
      )

      // Update document to restored version
      const updatedDoc = await client.query(
        `UPDATE documents
         SET
           file_url = $1,
           file_size = $2,
           file_hash = $3,
           version_number = version_number + 1,
           uploaded_by = $4,
           updated_at = NOW()
         WHERE id = $5
         RETURNING *`,
        [
          versionToRestore.file_url,
          versionToRestore.file_size,
          versionToRestore.file_hash,
          userId,
          documentId
        ]
      )

      // Create version record for restored version
      const newVersionResult = await client.query(
        `INSERT INTO document_versions (
          document_id, version_number, file_url, file_size, file_hash,
          uploaded_by, change_notes, metadata
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *`,
        [
          documentId,
          updatedDoc.rows[0].version_number,
          versionToRestore.file_url,
          versionToRestore.file_size,
          versionToRestore.file_hash,
          userId,
          `Restored from v${versionNumber}`,
          versionToRestore.metadata
        ]
      )

      // Log restoration
      await documentAuditService.logDocumentAction(
        currentDoc.tenant_id,
        documentId,
        userId,
        'restore_version',
        {
          oldValues: { version_number: currentDoc.version_number },
          newValues: {
            version_number: updatedDoc.rows[0].version_number,
            restored_from: versionNumber
          }
        }
      )

      await client.query('COMMIT')

      console.log(`✅ Restored version ${versionNumber}`)
      return newVersionResult.rows[0]
    } catch (error) {
      await client.query('ROLLBACK')
      console.error('❌ Failed to restore version:', error)
      throw error
    } finally {
      client.release()
    }
  }

  /**
   * Download a specific version
   */
  async downloadVersion(
    documentId: string,
    versionNumber: number
  ): Promise<Buffer> {
    try {
      const version = await this.getVersion(documentId, versionNumber)
      if (!version) {
        throw new Error(`Version ${versionNumber} not found`)
      }

      if (!this.storageAdapter) {
        await this.initialize()
      }

      const buffer = await this.storageAdapter!.download(version.file_url)

      console.log(`✅ Downloaded version ${versionNumber}`)
      return buffer
    } catch (error) {
      console.error('❌ Failed to download version:', error)
      throw error
    }
  }

  /**
   * Compare two versions
   */
  async compareVersions(
    documentId: string,
    version1: number,
    version2: number
  ): Promise<{
    version1: DocumentVersion
    version2: DocumentVersion
    differences: {
      size_diff: number
      hash_different: boolean
      time_diff_seconds: number
    }
  }> {
    try {
      const [v1, v2] = await Promise.all([
        this.getVersion(documentId, version1),
        this.getVersion(documentId, version2)
      ])

      if (!v1 || !v2) {
        throw new Error('One or both versions not found')
      }

      const timeDiff =
        (new Date(v2.created_at).getTime() - new Date(v1.created_at).getTime()) /
        1000

      return {
        version1: v1,
        version2: v2,
        differences: {
          size_diff: v2.file_size - v1.file_size,
          hash_different: v1.file_hash !== v2.file_hash,
          time_diff_seconds: timeDiff
        }
      }
    } catch (error) {
      console.error('❌ Failed to compare versions:', error)
      throw error
    }
  }

  /**
   * Delete old versions (keep only N recent versions)
   */
  async pruneVersionHistory(
    documentId: string,
    keepVersions: number = 10
  ): Promise<number> {
    const client = await pool.connect()

    try {
      await client.query('BEGIN')

      // Get versions to delete
      const versionsToDelete = await client.query(
        `SELECT dv.id, dv.file_url
         FROM document_versions dv
         WHERE dv.document_id = $1
         ORDER BY dv.version_number DESC
         OFFSET $2',
        [documentId, keepVersions]
      )

      if (versionsToDelete.rows.length === 0) {
        await client.query('COMMIT')
        return 0
      }

      // Delete from storage
      if (!this.storageAdapter) {
        await this.initialize()
      }

      for (const version of versionsToDelete.rows) {
        try {
          await this.storageAdapter!.delete(version.file_url)
        } catch (error) {
          console.warn(`⚠️  Failed to delete version file: ${version.file_url}`)
        }
      }

      // Delete from database
      const versionIds = versionsToDelete.rows.map(v => v.id)
      await client.query(
        `DELETE FROM document_versions WHERE id = ANY($1)`,
        [versionIds]
      )

      await client.query('COMMIT')

      console.log(`✅ Pruned ${versionsToDelete.rows.length} old versions`)
      return versionsToDelete.rows.length
    } catch (error) {
      await client.query('ROLLBACK')
      console.error('❌ Failed to prune version history:', error)
      throw error
    } finally {
      client.release()
    }
  }

  /**
   * Get version statistics
   */
  async getVersionStatistics(documentId: string): Promise<{
    total_versions: number
    total_size_bytes: number
    oldest_version: Date | null
    newest_version: Date | null
    average_size_bytes: number
  }> {
    try {
      const result = await pool.query(
        `SELECT
          COUNT(*) as total_versions,
          SUM(file_size) as total_size_bytes,
          MIN(created_at) as oldest_version,
          MAX(created_at) as newest_version,
          AVG(file_size) as average_size_bytes
        FROM document_versions
        WHERE document_id = $1',
        [documentId]
      )

      const stats = result.rows[0]

      return {
        total_versions: parseInt(stats.total_versions) || 0,
        total_size_bytes: parseInt(stats.total_size_bytes) || 0,
        oldest_version: stats.oldest_version,
        newest_version: stats.newest_version,
        average_size_bytes: parseFloat(stats.average_size_bytes) || 0
      }
    } catch (error) {
      console.error('❌ Failed to get version statistics:', error)
      throw error
    }
  }
}

export default new DocumentVersionService()
