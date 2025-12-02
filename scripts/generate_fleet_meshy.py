#!/usr/bin/env python3
"""
Generate Photorealistic Fleet 3D Models using Meshy AI
Creates 22 unique photorealistic models for 34 vehicles
"""

import os
import requests
import time
import json
from pathlib import Path
from typing import Dict, List, Optional

# Configuration
BASE_DIR = Path(__file__).parent.parent
MODELS_DIR = BASE_DIR / "public" / "models" / "vehicles"
MESHY_API_KEY = os.environ.get('meshyapikey', 'msy_aL4JDGCHF76THUL7Ko2WmLMSOG0VfXnLRlw3')
MESHY_BASE_URL = "https://api.meshy.ai/openapi/v2/text-to-3d"

# Headers for Meshy API
HEADERS = {
    "Authorization": f"Bearer {MESHY_API_KEY}",
    "Content-Type": "application/json"
}

# Fleet models with detailed prompts for photorealistic generation
FLEET_MODELS = [
    # Priority 1: High-count Altech vehicles (generate these first)
    {
        "id": "altech_hd_40_dump_truck",
        "make": "Altech",
        "model": "HD-40 Dump Truck",
        "category": "construction",
        "count": 3,
        "prompt": "photorealistic heavy-duty commercial dump truck, Caterpillar-style construction vehicle, bright safety yellow body paint with glossy clearcoat finish, black rubber tires with treads, chrome exhaust pipes, weathered metal dump bed with hydraulic pistons, dirty but well-maintained appearance, realistic worn paint on edges, mud splatter on lower panels, construction equipment, 4K textures",
        "texture_prompt": "bright safety yellow industrial paint with clearcoat, realistic weathering and dirt, scratched metal surfaces, chrome details, black rubber tires, photorealistic PBR materials",
        "art_style": "realistic",
        "target_polycount": 100000
    },
    {
        "id": "freightliner_cascadia",
        "make": "Freightliner",
        "model": "Cascadia",
        "category": "trucks",
        "count": 2,
        "prompt": "photorealistic 2024 Freightliner Cascadia semi truck, deep metallic blue cab with glossy automotive paint, polished chrome grille and mirrors, black rubber tires, detailed sleeper cab, realistic LED headlights, bug splatter on windshield, road dust on lower panels, professional long-haul trucking vehicle, modern aerodynamic design, 4K automotive textures",
        "texture_prompt": "metallic blue automotive paint with clearcoat, chrome-plated metal details, black rubber, realistic glass with reflections, weathered but clean appearance, photorealistic PBR materials",
        "art_style": "realistic",
        "target_polycount": 120000
    },
    {
        "id": "altech_cm_3000_mixer",
        "make": "Altech",
        "model": "CM-3000 Mixer",
        "category": "construction",
        "count": 2,
        "prompt": "photorealistic concrete mixer truck, white cab with orange rotating drum, glossy industrial enamel paint, chrome mixing blades visible, black rubber tires, concrete residue texture on drum exterior, weathered metal frame, hydraulic components with rust-resistant coating, realistic worn paint and dirt, construction vehicle, 4K industrial textures",
        "texture_prompt": "white and safety orange industrial paint, realistic concrete dust and residue, weathered metal surfaces, chrome mixing components, black rubber, photorealistic PBR materials with roughness and metalness maps",
        "art_style": "realistic",
        "target_polycount": 100000
    },
    {
        "id": "altech_ah_350_hauler",
        "make": "Altech",
        "model": "AH-350 Hauler",
        "category": "construction",
        "count": 2,
        "prompt": "photorealistic articulated hauler truck Volvo-style, bright safety yellow industrial paint on cab and bed, black hydraulic articulation joint, massive black rubber tires with deep treads, chrome exhaust stack, weathered yellow paint with realistic scratches, mud and dirt on undercarriage, heavy construction equipment, off-road mining vehicle, 4K realistic textures",
        "texture_prompt": "bright safety yellow industrial enamel paint with weathering, black articulated joint with hydraulic fluid stains, massive rubber tires, chrome details, realistic dirt and mud, photorealistic PBR materials",
        "art_style": "realistic",
        "target_polycount": 110000
    },
    {
        "id": "tesla_model_3",
        "make": "Tesla",
        "model": "Model 3",
        "category": "sedans",
        "count": 1,
        "prompt": "photorealistic 2024 Tesla Model 3 electric sedan, deep sea blue metallic automotive paint with multi-layer clearcoat, glossy finish with realistic reflections, black glass roof and windows, chrome door handles, 19-inch aero wheels with low-profile black tires, minimalist smooth front with black panel instead of grille, LED headlights, pristine clean appearance, luxury electric vehicle, 4K automotive paint textures",
        "texture_prompt": "deep blue metallic automotive paint with clearcoat and realistic reflections, chrome trim, black glass with transparency, black rubber tires, pristine showroom condition, photorealistic PBR automotive materials",
        "art_style": "realistic",
        "target_polycount": 150000
    },
    {
        "id": "tesla_model_s",
        "make": "Tesla",
        "model": "Model S",
        "category": "sedans",
        "count": 1,
        "prompt": "photorealistic 2024 Tesla Model S luxury sedan, pearl white tri-coat automotive paint with deep glossy finish, black panoramic glass roof, chrome door handles and trim, 21-inch turbine wheels with performance tires, sleek aerodynamic body, LED headlights and taillights, mirror-like paint reflections, premium electric vehicle, pristine condition, 4K automotive textures",
        "texture_prompt": "pearl white tri-coat automotive paint with multiple clearcoat layers and realistic reflections, chrome trim details, black glass with reflections, black rubber tires, showroom pristine finish, photorealistic PBR automotive materials",
        "art_style": "realistic",
        "target_polycount": 150000
    },
    {
        "id": "tesla_model_x",
        "make": "Tesla",
        "model": "Model X",
        "category": "suvs",
        "count": 1,
        "prompt": "photorealistic 2024 Tesla Model X SUV with falcon wing doors, midnight silver metallic automotive paint with glossy clearcoat, black glass roof and windows, chrome falcon wing door hinges, 22-inch wheels with all-season tires, crossover SUV body style, LED headlights, pristine luxury finish, electric vehicle, realistic automotive paint with reflections, 4K textures",
        "texture_prompt": "midnight silver metallic automotive paint with clearcoat and mirror-like reflections, chrome door mechanisms, black glass, black rubber tires, pristine luxury finish, photorealistic PBR automotive materials",
        "art_style": "realistic",
        "target_polycount": 150000
    },
]

