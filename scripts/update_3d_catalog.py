#!/usr/bin/env python3
"""
Update 3D Model Catalog
Scans for downloaded models and updates the catalog with actual file paths
"""

import json
from pathlib import Path
from typing import Dict, List, Any
import os

# Paths
BASE_DIR = Path(__file__).parent.parent
CATALOG_PATH = BASE_DIR / "public" / "fleet-3d-catalog.json"
MODELS_DIR = BASE_DIR / "public" / "models" / "vehicles"

def scan_downloaded_models() -> Dict[str, Any]:
    """Scan models directory for downloaded GLB/GLTF files"""
    models_found = {}

    if not MODELS_DIR.exists():
        return models_found

    # Scan all category folders
    for category_dir in MODELS_DIR.iterdir():
        if not category_dir.is_dir():
            continue

        category_name = category_dir.name

        # Scan for 3D model files
        for model_file in category_dir.glob("*.glb"):
            model_name = model_file.stem
            file_size_mb = model_file.stat().st_size / (1024 * 1024)

            models_found[model_name] = {
                "filename": model_file.name,
                "category": category_name,
                "path": str(model_file.relative_to(BASE_DIR)),
                "url": f"/models/vehicles/{category_name}/{model_file.name}",
                "file_size_mb": round(file_size_mb, 2),
                "format": "glb"
            }

        # Also check for .gltf files
        for model_file in category_dir.glob("*.gltf"):
            model_name = model_file.stem
            if model_name not in models_found:  # GLB takes precedence
                file_size_mb = model_file.stat().st_size / (1024 * 1024)

                models_found[model_name] = {
                    "filename": model_file.name,
                    "category": category_name,
                    "path": str(model_file.relative_to(BASE_DIR)),
                    "url": f"/models/vehicles/{category_name}/{model_file.name}",
                    "file_size_mb": round(file_size_mb, 2),
                    "format": "gltf"
                }

    return models_found

def update_catalog_with_models(models_found: Dict[str, Any]) -> int:
    """Update catalog JSON with found models"""

    if not CATALOG_PATH.exists():
        print("⚠️  Catalog not found. Run download_fleet_3d_models.py first.")
        return 0

    # Load existing catalog
    with open(CATALOG_PATH) as f:
        catalog = json.load(f)

    updated_count = 0

    # Update models with found files
    for model in catalog.get("models", []):
        model_id = model.get("id", "")

        # Check if we have this model downloaded
        if model_id in models_found:
            model_info = models_found[model_id]

            # Update catalog entry
            model["has_3d_model"] = True
            model["model_url"] = model_info["url"]
            model["model_path"] = model_info["path"]
            model["model_format"] = model_info["format"]
            model["file_size_mb"] = model_info["file_size_mb"]

            updated_count += 1
            print(f"  ✅ Updated: {model['make']} {model['model']} ({model_info['filename']})")

    # Update metadata
    catalog["metadata"]["models_with_files"] = updated_count
    catalog["metadata"]["models_pending"] = catalog["metadata"]["unique_models"] - updated_count
    catalog["metadata"]["last_updated"] = "2025-11-24"

    # Save updated catalog
    with open(CATALOG_PATH, 'w') as f:
        json.dump(catalog, f, indent=2)

    return updated_count

