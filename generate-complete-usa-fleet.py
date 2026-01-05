#!/usr/bin/env python3
"""
Complete 2025 USA Vehicle Fleet Generator
Generates ALL 2025 production vehicles + specialty equipment
Includes: Cars, Trucks, SUVs, Vans, Electric Vehicles, Specialty Equipment
"""

import bpy
import math
import json
import os
from pathlib import Path
from datetime import datetime

print("🇺🇸 COMPLETE 2025 USA VEHICLE FLEET GENERATOR")
print("=" * 80)
print("Generating ALL 2025 production vehicles + specialty equipment")
print("=" * 80)
print()

output_dir = Path("./output/complete_usa_fleet_2025")
output_dir.mkdir(parents=True, exist_ok=True)

# COMPREHENSIVE VEHICLE DATABASE
vehicles_database = {

    # ========================================================================
    # FORD (2025 Production Lineup)
    # ========================================================================
    "Ford_F150_Lightning": {
        "manufacturer": "Ford", "type": "Electric Pickup", "class": "Light Duty Truck",
        "dims": {"length": 5.9, "width": 2.0, "height": 2.0}, "wheelbase": 3.7,
        "colors": ["Antimatter Blue", "Oxford White", "Rapid Red", "Agate Black"]
    },
    "Ford_F150": {
        "manufacturer": "Ford", "type": "Pickup Truck", "class": "Light Duty Truck",
        "dims": {"length": 5.9, "width": 2.0, "height": 1.9}, "wheelbase": 3.7,
        "colors": ["Oxford White", "Agate Black", "Iconic Silver"]
    },
    "Ford_F250_SuperDuty": {
        "manufacturer": "Ford", "type": "Heavy Duty Pickup", "class": "Heavy Duty Truck",
        "dims": {"length": 6.8, "width": 2.4, "height": 2.1}, "wheelbase": 4.3,
        "colors": ["Oxford White", "Stone Gray", "Agate Black"]
    },
    "Ford_F350_SuperDuty": {
        "manufacturer": "Ford", "type": "Heavy Duty Pickup", "class": "Heavy Duty Truck",
        "dims": {"length": 6.9, "width": 2.4, "height": 2.2}, "wheelbase": 4.5,
        "colors": ["Oxford White", "Agate Black"]
    },
    "Ford_F450_SuperDuty": {
        "manufacturer": "Ford", "type": "Super Heavy Duty Pickup", "class": "Super Heavy Duty",
        "dims": {"length": 7.0, "width": 2.5, "height": 2.3}, "wheelbase": 4.6,
        "colors": ["Oxford White", "Agate Black"]
    },
    "Ford_Ranger": {
        "manufacturer": "Ford", "type": "Midsize Pickup", "class": "Midsize Truck",
        "dims": {"length": 5.4, "width": 1.9, "height": 1.8}, "wheelbase": 3.2,
        "colors": ["Velocity Blue", "Oxford White", "Rapid Red"]
    },
    "Ford_Maverick": {
        "manufacturer": "Ford", "type": "Compact Pickup", "class": "Compact Truck",
        "dims": {"length": 5.1, "width": 1.9, "height": 1.7}, "wheelbase": 3.0,
        "colors": ["Velocity Blue", "Alto Blue", "Oxford White"]
    },
    "Ford_Bronco": {
        "manufacturer": "Ford", "type": "SUV", "class": "Midsize SUV",
        "dims": {"length": 4.8, "width": 1.9, "height": 1.8}, "wheelbase": 2.9,
        "colors": ["Cactus Gray", "Eruption Green", "Oxford White"]
    },
    "Ford_Bronco_Sport": {
        "manufacturer": "Ford", "type": "Compact SUV", "class": "Compact SUV",
        "dims": {"length": 4.4, "width": 1.9, "height": 1.7}, "wheelbase": 2.7,
        "colors": ["Carbonized Gray", "Rapid Red", "Oxford White"]
    },
    "Ford_Explorer": {
        "manufacturer": "Ford", "type": "SUV", "class": "Midsize SUV",
        "dims": {"length": 5.0, "width": 2.0, "height": 1.8}, "wheelbase": 3.0,
        "colors": ["Carbonized Gray", "Atlas Blue", "Star White"]
    },
    "Ford_Expedition": {
        "manufacturer": "Ford", "type": "Full-Size SUV", "class": "Full-Size SUV",
        "dims": {"length": 5.4, "width": 2.0, "height": 1.9}, "wheelbase": 3.1,
        "colors": ["Stone Blue", "Oxford White", "Agate Black"]
    },
    "Ford_Escape": {
        "manufacturer": "Ford", "type": "Compact SUV", "class": "Compact SUV",
        "dims": {"length": 4.6, "width": 1.9, "height": 1.7}, "wheelbase": 2.7,
        "colors": ["Rapid Red", "Iconic Silver", "Agate Black"]
    },
    "Ford_Edge": {
        "manufacturer": "Ford", "type": "Midsize SUV", "class": "Midsize SUV",
        "dims": {"length": 4.8, "width": 2.0, "height": 1.7}, "wheelbase": 2.8,
        "colors": ["Carbonized Gray", "Rapid Red", "Oxford White"]
    },
    "Ford_Mustang": {
        "manufacturer": "Ford", "type": "Sports Car", "class": "Sports Car",
        "dims": {"length": 4.8, "width": 1.9, "height": 1.4}, "wheelbase": 2.7,
        "colors": ["Grabber Blue", "Race Red", "Shadow Black"]
    },
    "Ford_Mustang_MachE": {
        "manufacturer": "Ford", "type": "Electric SUV", "class": "Electric SUV",
        "dims": {"length": 4.7, "width": 1.9, "height": 1.6}, "wheelbase": 2.9,
        "colors": ["Grabber Blue", "Star White", "Shadow Black"]
    },
    "Ford_Transit_150": {
        "manufacturer": "Ford", "type": "Cargo Van", "class": "Full-Size Van",
        "dims": {"length": 6.0, "width": 2.0, "height": 2.8}, "wheelbase": 3.5,
        "colors": ["Oxford White", "Agate Black", "Iconic Silver"]
    },
    "Ford_Transit_250": {
        "manufacturer": "Ford", "type": "Cargo Van", "class": "Full-Size Van",
        "dims": {"length": 6.2, "width": 2.0, "height": 2.9}, "wheelbase": 3.7,
        "colors": ["Oxford White", "Agate Black"]
    },
    "Ford_Transit_350": {
        "manufacturer": "Ford", "type": "Cargo Van", "class": "Full-Size Van",
        "dims": {"length": 6.5, "width": 2.0, "height": 3.0}, "wheelbase": 4.0,
        "colors": ["Oxford White", "Agate Black"]
    },
    "Ford_Transit_Connect": {
        "manufacturer": "Ford", "type": "Compact Van", "class": "Compact Van",
        "dims": {"length": 4.8, "width": 1.8, "height": 1.9}, "wheelbase": 2.7,
        "colors": ["Frozen White", "Race Red", "Shadow Black"]
    },
    "Ford_ETransit": {
        "manufacturer": "Ford", "type": "Electric Van", "class": "Electric Van",
        "dims": {"length": 6.0, "width": 2.0, "height": 2.8}, "wheelbase": 3.5,
        "colors": ["Oxford White", "Agate Black"]
    },

    # ========================================================================
    # CHEVROLET (2025 Production Lineup)
    # ========================================================================
    "Chevrolet_Silverado_1500": {
        "manufacturer": "Chevrolet", "type": "Pickup Truck", "class": "Light Duty Truck",
        "dims": {"length": 5.9, "width": 2.0, "height": 1.9}, "wheelbase": 3.7,
        "colors": ["Summit White", "Black", "Silver Ice Metallic"]
    },
    "Chevrolet_Silverado_EV": {
        "manufacturer": "Chevrolet", "type": "Electric Pickup", "class": "Electric Truck",
        "dims": {"length": 6.0, "width": 2.1, "height": 2.0}, "wheelbase": 3.6,
        "colors": ["Summit White", "Black", "Blue Metallic"]
    },
    "Chevrolet_Silverado_2500HD": {
        "manufacturer": "Chevrolet", "type": "Heavy Duty Pickup", "class": "Heavy Duty Truck",
        "dims": {"length": 6.6, "width": 2.2, "height": 2.0}, "wheelbase": 3.9,
        "colors": ["Summit White", "Black"]
    },
    "Chevrolet_Silverado_3500HD": {
        "manufacturer": "Chevrolet", "type": "Heavy Duty Pickup", "class": "Heavy Duty Truck",
        "dims": {"length": 6.7, "width": 2.5, "height": 2.1}, "wheelbase": 4.0,
        "colors": ["Summit White", "Black"]
    },
    "Chevrolet_Colorado": {
        "manufacturer": "Chevrolet", "type": "Midsize Pickup", "class": "Midsize Truck",
        "dims": {"length": 5.4, "width": 1.9, "height": 1.8}, "wheelbase": 3.3,
        "colors": ["Summit White", "Satin Steel", "Red Hot"]
    },
    "Chevrolet_Tahoe": {
        "manufacturer": "Chevrolet", "type": "Full-Size SUV", "class": "Full-Size SUV",
        "dims": {"length": 5.4, "width": 2.1, "height": 1.9}, "wheelbase": 3.1,
        "colors": ["Summit White", "Black", "Silver Ice"]
    },
    "Chevrolet_Suburban": {
        "manufacturer": "Chevrolet", "type": "Full-Size SUV", "class": "Full-Size SUV",
        "dims": {"length": 5.7, "width": 2.1, "height": 1.9}, "wheelbase": 3.4,
        "colors": ["Summit White", "Black", "Silver Ice"]
    },
    "Chevrolet_Traverse": {
        "manufacturer": "Chevrolet", "type": "Midsize SUV", "class": "Midsize SUV",
        "dims": {"length": 5.2, "width": 2.0, "height": 1.8}, "wheelbase": 3.1,
        "colors": ["Summit White", "Mosaic Black", "Silver Ice"]
    },
    "Chevrolet_Equinox": {
        "manufacturer": "Chevrolet", "type": "Compact SUV", "class": "Compact SUV",
        "dims": {"length": 4.7, "width": 1.8, "height": 1.6}, "wheelbase": 2.7,
        "colors": ["Summit White", "Mosaic Black", "Red Tintcoat"]
    },
    "Chevrolet_Blazer": {
        "manufacturer": "Chevrolet", "type": "Midsize SUV", "class": "Midsize SUV",
        "dims": {"length": 4.9, "width": 1.9, "height": 1.7}, "wheelbase": 2.9,
        "colors": ["Summit White", "Black", "Radiant Red"]
    },
    "Chevrolet_Trax": {
        "manufacturer": "Chevrolet", "type": "Compact SUV", "class": "Compact SUV",
        "dims": {"length": 4.4, "width": 1.8, "height": 1.6}, "wheelbase": 2.6,
        "colors": ["Summit White", "Mosaic Black", "Nitro Yellow"]
    },
    "Chevrolet_Express_2500": {
        "manufacturer": "Chevrolet", "type": "Cargo Van", "class": "Full-Size Van",
        "dims": {"length": 5.7, "width": 2.0, "height": 2.1}, "wheelbase": 3.4,
        "colors": ["Summit White", "Black"]
    },
    "Chevrolet_Express_3500": {
        "manufacturer": "Chevrolet", "type": "Cargo Van", "class": "Full-Size Van",
        "dims": {"length": 6.0, "width": 2.0, "height": 2.2}, "wheelbase": 3.9,
        "colors": ["Summit White", "Black"]
    },

    # ========================================================================
    # RAM (2025 Production Lineup)
    # ========================================================================
    "Ram_1500": {
        "manufacturer": "Ram", "type": "Pickup Truck", "class": "Light Duty Truck",
        "dims": {"length": 5.9, "width": 2.0, "height": 1.9}, "wheelbase": 3.6,
        "colors": ["Bright White", "Diamond Black", "Flame Red"]
    },
    "Ram_1500_REV": {
        "manufacturer": "Ram", "type": "Electric Pickup", "class": "Electric Truck",
        "dims": {"length": 5.9, "width": 2.0, "height": 1.9}, "wheelbase": 3.6,
        "colors": ["Bright White", "Diamond Black", "Hydro Blue"]
    },
    "Ram_2500": {
        "manufacturer": "Ram", "type": "Heavy Duty Pickup", "class": "Heavy Duty Truck",
        "dims": {"length": 6.5, "width": 2.4, "height": 2.0}, "wheelbase": 4.0,
        "colors": ["Bright White", "Diamond Black"]
    },
    "Ram_3500": {
        "manufacturer": "Ram", "type": "Heavy Duty Pickup", "class": "Heavy Duty Truck",
        "dims": {"length": 6.7, "width": 2.5, "height": 2.1}, "wheelbase": 4.2,
        "colors": ["Bright White", "Diamond Black"]
    },
    "Ram_ProMaster_1500": {
        "manufacturer": "Ram", "type": "Commercial Van", "class": "Full-Size Van",
        "dims": {"length": 5.6, "width": 2.0, "height": 2.5}, "wheelbase": 3.3,
        "colors": ["Bright White", "Black"]
    },
    "Ram_ProMaster_2500": {
        "manufacturer": "Ram", "type": "Commercial Van", "class": "Full-Size Van",
        "dims": {"length": 6.0, "width": 2.0, "height": 2.7}, "wheelbase": 3.6,
        "colors": ["Bright White", "Black", "Broom Yellow"]
    },
    "Ram_ProMaster_3500": {
        "manufacturer": "Ram", "type": "Commercial Van", "class": "Full-Size Van",
        "dims": {"length": 6.4, "width": 2.0, "height": 2.9}, "wheelbase": 3.9,
        "colors": ["Bright White", "Black"]
    },
    "Ram_ProMaster_City": {
        "manufacturer": "Ram", "type": "Compact Van", "class": "Compact Van",
        "dims": {"length": 4.9, "width": 1.8, "height": 1.9}, "wheelbase": 2.7,
        "colors": ["Bright White", "Black"]
    },

    # ========================================================================
    # GMC (2025 Production Lineup)
    # ========================================================================
    "GMC_Sierra_1500": {
        "manufacturer": "GMC", "type": "Pickup Truck", "class": "Light Duty Truck",
        "dims": {"length": 5.9, "width": 2.0, "height": 1.9}, "wheelbase": 3.7,
        "colors": ["Summit White", "Onyx Black", "Satin Steel"]
    },
    "GMC_Sierra_EV": {
        "manufacturer": "GMC", "type": "Electric Pickup", "class": "Electric Truck",
        "dims": {"length": 6.0, "width": 2.1, "height": 2.0}, "wheelbase": 3.6,
        "colors": ["Summit White", "Onyx Black", "Electric Blue"]
    },
    "GMC_Sierra_2500HD": {
        "manufacturer": "GMC", "type": "Heavy Duty Pickup", "class": "Heavy Duty Truck",
        "dims": {"length": 6.6, "width": 2.2, "height": 2.0}, "wheelbase": 3.9,
        "colors": ["Summit White", "Onyx Black"]
    },
    "GMC_Sierra_3500HD": {
        "manufacturer": "GMC", "type": "Heavy Duty Pickup", "class": "Heavy Duty Truck",
        "dims": {"length": 6.7, "width": 2.5, "height": 2.1}, "wheelbase": 4.0,
        "colors": ["Summit White", "Onyx Black"]
    },
    "GMC_Canyon": {
        "manufacturer": "GMC", "type": "Midsize Pickup", "class": "Midsize Truck",
        "dims": {"length": 5.4, "width": 1.9, "height": 1.8}, "wheelbase": 3.3,
        "colors": ["Summit White", "Satin Steel", "Cayenne Red"]
    },
    "GMC_Yukon": {
        "manufacturer": "GMC", "type": "Full-Size SUV", "class": "Full-Size SUV",
        "dims": {"length": 5.4, "width": 2.1, "height": 1.9}, "wheelbase": 3.1,
        "colors": ["Summit White", "Onyx Black", "Steel Gray"]
    },
    "GMC_Yukon_XL": {
        "manufacturer": "GMC", "type": "Full-Size SUV", "class": "Full-Size SUV",
        "dims": {"length": 5.7, "width": 2.1, "height": 1.9}, "wheelbase": 3.4,
        "colors": ["Summit White", "Onyx Black"]
    },
    "GMC_Acadia": {
        "manufacturer": "GMC", "type": "Midsize SUV", "class": "Midsize SUV",
        "dims": {"length": 4.9, "width": 1.9, "height": 1.7}, "wheelbase": 2.9,
        "colors": ["Summit White", "Onyx Black", "Cayenne Red"]
    },
    "GMC_Terrain": {
        "manufacturer": "GMC", "type": "Compact SUV", "class": "Compact SUV",
        "dims": {"length": 4.6, "width": 1.8, "height": 1.7}, "wheelbase": 2.7,
        "colors": ["Summit White", "Onyx Black", "Red Quartz"]
    },
    "GMC_Savana_2500": {
        "manufacturer": "GMC", "type": "Cargo Van", "class": "Full-Size Van",
        "dims": {"length": 5.7, "width": 2.0, "height": 2.1}, "wheelbase": 3.4,
        "colors": ["Summit White", "Onyx Black"]
    },
    "GMC_Savana_3500": {
        "manufacturer": "GMC", "type": "Cargo Van", "class": "Full-Size Van",
        "dims": {"length": 6.0, "width": 2.0, "height": 2.2}, "wheelbase": 3.9,
        "colors": ["Summit White", "Onyx Black"]
    },

    # ========================================================================
    # TOYOTA (2025 Production Lineup)
    # ========================================================================
    "Toyota_Tundra": {
        "manufacturer": "Toyota", "type": "Pickup Truck", "class": "Full-Size Truck",
        "dims": {"length": 5.9, "width": 2.0, "height": 1.9}, "wheelbase": 3.7,
        "colors": ["Super White", "Midnight Black", "Barcelona Red"]
    },
    "Toyota_Tacoma": {
        "manufacturer": "Toyota", "type": "Midsize Pickup", "class": "Midsize Truck",
        "dims": {"length": 5.4, "width": 1.9, "height": 1.8}, "wheelbase": 3.3,
        "colors": ["Super White", "Midnight Black", "Voodoo Blue"]
    },
    "Toyota_Sequoia": {
        "manufacturer": "Toyota", "type": "Full-Size SUV", "class": "Full-Size SUV",
        "dims": {"length": 5.5, "width": 2.0, "height": 1.9}, "wheelbase": 3.1,
        "colors": ["Super White", "Midnight Black", "Blueprint"]
    },
    "Toyota_4Runner": {
        "manufacturer": "Toyota", "type": "Midsize SUV", "class": "Midsize SUV",
        "dims": {"length": 4.9, "width": 1.9, "height": 1.8}, "wheelbase": 2.8,
        "colors": ["Super White", "Midnight Black", "Army Green"]
    },
    "Toyota_Highlander": {
        "manufacturer": "Toyota", "type": "Midsize SUV", "class": "Midsize SUV",
        "dims": {"length": 4.9, "width": 2.0, "height": 1.8}, "wheelbase": 2.8,
        "colors": ["Blizzard Pearl", "Midnight Black", "Ruby Red"]
    },
    "Toyota_RAV4": {
        "manufacturer": "Toyota", "type": "Compact SUV", "class": "Compact SUV",
        "dims": {"length": 4.6, "width": 1.9, "height": 1.7}, "wheelbase": 2.7,
        "colors": ["Super White", "Midnight Black", "Ruby Red"]
    },
    "Toyota_Corolla_Cross": {
        "manufacturer": "Toyota", "type": "Compact SUV", "class": "Compact SUV",
        "dims": {"length": 4.4, "width": 1.8, "height": 1.6}, "wheelbase": 2.6,
        "colors": ["Super White", "Black Sand", "Blue Crush"]
    },
    "Toyota_Sienna": {
        "manufacturer": "Toyota", "type": "Minivan", "class": "Minivan",
        "dims": {"length": 5.2, "width": 2.0, "height": 1.8}, "wheelbase": 3.0,
        "colors": ["Super White", "Midnight Black", "Celestial Silver"]
    },

    # ========================================================================
    # HONDA (2025 Production Lineup)
    # ========================================================================
    "Honda_Ridgeline": {
        "manufacturer": "Honda", "type": "Midsize Pickup", "class": "Midsize Truck",
        "dims": {"length": 5.3, "width": 2.0, "height": 1.8}, "wheelbase": 3.2,
        "colors": ["Platinum White", "Crystal Black", "Radiant Red"]
    },
    "Honda_Pilot": {
        "manufacturer": "Honda", "type": "Midsize SUV", "class": "Midsize SUV",
        "dims": {"length": 5.0, "width": 2.0, "height": 1.8}, "wheelbase": 2.8,
        "colors": ["Platinum White", "Crystal Black", "Sonic Gray"]
    },
    "Honda_Passport": {
        "manufacturer": "Honda", "type": "Midsize SUV", "class": "Midsize SUV",
        "dims": {"length": 4.9, "width": 2.0, "height": 1.8}, "wheelbase": 2.8,
        "colors": ["Platinum White", "Crystal Black", "Radiant Red"]
    },
    "Honda_CRV": {
        "manufacturer": "Honda", "type": "Compact SUV", "class": "Compact SUV",
        "dims": {"length": 4.7, "width": 1.9, "height": 1.7}, "wheelbase": 2.7,
        "colors": ["Platinum White", "Crystal Black", "Radiant Red"]
    },
    "Honda_HRV": {
        "manufacturer": "Honda", "type": "Compact SUV", "class": "Compact SUV",
        "dims": {"length": 4.4, "width": 1.8, "height": 1.6}, "wheelbase": 2.6,
        "colors": ["Platinum White", "Crystal Black", "Blazing Orange"]
    },
    "Honda_Odyssey": {
        "manufacturer": "Honda", "type": "Minivan", "class": "Minivan",
        "dims": {"length": 5.2, "width": 2.0, "height": 1.7}, "wheelbase": 3.0,
        "colors": ["Platinum White", "Crystal Black", "Pacific Pewter"]
    },

    # ========================================================================
    # NISSAN (2025 Production Lineup)
    # ========================================================================
    "Nissan_Titan": {
        "manufacturer": "Nissan", "type": "Pickup Truck", "class": "Full-Size Truck",
        "dims": {"length": 5.8, "width": 2.0, "height": 1.9}, "wheelbase": 3.6,
        "colors": ["Pearl White", "Magnetic Black", "Scarlet Red"]
    },
    "Nissan_Frontier": {
        "manufacturer": "Nissan", "type": "Midsize Pickup", "class": "Midsize Truck",
        "dims": {"length": 5.3, "width": 1.9, "height": 1.8}, "wheelbase": 3.2,
        "colors": ["Pearl White", "Magnetic Black", "Boulder Gray"]
    },
    "Nissan_Armada": {
        "manufacturer": "Nissan", "type": "Full-Size SUV", "class": "Full-Size SUV",
        "dims": {"length": 5.3, "width": 2.0, "height": 1.9}, "wheelbase": 3.1,
        "colors": ["Pearl White", "Magnetic Black", "Boulder Gray"]
    },
    "Nissan_Pathfinder": {
        "manufacturer": "Nissan", "type": "Midsize SUV", "class": "Midsize SUV",
        "dims": {"length": 5.0, "width": 2.0, "height": 1.8}, "wheelbase": 2.9,
        "colors": ["Pearl White", "Magnetic Black", "Scarlet Red"]
    },
    "Nissan_Rogue": {
        "manufacturer": "Nissan", "type": "Compact SUV", "class": "Compact SUV",
        "dims": {"length": 4.6, "width": 1.8, "height": 1.7}, "wheelbase": 2.7,
        "colors": ["Pearl White", "Magnetic Black", "Scarlet Red"]
    },
    "Nissan_Kicks": {
        "manufacturer": "Nissan", "type": "Subcompact SUV", "class": "Subcompact SUV",
        "dims": {"length": 4.3, "width": 1.8, "height": 1.6}, "wheelbase": 2.6,
        "colors": ["Pearl White", "Magnetic Black", "Aspen White"]
    },
    "Nissan_NV_200": {
        "manufacturer": "Nissan", "type": "Compact Van", "class": "Compact Van",
        "dims": {"length": 4.6, "width": 1.7, "height": 1.9}, "wheelbase": 2.7,
        "colors": ["Pearl White", "Magnetic Black"]
    },
    "Nissan_NV_2500": {
        "manufacturer": "Nissan", "type": "Cargo Van", "class": "Full-Size Van",
        "dims": {"length": 6.0, "width": 2.0, "height": 2.2}, "wheelbase": 3.9,
        "colors": ["Pearl White", "Magnetic Black"]
    },
    "Nissan_NV_3500": {
        "manufacturer": "Nissan", "type": "Cargo Van", "class": "Full-Size Van",
        "dims": {"length": 6.3, "width": 2.0, "height": 2.3}, "wheelbase": 4.2,
        "colors": ["Pearl White", "Magnetic Black"]
    },

    # ========================================================================
    # TESLA (2025 Production Lineup)
    # ========================================================================
    "Tesla_Cybertruck": {
        "manufacturer": "Tesla", "type": "Electric Pickup", "class": "Electric Truck",
        "dims": {"length": 5.7, "width": 2.0, "height": 1.9}, "wheelbase": 3.6,
        "colors": ["Stainless Steel"]
    },
    "Tesla_Model_X": {
        "manufacturer": "Tesla", "type": "Electric SUV", "class": "Electric SUV",
        "dims": {"length": 5.0, "width": 2.0, "height": 1.7}, "wheelbase": 2.9,
        "colors": ["Pearl White", "Solid Black", "Deep Blue"]
    },
    "Tesla_Model_Y": {
        "manufacturer": "Tesla", "type": "Electric SUV", "class": "Electric SUV",
        "dims": {"length": 4.8, "width": 1.9, "height": 1.6}, "wheelbase": 2.9,
        "colors": ["Pearl White", "Midnight Silver", "Deep Blue"]
    },

    # ========================================================================
    # RIVIAN (2025 Production Lineup)
    # ========================================================================
    "Rivian_R1T": {
        "manufacturer": "Rivian", "type": "Electric Pickup", "class": "Electric Truck",
        "dims": {"length": 5.5, "width": 2.0, "height": 1.9}, "wheelbase": 3.4,
        "colors": ["Rivian Blue", "Launch Green", "Limestone"]
    },
    "Rivian_R1S": {
        "manufacturer": "Rivian", "type": "Electric SUV", "class": "Electric SUV",
        "dims": {"length": 5.1, "width": 2.0, "height": 1.9}, "wheelbase": 3.1,
        "colors": ["Rivian Blue", "Forest Green", "Glacier White"]
    },
    "Rivian_EDV_700": {
        "manufacturer": "Rivian", "type": "Electric Delivery Van", "class": "Electric Van",
        "dims": {"length": 6.0, "width": 2.2, "height": 2.7}, "wheelbase": 3.8,
        "colors": ["Amazon Gray", "White"]
    },

    # ========================================================================
    # MERCEDES-BENZ VANS (2025 Production Lineup)
    # ========================================================================
    "Mercedes_Sprinter_2500": {
        "manufacturer": "Mercedes-Benz", "type": "Cargo Van", "class": "Full-Size Van",
        "dims": {"length": 6.0, "width": 2.0, "height": 2.8}, "wheelbase": 3.7,
        "colors": ["Arctic White", "Graphite Gray", "Jupiter Red"]
    },
    "Mercedes_Sprinter_3500": {
        "manufacturer": "Mercedes-Benz", "type": "Cargo Van", "class": "Full-Size Van",
        "dims": {"length": 6.4, "width": 2.0, "height": 3.0}, "wheelbase": 4.0,
        "colors": ["Arctic White", "Graphite Gray"]
    },
    "Mercedes_eSprinter": {
        "manufacturer": "Mercedes-Benz", "type": "Electric Van", "class": "Electric Van",
        "dims": {"length": 6.0, "width": 2.0, "height": 2.8}, "wheelbase": 3.7,
        "colors": ["Arctic White", "Graphite Gray"]
    },
    "Mercedes_Metris": {
        "manufacturer": "Mercedes-Benz", "type": "Compact Van", "class": "Compact Van",
        "dims": {"length": 5.1, "width": 1.9, "height": 1.9}, "wheelbase": 3.2,
        "colors": ["Arctic White", "Graphite Gray", "Jupiter Red"]
    },

    # ========================================================================
    # ALTEC ELECTRIC UTILITY TRUCKS (Specialty Equipment)
    # ========================================================================
    "Altec_eWorker_45": {
        "manufacturer": "Altec", "type": "Electric Bucket Truck", "class": "Utility Truck",
        "dims": {"length": 7.5, "width": 2.4, "height": 3.5}, "wheelbase": 4.8,
        "colors": ["Safety Yellow", "White", "Orange"],
        "specialty": {"boom_height": 13.7, "platform_capacity": 340}
    },
    "Altec_eWorker_50": {
        "manufacturer": "Altec", "type": "Electric Bucket Truck", "class": "Utility Truck",
        "dims": {"length": 8.0, "width": 2.4, "height": 3.8}, "wheelbase": 5.0,
        "colors": ["Safety Yellow", "White", "Orange"],
        "specialty": {"boom_height": 15.2, "platform_capacity": 340}
    },
    "Altec_eDigger_Derrick": {
        "manufacturer": "Altec", "type": "Electric Digger Derrick", "class": "Utility Truck",
        "dims": {"length": 8.5, "width": 2.5, "height": 3.5}, "wheelbase": 5.2,
        "colors": ["Safety Yellow", "White"],
        "specialty": {"boom_length": 12.2, "dig_depth": 3.0}
    },
    "Altec_eChipper": {
        "manufacturer": "Altec", "type": "Electric Chipper Truck", "class": "Utility Truck",
        "dims": {"length": 7.0, "width": 2.4, "height": 3.2}, "wheelbase": 4.5,
        "colors": ["Safety Yellow", "White", "Green"],
        "specialty": {"chipper_capacity": 12}
    },

    # ========================================================================
    # WATER TRUCKS (Specialty Equipment)
    # ========================================================================
    "Freightliner_M2_Water_Truck_2000": {
        "manufacturer": "Freightliner", "type": "Water Truck", "class": "Specialty Truck",
        "dims": {"length": 8.0, "width": 2.5, "height": 3.2}, "wheelbase": 5.0,
        "colors": ["White", "Safety Yellow"],
        "specialty": {"water_capacity_gal": 2000, "spray_width_ft": 20}
    },
    "Freightliner_M2_Water_Truck_4000": {
        "manufacturer": "Freightliner", "type": "Water Truck", "class": "Specialty Truck",
        "dims": {"length": 9.0, "width": 2.5, "height": 3.3}, "wheelbase": 5.5,
        "colors": ["White", "Safety Yellow"],
        "specialty": {"water_capacity_gal": 4000, "spray_width_ft": 24}
    },
    "International_HV_Water_Truck_5000": {
        "manufacturer": "International", "type": "Water Truck", "class": "Specialty Truck",
        "dims": {"length": 9.5, "width": 2.5, "height": 3.4}, "wheelbase": 6.0,
        "colors": ["White", "Safety Yellow"],
        "specialty": {"water_capacity_gal": 5000, "spray_width_ft": 28}
    },

    # ========================================================================
    # STREET SWEEPERS (Specialty Equipment)
    # ========================================================================
    "Elgin_Broom_Bear": {
        "manufacturer": "Elgin", "type": "Mechanical Broom Sweeper", "class": "Street Sweeper",
        "dims": {"length": 5.5, "width": 2.4, "height": 3.0}, "wheelbase": 3.5,
        "colors": ["White", "Safety Yellow", "Blue"],
        "specialty": {"hopper_capacity_yd": 3.5, "sweep_width_ft": 11}
    },
    "Elgin_Pelican": {
        "manufacturer": "Elgin", "type": "Regenerative Air Sweeper", "class": "Street Sweeper",
        "dims": {"length": 6.0, "width": 2.5, "height": 3.1}, "wheelbase": 4.0,
        "colors": ["White", "Safety Yellow"],
        "specialty": {"hopper_capacity_yd": 4.0, "sweep_width_ft": 11}
    },
    "Tymco_600": {
        "manufacturer": "Tymco", "type": "Regenerative Air Sweeper", "class": "Street Sweeper",
        "dims": {"length": 5.8, "width": 2.4, "height": 3.0}, "wheelbase": 3.8,
        "colors": ["White", "Safety Yellow"],
        "specialty": {"hopper_capacity_yd": 3.0, "sweep_width_ft": 8}
    },
    "Schwarze_A9_Tornado": {
        "manufacturer": "Schwarze", "type": "Regenerative Air Sweeper", "class": "Street Sweeper",
        "dims": {"length": 6.2, "width": 2.5, "height": 3.2}, "wheelbase": 4.2,
        "colors": ["White", "Safety Yellow", "Blue"],
        "specialty": {"hopper_capacity_yd": 4.5, "sweep_width_ft": 11}
    },

    # ========================================================================
    # DOZERS (Heavy Equipment)
    # ========================================================================
    "Caterpillar_D6_Dozer": {
        "manufacturer": "Caterpillar", "type": "Medium Dozer", "class": "Heavy Equipment",
        "dims": {"length": 5.2, "width": 3.4, "height": 3.2}, "wheelbase": 3.2,
        "colors": ["CAT Yellow", "Black"],
        "specialty": {"blade_capacity_yd": 4.4, "operating_weight_lb": 41000}
    },
    "Caterpillar_D8_Dozer": {
        "manufacturer": "Caterpillar", "type": "Large Dozer", "class": "Heavy Equipment",
        "dims": {"length": 6.5, "width": 4.3, "height": 3.8}, "wheelbase": 3.8,
        "colors": ["CAT Yellow", "Black"],
        "specialty": {"blade_capacity_yd": 8.9, "operating_weight_lb": 80000}
    },
    "Komatsu_D65_Dozer": {
        "manufacturer": "Komatsu", "type": "Medium Dozer", "class": "Heavy Equipment",
        "dims": {"length": 5.5, "width": 3.5, "height": 3.3}, "wheelbase": 3.3,
        "colors": ["Komatsu Blue", "Yellow"],
        "specialty": {"blade_capacity_yd": 4.8, "operating_weight_lb": 45000}
    },

    # ========================================================================
    # BACKHOES (Heavy Equipment)
    # ========================================================================
    "Caterpillar_420_Backhoe": {
        "manufacturer": "Caterpillar", "type": "Backhoe Loader", "class": "Heavy Equipment",
        "dims": {"length": 7.0, "width": 2.4, "height": 3.7}, "wheelbase": 2.2,
        "colors": ["CAT Yellow", "Black"],
        "specialty": {"dig_depth_ft": 14.3, "bucket_capacity_yd": 1.0}
    },
    "Caterpillar_430_Backhoe": {
        "manufacturer": "Caterpillar", "type": "Backhoe Loader", "class": "Heavy Equipment",
        "dims": {"length": 7.2, "width": 2.4, "height": 3.8}, "wheelbase": 2.3,
        "colors": ["CAT Yellow", "Black"],
        "specialty": {"dig_depth_ft": 14.6, "bucket_capacity_yd": 1.2}
    },
    "JCB_3CX_Backhoe": {
        "manufacturer": "JCB", "type": "Backhoe Loader", "class": "Heavy Equipment",
        "dims": {"length": 7.1, "width": 2.4, "height": 3.8}, "wheelbase": 2.2,
        "colors": ["JCB Yellow", "Black"],
        "specialty": {"dig_depth_ft": 14.9, "bucket_capacity_yd": 1.1}
    },
    "John_Deere_310_Backhoe": {
        "manufacturer": "John Deere", "type": "Backhoe Loader", "class": "Heavy Equipment",
        "dims": {"length": 7.0, "width": 2.4, "height": 3.7}, "wheelbase": 2.2,
        "colors": ["John Deere Green", "Yellow"],
        "specialty": {"dig_depth_ft": 14.4, "bucket_capacity_yd": 1.0}
    },

    # ========================================================================
    # EXCAVATORS (Heavy Equipment)
    # ========================================================================
    "Caterpillar_320_Excavator": {
        "manufacturer": "Caterpillar", "type": "Medium Excavator", "class": "Heavy Equipment",
        "dims": {"length": 9.5, "width": 3.2, "height": 3.2}, "wheelbase": 2.9,
        "colors": ["CAT Yellow", "Black"],
        "specialty": {"dig_depth_ft": 21.2, "bucket_capacity_yd": 1.6}
    },
    "Caterpillar_336_Excavator": {
        "manufacturer": "Caterpillar", "type": "Large Excavator", "class": "Heavy Equipment",
        "dims": {"length": 10.5, "width": 3.5, "height": 3.4}, "wheelbase": 3.3,
        "colors": ["CAT Yellow", "Black"],
        "specialty": {"dig_depth_ft": 24.3, "bucket_capacity_yd": 2.4}
    },
    "Komatsu_PC210_Excavator": {
        "manufacturer": "Komatsu", "type": "Medium Excavator", "class": "Heavy Equipment",
        "dims": {"length": 9.8, "width": 3.2, "height": 3.2}, "wheelbase": 2.9,
        "colors": ["Komatsu Blue", "Yellow"],
        "specialty": {"dig_depth_ft": 21.9, "bucket_capacity_yd": 1.7}
    },
    "John_Deere_210G_Excavator": {
        "manufacturer": "John Deere", "type": "Medium Excavator", "class": "Heavy Equipment",
        "dims": {"length": 9.4, "width": 3.1, "height": 3.1}, "wheelbase": 2.9,
        "colors": ["John Deere Green", "Yellow"],
        "specialty": {"dig_depth_ft": 21.0, "bucket_capacity_yd": 1.5}
    },

    # ========================================================================
    # WHEEL LOADERS (Heavy Equipment)
    # ========================================================================
    "Caterpillar_950_Wheel_Loader": {
        "manufacturer": "Caterpillar", "type": "Wheel Loader", "class": "Heavy Equipment",
        "dims": {"length": 8.0, "width": 3.0, "height": 3.6}, "wheelbase": 3.2,
        "colors": ["CAT Yellow", "Black"],
        "specialty": {"bucket_capacity_yd": 3.3, "operating_weight_lb": 36000}
    },
    "Caterpillar_966_Wheel_Loader": {
        "manufacturer": "Caterpillar", "type": "Wheel Loader", "class": "Heavy Equipment",
        "dims": {"length": 8.5, "width": 3.2, "height": 3.8}, "wheelbase": 3.4,
        "colors": ["CAT Yellow", "Black"],
        "specialty": {"bucket_capacity_yd": 4.4, "operating_weight_lb": 52000}
    },
    "Komatsu_WA380_Wheel_Loader": {
        "manufacturer": "Komatsu", "type": "Wheel Loader", "class": "Heavy Equipment",
        "dims": {"length": 8.2, "width": 3.1, "height": 3.7}, "wheelbase": 3.3,
        "colors": ["Komatsu Blue", "Yellow"],
        "specialty": {"bucket_capacity_yd": 3.8, "operating_weight_lb": 42000}
    },

    # ========================================================================
    # DUMP TRUCKS (Heavy Equipment)
    # ========================================================================
    "Mack_Granite_Dump_Truck": {
        "manufacturer": "Mack", "type": "Dump Truck", "class": "Heavy Duty Truck",
        "dims": {"length": 8.5, "width": 2.5, "height": 3.5}, "wheelbase": 5.5,
        "colors": ["White", "Red", "Black"],
        "specialty": {"dump_capacity_yd": 16, "payload_lb": 35000}
    },
    "Peterbilt_567_Dump_Truck": {
        "manufacturer": "Peterbilt", "type": "Dump Truck", "class": "Heavy Duty Truck",
        "dims": {"length": 8.8, "width": 2.5, "height": 3.6}, "wheelbase": 5.7,
        "colors": ["White", "Red", "Black"],
        "specialty": {"dump_capacity_yd": 18, "payload_lb": 40000}
    },
    "Kenworth_T800_Dump_Truck": {
        "manufacturer": "Kenworth", "type": "Dump Truck", "class": "Heavy Duty Truck",
        "dims": {"length": 9.0, "width": 2.5, "height": 3.7}, "wheelbase": 6.0,
        "colors": ["White", "Red", "Black"],
        "specialty": {"dump_capacity_yd": 20, "payload_lb": 45000}
    },

    # ========================================================================
    # GARBAGE/REFUSE TRUCKS (Specialty Equipment)
    # ========================================================================
    "Mack_LR_Refuse_Truck": {
        "manufacturer": "Mack", "type": "Refuse Truck", "class": "Specialty Truck",
        "dims": {"length": 8.5, "width": 2.5, "height": 3.5}, "wheelbase": 5.2,
        "colors": ["White", "Green", "Safety Yellow"],
        "specialty": {"hopper_capacity_yd": 25, "compaction_ratio": "3:1"}
    },
    "Peterbilt_520_Refuse_Truck": {
        "manufacturer": "Peterbilt", "type": "Refuse Truck", "class": "Specialty Truck",
        "dims": {"length": 8.7, "width": 2.5, "height": 3.6}, "wheelbase": 5.4,
        "colors": ["White", "Green"],
        "specialty": {"hopper_capacity_yd": 28, "compaction_ratio": "3.5:1"}
    },
    "Autocar_ACX_Refuse_Truck": {
        "manufacturer": "Autocar", "type": "Refuse Truck", "class": "Specialty Truck",
        "dims": {"length": 8.3, "width": 2.5, "height": 3.4}, "wheelbase": 5.0,
        "colors": ["White", "Green", "Safety Yellow"],
        "specialty": {"hopper_capacity_yd": 26, "compaction_ratio": "3.2:1"}
    },
}

