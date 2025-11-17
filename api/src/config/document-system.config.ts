/**
 * Document Storage System Configuration
 * Central configuration for all document management features
 */

import dotenv from 'dotenv'
dotenv.config()

export interface DocumentSystemConfig {
  // Storage Configuration
  storage: {
    provider: 'local' | 's3' | 'azure' | 'gcs' | 'dropbox' | 'box' | 'sharepoint'
    localPath?: string
    enableDeduplication: boolean
    enableAutoTiering: boolean
    enableFailover: boolean
    failoverOrder?: string[]
    maxFileSize: number
    maxFilesPerUpload: number
  }

  // OCR Configuration
  ocr: {
    provider: 'tesseract' | 'google' | 'aws' | 'azure'
    enableAsync: boolean
    enableBatchProcessing: boolean
    maxConcurrentJobs: number
    defaultLanguage: string
    languages: string[]
  }

  // AI/RAG Configuration
  ai: {
    embeddingProvider: 'openai' | 'cohere' | 'local'
    embeddingModel: string
    embeddingDimensions: number
    vectorSearchProvider: 'pgvector' | 'pinecone' | 'qdrant'
    enableSemanticSearch: boolean
    enableClassification: boolean
    enableSummarization: boolean
    enableQA: boolean
    maxChunkSize: number
    chunkOverlap: number
  }

  // Search Configuration
  search: {
    enableFullTextSearch: boolean
    enableFuzzyMatch: boolean
    enableAutocomplete: boolean
    enableSpellCheck: boolean
    cacheEnabled: boolean
    cacheTTL: number
    maxResults: number
  }

  // Geospatial Configuration
  geo: {
    enableGeospatial: boolean
    geocodingProvider: 'nominatim' | 'google' | 'mapbox' | 'arcgis'
    enableAutoExtraction: boolean
    defaultRadius: number
  }

  // Security Configuration
  security: {
    enableEncryptionAtRest: boolean
    enableEncryptionInTransit: boolean
    enableVirusScan: boolean
    maxStoragePerTenant: number
    enableAuditLog: boolean
    enableVersionControl: boolean
    maxVersionsPerDocument: number
  }

  // Feature Flags
  features: {
    enableOCR: boolean
    enableAI: boolean
    enableRAG: boolean
    enableGeospatial: boolean
    enableVersioning: boolean
    enableCollaboration: boolean
    enableExternalStorage: boolean
  }
}

/**
 * Load configuration from environment variables with defaults
 */
export function loadDocumentSystemConfig(): DocumentSystemConfig {
  return {
    storage: {
      provider: (process.env.STORAGE_PROVIDER as any) || 'local',
      localPath: process.env.STORAGE_LOCAL_PATH || './uploads',
      enableDeduplication: process.env.STORAGE_ENABLE_DEDUPLICATION === 'true',
      enableAutoTiering: process.env.STORAGE_ENABLE_AUTO_TIERING === 'true',
      enableFailover: process.env.STORAGE_ENABLE_FAILOVER === 'true',
      failoverOrder: process.env.STORAGE_FAILOVER_ORDER?.split(','),
      maxFileSize: parseInt(process.env.STORAGE_MAX_FILE_SIZE || '104857600'), // 100MB
      maxFilesPerUpload: parseInt(process.env.STORAGE_MAX_FILES_PER_UPLOAD || '10')
    },

    ocr: {
      provider: (process.env.OCR_PROVIDER as any) || 'tesseract',
      enableAsync: process.env.OCR_ENABLE_ASYNC !== 'false',
      enableBatchProcessing: process.env.OCR_ENABLE_BATCH !== 'false',
      maxConcurrentJobs: parseInt(process.env.OCR_MAX_CONCURRENT_JOBS || '5'),
      defaultLanguage: process.env.OCR_DEFAULT_LANGUAGE || 'eng',
      languages: process.env.OCR_LANGUAGES?.split(',') || ['eng']
    },

    ai: {
      embeddingProvider: (process.env.AI_EMBEDDING_PROVIDER as any) || 'openai',
      embeddingModel: process.env.AI_EMBEDDING_MODEL || 'text-embedding-3-small',
      embeddingDimensions: parseInt(process.env.AI_EMBEDDING_DIMENSIONS || '1536'),
      vectorSearchProvider: (process.env.AI_VECTOR_SEARCH_PROVIDER as any) || 'pgvector',
      enableSemanticSearch: process.env.AI_ENABLE_SEMANTIC_SEARCH !== 'false',
      enableClassification: process.env.AI_ENABLE_CLASSIFICATION !== 'false',
      enableSummarization: process.env.AI_ENABLE_SUMMARIZATION !== 'false',
      enableQA: process.env.AI_ENABLE_QA !== 'false',
      maxChunkSize: parseInt(process.env.AI_MAX_CHUNK_SIZE || '1000'),
      chunkOverlap: parseInt(process.env.AI_CHUNK_OVERLAP || '200')
    },

    search: {
      enableFullTextSearch: process.env.SEARCH_ENABLE_FULLTEXT !== 'false',
      enableFuzzyMatch: process.env.SEARCH_ENABLE_FUZZY !== 'false',
      enableAutocomplete: process.env.SEARCH_ENABLE_AUTOCOMPLETE !== 'false',
      enableSpellCheck: process.env.SEARCH_ENABLE_SPELLCHECK !== 'false',
      cacheEnabled: process.env.SEARCH_CACHE_ENABLED !== 'false',
      cacheTTL: parseInt(process.env.SEARCH_CACHE_TTL || '3600'),
      maxResults: parseInt(process.env.SEARCH_MAX_RESULTS || '100')
    },

    geo: {
      enableGeospatial: process.env.GEO_ENABLE !== 'false',
      geocodingProvider: (process.env.GEO_PROVIDER as any) || 'nominatim',
      enableAutoExtraction: process.env.GEO_AUTO_EXTRACT !== 'false',
      defaultRadius: parseInt(process.env.GEO_DEFAULT_RADIUS || '5000') // 5km
    },

    security: {
      enableEncryptionAtRest: process.env.SECURITY_ENCRYPT_AT_REST === 'true',
      enableEncryptionInTransit: process.env.SECURITY_ENCRYPT_IN_TRANSIT !== 'false',
      enableVirusScan: process.env.SECURITY_VIRUS_SCAN === 'true',
      maxStoragePerTenant: parseInt(process.env.SECURITY_MAX_STORAGE_PER_TENANT || '107374182400'), // 100GB
      enableAuditLog: process.env.SECURITY_AUDIT_LOG !== 'false',
      enableVersionControl: process.env.SECURITY_VERSION_CONTROL !== 'false',
      maxVersionsPerDocument: parseInt(process.env.SECURITY_MAX_VERSIONS || '50')
    },

    features: {
      enableOCR: process.env.FEATURE_OCR !== 'false',
      enableAI: process.env.FEATURE_AI !== 'false',
      enableRAG: process.env.FEATURE_RAG !== 'false',
      enableGeospatial: process.env.FEATURE_GEO !== 'false',
      enableVersioning: process.env.FEATURE_VERSIONING !== 'false',
      enableCollaboration: process.env.FEATURE_COLLABORATION !== 'false',
      enableExternalStorage: process.env.FEATURE_EXTERNAL_STORAGE === 'true'
    }
  }
}

