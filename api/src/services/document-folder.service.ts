/**
 * Document Folder Service
 * Manages hierarchical folder structure for documents
 */

import pool from '../config/database'
import {
  DocumentFolder,
  FolderWithMetadata,
  FolderContents,
  CreateFolderOptions,
  UpdateFolderOptions,
  FolderNotFoundError,
  InvalidFolderHierarchyError
} from '../types/document-storage.types'
import { validateFolderName } from '../utils/document-utils'
import documentAuditService from './document-audit.service'

export class DocumentFolderService {
  /**
   * Create a new folder
   */
  async createFolder(options: CreateFolderOptions): Promise<DocumentFolder> {
    const client = await pool.connect()

    try {
      await client.query('BEGIN')

      // Validate folder name
      const validation = validateFolderName(options.folder_name)
      if (!validation.valid) {
        throw new Error(validation.error)
      }

      // Check for duplicate folder name in same parent
      const duplicateCheck = await client.query(
        `SELECT id FROM document_folders
         WHERE tenant_id = $1
           AND folder_name = $2
           AND (parent_folder_id = $3 OR ($3 IS NULL AND parent_folder_id IS NULL))
           AND deleted_at IS NULL`,
        [options.tenantId, options.folder_name, options.parent_folder_id || null]
      )

      if (duplicateCheck.rows.length > 0) {
        throw new Error(
          `Folder '${options.folder_name}' already exists in this location`
        )
      }

      // Verify parent folder exists if specified
      if (options.parent_folder_id) {
        const parentCheck = await client.query(
          `SELECT id FROM document_folders
           WHERE id = $1 AND tenant_id = $2 AND deleted_at IS NULL`,
          [options.parent_folder_id, options.tenantId]
        )

        if (parentCheck.rows.length === 0) {
          throw new FolderNotFoundError(options.parent_folder_id)
        }
      }

      // Create folder
      const result = await client.query(
        `INSERT INTO document_folders (
          tenant_id, parent_folder_id, folder_name, description,
          color, icon, metadata, created_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *`,
        [
          options.tenantId,
          options.parent_folder_id || null,
          options.folder_name,
          options.description || null,
          options.color || '#6B7280',
          options.icon || 'Folder',
          JSON.stringify(options.metadata || {}),
          options.userId
        ]
      )

      const folder = result.rows[0]

      // Log creation
      await documentAuditService.logFolderAction(
        options.tenantId,
        folder.id,
        options.userId,
        'create',
        {
          newValues: { folder_name: folder.folder_name, parent_folder_id: folder.parent_folder_id }
        }
      )

      await client.query('COMMIT')

      console.log(`✅ Folder created: ${folder.folder_name}`)
      return folder
    } catch (error) {
      await client.query('ROLLBACK')
      console.error('❌ Failed to create folder:', error)
      throw error
    } finally {
      client.release()
    }
  }

  /**
   * Get folder by ID
   */
  async getFolderById(
    folderId: string,
    tenantId: string
  ): Promise<FolderWithMetadata | null> {
    try {
      const result = await pool.query(
        `SELECT
          df.*,
          (SELECT COUNT(*) FROM document_folders WHERE parent_folder_id = df.id AND deleted_at IS NULL) as subfolder_count,
          (SELECT COUNT(*) FROM documents WHERE parent_folder_id = df.id AND deleted_at IS NULL) as document_count,
          (SELECT SUM(file_size) FROM documents WHERE parent_folder_id = df.id AND deleted_at IS NULL) as total_size
        FROM document_folders df
        WHERE df.id = $1 AND df.tenant_id = $2 AND df.deleted_at IS NULL`,
        [folderId, tenantId]
      )

      if (result.rows.length === 0) {
        return null
      }

      const folder = result.rows[0]

      // Get breadcrumb
      const breadcrumb = await this.getFolderBreadcrumb(folderId)

      return {
        ...folder,
        breadcrumb
      }
    } catch (error) {
      console.error('❌ Failed to get folder:', error)
      throw error
    }
  }

