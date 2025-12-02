# Sketchfab 3D Model Download Guide

## Overview

This guide provides step-by-step instructions for downloading free 3D vehicle models from Sketchfab to complete the Fleet Management System's 3D model library.

**Current Status:**
- ✅ **6 models** from Meshy AI (Nissan Kicks, Ford Fusion, Chevrolet Impala, Ford Focus, Ford Explorer, Toyota Sienna)
- ✅ **1 sample model** downloaded (Toy Car)
- ⚠️ **6 models** need manual download from Sketchfab

---

## Required Fleet Vehicles

### Priority 1: Pickup Trucks (2 models needed)

#### 1. Ford F-150
- **Fleet Count:** 50 vehicles
- **Category:** Pickup Truck
- **Color:** White
- **Folder:** `public/models/vehicles/trucks/`
- **Search URL:** https://sketchfab.com/search?q=Ford+F-150+gltf&type=models&features=downloadable&sort_by=-likeCount

**Recommended Models:**
- Search: "Ford F-150 low poly"
- Search: "pickup truck fleet vehicle"
- Filter: CC0 or CC-BY license
- Format: glTF or GLB

#### 2. Chevrolet Silverado
- **Fleet Count:** 35 vehicles
- **Category:** Pickup Truck
- **Color:** Silver
- **Folder:** `public/models/vehicles/trucks/`
- **Search URL:** https://sketchfab.com/search?q=Chevrolet+Silverado+gltf&type=models&features=downloadable&sort_by=-likeCount

---

### Priority 2: Cargo Vans (2 models needed)

#### 3. Ford Transit
- **Fleet Count:** 45 vehicles
- **Category:** Cargo Van
- **Color:** White
- **Folder:** `public/models/vehicles/vans/`
- **Search URL:** https://sketchfab.com/search?q=Ford+Transit+gltf&type=models&features=downloadable&sort_by=-likeCount

**Recommended Models:**
- Search: "Ford Transit van"
- Search: "cargo van commercial"
- Alternative: "delivery van"

#### 4. Mercedes Sprinter
- **Fleet Count:** 20 vehicles
- **Category:** Cargo Van
- **Color:** White
- **Folder:** `public/models/vehicles/vans/`
- **Search URL:** https://sketchfab.com/search?q=Mercedes+Sprinter+gltf&type=models&features=downloadable&sort_by=-likeCount

---

### Priority 3: Emergency Vehicles (2 models needed)

#### 5. Dodge Charger (Police)
- **Fleet Count:** 15 vehicles
- **Category:** Police Sedan
- **Color:** Black/White
- **Folder:** `public/models/vehicles/emergency/`
- **Search URL:** https://sketchfab.com/search?q=Dodge+Charger+gltf&type=models&features=downloadable&sort_by=-likeCount

**Recommended Models:**
- Search: "police car"
- Search: "police sedan"
- Search: "Dodge Charger police"

#### 6. Ford Police Interceptor
- **Fleet Count:** 25 vehicles
- **Category:** Police SUV
- **Color:** Black/White
- **Folder:** `public/models/vehicles/emergency/`
- **Search URL:** https://sketchfab.com/search?q=Ford+Police+Interceptor+gltf&type=models&features=downloadable&sort_by=-likeCount

**Recommended Models:**
- Search: "police SUV"
- Search: "Ford Explorer police"
- Search: "police interceptor"

---

## Step-by-Step Download Instructions

