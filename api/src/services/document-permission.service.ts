/**
 * Document Permission Service
 * Manages granular access control for documents and folders
 */

import pool from '../config/database'
import {
  DocumentPermission,
  GrantPermissionOptions,
  PermissionType,
  PermissionSummary,
  PermissionDeniedError
} from '../types/document-storage.types'
import documentAuditService from './document-audit.service'

export class DocumentPermissionService {
  /**
   * Grant permission to a user for a document or folder
   */
  async grantPermission(options: GrantPermissionOptions): Promise<DocumentPermission> {
    const client = await pool.connect()

    try {
      await client.query('BEGIN')

      // Validate that either documentId or folderId is provided
      if (!options.documentId && !options.folderId) {
        throw new Error('Either documentId or folderId must be provided')
      }

      if (options.documentId && options.folderId) {
        throw new Error('Cannot grant permission for both document and folder')
      }

      // Check if permission already exists
      const existingPermission = await client.query(
        `SELECT id, tenant_id, document_id, user_id, permission_type, granted_at FROM document_permissions
         WHERE (document_id = $1 OR folder_id = $2)
           AND user_id = $3
           AND permission_type = $4`,
        [
          options.documentId || null,
          options.folderId || null,
          options.userId,
          options.permissionType
        ]
      )

      if (existingPermission.rows.length > 0) {
        // Update existing permission
        const result = await client.query(
          `UPDATE document_permissions
           SET expires_at = $1, granted_by = $2, granted_at = NOW()
           WHERE id = $3
           RETURNING *`,
          [
            options.expiresAt || null,
            options.grantedBy,
            existingPermission.rows[0].id
          ]
        )

        await client.query('COMMIT')
        return result.rows[0]
      }

      // Create new permission
      const result = await client.query(
        `INSERT INTO document_permissions (
          document_id, folder_id, user_id, role, permission_type,
          granted_by, expires_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *`,
        [
          options.documentId || null,
          options.folderId || null,
          options.userId,
          options.role || null,
          options.permissionType,
          options.grantedBy,
          options.expiresAt || null
        ]
      )

      const permission = result.rows[0]

      // Log permission grant
      const tenantId = await this.getTenantId(
        options.documentId,
        options.folderId
      )
      if (tenantId) {
        await documentAuditService.logEvent({
          tenantId,
          documentId: options.documentId,
          folderId: options.folderId,
          userId: options.grantedBy,
          action: 'grant_permission',
          entityType: options.documentId ? 'document' : 'folder',
          newValues: {
            user_id: options.userId,
            permission_type: options.permissionType
          }
        })
      }

      await client.query('COMMIT')

      console.log(`✅ Permission granted: ${options.permissionType} to user ${options.userId}`)
      return permission
    } catch (error) {
      await client.query('ROLLBACK')
      console.error('❌ Failed to grant permission:', error)
      throw error
    } finally {
      client.release()
    }
  }

  /**
   * Revoke permission from a user
   */
  async revokePermission(
    permissionId: string,
    revokedBy: string
  ): Promise<void> {
    const client = await pool.connect()

    try {
      await client.query('BEGIN')

      // Get permission details for logging
      const permissionResult = await client.query(
        `SELECT 
      id,
      document_id,
      user_id,
      role,
      permission_type,
      granted_by,
      granted_at,
      expires_at FROM document_permissions WHERE id = $1`,
        [permissionId]
      )

      if (permissionResult.rows.length === 0) {
        throw new Error('Permission not found')
      }

      const permission = permissionResult.rows[0]

      // Delete permission
      await client.query(
        `DELETE FROM document_permissions WHERE id = $1`,
        [permissionId]
      )

      // Log permission revocation
      const tenantId = await this.getTenantId(
        permission.document_id,
        permission.folder_id
      )
      if (tenantId) {
        await documentAuditService.logEvent({
          tenantId,
          documentId: permission.document_id,
          folderId: permission.folder_id,
          userId: revokedBy,
          action: 'revoke_permission',
          entityType: permission.document_id ? 'document' : 'folder',
          oldValues: {
            user_id: permission.user_id,
            permission_type: permission.permission_type
          }
        })
      }

      await client.query('COMMIT')

      console.log(`✅ Permission revoked: ${permissionId}`)
    } catch (error) {
      await client.query('ROLLBACK')
      console.error('❌ Failed to revoke permission:', error)
      throw error
    } finally {
      client.release()
    }
  }

