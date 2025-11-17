# Photorealistic 3D Car Model Library Guide

## Overview

This guide provides curated sources for photorealistic, stock 3D car models compatible with the Fleet Management System's photorealistic 3D viewer. All models listed work with our Three.js/React Three Fiber implementation with PBR materials and clearcoat shaders.

---

## Format Requirements

**Required Format**: GLB (GL Binary) or GLTF (GL Transmission Format)
- Native Three.js support
- Embedded textures and materials
- PBR material workflow compatible
- Optimized for web delivery

**Recommended Specifications**:
- Polygon count: 10K-100K triangles (optimized for web)
- Texture resolution: 2K-4K (2048x2048 to 4096x4096)
- PBR material channels: Base Color, Metallic, Roughness, Normal
- File size: <50MB per vehicle (for fast loading)

---

## Free Sources (CC0 & Open License)

### 1. Sketchfab
**URL**: https://sketchfab.com/categories/cars-vehicles

**Highlights**:
- 800,000+ free downloadable models under Creative Commons
- All models exportable to glTF/GLB format
- Search filters for quality, poly count, and PBR materials
- Community ratings and reviews

**Best For**: Quick prototyping, diverse vehicle types

**How to Download**:
1. Search for vehicle type (e.g., "sedan", "SUV", "truck")
2. Filter by "Downloadable" and sort by "Most Liked"
3. Check license (CC-BY, CC0 recommended for commercial use)
4. Download in glTF format
5. Import into Fleet Management `/public/models/` directory

**Recommended Searches**:
- "car gltf PBR"
- "sedan photorealistic"
- "SUV low poly"
- "truck fleet vehicle"

**Example Models**:
- Sedan Car (FetchCFD): https://fetchcfd.com/threeDViewGltf/1500
- Car.glb by abhijeetkushwah114

---

### 2. Poly Haven
**URL**: https://polyhaven.com/models

**Highlights**:
- CC0 license (100% free for any use, no attribution required)
- Hyperreal quality for VFX and games
- GLTF, FBX, and USD format support
- Pre-rigged car wheels
- No signup or paywalls

**Best For**: High-quality, production-ready models

**Available Vehicles**:
- Limited but growing collection
- Focus on photorealistic quality
- Optimized for real-time rendering

**How to Download**:
1. Visit https://polyhaven.com/models
2. Filter by "Vehicles" category
3. Select desired vehicle
4. Download in GLTF format (multiple LODs available)
5. Models include PBR textures pre-configured

---

### 3. TurboSquid (Free Collection)
**URL**: https://www.turbosquid.com/3d-model/free/car/gltf

**Highlights**:
- 10+ free glTF car models
- Professional marketplace quality
- Clean UV unwrapped geometry
- Some models include PBR materials

**Best For**: Professional-looking fleet vehicles

**License**: Varies by model (check individual licenses)

---

### 4. 3DTrixs
**URL**: https://3dtrixs.com/3d-models/cars/

**Highlights**:
- Free 3D car models optimized for AR/VR/Metaverse
- GLB and GLTF formats
- Gaming and animation ready
- Multiple vehicle categories

**Best For**: Web-optimized models

---

### 5. RenderHub (Free Section)
**URL**: https://www.renderhub.com/free-3d-models/vehicles

**Highlights**:
- Free section with quality models
- GLTF and GLB support
- Examples: Tesla Cybertruck 2024, Sports Sedan
- Photorealistic textures

**Best For**: Modern, contemporary vehicles

---

## Commercial Sources (Premium Quality)

### 1. CGTrader
**URL**: https://www.cgtrader.com/3d-models/car

**Pricing**: $5-$500+ per model

**Highlights**:
- 90,912+ car models
- 256,500+ glTF models available
- Professional quality with PBR materials
- Free file format conversion service
- Filters for WebGL-optimized models

**Best For**: Enterprise fleet management with specific vehicle needs

**Recommended Collections**:
- Low Poly Vehicles Pack Collection (GLB, PBR)
- Cars and Trucks Collection
- VR/AR ready models

**Popular Models**:
- Sedan: $20-$100
- SUV: $30-$150
- Truck: $40-$200
- Fleet packs: $100-$500

---

### 2. RenderHub (Premium)
**URL**: https://www.renderhub.com/gltf-3d-models/vehicles/cars

**Pricing**: $100-$500+ per model

**Highlights**:
- Photorealistic PBR materials
- GLTF/GLB native format
- 2024 vehicle models available
- High-detail interior and exterior

**Best For**: Showroom-quality visualization

**Example Models**:
- Mercedes CLS 63s Modified: $100
- 1967 Shelby GT500 Eleanor: $140
- Mitsubishi Lancer Evo IX MR: $100
- Nascar Ford Mustang 2024: Photorealistic textures

---

### 3. 88Cars3D
**URL**: https://88cars3d.com/

**Pricing**: Subscription or per-model purchase

