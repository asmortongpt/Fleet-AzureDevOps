# Fleet CTA - 3D Models Storage Inventory

**Document Version**: 1.0
**Last Updated**: February 5, 2026
**Maintainer**: Fleet CTA Development Team

---

## Executive Summary

This document provides a complete inventory of all 3D vehicle models for the Fleet CTA application, including storage locations, file specifications, and retrieval instructions.

**Total Assets**: 213 MB of photorealistic 3D models
**Primary Storage**: Azure Blob Storage + Git LFS
**Archive Branch**: `archive/3d-models-photorealistic`

---

## Storage Architecture

### 1. Production Models (Deployed)
**Location**: `public/models/vehicles/` (main branch)
**Purpose**: Models actively used in production application
**Status**: Deployed to Azure Static Web Apps
**Size**: ~30 MB

**Files**:
- `avocado.glb` - Test model
- `damaged_helmet.glb` - Test model
- `milk_truck.glb` - Test model
- `electric_sedans/chevrolet_bolt_ev.glb` - Production vehicle

### 2. Photorealistic Archive (NOT Deployed)
**Location**: Multiple locations (see below)
**Purpose**: High-quality models for future use
**Status**: Archived, not deployed
**Size**: 210 MB (24 files)

---

## Archive Storage Locations

### Location 1: Azure Blob Storage (Primary Archive)

**Account**: `fleetmgmtstorage2025`
**Container**: `vehicle-3d-models`
**Resource Group**: `fleet-production-rg`
**Region**: East US 2

**Archive File**:
- **Name**: `fleet-photorealistic-models-20260205.tar.gz`
- **Size**: 109 MB (compressed from 210 MB)
- **Format**: Tar + Gzip
- **Upload Date**: February 5, 2026 at 17:15:42 UTC
- **MD5**: `1cd41db5baa0c9cfec656bedb2776ca6`
- **ETag**: `"0x8DE64DA31591296"`

**Access URL**:
```
https://fleetmgmtstorage2025.blob.core.windows.net/vehicle-3d-models/fleet-photorealistic-models-20260205.tar.gz
```

**Download Instructions**:
```bash
# Using Azure CLI
az storage blob download \
  --account-name fleetmgmtstorage2025 \
  --container-name vehicle-3d-models \
  --name fleet-photorealistic-models-20260205.tar.gz \
  --file ~/Downloads/fleet-photorealistic-models.tar.gz

# Extract archive
cd ~/Downloads
tar -xzf fleet-photorealistic-models.tar.gz
```

**Billing**: Hot tier, standard redundancy (LRS)

---

### Location 2: Git Repository Archive Branch

**Repository**: `asmortongpt/Fleet-AzureDevOps`
**Branch**: `archive/3d-models-photorealistic`
**Remote**: GitHub
**LFS**: Enabled

**Branch URL**:
```
https://github.com/asmortongpt/Fleet-AzureDevOps/tree/archive/3d-models-photorealistic
```

**Checkout Instructions**:
```bash
# Clone repository
git clone https://github.com/asmortongpt/Fleet-AzureDevOps.git
cd Fleet-AzureDevOps

# Checkout archive branch
git checkout archive/3d-models-photorealistic

# Pull LFS files
git lfs pull

# Models available at:
# - output/photorealistic_fleet/*.glb
# - public/models/vehicles/construction/*.glb
# - public/models/vehicles/trucks/freightliner_cascadia.glb
```

**Documentation**: See `ARCHIVE_README.md` in the archive branch

---

### Location 3: Local Working Directory

**Path**: `/Users/andrewmorton/Documents/GitHub/Fleet-CTA/`

**Directories**:
- `output/photorealistic_fleet/` - Ford F-150 Lightning variants
- `public/models/vehicles/construction/` - Construction equipment
- `public/models/vehicles/trucks/` - Commercial trucks

**Status**: Models tracked by Git LFS but not committed to main branch

---

## Archive Contents Breakdown

### Category 1: Ford F-150 Lightning Photorealistic Models
**Location**: `output/photorealistic_fleet/`
**Count**: 12 files
**Total Size**: ~120 MB

| Color | Wear Level | Filename | Size |
|-------|-----------|----------|------|
| Antimatter Blue | Pristine | `Ford_F150_Lightning_2025_Antimatter_Blue_pristine.glb` | 9.9 MB |
| Antimatter Blue | Light | `Ford_F150_Lightning_2025_Antimatter_Blue_light.glb` | 9.9 MB |
| Antimatter Blue | Medium | `Ford_F150_Lightning_2025_Antimatter_Blue_medium.glb` | 10 MB |
| Antimatter Blue | Heavy | `Ford_F150_Lightning_2025_Antimatter_Blue_heavy.glb` | 10 MB |
| Carbonized Gray | Pristine | `Ford_F150_Lightning_2025_Carbonized_Gray_pristine.glb` | 10 MB |
| Carbonized Gray | Light | `Ford_F150_Lightning_2025_Carbonized_Gray_light.glb` | 10 MB |
| Carbonized Gray | Medium | `Ford_F150_Lightning_2025_Carbonized_Gray_medium.glb` | 11 MB |
| Carbonized Gray | Heavy | `Ford_F150_Lightning_2025_Carbonized_Gray_heavy.glb` | 11 MB |
| Oxford White | Pristine | `Ford_F150_Lightning_2025_Oxford_White_pristine.glb` | 10 MB |
| Oxford White | Light | `Ford_F150_Lightning_2025_Oxford_White_light.glb` | 10 MB |
| Oxford White | Medium | `Ford_F150_Lightning_2025_Oxford_White_medium.glb` | 10 MB |
| Oxford White | Heavy | `Ford_F150_Lightning_2025_Oxford_White_heavy.glb` | 10 MB |

