#!/usr/bin/env python3
"""
Automated 3D Model Downloader
Downloads free photorealistic vehicle models from public sources
"""

import os
import json
import requests
import time
from pathlib import Path
from typing import Dict, List, Any
from urllib.parse import urlencode

# Paths
BASE_DIR = Path(__file__).parent.parent
CATALOG_PATH = BASE_DIR / "public" / "fleet-3d-catalog.json"
MODELS_DIR = BASE_DIR / "public" / "models" / "vehicles"

# Free model repositories
FREE_MODEL_SOURCES = {
    # Khronos glTF Sample Models (CC0/CC-BY)
    "sample_models": [
        {
            "url": "https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/CesiumMilkTruck/glTF-Binary/CesiumMilkTruck.glb",
            "filename": "sample_truck.glb",
            "category": "trucks",
            "description": "Sample truck model (placeholder)"
        },
        {
            "url": "https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/ToyCar/glTF-Binary/ToyCar.glb",
            "filename": "sample_sedan.glb",
            "category": "sedans",
            "description": "Sample sedan model (placeholder)"
        }
    ],

    # Realistic vehicle models (manual download required from Sketchfab)
    "manual_download_required": {
        "ford_f_150": {
            "name": "Ford F-150",
            "sketchfab_url": "https://sketchfab.com/3d-models/ford-f-150-raptor-2017-c428c6cf8aa54f33b70d7fb68ad3c3b0",
            "category": "trucks",
            "instructions": "Download GLB format, rename to ford_f_150.glb"
        },
        "chevrolet_silverado": {
            "name": "Chevrolet Silverado",
            "sketchfab_search": "https://sketchfab.com/search?q=chevrolet+silverado+pbr&type=models&features=downloadable",
            "category": "trucks"
        },
        "toyota_camry": {
            "name": "Toyota Camry",
            "sketchfab_search": "https://sketchfab.com/search?q=toyota+camry+pbr&type=models&features=downloadable",
            "category": "sedans"
        },
        "honda_cr_v": {
            "name": "Honda CR-V",
            "sketchfab_search": "https://sketchfab.com/search?q=honda+cr-v+pbr&type=models&features=downloadable",
            "category": "suvs"
        },
        "tesla_model_3": {
            "name": "Tesla Model 3",
            "sketchfab_search": "https://sketchfab.com/search?q=tesla+model+3+pbr&type=models&features=downloadable",
            "category": "electric_sedans"
        },
        "ford_explorer": {
            "name": "Ford Explorer",
            "sketchfab_search": "https://sketchfab.com/search?q=ford+explorer+pbr&type=models&features=downloadable",
            "category": "suvs"
        },
        "mercedes_benz_sprinter": {
            "name": "Mercedes-Benz Sprinter",
            "sketchfab_search": "https://sketchfab.com/search?q=mercedes+sprinter+van+pbr&type=models&features=downloadable",
            "category": "vans"
        },
        "ford_transit": {
            "name": "Ford Transit",
            "sketchfab_search": "https://sketchfab.com/search?q=ford+transit+van+pbr&type=models&features=downloadable",
            "category": "vans"
        },
        "caterpillar_320": {
            "name": "Caterpillar 320 Excavator",
            "sketchfab_search": "https://sketchfab.com/search?q=excavator+pbr&type=models&features=downloadable",
            "category": "construction"
        },
        "john_deere_200g": {
            "name": "John Deere 200G Excavator",
            "sketchfab_search": "https://sketchfab.com/search?q=excavator+john+deere+pbr&type=models&features=downloadable",
            "category": "construction"
        }
    }
}

def download_file(url: str, destination: Path, description: str = "") -> bool:
    """Download file from URL to destination"""
    try:
        print(f"  📥 Downloading: {description or url}")
        response = requests.get(url, stream=True, timeout=30)
        response.raise_for_status()

        destination.parent.mkdir(parents=True, exist_ok=True)

        with open(destination, 'wb') as f:
            for chunk in response.iter_content(chunk_size=8192):
                f.write(chunk)

        file_size_mb = destination.stat().st_size / (1024 * 1024)
        print(f"  ✅ Downloaded: {destination.name} ({file_size_mb:.2f} MB)")
        return True

    except Exception as e:
        print(f"  ❌ Failed to download {description or url}: {e}")
        return False

