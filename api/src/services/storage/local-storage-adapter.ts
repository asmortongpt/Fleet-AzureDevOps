/**
 * Local Filesystem Storage Adapter
 * Implements file storage on local filesystem
 */

import fs from 'fs/promises'
import fsSync from 'fs'
import path from 'path'
import crypto from 'crypto'
import { StorageAdapter, StorageMetadata, UploadOptions } from './storage-adapter.base'
import { validatePathWithinDirectory } from '../../utils/safe-file-operations'

export interface LocalStorageConfig {
  basePath: string
  maxFileSize?: number
  createDirs?: boolean
  publicUrlBase?: string
}

export class LocalStorageAdapter extends StorageAdapter {
  private basePath: string
  private maxFileSize: number
  private publicUrlBase?: string

  constructor(config: LocalStorageConfig) {
    super(config)
    this.basePath = config.basePath || '/var/fleet/documents'
    this.maxFileSize = config.maxFileSize || 100 * 1024 * 1024 // 100MB
    this.publicUrlBase = config.publicUrlBase
  }

  async initialize(): Promise<void> {
    try {
      await fs.mkdir(this.basePath, { recursive: true })
      console.log(`✅ Local storage initialized at: ${this.basePath}`)
    } catch (error) {
      console.error('❌ Failed to initialize local storage:', error)
      throw new Error(`Failed to initialize local storage: ${error}`)
    }
  }

  async upload(
    file: Buffer,
    filePath: string,
    options?: UploadOptions
  ): Promise<string> {
    try {
      // Validate file size
      if (file.length > this.maxFileSize) {
        throw new Error(
          `File size ${file.length} exceeds maximum ${this.maxFileSize}`
        )
      }

      // Build full path
      const fullPath = this.resolvePath(filePath)

      // Ensure directory exists
      await fs.mkdir(path.dirname(fullPath), { recursive: true })

      // Write file
      await fs.writeFile(fullPath, file)

      // Write metadata if provided
      if (options?.metadata) {
        const metadataPath = `${fullPath}.meta.json`
        await fs.writeFile(
          metadataPath,
          JSON.stringify({
            ...options.metadata,
            contentType: options.contentType,
            uploadedAt: new Date().toISOString(),
            size: file.length
          }, null, 2)
        )
      }

      console.log(`✅ File uploaded to local storage: ${filePath}`)
      return filePath
    } catch (error) {
      console.error('❌ Failed to upload file:', error)
      throw new Error(`Failed to upload file: ${error}`)
    }
  }

  async download(filePath: string): Promise<Buffer> {
    try {
      const fullPath = this.resolvePath(filePath)

      if (!(await this.exists(filePath))) {
        throw new Error(`File not found: ${filePath}`)
      }

      const buffer = await fs.readFile(fullPath)
      console.log(`✅ File downloaded from local storage: ${filePath}`)
      return buffer
    } catch (error) {
      console.error('❌ Failed to download file:', error)
      throw new Error(`Failed to download file: ${error}`)
    }
  }

  async delete(filePath: string): Promise<void> {
    try {
      const fullPath = this.resolvePath(filePath)

      if (await this.exists(filePath)) {
        await fs.unlink(fullPath)

        // Delete metadata file if exists
        const metadataPath = `${fullPath}.meta.json`
        try {
          await fs.unlink(metadataPath)
        } catch (error) {
          // Metadata file might not exist
        }

        console.log(`✅ File deleted from local storage: ${filePath}`)
      }
    } catch (error) {
      console.error('❌ Failed to delete file:', error)
      throw new Error(`Failed to delete file: ${error}`)
    }
  }

  async exists(filePath: string): Promise<boolean> {
    try {
      const fullPath = this.resolvePath(filePath)
      await fs.access(fullPath, fsSync.constants.F_OK)
      return true
    } catch {
      return false
    }
  }

  async getMetadata(filePath: string): Promise<StorageMetadata> {
    try {
      const fullPath = this.resolvePath(filePath)

      if (!(await this.exists(filePath))) {
        throw new Error(`File not found: ${filePath}`)
      }

      const stats = await fs.stat(fullPath)

      // Try to read metadata file
      let customMetadata: Record<string, any> = {}
      const metadataPath = `${fullPath}.meta.json`
      try {
        const metadataContent = await fs.readFile(metadataPath, 'utf-8')
        customMetadata = JSON.parse(metadataContent)
      } catch (error) {
        // Metadata file doesn't exist
      }

      return {
        size: stats.size,
        lastModified: stats.mtime,
        ...customMetadata
      }
    } catch (error) {
      console.error('❌ Failed to get metadata:', error)
      throw new Error(`Failed to get metadata: ${error}`)
    }
  }

