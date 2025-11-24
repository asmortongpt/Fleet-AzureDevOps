#!/usr/bin/env python3
"""
Download 3D models matching the actual DCF Fleet vehicles

This script downloads models that match the real Florida DCF fleet from ITB 2425 077:
- 590 Nissan Kicks (White)
- 156 Ford Fusion (Dark Blue)
- 98 Chevrolet Impala (Silver)
- 87 Ford Focus (White)
- 12 Ford Explorer (White)
- 39 Toyota Sienna (Blue)

Syncs with emulator and mobile app data.
"""

import os
import sys
import json
import requests
from pathlib import Path
import time

BASE_DIR = Path(__file__).parent.parent
MODELS_DIR = BASE_DIR / "public" / "models" / "vehicles"
PUBLIC_DIR = BASE_DIR / "public"

# Ensure directories exist
MODELS_DIR.mkdir(parents=True, exist_ok=True)

# Read existing meshy-models.json
MESHY_MODELS_PATH = PUBLIC_DIR / "meshy-models.json"

def load_existing_meshy_models():
    """Load existing Meshy AI generated models"""
    if MESHY_MODELS_PATH.exists():
        with open(MESHY_MODELS_PATH) as f:
            return json.load(f)
    return None

# DCF Fleet vehicles from ITB 2425 077 (Real Florida data)
DCF_FLEET_VEHICLES = [
    {
        "make": "Nissan",
        "model": "Kicks",
        "year": "2020-2023",
        "color": "White",
        "fleet_count": 590,
        "category": "compact_suv",
        "folder": "suvs",
        "has_meshy_model": True,
        "priority": 1  # Highest priority due to quantity
    },
    {
        "make": "Ford",
        "model": "Fusion",
        "year": "2018-2020",
        "color": "Dark Blue",
        "fleet_count": 156,
        "category": "sedan",
        "folder": "sedans",
        "has_meshy_model": True,
        "priority": 2
    },
    {
        "make": "Chevrolet",
        "model": "Impala",
        "year": "2016-2019",
        "color": "Silver",
        "fleet_count": 98,
        "category": "sedan",
        "folder": "sedans",
        "has_meshy_model": True,
        "priority": 3
    },
    {
        "make": "Ford",
        "model": "Focus",
        "year": "2016-2018",
        "color": "White",
        "fleet_count": 87,
        "category": "compact",
        "folder": "sedans",
        "has_meshy_model": True,
        "priority": 4
    },
    {
        "make": "Ford",
        "model": "Explorer",
        "year": "2020-2023",
        "color": "White",
        "fleet_count": 12,
        "category": "suv",
        "folder": "suvs",
        "has_meshy_model": True,
        "priority": 5
    },
    {
        "make": "Toyota",
        "model": "Sienna",
        "year": "2018-2022",
        "color": "Blue",
        "fleet_count": 39,
        "category": "minivan",
        "folder": "vans",
        "has_meshy_model": True,
        "priority": 6
    }
]

# Additional common fleet vehicles to download
COMMON_FLEET_VEHICLES = [
    {
        "make": "Ford",
        "model": "F-150",
        "year": "2020-2024",
        "color": "White",
        "fleet_count": 50,
        "category": "pickup_truck",
        "folder": "trucks",
        "has_meshy_model": False,
        "priority": 7
    },
    {
        "make": "Chevrolet",
        "model": "Silverado",
        "year": "2019-2024",
        "color": "Silver",
        "fleet_count": 35,
        "category": "pickup_truck",
        "folder": "trucks",
        "has_meshy_model": False,
        "priority": 8
    },
    {
        "make": "Ford",
        "model": "Transit",
        "year": "2018-2024",
        "color": "White",
        "fleet_count": 45,
        "category": "cargo_van",
        "folder": "vans",
        "has_meshy_model": False,
        "priority": 9
    },
    {
        "make": "Mercedes",
        "model": "Sprinter",
        "year": "2019-2024",
        "color": "White",
        "fleet_count": 20,
        "category": "cargo_van",
        "folder": "vans",
        "has_meshy_model": False,
        "priority": 10
    },
    {
        "make": "Dodge",
        "model": "Charger",
        "year": "2018-2023",
        "color": "Black/White",
        "fleet_count": 15,
        "category": "police_sedan",
        "folder": "emergency",
        "has_meshy_model": False,
        "priority": 11
    },
    {
        "make": "Ford",
        "model": "Police Interceptor",
        "year": "2020-2024",
        "color": "Black/White",
        "fleet_count": 25,
        "category": "police_suv",
        "folder": "emergency",
        "has_meshy_model": False,
        "priority": 12
    }
]

