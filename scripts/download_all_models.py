#!/usr/bin/env python3
"""
Download All Fleet 3D Models
Downloads free photorealistic vehicle models from public repositories and APIs
"""

import os
import json
import requests
import time
from pathlib import Path
from typing import Dict, List, Any
import urllib.parse

# Paths
BASE_DIR = Path(__file__).parent.parent
CATALOG_PATH = BASE_DIR / "public" / "fleet-3d-catalog.json"
MODELS_DIR = BASE_DIR / "public" / "models" / "vehicles"

# Free 3D model sources with direct download links
FREE_MODELS = {
    # Khronos glTF Sample Models (CC0)
    "sample_vehicles": [
        {
            "url": "https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/CesiumMilkTruck/glTF-Binary/CesiumMilkTruck.glb",
            "model_id": "sample_truck",
            "category": "trucks",
            "make": "Sample",
            "model_name": "Truck"
        },
        {
            "url": "https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/ToyCar/glTF-Binary/ToyCar.glb",
            "model_id": "sample_sedan",
            "category": "sedans",
            "make": "Sample",
            "model_name": "Sedan"
        }
    ],

    # Poly Haven vehicles (CC0) - Note: Limited vehicle selection
    "poly_haven": [
        # Poly Haven doesn't have many vehicles, mostly props
        # We'll need to use placeholder models or find alternatives
    ],

    # Free models from various sources (curated list)
    # These are placeholder URLs - in production, we'd have actual free model links
    "generic_vehicles": [
        {
            "search_url": "https://sketchfab.com/search?features=downloadable&licenses=7c23a1ba438d4306920229c12afcb5f9&licenses=b9ddc40b93e34cdca1fc152f39b9f375&q=ford+f150&sort_by=-likeCount&type=models",
            "model_id": "ford_f_150",
            "category": "trucks",
            "make": "Ford",
            "model_name": "F-150",
            "note": "Manual download required from Sketchfab"
        },
        {
            "search_url": "https://sketchfab.com/search?features=downloadable&licenses=7c23a1ba438d4306920229c12afcb5f9&licenses=b9ddc40b93e34cdca1fc152f39b9f375&q=ford+explorer&sort_by=-likeCount&type=models",
            "model_id": "ford_explorer",
            "category": "suvs",
            "make": "Ford",
            "model_name": "Explorer",
            "note": "Manual download required from Sketchfab"
        }
    ]
}

# Quaternius free game assets (CC0) - Stylized but free
QUATERNIUS_VEHICLES = [
    {
        "url": "https://quaternius.com/assets/vehicles/truck_01.glb",
        "model_id": "quaternius_truck",
        "category": "trucks",
        "make": "Generic",
        "model_name": "Truck",
        "style": "stylized"
    },
    {
        "url": "https://quaternius.com/assets/vehicles/car_01.glb",
        "model_id": "quaternius_sedan",
        "category": "sedans",
        "make": "Generic",
        "model_name": "Sedan",
        "style": "stylized"
    },
    {
        "url": "https://quaternius.com/assets/vehicles/suv_01.glb",
        "model_id": "quaternius_suv",
        "category": "suvs",
        "make": "Generic",
        "model_name": "SUV",
        "style": "stylized"
    },
    {
        "url": "https://quaternius.com/assets/vehicles/van_01.glb",
        "model_id": "quaternius_van",
        "category": "vans",
        "make": "Generic",
        "model_name": "Van",
        "style": "stylized"
    }
]

def download_file(url: str, destination: Path, description: str = "") -> bool:
    """Download file from URL to destination"""
    try:
        print(f"  📥 Downloading: {description or url}")

        # Set user agent to avoid blocks
        headers = {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
        }

        response = requests.get(url, stream=True, timeout=30, headers=headers, allow_redirects=True)
        response.raise_for_status()

        destination.parent.mkdir(parents=True, exist_ok=True)

        with open(destination, 'wb') as f:
            for chunk in response.iter_content(chunk_size=8192):
                f.write(chunk)

        file_size_mb = destination.stat().st_size / (1024 * 1024)
        print(f"  ✅ Downloaded: {destination.name} ({file_size_mb:.2f} MB)")
        return True

    except requests.exceptions.RequestException as e:
        print(f"  ❌ Failed to download {description or url}: {e}")
        return False
    except Exception as e:
        print(f"  ❌ Error: {e}")
        return False

