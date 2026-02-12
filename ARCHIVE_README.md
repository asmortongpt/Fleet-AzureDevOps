# 3D Models Archive Branch

This branch preserves photorealistic 3D vehicle models for the Fleet Management system.

## Purpose
This is an **archive-only branch** - these models are NOT deployed to production.
Models are stored here for future use and reference.

## Contents

### Photorealistic Ford F-150 Lightning Models (12 files)
- **Location**: `output/photorealistic_fleet/`
- **Variants**: 3 colors × 4 wear levels = 12 models
- **Colors**: Antimatter Blue, Carbonized Gray, Oxford White
- **Wear Levels**: pristine, light, medium, heavy
- **File Size**: 9.9MB - 11MB each
- **Total Size**: ~120MB

### Construction & Commercial Vehicles (12 files)
- **Location**: `public/models/vehicles/construction/`, `public/models/vehicles/trucks/`
- **Vehicles**:
  - Altech AH-350 Hauler (12MB)
  - Altech CM-3000 Mixer (12MB)
  - Altech HD-40 Dump Truck (11MB)
  - Caterpillar 320 Excavator
  - Hitachi ZX210 Excavator
  - John Deere 200G Excavator
  - Kenworth T880 Heavy Duty Truck
  - Komatsu PC210 Excavator
  - Mack Granite Heavy Duty Truck
  - Peterbilt 567 Heavy Duty Truck
  - Volvo EC220 Excavator
  - Freightliner Cascadia Semi Truck (12MB)
- **Total Size**: ~90MB

## Total Archive Size
- **Files**: 24 GLB models
- **Size**: ~210MB (stored in Git LFS)
- **Archive**: fleet-photorealistic-models-20260205.tar.gz (109MB compressed)

## Storage Locations

### 1. Git Repository (This Branch)
- **Branch**: `archive/3d-models-photorealistic`
- **Remote**: GitHub (asmortongpt/Fleet-AzureDevOps)
- **URL**: https://github.com/asmortongpt/Fleet-AzureDevOps/tree/archive/3d-models-photorealistic

### 2. Azure Blob Storage
- **Account**: fleetmgmtstorage2025
- **Container**: vehicle-3d-models
- **File**: fleet-photorealistic-models-20260205.tar.gz
- **Size**: 109MB (compressed)
- **URL**: https://fleetmgmtstorage2025.blob.core.windows.net/vehicle-3d-models/fleet-photorealistic-models-20260205.tar.gz
- **Uploaded**: February 5, 2026

### 3. Git LFS Storage
- **Provider**: GitHub LFS
- **Bandwidth**: Included in GitHub plan
- **Files**: All .glb files tracked automatically

## How to Retrieve Models

### Option 1: Download from Azure Blob Storage
```bash
az storage blob download \
  --account-name fleetmgmtstorage2025 \
  --container-name vehicle-3d-models \
  --name fleet-photorealistic-models-20260205.tar.gz \
  --file fleet-photorealistic-models.tar.gz

tar -xzf fleet-photorealistic-models.tar.gz
```

### Option 2: Checkout Git Branch
```bash
git checkout archive/3d-models-photorealistic
git lfs pull
```

## File Specifications

### GLB Format
- **Format**: Binary glTF (GL Transmission Format)
- **Features**:
  - Embedded textures
  - PBR materials (Physically Based Rendering)
  - Optimized for real-time 3D rendering
  - Compatible with Three.js, Babylon.js, Unity, Unreal Engine

### Photorealistic Models Details
- **Polygons**: 200K-500K triangles per model
- **Textures**: 4K resolution (diffuse, normal, metallic, roughness)
- **LOD Levels**: Multiple detail levels based on filename suffix
- **Format Version**: glTF 2.0

## Usage Notes

⚠️ **DO NOT MERGE THIS BRANCH INTO MAIN**

These models are archived for:
- Future use when needed
- Reference and backup
- On-demand loading scenarios
- Offline demonstrations

To use these models in production:
1. Download specific models needed
2. Optimize for web delivery (compression, LOD)
3. Upload to CDN or static hosting
4. Reference via URL in application

## Maintenance

**Last Updated**: February 5, 2026
**Maintainer**: Fleet CTA Development Team
**Archive Date**: February 5, 2026

## Related Documentation
- See `/docs/3D_MODELS_INVENTORY.md` for complete model inventory
- See `.gitattributes` for LFS configuration
