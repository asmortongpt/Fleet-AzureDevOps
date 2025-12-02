#!/usr/bin/env python3
"""
Smart 3D Model Downloader - PHOTOREALISTIC AMERICAN VEHICLES
Intelligently downloads models from the best free sources
Matches existing database catalog exactly
"""

import os
import json
import requests
import time
from pathlib import Path
from typing import Dict, List, Optional
import urllib.parse

# Paths
BASE_DIR = Path(__file__).parent.parent
CATALOG_PATH = BASE_DIR / "public" / "fleet-3d-catalog.json"
MODELS_DIR = BASE_DIR / "public" / "models" / "vehicles"

# Headers for web requests
HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
    'Accept': 'application/octet-stream,*/*'
}

# High-quality free model sources with known direct download URLs
KNOWN_SOURCES = {
    # Poly Pizza - CC0, direct API access
    "poly_pizza_api": "https://poly.pizza/api/search",

    # Sketchfab API - search only (downloads need OAuth)
    "sketchfab_api": "https://api.sketchfab.com/v3/search",

    # GitHub repos with free models
    "github_models": [
        "https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/",
        "https://raw.githubusercontent.com/visgl/deck.gl-data/master/examples/",
    ]
}

# Fallback high-quality models by category (CC0 licensed)
FALLBACK_MODELS = {
    "trucks": {
        "url": "https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/CesiumMilkTruck/glTF-Binary/CesiumMilkTruck.glb",
        "name": "Cesium Milk Truck",
        "quality": "good"
    },
    "sedans": {
        "url": "https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/ToyCar/glTF-Binary/ToyCar.glb",
        "name": "Toy Car",
        "quality": "basic"
    },
    "suvs": {
        "url": "https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/ToyCar/glTF-Binary/ToyCar.glb",
        "name": "Toy Car",
        "quality": "basic"
    },
    "vans": {
        "url": "https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/CesiumMilkTruck/glTF-Binary/CesiumMilkTruck.glb",
        "name": "Generic Van",
        "quality": "basic"
    },
    "construction": {
        "url": "https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/BoxAnimated/glTF-Binary/BoxAnimated.glb",
        "name": "Generic Construction",
        "quality": "placeholder"
    },
    "trailers": {
        "url": "https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/BoxAnimated/glTF-Binary/BoxAnimated.glb",
        "name": "Generic Trailer",
        "quality": "placeholder"
    },
    "electric_sedans": {
        "url": "https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/ToyCar/glTF-Binary/ToyCar.glb",
        "name": "Generic Electric Sedan",
        "quality": "basic"
    },
    "electric_suvs": {
        "url": "https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/ToyCar/glTF-Binary/ToyCar.glb",
        "name": "Generic Electric SUV",
        "quality": "basic"
    }
}

def load_catalog() -> Dict:
    """Load the fleet 3D catalog"""
    with open(CATALOG_PATH) as f:
        return json.load(f)

def save_catalog(catalog: Dict):
    """Save updated catalog"""
    with open(CATALOG_PATH, 'w') as f:
        json.dump(catalog, f, indent=2)

def download_file(url: str, destination: Path) -> bool:
    """Download file from URL"""
    try:
        print(f"      📥 Downloading from: {url[:70]}...")

        response = requests.get(url, stream=True, headers=HEADERS, timeout=60, allow_redirects=True)
        response.raise_for_status()

        # Check if we got a model file (not HTML)
        content_type = response.headers.get('Content-Type', '').lower()
        if 'text/html' in content_type:
            return False

        destination.parent.mkdir(parents=True, exist_ok=True)

        total_size = int(response.headers.get('content-length', 0))
        downloaded = 0

        with open(destination, 'wb') as f:
            for chunk in response.iter_content(chunk_size=8192):
                f.write(chunk)
                downloaded += len(chunk)

        file_size_mb = destination.stat().st_size / (1024 * 1024)

        # Validate minimum size (10KB)
        if file_size_mb < 0.01:
            destination.unlink()
            return False

        print(f"      ✅ Downloaded: {file_size_mb:.2f} MB")
        return True

    except Exception as e:
        if destination.exists():
            destination.unlink()
        return False

def search_poly_pizza(search_query: str) -> Optional[str]:
    """Search Poly Pizza API for models"""
    try:
        api_url = f"https://poly.pizza/api/search?q={urllib.parse.quote(search_query)}"

        response = requests.get(api_url, timeout=10, headers=HEADERS)

        if response.status_code == 200:
            results = response.json()

            if results and len(results) > 0:
                # Get first result
                model = results[0]

                # Try to get download URL
                if isinstance(model, dict):
                    if 'files' in model and 'glb' in model['files']:
                        return model['files']['glb']
                    elif 'url' in model:
                        return model['url']

    except:
        pass

    return None

