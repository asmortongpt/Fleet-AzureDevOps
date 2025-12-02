#!/usr/bin/env python3
"""
Fix ViewModel file paths in Xcode project.pbxproj file.
The problem: Some files have "App/ViewModels/" in their path
which causes Xcode to look in the wrong location.
"""

import re

project_file = '/Users/andrewmorton/Documents/GitHub/Fleet/mobile-apps/ios-native/App.xcodeproj/project.pbxproj'

# Read the file
with open(project_file, 'r') as f:
    content = f.read()

# Find the problematic pattern and fix it
# Looking for: path = App/ViewModels/FILE.swift; sourceTree = "<group>";
# Should be: path = ViewModels/FILE.swift; sourceTree = "<group>";

pattern = r'(path = )App/ViewModels/([^;]+)(; sourceTree = "<group>";)'
replacement = r'\1ViewModels/\2\3'

fixed_content = re.sub(pattern, replacement, content)

# Count changes
original_matches = re.findall(pattern, content)
print(f"Found {len(original_matches)} file references to fix")
for match in original_matches:
    print(f"  - {match[1]}")

# Write back
with open(project_file, 'w') as f:
    f.write(fixed_content)

print("\nFixed paths in project.pbxproj!")
