# External Storage Adapters System

A flexible, enterprise-grade storage abstraction layer supporting multiple cloud storage providers and external systems.

## Features

### Core Capabilities
- **Multiple Storage Providers**: Support for 7 different storage backends
  - Local filesystem (default, for development)
  - AWS S3 (and S3-compatible services like MinIO, DigitalOcean Spaces)
  - Azure Blob Storage
  - Google Cloud Storage
  - Dropbox Business API
  - Box.com
  - Microsoft SharePoint

### Advanced Features
- **Unified Interface**: Common API across all providers
- **Streaming Support**: Efficient handling of large files with streams
- **Multipart Uploads**: Automatic chunked uploads for files >100MB
- **File Deduplication**: SHA-256 hash-based deduplication to save storage
- **Storage Tiering**: Hot/warm/cold/archive tiers based on access patterns
- **Automatic Failover**: Seamless failover to backup providers
- **Quota Management**: Per-tenant storage quotas and usage tracking
- **Storage Migration**: Tools to migrate between providers
- **Presigned URLs**: Temporary signed URLs for secure file access
- **Metadata Handling**: Rich metadata support for all files
- **Progress Callbacks**: Real-time upload/download progress tracking

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Application Layer                      │
├─────────────────────────────────────────────────────────────┤
│                      StorageManager                          │
│  ┌──────────────┬──────────────┬──────────────────────────┐ │
│  │ Deduplication│  Auto-Tiering│  Quota Management        │ │
│  ├──────────────┼──────────────┼──────────────────────────┤ │
│  │   Failover   │   Migration  │  Usage Tracking          │ │
│  └──────────────┴──────────────┴──────────────────────────┘ │
├─────────────────────────────────────────────────────────────┤
│                  Storage Adapter Interface                   │
├─────────────────────────────────────────────────────────────┤
│   ┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐        │
│   │Local │  │  S3  │  │Azure │  │ GCS  │  │Other │        │
│   └──────┘  └──────┘  └──────┘  └──────┘  └──────┘        │
└─────────────────────────────────────────────────────────────┘
```

## Quick Start

### Installation

The system uses existing dependencies. For specific providers, install additional packages:

```bash
# AWS S3
npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner

# Google Cloud Storage
npm install @google-cloud/storage

# Dropbox, Box (uses axios - already installed)
# SharePoint (uses @microsoft/microsoft-graph-client - already installed)
```

### Configuration

Set environment variables based on your chosen provider:

```bash
# General settings
STORAGE_PROVIDER=local                    # or: s3, azure, gcs, dropbox, box, sharepoint
STORAGE_MAX_FILE_SIZE=524288000           # 500MB default
STORAGE_ENABLE_DEDUPLICATION=true
STORAGE_ENABLE_AUTO_TIERING=true

# Local storage (default)
LOCAL_STORAGE_PATH=./storage

# AWS S3
STORAGE_PROVIDER=s3
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_REGION=us-east-1
AWS_S3_BUCKET=your-bucket-name

# Azure Blob Storage
STORAGE_PROVIDER=azure
AZURE_STORAGE_CONNECTION_STRING=your-connection-string
AZURE_STORAGE_CONTAINER=fleet-storage

# Google Cloud Storage
STORAGE_PROVIDER=gcs
GCS_PROJECT_ID=your-project-id
GCS_KEY_FILE=/path/to/service-account-key.json
GCS_BUCKET=your-bucket-name

# Dropbox
STORAGE_PROVIDER=dropbox
DROPBOX_ACCESS_TOKEN=your-access-token
DROPBOX_BASE_PATH=/fleet-storage

# Box.com
STORAGE_PROVIDER=box
BOX_CLIENT_ID=your-client-id
BOX_CLIENT_SECRET=your-client-secret
BOX_ACCESS_TOKEN=your-access-token

# SharePoint
STORAGE_PROVIDER=sharepoint
SHAREPOINT_TENANT_ID=your-tenant-id
SHAREPOINT_CLIENT_ID=your-client-id
SHAREPOINT_CLIENT_SECRET=your-client-secret
SHAREPOINT_SITE_URL=https://yourcompany.sharepoint.com/sites/yoursite
SHAREPOINT_LIBRARY_NAME=Documents

# Quota settings
STORAGE_QUOTA_MAX_SIZE=107374182400      # 100GB
STORAGE_QUOTA_MAX_FILES=100000
STORAGE_QUOTA_WARN_THRESHOLD=80          # Warn at 80%

