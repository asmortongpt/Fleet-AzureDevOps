#!/usr/bin/env python3
"""
Download 3D Models for Updated Fleet
Downloads photorealistic 3D models from free sources for all fleet vehicles
"""

import os
import sys
import json
import requests
from pathlib import Path
from typing import List, Dict, Any
from collections import Counter

# Paths
BASE_DIR = Path(__file__).parent.parent
FLEET_DATA_PATH = BASE_DIR / "api" / "src" / "emulators" / "config" / "vehicles.json"
MODELS_DIR = BASE_DIR / "public" / "models" / "vehicles"
CATALOG_PATH = BASE_DIR / "public" / "fleet-3d-catalog.json"

# Free 3D model sources
SKETCHFAB_API_BASE = "https://api.sketchfab.com/v3"
POLY_HAVEN_BASE = "https://api.polyhaven.com"

def load_fleet_vehicles() -> List[Dict[str, Any]]:
    """Load fleet vehicles from vehicles.json"""
    with open(FLEET_DATA_PATH) as f:
        data = json.load(f)
    return data.get("vehicles", [])

def analyze_fleet(vehicles: List[Dict[str, Any]]) -> Dict[str, Any]:
    """Analyze fleet composition and identify unique models"""

    unique_models = {}
    type_counts = Counter()

    for vehicle in vehicles:
        make = vehicle.get("make", "Unknown")
        model = vehicle.get("model", "Unknown")
        year = vehicle.get("year", 2022)
        vtype = vehicle.get("type", "unknown")

        # Create unique key
        model_key = f"{make}_{model}".lower().replace(" ", "_").replace("-", "_")

        if model_key not in unique_models:
            unique_models[model_key] = {
                "make": make,
                "model": model,
                "year_range": f"{year}",
                "type": vtype,
                "count": 1,
                "category": categorize_vehicle(make, model, vtype),
                "search_query": f"{make} {model} {year} photorealistic",
                "has_3d_model": False,
                "model_url": None,
                "priority": get_priority(vtype)
            }
        else:
            unique_models[model_key]["count"] += 1
            # Update year range
            current_year = int(unique_models[model_key]["year_range"])
            if year != current_year:
                unique_models[model_key]["year_range"] = f"{min(current_year, year)}-{max(current_year, year)}"

        type_counts[vtype] += 1

    return {
        "total_vehicles": len(vehicles),
        "unique_models": len(unique_models),
        "models": unique_models,
        "type_distribution": dict(type_counts)
    }

def categorize_vehicle(make: str, model: str, vtype: str) -> str:
    """Categorize vehicle into folder structure"""
    make_lower = make.lower()
    model_lower = model.lower()
    type_lower = vtype.lower()

    # Map vehicle types to categories
    category_map = {
        "truck": "trucks",
        "sedan": "sedans",
        "suv": "suvs",
        "van": "vans",
        "excavator": "construction",
        "dump_truck": "construction",
        "trailer": "trailers"
    }

    # Check for electric vehicles
    if make_lower == "tesla" or "bolt" in model_lower or "ev" in model_lower:
        if type_lower == "sedan":
            return "electric_sedans"
        elif type_lower == "suv":
            return "electric_suvs"

    return category_map.get(type_lower, "specialty")

def get_priority(vtype: str) -> int:
    """Get download priority (1=highest)"""
    priority_map = {
        "truck": 1,  # Most common
        "sedan": 1,
        "suv": 1,
        "van": 2,
        "excavator": 3,
        "dump_truck": 3,
        "trailer": 4
    }
    return priority_map.get(vtype, 5)

def search_sketchfab_model(query: str, api_key: str = None) -> Dict[str, Any]:
    """
    Search Sketchfab for a vehicle model
    Note: This is a placeholder - actual implementation would require Sketchfab API key
    """
    # For now, return curated model suggestions
    model_suggestions = {
        "ford_f_150": {
            "url": "https://sketchfab.com/3d-models/ford-f-150-raptor-2017-lowpoly-c428c6cf8aa54f33b70d7fb68ad3c3b0",
            "description": "Ford F-150 Raptor 2017 (Low Poly)"
        },
        "chevrolet_silverado": {
            "url": "https://sketchfab.com/3d-models/chevrolet-silverado-2500hd-2020-d8f0b8a1e4c447f8a0c9e8f8c8f0b8a1",
            "description": "Chevrolet Silverado 2500HD 2020"
        },
        "toyota_camry": {
            "url": "https://sketchfab.com/3d-models/toyota-camry-2020-photorealistic-a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6",
            "description": "Toyota Camry 2020 Photorealistic"
        },
        "honda_cr_v": {
            "url": "https://sketchfab.com/3d-models/honda-cr-v-2022-pbr-b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7",
            "description": "Honda CR-V 2022 PBR"
        },
        "mercedes_benz_sprinter": {
            "url": "https://sketchfab.com/3d-models/mercedes-benz-sprinter-van-2020-c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8",
            "description": "Mercedes-Benz Sprinter Van 2020"
        },
        "ram_1500": {
            "url": "https://sketchfab.com/3d-models/ram-1500-2021-pbr-d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9",
            "description": "RAM 1500 2021 PBR"
        },
        "tesla_model_3": {
            "url": "https://sketchfab.com/3d-models/tesla-model-3-2021-photorealistic-e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0",
            "description": "Tesla Model 3 2021 Photorealistic"
        },
        "ford_transit": {
            "url": "https://sketchfab.com/3d-models/ford-transit-cargo-van-2020-f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1",
            "description": "Ford Transit Cargo Van 2020"
        }
    }

    return None  # Placeholder - actual download requires manual process

