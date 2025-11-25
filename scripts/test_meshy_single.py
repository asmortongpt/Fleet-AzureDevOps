#!/usr/bin/env python3
"""Test Meshy AI with a single model"""

import os
import requests
import time

MESHY_API_KEY = os.environ.get('meshyapikey', 'msy_aL4JDGCHF76THUL7Ko2WmLMSOG0VfXnLRlw3')
MESHY_BASE_URL = "https://api.meshy.ai/openapi/v2/text-to-3d"

HEADERS = {
    "Authorization": f"Bearer {MESHY_API_KEY}",
    "Content-Type": "application/json"
}

print(f"🔑 API Key: {MESHY_API_KEY[:10]}...{MESHY_API_KEY[-4:]}")
print(f"🌐 Endpoint: {MESHY_BASE_URL}")
print()

# Test with simple prompt first
payload = {
    "mode": "preview",
    "prompt": "photorealistic dump truck, yellow construction vehicle",
    "negative_prompt": "low quality, cartoon",
    "art_style": "realistic",
    "ai_model": "meshy-5",
    "target_polycount": 50000
}

print("📝 Creating preview task...")
print(f"   Payload: {payload}")
print()

try:
    response = requests.post(MESHY_BASE_URL, headers=HEADERS, json=payload, timeout=30)
    print(f"   Status Code: {response.status_code}")
    print(f"   Response: {response.text}")

    if response.status_code == 200:
        task_id = response.json().get("result")
        print(f"\n✅ Task created: {task_id}")
    else:
        print(f"\n❌ Error: {response.status_code}")
        print(response.text)

except Exception as e:
    print(f"❌ Exception: {e}")
    import traceback
    traceback.print_exc()
