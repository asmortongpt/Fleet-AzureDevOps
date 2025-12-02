#!/usr/bin/env python3
"""Complete test of Meshy AI generation"""

import os
import requests
import time
from pathlib import Path

MESHY_API_KEY = os.environ.get('meshyapikey', 'msy_aL4JDGCHF76THUL7Ko2WmLMSOG0VfXnLRlw3')
MESHY_BASE_URL = "https://api.meshy.ai/openapi/v2/text-to-3d"

HEADERS = {
    "Authorization": f"Bearer {MESHY_API_KEY}",
    "Content-Type": "application/json"
}

print("🚗" * 40)
print("MESHY AI COMPLETE TEST")
print("🚗" * 40)
print(f"\n🔑 API Key: {MESHY_API_KEY[:10]}...{MESHY_API_KEY[-4:]}\n")

# Step 1: Create preview
print("=" * 80)
print("STEP 1: CREATE PREVIEW TASK")
print("=" * 80)

preview_payload = {
    "mode": "preview",
    "prompt": "photorealistic yellow dump truck, construction vehicle, detailed",
    "negative_prompt": "low quality, cartoon",
    "art_style": "realistic",
    "ai_model": "meshy-5",
    "target_polycount": 50000
}

print(f"Prompt: {preview_payload['prompt']}")
print("Creating task...")

response = requests.post(MESHY_BASE_URL, headers=HEADERS, json=preview_payload)
print(f"Status: {response.status_code}")

if response.status_code in [200, 202]:
    preview_task_id = response.json().get("result")
    print(f"✅ Preview task ID: {preview_task_id}\n")
else:
    print(f"❌ Error: {response.text}")
    exit(1)

# Step 2: Poll preview status
print("=" * 80)
print("STEP 2: POLL PREVIEW STATUS (max 3 minutes)")
print("=" * 80)

max_attempts = 36  # 3 minutes
for i in range(max_attempts):
    time.sleep(5)

    status_response = requests.get(f"{MESHY_BASE_URL}/{preview_task_id}", headers=HEADERS)
    task = status_response.json()

    status = task.get("status")
    progress = task.get("progress", 0)

    print(f"[{i+1}/{max_attempts}] Status: {status}, Progress: {progress}%")

    if status == "SUCCEEDED":
        print(f"\n✅ Preview completed!")
        print(f"Model URLs: {list(task.get('model_urls', {}).keys())}")
        break
    elif status in ["FAILED", "CANCELED"]:
        print(f"\n❌ Preview {status}")
        exit(1)

if status != "SUCCEEDED":
    print("\n⏱️ Timeout - preview taking too long")
    exit(1)

# Step 3: Download preview
print("\n" + "=" * 80)
print("STEP 3: DOWNLOAD PREVIEW MODEL")
print("=" * 80)

preview_url = task.get("model_urls", {}).get("glb")
if preview_url:
    print(f"Downloading from: {preview_url[:80]}...")

    model_data = requests.get(preview_url)

    preview_file = Path("test_preview_dump_truck.glb")
    preview_file.write_bytes(model_data.content)

    size_mb = preview_file.stat().st_size / (1024 * 1024)
    print(f"✅ Downloaded preview: {size_mb:.2f} MB")
    print(f"   Saved to: {preview_file}")
else:
    print("❌ No GLB URL in response")
    exit(1)

# Step 4: Create refine task
print("\n" + "=" * 80)
print("STEP 4: CREATE REFINE TASK (ADD TEXTURES)")
print("=" * 80)

refine_payload = {
    "mode": "refine",
    "preview_task_id": preview_task_id,
    "enable_pbr": True,
    "texture_prompt": "bright yellow industrial paint, realistic weathering, chrome details",
    "ai_model": "meshy-5"
}

print("Creating refine task...")

refine_response = requests.post(MESHY_BASE_URL, headers=HEADERS, json=refine_payload)
print(f"Status: {refine_response.status_code}")

if refine_response.status_code in [200, 202]:
    refine_task_id = refine_response.json().get("result")
    print(f"✅ Refine task ID: {refine_task_id}\n")
else:
    print(f"❌ Error: {refine_response.text}")
    exit(1)

# Step 5: Poll refine status
print("=" * 80)
print("STEP 5: POLL REFINE STATUS (max 5 minutes)")
print("=" * 80)

max_attempts = 60  # 5 minutes
for i in range(max_attempts):
    time.sleep(5)

    status_response = requests.get(f"{MESHY_BASE_URL}/{refine_task_id}", headers=HEADERS)
    task = status_response.json()

    status = task.get("status")
    progress = task.get("progress", 0)

    print(f"[{i+1}/{max_attempts}] Status: {status}, Progress: {progress}%")

    if status == "SUCCEEDED":
        print(f"\n✅ Refine completed!")
        print(f"Model URLs: {list(task.get('model_urls', {}).keys())}")
        break
    elif status in ["FAILED", "CANCELED"]:
        print(f"\n❌ Refine {status}")
        exit(1)

if status != "SUCCEEDED":
    print("\n⏱️ Timeout - refine taking too long")
    exit(1)

# Step 6: Download final model
print("\n" + "=" * 80)
print("STEP 6: DOWNLOAD FINAL PHOTOREALISTIC MODEL")
print("=" * 80)

final_url = task.get("model_urls", {}).get("glb")
if final_url:
    print(f"Downloading from: {final_url[:80]}...")

    model_data = requests.get(final_url)

    final_file = Path("test_final_dump_truck_PHOTOREALISTIC.glb")
    final_file.write_bytes(model_data.content)

    size_mb = final_file.stat().st_size / (1024 * 1024)
    print(f"✅ Downloaded final model: {size_mb:.2f} MB")
    print(f"   Saved to: {final_file}")
else:
    print("❌ No GLB URL in response")
    exit(1)

print("\n" + "🎉" * 40)
print("SUCCESS! Photorealistic dump truck generated!")
print("🎉" * 40)
print(f"\n📦 Preview model: test_preview_dump_truck.glb")
print(f"📦 Final model: test_final_dump_truck_PHOTOREALISTIC.glb")
print()