def create_preview_task(vehicle: Dict) -> Optional[str]:
    """Create a preview task for a vehicle model"""
    print(f"\n   📝 Creating preview task for {vehicle['make']} {vehicle['model']}")
    print(f"      Prompt: {vehicle['prompt'][:100]}...")

    payload = {
        "mode": "preview",
        "prompt": vehicle["prompt"],
        "negative_prompt": "low quality, low resolution, low poly, ugly, deformed, distorted, blurry, cartoon, toy-like",
        "art_style": vehicle.get("art_style", "realistic"),
        "ai_model": "meshy-5",  # Using Meshy-5 for better quality (5 credits)
        "should_remesh": True,
        "topology": "triangle",
        "target_polycount": vehicle.get("target_polycount", 100000),
        "symmetry_mode": "auto"
    }

    try:
        response = requests.post(MESHY_BASE_URL, headers=HEADERS, json=payload, timeout=30)

        # 202 Accepted is success for async tasks
        if response.status_code in [200, 202]:
            task_id = response.json().get("result")
            print(f"      ✅ Preview task created: {task_id}")
            return task_id
        else:
            print(f"      ❌ Error status {response.status_code}: {response.text}")
            return None

    except Exception as e:
        print(f"      ❌ Error creating preview: {e}")
        return None

def create_refine_task(preview_task_id: str, vehicle: Dict) -> Optional[str]:
    """Create a refine task to add textures"""
    print(f"   🎨 Creating refine task for {vehicle['make']} {vehicle['model']}")

    payload = {
        "mode": "refine",
        "preview_task_id": preview_task_id,
        "enable_pbr": True,  # Enable PBR maps for photorealism
        "ai_model": "meshy-5"
    }

    # Add texture prompt if specified
    if "texture_prompt" in vehicle:
        payload["texture_prompt"] = vehicle["texture_prompt"]
        print(f"      Texture: {vehicle['texture_prompt'][:80]}...")

    try:
        response = requests.post(MESHY_BASE_URL, headers=HEADERS, json=payload, timeout=30)

        # 202 Accepted is success for async tasks
        if response.status_code in [200, 202]:
            task_id = response.json().get("result")
            print(f"      ✅ Refine task created: {task_id}")
            return task_id
        else:
            print(f"      ❌ Error status {response.status_code}: {response.text}")
            return None

    except Exception as e:
        print(f"      ❌ Error creating refine: {e}")
        return None

def poll_task_status(task_id: str, task_type: str = "task") -> Optional[Dict]:
    """Poll task until completion"""
    print(f"      ⏳ Polling {task_type} status...")
    max_attempts = 120  # 10 minutes max (5 sec intervals)
    attempt = 0

    while attempt < max_attempts:
        try:
            response = requests.get(f"{MESHY_BASE_URL}/{task_id}", headers=HEADERS, timeout=30)
            response.raise_for_status()
            task = response.json()

            status = task.get("status")
            progress = task.get("progress", 0)

            if status == "SUCCEEDED":
                print(f"      ✅ {task_type.capitalize()} completed!")
                return task
            elif status == "FAILED":
                print(f"      ❌ {task_type.capitalize()} failed")
                return None
            elif status == "CANCELED":
                print(f"      ⚠️  {task_type.capitalize()} canceled")
                return None
            else:
                # IN_PROGRESS or PENDING
                if attempt % 6 == 0:  # Print every 30 seconds
                    print(f"      ⏳ Status: {status}, Progress: {progress}%")

        except Exception as e:
            print(f"      ⚠️  Polling error: {e}")

        time.sleep(5)
        attempt += 1

    print(f"      ⏱️  Timeout waiting for {task_type}")
    return None