def generate_status_report(models_found: Dict[str, Any], updated_count: int) -> str:
    """Generate status report"""

    # Load catalog for stats
    with open(CATALOG_PATH) as f:
        catalog = json.load(f)

    total_models = catalog["metadata"]["unique_models"]
    completion_pct = (updated_count / total_models * 100) if total_models > 0 else 0

    report = f"""# 3D Model Catalog Status Report

## 📊 Current Status

- **Total Models Required**: {total_models}
- **Models Downloaded**: {updated_count}
- **Models Pending**: {total_models - updated_count}
- **Completion**: {completion_pct:.1f}%

## 📦 Downloaded Models

"""

    if models_found:
        by_category = {}
        for model_name, model_info in models_found.items():
            category = model_info["category"]
            if category not in by_category:
                by_category[category] = []
            by_category[category].append({
                "name": model_name,
                "size": model_info["file_size_mb"],
                "format": model_info["format"]
            })

        for category, models in sorted(by_category.items()):
            report += f"\n### {category.replace('_', ' ').title()}\n\n"
            for model in models:
                report += f"- **{model['name']}** ({model['size']} MB, {model['format'].upper()})\n"

    else:
        report += "\n*No models downloaded yet.*\n"

    report += f"""

## 🎯 Next Steps

"""

    if updated_count < total_models:
        report += f"""
### Priority Downloads ({total_models - updated_count} remaining)

Refer to `MANUAL_MODEL_DOWNLOAD.md` for download links and instructions.

**Top Priority Models** (most common in fleet):

"""
        # List top pending models
        pending_models = [m for m in catalog["models"] if not m.get("has_3d_model")]
        pending_models.sort(key=lambda x: (-x["fleet_count"], x["priority"]))

        for i, model in enumerate(pending_models[:10], 1):
            report += f"{i}. **{model['make']} {model['model']}** ({model['fleet_count']} vehicles)\n"
            report += f"   - Category: `{model['category']}`\n"
            report += f"   - Search: [Sketchfab]({model['search_query'].replace(' ', '+')})\n\n"

    else:
        report += "\n✅ **All models downloaded!** Ready for testing.\n"

    report += """
## 🔧 Testing

Once models are downloaded:

1. Start Fleet development server
2. Navigate to Virtual Garage 3D
3. Test each vehicle model:
   - Loads without errors
   - Photorealistic appearance
   - 60 FPS performance
   - Materials look correct (paint, chrome, glass, rubber)

## 📁 File Locations

```
public/models/vehicles/
"""

    for category in sorted(os.listdir(MODELS_DIR)):
        category_path = MODELS_DIR / category
        if category_path.is_dir():
            model_count = len(list(category_path.glob("*.glb"))) + len(list(category_path.glob("*.gltf")))
            report += f"├── {category}/ ({model_count} models)\n"

    report += """```

---

*Generated by `scripts/update_3d_catalog.py`*
"""

    return report

def main():
    """Main execution"""
    print("\n" + "📋" * 30)
    print("3D MODEL CATALOG UPDATER")
    print("📋" * 30 + "\n")

    # Step 1: Scan for downloaded models
    print("Step 1: Scanning for downloaded 3D models...")
    models_found = scan_downloaded_models()
    print(f"✅ Found {len(models_found)} downloaded model files")

    if len(models_found) == 0:
        print("\n⚠️  No 3D model files found.")
        print("   Download models from Sketchfab and place in category folders.")
        print("   See MANUAL_MODEL_DOWNLOAD.md for instructions.")
        return

    # Step 2: Update catalog
    print("\nStep 2: Updating catalog with found models...")
    updated_count = update_catalog_with_models(models_found)
    print(f"✅ Updated {updated_count} catalog entries")

    # Step 3: Generate status report
    print("\nStep 3: Generating status report...")
    report = generate_status_report(models_found, updated_count)
    report_path = BASE_DIR / "3D_MODEL_STATUS_REPORT.md"

    with open(report_path, 'w') as f:
        f.write(report)

    print(f"✅ Status report created: {report_path}")

    # Summary
    print("\n" + "=" * 60)
    print("UPDATE SUMMARY")
    print("=" * 60)
    print(f"Models found: {len(models_found)}")
    print(f"Catalog entries updated: {updated_count}")
    print(f"Catalog: {CATALOG_PATH}")
    print(f"Status report: {report_path}")
    print("=" * 60)
    print("✨ Catalog update complete!")
    print()

if __name__ == "__main__":
    main()
