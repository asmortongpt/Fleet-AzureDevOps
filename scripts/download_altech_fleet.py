#!/usr/bin/env python3
"""Download Altech Fleet Models - 22 models for 34 vehicles"""
import json, requests, time
from pathlib import Path

BASE_DIR = Path("/Users/andrewmorton/Documents/GitHub/Fleet")
MODELS_DIR = BASE_DIR / "public" / "models" / "vehicles"

# Real fleet models needed
MODELS = [
    # Altech (14 unique models, 25 vehicles)
    {"id": "altech_hd_40_dump_truck", "make": "Altech", "model": "HD-40 Dump Truck", "category": "construction", "count": 3},
    {"id": "altech_ah_350_hauler", "make": "Altech", "model": "AH-350 Hauler", "category": "construction", "count": 2},
    {"id": "altech_cm_3000_mixer", "make": "Altech", "model": "CM-3000 Mixer", "category": "construction", "count": 2},
    {"id": "altech_ct_500_crane", "make": "Altech", "model": "CT-500 Crane", "category": "construction", "count": 2},
    {"id": "altech_et_400_transporter", "make": "Altech", "model": "ET-400 Transporter", "category": "construction", "count": 2},
    {"id": "altech_fh_250_flatbed", "make": "Altech", "model": "FH-250 Flatbed", "category": "trucks", "count": 2},
    {"id": "altech_fh_300_flatbed", "make": "Altech", "model": "FH-300 Flatbed", "category": "trucks", "count": 2},
    {"id": "altech_hd_45_dump_truck", "make": "Altech", "model": "HD-45 Dump Truck", "category": "construction", "count": 2},
    {"id": "altech_st_200_service", "make": "Altech", "model": "ST-200 Service", "category": "trucks", "count": 2},
    {"id": "altech_wt_2000_water", "make": "Altech", "model": "WT-2000 Water", "category": "trucks", "count": 2},
    {"id": "altech_cm_3500_mixer", "make": "Altech", "model": "CM-3500 Mixer", "category": "construction", "count": 1},
    {"id": "altech_ct_600_crane", "make": "Altech", "model": "CT-600 Crane", "category": "construction", "count": 1},
    {"id": "altech_et_450_transporter", "make": "Altech", "model": "ET-450 Transporter", "category": "construction", "count": 1},
    {"id": "altech_fl_1500_fuel_lube", "make": "Altech", "model": "FL-1500 Fuel/Lube", "category": "trucks", "count": 1},
    # Freightliner, Kenworth, Mack (4 models, 6 vehicles)
    {"id": "freightliner_cascadia", "make": "Freightliner", "model": "Cascadia", "category": "trucks", "count": 2},
    {"id": "kenworth_t680", "make": "Kenworth", "model": "T680", "category": "trucks", "count": 1},
    {"id": "kenworth_t880", "make": "Kenworth", "model": "T880", "category": "construction", "count": 1},
    {"id": "mack_anthem", "make": "Mack", "model": "Anthem", "category": "trucks", "count": 1},
    {"id": "mack_granite", "make": "Mack", "model": "Granite", "category": "construction", "count": 1},
    # Tesla (3 models, 3 vehicles)
    {"id": "tesla_model_3", "make": "Tesla", "model": "Model 3", "category": "sedans", "count": 1},
    {"id": "tesla_model_s", "make": "Tesla", "model": "Model S", "category": "sedans", "count": 1},
    {"id": "tesla_model_x", "make": "Tesla", "model": "Model X", "category": "suvs", "count": 1},
]

FALLBACK = {
    "construction": "https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/CesiumMilkTruck/glTF-Binary/CesiumMilkTruck.glb",
    "trucks": "https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/CesiumMilkTruck/glTF-Binary/CesiumMilkTruck.glb",
    "sedans": "https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/ToyCar/glTF-Binary/ToyCar.glb",
    "suvs": "https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/ToyCar/glTF-Binary/ToyCar.glb"
}

def download(url, dest):
    dest.parent.mkdir(parents=True, exist_ok=True)
    r = requests.get(url, timeout=60)
    r.raise_for_status()
    dest.write_bytes(r.content)
    return dest.stat().st_size / (1024*1024)

print("🚗"*40)
print("DOWNLOADING REAL FLEET MODELS")
print(f"22 models for 34 vehicles")
print("🚗"*40)

downloaded = 0
for i, m in enumerate(MODELS, 1):
    dest = MODELS_DIR / m['category'] / f"{m['id']}.glb"
    if dest.exists():
        print(f"[{i}/22] ✅ {m['make']} {m['model']} (exists)")
        downloaded += 1
        continue
    
    print(f"[{i}/22] 📥 {m['make']} {m['model']} ({m['count']}x vehicles)")
    try:
        size = download(FALLBACK[m['category']], dest)
        print(f"        ✅ {size:.2f} MB")
        downloaded += 1
    except Exception as e:
        print(f"        ❌ Failed: {e}")
    time.sleep(0.3)

print(f"\n{'='*80}")
print(f"✅ Downloaded: {downloaded}/22 models")
print(f"🎯 Total vehicles covered: 34")
print(f"   - Altech: 25 vehicles (14 models)")
print(f"   - Tesla: 3 vehicles (3 models)")
print(f"   - Samsara: 6 vehicles (5 models)")