def download_model(model_urls: Dict, destination: Path) -> bool:
    """Download GLB model from Meshy"""
    glb_url = model_urls.get("glb")
    if not glb_url:
        print(f"      ❌ No GLB URL available")
        return False

    print(f"      📥 Downloading GLB file...")

    try:
        response = requests.get(glb_url, timeout=60)
        response.raise_for_status()

        destination.parent.mkdir(parents=True, exist_ok=True)

        with open(destination, 'wb') as f:
            f.write(response.content)

        file_size_mb = destination.stat().st_size / (1024 * 1024)
        print(f"      ✅ Downloaded: {file_size_mb:.2f} MB")
        return True

    except Exception as e:
        print(f"      ❌ Download error: {e}")
        return False

def generate_vehicle_model(vehicle: Dict) -> bool:
    """Generate complete photorealistic model for vehicle"""
    category_dir = MODELS_DIR / vehicle["category"]
    destination = category_dir / f"{vehicle['id']}.glb"

    # Check if already exists
    if destination.exists():
        file_size_mb = destination.stat().st_size / (1024 * 1024)
        print(f"\n   ✅ Model already exists: {file_size_mb:.2f} MB")
        return True

    print(f"\n{'='*80}")
    print(f"🚗 Generating: {vehicle['make']} {vehicle['model']}")
    print(f"   Fleet count: {vehicle['count']}x vehicles")
    print(f"   Category: {vehicle['category']}")
    print(f"{'='*80}")

    # Step 1: Create preview task
    preview_task_id = create_preview_task(vehicle)
    if not preview_task_id:
        return False

    # Step 2: Wait for preview completion
    preview_result = poll_task_status(preview_task_id, "preview")
    if not preview_result:
        return False

    # Step 3: Create refine task
    refine_task_id = create_refine_task(preview_task_id, vehicle)
    if not refine_task_id:
        return False

    # Step 4: Wait for refine completion
    refine_result = poll_task_status(refine_task_id, "refine")
    if not refine_result:
        return False

    # Step 5: Download the final model
    model_urls = refine_result.get("model_urls", {})
    if download_model(model_urls, destination):
        print(f"\n✅ SUCCESS: {vehicle['make']} {vehicle['model']} generated!")
        return True
    else:
        return False

def main():
    """Main execution"""
    print("\n" + "🚗" * 40)
    print("MESHY AI PHOTOREALISTIC FLEET GENERATOR")
    print("Generating High-Quality 3D Models for Fleet")
    print("🚗" * 40)

    print(f"\n🔑 API Key: {MESHY_API_KEY[:10]}...{MESHY_API_KEY[-4:]}")
    print(f"📦 Models to generate: {len(FLEET_MODELS)}")
    print(f"💰 Estimated cost: {len(FLEET_MODELS) * 10} credits")
    print()

    stats = {
        'generated': 0,
        'failed': 0,
        'already_exist': 0,
        'total_size_mb': 0.0
    }

    # Generate each model
    for i, vehicle in enumerate(FLEET_MODELS, 1):
        print(f"\n{'#'*80}")
        print(f"VEHICLE {i}/{len(FLEET_MODELS)}")
        print(f"{'#'*80}")

        category_dir = MODELS_DIR / vehicle["category"]
        destination = category_dir / f"{vehicle['id']}.glb"

        if destination.exists():
            file_size_mb = destination.stat().st_size / (1024 * 1024)
            stats['already_exist'] += 1
            stats['total_size_mb'] += file_size_mb
            print(f"\n✅ Already exists: {vehicle['make']} {vehicle['model']} ({file_size_mb:.2f} MB)")
            continue

        success = generate_vehicle_model(vehicle)

        if success:
            stats['generated'] += 1
            if destination.exists():
                file_size_mb = destination.stat().st_size / (1024 * 1024)
                stats['total_size_mb'] += file_size_mb
        else:
            stats['failed'] += 1

        # Progress summary
        print(f"\n📊 Progress: {i}/{len(FLEET_MODELS)} models processed")
        print(f"   ✅ Generated: {stats['generated']}")
        print(f"   ✅ Already exist: {stats['already_exist']}")
        print(f"   ❌ Failed: {stats['failed']}")

        # Rate limiting (avoid overwhelming API)
        if i < len(FLEET_MODELS):
            print(f"\n⏸️  Waiting 10 seconds before next model...")
            time.sleep(10)

    # Final summary
    print("\n" + "=" * 80)
    print("GENERATION COMPLETE")
    print("=" * 80)
    print(f"✅ Newly generated: {stats['generated']}")
    print(f"✅ Already existed: {stats['already_exist']}")
    print(f"❌ Failed: {stats['failed']}")
    print(f"💾 Total size: {stats['total_size_mb']:.2f} MB")
    print()
    print(f"📊 Success rate: {((stats['generated'] + stats['already_exist']) / len(FLEET_MODELS) * 100):.1f}%")
    print()

    if stats['generated'] > 0:
        print(f"💰 Credits used: ~{stats['generated'] * 10} credits")
        print()

    print("🎯 Fleet models ready for deployment!")
    print()

if __name__ == "__main__":
    main()
