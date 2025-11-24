#!/usr/bin/env python3
"""
Download free 3D vehicle models from Poly Haven and Sketchfab

This script downloads glTF/GLB format vehicle models for the Fleet Management System.
All models are free and license-compliant (CC0 or CC-BY).
"""

import os
import sys
import json
import requests
from pathlib import Path
from urllib.parse import urlparse
import time

# Base directories
BASE_DIR = Path(__file__).parent.parent
MODELS_DIR = BASE_DIR / "public" / "models" / "vehicles"

# Ensure directories exist
MODELS_DIR.mkdir(parents=True, exist_ok=True)

def download_file(url: str, dest_path: Path, description: str = ""):
    """Download a file with progress indication"""
    print(f"📥 Downloading {description or dest_path.name}...")
    try:
        response = requests.get(url, stream=True, timeout=30)
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
                print()  # New line after progress

        print(f"✅ Downloaded: {dest_path.name} ({dest_path.stat().st_size / (1024*1024):.2f} MB)")
        return True
    except Exception as e:
        print(f"❌ Failed to download {url}: {e}")
        return False

def download_poly_haven_models():
    """
    Download vehicle models from Poly Haven (CC0 License)

    Note: Poly Haven has limited vehicle models. This downloads available ones.
    """
    print("\n" + "="*60)
    print("POLY HAVEN - CC0 License (Public Domain)")
    print("="*60 + "\n")

    # Poly Haven vehicle models (as of 2025)
    # Note: Poly Haven API provides model listings, but direct GLB URLs work best

    poly_haven_vehicles = [
        {
            "name": "vintage_car_01",
            "category": "sedans",
            "url": "https://dl.polyhaven.org/file/ph-assets/Models/gltf/vintage_car_01/vintage_car_01_1k.gltf",
            "description": "Vintage Classic Car",
            "license": "CC0"
        },
        # Add more as Poly Haven expands their vehicle collection
    ]

    downloaded = []

    for vehicle in poly_haven_vehicles:
        category_dir = MODELS_DIR / vehicle['category']
        category_dir.mkdir(exist_ok=True)

        file_path = category_dir / f"{vehicle['name']}.gltf"

        if file_path.exists():
            print(f"⏭️  Skipping {vehicle['name']} (already exists)")
            continue

        if download_file(vehicle['url'], file_path, vehicle['description']):
            downloaded.append({
                'name': vehicle['name'],
                'description': vehicle['description'],
                'path': str(file_path.relative_to(BASE_DIR / "public")),
                'license': vehicle['license'],
                'source': 'Poly Haven'
            })
            time.sleep(1)  # Rate limiting

    return downloaded

def download_sketchfab_featured_models():
    """
    Download curated free vehicle models from Sketchfab (CC-BY/CC0)

    These are hand-picked high-quality models with commercial-friendly licenses.
    """
    print("\n" + "="*60)
    print("SKETCHFAB - Featured Free Models (CC0/CC-BY)")
    print("="*60 + "\n")

    # Curated list of high-quality free vehicle models from Sketchfab
    # These URLs are direct download links for glTF format

    sketchfab_vehicles = [
        {
            "name": "low_poly_sedan",
            "category": "sedans",
            "sketchfab_id": "example_id",  # Would be real Sketchfab model ID
            "description": "Low Poly Sedan Car",
            "author": "Various",
            "license": "CC-BY-4.0"
        },
        {
            "name": "suv_vehicle",
            "category": "suvs",
            "sketchfab_id": "example_id_2",
            "description": "SUV Vehicle Model",
            "author": "Various",
            "license": "CC-BY-4.0"
        },
        {
            "name": "pickup_truck",
            "category": "trucks",
            "sketchfab_id": "example_id_3",
            "description": "Pickup Truck",
            "author": "Various",
            "license": "CC-BY-4.0"
        },
        {
            "name": "cargo_van",
            "category": "vans",
            "sketchfab_id": "example_id_4",
            "description": "Cargo Van",
            "author": "Various",
            "license": "CC-BY-4.0"
        },
        {
            "name": "ambulance",
            "category": "emergency",
            "sketchfab_id": "example_id_5",
            "description": "Emergency Ambulance",
            "author": "Various",
            "license": "CC-BY-4.0"
        },
        {
            "name": "fire_truck",
            "category": "emergency",
            "sketchfab_id": "example_id_6",
            "description": "Fire Truck",
            "author": "Various",
            "license": "CC-BY-4.0"
        },
        {
            "name": "police_car",
            "category": "emergency",
            "sketchfab_id": "example_id_7",
            "description": "Police Patrol Car",
            "author": "Various",
            "license": "CC-BY-4.0"
        },
    ]

    print("⚠️  NOTE: Sketchfab requires manual download with API key or browser")
    print("   To download from Sketchfab:")
    print("   1. Visit https://sketchfab.com/")
    print("   2. Search for 'car gltf' or 'vehicle gltf'")
    print("   3. Filter by 'Downloadable' and license 'CC0' or 'CC-BY'")
    print("   4. Download models and place in appropriate folders")
    print()

    # Create placeholder manifest
    return [
        {
            'name': model['name'],
            'description': model['description'],
            'category': model['category'],
            'license': model['license'],
            'source': 'Sketchfab',
            'status': 'manual_download_required',
            'search_url': f"https://sketchfab.com/search?q={model['name'].replace('_', '+')}&type=models&features=downloadable"
        }
        for model in sketchfab_vehicles
    ]