### Step 1: Visit Sketchfab
1. Go to [Sketchfab.com](https://sketchfab.com/)
2. Create a free account (required for downloads)

### Step 2: Search for Models
1. Click the search URL for the vehicle you want
2. The search will include:
   - ✅ **Downloadable** filter already applied
   - ✅ **Sorted by Most Liked** (best quality)

### Step 3: Apply Filters
In the left sidebar, apply these filters:
- **License:** Check "CC0" and "CC-BY 4.0"
- **Animated:** Unchecked (we want static models)
- **Rigged:** Optional (can be useful)
- **PBR:** Checked (for photorealistic materials)

### Step 4: Select Model
1. Browse the search results
2. Look for models with:
   - ⭐ High like count (500+)
   - 👁️ High view count (10,000+)
   - 📸 Good preview images
   - 🎨 PBR materials (for realistic rendering)

### Step 5: Download Model
1. Click on the model thumbnail
2. Click the **"Download 3D Model"** button
3. Select **"Auto-converted format (glTF)"**
4. Click **Download**

### Step 6: Extract and Organize
1. Extract the downloaded ZIP file
2. Look for files with these extensions:
   - `.glb` (preferred - single file)
   - `.gltf` + `.bin` + textures (multi-file)
3. Rename the model file to match this pattern:
   ```
   {make}_{model}_{category}.glb
   ```
   Examples:
   - `ford_f150_pickup.glb`
   - `chevrolet_silverado_pickup.glb`
   - `ford_transit_van.glb`

4. Move to the appropriate folder:
   ```
   Fleet/public/models/vehicles/{category}/
   ```

---

## Recommended Specific Models

### High-Quality Free Models on Sketchfab

#### Pickup Trucks
- **"Pickup Truck"** by Quaternius (CC0)
  - https://sketchfab.com/3d-models/pickup-truck
  - Low poly, optimized for web
  - Perfect for fleet management

- **"Low Poly Truck"** by Various Artists (CC-BY)
  - Search: "low poly pickup truck gltf"
  - Good performance on mobile

#### Vans
- **"Cargo Van"** by Various Artists (CC-BY)
  - Search: "cargo van low poly gltf"
  - Suitable for Ford Transit / Mercedes Sprinter

#### Police Vehicles
- **"Police Car"** by Various Artists (CC0/CC-BY)
  - Search: "police car gltf"
  - Can be customized with decals

---

## Alternative Sources (If Sketchfab Doesn't Have Good Matches)

### Poly Haven
- URL: https://polyhaven.com/models
- License: CC0 (100% free)
- Limited vehicle selection but highest quality

### CGTrader Free
- URL: https://www.cgtrader.com/free-3d-models
- Filter by: Free, glTF format, Vehicle category
- License varies - check each model

### TurboSquid Free
- URL: https://www.turbosquid.com/Search/3D-Models/free/gltf
- Filter by: Free, glTF
- License: Royalty-Free

---

## File Naming Convention

Use this pattern for consistency:
```
{make}_{model}_{year-range}_{color}.glb
```

Examples:
- `ford_f150_2020_2024_white.glb`
- `chevrolet_silverado_2019_2024_silver.glb`
- `ford_transit_2018_2024_white.glb`
- `mercedes_sprinter_2019_2024_white.glb`
- `dodge_charger_2018_2023_police.glb`
- `ford_police_interceptor_2020_2024_police.glb`

---

## After Downloading All Models

### 1. Update the Catalog
Run the catalog update script:
```bash
python3 scripts/download_dcf_fleet_models.py
```

### 2. Verify Installation
Check that all models are in place:
```bash
ls -R public/models/vehicles/
```

Expected output:
```
sedans/:
  ford_fusion_2018_2020_dark_blue.glb
  chevrolet_impala_2016_2019_silver.glb
  ford_focus_2016_2018_white.glb

suvs/:
  nissan_kicks_2020_2023_white.glb
  ford_explorer_2020_2023_white.glb

trucks/:
  ford_f150_2020_2024_white.glb
  chevrolet_silverado_2019_2024_silver.glb

vans/:
  toyota_sienna_2018_2022_blue.glb
  ford_transit_2018_2024_white.glb
  mercedes_sprinter_2019_2024_white.glb

emergency/:
  dodge_charger_2018_2023_police.glb
  ford_police_interceptor_2020_2024_police.glb

specialty/:
  sample_car_toy.glb
```

### 3. Test in 3D Viewer
1. Start the development server:
   ```bash
   npm run dev
   ```

2. Navigate to the Virtual Garage or Fleet Dashboard
3. Click "3D View" on any vehicle
4. Verify the model loads correctly

---

## Troubleshooting

### Model Doesn't Load
- **Issue:** Model file is too large (>50MB)
- **Solution:** Use a lower poly version or compress textures

### Textures Missing
- **Issue:** .gltf file without textures
- **Solution:** Make sure to download the entire folder, not just the .gltf file

### Wrong Scale
- **Issue:** Model appears too large or small
- **Solution:** Check the scale in Vehicle3DViewer.tsx (should be 1.0)

### Performance Issues
- **Issue:** 3D viewer runs slowly
- **Solution:** Use "Low" quality setting or reduce polygon count

---

## Model Quality Guidelines

### Ideal Model Specifications
- **Format:** GLB (single file) or glTF
- **Polygon Count:** 10,000 - 50,000 triangles
- **Texture Resolution:** 2K (2048x2048)
- **Materials:** PBR (Base Color, Metallic, Roughness, Normal)
- **File Size:** < 20MB

### Acceptable Compromises
- **Low Poly:** 5,000 - 10,000 triangles (better performance)
- **High Poly:** 50,000 - 100,000 triangles (better quality)
- **Texture Resolution:** 1K for low-end devices, 4K for desktop

---

## License Compliance

### Acceptable Licenses
✅ **CC0** - Public Domain, no attribution required
✅ **CC-BY 4.0** - Attribution required (add credit in catalog.json)
✅ **Royalty-Free** - Free for commercial use

### Not Acceptable
❌ **CC-BY-NC** - Non-commercial use only
❌ **CC-BY-SA** - Share-alike (restrictive for proprietary apps)
❌ **Editorial Use** - Not allowed for commercial products

Always verify the license before downloading!

---

## Summary

**Total Models Needed:** 12
- ✅ 6 from Meshy AI
- ✅ 1 sample model
- ⚠️ 6 manual downloads from Sketchfab

**Estimated Time:** 30-60 minutes for all 6 models

**Priority Order:**
1. Ford F-150 (50 vehicles)
2. Ford Transit (45 vehicles)
3. Chevrolet Silverado (35 vehicles)
4. Ford Police Interceptor (25 vehicles)
5. Mercedes Sprinter (20 vehicles)
6. Dodge Charger (15 vehicles)

Good luck! 🚗✨