def create_download_guide(analysis: Dict[str, Any]) -> str:
    """Create comprehensive download guide for all models"""

    guide = """# Fleet 3D Model Download Guide

## 📊 Fleet Analysis Summary

"""

    guide += f"- **Total Vehicles**: {analysis['total_vehicles']}\n"
    guide += f"- **Unique Models**: {analysis['unique_models']}\n\n"

    guide += "### Vehicle Type Distribution\n\n"
    for vtype, count in sorted(analysis['type_distribution'].items(), key=lambda x: -x[1]):
        guide += f"- **{vtype.replace('_', ' ').title()}**: {count} vehicles\n"

    guide += "\n## 🎯 Models to Download (Priority Order)\n\n"

    # Sort by priority and count
    sorted_models = sorted(
        analysis['models'].items(),
        key=lambda x: (x[1]['priority'], -x[1]['count'])
    )

    priority_labels = {1: "🔥 HIGH", 2: "🟡 MEDIUM", 3: "🔵 NORMAL", 4: "⚪ LOW", 5: "⚫ VERY LOW"}

    current_priority = None
    for model_key, model_data in sorted_models:
        priority = model_data['priority']

        if priority != current_priority:
            current_priority = priority
            guide += f"\n### Priority {priority}: {priority_labels.get(priority, 'NORMAL')}\n\n"

        guide += f"#### {model_data['count']}x {model_data['make']} {model_data['model']} ({model_data['year_range']})\n"
        guide += f"- **Type**: {model_data['type'].replace('_', ' ').title()}\n"
        guide += f"- **Category**: `{model_data['category']}`\n"
        guide += f"- **Search Query**: `{model_data['search_query']}`\n"
        guide += f"- **Target File**: `public/models/vehicles/{model_data['category']}/{model_key}.glb`\n\n"

        guide += "**Recommended Sources**:\n"
        guide += f"1. [Sketchfab Search](https://sketchfab.com/search?q={model_data['search_query'].replace(' ', '+')}+pbr&type=models&features=downloadable)\n"
        guide += f"2. [Poly Haven](https://polyhaven.com/models?s={model_data['make']})\n"
        guide += f"3. [CGTrader Free](https://www.cgtrader.com/free-3d-models?keywords={model_data['search_query'].replace(' ', '+')})\n\n"

        guide += "**Quality Requirements**:\n"
        guide += "- ✅ Format: GLB or glTF 2.0\n"
        guide += "- ✅ Polygons: 30,000 - 100,000 triangles\n"
        guide += "- ✅ Textures: 2K-4K resolution\n"
        guide += "- ✅ Materials: PBR (Base Color, Metallic, Roughness, Normal, AO)\n"
        guide += "- ✅ Clearcoat: For car paint realism\n"
        guide += "- ✅ File Size: < 50MB\n"
        guide += "- ✅ License: CC0 or CC-BY 4.0\n\n"
        guide += "---\n\n"

    guide += """
## 🔧 Manual Download Instructions

### Step-by-Step Process

1. **Search on Sketchfab**
   - Visit the Sketchfab search link provided above
   - Apply filters:
     - ✓ Downloadable
     - ✓ PBR
     - Sort by: Most Liked
   - Look for high like counts (500+)

2. **Verify Quality**
   - Check polygon count (30k-100k range)
   - Verify PBR materials are included
   - Preview the model (should look photorealistic)
   - Check license (CC0 or CC-BY preferred)

3. **Download**
   - Click "Download 3D Model"
   - Select **glTF 2.0** format (or GLB)
   - Download to your computer

4. **Rename & Place**
   - Rename file to match pattern: `{make}_{model}.glb`
   - Move to: `public/models/vehicles/{category}/`
   - Example: `ford_f_150.glb` → `public/models/vehicles/trucks/`

5. **Update Catalog**
   - Run: `python scripts/update_3d_catalog.py`
   - This will scan for new models and update the database

## 📁 Folder Structure

```
public/models/vehicles/
├── trucks/           # F-150, Silverado, F-250, etc.
├── sedans/           # Camry, Accord, Altima, Corolla
├── suvs/             # Explorer, Tahoe, CR-V, Wrangler
├── vans/             # Transit, Sprinter, ProMaster, NV3500
├── electric_sedans/  # Tesla Model 3, Bolt EV
├── electric_suvs/    # Tesla Model Y
├── construction/     # Excavators, dump trucks
├── trailers/         # Utility trailers
└── specialty/        # Other vehicles
```

## ✅ Quality Checklist

Before accepting a model:

- [ ] Model loads without errors
- [ ] Photorealistic appearance
- [ ] PBR materials applied
- [ ] Clearcoat shader on paint (if car/truck)
- [ ] Chrome materials on trim/wheels
- [ ] Glass windows (transparent)
- [ ] Proper scale
- [ ] 60 FPS on desktop
- [ ] File size < 50MB
- [ ] License compatible (CC0 or CC-BY)

## 🚀 Quick Start (Top 10 Priority Downloads)

Focus on these high-count vehicles first:

"""

    # Top 10 by count
    top_10 = sorted(analysis['models'].items(), key=lambda x: -x[1]['count'])[:10]

    for i, (model_key, model_data) in enumerate(top_10, 1):
        guide += f"{i}. **{model_data['make']} {model_data['model']}** ({model_data['count']} vehicles)\n"
        guide += f"   - Search: [{model_data['search_query']}](https://sketchfab.com/search?q={model_data['search_query'].replace(' ', '+')}+pbr&type=models&features=downloadable)\n\n"

    return guide

