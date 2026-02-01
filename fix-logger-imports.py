#!/usr/bin/env python3
"""
Find and fix files that use logger but don't import it
"""
import os
import re
from pathlib import Path

def find_files_needing_logger_import(src_dir):
    """Find all .ts/.tsx files that use logger but don't import it"""
    files_to_fix = []

    for root, dirs, files in os.walk(src_dir):
        for file in files:
            if not (file.endswith('.ts') or file.endswith('.tsx')):
                continue

            filepath = os.path.join(root, file)

            try:
                with open(filepath, 'r', encoding='utf-8') as f:
                    content = f.read()

                # Check if file uses logger
                if re.search(r'\blogger\.', content):
                    # Check if it imports logger
                    if not re.search(r'^import.*logger', content, re.MULTILINE):
                        files_to_fix.append(filepath)
            except Exception as e:
                print(f"Error reading {filepath}: {e}")

    return files_to_fix

def add_logger_import(filepath):
    """Add logger import to a file"""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()

        # Find the last import statement
        import_pattern = r'^import\s+.*?;?\s*$'
        imports = list(re.finditer(import_pattern, content, re.MULTILINE))

        if not imports:
            print(f"No imports found in {filepath}, skipping")
            return False

        # Get the position after the last import
        last_import = imports[-1]
        insert_pos = last_import.end()

        # Add the logger import
        logger_import = "\nimport logger from '@/utils/logger';"

        new_content = content[:insert_pos] + logger_import + content[insert_pos:]

        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)

        return True
    except Exception as e:
        print(f"Error fixing {filepath}: {e}")
        return False

def main():
    src_dir = '/Users/andrewmorton/Documents/GitHub/Fleet-CTA/src'

    print("Finding files that need logger import...")
    files_to_fix = find_files_needing_logger_import(src_dir)

    print(f"\nFound {len(files_to_fix)} files needing logger import:")
    for filepath in files_to_fix[:20]:  # Show first 20
        print(f"  {filepath}")

    if len(files_to_fix) > 20:
        print(f"  ... and {len(files_to_fix) - 20} more")

    print(f"\nFixing {len(files_to_fix)} files...")
    fixed_count = 0
    for filepath in files_to_fix:
        if add_logger_import(filepath):
            fixed_count += 1

    print(f"\nFixed {fixed_count} files!")

if __name__ == '__main__':
    main()
