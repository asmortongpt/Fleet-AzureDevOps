#!/usr/bin/env python3
"""
Monitor 3 Meshy.ai model generations and auto-download when complete
"""

import requests
import json
import time
import os
from pathlib import Path

MESHY_API_KEY = os.environ.get("MESHY_API_KEY")
if not MESHY_API_KEY:
    raise ValueError(
        "MESHY_API_KEY environment variable is required. "
        "Please set it before running this script."
    )
OUTPUT_DIR = Path(__file__).parent / "output"

# Load task IDs
with open('/tmp/meshy_preview_tasks.json', 'r') as f:
    tasks = json.load(f)

headers = {"Authorization": f"Bearer {MESHY_API_KEY}"}

print("="*80)
print("📊 MONITORING 3 FORD F-150 LIGHTNING GENERATIONS")
print("="*80)

for task in tasks:
    print(f"   • {task['name']}: {task['task_id']}")

print(f"\n⏱️  Checking every 30 seconds...")
print(f"📁 Downloads will save to: {OUTPUT_DIR}")
print("="*80)

completed = set()
attempt = 0
max_attempts = 40  # 20 minutes max

while len(completed) < len(tasks) and attempt < max_attempts:
    attempt += 1
    print(f"\n[Check #{attempt}] {time.strftime('%H:%M:%S')}")

    for task in tasks:
        if task['task_id'] in completed:
            continue

        response = requests.get(
            f"https://api.meshy.ai/v2/text-to-3d/{task['task_id']}",
            headers=headers
        )

        if response.status_code == 200:
            data = response.json()
            status = data.get('status')
            progress = data.get('progress', 0)

            if status == 'SUCCEEDED':
                print(f"   ✅ {task['name']}: COMPLETE!")

                # Download model
                glb_url = data.get('model_urls', {}).get('glb', '')
                if glb_url:
                    filename = f"Ford_F150_Lightning_{task['name']}_Meshy.glb"
                    filepath = OUTPUT_DIR / filename

                    print(f"      📥 Downloading {filename}...")
                    model_response = requests.get(glb_url)

                    with open(filepath, 'wb') as f:
                        f.write(model_response.content)

                    size_mb = filepath.stat().st_size / (1024 * 1024)
                    print(f"      💾 Saved: {size_mb:.2f} MB")

                    completed.add(task['task_id'])

            elif status == 'FAILED':
                print(f"   ❌ {task['name']}: FAILED")
                completed.add(task['task_id'])

            else:
                print(f"   ⏳ {task['name']}: {progress}%")
        else:
            print(f"   ⚠️  {task['name']}: API error {response.status_code}")

    if len(completed) < len(tasks):
        time.sleep(30)

print("\n" + "="*80)
print(f"✅ COMPLETED: {len(completed)}/{len(tasks)} models")
print("="*80)

if len(completed) == len(tasks):
    print("\n🎉 All models downloaded successfully!")
    print(f"📁 Location: {OUTPUT_DIR}")
else:
    print(f"\n⚠️  {len(tasks) - len(completed)} models did not complete")

print("\n📊 Next: Run quality comparison and create viewers")
