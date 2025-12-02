#!/usr/bin/env python3
"""
Check for Swift files in the App directory that are not in the Xcode project.
"""

import subprocess
from pathlib import Path

def get_all_swift_files():
    """Get all Swift files in the App directory"""
    result = subprocess.run(
        ['find', 'App', '-name', '*.swift', '-type', 'f'],
        capture_output=True,
        text=True,
        cwd='/Users/andrewmorton/Documents/GitHub/Fleet/mobile-apps/ios-native'
    )
    return set(line.strip() for line in result.stdout.strip().split('\n') if line.strip())

def get_project_swift_files():
    """Get all Swift files referenced in the Xcode project"""
    result = subprocess.run(
        ['grep', '-o', '[^ ]*\\.swift', 'App.xcodeproj/project.pbxproj'],
        capture_output=True,
        text=True,
        cwd='/Users/andrewmorton/Documents/GitHub/Fleet/mobile-apps/ios-native'
    )
    project_files = set()
    for line in result.stdout.strip().split('\n'):
        if line.strip() and line.endswith('.swift'):
            # Clean up the filename
            filename = line.strip().replace('/*', '').replace('*/', '').strip()
            project_files.add(filename)
    return project_files

def main():
    all_files = get_all_swift_files()
    project_files = get_project_swift_files()

    print(f"Total Swift files in App directory: {len(all_files)}")
    print(f"Swift files in Xcode project: {len(project_files)}")

    # Find files not in project
    missing_from_project = []
    for filepath in sorted(all_files):
        filename = Path(filepath).name
        # Check if the filename exists in project files
        if not any(filename in pf for pf in project_files):
            missing_from_project.append(filepath)

    if missing_from_project:
        print(f"\n⚠️  Found {len(missing_from_project)} Swift files NOT in Xcode project:")
        for f in missing_from_project:
            print(f"  - {f}")
    else:
        print("\n✓ All Swift files are included in the Xcode project!")

    return len(missing_from_project)

if __name__ == '__main__':
    exit(main())
