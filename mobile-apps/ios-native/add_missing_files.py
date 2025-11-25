#!/usr/bin/env python3
"""
Add missing Swift files to Xcode project.pbxproj
"""

import uuid
import re
from pathlib import Path

# Files that need to be added
MISSING_FILES = [
    'App/RoleManager.swift',
    'App/DamageReportView.swift',
    'App/VehicleRequestView.swift',
    'App/MapNavigationView.swift',
    'App/VehicleIdentificationView.swift',
]

def generate_uuid():
    """Generate a UUID in Xcode format (24 hex chars)"""
    return uuid.uuid4().hex[:24].upper()

def read_project_file(path):
    """Read the project.pbxproj file"""
    with open(path, 'r') as f:
        return f.read()

def write_project_file(path, content):
    """Write the project.pbxproj file"""
    with open(path, 'w') as f:
        f.write(content)

def add_file_references(content, files):
    """Add PBXFileReference entries for missing files"""
    # Find the PBXFileReference section
    file_ref_pattern = r'(/\* Begin PBXFileReference section \*/\n)'

    file_refs = []
    file_ref_ids = {}

    for file_path in files:
        file_name = Path(file_path).name
        ref_id = generate_uuid()
        file_ref_ids[file_path] = ref_id

        # Determine the path structure
        if '/' in file_path:
            path_part = file_path
            name_part = file_name
        else:
            path_part = file_name
            name_part = file_name

        file_ref = f'\t\t{ref_id} /* {file_name} */ = {{isa = PBXFileReference; includeInIndex = 1; lastKnownFileType = sourcecode.swift; path = {path_part}; sourceTree = "<group>"; }};\n'
        file_refs.append(file_ref)

    # Insert file references
    insertion = ''.join(file_refs)
    content = re.sub(file_ref_pattern, r'\1' + insertion, content)

    return content, file_ref_ids

def add_build_file_references(content, file_ref_ids):
    """Add PBXBuildFile entries for the files"""
    # Find the PBXBuildFile section
    build_file_pattern = r'(/\* Begin PBXBuildFile section \*/\n)'

    build_files = []
    build_file_ids = {}

    for file_path, ref_id in file_ref_ids.items():
        file_name = Path(file_path).name
        build_id = generate_uuid()
        build_file_ids[file_path] = build_id

        build_file = f'\t\t{build_id} /* {file_name} in Sources */ = {{isa = PBXBuildFile; fileRef = {ref_id} /* {file_name} */; }};\n'
        build_files.append(build_file)

    # Insert build file references
    insertion = ''.join(build_files)
    content = re.sub(build_file_pattern, r'\1' + insertion, content)

    return content, build_file_ids

def add_to_sources_build_phase(content, build_file_ids):
    """Add files to the PBXSourcesBuildPhase"""
    # Find the Sources build phase and add entries before the closing );
    sources_pattern = r'(504EC3001FED79650016851F /\* Sources \*/ = \{[\s\S]*?files = \([\s\S]*?)(\t\t\t\);\n\t\t\trunOnlyForDeploymentPostprocessing = 0;)'

    source_entries = []
    for file_path, build_id in build_file_ids.items():
        file_name = Path(file_path).name
        source_entry = f'\t\t\t\t{build_id} /* {file_name} in Sources */,\n'
        source_entries.append(source_entry)

    # Insert source entries
    insertion = ''.join(source_entries)
    content = re.sub(sources_pattern, r'\1' + insertion + r'\2', content)

    return content

def main():
    project_path = Path('/Users/andrewmorton/Documents/GitHub/Fleet/mobile-apps/ios-native/App.xcodeproj/project.pbxproj')

    print(f"Reading project file: {project_path}")
    content = read_project_file(project_path)

    print(f"\nAdding {len(MISSING_FILES)} missing files:")
    for f in MISSING_FILES:
        print(f"  - {f}")

    # Add file references
    print("\n1. Adding PBXFileReference entries...")
    content, file_ref_ids = add_file_references(content, MISSING_FILES)

    # Add build file references
    print("2. Adding PBXBuildFile entries...")
    content, build_file_ids = add_build_file_references(content, file_ref_ids)

    # Add to sources build phase
    print("3. Adding to PBXSourcesBuildPhase...")
    content = add_to_sources_build_phase(content, build_file_ids)

    # Write the modified content
    print(f"\n4. Writing modified project file...")
    write_project_file(project_path, content)

    print("\n✓ Successfully added files to Xcode project!")
    print("\nGenerated IDs:")
    for file_path in MISSING_FILES:
        print(f"  {Path(file_path).name}:")
        print(f"    FileRef: {file_ref_ids[file_path]}")
        print(f"    BuildFile: {build_file_ids[file_path]}")

if __name__ == '__main__':
    main()