  /**
   * Check if user has permission for a document
   */
  async checkDocumentPermission(
    documentId: string,
    userId: string,
    requiredPermission: PermissionType
  ): Promise<boolean> {
    try {
      // Check direct document permissions
      const directPermission = await pool.query(
        `SELECT permission_type FROM document_permissions
         WHERE document_id = $1
           AND user_id = $2
           AND (expires_at IS NULL OR expires_at > NOW())`,
        [documentId, userId]
      )

      if (directPermission.rows.length > 0) {
        const granted = directPermission.rows[0].permission_type
        return this.hasPermissionLevel(granted, requiredPermission)
      }

      // Check folder permissions (inherited)
      const folderPermission = await pool.query(
        `SELECT dp.permission_type
         FROM documents d
         JOIN document_permissions dp ON d.parent_folder_id = dp.folder_id
         WHERE d.id = $1
           AND dp.user_id = $2
           AND (dp.expires_at IS NULL OR dp.expires_at > NOW())`,
        [documentId, userId]
      )

      if (folderPermission.rows.length > 0) {
        const granted = folderPermission.rows[0].permission_type
        return this.hasPermissionLevel(granted, requiredPermission)
      }

      // Check if document is public
      const documentCheck = await pool.query(
        `SELECT is_public FROM documents WHERE id = $1`,
        [documentId]
      )

      if (documentCheck.rows.length > 0 && documentCheck.rows[0].is_public) {
        // Public documents allow view permission
        return requiredPermission === PermissionType.VIEW
      }

      return false
    } catch (error) {
      console.error('❌ Failed to check document permission:', error)
      return false
    }
  }

  /**
   * Check if user has permission for a folder
   */
  async checkFolderPermission(
    folderId: string,
    userId: string,
    requiredPermission: PermissionType
  ): Promise<boolean> {
    try {
      const result = await pool.query(
        `SELECT permission_type FROM document_permissions
         WHERE folder_id = $1
           AND user_id = $2
           AND (expires_at IS NULL OR expires_at > NOW())`,
        [folderId, userId]
      )

      if (result.rows.length > 0) {
        const granted = result.rows[0].permission_type
        return this.hasPermissionLevel(granted, requiredPermission)
      }

      return false
    } catch (error) {
      console.error('❌ Failed to check folder permission:', error)
      return false
    }
  }

  /**
   * Get all permissions for a document
   */
  async getDocumentPermissions(documentId: string): Promise<DocumentPermission[]> {
    try {
      const result = await pool.query(
        `SELECT
          dp.*,
          u.first_name || ' ' || u.last_name as user_name,
          u.email as user_email,
          gb.first_name || ' ' || gb.last_name as granted_by_name
        FROM document_permissions dp
        LEFT JOIN users u ON dp.user_id = u.id
        LEFT JOIN users gb ON dp.granted_by = gb.id
        WHERE dp.document_id = $1
        ORDER BY dp.granted_at DESC`,
        [documentId]
      )

      return result.rows
    } catch (error) {
      console.error('❌ Failed to get document permissions:', error)
      throw error
    }
  }

  /**
   * Get all permissions for a folder
   */
  async getFolderPermissions(folderId: string): Promise<DocumentPermission[]> {
    try {
      const result = await pool.query(
        `SELECT
          dp.*,
          u.first_name || ' ' || u.last_name as user_name,
          u.email as user_email,
          gb.first_name || ' ' || gb.last_name as granted_by_name
        FROM document_permissions dp
        LEFT JOIN users u ON dp.user_id = u.id
        LEFT JOIN users gb ON dp.granted_by = gb.id
        WHERE dp.folder_id = $1
        ORDER BY dp.granted_at DESC`,
        [folderId]
      )

      return result.rows
    } catch (error) {
      console.error('❌ Failed to get folder permissions:', error)
      throw error
    }
  }

  /**
   * Get permission summary for a user on a document
   */
  async getDocumentPermissionSummary(
    documentId: string,
    userId: string
  ): Promise<PermissionSummary> {
    try {
      // Get direct permissions
      const userPermissions = await pool.query(
        `SELECT id, tenant_id, document_id, user_id, permission_type, granted_at FROM document_permissions
         WHERE document_id = $1 AND user_id = $2`,
        [documentId, userId]
      )

      // Get folder permissions (inherited)
      const folderPermissions = await pool.query(
        `SELECT dp.*
         FROM documents d
         JOIN document_permissions dp ON d.parent_folder_id = dp.folder_id
         WHERE d.id = $1 AND dp.user_id = $2`,
        [documentId, userId]
      )

      // Calculate effective permission
      let effectivePermission = PermissionType.VIEW

      const allPermissions = [
        ...userPermissions.rows,
        ...folderPermissions.rows
      ]

      for (const perm of allPermissions) {
        if (
          !perm.expires_at ||
          new Date(perm.expires_at) > new Date()
        ) {
          if (perm.permission_type === PermissionType.ADMIN) {
            effectivePermission = PermissionType.ADMIN
            break
          } else if (perm.permission_type === PermissionType.EDIT) {
            effectivePermission = PermissionType.EDIT
          }
        }
      }

      return {
        user_permissions: userPermissions.rows,
        folder_permissions: folderPermissions.rows,
        inherited_permissions: folderPermissions.rows,
        effective_permission: effectivePermission
      }
    } catch (error) {
      console.error('❌ Failed to get permission summary:', error)
      throw error
    }
  }