**Specifications**:
- **Format**: GLB (Binary glTF 2.0)
- **Polygons**: 200K-500K triangles
- **Textures**: 4K embedded (diffuse, normal, metallic, roughness)
- **Materials**: PBR (Physically Based Rendering)
- **Features**: LOD variants based on wear level

---

### Category 2: Construction & Commercial Vehicles
**Location**: `public/models/vehicles/construction/` and `public/models/vehicles/trucks/`
**Count**: 12 files
**Total Size**: ~90 MB

| Vehicle | Filename | Size | Category |
|---------|----------|------|----------|
| Altech AH-350 Hauler | `altech_ah_350_hauler.glb` | 12 MB | Construction |
| Altech CM-3000 Mixer | `altech_cm_3000_mixer.glb` | 12 MB | Construction |
| Altech HD-40 Dump Truck | `altech_hd_40_dump_truck.glb` | 11 MB | Construction |
| Caterpillar 320 | `caterpillar_320.glb` | ~8 MB | Construction |
| Hitachi ZX210 | `hitachi_zx210.glb` | ~8 MB | Construction |
| John Deere 200G | `john_deere_200g.glb` | ~8 MB | Construction |
| Kenworth T880 | `kenworth_t880.glb` | ~8 MB | Construction |
| Komatsu PC210 | `komatsu_pc210.glb` | ~8 MB | Construction |
| Mack Granite | `mack_granite.glb` | ~8 MB | Construction |
| Peterbilt 567 | `peterbilt_567.glb` | ~8 MB | Construction |
| Volvo EC220 | `volvo_ec220.glb` | ~8 MB | Construction |
| Freightliner Cascadia | `freightliner_cascadia.glb` | 12 MB | Commercial Truck |

---

## Historical Context: The "Missing 12GB"

### What Was Searched For
During development, Git LFS reported 1,041 missing objects totaling an estimated 12 GB:
- 900+ models in `output/complete_usa_fleet_2015/` through `output/complete_usa_fleet_2025/`
- 4 ZIP archives in `incoming_data/`
- Texture packs in `textures/MetalPaint001_8K.zip`

### What Was Found
**Reality**: These files never existed as full photorealistic models.

**Findings**:
1. **Fleet-Demo Repository**: Contains `complete_usa_fleet_YYYY` directories with **lightweight placeholder models** (~22 KB each, not 8-12 MB)
2. **Azure Blob Storage**: Contains only the 153 lightweight models from Fleet-Demo (4 MB total)
3. **GitHub LFS**: Never received the binary data for the 1,041 referenced objects
4. **Azure DevOps LFS**: Also shows 404 errors for the same objects

**Conclusion**:
The "12 GB of photorealistic models" only existed as **Git LFS pointer files** in commit history. The actual binary data was never generated or uploaded. Only the 24 photorealistic models documented in this inventory were created and are now archived.

---

## File Format Specifications

### GLB (Binary glTF)
- **Version**: glTF 2.0
- **Binary Format**: Single-file container with embedded textures
- **Compatibility**: Three.js, Babylon.js, Unity, Unreal Engine, WebGL
- **Browser Support**: All modern browsers with WebGL 2.0

### Model Features
- **PBR Materials**: Metallic-roughness workflow
- **Texture Maps**:
  - Base Color (diffuse)
  - Normal (surface detail)
  - Metallic (metal vs non-metal)
  - Roughness (surface smoothness)
- **Optimization**: Draco compression supported (not currently enabled)

---

## Usage Guidelines

### ⚠️ Important: Do NOT Deploy Archive Models to Production

The photorealistic models in the archive are:
- **Too large** for web deployment (~10 MB each)
- **Not optimized** for streaming
- **Stored for reference** and future optimization

### Recommended Production Workflow

1. **Select Models Needed**: Choose specific vehicles from archive
2. **Optimize for Web**:
   - Reduce polygon count (target: <100K triangles)
   - Compress textures (target: 2K or 1K resolution)
   - Apply Draco compression
   - Generate LOD variants
3. **Upload to CDN**: Use Azure CDN or Cloudflare for model delivery
4. **Reference by URL**: Load models dynamically in application