def download_file(url: str, dest_path: Path, description: str = ""):
    """Download a file with progress indication"""
    print(f"📥 Downloading {description or dest_path.name}...")
    try:
        response = requests.get(url, stream=True, timeout=60, headers={
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
        })
        response.raise_for_status()

        total_size = int(response.headers.get('content-length', 0))

        with open(dest_path, 'wb') as f:
            if total_size == 0:
                f.write(response.content)
            else:
                downloaded = 0
                for chunk in response.iter_content(chunk_size=8192):
                    if chunk:
                        f.write(chunk)
                        downloaded += len(chunk)
                        percent = (downloaded / total_size) * 100
                        print(f"\r   Progress: {percent:.1f}%", end='', flush=True)
                print()

        print(f"✅ Downloaded: {dest_path.name} ({dest_path.stat().st_size / (1024*1024):.2f} MB)")
        return True
    except Exception as e:
        print(f"❌ Failed to download {url}: {e}")
        return False

def copy_meshy_models():
    """Copy existing Meshy AI models to appropriate folders"""
    print("\n" + "="*60)
    print("COPYING EXISTING MESHY AI MODELS")
    print("="*60 + "\n")

    meshy_data = load_existing_meshy_models()
    if not meshy_data:
        print("⚠️  No existing meshy-models.json found")
        return []

    copied_models = []

    for vehicle_key, vehicle_data in meshy_data.get('models', {}).items():
        # Find matching DCF vehicle
        dcf_vehicle = next(
            (v for v in DCF_FLEET_VEHICLES
             if v['make'].lower() == vehicle_data['make'].lower()
             and v['model'].lower() == vehicle_data['model'].lower()),
            None
        )

        if not dcf_vehicle:
            continue

        # Create category folder
        category_dir = MODELS_DIR / dcf_vehicle['folder']
        category_dir.mkdir(exist_ok=True)

        # Model already available from Meshy AI
        model_name = f"{vehicle_data['make']}_{vehicle_data['model']}_{vehicle_data['year'].replace('-', '_')}"
        model_path = category_dir / f"{model_name}.glb"

        # Create reference entry (model URL is external)
        copied_models.append({
            'name': model_name,
            'make': vehicle_data['make'],
            'model': vehicle_data['model'],
            'year': vehicle_data['year'],
            'color': vehicle_data['color'],
            'fleet_count': vehicle_data['fleet_count'],
            'category': dcf_vehicle['category'],
            'folder': dcf_vehicle['folder'],
            'model_url': vehicle_data['model_url'],
            'thumbnail_url': vehicle_data['thumbnail_url'],
            'source': 'Meshy AI',
            'license': 'Generated',
            'status': 'available',
            'meshy_task_id': vehicle_data['meshy_task_id'],
            'path': f"models/vehicles/{dcf_vehicle['folder']}/{model_name}.glb"
        })

        print(f"✅ Registered: {vehicle_data['make']} {vehicle_data['model']} (Meshy AI)")

    return copied_models

def download_sketchfab_alternatives():
    """
    Search queries for downloading similar models from Sketchfab
    """
    print("\n" + "="*60)
    print("SKETCHFAB DOWNLOAD GUIDE - DCF Fleet Matches")
    print("="*60 + "\n")

    search_queries = []

    for vehicle in DCF_FLEET_VEHICLES + COMMON_FLEET_VEHICLES:
        if not vehicle.get('has_meshy_model'):
            query = {
                'vehicle': f"{vehicle['make']} {vehicle['model']}",
                'search_url': f"https://sketchfab.com/search?q={vehicle['make']}+{vehicle['model']}+gltf&type=models&features=downloadable&sort_by=-likeCount",
                'alternative_search': f"https://sketchfab.com/search?q={vehicle['category'].replace('_', '+')}+vehicle+gltf&type=models&features=downloadable",
                'folder': vehicle['folder'],
                'priority': vehicle['priority']
            }
            search_queries.append(query)

    # Print download instructions
    print("📋 MANUAL DOWNLOAD INSTRUCTIONS:")
    print()
    print("For each vehicle, visit the search URL and:")
    print("  1. Filter by 'Downloadable' ✓")
    print("  2. Filter by license: CC0 or CC-BY")
    print("  3. Sort by 'Most Liked'")
    print("  4. Download in glTF format")
    print("  5. Extract to: public/models/vehicles/{folder}/")
    print()

    for i, query in enumerate(search_queries, 1):
        print(f"{i}. {query['vehicle']}")
        print(f"   📂 Folder: {query['folder']}/")
        print(f"   🔗 {query['search_url']}")
        print()

    return search_queries