**Highlights**:
- Automotive-focused marketplace
- Multiple format support (FBX, OBJ, GLB)
- Professional automotive visualizations
- Accurate dimensions from manufacturer specs

**Best For**: Accurate brand-specific vehicles

---

### 4. TurboSquid (Premium)
**URL**: https://www.turbosquid.com/3d-model/car

**Pricing**: $10-$1000+ per model

**Highlights**:
- Largest 3D model marketplace
- 46,000+ car models
- "CheckMate" certified models (quality guarantee)
- PBR material support
- Enterprise licensing available

**Best For**: Mission-critical applications, brand-specific vehicles

---

## Integration Guide

### Step 1: Download and Prepare Models

```bash
# Create models directory
mkdir -p /Users/andrewmorton/Documents/GitHub/Fleet/public/models/vehicles

# Download model to directory
# (Use browser download or wget/curl)

# Verify file is .glb or .gltf
file vehicle.glb
```

### Step 2: Optimize Model (if needed)

If model is >50MB or has excessive polygons, optimize using:

**Option A: glTF-Transform CLI**
```bash
npm install -g @gltf-transform/cli

# Optimize GLB file
gltf-transform optimize vehicle.glb vehicle-optimized.glb \
  --texture-compress webp \
  --texture-size 2048
```

**Option B: Online Tools**
- glTF Viewer: https://gltf-viewer.donmccurdy.com/
- glTF Pipeline: https://github.khronos.org/glTF-Pipeline/

### Step 3: Add Model to Fleet Management System

**Update Vehicle Database**:
```sql
-- Add new vehicle type with 3D model reference
INSERT INTO vehicles (
  id,
  make,
  model,
  year,
  model_3d_path,
  model_format,
  thumbnail_url
) VALUES (
  uuid_generate_v4(),
  'Ford',
  'F-150',
  2024,
  '/models/vehicles/ford-f150-2024.glb',
  'GLB',
  '/models/vehicles/ford-f150-2024-thumb.jpg'
);
```

**Update React Component** (src/components/Vehicle3DViewer.tsx):

```typescript
// Model loading is already implemented via useGLTF hook
// Just ensure the path is correct in the database

// Current implementation (lines 157-164):
const { scene } = useGLTF(modelPath); // modelPath from database
```

### Step 4: Verify Materials

Our photorealistic shader automatically applies PBR materials to vehicle parts:

```typescript
// Automatic material assignment (lines 165-219):
// - body/paint → Clearcoat automotive paint
// - chrome/trim → Mirror chrome
// - glass/window → Transparent glass with refraction
// - tire/rubber → Matte rubber
// - wheel/rim → Chrome

// If model has non-standard naming, update the material assignment logic
```

### Step 5: Test in Development

```bash
# Start development server
npm run dev

# Navigate to Vehicle 3D Viewer
# Test the new model:
# 1. Verify clearcoat paint renders correctly
# 2. Check chrome reflections
# 3. Confirm glass transparency
# 4. Test rotation and zoom controls
# 5. Verify performance (should be 60 FPS)
```

---

## Model Naming Conventions

For automatic material detection, ensure GLB/GLTF mesh names follow this convention:

```
Vehicle Mesh Naming:
- body, body_*, *_body → Car paint material
- paint, paint_*, *_paint → Car paint material
- chrome, chrome_*, *_chrome → Chrome material
- trim, trim_*, *_trim → Chrome material
- glass, glass_*, *_glass → Glass material
- window, window_*, *_window → Glass material
- windshield → Glass material
- tire, tire_*, *_tire → Rubber material
- rubber, rubber_*, *_rubber → Rubber material
- wheel, wheel_*, *_wheel → Chrome material
- rim, rim_*, *_rim → Chrome material
```

If your model uses different naming, either:
1. Rename meshes in Blender before export
2. Update material assignment logic in `Vehicle3DViewer.tsx` (lines 165-219)

---

## Recommended Fleet Vehicle Library

### Starter Pack (Free)

**Sedan**:
- Search Sketchfab: "sedan car gltf"
- Filter: Downloadable, CC-BY or CC0
- Target: 20-40K polygons

**SUV**:
- Search Sketchfab: "suv gltf"
- Filter: Downloadable, Low-poly
- Target: 30-50K polygons

**Pickup Truck**:
- Search Sketchfab: "pickup truck gltf"
- Filter: Downloadable, PBR
- Target: 25-45K polygons

**Van**:
- Search Sketchfab: "cargo van gltf"
- Filter: Downloadable, Low-poly
- Target: 20-40K polygons

**Total Cost**: $0 (all free with CC licenses)

---

### Professional Pack (Commercial)

**Fleet Vehicles** (CGTrader):
- Ford F-150 2024: ~$50
- Chevrolet Silverado 2024: ~$50
- Toyota Camry 2024: ~$40
- Honda CR-V 2024: ~$40
- Mercedes Sprinter Van: ~$60

**Total Cost**: ~$240 for 5 high-quality models