# Failover
STORAGE_ENABLE_FAILOVER=true
STORAGE_FAILOVER_ORDER=s3,azure,local
```

### Basic Usage

```typescript
import { StorageManager } from './storage';
import { loadStorageConfig, loadQuotaConfig } from './config/storage';

// Initialize storage manager
const config = loadStorageConfig();
const quotaConfig = loadQuotaConfig();

const storage = new StorageManager(config, {
  enableDeduplication: true,
  quotaConfig
});

await storage.initialize();

// Upload a file
const result = await storage.upload('documents/report.pdf', fileBuffer, {
  tier: 'hot',
  metadata: {
    filename: 'report.pdf',
    mimeType: 'application/pdf',
    uploadedBy: 'user123'
  }
});

// Download a file
const download = await storage.download('documents/report.pdf');
download.stream.pipe(outputStream);

// Get presigned URL
const url = await storage.getUrl('documents/report.pdf', {
  expiresIn: 3600 // 1 hour
});

// List files
const files = await storage.list({
  prefix: 'documents/',
  tier: 'hot',
  maxKeys: 100
});

// Delete a file
await storage.delete('documents/report.pdf');

// Get usage statistics
const stats = await storage.getUsageStats();
console.log(`Using ${stats.totalSize} bytes across ${stats.totalFiles} files`);
```

## Storage Tiers

The system supports automatic tiering based on access patterns:

| Tier    | Description                          | Access Threshold | Typical Cost/GB |
|---------|--------------------------------------|------------------|-----------------|
| Hot     | Frequently accessed (< 7 days)       | < 7 days         | $0.023          |
| Warm    | Occasionally accessed (7-30 days)    | 7-30 days        | $0.0125         |
| Cold    | Rarely accessed (30-90 days)         | 30-90 days       | $0.004          |
| Archive | Long-term storage (> 90 days)        | > 90 days        | $0.001          |

### Auto-Tiering

Enable automatic tiering to optimize costs:

```typescript
// Run auto-tiering (can be scheduled via cron)
const result = await storage.performAutoTiering();
console.log(`Moved ${result.moved} files, ${result.errors} errors`);
```

## Deduplication

Enable deduplication to automatically detect and prevent duplicate uploads:

```typescript
// Deduplication happens automatically when enabled
const result = await storage.upload('copy-of-report.pdf', fileBuffer);

if (result.etag === existingFile.etag) {
  console.log('Deduplicated - no additional storage used!');
}
```

Deduplication uses SHA-256 hashing and reference counting, so deleting one reference doesn't affect others.

## Migration

Migrate files between storage providers:

```typescript
const migrationJob = await storage.migrateFiles(
  'local',      // source provider
  's3',         // target provider
  {
    deleteSource: true,
    onProgress: (progress) => {
      console.log(`${progress.completed}/${progress.total} files migrated`);
    }
  }
);

// Migration runs in background
console.log(`Migration job ${migrationJob.id} started`);
```

## API Endpoints

The storage admin routes provide REST API access:

### File Operations
- `POST /api/storage/upload` - Upload file
- `GET /api/storage/download/:key` - Download file
- `GET /api/storage/url/:key` - Get presigned URL
- `DELETE /api/storage/delete/:key` - Delete file
- `GET /api/storage/list` - List files

### Batch Operations
- `POST /api/storage/batch/upload` - Upload multiple files
- `POST /api/storage/batch/delete` - Delete multiple files

### Management
- `GET /api/storage/stats` - Get usage statistics
- `GET /api/storage/config` - Get configuration
- `GET /api/storage/health` - Health check
- `POST /api/storage/migrate` - Start migration job
- `POST /api/storage/tier/auto` - Run auto-tiering

## Error Handling

The system provides specific error types:

```typescript
import {
  FileNotFoundError,
  FileAlreadyExistsError,
  QuotaExceededError,
  InvalidFileTypeError
} from './storage';

try {
  await storage.upload(key, data);
} catch (error) {
  if (error instanceof QuotaExceededError) {
    console.error('Storage quota exceeded');
  } else if (error instanceof FileAlreadyExistsError) {
    console.error('File already exists');
  }
}
```

## Performance Optimization

### Multipart Uploads

Files >100MB automatically use multipart/chunked uploads:

```typescript
// Automatically uses multipart for large files
const result = await storage.upload('large-video.mp4', videoStream, {
  onProgress: (progress) => {
    console.log(`${progress.percentage.toFixed(2)}% uploaded`);
    console.log(`Part ${progress.part}/${progress.totalParts}`);
  }
});
```

### Streaming

Use streams for memory-efficient handling:

```typescript
import { createReadStream } from 'fs';

