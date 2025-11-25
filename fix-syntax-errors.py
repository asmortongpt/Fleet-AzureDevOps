#!/usr/bin/env python3
"""
Fix syntax errors caused by removing import statements without proper newlines
"""
import re
from pathlib import Path

def fix_import_syntax(filepath: Path):
    """Fix import statements that are missing newlines"""
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Fix: import ... from 'x'import { ... } from 'y'
    # Should be: import ... from 'x'\nimport { ... } from 'y'
    pattern = r"(from\s+['\"][^'\"]+['\"])import\s+"
    fixed = re.sub(pattern, r"\1\nimport ", content)

    # Fix: import ... from 'x'const
    pattern = r"(from\s+['\"][^'\"]+['\"])const\s+"
    fixed = re.sub(pattern, r"\1\nconst ", fixed)

    # Fix: import ... from 'x'export
    pattern = r"(from\s+['\"][^'\"]+['\"])export\s+"
    fixed = re.sub(pattern, r"\1\nexport ", fixed)

    # Fix: import ... from 'x'}
    pattern = r"(from\s+['\"][^'\"]+['\"])\}"
    fixed = re.sub(pattern, r"\1\n}", fixed)

    if fixed != content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(fixed)
        return True
    return False

def main():
    base_path = Path('/Users/andrewmorton/Documents/GitHub/Fleet')

    # Find all .ts and .tsx files
    files = list(base_path.glob('src/**/*.ts')) + list(base_path.glob('src/**/*.tsx'))

    fixed_count = 0
    for filepath in files:
        if fix_import_syntax(filepath):
            print(f"Fixed: {filepath.relative_to(base_path)}")
            fixed_count += 1

    print(f"\nFixed {fixed_count} files")

if __name__ == '__main__':
    main()