def download_sample_models() -> int:
    """Download free sample models from glTF repository"""
    print("\n📦 Downloading Sample Models (Placeholders)")
    print("-" * 60)

    downloaded = 0
    for model in FREE_MODEL_SOURCES["sample_models"]:
        category_dir = MODELS_DIR / model["category"]
        destination = category_dir / model["filename"]

        if destination.exists():
            print(f"  ⏭️  Skipping (already exists): {model['filename']}")
            continue

        if download_file(model["url"], destination, model["description"]):
            downloaded += 1

        time.sleep(0.5)  # Be nice to the server

    return downloaded

def create_manual_download_instructions() -> str:
    """Create detailed manual download instructions"""

    instructions = """# Manual 3D Model Download Instructions

## 🎯 Priority Models to Download

These models require manual download from Sketchfab or similar platforms.
All models should be photorealistic with PBR materials.

"""

    for model_key, model_info in FREE_MODEL_SOURCES["manual_download_required"].items():
        instructions += f"\n### {model_info['name']}\n\n"
        instructions += f"**Category**: `{model_info['category']}`\n\n"

        if 'sketchfab_url' in model_info:
            instructions += f"**Direct Model**: [{model_info['name']}]({model_info['sketchfab_url']})\n\n"
            instructions += "**Steps**:\n"
            instructions += "1. Visit the model page\n"
            instructions += "2. Click \"Download 3D Model\"\n"
            instructions += "3. Select **glTF 2.0** or **GLB** format\n"
            instructions += f"4. Save as: `{model_key}.glb`\n"
            instructions += f"5. Place in: `public/models/vehicles/{model_info['category']}/`\n\n"
        elif 'sketchfab_search' in model_info:
            instructions += f"**Search**: [Sketchfab Search]({model_info['sketchfab_search']})\n\n"
            instructions += "**Steps**:\n"
            instructions += "1. Visit the search results page\n"
            instructions += "2. Look for models with:\n"
            instructions += "   - High like count (500+)\n"
            instructions += "   - PBR materials\n"
            instructions += "   - Downloadable license (CC0 or CC-BY)\n"
            instructions += "3. Download in **glTF 2.0** or **GLB** format\n"
            instructions += f"4. Rename to: `{model_key}.glb`\n"
            instructions += f"5. Place in: `public/models/vehicles/{model_info['category']}/`\n\n"

        if 'instructions' in model_info:
            instructions += f"**Note**: {model_info['instructions']}\n\n"

        instructions += "---\n"

    instructions += """
## ✅ Quality Checklist

Before accepting any model:

- [ ] **Format**: GLB or glTF 2.0
- [ ] **Polygons**: 30,000 - 100,000 triangles
- [ ] **Textures**: 2K-4K resolution
- [ ] **Materials**: PBR (Base Color, Metallic, Roughness, Normal, AO)
- [ ] **Clearcoat**: Car paint has clearcoat shader
- [ ] **Size**: File < 50MB
- [ ] **License**: CC0 or CC-BY 4.0
- [ ] **Quality**: Photorealistic appearance
- [ ] **Test**: Loads in 3D viewer without errors

## 📁 File Naming Convention

```
{make}_{model}.glb

Examples:
- ford_f_150.glb
- chevrolet_silverado.glb
- toyota_camry.glb
- honda_accord.glb
- tesla_model_3.glb
```

## 🚀 Quick Download Links

### Top Priority (Most Common in Fleet)

1. **Ford F-150** (3 vehicles)
   - [Sketchfab Search](https://sketchfab.com/search?q=ford+f-150+pbr&type=models&features=downloadable&sort_by=-likeCount)

2. **Ford Explorer** (3 vehicles)
   - [Sketchfab Search](https://sketchfab.com/search?q=ford+explorer+pbr&type=models&features=downloadable&sort_by=-likeCount)

3. **Honda Accord** (3 vehicles)
   - [Sketchfab Search](https://sketchfab.com/search?q=honda+accord+pbr&type=models&features=downloadable&sort_by=-likeCount)

4. **Chevrolet Colorado** (2 vehicles)
   - [Sketchfab Search](https://sketchfab.com/search?q=chevrolet+colorado+pbr&type=models&features=downloadable&sort_by=-likeCount)

5. **Toyota Tacoma** (2 vehicles)
   - [Sketchfab Search](https://sketchfab.com/search?q=toyota+tacoma+pbr&type=models&features=downloadable&sort_by=-likeCount)

6. **Ram ProMaster** (3 vehicles)
   - [Sketchfab Search](https://sketchfab.com/search?q=ram+promaster+van+pbr&type=models&features=downloadable&sort_by=-likeCount)

7. **Tesla Model Y** (2 vehicles)
   - [Sketchfab Search](https://sketchfab.com/search?q=tesla+model+y+pbr&type=models&features=downloadable&sort_by=-likeCount)

8. **Chevrolet Tahoe** (2 vehicles)
   - [Sketchfab Search](https://sketchfab.com/search?q=chevrolet+tahoe+pbr&type=models&features=downloadable&sort_by=-likeCount)

9. **Jeep Wrangler** (2 vehicles)
   - [Sketchfab Search](https://sketchfab.com/search?q=jeep+wrangler+pbr&type=models&features=downloadable&sort_by=-likeCount)

10. **Toyota Corolla** (2 vehicles)
    - [Sketchfab Search](https://sketchfab.com/search?q=toyota+corolla+pbr&type=models&features=downloadable&sort_by=-likeCount)

## 🔧 Alternative Sources

If Sketchfab doesn't have good results:

1. **Poly Haven** (100% Free, CC0)
   - https://polyhaven.com/models
   - Very high quality but limited vehicle selection

2. **CGTrader Free**
   - https://www.cgtrader.com/free-3d-models
   - Filter by: glTF format, Vehicles category

3. **TurboSquid Free**
   - https://www.turbosquid.com/Search/3D-Models/free/gltf
   - Some free models available

4. **Quaternius** (CC0, Game Assets)
   - https://quaternius.com/
   - Stylized vehicles, good for placeholders

## 📊 Progress Tracking

After downloading each model:

1. Place file in correct category folder
2. Update the catalog: `python scripts/update_3d_catalog.py`
3. Test in viewer: Open Fleet app and navigate to 3D viewer
4. Check quality and performance

## 🎨 Material Requirements

All vehicles should have these material properties:

### Car Paint (Main Body)
- Metalness: 0.9
- Roughness: 0.15
- Clearcoat: 1.0
- Clearcoat Roughness: 0.03-0.05

### Chrome/Metal (Trim, Wheels)
- Metalness: 1.0
- Roughness: 0.05-0.1

### Glass (Windows)
- Transmission: 0.9
- IOR: 1.5
- Roughness: 0

### Rubber (Tires)
- Metalness: 0
- Roughness: 0.9

Good luck with the downloads! 🚗✨
"""

    return instructions

