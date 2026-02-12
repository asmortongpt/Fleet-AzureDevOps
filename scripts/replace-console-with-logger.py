#!/usr/bin/env python3
"""
Script to replace all console.log/error/warn/info/debug calls with logger utility
This is a critical security fix to prevent data exposure in production.
"""

import os
import re
from pathlib import Path

# Root directory to scan
ROOT_DIR = Path("/Users/andrewmorton/Documents/GitHub/Fleet-CTA/src")

# Files to process
EXTENSIONS = [".ts", ".tsx"]

# Replacement mappings
REPLACEMENTS = {
    r"console\.log\(": "logger.info(",
    r"console\.error\(": "logger.error(",
    r"console\.warn\(": "logger.warn(",
    r"console\.info\(": "logger.info(",
    r"console\.debug\(": "logger.debug(",
}

# Import statement to add
LOGGER_IMPORT = "import logger from '@/utils/logger';"

# Statistics
stats = {
    "files_processed": 0,
    "files_modified": 0,
    "replacements_made": 0,
    "imports_added": 0,
}

def has_logger_import(content: str) -> bool:
    """Check if file already imports logger"""
    patterns = [
        r"import\s+logger\s+from\s+['\"]@/utils/logger['\"]",
        r"import\s+\{\s*logger\s*\}\s+from\s+['\"]@/utils/logger['\"]",
        r"from\s+['\"]@/utils/logger['\"]\s+import\s+logger",
    ]
    return any(re.search(pattern, content) for pattern in patterns)

def add_logger_import(content: str) -> tuple[str, bool]:
    """Add logger import to file if not present"""
    if has_logger_import(content):
        return content, False

    # Find first import statement to insert after
    import_pattern = r"^import\s+.+?;?\s*$"
    lines = content.split("\n")

    insert_index = 0
    for i, line in enumerate(lines):
        if re.match(import_pattern, line.strip()):
            insert_index = i + 1

    # If no imports found, add at top after any comments
    if insert_index == 0:
        for i, line in enumerate(lines):
            if line.strip() and not line.strip().startswith("//") and not line.strip().startswith("/*"):
                insert_index = i
                break

    lines.insert(insert_index, LOGGER_IMPORT)
    return "\n".join(lines), True

def replace_console_calls(content: str) -> tuple[str, int]:
    """Replace all console calls with logger calls"""
    replacements = 0
    modified = content

    for pattern, replacement in REPLACEMENTS.items():
        count = len(re.findall(pattern, modified))
        modified = re.sub(pattern, replacement, modified)
        replacements += count

    return modified, replacements

def process_file(file_path: Path) -> None:
    """Process a single file"""
    global stats

    try:
        with open(file_path, "r", encoding="utf-8") as f:
            content = f.read()

        stats["files_processed"] += 1

        # Check if file has console calls
        has_console = any(re.search(pattern, content) for pattern in REPLACEMENTS.keys())

        if not has_console:
            return

        # Replace console calls
        modified_content, replacements = replace_console_calls(content)

        if replacements == 0:
            return

        # Add logger import if needed
        final_content, import_added = add_logger_import(modified_content)

        # Write back to file
        with open(file_path, "w", encoding="utf-8") as f:
            f.write(final_content)

        stats["files_modified"] += 1
        stats["replacements_made"] += replacements
        if import_added:
            stats["imports_added"] += 1

        print(f"✓ {file_path.relative_to(ROOT_DIR)}: {replacements} replacements")

    except Exception as e:
        print(f"✗ Error processing {file_path}: {e}")

def main():
    """Main function"""
    print("=" * 80)
    print("CONSOLE.LOG REPLACEMENT SCRIPT")
    print("=" * 80)
    print(f"Scanning: {ROOT_DIR}")
    print(f"Extensions: {', '.join(EXTENSIONS)}")
    print()

    # Find all TypeScript/TSX files
    files = []
    for ext in EXTENSIONS:
        files.extend(ROOT_DIR.rglob(f"*{ext}"))

    print(f"Found {len(files)} files to process")
    print()

    # Process each file
    for file_path in sorted(files):
        process_file(file_path)

    # Print statistics
    print()
    print("=" * 80)
    print("SUMMARY")
    print("=" * 80)
    print(f"Files processed:   {stats['files_processed']}")
    print(f"Files modified:    {stats['files_modified']}")
    print(f"Replacements made: {stats['replacements_made']}")
    print(f"Imports added:     {stats['imports_added']}")
    print()
    print("✓ All console statements replaced with logger utility")
    print()

if __name__ == "__main__":
    main()
