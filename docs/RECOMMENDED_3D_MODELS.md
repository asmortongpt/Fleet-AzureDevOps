# Recommended Photorealistic 3D Car Models - Quick Reference

## Immediate Action Items

### Free Starter Models (Get Started in 15 Minutes)

**Download these 5 models from Sketchfab** (all free, CC0/CC-BY):

1. **Generic Sedan**
   - Search: "sedan car gltf" on Sketchfab
   - Filter: Downloadable, Free
   - Look for: 20-40K polygons, PBR materials
   - Direct link example: https://sketchfab.com/3d-models/carglb-838e060c52fc487bb8708b1dd8bc3a90

2. **SUV/Crossover**
   - Search: "suv gltf" on Sketchfab
   - Filter: Downloadable, Low-poly
   - Target: Modern SUV design, 30-50K polygons

3. **Pickup Truck**
   - Search: "pickup truck gltf" on Sketchfab
   - Filter: Downloadable, PBR
   - Target: Fleet-style truck, 25-45K polygons

4. **Cargo Van**
   - Search: "van gltf" on Sketchfab
   - Filter: Downloadable, Commercial vehicle
   - Target: Transit/Sprinter style, 20-40K polygons

5. **Police/Emergency Vehicle**
   - Search: "police car gltf" on Sketchfab
   - Filter: Downloadable
   - Target: Sedan or SUV with lightbar

**Total Cost**: $0
**Total Time**: 15-30 minutes
**License**: CC-BY (attribution required) or CC0 (public domain)

---

## Commercial Recommendations by Budget

### Budget Tier: $200-$300 (CGTrader)

**Best Value Pack** - 5 realistic fleet vehicles:

1. **Ford F-150 2024** (~$50)
   - Most popular pickup in US fleets
   - GLB format, PBR materials
   - Search: "Ford F-150 2024 GLB" on CGTrader

2. **Chevrolet Silverado 2024** (~$50)
   - Second most popular fleet truck
   - GLB format, photorealistic
   - Search: "Chevrolet Silverado 2024 GLB"

3. **Toyota Camry 2024** (~$40)
   - Popular fleet sedan
   - GLB, low-poly optimized
   - Search: "Toyota Camry 2024 GLB"

4. **Honda CR-V 2024** (~$40)
   - Common fleet SUV
   - GLB, PBR materials
   - Search: "Honda CR-V 2024 GLB"

5. **Ford Transit 2024** (~$50)
   - Most common cargo van
   - GLB, photorealistic
   - Search: "Ford Transit 2024 GLB"

**Total**: ~$230
**Quality**: Professional, photorealistic
**Format**: GLB with PBR materials
**Source**: CGTrader.com

---

### Premium Tier: $800-$1000 (TurboSquid CheckMate)

**Enterprise Fleet Collection** - Brand-accurate, photorealistic:

1. **Ford F-150 Raptor 2024** (~$200)
   - CheckMate certified
   - 4K textures, interior/exterior
   - Search: "Ford F-150 Raptor 2024 CheckMate"

2. **RAM 2500 HD 2024** (~$200)
   - Heavy-duty fleet truck
   - Photorealistic, 4K PBR
   - Search: "RAM 2500 2024 CheckMate"

3. **Chevrolet Tahoe 2024** (~$180)
   - Law enforcement/fleet SUV
   - Full interior, high-detail
   - Search: "Chevrolet Tahoe 2024 CheckMate"

4. **Ford Transit 350 2024** (~$150)
   - Commercial cargo van
   - 4K textures, PBR materials
   - Search: "Ford Transit 350 2024 CheckMate"

5. **Tesla Cybertruck 2024** (~$250)
   - Electric fleet vehicle
   - Unique design, photorealistic
   - Search: "Tesla Cybertruck 2024 CheckMate"

**Total**: ~$980
**Quality**: Showroom, brand-accurate
**Format**: GLB/GLTF with 4K PBR textures
**Source**: TurboSquid.com (CheckMate certified)

---

## Specific Model Links (Verified)

### Sketchfab Free Models

**Sedan Car (FetchCFD)**:
- URL: https://fetchcfd.com/threeDViewGltf/1500
- Format: GLB/GLTF
- License: Check model page
- Quality: Medium, suitable for testing

**Car.glb (abhijeetkushwah114)**:
- URL: https://sketchfab.com/3d-models/carglb-838e060c52fc487bb8708b1dd8bc3a90
- Format: GLB
- License: CC-BY 4.0
- Quality: Good for prototyping