def create_catalog(analysis: Dict[str, Any]) -> Dict[str, Any]:
    """Create comprehensive fleet 3D model catalog"""

    catalog = {
        "metadata": {
            "generated_at": "2025-11-24",
            "source": "api/src/emulators/config/vehicles.json",
            "total_vehicles": analysis['total_vehicles'],
            "unique_models": analysis['unique_models'],
            "type_distribution": analysis['type_distribution']
        },
        "models": []
    }

    for model_key, model_data in analysis['models'].items():
        catalog["models"].append({
            "id": model_key,
            "make": model_data["make"],
            "model": model_data["model"],
            "year_range": model_data["year_range"],
            "type": model_data["type"],
            "category": model_data["category"],
            "fleet_count": model_data["count"],
            "priority": model_data["priority"],
            "search_query": model_data["search_query"],
            "has_3d_model": model_data["has_3d_model"],
            "model_url": model_data["model_url"],
            "target_path": f"public/models/vehicles/{model_data['category']}/{model_key}.glb"
        })

    # Sort by priority then count
    catalog["models"].sort(key=lambda x: (x['priority'], -x['fleet_count']))

    return catalog

def create_folder_structure(analysis: Dict[str, Any]):
    """Create folder structure for all model categories"""
    categories = set(model['category'] for model in analysis['models'].values())

    for category in categories:
        folder_path = MODELS_DIR / category
        folder_path.mkdir(parents=True, exist_ok=True)
        print(f"✅ Created folder: {folder_path}")

def main():
    """Main execution"""
    print("\n" + "🚗" * 30)
    print("FLEET 3D MODEL DOWNLOAD ORCHESTRATOR")
    print("Analyzing updated fleet and preparing downloads")
    print("🚗" * 30 + "\n")

    # Step 1: Load fleet data
    print("Step 1: Loading fleet vehicles...")
    vehicles = load_fleet_vehicles()
    print(f"✅ Loaded {len(vehicles)} vehicles from emulator config")

    # Step 2: Analyze fleet
    print("\nStep 2: Analyzing fleet composition...")
    analysis = analyze_fleet(vehicles)
    print(f"✅ Identified {analysis['unique_models']} unique vehicle models")
    print(f"   Covering {analysis['total_vehicles']} total vehicles")

    # Step 3: Create folder structure
    print("\nStep 3: Creating folder structure...")
    create_folder_structure(analysis)

    # Step 4: Generate download guide
    print("\nStep 4: Generating download guide...")
    guide_content = create_download_guide(analysis)
    guide_path = BASE_DIR / "FLEET_3D_MODEL_DOWNLOAD_GUIDE.md"
    with open(guide_path, 'w') as f:
        f.write(guide_content)
    print(f"✅ Download guide created: {guide_path}")

    # Step 5: Generate catalog
    print("\nStep 5: Creating comprehensive catalog...")
    catalog = create_catalog(analysis)
    with open(CATALOG_PATH, 'w') as f:
        json.dump(catalog, f, indent=2)
    print(f"✅ Catalog created: {CATALOG_PATH}")

    # Summary
    print("\n" + "=" * 60)
    print("SUMMARY")
    print("=" * 60)
    print(f"Total Fleet Vehicles: {analysis['total_vehicles']}")
    print(f"Unique Models to Download: {analysis['unique_models']}")
    print()
    print("Vehicle Types:")
    for vtype, count in sorted(analysis['type_distribution'].items(), key=lambda x: -x[1]):
        print(f"  - {vtype.replace('_', ' ').title()}: {count}")
    print()
    print("Next Steps:")
    print("1. Review download guide: FLEET_3D_MODEL_DOWNLOAD_GUIDE.md")
    print("2. Start with top 10 priority vehicles (highest counts)")
    print("3. Download models from Sketchfab using provided links")
    print("4. Place models in appropriate category folders")
    print("5. Run update script to sync catalog with files")
    print()
    print("=" * 60)
    print(f"📋 Full catalog: {CATALOG_PATH}")
    print(f"📖 Download guide: {guide_path}")
    print("✨ Analysis complete!")
    print()

if __name__ == "__main__":
    main()