### Optimization Tools
- **gltf-pipeline**: CLI tool for glTF optimization
- **glTF-Transform**: JavaScript API for model processing
- **Blender**: Open-source 3D software for manual optimization

---

## Access Control

### Azure Blob Storage
- **Authentication**: Azure AD or Storage Account Key
- **Public Access**: Disabled (container-level security)
- **Required Role**: Storage Blob Data Reader (minimum)

### GitHub Repository
- **Authentication**: GitHub Personal Access Token or SSH key
- **LFS Access**: Included with repository access
- **Branch Protection**: None (archive branch can be deleted if needed)

---

## Backup & Disaster Recovery

### Primary Backup
- **Location**: Azure Blob Storage (Hot tier)
- **Redundancy**: Locally Redundant Storage (LRS)
- **Retention**: Indefinite (manual deletion required)

### Secondary Backup
- **Location**: Git repository archive branch
- **Redundancy**: GitHub's infrastructure (3+ copies)
- **Retention**: Persists with repository

### Tertiary Backup
- **Location**: Local development machine
- **Path**: `/Users/andrewmorton/Documents/GitHub/Fleet-CTA/`
- **Retention**: Until local cleanup

### Recovery Procedure
1. Download from Azure Blob Storage (fastest)
2. If Azure unavailable, checkout Git archive branch
3. If both unavailable, check local development machine

---

## Cost Analysis

### Azure Blob Storage Costs (Hot Tier)
- **Storage**: 109 MB × $0.018/GB/month = **$0.002/month**
- **Download**: First 100 GB free per month = **$0.00**
- **Operations**: Minimal (rare access) = **~$0.00**
- **Total**: **<$0.01/month**

### GitHub LFS Costs
- **Storage**: 210 MB (within free tier: 1 GB)
- **Bandwidth**: Minimal (archive branch rarely accessed)
- **Total**: **$0.00/month** (within GitHub free tier)

### Overall Storage Cost
**Total**: **<$0.01/month** for complete archive

---

## Maintenance Schedule

| Task | Frequency | Responsible |
|------|-----------|-------------|
| Verify Azure Blob availability | Quarterly | DevOps Team |
| Test download procedures | Quarterly | Development Team |
| Review storage costs | Monthly | Finance Team |
| Update documentation | As needed | Development Team |
| Archive old model versions | Annually | Development Team |

---

## Future Enhancements

### Planned Improvements
1. **Model Optimization Pipeline**: Automated web optimization for archive models
2. **CDN Integration**: Direct CDN upload for production-ready models
3. **Model Variants**: Generate LOD (Level of Detail) versions automatically
4. **Metadata Database**: Searchable catalog of all available models
5. **Preview Service**: Web-based 3D viewer for archived models

### Additional Vehicle Types Needed
- Electric sedans (Tesla Model 3, Model S)
- SUVs (Tahoe, Suburban, Explorer)
- Vans (Transit, Sprinter, ProMaster)
- Specialty vehicles (street sweepers, refuse trucks, bucket trucks)

---

## Support & Contact

**Questions about this inventory?**
Contact: Fleet CTA Development Team
Email: [Internal team contact]
Slack: #fleet-cta-development

**Azure Storage Access Issues?**
Contact: DevOps Team
Portal: [Azure Portal](https://portal.azure.com)

**Git LFS Issues?**
Documentation: [Git LFS Documentation](https://git-lfs.github.com)

---

## Appendix A: Quick Reference Commands

### Download from Azure
```bash
az storage blob download \
  --account-name fleetmgmtstorage2025 \
  --container-name vehicle-3d-models \
  --name fleet-photorealistic-models-20260205.tar.gz \
  --file ./fleet-models.tar.gz
```

### Checkout Archive Branch
```bash
git checkout archive/3d-models-photorealistic
git lfs pull
```

### List Archive Contents
```bash
tar -tzf fleet-photorealistic-models-20260205.tar.gz
```

### Extract Specific File
```bash
tar -xzf fleet-photorealistic-models-20260205.tar.gz \
  "output/photorealistic_fleet/Ford_F150_Lightning_2025_Oxford_White_pristine.glb"
```

---

## Appendix B: Git LFS Configuration

Current `.gitattributes` configuration:
```
*.glb filter=lfs diff=lfs merge=lfs -text
*.gltf filter=lfs diff=lfs merge=lfs -text
*.obj filter=lfs diff=lfs merge=lfs -text
*.fbx filter=lfs diff=lfs merge=lfs -text
*.mp4 filter=lfs diff=lfs merge=lfs -text
*.webm filter=lfs diff=lfs merge=lfs -text
*.zip filter=lfs diff=lfs merge=lfs -text
*.tar.gz filter=lfs diff=lfs merge=lfs -text
*.png filter=lfs diff=lfs merge=lfs -text
*.jpg filter=lfs diff=lfs merge=lfs -text
*.jpeg filter=lfs diff=lfs merge=lfs -text
```

---

**Document End**

*This inventory is maintained as part of the Fleet CTA project documentation.*
*For updates, please submit a pull request to the main branch.*
