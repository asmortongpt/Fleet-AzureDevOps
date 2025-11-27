# 3D Vehicle Models System - Setup Guide

This guide will help you set up the comprehensive 3D vehicle model visualization system for the Fleet Management application.

## Overview

The 3D Models System provides:
- **Hybrid Model Sourcing**: Sketchfab API, Azure Blob Storage, and car3d.net support
- **Interactive 3D Viewer**: React Three Fiber with photorealistic rendering
- **Model Library**: Browse, search, and manage 3D models
- **AR Support**: iOS AR Quick Look and Android Scene Viewer
- **Damage Visualization**: Link 3D models to damage reports

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend (React)                      │
│  ┌────────────────────┐  ┌──────────────────────────┐  │
│  │ Vehicle3DViewer    │  │ VehicleModelLibrary      │  │
│  │ - Three.js/R3F     │  │ - Browse/Search          │  │
│  │ - PBR Materials    │  │ - Upload/Download        │  │
│  │ - AR Support       │  │ - Assign to Vehicles     │  │
│  └────────────────────┘  └──────────────────────────┘  │
└──────────────────────┬──────────────────────────────────┘
                       │
                       │ API Calls
                       ▼
┌─────────────────────────────────────────────────────────┐
│                  Backend (Node.js/Express)               │
│  ┌────────────────────────────────────────────────────┐ │
│  │ Routes: /api/v1/models                             │ │
│  │ - List/Search/Upload/Download                      │ │
│  └─────────┬──────────────────────────────────────────┘ │
│            │                                             │
│  ┌─────────▼─────────┐  ┌──────────────────────────┐  │
│  │ Sketchfab Service │  │ Azure Blob Service       │  │
│  │ - Search models   │  │ - Upload/Download        │  │
│  │ - Download GLB    │  │ - CDN URLs               │  │
│  │ - Rate limiting   │  │ - SAS tokens             │  │
│  └───────────────────┘  └──────────────────────────┘  │
└─────────────────────┬───────────────────────────────────┘
                       │
                       │ SQL Queries
                       ▼
┌─────────────────────────────────────────────────────────┐
│              PostgreSQL Database                         │
│  ┌────────────────────────────────────────────────────┐ │
│  │ vehicle_3d_models                                  │ │
│  │ - Model metadata & file URLs                       │ │
│  │ - Search indexes & full-text                       │ │
│  │                                                      │ │
│  │ vehicles.model_3d_id (FK)                          │ │
│  │ - Link vehicles to 3D models                       │ │
│  └────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

## Prerequisites

### Required
- Node.js 20.x or higher
- PostgreSQL 14.x or higher
- Azure Account (for Blob Storage)
- Git

### Optional
- Sketchfab API token (for automated imports)
- Car3D.net account (for purchasing premium models)

## Installation

### 1. Backend Setup

#### Install Dependencies

```bash
cd server
npm install
```

This will install:
- `@azure/storage-blob` - Azure Blob Storage SDK
- `multer` - File upload middleware
- `axios` - HTTP client (for Sketchfab API)

#### Run Database Migration

```bash
# Apply migration
npm run migrate:3d-models

# Or manually with psql
psql $DATABASE_URL -f migrations/002_vehicle_3d_models.sql
```

This creates:
- `vehicle_3d_models` table
- `vehicle_3d_model_usage` table
- `vehicle_3d_model_collections` table
- Full-text search indexes
- Helper functions and views

#### Configure Environment Variables

Create or update `.env`:

```bash
# Azure Blob Storage (REQUIRED for uploads)
AZURE_STORAGE_CONNECTION_STRING="DefaultEndpointsProtocol=https;AccountName=YOUR_ACCOUNT;AccountKey=YOUR_KEY;EndpointSuffix=core.windows.net"
AZURE_STORAGE_CONTAINER_NAME="vehicle-models"
AZURE_CDN_ENDPOINT="https://YOUR_CDN.azureedge.net"  # Optional

# Sketchfab API (OPTIONAL - for free model imports)
SKETCHFAB_API_KEY="your_api_token_here"  # Optional

# Database
DATABASE_URL="postgresql://user:password@localhost:5432/fleet_management"
```

#### Seed Initial Models (Optional)

```bash
# Import ~30 free models from Sketchfab
npm run seed:3d-models
```

This will:
- Search Sketchfab for free CC0 vehicle models
- Download GLB files
- Upload to Azure Blob Storage
- Populate database with metadata
- Takes ~10-15 minutes (rate-limited)

### 2. Frontend Setup

#### Install Dependencies

The required Three.js packages are already in `package.json`:

