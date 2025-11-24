#!/usr/bin/env python3
"""
Script to add Swift files to Xcode project.pbxproj
"""

import uuid
import re

PROJECT_FILE = "/Users/andrewmorton/Documents/GitHub/Fleet/mobile-apps/ios-native/App.xcodeproj/project.pbxproj"

FILES_TO_ADD = [
    "App/ReceiptCaptureView.swift",
    "App/DamageReportView.swift",
    "App/VehicleReservationView.swift",
]

def generate_uuid():
    """Generate a 24-character UUID for Xcode"""
    return uuid.uuid4().hex[:24].upper()

def add_files_to_project():
    """Add Swift files to Xcode project"""

    with open(PROJECT_FILE, 'r') as f:
        content = f.read()

    # Generate UUIDs for each file
    file_refs = {}
    build_files = {}

    for file_path in FILES_TO_ADD:
        file_name = file_path.split('/')[-1]
        file_refs[file_name] = generate_uuid()
        build_files[file_name] = generate_uuid()
        print(f"Generated UUIDs for {file_name}:")
        print(f"  FileRef: {file_refs[file_name]}")
        print(f"  BuildFile: {build_files[file_name]}")

    # Find the PBXFileReference section
    pbx_file_ref_match = re.search(r'/\* Begin PBXFileReference section \*/', content)
    if not pbx_file_ref_match:
        print("ERROR: Could not find PBXFileReference section")
        return False

    # Find the PBXBuildFile section
    pbx_build_file_match = re.search(r'/\* Begin PBXBuildFile section \*/', content)
    if not pbx_build_file_match:
        print("ERROR: Could not find PBXBuildFile section")
        return False

    # Find the PBXSourcesBuildPhase section
    sources_build_phase_match = re.search(r'/\* Begin PBXSourcesBuildPhase section \*/.*?files = \((.*?)\);', content, re.DOTALL)
    if not sources_build_phase_match:
        print("ERROR: Could not find PBXSourcesBuildPhase section")
        return False

    # Build the new entries
    new_file_refs = ""
    new_build_files = ""
    new_sources = ""

    for file_path in FILES_TO_ADD:
        file_name = file_path.split('/')[-1]
        file_ref_uuid = file_refs[file_name]
        build_file_uuid = build_files[file_name]

        # PBXFileReference entry
        new_file_refs += f"\t\t{file_ref_uuid} /* {file_name} */ = {{isa = PBXFileReference; lastKnownFileType = sourcecode.swift; path = {file_name}; sourceTree = \"<group>\"; }};\n"

        # PBXBuildFile entry
        new_build_files += f"\t\t{build_file_uuid} /* {file_name} in Sources */ = {{isa = PBXBuildFile; fileRef = {file_ref_uuid} /* {file_name} */; }};\n"

        # PBXSourcesBuildPhase entry
        new_sources += f"\t\t\t\t{build_file_uuid} /* {file_name} in Sources */,\n"

    # Insert after the section markers
    pbx_file_ref_pos = pbx_file_ref_match.end()
    content = content[:pbx_file_ref_pos] + "\n" + new_file_refs + content[pbx_file_ref_pos:]

    pbx_build_file_pos = pbx_build_file_match.end()
    # Adjust position after previous insertion
    pbx_build_file_pos += len(new_file_refs) + 1
    content = content[:pbx_build_file_pos] + "\n" + new_build_files + content[pbx_build_file_pos:]

    # Insert into sources build phase
    sources_match = re.search(r'(/\* Begin PBXSourcesBuildPhase section \*/.*?files = \()', content, re.DOTALL)
    if sources_match:
        sources_pos = sources_match.end()
        sources_pos += len(new_build_files) + 1
        content = content[:sources_pos] + "\n" + new_sources + content[sources_pos:]

    # Write back
    with open(PROJECT_FILE + ".new", 'w') as f:
        f.write(content)

    print("\nNew project file written to: " + PROJECT_FILE + ".new")
    print("To apply changes:")
    print(f"  mv {PROJECT_FILE}.new {PROJECT_FILE}")

    return True

if __name__ == "__main__":
    print("Adding Swift files to Xcode project...\n")
    success = add_files_to_project()

    if success:
        print("\n✓ Files prepared for addition to Xcode project")
    else:
        print("\n✗ Failed to modify project file")