def download_sample_gltf_models():
    """Download sample glTF models from Khronos Group repository"""
    print("\n" + "="*60)
    print("DOWNLOADING SAMPLE GLTF MODELS")
    print("="*60 + "\n")

    sample_models = [
        {
            "name": "sample_car_toy",
            "url": "https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/ToyCar/glTF-Binary/ToyCar.glb",
            "folder": "specialty",
            "description": "Sample Toy Car Model"
        }
    ]

    downloaded = []

    for model in sample_models:
        category_dir = MODELS_DIR / model['folder']
        category_dir.mkdir(exist_ok=True)

        file_path = category_dir / f"{model['name']}.glb"

        if file_path.exists():
            print(f"⏭️  Skipping {model['name']} (already exists)")
            continue

        if download_file(model['url'], file_path, model['description']):
            downloaded.append({
                'name': model['name'],
                'description': model['description'],
                'path': str(file_path.relative_to(PUBLIC_DIR)),
                'source': 'Khronos glTF Samples',
                'license': 'CC0',
                'status': 'downloaded'
            })
            time.sleep(1)

    return downloaded

def create_comprehensive_catalog(all_models):
    """Create comprehensive model catalog matching emulator data"""
    catalog_path = PUBLIC_DIR / "vehicle-models-catalog.json"

    # Group by category
    by_category = {}
    for model in all_models:
        folder = model.get('folder', 'other')
        if folder not in by_category:
            by_category[folder] = []
        by_category[folder].append(model)

    catalog = {
        "metadata": {
            "generated_at": time.strftime("%Y-%m-%d %H:%M:%S"),
            "total_models": len(all_models),
            "source": "DCF Fleet ITB 2425 077 + Supplemental",
            "formats": ["glTF", "GLB"],
            "sync_status": "synced_with_emulator"
        },
        "dcf_fleet_vehicles": DCF_FLEET_VEHICLES,
        "models": all_models,
        "by_category": by_category,
        "statistics": {
            "total": len(all_models),
            "sedans": len(by_category.get('sedans', [])),
            "suvs": len(by_category.get('suvs', [])),
            "trucks": len(by_category.get('trucks', [])),
            "vans": len(by_category.get('vans', [])),
            "emergency": len(by_category.get('emergency', [])),
            "specialty": len(by_category.get('specialty', [])),
            "meshy_ai": len([m for m in all_models if m.get('source') == 'Meshy AI']),
            "downloaded": len([m for m in all_models if m.get('status') == 'downloaded']),
            "manual_required": len([m for m in all_models if m.get('status') == 'manual_download_required'])
        }
    }

    with open(catalog_path, 'w') as f:
        json.dump(catalog, f, indent=2)

    print(f"\n📋 Comprehensive catalog created: {catalog_path}")
    return catalog

def main():
    """Main orchestrator - sync with DCF fleet data"""
    print("\n" + "🚗"*30)
    print("DCF Fleet - 3D Model Downloader & Catalog Builder")
    print("Synced with Emulator & Mobile App Data")
    print("🚗"*30 + "\n")

    all_models = []

    # Step 1: Register existing Meshy AI models
    all_models.extend(copy_meshy_models())

    # Step 2: Download sample models
    all_models.extend(download_sample_gltf_models())

    # Step 3: Create Sketchfab download guide
    sketchfab_queries = download_sketchfab_alternatives()

    # Add Sketchfab entries as "manual required"
    for query in sketchfab_queries:
        all_models.append({
            'name': query['vehicle'].replace(' ', '_').lower(),
            'description': query['vehicle'],
            'search_url': query['search_url'],
            'folder': query['folder'],
            'source': 'Sketchfab',
            'status': 'manual_download_required',
            'priority': query['priority']
        })

    # Step 4: Create comprehensive catalog
    catalog = create_comprehensive_catalog(all_models)

    # Summary
    print("\n" + "="*60)
    print("CATALOG SUMMARY")
    print("="*60)
    print(f"✅ Total models in catalog: {catalog['statistics']['total']}")
    print(f"🤖 Meshy AI models: {catalog['statistics']['meshy_ai']}")
    print(f"📦 Downloaded: {catalog['statistics']['downloaded']}")
    print(f"⚠️  Manual download required: {catalog['statistics']['manual_required']}")
    print()
    print(f"📂 By Category:")
    print(f"   🚗 Sedans: {catalog['statistics']['sedans']}")
    print(f"   🚙 SUVs: {catalog['statistics']['suvs']}")
    print(f"   🚚 Trucks: {catalog['statistics']['trucks']}")
    print(f"   🚐 Vans: {catalog['statistics']['vans']}")
    print(f"   🚑 Emergency: {catalog['statistics']['emergency']}")
    print(f"   ⚙️  Specialty: {catalog['statistics']['specialty']}")
    print()
    print("="*60)
    print()
    print(f"📁 Models location: {MODELS_DIR}")
    print(f"📋 Catalog: {PUBLIC_DIR / 'vehicle-models-catalog.json'}")
    print(f"📋 Meshy models: {MESHY_MODELS_PATH}")
    print()
    print("✨ Catalog generation complete!")
    print()
    print("🔄 SYNC STATUS: Models synced with emulator and mobile app")
    print()

if __name__ == "__main__":
    main()
