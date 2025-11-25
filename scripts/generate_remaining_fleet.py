#!/usr/bin/env python3
"""Generate remaining 6 photorealistic fleet models"""

import os
import requests
import time
import sys
from pathlib import Path

MESHY_API_KEY = os.environ.get('meshyapikey', 'msy_aL4JDGCHF76THUL7Ko2WmLMSOG0VfXnLRlw3')
MESHY_BASE_URL = "https://api.meshy.ai/openapi/v2/text-to-3d"
BASE_DIR = Path(__file__).parent.parent
MODELS_DIR = BASE_DIR / "public" / "models" / "vehicles"

HEADERS = {
    "Authorization": f"Bearer {MESHY_API_KEY}",
    "Content-Type": "application/json"
}

# Remaining 6 models to generate
VEHICLES = [
    {
        "id": "freightliner_cascadia",
        "category": "trucks",
        "name": "Freightliner Cascadia",
        "prompt": "photorealistic 2024 Freightliner Cascadia semi truck, deep metallic blue cab, glossy automotive paint, polished chrome grille and mirrors, black rubber tires, detailed sleeper cab, LED headlights, modern aerodynamic design",
        "texture": "metallic blue automotive paint with clearcoat, chrome metal details, black rubber, realistic glass",
    },
    {
        "id": "altech_cm_3000_mixer",
        "category": "construction",
        "name": "Altech CM-3000 Mixer",
        "prompt": "photorealistic concrete mixer truck, white cab with orange rotating drum, glossy industrial paint, chrome mixing blades, black rubber tires, concrete residue texture on drum",
        "texture": "white and safety orange industrial paint, realistic concrete dust, weathered metal, chrome components",
    },
    {
        "id": "altech_ah_350_hauler",
        "category": "construction",
        "name": "Altech AH-350 Hauler",
        "prompt": "photorealistic articulated hauler truck, bright safety yellow industrial paint, black hydraulic articulation joint, massive black rubber tires with deep treads, chrome exhaust, weathered paint with scratches",
        "texture": "bright safety yellow enamel paint with weathering, black hydraulics, massive rubber tires, chrome",
    },
    {
        "id": "tesla_model_3",
        "category": "sedans",
        "name": "Tesla Model 3",
        "prompt": "photorealistic 2024 Tesla Model 3 electric sedan, deep sea blue metallic automotive paint, multi-layer clearcoat, black glass roof, chrome door handles, 19-inch aero wheels, minimalist front, LED headlights",
        "texture": "deep blue metallic automotive paint with clearcoat and reflections, chrome trim, black glass, pristine condition",
    },
    {
        "id": "tesla_model_s",
        "category": "sedans",
        "name": "Tesla Model S",
        "prompt": "photorealistic 2024 Tesla Model S luxury sedan, pearl white tri-coat automotive paint, deep glossy finish, black panoramic glass roof, chrome door handles, 21-inch turbine wheels, LED lights",
        "texture": "pearl white tri-coat automotive paint with multiple clearcoat layers and reflections, chrome trim, black glass, showroom finish",
    },
    {
        "id": "tesla_model_x",
        "category": "suvs",
        "name": "Tesla Model X",
        "prompt": "photorealistic 2024 Tesla Model X SUV with falcon wing doors, midnight silver metallic automotive paint, glossy clearcoat, black glass roof, chrome falcon wing door hinges, 22-inch wheels, LED headlights",
        "texture": "midnight silver metallic automotive paint with clearcoat and mirror reflections, chrome door mechanisms, black glass, luxury finish",
    },
]

