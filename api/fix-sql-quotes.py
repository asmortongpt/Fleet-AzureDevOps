#!/usr/bin/env python3
"""
Fix mismatched SQL query quotes in TypeScript files.
Converts single quotes to backticks for SQL queries.
"""
import os
import re
from pathlib import Path

def fix_sql_quotes(file_path):
    """Fix SQL query quotes in a single file."""
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    original = content

    # Pattern 1: 'SELECT|DELETE|UPDATE|INSERT starting with single quote but ending with backtick
    # Replace: Make both quotes backticks
    content = re.sub(
        r"'((?:SELECT|DELETE|UPDATE|INSERT)\s+.*?)`",
        r"`\1`",
        content,
        flags=re.MULTILINE | re.DOTALL
    )

    # Pattern 2: `SELECT|DELETE|UPDATE|INSERT starting with backtick but ending with single quote
    # Replace: Make both quotes backticks
    content = re.sub(
        r"`((?:SELECT|DELETE|UPDATE|INSERT)\s+.*?)'",
        r"`\1`",
        content,
        flags=re.MULTILINE | re.DOTALL
    )

    # Pattern 3: Backtick-quoted string literal ending with single quote (non-SQL)
    # e.g., `users', `failure', `LOGIN',
    # Replace: Make both quotes backticks
    content = re.sub(
        r"`([a-zA-Z_][a-zA-Z0-9_]*)'",
        r"`\1`",
        content
    )

    if content != original:
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)
        return True
    return False

def main():
    """Fix all TypeScript files in src/routes and src/utils."""
    fixed_count = 0

    for directory in ['src/routes', 'src/utils', 'src/workers']:
        dir_path = Path(directory)
        if not dir_path.exists():
            continue
        for ts_file in dir_path.rglob('*.ts'):
            if fix_sql_quotes(ts_file):
                print(f"Fixed: {ts_file}")
                fixed_count += 1

    print(f"\nTotal files fixed: {fixed_count}")

if __name__ == '__main__':
    main()
