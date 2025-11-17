/**
 * Storage Factory
 * Creates the appropriate storage adapter based on configuration
 */

import { StorageAdapter } from './storage-adapter.base'
import { LocalStorageAdapter, LocalStorageConfig } from './local-storage-adapter'
import {
  AzureBlobStorageAdapter,
  S3StorageAdapter,
  CloudStorageConfig
} from './cloud-storage-adapter'
import { StorageLocationType } from '../../types/document-storage.types'

export type StorageConfig =
  | ({ type: 'local' } & LocalStorageConfig)
  | ({ type: 's3' | 'azure_blob' | 'gcp_storage' } & CloudStorageConfig)

export class StorageFactory {
  /**
   * Create a storage adapter based on configuration
   */
  static createAdapter(config: StorageConfig): StorageAdapter {
    switch (config.type) {
      case 'local':
        return new LocalStorageAdapter(config)

      case 'azure_blob':
        return new AzureBlobStorageAdapter({
          ...config,
          provider: 'azure_blob'
        })

      case 's3':
        return new S3StorageAdapter({
          ...config,
          provider: 's3'
        })

      case 'gcp_storage':
        throw new Error('GCP Storage not yet implemented')

      default:
        throw new Error(`Unknown storage type: ${(config as any).type}`)
    }
  }

  /**
   * Create adapter from storage location record
   */
  static createFromLocation(location: {
    location_type: StorageLocationType
    configuration: Record<string, any>
  }): StorageAdapter {
    switch (location.location_type) {
      case StorageLocationType.LOCAL:
        return new LocalStorageAdapter({
          basePath: location.configuration.base_path || '/var/fleet/documents',
          maxFileSize: location.configuration.max_file_size,
          publicUrlBase: location.configuration.public_url_base
        })

      case StorageLocationType.AZURE_BLOB:
        return new AzureBlobStorageAdapter({
          provider: 'azure_blob',
          connectionString: location.configuration.connection_string,
          containerName: location.configuration.container_name,
          accountName: location.configuration.account_name,
          accountKey: location.configuration.account_key,
          publicUrlBase: location.configuration.public_url_base
        })

      case StorageLocationType.S3:
        return new S3StorageAdapter({
          provider: 's3',
          bucketName: location.configuration.bucket_name,
          region: location.configuration.region,
          accessKeyId: location.configuration.access_key_id,
          secretAccessKey: location.configuration.secret_access_key,
          publicUrlBase: location.configuration.public_url_base
        })

      case StorageLocationType.GCP_STORAGE:
        throw new Error('GCP Storage not yet implemented')

      default:
        throw new Error(`Unknown storage location type: ${location.location_type}`)
    }
  }

  /**
   * Create default local storage adapter
   */
  static createDefault(): StorageAdapter {
    return new LocalStorageAdapter({
      basePath: process.env.DOCUMENT_UPLOAD_DIR || '/var/fleet/documents',
      maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '104857600'), // 100MB
      publicUrlBase: process.env.PUBLIC_URL_BASE
    })
  }
}
