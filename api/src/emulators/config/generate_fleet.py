#!/usr/bin/env python3
import json
import random

# Keep existing 10 vehicles
existing_vehicles = [
    {"id": "VEH-001", "make": "Ford", "model": "F-150", "year": 2022, "type": "truck", "vin": "1FTFW1E50MFC12345", "licensePlate": "ABC-1234", "tankSize": 26, "fuelEfficiency": 18, "startingLocation": {"lat": 30.4383, "lng": -84.2807}, "homeBase": {"lat": 30.4383, "lng": -84.2807, "name": "Tallahassee Fleet Center"}, "driverBehavior": "normal", "features": ["obd2", "gps", "iot"]},
    {"id": "VEH-002", "make": "Chevrolet", "model": "Silverado", "year": 2023, "type": "truck", "vin": "1GCVKREC5FZ123456", "licensePlate": "XYZ-5678", "tankSize": 26, "fuelEfficiency": 19, "startingLocation": {"lat": 30.4415, "lng": -84.2795}, "homeBase": {"lat": 30.4383, "lng": -84.2807, "name": "Tallahassee Fleet Center"}, "driverBehavior": "cautious", "features": ["obd2", "gps", "iot", "camera"]},
    {"id": "VEH-003", "make": "Toyota", "model": "Camry", "year": 2021, "type": "sedan", "vin": "4T1B11HK1MU123456", "licensePlate": "DEF-9012", "tankSize": 15, "fuelEfficiency": 30, "startingLocation": {"lat": 30.4355, "lng": -84.2825}, "homeBase": {"lat": 30.4383, "lng": -84.2807, "name": "Tallahassee Fleet Center"}, "driverBehavior": "aggressive", "features": ["obd2", "gps"]},
    {"id": "VEH-004", "make": "Honda", "model": "CR-V", "year": 2022, "type": "suv", "vin": "2HKRW2H89NH123456", "licensePlate": "GHI-3456", "tankSize": 22, "fuelEfficiency": 28, "startingLocation": {"lat": 30.4450, "lng": -84.2770}, "homeBase": {"lat": 30.4383, "lng": -84.2807, "name": "Tallahassee Fleet Center"}, "driverBehavior": "normal", "features": ["obd2", "gps", "iot"]},
    {"id": "VEH-005", "make": "Mercedes-Benz", "model": "Sprinter", "year": 2023, "type": "van", "vin": "WD3PE7CD0NP123456", "licensePlate": "JKL-7890", "tankSize": 25, "fuelEfficiency": 20, "startingLocation": {"lat": 30.4320, "lng": -84.2890}, "homeBase": {"lat": 30.4383, "lng": -84.2807, "name": "Tallahassee Fleet Center"}, "driverBehavior": "normal", "features": ["obd2", "gps", "iot", "camera", "cargo"]},
    {"id": "VEH-006", "make": "Ram", "model": "1500", "year": 2022, "type": "truck", "vin": "1C6SRFFT4NN123456", "licensePlate": "MNO-2468", "tankSize": 26, "fuelEfficiency": 17, "startingLocation": {"lat": 30.4400, "lng": -84.2850}, "homeBase": {"lat": 30.4383, "lng": -84.2807, "name": "Tallahassee Fleet Center"}, "driverBehavior": "aggressive", "features": ["obd2", "gps", "iot"]},
    {"id": "VEH-007", "make": "Tesla", "model": "Model 3", "year": 2023, "type": "sedan", "vin": "5YJ3E1EA7NF123456", "licensePlate": "PQR-1357", "tankSize": 0, "fuelEfficiency": 0, "batteryCapacity": 75, "electricRange": 310, "startingLocation": {"lat": 30.4385, "lng": -84.2805}, "homeBase": {"lat": 30.4383, "lng": -84.2807, "name": "Tallahassee Fleet Center"}, "driverBehavior": "normal", "features": ["gps", "iot", "camera", "ev"]},
    {"id": "VEH-008", "make": "Ford", "model": "Transit", "year": 2022, "type": "van", "vin": "1FTBR2C88MKA12345", "licensePlate": "STU-9753", "tankSize": 25, "fuelEfficiency": 19, "startingLocation": {"lat": 30.4470, "lng": -84.2815}, "homeBase": {"lat": 30.4383, "lng": -84.2807, "name": "Tallahassee Fleet Center"}, "driverBehavior": "cautious", "features": ["obd2", "gps", "iot", "cargo"]},
    {"id": "VEH-009", "make": "Nissan", "model": "Altima", "year": 2021, "type": "sedan", "vin": "1N4BL4BV9MN123456", "licensePlate": "VWX-2580", "tankSize": 16, "fuelEfficiency": 32, "startingLocation": {"lat": 30.4340, "lng": -84.2750}, "homeBase": {"lat": 30.4383, "lng": -84.2807, "name": "Tallahassee Fleet Center"}, "driverBehavior": "normal", "features": ["obd2", "gps"]},
    {"id": "VEH-010", "make": "GMC", "model": "Sierra", "year": 2023, "type": "truck", "vin": "1GTU9EED0NF123456", "licensePlate": "YZA-3691", "tankSize": 26, "fuelEfficiency": 18, "startingLocation": {"lat": 30.4425, "lng": -84.2780}, "homeBase": {"lat": 30.4383, "lng": -84.2807, "name": "Tallahassee Fleet Center"}, "driverBehavior": "normal", "features": ["obd2", "gps", "iot", "camera"]}
]

