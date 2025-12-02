/**
 * Storage Configuration
 *
 * Centralized configuration for storage adapters
 * Supports environment-based configuration for different storage providers
 */

import { StorageConfig } from '../storage/StorageAdapter';

/**
 * Load storage configuration from environment variables
 */
export function loadStorageConfig(): StorageConfig {
  const provider = (process.env.STORAGE_PROVIDER || 'local') as StorageConfig['provider'];

  const config: StorageConfig = {
    provider,
    basePath: process.env.STORAGE_BASE_PATH,
    maxFileSize: process.env.STORAGE_MAX_FILE_SIZE
      ? parseInt(process.env.STORAGE_MAX_FILE_SIZE)
      : 500 * 1024 * 1024, // Default: 500MB
    allowedMimeTypes: process.env.STORAGE_ALLOWED_MIME_TYPES
      ? process.env.STORAGE_ALLOWED_MIME_TYPES.split(',')
      : undefined,
    enableCompression: process.env.STORAGE_ENABLE_COMPRESSION === 'true'
  };

  // Provider-specific configuration
  switch (provider) {
    case 'local':
      config.local = {
        storagePath: process.env.LOCAL_STORAGE_PATH || './storage',
        createDirs: true
      };
      break;

    case 's3':
      config.s3 = {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
        region: process.env.AWS_REGION || 'us-east-1',
        bucket: process.env.AWS_S3_BUCKET || '',
        endpoint: process.env.AWS_S3_ENDPOINT, // For S3-compatible services
        forcePathStyle: process.env.AWS_S3_FORCE_PATH_STYLE === 'true'
      };
      break;

    case 'azure':
      config.azure = {
        connectionString: process.env.AZURE_STORAGE_CONNECTION_STRING,
        accountName: process.env.AZURE_STORAGE_ACCOUNT_NAME,
        accountKey: process.env.AZURE_STORAGE_ACCOUNT_KEY,
        containerName: process.env.AZURE_STORAGE_CONTAINER || 'fleet-storage',
        sasToken: process.env.AZURE_STORAGE_SAS_TOKEN
      };
      break;

    case 'gcs':
      config.gcs = {
        projectId: process.env.GCS_PROJECT_ID || '',
        keyFilename: process.env.GCS_KEY_FILE,
        credentials: process.env.GCS_CREDENTIALS
          ? JSON.parse(process.env.GCS_CREDENTIALS)
          : undefined,
        bucket: process.env.GCS_BUCKET || ''
      };
      break;

    case 'dropbox':
      config.dropbox = {
        accessToken: process.env.DROPBOX_ACCESS_TOKEN || '',
        refreshToken: process.env.DROPBOX_REFRESH_TOKEN,
        clientId: process.env.DROPBOX_CLIENT_ID,
        clientSecret: process.env.DROPBOX_CLIENT_SECRET,
        basePath: process.env.DROPBOX_BASE_PATH || '/fleet-storage'
      };
      break;

    case 'box':
      config.box = {
        clientId: process.env.BOX_CLIENT_ID || '',
        clientSecret: process.env.BOX_CLIENT_SECRET || '',
        accessToken: process.env.BOX_ACCESS_TOKEN || '',
        refreshToken: process.env.BOX_REFRESH_TOKEN,
        folderId: process.env.BOX_FOLDER_ID || '0'
      };
      break;

    case 'sharepoint':
      config.sharepoint = {
        tenantId: process.env.SHAREPOINT_TENANT_ID || '',
        clientId: process.env.SHAREPOINT_CLIENT_ID || '',
        clientSecret: process.env.SHAREPOINT_CLIENT_SECRET || '',
        siteUrl: process.env.SHAREPOINT_SITE_URL || '',
        libraryName: process.env.SHAREPOINT_LIBRARY_NAME || 'Documents'
      };
      break;
  }

  return config;
}

/**
 * Get quota configuration from environment
 */