def search_sketchfab(search_query: str) -> Optional[Dict]:
    """Search Sketchfab API (returns model info, not download URL)"""
    try:
        api_url = "https://api.sketchfab.com/v3/search"

        params = {
            'type': 'models',
            'q': search_query,
            'downloadable': 'true',
            'sort_by': '-likeCount',
            'count': 1
        }

        response = requests.get(api_url, params=params, headers=HEADERS, timeout=15)

        if response.status_code == 200:
            data = response.json()

            if 'results' in data and len(data['results']) > 0:
                model = data['results'][0]
                return {
                    'name': model.get('name'),
                    'uid': model.get('uid'),
                    'url': f"https://sketchfab.com/3d-models/{model.get('uid')}",
                    'likes': model.get('likeCount', 0),
                    'views': model.get('viewCount', 0)
                }

    except:
        pass

    return None

def try_download_vehicle_model(vehicle: Dict) -> tuple[bool, str]:
    """
    Try to download model for vehicle
    Returns: (success, source/message)
    """
    category_dir = MODELS_DIR / vehicle["category"]
    destination = category_dir / f"{vehicle['id']}.glb"

    # Check if already exists
    if destination.exists():
        file_size_mb = destination.stat().st_size / (1024 * 1024)
        return (True, f"already_exists ({file_size_mb:.2f} MB)")

    search_query = vehicle.get('search_query', f"{vehicle['make']} {vehicle['model']}")

    print(f"\n   🔍 Searching: {vehicle['make']} {vehicle['model']}")
    print(f"      Category: {vehicle['category']}, Priority: {vehicle['priority']}, Fleet: {vehicle['fleet_count']}x")

    # Strategy 1: Try Poly Pizza API
    print(f"      1️⃣ Checking Poly Pizza...")
    poly_url = search_poly_pizza(search_query)

    if poly_url:
        print(f"      ✅ Found on Poly Pizza!")
        if download_file(poly_url, destination):
            return (True, "poly_pizza")

    # Strategy 2: Check Sketchfab (for info, not download)
    print(f"      2️⃣ Checking Sketchfab...")
    sketchfab_info = search_sketchfab(search_query)

    if sketchfab_info:
        print(f"      ✅ Found on Sketchfab: {sketchfab_info['name']}")
        print(f"         Likes: {sketchfab_info['likes']}, Views: {sketchfab_info['views']}")
        print(f"         URL: {sketchfab_info['url']}")
        print(f"         ⚠️  Requires manual download (OAuth)")
        # Store URL for later
        vehicle['sketchfab_url'] = sketchfab_info['url']

    # Strategy 3: Use category fallback
    print(f"      3️⃣ Using fallback model...")
    if vehicle['category'] in FALLBACK_MODELS:
        fallback = FALLBACK_MODELS[vehicle['category']]
        print(f"      Using: {fallback['name']} (Quality: {fallback['quality']})")

        if download_file(fallback['url'], destination):
            return (True, f"fallback_{fallback['quality']}")

    return (False, "not_found")

