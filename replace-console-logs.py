#!/usr/bin/env python3
"""
Replace console.log/error/warn/debug with Winston logger
"""
import re
import os
from pathlib import Path

def add_logger_import(content: str, file_path: str) -> str:
    """Add logger import if not present"""
    if 'import logger' in content or "import { logger }" in content:
        return content

    # Determine correct import path based on file location
    if '/middleware/' in file_path:
        import_line = "import logger from '../utils/logger'\n"
    elif '/routes/' in file_path:
        import_line = "import logger from '../utils/logger'\n"
    elif '/services/' in file_path:
        import_line = "import logger from '../utils/logger'\n"
    elif '/scripts/' in file_path:
        import_line = "import logger from '../utils/logger'\n"
    else:
        # Default import
        import_line = "import logger from './utils/logger'\n"

    # Find last import statement
    import_pattern = r"(import .+ from .+['\"])\n"
    matches = list(re.finditer(import_pattern, content))

    if matches:
        last_import = matches[-1]
        insert_pos = last_import.end()
        return content[:insert_pos] + import_line + content[insert_pos:]
    else:
        # No imports found, add at top
        return import_line + '\n' + content

def replace_console_log(content: str) -> tuple[str, int]:
    """Replace console.log statements with logger"""
    replacements = 0

    # Pattern 1: console.error('message', data)
    pattern1 = r"console\.error\('([^']+)',\s*(\w+)\)"
    def repl1(m):
        nonlocal replacements
        replacements += 1
        return f"logger.error('{m.group(1)}', {{ error: {m.group(2)} }})"
    content = re.sub(pattern1, repl1, content)

    # Pattern 2: console.error("message", data)
    pattern2 = r'console\.error\("([^"]+)",\s*(\w+)\)'
    def repl2(m):
        nonlocal replacements
        replacements += 1
        return f'logger.error("{m.group(1)}", {{ error: {m.group(2)} }})'
    content = re.sub(pattern2, repl2, content)

    # Pattern 3: console.log('message')
    pattern3 = r"console\.log\('([^']+)'\)"
    def repl3(m):
        nonlocal replacements
        replacements += 1
        return f"logger.info('{m.group(1)}')"
    content = re.sub(pattern3, repl3, content)

    # Pattern 4: console.log("message")
    pattern4 = r'console\.log\("([^"]+)"\)'
    def repl4(m):
        nonlocal replacements
        replacements += 1
        return f'logger.info("{m.group(1)}")'
    content = re.sub(pattern4, repl4, content)

    # Pattern 5: console.log('message', data)
    pattern5 = r"console\.log\('([^']+)',\s*(.+?)\)"
    def repl5(m):
        nonlocal replacements
        replacements += 1
        data = m.group(2)
        return f"logger.info('{m.group(1)}', {{ {data} }})"
    content = re.sub(pattern5, repl5, content)

    # Pattern 6: console.log("message", data)
    pattern6 = r'console\.log\("([^"]+)",\s*(.+?)\)'
    def repl6(m):
        nonlocal replacements
        replacements += 1
        data = m.group(2)
        return f'logger.info("{m.group(1)}", {{ {data} }})'
    content = re.sub(pattern6, repl6, content)

    # Pattern 7: console.warn
    content = re.sub(r'console\.warn\(', 'logger.warn(', content)

    # Pattern 8: console.debug
    content = re.sub(r'console\.debug\(', 'logger.debug(', content)

    return content, replacements

def process_file(file_path: str) -> dict:
    """Process a single file"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()

        original_content = content

        # Replace console statements
        content, replacements = replace_console_log(content)

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
    base_path = Path('/Users/andrewmorton/Documents/GitHub/Fleet/api/src')

    # Process middleware files
    middleware_files = list((base_path / 'middleware').glob('*.ts'))

    results = []
    total_replacements = 0

    for file_path in middleware_files:
        if file_path.name != 'permissions.ts':  # Skip already processed
            result = process_file(str(file_path))
            results.append(result)
            if result['status'] == 'success':
                total_replacements += result['replacements']
                print(f"✅ {file_path.name}: {result['replacements']} replacements")
            elif result['status'] == 'error':
                print(f"❌ {file_path.name}: ERROR - {result.get('error', 'Unknown')}")

    print(f"\n📊 Total middleware files processed: {len(results)}")
    print(f"📊 Total replacements: {total_replacements}")

if __name__ == '__main__':
    main()