# Color palette
color_palette = {
    # Common colors across manufacturers
    "Oxford White": (0.95, 0.95, 0.95, 1.0),
    "Summit White": (0.98, 0.98, 0.98, 1.0),
    "Bright White": (1.0, 1.0, 1.0, 1.0),
    "Super White": (0.99, 0.99, 0.99, 1.0),
    "Pearl White": (0.97, 0.97, 0.97, 1.0),
    "Platinum White": (0.96, 0.96, 0.96, 1.0),
    "Arctic White": (0.98, 0.98, 0.98, 1.0),
    "Frozen White": (0.94, 0.94, 0.94, 1.0),
    "Star White": (1.0, 1.0, 1.0, 1.0),
    "Blizzard Pearl": (0.95, 0.95, 0.95, 1.0),
    "Aspen White": (0.93, 0.93, 0.93, 1.0),
    "Glacier White": (0.96, 0.96, 0.96, 1.0),
    "Limestone": (0.90, 0.88, 0.85, 1.0),

    "Agate Black": (0.039, 0.039, 0.039, 1.0),
    "Black": (0.02, 0.02, 0.02, 1.0),
    "Onyx Black": (0.03, 0.03, 0.03, 1.0),
    "Midnight Black": (0.05, 0.05, 0.05, 1.0),
    "Crystal Black": (0.04, 0.04, 0.04, 1.0),
    "Magnetic Black": (0.06, 0.06, 0.06, 1.0),
    "Mosaic Black": (0.04, 0.04, 0.04, 1.0),
    "Diamond Black": (0.02, 0.02, 0.02, 1.0),
    "Shadow Black": (0.03, 0.03, 0.03, 1.0),
    "Solid Black": (0.01, 0.01, 0.01, 1.0),
    "Black Sand": (0.08, 0.08, 0.08, 1.0),

    "Iconic Silver": (0.753, 0.753, 0.753, 1.0),
    "Silver Ice Metallic": (0.7, 0.72, 0.75, 1.0),
    "Satin Steel": (0.68, 0.70, 0.72, 1.0),
    "Celestial Silver": (0.75, 0.75, 0.75, 1.0),
    "Midnight Silver": (0.50, 0.52, 0.55, 1.0),
    "Pacific Pewter": (0.45, 0.47, 0.50, 1.0),

    "Carbonized Gray": (0.243, 0.243, 0.243, 1.0),
    "Stone Gray": (0.40, 0.40, 0.40, 1.0),
    "Steel Gray": (0.35, 0.35, 0.35, 1.0),
    "Cactus Gray": (0.38, 0.38, 0.35, 1.0),
    "Sonic Gray": (0.42, 0.42, 0.42, 1.0),
    "Boulder Gray": (0.36, 0.36, 0.36, 1.0),
    "Graphite Gray": (0.28, 0.28, 0.28, 1.0),

    "Antimatter Blue": (0.118, 0.227, 0.373, 1.0),
    "Atlas Blue": (0.180, 0.353, 0.533, 1.0),
    "Velocity Blue": (0.0, 0.3, 0.6, 1.0),
    "Alto Blue": (0.3, 0.5, 0.7, 1.0),
    "Stone Blue": (0.2, 0.4, 0.6, 1.0),
    "Eruption Green": (0.1, 0.4, 0.3, 1.0),
    "Blueprint": (0.1, 0.2, 0.5, 1.0),
    "Voodoo Blue": (0.0, 0.2, 0.4, 1.0),
    "Blue Crush": (0.1, 0.3, 0.6, 1.0),
    "Blazing Orange": (1.0, 0.4, 0.0, 1.0),
    "Nitro Yellow": (0.95, 0.85, 0.1, 1.0),
    "Blue Metallic": (0.1, 0.3, 0.7, 1.0),
    "Electric Blue": (0.0, 0.4, 0.9, 1.0),
    "Hydro Blue": (0.0, 0.5, 0.8, 1.0),
    "Deep Blue": (0.05, 0.15, 0.4, 1.0),
    "Rivian Blue": (0.1, 0.3, 0.5, 1.0),
    "Komatsu Blue": (0.0, 0.2, 0.5, 1.0),

    "Rapid Red": (0.769, 0.118, 0.227, 1.0),
    "Race Red": (0.8, 0.1, 0.1, 1.0),
    "Flame Red": (0.9, 0.1, 0.1, 1.0),
    "Scarlet Red": (0.85, 0.15, 0.15, 1.0),
    "Barcelona Red": (0.8, 0.1, 0.1, 1.0),
    "Ruby Red": (0.6, 0.1, 0.15, 1.0),
    "Radiant Red": (0.85, 0.2, 0.2, 1.0),
    "Cayenne Red": (0.7, 0.15, 0.15, 1.0),
    "Red Quartz": (0.75, 0.2, 0.2, 1.0),
    "Red Tintcoat": (0.7, 0.15, 0.15, 1.0),
    "Red Hot": (0.9, 0.1, 0.1, 1.0),
    "Jupiter Red": (0.8, 0.15, 0.15, 1.0),

    "Grabber Blue": (0.0, 0.4, 0.8, 1.0),
    "Army Green": (0.3, 0.35, 0.25, 1.0),
    "Launch Green": (0.2, 0.4, 0.3, 1.0),
    "Forest Green": (0.1, 0.3, 0.2, 1.0),
    "Green": (0.2, 0.5, 0.2, 1.0),
    "John Deere Green": (0.2, 0.5, 0.1, 1.0),

    "Safety Yellow": (1.0, 0.85, 0.0, 1.0),
    "Broom Yellow": (0.95, 0.85, 0.1, 1.0),
    "CAT Yellow": (0.95, 0.8, 0.1, 1.0),
    "Yellow": (1.0, 0.9, 0.0, 1.0),
    "JCB Yellow": (0.98, 0.85, 0.0, 1.0),

    "Orange": (1.0, 0.5, 0.0, 1.0),
    "Red": (0.9, 0.1, 0.1, 1.0),
    "White": (1.0, 1.0, 1.0, 1.0),
    "Stainless Steel": (0.75, 0.75, 0.75, 1.0),
}

