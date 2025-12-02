#!/usr/bin/env python3
import re

# Read the pbxproj file
with open('App.xcodeproj/project.pbxproj', 'r') as f:
    content = f.read()

# Replace all occurrences of "App/App/" with just "App/"
original_content = content
content = content.replace('App/App/', 'App/')

# Count how many replacements were made
replacements = original_content.count('App/App/') - content.count('App/App/')

# Write back
with open('App.xcodeproj/project.pbxproj', 'w') as f:
    f.write(content)

print(f"Fixed {replacements} path references in project.pbxproj")
print("Changed all 'App/App/' references to 'App/'")
