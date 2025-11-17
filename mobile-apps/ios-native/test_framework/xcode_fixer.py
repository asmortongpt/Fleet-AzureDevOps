#!/usr/bin/env python3
"""
Xcode Project Fixer - Fix file path references in Xcode project
"""
import os
import re


def fix_xcodeproj_file_paths(xcodeproj_path: str, fixes: dict) -> None:
    """
    Fix file path references in Xcode project.pbxproj file

    Args:
        xcodeproj_path: Path to .xcodeproj directory
        fixes: Dict mapping incorrect paths to correct paths
    """
    pbxproj_path = os.path.join(xcodeproj_path, 'project.pbxproj')

    if not os.path.exists(pbxproj_path):
        raise FileNotFoundError(f"project.pbxproj not found at {pbxproj_path}")

    # Read the project file
    with open(pbxproj_path, 'r') as f:
        content = f.read()

    # Apply fixes
    modified = False
    for incorrect, correct in fixes.items():
        if incorrect in content:
            print(f"  Fixing: {incorrect} → {correct}")
            content = content.replace(incorrect, correct)
            modified = True

    if modified:
        # Backup original
        backup_path = pbxproj_path + '.backup'
        with open(backup_path, 'w') as f:
            f.write(content)
        print(f"  ✓ Backup saved to: {backup_path}")

        # Write fixed version
        with open(pbxproj_path, 'w') as f:
            f.write(content)
        print(f"  ✓ Fixed project file")
    else:
        print(f"  ✓ No changes needed")


def main():
    workdir = "/Users/andrewmorton/Documents/GitHub/Fleet/mobile-apps/ios-native"
    xcodeproj = os.path.join(workdir, "App.xcodeproj")

    print("=" * 60)
    print("XCODE PROJECT FIXER")
    print("=" * 60)
    print(f"Project: {xcodeproj}")
    print("")

    # Define path fixes
    # The Xcode project has paths like "App/CrashReporter.swift" but references them as "App/App/CrashReporter.swift"
    fixes = {
        "App/App/ViewModels/VehicleViewModel.swift": "App/ViewModels/VehicleViewModel.swift",
        "App/App/TripModels.swift": "App/TripModels.swift",
        "App/App/NetworkMonitor.swift": "App/NetworkMonitor.swift",
        "App/App/SyncService.swift": "App/SyncService.swift",
        "App/App/AuthenticationService.swift": "App/AuthenticationService.swift",
        "App/App/CrashReporter.swift": "App/CrashReporter.swift",
    }

    print("Applying fixes...")
    fix_xcodeproj_file_paths(xcodeproj, fixes)

    print("")
    print("=" * 60)
    print("✅ XCODE PROJECT FIXED")
    print("=" * 60)
    print("")
    print("Next steps:")
    print("1. Reopen App.xcworkspace in Xcode")
    print("2. Build with ⌘+B")
    print("3. Run with ⌘+R")


if __name__ == "__main__":
    main()