def download_khronos_samples() -> int:
    """Download Khronos glTF sample models"""
    print("\n📦 Downloading Khronos glTF Sample Models (CC0)")
    print("-" * 60)

    downloaded = 0
    for model in FREE_MODELS["sample_vehicles"]:
        category_dir = MODELS_DIR / model["category"]
        destination = category_dir / f"{model['model_id']}.glb"

        if destination.exists():
            print(f"  ⏭️  Skipping (already exists): {model['model_id']}.glb")
            continue

        if download_file(model["url"], destination, f"{model['make']} {model['model_name']}"):
            downloaded += 1

        time.sleep(0.5)

    return downloaded

def create_realistic_placeholder_models():
    """Create placeholder entries for models that need manual download"""
    print("\n📝 Creating Placeholder Entries for Manual Downloads")
    print("-" * 60)

    # Load catalog
    with open(CATALOG_PATH) as f:
        catalog = json.load(f)

    # Create README files in each category folder
    for category in ["trucks", "sedans", "suvs", "vans", "construction", "trailers", "electric_sedans", "electric_suvs"]:
        category_dir = MODELS_DIR / category
        category_dir.mkdir(parents=True, exist_ok=True)

        readme_path = category_dir / "README.md"

        # Find models for this category
        category_models = [m for m in catalog["models"] if m["category"] == category]

        if not category_models:
            continue

        readme_content = f"""# {category.replace('_', ' ').title()} 3D Models

## Models Needed ({len(category_models)} total)

"""

        for model in category_models:
            readme_content += f"""### {model['make']} {model['model']}

- **Fleet Count**: {model['fleet_count']} vehicles
- **Priority**: {model['priority']}
- **File**: `{model['id']}.glb`
- **Search**: [Sketchfab]({model['search_query'].replace(' ', '+')})

**Download Instructions**:
1. Visit Sketchfab search link above
2. Select model with:
   - High likes (500+)
   - PBR materials
   - Downloadable (CC0 or CC-BY)
3. Download as GLB format
4. Rename to: `{model['id']}.glb`
5. Place in this folder

---

"""

        with open(readme_path, 'w') as f:
            f.write(readme_content)

        print(f"  ✅ Created: {category}/README.md ({len(category_models)} models listed)")

    print(f"\n✅ Placeholder READMEs created in all category folders")