```json
{
  "@react-three/drei": "^9.122.0",
  "@react-three/fiber": "^8.18.0",
  "@react-three/postprocessing": "^2.16.3",
  "three": "^0.181.2"
}
```

If not installed:

```bash
cd /path/to/frontend
npm install
```

#### Configure Environment Variables

Create or update `.env`:

```bash
# Feature Flags
VITE_ENABLE_3D_MODELS=true
VITE_ENABLE_AR_VIEW=true

# API Endpoint
VITE_API_URL=http://localhost:3000/api/v1

# Model Settings
VITE_MAX_MODEL_FILE_SIZE_MB=100
VITE_DEFAULT_MODEL_QUALITY=medium
```

### 3. Azure Blob Storage Setup

#### Create Storage Account

```bash
# Using Azure CLI
az storage account create \
  --name fleetmodels \
  --resource-group YourResourceGroup \
  --location eastus \
  --sku Standard_LRS \
  --kind StorageV2

# Get connection string
az storage account show-connection-string \
  --name fleetmodels \
  --resource-group YourResourceGroup
```

#### Create Container

```bash
# Create container with public blob access
az storage container create \
  --name vehicle-models \
  --account-name fleetmodels \
  --public-access blob
```

#### Configure CORS (for web access)

```bash
az storage cors add \
  --account-name fleetmodels \
  --services b \
  --methods GET HEAD OPTIONS \
  --origins "*" \
  --allowed-headers "*" \
  --exposed-headers "*" \
  --max-age 86400
```

#### Optional: Setup CDN

```bash
# Create CDN profile
az cdn profile create \
  --name fleet-cdn \
  --resource-group YourResourceGroup \
  --sku Standard_Microsoft

# Create CDN endpoint
az cdn endpoint create \
  --name fleet-models-cdn \
  --profile-name fleet-cdn \
  --resource-group YourResourceGroup \
  --origin fleetmodels.blob.core.windows.net \
  --origin-host-header fleetmodels.blob.core.windows.net
```

### 4. Verify Installation

#### Test Backend API

```bash
# Start backend
cd server
npm run dev

# Test endpoints
curl http://localhost:3000/api/v1/models
curl http://localhost:3000/api/v1/models/featured
curl http://localhost:3000/api/v1/models/search?q=toyota
```

#### Test Frontend

```bash
# Start frontend
cd /path/to/frontend
npm run dev

# Navigate to:
# http://localhost:5173/models
# http://localhost:5173/vehicles/{id}/3d
```

## Usage

### 1. Browse Model Library

Navigate to: **Settings → 3D Model Library**

You can:
- Browse all available models
- Search by make, model, or keywords
- Filter by vehicle type, source, quality
- View featured and popular models
- Preview 3D models inline
- Download models

### 2. Upload Custom Model

**From car3d.net or other sources:**

1. Click "Upload Model" button
2. Select GLB/GLTF file (max 100MB)
3. Fill in details:
   - Name: "Ford F-150 2024 XLT"
   - Vehicle Type: Truck
   - Make: Ford
   - Model: F-150
   - Year: 2024
   - Tags: pickup, commercial
4. Click "Upload"
5. Model is uploaded to Azure and saved to database

**File requirements:**
- Format: GLB (recommended), GLTF, FBX, OBJ
- Max size: 100MB
- Recommended poly count: 50k-150k triangles
- Textures: Embedded (GLB) or PBR materials

### 3. Assign Model to Vehicle