def clear_scene():
    """Clear all objects"""
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete()

def create_vehicle_base(name, specs):
    """Create vehicle based on type"""
    clear_scene()

    dims = specs["dims"]
    length = dims["length"]
    width = dims["width"]
    height = dims["height"]
    wheelbase = specs.get("wheelbase", length * 0.6)

    vtype = specs["type"]

    # Determine vehicle shape based on type
    if "Pickup" in vtype or "Truck" in vtype:
        # Pickup truck shape
        cab_ratio = 0.4 if "Heavy" not in vtype else 0.35

        # Cab
        bpy.ops.mesh.primitive_cube_add(size=1, location=(length*cab_ratio/2, 0, height/2))
        cab = bpy.context.active_object
        cab.scale = (length*cab_ratio, width, height*0.9)

        # Bed or specialty equipment
        bed_length = length - (length*cab_ratio) - (length*0.15)
        bpy.ops.mesh.primitive_cube_add(size=1, location=(length*cab_ratio + bed_length/2, 0, height*0.4))
        bed = bpy.context.active_object
        bed.scale = (bed_length, width, height*0.6)

        # Hood
        bpy.ops.mesh.primitive_cube_add(size=1, location=(0, 0, height*0.35))
        hood = bpy.context.active_object
        hood.scale = (length*0.15, width, height*0.5)

    elif "Van" in vtype or "Sweeper" in vtype:
        # Van/Box shape
        cab_ratio = 0.25

        # Cab
        bpy.ops.mesh.primitive_cube_add(size=1, location=(length*cab_ratio/2, 0, height*0.45))
        cab = bpy.context.active_object
        cab.scale = (length*cab_ratio, width, height*0.7)

        # Cargo area
        cargo_length = length - (length*cab_ratio)
        bpy.ops.mesh.primitive_cube_add(size=1, location=(length*cab_ratio + cargo_length/2, 0, height/2))
        cargo = bpy.context.active_object
        cargo.scale = (cargo_length, width, height)

    elif "SUV" in vtype or "Sports" in vtype:
        # SUV/Car shape
        bpy.ops.mesh.primitive_cube_add(size=1, location=(length/2, 0, height/2))
        body = bpy.context.active_object
        body.scale = (length, width, height)

        # Hood
        bpy.ops.mesh.primitive_cube_add(size=1, location=(length*0.15, 0, height*0.35))
        hood = bpy.context.active_object
        hood.scale = (length*0.3, width, height*0.5)

    elif "Dozer" in vtype or "Loader" in vtype:
        # Heavy equipment with tracks/wheels
        bpy.ops.mesh.primitive_cube_add(size=1, location=(length/2, 0, height*0.6))
        body = bpy.context.active_object
        body.scale = (length*0.6, width, height*0.8)

        # Blade/bucket
        bpy.ops.mesh.primitive_cube_add(size=1, location=(0, 0, height*0.3))
        blade = bpy.context.active_object
        blade.scale = (width*1.2, width*1.1, height*0.4)

    elif "Backhoe" in vtype or "Excavator" in vtype:
        # Excavator shape
        bpy.ops.mesh.primitive_cube_add(size=1, location=(length*0.4, 0, height*0.5))
        body = bpy.context.active_object
        body.scale = (length*0.5, width*1.2, height)

        # Boom arm
        bpy.ops.mesh.primitive_cube_add(size=1, location=(length*0.7, 0, height*0.8))
        arm = bpy.context.active_object
        arm.scale = (length*0.6, width*0.3, height*0.2)
        arm.rotation_euler = (0, math.radians(-30), 0)

    else:
        # Default generic vehicle
        bpy.ops.mesh.primitive_cube_add(size=1, location=(length/2, 0, height/2))
        body = bpy.context.active_object
        body.scale = (length, width, height)

    # Add wheels/tracks
    wheel_radius = 0.35 if "Heavy" in specs["class"] else 0.3

    if "Dozer" not in vtype and "Excavator" not in vtype:
        # Regular wheels
        wheel_positions = [
            (wheelbase/2, width/2+0.1, wheel_radius),
            (wheelbase/2, -width/2-0.1, wheel_radius),
            (-wheelbase/2, width/2+0.1, wheel_radius),
            (-wheelbase/2, -width/2-0.1, wheel_radius),
        ]

        for i, pos in enumerate(wheel_positions):
            bpy.ops.mesh.primitive_cylinder_add(radius=wheel_radius, depth=0.25, location=pos, rotation=(0, math.pi/2, 0))
            wheel = bpy.context.active_object
            wheel.name = f"Wheel_{i}"

    # Join all parts
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.join()
    vehicle = bpy.context.active_object
    vehicle.name = name
    bpy.ops.object.shade_smooth()

    return vehicle