  /**
   * Get folder contents (subfolders and documents)
   */
  async getFolderContents(
    folderId: string,
    tenantId: string
  ): Promise<FolderContents> {
    try {
      // Get folder info
      const folder = await this.getFolderById(folderId, tenantId)
      if (!folder) {
        throw new FolderNotFoundError(folderId)
      }

      // Get subfolders
      const subfoldersResult = await pool.query(
        `SELECT
          df.*,
          (SELECT COUNT(*) FROM document_folders WHERE parent_folder_id = df.id AND deleted_at IS NULL) as subfolder_count,
          (SELECT COUNT(*) FROM documents WHERE parent_folder_id = df.id AND deleted_at IS NULL) as document_count,
          (SELECT SUM(file_size) FROM documents WHERE parent_folder_id = df.id AND deleted_at IS NULL) as total_size
        FROM document_folders df
        WHERE df.parent_folder_id = $1
          AND df.tenant_id = $2
          AND df.deleted_at IS NULL
        ORDER BY df.folder_name ASC`,
        [folderId, tenantId]
      )

      // Get documents
      const documentsResult = await pool.query(
        `SELECT
          d.*,
          dc.category_name,
          dc.color as category_color,
          u.first_name || ' ' || u.last_name as uploaded_by_name
        FROM documents d
        LEFT JOIN document_categories dc ON d.category_id = dc.id
        LEFT JOIN users u ON d.uploaded_by = u.id
        WHERE d.parent_folder_id = $1
          AND d.tenant_id = $2
          AND d.deleted_at IS NULL
        ORDER BY d.created_at DESC`,
        [folderId, tenantId]
      )

      return {
        folder,
        subfolders: subfoldersResult.rows,
        documents: documentsResult.rows,
        breadcrumb: folder.breadcrumb || []
      }
    } catch (error) {
      console.error('❌ Failed to get folder contents:', error)
      throw error
    }
  }

  /**
   * Get root folders for a tenant
   */
  async getRootFolders(tenantId: string): Promise<FolderWithMetadata[]> {
    try {
      const result = await pool.query(
        `SELECT
          df.*,
          (SELECT COUNT(*) FROM document_folders WHERE parent_folder_id = df.id AND deleted_at IS NULL) as subfolder_count,
          (SELECT COUNT(*) FROM documents WHERE parent_folder_id = df.id AND deleted_at IS NULL) as document_count,
          (SELECT SUM(file_size) FROM documents WHERE parent_folder_id = df.id AND deleted_at IS NULL) as total_size
        FROM document_folders df
        WHERE df.tenant_id = $1
          AND df.parent_folder_id IS NULL
          AND df.deleted_at IS NULL
        ORDER BY df.folder_name ASC`,
        [tenantId]
      )

      return result.rows
    } catch (error) {
      console.error('❌ Failed to get root folders:', error)
      throw error
    }
  }

  /**
   * Update folder
   */
  async updateFolder(
    folderId: string,
    tenantId: string,
    userId: string,
    updates: UpdateFolderOptions
  ): Promise<DocumentFolder> {
    const client = await pool.connect()

    try {
      await client.query('BEGIN')

      // Get current folder
      const currentResult = await client.query(
        `SELECT id, tenant_id, parent_id, folder_name, created_at, updated_at FROM document_folders
         WHERE id = $1 AND tenant_id = $2 AND deleted_at IS NULL`,
        [folderId, tenantId]
      )

      if (currentResult.rows.length === 0) {
        throw new FolderNotFoundError(folderId)
      }

      const currentFolder = currentResult.rows[0]

      // Build update query
      const setClauses: string[] = []
      const values: any[] = []
      let paramCount = 1

      if (updates.folder_name !== undefined) {
        const validation = validateFolderName(updates.folder_name)
        if (!validation.valid) {
          throw new Error(validation.error)
        }

        setClauses.push(`folder_name = $${paramCount}`)
        values.push(updates.folder_name)
        paramCount++
      }

      if (updates.description !== undefined) {
        setClauses.push(`description = $${paramCount}`)
        values.push(updates.description)
        paramCount++
      }

      if (updates.color !== undefined) {
        setClauses.push(`color = $${paramCount}`)
        values.push(updates.color)
        paramCount++
      }

      if (updates.icon !== undefined) {
        setClauses.push(`icon = $${paramCount}`)
        values.push(updates.icon)
        paramCount++
      }

      if (updates.metadata !== undefined) {
        setClauses.push(`metadata = $${paramCount}`)
        values.push(JSON.stringify(updates.metadata))
        paramCount++
      }

      if (updates.parent_folder_id !== undefined) {
        // Validate move operation
        if (updates.parent_folder_id === folderId) {
          throw new InvalidFolderHierarchyError('Cannot move folder to itself')
        }

        // Check if target is a descendant
        if (updates.parent_folder_id) {
          const isDescendant = await this.isDescendantOf(
            updates.parent_folder_id,
            folderId
          )
          if (isDescendant) {
            throw new InvalidFolderHierarchyError(
              'Cannot move folder to its own descendant'
            )
          }
        }

        setClauses.push(`parent_folder_id = $${paramCount}`)
        values.push(updates.parent_folder_id)
        paramCount++
      }

      if (setClauses.length === 0) {
        throw new Error('No valid fields to update')
      }

      values.push(folderId, tenantId)

      const result = await client.query(
        `UPDATE document_folders
         SET ${setClauses.join(', ')}, updated_at = NOW()
         WHERE id = $${paramCount} AND tenant_id = $${paramCount + 1}
         RETURNING *`,
        values
      )

      const updatedFolder = result.rows[0]

      // Log update
      await documentAuditService.logFolderAction(
        tenantId,
        folderId,
        userId,
        'update',
        {
          oldValues: currentFolder,
          newValues: updates
        }
      )

      await client.query('COMMIT')

      console.log(`✅ Folder updated: ${updatedFolder.folder_name}`)
      return updatedFolder
    } catch (error) {
      await client.query('ROLLBACK')
      console.error('❌ Failed to update folder:', error)
      throw error
    } finally {
      client.release()
    }
  }

