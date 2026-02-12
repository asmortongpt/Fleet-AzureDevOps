#!/usr/bin/env python3
"""Remove duplicate consecutive import logger lines"""
import sys

files = [
    'src/components/vehicle/HardwareConfigurationPanel.tsx',
    'src/hooks/use-reactive-safety-compliance-data.ts',
    'src/hooks/use-reactive-safety-data.ts',
    'src/lib/3d/model-loader.ts',
    'src/pages/VehicleShowroom3D.tsx',
    'src/services/AIDamageDetectionService.ts',
    'src/utils/lod-system.tsx',
]

for filepath in files:
    try:
        with open(filepath, 'r') as f:
            lines = f.readlines()

        # Remove consecutive duplicates of logger import
        new_lines = []
        prev_line = None
        for line in lines:
            # Skip if this line and previous line are both logger imports
            if line.startswith("import logger from") and prev_line and prev_line.startswith("import logger from"):
                print(f"Removing duplicate in {filepath}: {line.strip()}")
                continue
            new_lines.append(line)
            prev_line = line

        with open(filepath, 'w') as f:
            f.writelines(new_lines)

        print(f"✓ Fixed {filepath}")
    except Exception as e:
        print(f"✗ Error in {filepath}: {e}")