export function loadQuotaConfig() {
  return {
    maxTotalSize: process.env.STORAGE_QUOTA_MAX_SIZE
      ? parseInt(process.env.STORAGE_QUOTA_MAX_SIZE)
      : undefined,
    maxFileSize: process.env.STORAGE_QUOTA_MAX_FILE_SIZE
      ? parseInt(process.env.STORAGE_QUOTA_MAX_FILE_SIZE)
      : 500 * 1024 * 1024, // 500MB default
    maxFiles: process.env.STORAGE_QUOTA_MAX_FILES
      ? parseInt(process.env.STORAGE_QUOTA_MAX_FILES)
      : undefined,
    warnThreshold: process.env.STORAGE_QUOTA_WARN_THRESHOLD
      ? parseInt(process.env.STORAGE_QUOTA_WARN_THRESHOLD)
      : 80 // Warn at 80% usage
  };
}

/**
 * Get failover configuration
 */
export function loadFailoverConfig(): string[] {
  const failoverOrder = process.env.STORAGE_FAILOVER_ORDER;
  return failoverOrder ? failoverOrder.split(',').map(s => s.trim()) : [];
}

/**
 * Storage feature flags
 */
export const storageFeatures = {
  enableDeduplication: process.env.STORAGE_ENABLE_DEDUPLICATION === 'true',
  enableAutoTiering: process.env.STORAGE_ENABLE_AUTO_TIERING === 'true',
  enableFailover: process.env.STORAGE_ENABLE_FAILOVER === 'true',
  enableCompression: process.env.STORAGE_ENABLE_COMPRESSION === 'true',
  enableEncryption: process.env.STORAGE_ENABLE_ENCRYPTION === 'true'
};

/**
 * Storage tier configuration
 */
export const storageTiers = {
  hot: {
    name: 'hot' as const,
    description: 'Frequently accessed files (< 7 days)',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in ms
    costPerGB: 0.023
  },
  warm: {
    name: 'warm' as const,
    description: 'Occasionally accessed files (7-30 days)',
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days in ms
    costPerGB: 0.0125
  },
  cold: {
    name: 'cold' as const,
    description: 'Rarely accessed files (30-90 days)',
    maxAge: 90 * 24 * 60 * 60 * 1000, // 90 days in ms
    costPerGB: 0.004
  },
  archive: {
    name: 'archive' as const,
    description: 'Long-term storage (> 90 days)',
    maxAge: Infinity,
    costPerGB: 0.001
  }
};

/**
 * Environment variable documentation
 */