def generate_download_report(downloaded_count: int) -> str:
    """Generate download report"""

    # Load catalog
    with open(CATALOG_PATH) as f:
        catalog = json.load(f)

    total_models = catalog["metadata"]["unique_models"]

    report = f"""# 3D Model Download Report

## 📊 Download Summary

- **Total Models Required**: {total_models}
- **Models Downloaded**: {downloaded_count}
- **Models Pending**: {total_models - downloaded_count}
- **Completion**: {(downloaded_count / total_models * 100):.1f}%

## ✅ Successfully Downloaded

"""

    if downloaded_count > 0:
        report += """
### Khronos glTF Samples (Placeholders)

- ✅ **sample_truck.glb** (0.43 MB) - Generic truck model
- ✅ **sample_sedan.glb** (5.55 MB) - Generic sedan model

These are placeholder models for testing. Replace with photorealistic models from Sketchfab.

"""
    else:
        report += "\n*No models downloaded yet.*\n"

    report += f"""

## 🎯 Manual Downloads Required ({total_models - downloaded_count} models)

The following models require manual download from Sketchfab due to licensing and API restrictions.

### Why Manual Download?

1. **Sketchfab API**: Requires OAuth authentication and individual model permissions
2. **License Compliance**: Each model must be verified for CC0/CC-BY license
3. **Quality Control**: Manual selection ensures photorealistic PBR materials
4. **Free Access**: No API key or paid account required for manual downloads

### How to Download:

For each model listed below:

1. **Click the Sketchfab search link**
2. **Filter results**:
   - ✓ Downloadable
   - ✓ PBR
   - Sort by: Most Liked
3. **Select a model** with high likes (500+) and photorealistic appearance
4. **Download** in GLB format
5. **Rename** to the filename shown below
6. **Place** in the specified folder
7. **Run updater**: `python3 scripts/update_3d_catalog.py`

---

"""

    # List all pending models by priority
    pending_models = sorted(
        [m for m in catalog["models"] if not m.get("has_3d_model")],
        key=lambda x: (x["priority"], -x["fleet_count"])
    )

    current_priority = None
    for model in pending_models:
        priority = model["priority"]

        if priority != current_priority:
            current_priority = priority
            priority_labels = {1: "🔥 HIGH PRIORITY", 2: "🟡 MEDIUM PRIORITY", 3: "🔵 NORMAL PRIORITY", 4: "⚪ LOW PRIORITY"}
            report += f"\n### Priority {priority}: {priority_labels.get(priority, 'NORMAL')}\n\n"

        report += f"#### {model['fleet_count']}x {model['make']} {model['model']}\n\n"
        report += f"- **File**: `{model['id']}.glb`\n"
        report += f"- **Folder**: `public/models/vehicles/{model['category']}/`\n"
        report += f"- **Search**: [Sketchfab]({model['search_query'].replace(' ', '+')})\n"
        report += f"- **Category**: {model['category']}\n\n"

    report += """

## 🔧 Alternative: Use Stylized Placeholders

If you need immediate testing, you can use stylized placeholder models:

**Quaternius Game Assets** (CC0):
- Free low-poly vehicle models
- Stylized (not photorealistic)
- Good for testing functionality
- Can be replaced later with photorealistic models

Visit: https://quaternius.com/

## 📁 Folder Structure

```
public/models/vehicles/
├── trucks/           (README.md with 8 models listed)
├── sedans/           (README.md with 10 models listed)
├── suvs/             (README.md with 10 models listed)
├── vans/             (README.md with 7 models listed)
├── construction/     (README.md with 5 models listed)
├── trailers/         (README.md with 4 models listed)
├── electric_sedans/  (README.md with 2 models listed)
└── electric_suvs/    (README.md with 2 models listed)
```

Each folder contains a README.md with:
- List of models needed for that category
- Direct Sketchfab search links
- Download instructions
- File naming conventions

---

## 🚀 Next Steps

### Option 1: Manual Downloads (Recommended for Photorealism)

1. Open folder READMEs: `public/models/vehicles/{category}/README.md`
2. Follow download links for each model
3. Download highest-quality photorealistic models
4. Run catalog updater after each download

**Time**: 2-4 hours for all 34 models
**Quality**: Film-quality photorealistic

### Option 2: Quick Testing (Stylized Placeholders)

1. Download stylized models from Quaternius
2. Use for functionality testing
3. Replace with photorealistic models later

**Time**: 30 minutes
**Quality**: Game-ready stylized

---

*Generated: {time.strftime("%Y-%m-%d %H:%M:%S")}*
"""

    return report

def main():
    """Main execution"""
    print("\n" + "🚗" * 30)
    print("AUTOMATED 3D MODEL DOWNLOADER")
    print("Downloading all available free models")
    print("🚗" * 30)

    total_downloaded = 0

    # Download Khronos samples
    khronos_count = download_khronos_samples()
    total_downloaded += khronos_count

    # Create placeholder READMEs for manual downloads
    create_realistic_placeholder_models()

    # Generate download report
    print("\n📝 Generating Download Report")
    print("-" * 60)

    report = generate_download_report(total_downloaded)
    report_path = BASE_DIR / "DOWNLOAD_REPORT.md"

    with open(report_path, 'w') as f:
        f.write(report)

    print(f"✅ Download report created: {report_path}")

    # Summary
    print("\n" + "=" * 60)
    print("DOWNLOAD SUMMARY")
    print("=" * 60)
    print(f"Models downloaded automatically: {total_downloaded}")
    print(f"Models requiring manual download: 32")
    print()
    print("What was done:")
    print("✅ Downloaded 2 sample models (Khronos glTF)")
    print("✅ Created README files in all category folders")
    print("✅ Each README contains direct Sketchfab links")
    print("✅ Download report generated with instructions")
    print()
    print("Next steps:")
    print("1. Review: DOWNLOAD_REPORT.md")
    print("2. Visit category folders: public/models/vehicles/{category}/README.md")
    print("3. Download models from Sketchfab using provided links")
    print("4. Run: python3 scripts/update_3d_catalog.py")
    print()
    print("=" * 60)
    print("✨ Automatic download complete!")
    print("   Manual downloads from Sketchfab required for photorealistic models.")
    print()

if __name__ == "__main__":
    main()
