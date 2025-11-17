#!/usr/bin/env python3
"""
Xcode Project Fixer V2 - Fix file path references in Xcode project
"""
import os
import re


def fix_xcodeproj_paths(xcodeproj_path: str) -> None:
    """
    Fix file path references where sourceTree="<group>" but path includes "App/"
    """
    pbxproj_path = os.path.join(xcodeproj_path, 'project.pbxproj')

    if not os.path.exists(pbxproj_path):
        raise FileNotFoundError(f"project.pbxproj not found at {pbxproj_path}")

    # Read the project file
    with open(pbxproj_path, 'r') as f:
        content = f.read()

    # Backup original
    backup_path = pbxproj_path + '.backup'
    with open(backup_path, 'w') as f:
        f.write(content)
    print(f"  ✓ Backup saved to: {backup_path}")

    # Fix patterns like: name = CrashReporter.swift; path = App/CrashReporter.swift; sourceTree = "<group>";
    # Should be:         name = CrashReporter.swift; path = CrashReporter.swift; sourceTree = "<group>";

    fixes = {
        'name = CrashReporter.swift; path = App/CrashReporter.swift; sourceTree = "<group>";':
            'name = CrashReporter.swift; path = CrashReporter.swift; sourceTree = "<group>";',

        'name = AuthenticationService.swift; path = App/AuthenticationService.swift; sourceTree = "<group>";':
            'name = AuthenticationService.swift; path = AuthenticationService.swift; sourceTree = "<group>";',

        'name = SyncService.swift; path = App/SyncService.swift; sourceTree = "<group>";':
            'name = SyncService.swift; path = SyncService.swift; sourceTree = "<group>";',

        'name = NetworkMonitor.swift; path = App/NetworkMonitor.swift; sourceTree = "<group>";':
            'name = NetworkMonitor.swift; path = NetworkMonitor.swift; sourceTree = "<group>";',

        'name = TripModels.swift; path = App/TripModels.swift; sourceTree = "<group>";':
            'name = TripModels.swift; path = TripModels.swift; sourceTree = "<group>";',

        'name = VehicleViewModel.swift; path = App/ViewModels/VehicleViewModel.swift; sourceTree = "<group>";':
            'name = VehicleViewModel.swift; path = ViewModels/VehicleViewModel.swift; sourceTree = "<group>";',
    }

    modified = False
    for old, new in fixes.items():
        if old in content:
            print(f"  Fixing: {old.split('path = ')[1].split(';')[0]}")
            content = content.replace(old, new)
            modified = True
        else:
            # Try to find partial matches
            file_name = old.split(' = ')[1].split(';')[0]
            if file_name in content:
                print(f"  Found {file_name} but pattern doesn't match exactly")

    if not modified:
        print("  ! No exact matches found. Trying regex pattern...")

        # More flexible pattern: find any "path = App/FILENAME" and replace with "path = FILENAME"
        pattern = r'(name = [^;]+; path = )App/([^;]+; sourceTree = "<group>";)'
        replacement = r'\1\2'

        new_content, count = re.subn(pattern, replacement, content)
        if count > 0:
            print(f"  ✓ Fixed {count} path references using regex")
            content = new_content
            modified = True

    if modified:
        # Write fixed version
        with open(pbxproj_path, 'w') as f:
            f.write(content)
        print(f"  ✓ Fixed project file")
        return True
    else:
        print(f"  ! No changes made")
        return False


def main():
    workdir = "/Users/andrewmorton/Documents/GitHub/Fleet/mobile-apps/ios-native"
    xcodeproj = os.path.join(workdir, "App.xcodeproj")

    print("=" * 60)
    print("XCODE PROJECT FIXER V2")
    print("=" * 60)
    print(f"Project: {xcodeproj}")
    print("")

    print("Applying fixes...")
    fixed = fix_xcodeproj_paths(xcodeproj)

    print("")
    if fixed:
        print("=" * 60)
        print("✅ XCODE PROJECT FIXED")
        print("=" * 60)
        print("")
        print("Next steps:")
        print("1. Close Xcode if open (killall Xcode)")
        print("2. Reopen App.xcworkspace")
        print("3. Clean build folder (⇧⌘K)")
        print("4. Build (⌘+B)")
    else:
        print("=" * 60)
        print("⚠️  NO CHANGES MADE")
        print("=" * 60)
        print("")
        print("The project file may already be correct, or the pattern doesn't match.")
        print("Check the build error details.")


if __name__ == "__main__":
    main()
