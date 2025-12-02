#!/usr/bin/env python3
"""
Remove duplicate struct definitions from Swift files
"""
import re
import sys

def remove_struct_definition(file_path, struct_name):
    """Remove a struct definition from a Swift file"""
    try:
        with open(file_path, 'r') as f:
            content = f.read()

        # Pattern to match struct definition including any doc comments
        # This matches from struct keyword to the closing brace
        pattern = rf'(?://.*?\n)*struct {struct_name}:.*?\{{(?:[^{{}}]|\{{[^{{}}]*\}})*\}}\n*'

        # Count how many matches we find
        matches = re.findall(pattern, content, re.DOTALL)
        if matches:
            print(f"Found {len(matches)} definition(s) of {struct_name} in {file_path}")
            # Remove the struct definition
            new_content = re.sub(pattern, '', content, flags=re.DOTALL)

            with open(file_path, 'w') as f:
                f.write(new_content)
            print(f"  Removed {struct_name} from {file_path}")
            return True
        else:
            print(f"No {struct_name} found in {file_path}")
            return False

    except Exception as e:
        print(f"Error processing {file_path}: {e}")
        return False

def main():
    # Files to clean and structs to remove
    duplicates = [
        # QuickActionButton duplicates (keep the one in SharedComponents.swift)
        ('App/Views/Asset/AssetDetailView.swift', 'QuickActionButton'),
        ('App/Views/Driver/DriverDetailView.swift', 'QuickActionButton'),
        ('App/Views/Shift/ShiftManagementView.swift', 'QuickActionButton'),
        ('App/Views/VehicleDetailView.swift', 'QuickActionButton'),
        ('App/Views/Map/LayerPickerView.swift', 'QuickActionButton'),
        ('App/Views/Geofence/GeofenceDetailView.swift', 'QuickActionButton'),

        # StatusBadge duplicates (keep one in SharedComponents.swift)
        ('App/FleetMapView.swift', 'StatusBadge'),
        ('App/AddTripView.swift', 'StatusBadge'),
        ('App/VehicleDetailsView.swift', 'StatusBadge'),
        ('App/Views/Training/TrainingManagementView.swift', 'StatusBadge'),
        ('App/Views/Assignment/VehicleAssignmentView.swift', 'StatusBadge'),
        ('App/Views/Compliance/ComplianceScoreCardView.swift', 'StatusBadge'),
        ('App/Views/Reports/ChecklistReportsView.swift', 'StatusBadge'),
        ('App/Views/Budget/BudgetPlanningView.swift', 'StatusBadge'),

        # InfoRow duplicates
        ('App/VehicleIdentificationView.swift', 'InfoRow'),
        ('App/Views/Asset/AssetDetailView.swift', 'InfoRow'),
        ('App/Views/Driver/DriverDetailView.swift', 'InfoRow'),
        ('App/Views/Training/CourseDetailView.swift', 'InfoRow'),
        ('App/Views/Shift/ShiftManagementView.swift', 'InfoRow'),
        ('App/Views/VehicleDetailView.swift', 'InfoRow'),
        ('App/Views/Assignment/AssignmentApprovalView.swift', 'InfoRow'),
        ('App/Views/Map/TrafficLegendView.swift', 'InfoRow'),
        ('App/Views/Geofence/GeofenceDetailView.swift', 'InfoRow'),
        ('App/Views/Procurement/VendorDetailView.swift', 'InfoRow'),
        ('App/Views/Communication/NotificationManagementView.swift', 'InfoRow'),
        ('App/Views/Warranty/WarrantyDetailView.swift', 'InfoRow'),

        # QuickActionsView duplicates
        ('App/Views/Driver/DriverDetailView.swift', 'QuickActionsView'),
        ('App/Views/Geofence/GeofenceDetailView.swift', 'QuickActionsView'),
    ]

    removed_count = 0
    for file_path, struct_name in duplicates:
        if remove_struct_definition(file_path, struct_name):
            removed_count += 1

    print(f"\nTotal: Removed {removed_count} duplicate definitions")

if __name__ == '__main__':
    main()