new_vehicles = []

# Generate 5 excavators (VEH-011 to VEH-015)
excavators = [
    {"make": "Caterpillar", "model": "320", "year": 2022, "tankSize": 75, "fuelEfficiency": 4},
    {"make": "John Deere", "model": "200G", "year": 2023, "tankSize": 70, "fuelEfficiency": 5},
    {"make": "Komatsu", "model": "PC210", "year": 2021, "tankSize": 80, "fuelEfficiency": 4},
    {"make": "Volvo", "model": "EC220", "year": 2022, "tankSize": 72, "fuelEfficiency": 5},
    {"make": "Hitachi", "model": "ZX210", "year": 2023, "tankSize": 75, "fuelEfficiency": 4}
]

for i, exc in enumerate(excavators):
    veh_num = 11 + i
    new_vehicles.append({
        "id": f"VEH-{veh_num:03d}",
        "make": exc["make"],
        "model": exc["model"],
        "year": exc["year"],
        "type": "excavator",
        "vin": f"EXC{random.randint(100000, 999999):06d}",
        "licensePlate": f"EXC-{veh_num:04d}",
        "tankSize": exc["tankSize"],
        "fuelEfficiency": exc["fuelEfficiency"],
        "startingLocation": {"lat": round(30.4300 + random.uniform(0, 0.015), 4), "lng": round(-84.2900 + random.uniform(0, 0.015), 4)},
        "homeBase": {"lat": 30.4383, "lng": -84.2807, "name": "Tallahassee Fleet Center"},
        "driverBehavior": "cautious",
        "features": ["obd2", "gps", "iot", "camera"]
    })

# Generate 3 dump trucks (VEH-016 to VEH-018)
dump_trucks = [
    {"make": "Mack", "model": "Granite", "year": 2022, "tankSize": 125, "fuelEfficiency": 6},
    {"make": "Peterbilt", "model": "567", "year": 2023, "tankSize": 150, "fuelEfficiency": 5},
    {"make": "Kenworth", "model": "T880", "year": 2021, "tankSize": 140, "fuelEfficiency": 6}
]

for i, dt in enumerate(dump_trucks):
    veh_num = 16 + i
    new_vehicles.append({
        "id": f"VEH-{veh_num:03d}",
        "make": dt["make"],
        "model": dt["model"],
        "year": dt["year"],
        "type": "dump_truck",
        "vin": f"DMP{random.randint(100000, 999999):06d}",
        "licensePlate": f"DMP-{veh_num:04d}",
        "tankSize": dt["tankSize"],
        "fuelEfficiency": dt["fuelEfficiency"],
        "startingLocation": {"lat": round(30.4350 + random.uniform(0, 0.015), 4), "lng": round(-84.2850 + random.uniform(0, 0.015), 4)},
        "homeBase": {"lat": 30.4383, "lng": -84.2807, "name": "Tallahassee Fleet Center"},
        "driverBehavior": "normal",
        "features": ["obd2", "gps", "iot", "cargo"]
    })

# Generate 4 trailers (VEH-019 to VEH-022)
trailers = [
    {"make": "Utility", "model": "3000R", "year": 2022, "tankSize": 15, "fuelEfficiency": 0},
    {"make": "Great Dane", "model": "Freedom", "year": 2023, "tankSize": 12, "fuelEfficiency": 0},
    {"make": "Wabash", "model": "DuraPlate", "year": 2021, "tankSize": 15, "fuelEfficiency": 0},
    {"make": "Stoughton", "model": "Composite", "year": 2022, "tankSize": 10, "fuelEfficiency": 0}
]

for i, tr in enumerate(trailers):
    veh_num = 19 + i
    new_vehicles.append({
        "id": f"VEH-{veh_num:03d}",
        "make": tr["make"],
        "model": tr["model"],
        "year": tr["year"],
        "type": "trailer",
        "vin": f"TRL{random.randint(100000, 999999):06d}",
        "licensePlate": f"TRL-{veh_num:04d}",
        "tankSize": tr["tankSize"],  # For refrigeration unit
        "fuelEfficiency": tr["fuelEfficiency"],
        "startingLocation": {"lat": round(30.4370 + random.uniform(0, 0.015), 4), "lng": round(-84.2820 + random.uniform(0, 0.015), 4)},
        "homeBase": {"lat": 30.4383, "lng": -84.2807, "name": "Tallahassee Fleet Center"},
        "driverBehavior": "normal",
        "features": ["gps", "iot", "cargo"]
    })

