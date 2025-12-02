#!/usr/bin/env python3
"""
Replace console.log/error/warn/debug with structured logger in frontend
"""
import re
from pathlib import Path

def has_logger_import(content: str) -> bool:
    """Check if logger is already imported"""
    return bool(re.search(r"import.*logger.*from.*['\"].*@/utils/logger['\"]", content) or
                re.search(r"import.*logger.*from.*['\"].*\./utils/logger['\"]", content) or
                re.search(r"import.*logger.*from.*['\"].*\.\./utils/logger['\"]", content))

def add_logger_import(content: str, file_path: str) -> str:
    """Add logger import if not present"""
    if has_logger_import(content):
        return content

    # Use @ alias for clean imports
    import_line = "import logger from '@/utils/logger'"

    # Find last import statement
    import_pattern = r"^import .+$"
    matches = list(re.finditer(import_pattern, content, re.MULTILINE))

    if matches:
        last_import = matches[-1]
        insert_pos = last_import.end()
        return content[:insert_pos] + '\n' + import_line + content[insert_pos:]
    else:
        # Add at beginning after any comments
        lines = content.split('\n')
        insert_idx = 0
        for i, line in enumerate(lines):
            stripped = line.strip()
            if stripped and not stripped.startswith('//') and not stripped.startswith('/*') and not stripped.startswith('*'):
                insert_idx = i
                break
        lines.insert(insert_idx, import_line)
        return '\n'.join(lines)

def replace_console_statements(content: str) -> tuple[str, int]:
    """Replace all console.* statements with logger.*"""
    replacements = 0

    # Patterns to replace
    patterns = [
        # console.error
        (r"console\.error\((['\"])([^'\"]+)\1,\s*(.+?)\)", r"logger.error(\1\2\1, { \3 })"),
        (r"console\.error\((['\"])([^'\"]+)\1\)", r"logger.error(\1\2\1)"),
        (r"console\.error\(`([^`]+)`\)", r"logger.error(`\1`)"),
        (r"console\.error\(([^)]+)\)", r"logger.error('Error', { error: \1 })"),

        # console.log
        (r"console\.log\((['\"])([^'\"]+)\1,\s*(.+?)\)", r"logger.info(\1\2\1, { \3 })"),
        (r"console\.log\((['\"])([^'\"]+)\1\)", r"logger.info(\1\2\1)"),
        (r"console\.log\(`([^`]+)`\)", r"logger.info(`\1`)"),
        (r"console\.log\(([^)]+)\)", r"logger.debug('Log', { data: \1 })"),

        # console.warn
        (r"console\.warn\((['\"])([^'\"]+)\1,\s*(.+?)\)", r"logger.warn(\1\2\1, { \3 })"),
        (r"console\.warn\((['\"])([^'\"]+)\1\)", r"logger.warn(\1\2\1)"),
        (r"console\.warn\(`([^`]+)`\)", r"logger.warn(`\1`)"),

        # console.debug
        (r"console\.debug\((['\"])([^'\"]+)\1,\s*(.+?)\)", r"logger.debug(\1\2\1, { \3 })"),
        (r"console\.debug\((['\"])([^'\"]+)\1\)", r"logger.debug(\1\2\1)"),
        (r"console\.debug\(`([^`]+)`\)", r"logger.debug(`\1`)"),

        # console.table and console.dir (keep for development debugging)
        # These are intentionally not replaced as they're useful for debugging
    ]

    for pattern, replacement in patterns:
        new_content = re.sub(pattern, replacement, content)
        if new_content != content:
            count = len(re.findall(pattern, content))
            replacements += count
            content = new_content

    return content, replacements

def process_file(file_path: str) -> dict:
    """Process a single file"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()

        # Check if file has console statements (excluding console.table, console.dir for debugging)
        console_count = content.count('console.log') + content.count('console.error') + \
                       content.count('console.warn') + content.count('console.debug')

        if console_count == 0:
            return {
                'file': file_path,
                'replacements': 0,
                'status': 'no_console'
            }

        # Replace console statements
        content, replacements = replace_console_statements(content)

        if replacements > 0:
            # Add logger import
            content = add_logger_import(content, file_path)

            # Write back
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(content)

            return {
                'file': file_path,
                'replacements': replacements,
                'status': 'success'
            }
        else:
            return {
                'file': file_path,
                'replacements': 0,
                'status': 'no_changes'
            }
    except Exception as e:
        return {
            'file': file_path,
            'replacements': 0,
            'status': 'error',
            'error': str(e)
        }

def main():
    base_path = Path('/Users/andrewmorton/Documents/GitHub/Fleet/src')

    # Get all TypeScript/TSX files
    all_files = list(base_path.glob('**/*.ts')) + list(base_path.glob('**/*.tsx'))

    # Exclude node_modules, dist, build directories
    files = [f for f in all_files if 'node_modules' not in str(f) and 'dist' not in str(f) and 'build' not in str(f)]

    print(f"🔍 Found {len(files)} files to process\n")

    results = []
    total_replacements = 0
    files_modified = 0

    # Process files in batches
    batch_size = 50
    for i in range(0, min(len(files), 100), batch_size):  # Process first 100 files
        batch = files[i:i+batch_size]

        print(f"\n📦 Processing batch {i//batch_size + 1}...")

        for file_path in batch:
            result = process_file(str(file_path))

            if result['status'] == 'success':
                results.append(result)
                total_replacements += result['replacements']
                files_modified += 1
                relative_path = str(file_path).replace('/Users/andrewmorton/Documents/GitHub/Fleet/', '')
                print(f"✅ {relative_path}: {result['replacements']} replacements")
            elif result['status'] == 'error':
                print(f"❌ {file_path.name}: ERROR - {result.get('error', 'Unknown')}")

    print(f"\n{'='*60}")
    print(f"📊 FRONTEND MIGRATION COMPLETE")
    print(f"{'='*60}")
    print(f"Files processed: {len(files[:100])}")
    print(f"Files modified: {files_modified}")
    print(f"Total replacements: {total_replacements}")
    print(f"{'='*60}")

if __name__ == '__main__':
    main()