def main():
    """Main execution"""
    print("\n" + "🚗" * 30)
    print("AUTOMATED 3D MODEL DOWNLOADER")
    print("🚗" * 30)

    # Download sample models
    sample_count = download_sample_models()

    # Create manual download instructions
    print("\n📝 Creating Manual Download Instructions")
    print("-" * 60)

    instructions = create_manual_download_instructions()
    instructions_path = BASE_DIR / "MANUAL_MODEL_DOWNLOAD.md"

    with open(instructions_path, 'w') as f:
        f.write(instructions)

    print(f"✅ Instructions created: {instructions_path}")

    # Summary
    print("\n" + "=" * 60)
    print("DOWNLOAD SUMMARY")
    print("=" * 60)
    print(f"Sample models downloaded: {sample_count}")
    print(f"Manual downloads required: {len(FREE_MODEL_SOURCES['manual_download_required'])}")
    print()
    print("Next Steps:")
    print(f"1. Review manual download instructions: {instructions_path}")
    print("2. Download high-priority models from Sketchfab")
    print("3. Place models in category folders")
    print("4. Run: python scripts/update_3d_catalog.py")
    print("5. Test in 3D viewer")
    print()
    print("=" * 60)
    print("✨ Download process complete!")
    print()

if __name__ == "__main__":
    main()