  /**
   * Delete folder (soft delete)
   */
  async deleteFolder(
    folderId: string,
    tenantId: string,
    userId: string,
    options?: { recursive?: boolean }
  ): Promise<void> {
    const client = await pool.connect()

    try {
      await client.query('BEGIN')

      // Check if folder exists
      const folderResult = await client.query(
        `SELECT id, tenant_id, parent_id, folder_name, created_at, updated_at FROM document_folders
         WHERE id = $1 AND tenant_id = $2 AND deleted_at IS NULL`,
        [folderId, tenantId]
      )

      if (folderResult.rows.length === 0) {
        throw new FolderNotFoundError(folderId)
      }

      const folder = folderResult.rows[0]

      // Check if folder is system folder
      if (folder.is_system) {
        throw new Error('Cannot delete system folder')
      }

      // Check if folder has contents
      const contentsCheck = await client.query(
        `SELECT
          (SELECT COUNT(*) FROM document_folders WHERE parent_folder_id = $1 AND deleted_at IS NULL) as subfolder_count,
          (SELECT COUNT(*) FROM documents WHERE parent_folder_id = $1 AND deleted_at IS NULL) as document_count`,
        [folderId]
      )

      const { subfolder_count, document_count } = contentsCheck.rows[0]

      if ((subfolder_count > 0 || document_count > 0) && !options?.recursive) {
        throw new Error(
          'Folder is not empty. Use recursive option to delete folder and all contents.'
        )
      }

      if (options?.recursive) {
        // Soft delete all subfolders and documents recursively
        await this.deleteFolderRecursive(client, folderId, tenantId, userId)
      }

      // Soft delete folder
      await client.query(
        `UPDATE document_folders
         SET deleted_at = NOW(), updated_at = NOW()
         WHERE id = $1 AND tenant_id = $2`,
        [folderId, tenantId]
      )

      // Log deletion
      await documentAuditService.logFolderAction(
        tenantId,
        folderId,
        userId,
        'delete',
        {
          oldValues: { folder_name: folder.folder_name, recursive: options?.recursive }
        }
      )

      await client.query('COMMIT')

      console.log(`✅ Folder deleted: ${folder.folder_name}`)
    } catch (error) {
      await client.query('ROLLBACK')
      console.error('❌ Failed to delete folder:', error)
      throw error
    } finally {
      client.release()
    }
  }

  /**
   * Restore deleted folder
   */
  async restoreFolder(
    folderId: string,
    tenantId: string,
    userId: string
  ): Promise<DocumentFolder> {
    const client = await pool.connect()

    try {
      await client.query('BEGIN')

      const result = await client.query(
        `UPDATE document_folders
         SET deleted_at = NULL, updated_at = NOW()
         WHERE id = $1 AND tenant_id = $2 AND deleted_at IS NOT NULL
         RETURNING *`,
        [folderId, tenantId]
      )

      if (result.rows.length === 0) {
        throw new FolderNotFoundError(folderId)
      }

      const folder = result.rows[0]

      // Log restoration
      await documentAuditService.logFolderAction(
        tenantId,
        folderId,
        userId,
        'restore',
        {
          newValues: { folder_name: folder.folder_name }
        }
      )

      await client.query('COMMIT')

      console.log(`✅ Folder restored: ${folder.folder_name}`)
      return folder
    } catch (error) {
      await client.query('ROLLBACK')
      console.error('❌ Failed to restore folder:', error)
      throw error
    } finally {
      client.release()
    }
  }

