#!/usr/bin/env python3
"""
Remove duplicate FlowLayout definitions
"""
import re

def remove_flowlayout(file_path):
    """Remove FlowLayout struct from file"""
    try:
        with open(file_path, 'r') as f:
            content = f.read()

        # Pattern to match FlowLayout and its nested FlowResult
        pattern = r'// Simple FlowLayout.*?\nstruct FlowLayout: Layout \{.*?^\}$\n+'

        # Try to find and remove
        new_content = re.sub(pattern, '', content, flags=re.MULTILINE | re.DOTALL)

        if new_content != content:
            with open(file_path, 'w') as f:
                f.write(new_content)
            print(f"Removed FlowLayout from {file_path}")
            return True
        else:
            print(f"No FlowLayout pattern found in {file_path}")
            return False
    except Exception as e:
        print(f"Error processing {file_path}: {e}")
        return False

files = [
    'App/DocumentManagementView.swift',
    'App/Views/RoleSwitcherView.swift',
    'App/Views/VehicleDetailView.swift',
    'App/Views/Reports/CustomReportBuilderView.swift',
]

for file in files:
    remove_flowlayout(file)