**More at**:
- https://sketchfab.com/tags/car (filter by Downloadable)
- https://sketchfab.com/categories/cars-vehicles

---

### Poly Haven (CC0, No Attribution)

**Vehicles Collection**:
- URL: https://polyhaven.com/models (filter: Vehicles)
- Format: GLTF, FBX, USD
- License: CC0 (public domain)
- Quality: Hyperreal, VFX-grade

**Note**: Limited vehicle selection but highest free quality available.

---

### CGTrader Curated

**Low Poly Vehicles Pack Collection**:
- URL: Search "Low Poly Vehicles Pack Collection" on CGTrader
- Format: GLTF/GLB
- Price: ~$50-$100 for pack
- Contents: Multiple vehicles (sedan, SUV, truck, van)
- License: Standard CGTrader license

**Individual Models**:
- Search by specific make/model + "GLB" or "GLTF"
- Filter: PBR, WebGL-optimized
- Price range: $20-$200 per vehicle

---

## Quick Setup Instructions

### 1. Download Model

**Sketchfab**:
1. Find model on Sketchfab
2. Click "Download 3D Model"
3. Select "Autoconverted format (glTF)"
4. Click Download
5. Extract ZIP file

**CGTrader/TurboSquid**:
1. Purchase model
2. Download in GLB or GLTF format
3. If not available, request free conversion

### 2. Place in Project

```bash
# Create directory
mkdir -p /Users/andrewmorton/Documents/GitHub/Fleet/public/models/vehicles

# Copy model
cp ~/Downloads/model.glb /Users/andrewmorton/Documents/GitHub/Fleet/public/models/vehicles/sedan-2024.glb
```

### 3. Add to Database

```sql
INSERT INTO vehicles (
  id,
  make,
  model,
  year,
  model_3d_path,
  model_format
) VALUES (
  uuid_generate_v4(),
  'Generic',
  'Sedan',
  2024,
  '/models/vehicles/sedan-2024.glb',
  'GLB'
);
```

### 4. Test

```bash
npm run dev
# Navigate to Vehicle 3D Viewer
# Select the new vehicle
# Verify photorealistic rendering
```

---

## Model Quality Checklist

Before using a model, verify:

- [ ] Format is GLB or GLTF (not OBJ, FBX, STL)
- [ ] File size <50MB
- [ ] Polygon count 10K-100K triangles
- [ ] Includes PBR materials (Base Color, Metallic, Roughness, Normal)
- [ ] Textures are 2K or 4K resolution
- [ ] License allows commercial use
- [ ] Model loads in glTF Viewer: https://gltf-viewer.donmccurdy.com/

---

## Optimization Tips

**If model is too large (>50MB)**:
```bash
# Install glTF Transform
npm install -g @gltf-transform/cli

# Optimize
gltf-transform optimize input.glb output.glb \
  --texture-compress webp \
  --texture-size 2048
```

**If performance is poor (<30 FPS)**:
1. Reduce texture size to 1K or 2K
2. Use Draco compression
3. Remove interior details if only showing exterior
4. Switch to "Low" quality preset in viewer

---

## Attribution Examples

**For CC-BY Models** (add to About page or credits):

```
3D Models:
- "Sedan Car" by John Doe (Sketchfab) - CC-BY 4.0
- "Police SUV" by Jane Smith (Sketchfab) - CC-BY 4.0
```

**For CC0 Models**:
No attribution required, but optional:

```
3D Models from Poly Haven (CC0)
```

---

## Support Resources

**Technical Issues**:
- Three.js GLTF Loader Docs: https://threejs.org/docs/#examples/en/loaders/GLTFLoader
- glTF Viewer (test models): https://gltf-viewer.donmccurdy.com/
- React Three Fiber Docs: https://docs.pmnd.rs/react-three-fiber

**Model Issues**:
- Sketchfab Support: https://help.sketchfab.com/
- CGTrader Support: https://www.cgtrader.com/pages/support
- TurboSquid Support: https://support.turbosquid.com/

**Community**:
- Three.js Forum: https://discourse.threejs.org/
- React Three Fiber Discord: https://discord.gg/poimandres

---

## Next Steps

1. **Start with free models** from Sketchfab (5 models, 15 minutes)
2. **Test in development** environment
3. **Evaluate quality** - is it good enough?
4. **If needed, purchase** professional models from CGTrader
5. **Optimize** using glTF Transform
6. **Deploy** to production

---

**Last Updated**: 2025-11-11
**Compatible with**: Fleet Management v1.8-photorealistic-3d
**Estimated Setup Time**: 15 minutes (free) to 2 hours (commercial)