export const environmentVariables = {
  // General
  STORAGE_PROVIDER: {
    description: 'Storage provider to use',
    values: ['local', 's3', 'azure', 'gcs', 'dropbox', 'box', 'sharepoint'],
    default: 'local',
    required: false
  },
  STORAGE_BASE_PATH: {
    description: 'Base path for storage (prefix for all keys)',
    required: false
  },
  STORAGE_MAX_FILE_SIZE: {
    description: 'Maximum file size in bytes',
    default: '524288000', // 500MB
    required: false
  },
  STORAGE_ALLOWED_MIME_TYPES: {
    description: 'Comma-separated list of allowed MIME types',
    required: false
  },
  STORAGE_ENABLE_COMPRESSION: {
    description: 'Enable automatic file compression',
    values: ['true', 'false'],
    default: 'false',
    required: false
  },

  // Local Storage
  LOCAL_STORAGE_PATH: {
    description: 'Local filesystem storage path',
    default: './storage',
    required: false
  },

  // AWS S3
  AWS_ACCESS_KEY_ID: {
    description: 'AWS access key ID',
    required: false
  },
  AWS_SECRET_ACCESS_KEY: {
    description: 'AWS secret access key',
    required: false
  },
  AWS_REGION: {
    description: 'AWS region',
    default: 'us-east-1',
    required: false
  },
  AWS_S3_BUCKET: {
    description: 'S3 bucket name',
    required: false
  },
  AWS_S3_ENDPOINT: {
    description: 'S3-compatible endpoint URL (for MinIO, etc.)',
    required: false
  },
  AWS_S3_FORCE_PATH_STYLE: {
    description: 'Force path-style URLs for S3',
    values: ['true', 'false'],
    default: 'false',
    required: false
  },

  // Azure Blob Storage
  AZURE_STORAGE_CONNECTION_STRING: {
    description: 'Azure Storage connection string',
    required: false
  },
  AZURE_STORAGE_ACCOUNT_NAME: {
    description: 'Azure Storage account name',
    required: false
  },
  AZURE_STORAGE_ACCOUNT_KEY: {
    description: 'Azure Storage account key',
    required: false
  },
  AZURE_STORAGE_CONTAINER: {
    description: 'Azure Storage container name',
    default: 'fleet-storage',
    required: false
  },
  AZURE_STORAGE_SAS_TOKEN: {
    description: 'Azure Storage SAS token',
    required: false
  },

  // Google Cloud Storage
  GCS_PROJECT_ID: {
    description: 'Google Cloud project ID',
    required: false
  },
  GCS_KEY_FILE: {
    description: 'Path to Google Cloud service account key file',
    required: false
  },
  GCS_CREDENTIALS: {
    description: 'Google Cloud credentials as JSON string',
    required: false
  },
  GCS_BUCKET: {
    description: 'Google Cloud Storage bucket name',
    required: false
  },

  // Dropbox
  DROPBOX_ACCESS_TOKEN: {
    description: 'Dropbox access token',
    required: false
  },
  DROPBOX_REFRESH_TOKEN: {
    description: 'Dropbox refresh token',
    required: false
  },
  DROPBOX_CLIENT_ID: {
    description: 'Dropbox app client ID',
    required: false
  },
  DROPBOX_CLIENT_SECRET: {
    description: 'Dropbox app client secret',
    required: false
  },
  DROPBOX_BASE_PATH: {
    description: 'Base path in Dropbox',
    default: '/fleet-storage',
    required: false
  },

  // Box.com
  BOX_CLIENT_ID: {
    description: 'Box app client ID',
    required: false
  },
  BOX_CLIENT_SECRET: {
    description: 'Box app client secret',
    required: false
  },
  BOX_ACCESS_TOKEN: {
    description: 'Box access token',
    required: false
  },
  BOX_REFRESH_TOKEN: {
    description: 'Box refresh token',
    required: false
  },
  BOX_FOLDER_ID: {
    description: 'Box folder ID (0 for root)',
    default: '0',
    required: false
  },

  // SharePoint
  SHAREPOINT_TENANT_ID: {
    description: 'SharePoint tenant ID',
    required: false
  },
  SHAREPOINT_CLIENT_ID: {
    description: 'SharePoint app client ID',
    required: false
  },
  SHAREPOINT_CLIENT_SECRET: {
    description: 'SharePoint app client secret',
    required: false
  },
  SHAREPOINT_SITE_URL: {
    description: 'SharePoint site URL',
    required: false
  },
  SHAREPOINT_LIBRARY_NAME: {
    description: 'SharePoint document library name',
    default: 'Documents',
    required: false
  },

  // Quota & Features
  STORAGE_QUOTA_MAX_SIZE: {
    description: 'Maximum total storage size in bytes',
    required: false
  },
  STORAGE_QUOTA_MAX_FILE_SIZE: {
    description: 'Maximum single file size in bytes',
    default: '524288000', // 500MB
    required: false
  },
  STORAGE_QUOTA_MAX_FILES: {
    description: 'Maximum number of files',
    required: false
  },
  STORAGE_QUOTA_WARN_THRESHOLD: {
    description: 'Quota warning threshold percentage',
    default: '80',
    required: false
  },
  STORAGE_ENABLE_DEDUPLICATION: {
    description: 'Enable file deduplication',
    values: ['true', 'false'],
    default: 'false',
    required: false
  },
  STORAGE_ENABLE_AUTO_TIERING: {
    description: 'Enable automatic storage tiering',
    values: ['true', 'false'],
    default: 'false',
    required: false
  },
  STORAGE_ENABLE_FAILOVER: {
    description: 'Enable automatic failover to backup providers',
    values: ['true', 'false'],
    default: 'false',
    required: false
  },
  STORAGE_FAILOVER_ORDER: {
    description: 'Comma-separated list of providers for failover',
    example: 's3,azure,local',
    required: false
  }
};

export default {
  loadStorageConfig,
  loadQuotaConfig,
  loadFailoverConfig,
  storageFeatures,
  storageTiers,
  environmentVariables
};