  /**
   * Get all permissions for a user
   */
  async getUserPermissions(
    userId: string,
    tenantId: string
  ): Promise<DocumentPermission[]> {
    try {
      const result = await pool.query(
        `SELECT
          dp.*,
          d.file_name as document_name,
          df.folder_name as folder_name
        FROM document_permissions dp
        LEFT JOIN documents d ON dp.document_id = d.id
        LEFT JOIN document_folders df ON dp.folder_id = df.id
        WHERE dp.user_id = $1
          AND (
            (d.id IS NOT NULL AND d.tenant_id = $2)
            OR (df.id IS NOT NULL AND df.tenant_id = $2)
          )
        ORDER BY dp.granted_at DESC`,
        [userId, tenantId]
      )

      return result.rows
    } catch (error) {
      console.error('❌ Failed to get user permissions:', error)
      throw error
    }
  }

  /**
   * Clean up expired permissions
   */
  async cleanupExpiredPermissions(): Promise<number> {
    try {
      const result = await pool.query(
        `DELETE FROM document_permissions
         WHERE expires_at IS NOT NULL AND expires_at < NOW()`
      )

      console.log(`✅ Cleaned up ${result.rowCount} expired permissions`)
      return result.rowCount || 0
    } catch (error) {
      console.error('❌ Failed to cleanup expired permissions:', error)
      throw error
    }
  }

  /**
   * Helper: Check if granted permission level satisfies required level
   */
  private hasPermissionLevel(
    granted: PermissionType,
    required: PermissionType
  ): boolean {
    const levels = {
      [PermissionType.VIEW]: 1,
      [PermissionType.EDIT]: 2,
      [PermissionType.ADMIN]: 3
    }

    return levels[granted] >= levels[required]
  }

  /**
   * Helper: Get tenant ID from document or folder
   */
  private async getTenantId(
    documentId?: string,
    folderId?: string
  ): Promise<string | null> {
    try {
      if (documentId) {
        const result = await pool.query(
          `SELECT tenant_id FROM documents WHERE id = $1`,
          [documentId]
        )
        return result.rows[0]?.tenant_id || null
      }

      if (folderId) {
        const result = await pool.query(
          `SELECT tenant_id FROM document_folders WHERE id = $1`,
          [folderId]
        )
        return result.rows[0]?.tenant_id || null
      }

      return null
    } catch (error) {
      console.error('❌ Failed to get tenant ID:', error)
      return null
    }
  }

  /**
   * Bulk grant permissions
   */
  async bulkGrantPermissions(
    permissions: GrantPermissionOptions[]
  ): Promise<DocumentPermission[]> {
    const client = await pool.connect()
    const results: DocumentPermission[] = []

    try {
      await client.query('BEGIN')

      for (const perm of permissions) {
        const result = await this.grantPermission(perm)
        results.push(result)
      }

      await client.query('COMMIT')

      console.log(`✅ Bulk granted ${results.length} permissions`)
      return results
    } catch (error) {
      await client.query('ROLLBACK')
      console.error('❌ Failed to bulk grant permissions:', error)
      throw error
    } finally {
      client.release()
    }
  }

  /**
   * Copy permissions from one document/folder to another
   */
  async copyPermissions(
    sourceId: string,
    targetId: string,
    sourceType: 'document' | 'folder',
    copiedBy: string
  ): Promise<DocumentPermission[]> {
    const client = await pool.connect()
    const results: DocumentPermission[] = []

    try {
      await client.query('BEGIN')

      const sourcePermissions =
        sourceType === 'document'
          ? await this.getDocumentPermissions(sourceId)
          : await this.getFolderPermissions(sourceId)

      for (const perm of sourcePermissions) {
        const newPerm = await this.grantPermission({
          documentId: sourceType === 'document' ? targetId : undefined,
          folderId: sourceType === 'folder' ? targetId : undefined,
          userId: perm.user_id,
          role: perm.role,
          permissionType: perm.permission_type,
          grantedBy: copiedBy,
          expiresAt: perm.expires_at
        })
        results.push(newPerm)
      }

      await client.query('COMMIT')

      console.log(`✅ Copied ${results.length} permissions`)
      return results
    } catch (error) {
      await client.query('ROLLBACK')
      console.error('❌ Failed to copy permissions:', error)
      throw error
    } finally {
      client.release()
    }
  }
}

export default new DocumentPermissionService()