// Upload from file stream
const readStream = createReadStream('large-file.bin');
await storage.upload('uploads/large-file.bin', readStream);

// Download to file stream
const download = await storage.download('uploads/large-file.bin');
const writeStream = createWriteStream('downloaded-file.bin');
download.stream.pipe(writeStream);
```

## Security

### Access Control

Files support granular permissions:

```typescript
await storage.upload('confidential.pdf', data, {
  metadata: {
    permissions: {
      read: ['user123', 'user456'],
      write: ['user123'],
      delete: ['admin'],
      public: false
    }
  }
});
```

### Presigned URLs

Generate temporary signed URLs for secure access:

```typescript
// URL expires in 1 hour
const url = await storage.getUrl('document.pdf', {
  expiresIn: 3600,
  contentDisposition: 'attachment',
  filename: 'download.pdf'
});
```

## Monitoring

### Usage Tracking

Monitor storage usage per tier and provider:

```typescript
const stats = await storage.getUsageStats();

console.log(`Total: ${stats.totalSize} bytes, ${stats.totalFiles} files`);
console.log(`Quota used: ${stats.quotaUsedPercent}%`);

// By tier
for (const [tier, info] of Object.entries(stats.byTier)) {
  console.log(`${tier}: ${info.files} files, ${info.size} bytes`);
}

// By provider
for (const [provider, info] of Object.entries(stats.byProvider)) {
  console.log(`${provider}: ${info.files} files, ${info.size} bytes`);
}
```

### Health Checks

```typescript
// Via API
GET /api/storage/health

// Response
{
  "success": true,
  "data": {
    "status": "healthy",
    "provider": "s3",
    "totalFiles": 1523,
    "totalSize": 5368709120,
    "quotaUsed": 5.0,
    "features": {
      "enableDeduplication": true,
      "enableAutoTiering": true,
      "enableFailover": true
    }
  }
}
```

## Database Schema

The system uses PostgreSQL tables for tracking:

```sql
-- File tracking
CREATE TABLE storage_files (
  key VARCHAR(1024) PRIMARY KEY,
  size BIGINT NOT NULL,
  provider VARCHAR(50) NOT NULL,
  tier VARCHAR(20) NOT NULL,
  hash VARCHAR(64),                -- SHA-256 for deduplication
  reference_key VARCHAR(1024),     -- Reference for deduplicated files
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  last_accessed_at TIMESTAMP DEFAULT NOW(),
  access_count INT DEFAULT 0,
  deleted_at TIMESTAMP
);

-- Migration jobs
CREATE TABLE storage_migrations (
  id UUID PRIMARY KEY,
  source_provider VARCHAR(50) NOT NULL,
  target_provider VARCHAR(50) NOT NULL,
  status VARCHAR(20) NOT NULL,
  total_files INT DEFAULT 0,
  completed_files INT DEFAULT 0,
  failed_files INT DEFAULT 0,
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  error TEXT
);
```

## Testing

Example test for storage adapter:

```typescript
import { LocalStorageAdapter } from './storage/adapters/LocalStorageAdapter';

describe('LocalStorageAdapter', () => {
  let adapter: LocalStorageAdapter;

  beforeAll(async () => {
    adapter = new LocalStorageAdapter({
      provider: 'local',
      local: { storagePath: './test-storage' }
    });
    await adapter.initialize();
  });

  it('should upload and download a file', async () => {
    const data = Buffer.from('Hello, World!');
    const result = await adapter.upload('test.txt', data);

    expect(result.key).toBe('test.txt');
    expect(result.size).toBe(data.length);

    const download = await adapter.download('test.txt');
    const chunks = [];
    for await (const chunk of download.stream) {
      chunks.push(chunk);
    }
    const downloaded = Buffer.concat(chunks);

    expect(downloaded.toString()).toBe('Hello, World!');
  });
});
```

## Roadmap

Future enhancements:
- [ ] Encryption at rest and in transit
- [ ] Virus scanning integration
- [ ] Thumbnail generation for images
- [ ] Video transcoding
- [ ] WORM (Write Once Read Many) support
- [ ] Version control for files
- [ ] Audit logging
- [ ] WebDAV interface
- [ ] FTP/SFTP gateway

## License

Part of the Fleet Management System. See main project license.
