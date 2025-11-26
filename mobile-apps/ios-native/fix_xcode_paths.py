#!/usr/bin/env python3
"""
Xcode Project Path Fixer
Repairs malformed file paths in App.xcodeproj/project.pbxproj

This script:
1. Identifies files with incorrect paths (e.g., App/App/Views/... or App/Driver/App/...)
2. Finds the actual file locations
3. Updates the project.pbxproj file with correct paths
4. Creates a backup before making changes
"""

import os
import re
import shutil
from pathlib import Path
from datetime import datetime

# Configuration
PROJECT_ROOT = Path(__file__).parent
PROJECT_FILE = PROJECT_ROOT / "App.xcodeproj" / "project.pbxproj"
APP_DIR = PROJECT_ROOT / "App"

def find_file_in_app_dir(filename):
    """Search for a file in the App directory and return its relative path"""
    for root, dirs, files in os.walk(APP_DIR):
        if filename in files:
            relative_path = Path(root).relative_to(APP_DIR) / filename
            # Return path relative to App directory
            return str(relative_path)
    return None

def backup_project_file():
    """Create a timestamped backup of the project file"""
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    backup_path = PROJECT_FILE.parent / f"project.pbxproj.backup_{timestamp}"
    shutil.copy2(PROJECT_FILE, backup_path)
    print(f"✅ Backup created: {backup_path.name}")
    return backup_path

def fix_malformed_paths(content):
    """Fix paths with duplicate App/ prefixes or malformed directory structures"""
    fixes = []

    # Pattern 1: App/App/... → App/...
    pattern1 = r'path = App/App/([^;]+);'
    matches1 = re.findall(pattern1, content)
    for match in matches1:
        old_path = f"App/App/{match}"
        new_path = f"App/{match}"
        content = content.replace(f'path = {old_path};', f'path = {new_path};')
        fixes.append(f"  {old_path} → {new_path}")

    # Pattern 2: App/Driver/App/... → App/...
    pattern2 = r'path = App/Driver/App/([^;]+);'
    matches2 = re.findall(pattern2, content)
    for match in matches2:
        old_path = f"App/Driver/App/{match}"
        new_path = f"App/{match}"
        content = content.replace(f'path = {old_path};', f'path = {new_path};')
        fixes.append(f"  {old_path} → {new_path}")

    # Pattern 3: Other malformed paths
    pattern3 = r'path = App/([A-Z][a-z]+)/App/([^;]+);'
    matches3 = re.findall(pattern3, content)
    for folder, rest in matches3:
        old_path = f"App/{folder}/App/{rest}"
        new_path = f"App/{rest}"
        content = content.replace(f'path = {old_path};', f'path = {new_path};')
        fixes.append(f"  {old_path} → {new_path}")

    return content, fixes

def find_and_fix_missing_files(content):
    """Find files that don't exist at their specified paths and fix them"""
    fixes = []

    # Find all file references with paths
    file_pattern = r'name = ([^;]+\.swift); path = ([^;]+);'
    matches = re.findall(file_pattern, content)

    for filename, current_path in matches:
        # Check if file exists at current path
        full_path = PROJECT_ROOT / current_path

        if not full_path.exists():
            # Try to find the file
            correct_path = find_file_in_app_dir(filename)

            if correct_path:
                # Fix the path in content
                old_line = f'name = {filename}; path = {current_path};'
                new_line = f'name = {filename}; path = App/{correct_path};'

                if old_line in content:
                    content = content.replace(old_line, new_line)
                    fixes.append(f"  {filename}: {current_path} → App/{correct_path}")

    return content, fixes

def main():
    print("🔧 Xcode Project Path Fixer")
    print("=" * 60)

    # Check if project file exists
    if not PROJECT_FILE.exists():
        print(f"❌ Error: {PROJECT_FILE} not found")
        return 1

    # Create backup
    backup_path = backup_project_file()

    # Read project file
    print("📖 Reading project file...")
    with open(PROJECT_FILE, 'r') as f:
        content = f.read()

    original_content = content

    # Fix malformed paths
    print("\n🔍 Fixing malformed paths...")
    content, malformed_fixes = fix_malformed_paths(content)

    if malformed_fixes:
        print(f"✅ Fixed {len(malformed_fixes)} malformed paths:")
        for fix in malformed_fixes[:10]:  # Show first 10
            print(fix)
        if len(malformed_fixes) > 10:
            print(f"  ... and {len(malformed_fixes) - 10} more")
    else:
        print("  No malformed paths found")

    # Fix missing files
    print("\n🔍 Searching for missing files...")
    content, missing_fixes = find_and_fix_missing_files(content)

    if missing_fixes:
        print(f"✅ Fixed {len(missing_fixes)} missing file paths:")
        for fix in missing_fixes[:10]:  # Show first 10
            print(fix)
        if len(missing_fixes) > 10:
            print(f"  ... and {len(missing_fixes) - 10} more")
    else:
        print("  No missing files found")

    # Check if any changes were made
    if content == original_content:
        print("\n✨ No changes needed - project file is clean!")
        return 0

    # Write updated content
    print("\n💾 Writing updated project file...")
    with open(PROJECT_FILE, 'w') as f:
        f.write(content)

    print(f"✅ Project file updated successfully")
    print(f"📋 Total fixes: {len(malformed_fixes) + len(missing_fixes)}")
    print(f"💾 Backup saved at: {backup_path.name}")
    print("\n🎯 Next steps:")
    print("  1. Run: xcodebuild -workspace App.xcworkspace -scheme App -sdk iphonesimulator build")
    print("  2. If build still fails, open project in Xcode GUI to resolve remaining issues")

    return 0

if __name__ == "__main__":
    exit(main())