def apply_material(obj, color_name):
    """Apply colored material"""
    obj.data.materials.clear()
    mat = bpy.data.materials.new(name=f"{obj.name}_{color_name}")
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes["Principled BSDF"]

    rgba = color_palette.get(color_name, (0.5, 0.5, 0.5, 1.0))
    bsdf.inputs['Base Color'].default_value = rgba
    bsdf.inputs['Metallic'].default_value = 0.7
    bsdf.inputs['Roughness'].default_value = 0.3

    obj.data.materials.append(mat)

# GENERATE ALL VEHICLES
print(f"📊 Total Vehicles to Generate: {len(vehicles_database)}")
print(f"   Estimated Models: {sum(len(v['colors']) for v in vehicles_database.values())}")
print()

results = {}
total_count = 0
category_counts = {}

for vehicle_name, specs in vehicles_database.items():
    category = specs["class"]
    if category not in category_counts:
        category_counts[category] = 0

    print(f"🚗 {vehicle_name} ({specs['manufacturer']} - {specs['type']})")

    vehicle = create_vehicle_base(vehicle_name, specs)
    vehicle_results = {}

    for color_name in specs["colors"]:
        apply_material(vehicle, color_name)

        safe_color = color_name.replace(" ", "_")
        filename = f"{vehicle_name}_{safe_color}.glb"
        filepath = output_dir / filename

        bpy.ops.export_scene.gltf(filepath=str(filepath), export_format='GLB')

        vehicle_results[color_name] = str(filepath)
        total_count += 1
        category_counts[category] += 1

        print(f"   ✓ {safe_color}")

    results[vehicle_name] = {
        "manufacturer": specs["manufacturer"],
        "type": specs["type"],
        "class": specs["class"],
        "colors": vehicle_results,
        "dimensions": specs["dims"],
        "specialty": specs.get("specialty", {})
    }

# Save metadata
metadata = {
    "fleet_name": "Complete 2025 USA Production Fleet + Specialty Equipment",
    "generated_at": datetime.now().isoformat(),
    "total_vehicle_types": len(vehicles_database),
    "total_models": total_count,
    "category_breakdown": category_counts,
    "vehicles": results
}

metadata_path = output_dir / "complete_fleet_metadata.json"
with open(metadata_path, 'w') as f:
    json.dump(metadata, f, indent=2)

print(f"\n{'='*80}")
print("✅ COMPLETE USA FLEET GENERATION FINISHED")
print(f"{'='*80}")
print(f"\n📊 Final Statistics:")
print(f"   Vehicle Types: {len(vehicles_database)}")
print(f"   Total 3D Models: {total_count}")
print(f"   Output Directory: {output_dir.absolute()}")
print(f"\n📦 Models by Category:")
for category, count in sorted(category_counts.items()):
    print(f"   • {category}: {count} models")
print(f"\n💾 Metadata: {metadata_path}")
print(f"\n🎉 Complete 2025 USA vehicle fleet is ready!")
print()