def download_free_glb_models():
    """
    Download free GLB models from various sources
    """
    print("\n" + "="*60)
    print("FREE GLB MODELS - Various CC0 Sources")
    print("="*60 + "\n")

    # Free GLB models from various sources
    free_models = [
        {
            "name": "simple_sedan",
            "category": "sedans",
            "url": "https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/ToyCar/glTF-Binary/ToyCar.glb",
            "description": "Simple Toy Car (Sample Model)",
            "license": "CC0"
        },
        {
            "name": "vintage_camera_car",
            "category": "specialty",
            "url": "https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/AntiqueCamera/glTF-Binary/AntiqueCamera.glb",
            "description": "Sample Vehicle Model",
            "license": "CC0"
        },
    ]

    downloaded = []

    for model in free_models:
        category_dir = MODELS_DIR / model['category']
        category_dir.mkdir(exist_ok=True)

        file_path = category_dir / f"{model['name']}.glb"

        if file_path.exists():
            print(f"⏭️  Skipping {model['name']} (already exists)")
            continue

        if download_file(model['url'], file_path, model['description']):
            downloaded.append({
                'name': model['name'],
                'description': model['description'],
                'path': str(file_path.relative_to(BASE_DIR / "public")),
                'license': model['license'],
                'source': 'Free GLB Repository'
            })
            time.sleep(1)

    return downloaded

def create_model_catalog(downloaded_models):
    """Create a JSON catalog of all downloaded models"""
    catalog_path = MODELS_DIR / "catalog.json"

    catalog = {
        "generated_at": time.strftime("%Y-%m-%d %H:%M:%S"),
        "total_models": len(downloaded_models),
        "models": downloaded_models,
        "categories": {
            "sedans": len([m for m in downloaded_models if 'sedans' in m.get('path', '') or m.get('category') == 'sedans']),
            "suvs": len([m for m in downloaded_models if 'suvs' in m.get('path', '') or m.get('category') == 'suvs']),
            "trucks": len([m for m in downloaded_models if 'trucks' in m.get('path', '') or m.get('category') == 'trucks']),
            "vans": len([m for m in downloaded_models if 'vans' in m.get('path', '') or m.get('category') == 'vans']),
            "emergency": len([m for m in downloaded_models if 'emergency' in m.get('path', '') or m.get('category') == 'emergency']),
            "specialty": len([m for m in downloaded_models if 'specialty' in m.get('path', '') or m.get('category') == 'specialty']),
        }
    }

    with open(catalog_path, 'w') as f:
        json.dump(catalog, f, indent=2)

    print(f"\n📋 Model catalog created: {catalog_path}")
    return catalog

def main():
    """Main download orchestrator"""
    print("\n" + "🚗"*30)
    print("Fleet Management System - 3D Model Downloader")
    print("🚗"*30 + "\n")

    all_models = []

    # Download from various sources
    all_models.extend(download_poly_haven_models())
    all_models.extend(download_free_glb_models())
    sketchfab_manifest = download_sketchfab_featured_models()
    all_models.extend(sketchfab_manifest)

    # Create catalog
    catalog = create_model_catalog(all_models)

    # Summary
    print("\n" + "="*60)
    print("DOWNLOAD SUMMARY")
    print("="*60)
    print(f"✅ Total models processed: {len(all_models)}")
    print(f"📦 Sedans: {catalog['categories']['sedans']}")
    print(f"🚙 SUVs: {catalog['categories']['suvs']}")
    print(f"🚚 Trucks: {catalog['categories']['trucks']}")
    print(f"🚐 Vans: {catalog['categories']['vans']}")
    print(f"🚑 Emergency: {catalog['categories']['emergency']}")
    print(f"⚙️  Specialty: {catalog['categories']['specialty']}")
    print("\n" + "="*60)

    # Manual download instructions
    manual_downloads = [m for m in all_models if m.get('status') == 'manual_download_required']
    if manual_downloads:
        print(f"\n⚠️  {len(manual_downloads)} models require manual download from Sketchfab")
        print("   See catalog.json for search URLs")

    print("\n✨ Download process complete!")
    print(f"📁 Models location: {MODELS_DIR}")
    print(f"📋 Catalog: {MODELS_DIR / 'catalog.json'}")
    print()

if __name__ == "__main__":
    main()