  async copy(sourcePath: string, destPath: string): Promise<string> {
    try {
      const sourceFullPath = this.resolvePath(sourcePath)
      const destFullPath = this.resolvePath(destPath)

      if (!(await this.exists(sourcePath))) {
        throw new Error(`Source file not found: ${sourcePath}`)
      }

      // Ensure destination directory exists
      await fs.mkdir(path.dirname(destFullPath), { recursive: true })

      // Copy file
      await fs.copyFile(sourceFullPath, destFullPath)

      // Copy metadata if exists
      const sourceMetaPath = `${sourceFullPath}.meta.json`
      const destMetaPath = `${destFullPath}.meta.json`
      try {
        await fs.copyFile(sourceMetaPath, destMetaPath)
      } catch (error) {
        // Metadata file might not exist
      }

      console.log(`✅ File copied: ${sourcePath} -> ${destPath}`)
      return destPath
    } catch (error) {
      console.error('❌ Failed to copy file:', error)
      throw new Error(`Failed to copy file: ${error}`)
    }
  }

  async move(sourcePath: string, destPath: string): Promise<string> {
    try {
      const sourceFullPath = this.resolvePath(sourcePath)
      const destFullPath = this.resolvePath(destPath)

      if (!(await this.exists(sourcePath))) {
        throw new Error(`Source file not found: ${sourcePath}`)
      }

      // Ensure destination directory exists
      await fs.mkdir(path.dirname(destFullPath), { recursive: true })

      // Move file
      await fs.rename(sourceFullPath, destFullPath)

      // Move metadata if exists
      const sourceMetaPath = `${sourceFullPath}.meta.json`
      const destMetaPath = `${destFullPath}.meta.json`
      try {
        await fs.rename(sourceMetaPath, destMetaPath)
      } catch (error) {
        // Metadata file might not exist
      }

      console.log(`✅ File moved: ${sourcePath} -> ${destPath}`)
      return destPath
    } catch (error) {
      console.error('❌ Failed to move file:', error)
      throw new Error(`Failed to move file: ${error}`)
    }
  }

  async list(
    directoryPath: string,
    prefix?: string
  ): Promise<Array<{ path: string; size: number; lastModified: Date }>> {
    try {
      const fullPath = this.resolvePath(directoryPath)
      const files: Array<{ path: string; size: number; lastModified: Date }> = []

      const entries = await fs.readdir(fullPath, { withFileTypes: true })

      for (const entry of entries) {
        if (entry.isFile() && !entry.name.endsWith('.meta.json')) {
          if (prefix && !entry.name.startsWith(prefix)) {
            continue
          }

          const filePath = path.join(directoryPath, entry.name)
          const fullFilePath = this.resolvePath(filePath)
          const stats = await fs.stat(fullFilePath)

          files.push({
            path: filePath,
            size: stats.size,
            lastModified: stats.mtime
          })
        }
      }

      return files
    } catch (error) {
      console.error('❌ Failed to list files:', error)
      return []
    }
  }

  async getSignedUrl(filePath: string, expiresIn: number): Promise<string> {
    // For local storage, generate a temporary token
    // In production, you might want to implement a token-based access system
    const token = crypto.randomBytes(32).toString('hex')
    const expiry = Date.now() + expiresIn * 1000

    // This is a simplified version - in production, you'd store these tokens
    // and validate them in your download endpoint
    return `${this.publicUrlBase || ''}/download/${filePath}?token=${token}&expires=${expiry}`
  }

  getPublicUrl(filePath: string): string {
    if (this.publicUrlBase) {
      return `${this.publicUrlBase}/${filePath}`
    }
    return filePath
  }

  /**
   * Get disk usage statistics
   */
  async getDiskUsage(): Promise<{
    total: number
    used: number
    available: number
  }> {
    try {
      // This is platform-specific - simplified version
      let totalSize = 0
      const files = await this.listRecursive(this.basePath)

      for (const file of files) {
        totalSize += file.size
      }

      return {
        total: 0, // Would need platform-specific code
        used: totalSize,
        available: 0 // Would need platform-specific code
      }
    } catch (error) {
      console.error('❌ Failed to get disk usage:', error)
      throw error
    }
  }

  /**
   * Helper: Resolve full path with security validation
   * SECURITY: Prevents path traversal attacks by validating the resolved path
   */
  private resolvePath(filePath: string): string {
    // Remove leading slash if present
    const normalizedPath = filePath.startsWith('/')
      ? filePath.substring(1)
      : filePath

    // SECURITY: Validate that the resolved path is within basePath
    // This prevents path traversal attacks using ../ or absolute paths
    return validatePathWithinDirectory(normalizedPath, this.basePath)
  }

  /**
   * Helper: List files recursively
   */
  private async listRecursive(
    dirPath: string
  ): Promise<Array<{ path: string; size: number; lastModified: Date }>> {
    const files: Array<{ path: string; size: number; lastModified: Date }> = []

    const entries = await fs.readdir(dirPath, { withFileTypes: true })

    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name)

      if (entry.isDirectory()) {
        const subFiles = await this.listRecursive(fullPath)
        files.push(...subFiles)
      } else if (!entry.name.endsWith('.meta.json')) {
        const stats = await fs.stat(fullPath)
        files.push({
          path: fullPath,
          size: stats.size,
          lastModified: stats.mtime
        })
      }
    }

    return files
  }
}