/**
 * Validate configuration and return errors
 */
export function validateDocumentSystemConfig(config: DocumentSystemConfig): string[] {
  const errors: string[] = []

  // Validate storage
  if (config.storage.provider === 's3' && !process.env.AWS_ACCESS_KEY_ID) {
    errors.push('AWS_ACCESS_KEY_ID required for S3 storage')
  }
  if (config.storage.provider === 'azure' && !process.env.AZURE_STORAGE_CONNECTION_STRING) {
    errors.push('AZURE_STORAGE_CONNECTION_STRING required for Azure storage')
  }

  // Validate OCR
  if (config.features.enableOCR) {
    if (config.ocr.provider === 'google' && !process.env.GOOGLE_CLOUD_VISION_API_KEY) {
      errors.push('GOOGLE_CLOUD_VISION_API_KEY required for Google OCR')
    }
    if (config.ocr.provider === 'aws' && !process.env.AWS_ACCESS_KEY_ID) {
      errors.push('AWS_ACCESS_KEY_ID required for AWS Textract')
    }
  }

  // Validate AI
  if (config.features.enableAI || config.features.enableRAG) {
    if (config.ai.embeddingProvider === 'openai' && !process.env.OPENAI_API_KEY) {
      errors.push('OPENAI_API_KEY required for OpenAI embeddings')
    }
    if (config.ai.vectorSearchProvider === 'pinecone' && !process.env.PINECONE_API_KEY) {
      errors.push('PINECONE_API_KEY required for Pinecone vector search')
    }
  }

  // Validate geospatial
  if (config.features.enableGeospatial) {
    if (config.geo.geocodingProvider === 'google' && !process.env.GOOGLE_MAPS_API_KEY) {
      errors.push('GOOGLE_MAPS_API_KEY required for Google geocoding')
    }
  }

  return errors
}

/**
 * Get configuration summary for logging
 */
export function getConfigSummary(config: DocumentSystemConfig): string {
  const enabledFeatures = Object.entries(config.features)
    .filter(([, enabled]) => enabled)
    .map(([feature]) => feature)
    .join(', ')

  return `
Document System Configuration:
  Storage: ${config.storage.provider}
  OCR: ${config.ocr.provider}
  AI Embeddings: ${config.ai.embeddingProvider}
  Vector Search: ${config.ai.vectorSearchProvider}
  Geocoding: ${config.geo.geocodingProvider}
  Enabled Features: ${enabledFeatures}
  `
}

// Export singleton instance
export const documentSystemConfig = loadDocumentSystemConfig()

// Validate on load and log warnings
const configErrors = validateDocumentSystemConfig(documentSystemConfig)
if (configErrors.length > 0) {
  console.warn('⚠️  Document System Configuration Warnings:')
  configErrors.forEach(error => console.warn(`   - ${error}`))
  console.warn('   Some features may be disabled until configuration is complete.')
}

console.log(getConfigSummary(documentSystemConfig))