**Method A: From Vehicle Details**
1. Navigate to vehicle (e.g., Vehicle #1234)
2. Click "3D View" tab
3. Click "Assign Model"
4. Search and select model
5. Click "Save"

**Method B: From Model Library**
1. Browse to desired model
2. Click model card
3. Click "Assign to Vehicle"
4. Select vehicle from dropdown
5. Click "Assign"

### 4. View 3D Model

In vehicle details page:
1. Click "3D View" tab
2. Interactive controls:
   - **Rotate**: Click and drag
   - **Zoom**: Scroll wheel
   - **Pan**: Right-click and drag
   - **Camera presets**: Front, Rear, Side, Top
   - **Environment**: Studio, Sunset, City, Night
   - **Customize**: Change paint color
   - **Settings**: Quality, post-processing

### 5. AR View (Mobile)

**iOS:**
1. Open vehicle on iPhone/iPad
2. Click "View in AR"
3. Model opens in AR Quick Look
4. Place in real world

**Android:**
1. Open vehicle on Android device
2. Click "View in AR"
3. Model opens in Scene Viewer
4. Place in real world

### 6. Import from Sketchfab

```bash
# Find model on Sketchfab
# Copy model UID from URL: https://sketchfab.com/3d-models/MODEL_UID

# Import via API
curl -X POST http://localhost:3000/api/v1/models/import-sketchfab \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"uid":"MODEL_UID","saveToAzure":true}'
```

Or use the admin interface (if implemented).

## Configuration

### Performance Tuning

Edit `src/components/Vehicle3DViewer.tsx`:

```typescript
// Adjust quality settings
const [quality, setQuality] = useState<'low' | 'medium' | 'high'>('medium');

// Quality presets affect:
// - Shadow map resolution
// - Post-processing effects
// - Texture resolution
// - Anti-aliasing samples
```

### Model Quality Guidelines

| Device | Quality | Shadow Map | DPR | Post-FX |
|--------|---------|------------|-----|---------|
| Desktop | High | 2048 | 2.0 | Full |
| Laptop | Medium | 1024 | 1.5 | SSAO+Bloom |
| Mobile | Low | 512 | 1.0 | None |

### Storage Limits

Set in `.env`:

```bash
# Max file size for uploads
VITE_MAX_MODEL_FILE_SIZE_MB=100

# Azure Blob Storage quota (set in Azure Portal)
# Recommended: 100GB for ~500-1000 models
```

## Troubleshooting

### Issue: "Failed to upload to Azure"

**Cause**: Invalid connection string or container doesn't exist

**Solution**:
```bash
# Verify connection string
az storage account show-connection-string --name fleetmodels

# Verify container exists
az storage container list --account-name fleetmodels

# Recreate container if needed
az storage container create --name vehicle-models --account-name fleetmodels
```

### Issue: "Model doesn't load in viewer"

**Cause**: Invalid GLB file or CORS issue

**Solution**:
```bash
# Test GLB file
# Visit: https://gltf-viewer.donmccurdy.com/
# Drag and drop your GLB file

# Check CORS settings
az storage cors list --account-name fleetmodels --services b

# If missing, add CORS (see Azure setup above)
```

### Issue: "Sketchfab rate limit exceeded"

**Cause**: Too many API requests (60/min limit)

**Solution**:
- Wait 1 minute and retry
- Get Sketchfab API token (increases limit to 120/min)
- Reduce concurrent imports in seed script

### Issue: "Out of memory" when uploading large model

**Cause**: Node.js memory limit

**Solution**:
```bash
# Increase Node.js memory
NODE_OPTIONS="--max-old-space-size=4096" npm run dev

# Or compress model first:
# Use Blender → File → Export → glTF → Export glTF → Compression: Draco
```

## Best Practices

### Model Optimization

1. **Use GLB format** - Single file, web-optimized
2. **Keep poly count reasonable** - 50k-150k for medium quality
3. **Compress textures** - Use 1K-2K resolution, JPEG for color
4. **Use PBR materials** - For photorealistic rendering
5. **Test before upload** - Use online GLB viewer

### Security

1. **Validate file types** - Only GLB, GLTF, FBX, OBJ
2. **Scan for malware** - Implement virus scanning (optional)
3. **Rate limit uploads** - Prevent abuse
4. **Use SAS tokens** - For temporary download URLs
5. **Enable audit logging** - Track model uploads/deletions

### Performance

1. **Enable CDN** - Faster global delivery
2. **Set cache headers** - 1 year for immutable models
3. **Use progressive loading** - Load low-res first, then high-res
4. **Implement LOD** - Multiple quality levels per model
5. **Lazy load viewer** - Code-split Vehicle3DViewer component

## API Reference

See full API documentation in `/docs/API_3D_MODELS.md`

Quick reference:

```bash
# List models
GET /api/v1/models?search=ford&vehicleType=truck&limit=20

# Get model
GET /api/v1/models/{id}

# Upload model
POST /api/v1/models/upload
Content-Type: multipart/form-data

# Download model
GET /api/v1/models/{id}/download

# Assign to vehicle
POST /api/v1/models/vehicles/{vehicleId}/assign-model
Body: {"modelId": "uuid"}

# Search
GET /api/v1/models/search?q=toyota

# Featured models
GET /api/v1/models/featured

# Popular models
GET /api/v1/models/popular
```

## Support

- **Documentation**: `/docs` folder
- **Issues**: GitHub Issues with "3D Models" label
- **Email**: support@capitaltechalliance.com

## License

MIT License - See LICENSE file

## Changelog

- **2025-11-27**: Initial 3D models system implementation
  - Sketchfab API integration
  - Azure Blob Storage service
  - Vehicle3DViewer component
  - VehicleModelLibrary component
  - Database schema and migrations
  - Seeding scripts
  - Documentation

---

**Next Steps**: See `CAR3D_INTEGRATION.md` for purchasing and uploading professional models from car3d.net