# Generate 28 more various vehicles (VEH-023 to VEH-050)
additional_vehicles = [
    # More trucks
    *[{"make": "Ford", "model": "F-250", "year": 2022, "type": "truck", "tankSize": 34, "fuelEfficiency": 15} for _ in range(3)],
    *[{"make": "Chevrolet", "model": "Colorado", "year": 2023, "type": "truck", "tankSize": 21, "fuelEfficiency": 20} for _ in range(2)],
    *[{"make": "Toyota", "model": "Tacoma", "year": 2022, "type": "truck", "tankSize": 21, "fuelEfficiency": 21} for _ in range(2)],
    # More vans
    *[{"make": "Ram", "model": "ProMaster", "year": 2022, "type": "van", "tankSize": 24, "fuelEfficiency": 18} for _ in range(3)],
    *[{"make": "Nissan", "model": "NV3500", "year": 2021, "type": "van", "tankSize": 28, "fuelEfficiency": 16} for _ in range(2)],
    # More SUVs
    *[{"make": "Ford", "model": "Explorer", "year": 2023, "type": "suv", "tankSize": 18, "fuelEfficiency": 24} for _ in range(3)],
    *[{"make": "Chevrolet", "model": "Tahoe", "year": 2022, "type": "suv", "tankSize": 24, "fuelEfficiency": 20} for _ in range(2)],
    *[{"make": "Jeep", "model": "Wrangler", "year": 2023, "type": "suv", "tankSize": 21, "fuelEfficiency": 22} for _ in range(2)],
    # More sedans
    *[{"make": "Honda", "model": "Accord", "year": 2022, "type": "sedan", "tankSize": 14, "fuelEfficiency": 32} for _ in range(3)],
    *[{"make": "Toyota", "model": "Corolla", "year": 2023, "type": "sedan", "tankSize": 13, "fuelEfficiency": 35} for _ in range(2)],
    # Electric vehicles
    *[{"make": "Tesla", "model": "Model Y", "year": 2023, "type": "suv", "tankSize": 0, "fuelEfficiency": 0, "batteryCapacity": 75, "electricRange": 330} for _ in range(2)],
    *[{"make": "Chevrolet", "model": "Bolt EV", "year": 2022, "type": "sedan", "tankSize": 0, "fuelEfficiency": 0, "batteryCapacity": 66, "electricRange": 259} for _ in range(2)],
]

behaviors = ["normal", "cautious", "aggressive"]
features_sets = [
    ["obd2", "gps", "iot"],
    ["obd2", "gps", "iot", "camera"],
    ["obd2", "gps"],
    ["gps", "iot", "camera", "ev"],  # For EVs
    ["obd2", "gps", "iot", "cargo"]
]

for i, veh in enumerate(additional_vehicles):
    veh_num = 23 + i
    is_ev = "batteryCapacity" in veh

    vehicle = {
        "id": f"VEH-{veh_num:03d}",
        "make": veh["make"],
        "model": veh["model"],
        "year": veh["year"],
        "type": veh["type"],
        "vin": f"{random.choice(['1FT', '1GC', '2HK', '4T1', '5YJ'])}{random.randint(100000, 999999):06d}",
        "licensePlate": f"FL{random.randint(1000, 9999):04d}",
        "tankSize": veh["tankSize"],
        "fuelEfficiency": veh["fuelEfficiency"],
        "startingLocation": {"lat": round(30.4350 + random.uniform(0, 0.010), 4), "lng": round(-84.2780 + random.uniform(0, 0.005), 4)},
        "homeBase": {"lat": 30.4383, "lng": -84.2807, "name": "Tallahassee Fleet Center"},
        "driverBehavior": random.choice(behaviors),
        "features": features_sets[3] if is_ev else random.choice(features_sets[:3])
    }

    if is_ev:
        vehicle["batteryCapacity"] = veh["batteryCapacity"]
        vehicle["electricRange"] = veh["electricRange"]

    new_vehicles.append(vehicle)

# Combine all vehicles
all_vehicles = existing_vehicles + new_vehicles

# Write to JSON file
output = {"vehicles": all_vehicles}

with open('vehicles.json', 'w') as f:
    json.dump(output, f, indent=2)

print(f"✅ Generated {len(all_vehicles)} vehicles:")
print(f"   - Original vehicles: 10")
print(f"   - Excavators: 5")
print(f"   - Dump trucks: 3")
print(f"   - Trailers: 4")
print(f"   - Additional vehicles: 28")
print(f"   - Total: {len(all_vehicles)}")