---

### Enterprise Pack (Premium)

**High-Detail Collection** (TurboSquid CheckMate):
- Ford F-150 Raptor 2024: ~$200
- RAM 2500 HD 2024: ~$200
- Chevrolet Tahoe 2024: ~$180
- Ford Transit 350 2024: ~$150
- Tesla Cybertruck 2024: ~$250

**Total Cost**: ~$980 for 5 photorealistic, brand-accurate models

---

## File Organization

```
/Users/andrewmorton/Documents/GitHub/Fleet/
├── public/
│   └── models/
│       └── vehicles/
│           ├── sedans/
│           │   ├── toyota-camry-2024.glb
│           │   ├── toyota-camry-2024-thumb.jpg
│           │   └── honda-accord-2024.glb
│           ├── suvs/
│           │   ├── ford-explorer-2024.glb
│           │   └── chevrolet-tahoe-2024.glb
│           ├── trucks/
│           │   ├── ford-f150-2024.glb
│           │   └── ram-2500-2024.glb
│           └── vans/
│               ├── ford-transit-2024.glb
│               └── mercedes-sprinter-2024.glb
```

---

## Performance Optimization

### Model Quality Guidelines

| Vehicle Type | Target Polycount | Texture Size | File Size | Load Time |
|-------------|------------------|--------------|-----------|-----------|
| Sedan | 20-40K tris | 2K | <20MB | <1s |
| SUV | 30-50K tris | 2K | <30MB | <1.5s |
| Truck | 30-60K tris | 2K-4K | <40MB | <2s |
| Van | 25-50K tris | 2K | <30MB | <1.5s |

### Optimization Checklist

- [ ] Remove unnecessary interior details (if exterior-only view)
- [ ] Merge materials where possible (max 5 materials per vehicle)
- [ ] Compress textures to 2K or 4K maximum
- [ ] Use Draco compression for GLB files
- [ ] Remove hidden faces/geometry
- [ ] Use LOD (Level of Detail) for complex models

---

## License Compliance

### Free Models (CC0, CC-BY)

**CC0 (Public Domain)**:
- ✅ Use for any purpose (commercial, personal)
- ✅ No attribution required
- ✅ Modify and redistribute freely

**CC-BY (Attribution Required)**:
- ✅ Use for commercial purposes
- ⚠️ Must provide attribution to creator
- ✅ Modify and redistribute (with credit)

**Attribution Format**:
```
"[Model Name]" by [Creator Name] is licensed under CC-BY 4.0
Source: [URL]
```

### Commercial Models

**Standard License** (most marketplaces):
- ✅ Use in single project/product
- ✅ Internal company use
- ❌ Cannot resell or redistribute model itself
- ⚠️ Check if multi-seat license needed

**Enterprise License**:
- ✅ Unlimited projects
- ✅ Multi-seat usage
- ✅ Client work included
- ⚠️ Usually 2-5x standard price

Always read the specific license before purchasing.

---

## Troubleshooting

### Model doesn't load

**Check**:
1. File format is `.glb` or `.gltf` (not `.obj`, `.fbx`)
2. File path in database matches actual file location
3. File size <50MB (or increase Three.js loader limit)
4. CORS headers allow loading from `/public/`

### Materials look wrong

**Check**:
1. Model includes PBR textures (Base Color, Metallic, Roughness, Normal)
2. Mesh naming matches our conventions (body, chrome, glass, tire)
3. Material assignment logic in `Vehicle3DViewer.tsx` lines 165-219
4. Environment map is loaded (HDRI for reflections)

### Performance issues

**Check**:
1. Polygon count <100K triangles
2. Texture size ≤4K
3. Quality preset set appropriately (Low/Medium/High)
4. Only one model loaded at a time
5. Stats component shows <60 FPS

---

## Next Steps

1. **Download starter pack** from Sketchfab (3-5 free models)
2. **Place in** `/public/models/vehicles/`
3. **Update database** with model references
4. **Test in development** environment
5. **Optimize** if needed using glTF-Transform
6. **Deploy** to production once verified

---

## Resources

**Documentation**:
- Three.js GLTF Loader: https://threejs.org/docs/#examples/en/loaders/GLTFLoader
- React Three Fiber useGLTF: https://docs.pmnd.rs/react-three-fiber/api/hooks#usegltf
- glTF Specification: https://github.com/KhronosGroup/glTF

**Tools**:
- glTF Viewer: https://gltf-viewer.donmccurdy.com/
- glTF Transform: https://gltf-transform.donmccurdy.com/
- Blender (for editing): https://www.blender.org/

**Communities**:
- Three.js Discourse: https://discourse.threejs.org/
- Sketchfab Forums: https://forum.sketchfab.com/
- React Three Fiber Discord: https://discord.gg/poimandres

---

**Last Updated**: 2025-11-11
**Compatible with**: Fleet Management v1.8-photorealistic-3d
**Author**: Capital Tech Alliance Development Team