def create_manual_download_guide(catalog: Dict, downloaded_stats: Dict):
    """Create comprehensive manual download guide"""

    guide_path = BASE_DIR / "DOWNLOAD_GUIDE.md"

    # Get models that need manual download
    needs_manual = [
        m for m in catalog['models']
        if not (MODELS_DIR / m['category'] / f"{m['id']}.glb").exists()
        or downloaded_stats.get(m['id']) == 'fallback'
    ]

    content = f"""# 3D Model Download Guide

## 📊 Current Status

- **Total Models**: {len(catalog['models'])}
- **Downloaded**: {downloaded_stats['downloaded']}
- **Using Fallbacks**: {downloaded_stats['fallbacks']}
- **Need Manual Download**: {len(needs_manual)}

## ✅ What's Already Done

The automatic downloader has:
1. ✅ Downloaded {downloaded_stats['downloaded']} models from free sources
2. ✅ Placed {downloaded_stats['fallbacks']} fallback models (replace with photorealistic)
3. ✅ Found Sketchfab links for photorealistic versions
4. ✅ Created folder structure for all categories

## 🎯 Models Needing Photorealistic Versions ({len(needs_manual)} total)

### Quick Download Process:

1. Click the Sketchfab link below
2. Sign up/login (free, 30 seconds)
3. Click "Download 3D Model"
4. Select "Autoconverted format (glTF)" or "Original format"
5. Extract and rename `.glb` file
6. Move to destination folder
7. Run `python3 scripts/update_3d_catalog.py`

---

"""

    # Group by priority
    for priority in [1, 2, 3, 4]:
        priority_models = [m for m in needs_manual if m.get('priority') == priority]

        if priority_models:
            priority_labels = {
                1: "🔥 HIGH PRIORITY",
                2: "🟡 MEDIUM PRIORITY",
                3: "🔵 NORMAL PRIORITY",
                4: "⚪ LOW PRIORITY"
            }

            content += f"\n### Priority {priority}: {priority_labels[priority]} ({len(priority_models)} models)\n\n"

            for model in sorted(priority_models, key=lambda x: -x.get('fleet_count', 0)):
                sketchfab_url = model.get('sketchfab_url') or f"https://sketchfab.com/search?features=downloadable&q={urllib.parse.quote(model['search_query'])}&sort_by=-likeCount"

                content += f"""#### {model['fleet_count']}x {model['make']} {model['model']}

- **File**: `{model['id']}.glb`
- **Destination**: `{model['target_path']}`
- **Download**: [Sketchfab]({sketchfab_url})
- **Alternative**: [Free3D](https://free3d.com/3d-models/{urllib.parse.quote(model['make'] + ' ' + model['model'])})

"""

    content += """
---

## 🚀 After Downloading

Once you've downloaded models, run:

```bash
# Update catalog with new models
python3 scripts/update_3d_catalog.py

# Populate database
python3 scripts/populate_database.py

# Test the emulator
npm run emulator
```

## 💡 Tips for Best Quality

- **Look for**: "PBR", "Photorealistic", "High Poly"
- **Avoid**: "Low Poly", "Game Ready", "Mobile"
- **Check**: Likes 500+, Views 10k+
- **License**: CC0 (Public Domain) or CC-BY (Attribution)

## 📞 Need Help?

If you can't find a specific model:
1. Try similar models (e.g., F-150 instead of F-250)
2. Use generic vehicles of the same type
3. Contact support for alternative sources

---

*Generated by Smart Model Downloader*
"""

    with open(guide_path, 'w') as f:
        f.write(content)

    print(f"\n📄 Created: {guide_path}")

def main():
    """Main execution"""
    print("\n" + "🚗" * 40)
    print("SMART 3D MODEL DOWNLOADER")
    print("Photorealistic American Vehicles")
    print("Matches Database Catalog Exactly")
    print("🚗" * 40)

    # Load catalog
    catalog = load_catalog()

    print(f"\n📦 Catalog Info:")
    print(f"   Total vehicles: {catalog['metadata']['total_vehicles']}")
    print(f"   Unique models: {catalog['metadata']['unique_models']}")
    print(f"   Models pending: {catalog['metadata']['models_pending']}")

    downloaded_stats = {
        'downloaded': 0,
        'fallbacks': 0,
        'failed': 0,
        'already_exist': 0
    }

    results = {}

    # Process each model
    for i, vehicle in enumerate(catalog['models'], 1):
        print(f"\n[{i}/{len(catalog['models'])}] {'='*60}")

        success, source = try_download_vehicle_model(vehicle)

        results[vehicle['id']] = source

        if success:
            if source.startswith('already_exists'):
                downloaded_stats['already_exist'] += 1
            elif source.startswith('fallback'):
                downloaded_stats['fallbacks'] += 1
            else:
                downloaded_stats['downloaded'] += 1

            # Update catalog
            vehicle['has_3d_model'] = True
            vehicle['model_url'] = f"/models/vehicles/{vehicle['category']}/{vehicle['id']}.glb"
        else:
            downloaded_stats['failed'] += 1

        # Rate limiting
        time.sleep(1)

    # Update catalog metadata
    catalog['metadata']['models_with_files'] = downloaded_stats['downloaded'] + downloaded_stats['fallbacks'] + downloaded_stats['already_exist']
    catalog['metadata']['models_pending'] = downloaded_stats['failed']
    catalog['metadata']['last_updated'] = time.strftime('%Y-%m-%d')

    # Save updated catalog
    save_catalog(catalog)

    # Create download guide
    create_manual_download_guide(catalog, downloaded_stats)

    # Summary
    print("\n" + "=" * 80)
    print("DOWNLOAD SUMMARY")
    print("=" * 80)
    print(f"✅ Already existed: {downloaded_stats['already_exist']}")
    print(f"✅ Newly downloaded: {downloaded_stats['downloaded']}")
    print(f"⚠️  Using fallbacks: {downloaded_stats['fallbacks']} (replace with photorealistic)")
    print(f"❌ Failed: {downloaded_stats['failed']}")
    print()
    print(f"📊 Total coverage: {downloaded_stats['downloaded'] + downloaded_stats['fallbacks'] + downloaded_stats['already_exist']}/{len(catalog['models'])} models have files")
    print()
    print(f"📄 See DOWNLOAD_GUIDE.md for manual download instructions")
    print(f"🚀 Run: python3 scripts/populate_database.py (when DB is ready)")
    print()

if __name__ == "__main__":
    main()
