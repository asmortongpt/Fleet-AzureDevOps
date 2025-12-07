#!/usr/bin/env python3
import re
import os
from pathlib import Path

def fix_file(filepath):
    with open(filepath, 'r') as f:
        content = f.read()

    original = content
    lines = content.split('\n')
    fixed_lines = []

    for i, line in enumerate(lines):
        # Pattern: res.json(...})) or res.status(...).json(...}))
        # Should be: res.json(...}) or res.status(...).json(...})
        if 'res.json' in line or 'res.status' in line:
            # Count parens and braces
            open_parens = line.count('(')
            close_parens = line.count(')')
            open_braces = line.count('{')
            close_braces = line.count('}')

            # If we have })) at the end, might be wrong
            if line.rstrip().endswith('}))'):
                # Try removing one )
                line = line.rstrip()[:-3] + '})'
                print(f"Fixed {filepath}:{i+1}")

        fixed_lines.append(line)

    fixed_content = '\n'.join(fixed_lines)

    if fixed_content != original:
        with open(filepath, 'w') as f:
            f.write(fixed_content)
        return True
    return False

def main():
    src_dir = Path('/Users/andrewmorton/Documents/GitHub/Fleet/api/src')
    fixed_count = 0

    for ts_file in src_dir.rglob('*.ts'):
        if fix_file(ts_file):
            fixed_count += 1

    print(f"\n✅ Fixed {fixed_count} files")

if __name__ == '__main__':
    main()
