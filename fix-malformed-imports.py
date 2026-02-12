#!/usr/bin/env python3
"""
Fix malformed import statements where logger import is inside another import block
Pattern: import {\nimport logger from '@/utils/logger';\n  ...
Should be: import logger from '@/utils/logger';\nimport {\n  ...
"""

import re
import glob
from pathlib import Path

def fix_file(filepath):
    """Fix malformed imports in a single file"""
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    original_content = content

    # Pattern 1: import ... {\n...\nimport logger (anywhere in import block)
    # This handles multi-line imports where logger is not on the first line
    pattern1 = r"(import\s+[^{]+\{\s*[^}]*)\nimport logger from '@/utils/logger';(\s*[^}]*\})"
    replacement1 = r"import logger from '@/utils/logger';\n\1\2"
    content = re.sub(pattern1, replacement1, content, flags=re.MULTILINE | re.DOTALL)

    # Pattern 2: import type ... {\n...\nimport logger
    pattern2 = r"(import\s+type\s+[^{]+\{\s*[^}]*)\nimport logger from '@/utils/logger';(\s*[^}]*\})"
    replacement2 = r"import logger from '@/utils/logger';\n\1\2"
    content = re.sub(pattern2, replacement2, content, flags=re.MULTILINE | re.DOTALL)

    if content != original_content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        return True
    return False

def main():
    """Process all TypeScript/TSX files"""
    patterns = [
        'src/**/*.ts',
        'src/**/*.tsx',
        'src/**/**/*.ts',
        'src/**/**/*.tsx',
    ]

    files_fixed = 0
    for pattern in patterns:
        for filepath in glob.glob(pattern, recursive=True):
            if fix_file(filepath):
                print(f"Fixed: {filepath}")
                files_fixed += 1

    print(f"\nTotal files fixed: {files_fixed}")

if __name__ == '__main__':
    main()