  /**
   * Move folder to different parent
   */
  async moveFolder(
    folderId: string,
    newParentId: string | null,
    tenantId: string,
    userId: string
  ): Promise<DocumentFolder> {
    return this.updateFolder(folderId, tenantId, userId, {
      parent_folder_id: newParentId
    })
  }

  /**
   * Get folder breadcrumb (path from root to folder)
   */
  async getFolderBreadcrumb(
    folderId: string
  ): Promise<Array<{ id: string; folder_name: string; depth: number }>> {
    try {
      const result = await pool.query(
        `SELECT ` + (await getTableColumns(pool, 'get_folder_breadcrumb')).join(', ') + ` FROM get_folder_breadcrumb($1)`,
        [folderId]
      )

      return result.rows
    } catch (error) {
      console.error('❌ Failed to get folder breadcrumb:', error)
      return []
    }
  }

  /**
   * Check if folder is descendant of another folder
   */
  private async isDescendantOf(
    folderId: string,
    ancestorId: string
  ): Promise<boolean> {
    try {
      const result = await pool.query(
        `WITH RECURSIVE folder_tree AS (
          SELECT id, parent_folder_id
          FROM document_folders
          WHERE id = $1

          UNION ALL

          SELECT df.id, df.parent_folder_id
          FROM document_folders df
          INNER JOIN folder_tree ft ON df.id = ft.parent_folder_id
        )
        SELECT EXISTS(SELECT 1 FROM folder_tree WHERE id = $2) as is_descendant`,
        [folderId, ancestorId]
      )

      return result.rows[0].is_descendant
    } catch (error) {
      console.error('❌ Failed to check folder hierarchy:', error)
      return false
    }
  }

  /**
   * Delete folder and all contents recursively
   */
  private async deleteFolderRecursive(
    client: any,
    folderId: string,
    tenantId: string,
    userId: string
  ): Promise<void> {
    // Get all subfolders
    const subfoldersResult = await client.query(
      `SELECT id FROM document_folders
       WHERE parent_folder_id = $1 AND tenant_id = $2 AND deleted_at IS NULL`,
      [folderId, tenantId]
    )

    // Recursively delete subfolders
    for (const subfolder of subfoldersResult.rows) {
      await this.deleteFolderRecursive(client, subfolder.id, tenantId, userId)
    }

    // Soft delete all documents in this folder
    await client.query(
      `UPDATE documents
       SET deleted_at = NOW(), updated_at = NOW()
       WHERE parent_folder_id = $1 AND tenant_id = $2 AND deleted_at IS NULL`,
      [folderId, tenantId]
    )

    // Soft delete the folder
    await client.query(
      `UPDATE document_folders
       SET deleted_at = NOW(), updated_at = NOW()
       WHERE id = $1 AND tenant_id = $2`,
      [folderId, tenantId]
    )
  }

  /**
   * Search folders
   */
  async searchFolders(
    tenantId: string,
    searchTerm: string,
    options?: {
      limit?: number
      offset?: number
    }
  ): Promise<{ folders: FolderWithMetadata[]; total: number }> {
    try {
      let query = `
        SELECT
          df.*,
          (SELECT COUNT(*) FROM document_folders WHERE parent_folder_id = df.id AND deleted_at IS NULL) as subfolder_count,
          (SELECT COUNT(*) FROM documents WHERE parent_folder_id = df.id AND deleted_at IS NULL) as document_count,
          (SELECT SUM(file_size) FROM documents WHERE parent_folder_id = df.id AND deleted_at IS NULL) as total_size
        FROM document_folders df
        WHERE df.tenant_id = $1
          AND df.deleted_at IS NULL
          AND (
            df.folder_name ILIKE $2
            OR df.description ILIKE $2
          )
      `

      const params = [tenantId, `%${searchTerm}%`]

      // Get total count
      const countResult = await pool.query(
        query.replace('SELECT df.*', 'SELECT COUNT(*) as count'),
        params
      )
      const total = parseInt(countResult.rows[0].count)

      // Add pagination
      query += ` ORDER BY df.folder_name ASC`

      if (options?.limit) {
        query += ` LIMIT $3`
        params.push(options.limit)
      }

      if (options?.offset) {
        query += ` OFFSET $${params.length + 1}`
        params.push(options.offset)
      }

      const result = await pool.query(query, params)

      return {
        folders: result.rows,
        total
      }
    } catch (error) {
      console.error('❌ Failed to search folders:', error)
      throw error
    }
  }
}

export default new DocumentFolderService()