def generate_model(vehicle):
    """Generate a single photorealistic model"""
    print("\n" + "=" * 80)
    print(f"🚗 GENERATING: {vehicle['name']}")
    print("=" * 80)

    destination = MODELS_DIR / vehicle['category'] / f"{vehicle['id']}.glb"

    # Skip if exists and is large enough (photorealistic)
    if destination.exists() and destination.stat().st_size > 5_000_000:  # 5MB+
        size_mb = destination.stat().st_size / (1024 * 1024)
        print(f"✅ Already exists (photorealistic): {size_mb:.2f} MB")
        return True

    # Step 1: Create preview
    print("\n📝 Step 1: Creating preview task...")
    print(f"   Prompt: {vehicle['prompt'][:80]}...")

    preview_payload = {
        "mode": "preview",
        "prompt": vehicle["prompt"],
        "negative_prompt": "low quality, low resolution, cartoon, toy-like, ugly, deformed",
        "art_style": "realistic",
        "ai_model": "meshy-5",
        "target_polycount": 80000,
        "should_remesh": True
    }

    try:
        response = requests.post(MESHY_BASE_URL, headers=HEADERS, json=preview_payload)
        if response.status_code not in [200, 202]:
            print(f"❌ Preview error: {response.status_code} - {response.text}")
            return False

        preview_task_id = response.json().get("result")
        print(f"   ✅ Task ID: {preview_task_id}")

    except Exception as e:
        print(f"❌ Exception: {e}")
        return False

    # Step 2: Poll preview
    print("\n⏳ Step 2: Waiting for preview (max 3 min)...")
    for i in range(36):
        time.sleep(5)
        try:
            resp = requests.get(f"{MESHY_BASE_URL}/{preview_task_id}", headers=HEADERS)
            task = resp.json()
            status = task.get("status")
            progress = task.get("progress", 0)

            if i % 6 == 0:  # Every 30 seconds
                print(f"   [{i+1}/36] Status: {status}, Progress: {progress}%")

            if status == "SUCCEEDED":
                print(f"   ✅ Preview completed!")
                break
            elif status in ["FAILED", "CANCELED"]:
                print(f"   ❌ Preview {status}")
                return False
        except:
            pass

    if status != "SUCCEEDED":
        print("   ⏱️ Timeout")
        return False

    # Step 3: Create refine
    print("\n🎨 Step 3: Creating refine task...")
    print(f"   Texture: {vehicle['texture'][:80]}...")

    refine_payload = {
        "mode": "refine",
        "preview_task_id": preview_task_id,
        "enable_pbr": True,
        "texture_prompt": vehicle["texture"],
        "ai_model": "meshy-5"
    }

    try:
        response = requests.post(MESHY_BASE_URL, headers=HEADERS, json=refine_payload)
        if response.status_code not in [200, 202]:
            print(f"❌ Refine error: {response.status_code}")
            return False

        refine_task_id = response.json().get("result")
        print(f"   ✅ Task ID: {refine_task_id}")

    except Exception as e:
        print(f"❌ Exception: {e}")
        return False

    # Step 4: Poll refine
    print("\n⏳ Step 4: Waiting for refine (max 5 min)...")
    for i in range(60):
        time.sleep(5)
        try:
            resp = requests.get(f"{MESHY_BASE_URL}/{refine_task_id}", headers=HEADERS)
            task = resp.json()
            status = task.get("status")
            progress = task.get("progress", 0)

            if i % 6 == 0:  # Every 30 seconds
                print(f"   [{i+1}/60] Status: {status}, Progress: {progress}%")

            if status == "SUCCEEDED":
                print(f"   ✅ Refine completed!")
                break
            elif status in ["FAILED", "CANCELED"]:
                print(f"   ❌ Refine {status}")
                return False
        except:
            pass

    if status != "SUCCEEDED":
        print("   ⏱️ Timeout")
        return False

    # Step 5: Download
    print("\n📥 Step 5: Downloading final model...")
    glb_url = task.get("model_urls", {}).get("glb")
    if not glb_url:
        print("❌ No GLB URL")
        return False

    try:
        model_data = requests.get(glb_url, timeout=60)
        destination.parent.mkdir(parents=True, exist_ok=True)
        destination.write_bytes(model_data.content)

        size_mb = destination.stat().st_size / (1024 * 1024)
        print(f"   ✅ Downloaded: {size_mb:.2f} MB")
        print(f"   📁 Saved to: {destination}")

        return True

    except Exception as e:
        print(f"❌ Download error: {e}")
        return False

def main():
    print("🚗" * 40)
    print("PHOTOREALISTIC FLEET GENERATOR")
    print("Generating 6 remaining models")
    print("🚗" * 40)
    print(f"\n🔑 API Key: {MESHY_API_KEY[:10]}...{MESHY_API_KEY[-4:]}")
    print(f"💰 Estimated cost: ~60 credits\n")

    stats = {"success": 0, "failed": 0, "skipped": 0}

    for i, vehicle in enumerate(VEHICLES, 1):
        print(f"\n{'#' * 80}")
        print(f"MODEL {i}/{len(VEHICLES)}")
        print(f"{'#' * 80}")

        success = generate_model(vehicle)

        if success:
            stats["success"] += 1
        else:
            stats["failed"] += 1

        print(f"\n📊 Progress: {i}/{len(VEHICLES)}")
        print(f"   ✅ Success: {stats['success']}")
        print(f"   ❌ Failed: {stats['failed']}")

        if i < len(VEHICLES):
            print(f"\n⏸️  Waiting 10 seconds before next model...")
            time.sleep(10)

    print("\n" + "=" * 80)
    print("GENERATION COMPLETE")
    print("=" * 80)
    print(f"✅ Success: {stats['success']}/{len(VEHICLES)}")
    print(f"❌ Failed: {stats['failed']}/{len(VEHICLES)}")
    print()

    if stats["success"] > 0:
        print(f"💰 Credits used: ~{stats['success'] * 10}")
    print()

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n⚠️  Generation interrupted by user")
        sys.exit(1)
