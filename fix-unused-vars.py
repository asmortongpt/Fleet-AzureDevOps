#!/usr/bin/env python3
"""
Automatically fix all TS6133 (unused variables/imports) errors
"""
import re
import sys
from pathlib import Path

def parse_error_file(error_file: str) -> dict:
    """Parse TypeScript errors and group by file"""
    errors_by_file = {}

    with open(error_file, 'r') as f:
        for line in f:
            if 'error TS6133' not in line:
                continue

            # Parse: src/App.tsx(64,1): error TS6133: 'DispatchConsole' is declared but its value is never read.
            match = re.match(r'(.+?)\((\d+),(\d+)\): error TS6133: \'(.+?)\' is declared', line)
            if match:
                filepath, line_num, col, var_name = match.groups()

                if filepath not in errors_by_file:
                    errors_by_file[filepath] = []

                errors_by_file[filepath].append({
                    'line': int(line_num),
                    'col': int(col),
                    'var': var_name
                })

    return errors_by_file

def remove_unused_import(line: str, var_name: str) -> str:
    """Remove an unused import from a line"""
    # Handle: import { A, B, C } from "module"
    if '{' in line and '}' in line:
        match = re.match(r'(.+?\{)(.+?)(\}.+)', line)
        if match:
            prefix, imports, suffix = match.groups()
            import_list = [i.strip() for i in imports.split(',')]
            import_list = [i for i in import_list if i and i != var_name and not i.endswith(' as ' + var_name)]

            if not import_list:
                return ''  # Remove entire line

            return f"{prefix} {', '.join(import_list)} {suffix}"

    # Handle: import VarName from "module"
    if f'import {var_name}' in line or f'import {var_name} ' in line:
        return ''  # Remove entire line

    return line

def fix_file(filepath: str, errors: list):
    """Fix all unused variables in a file"""
    full_path = Path('/Users/andrewmorton/Documents/GitHub/Fleet') / filepath

    if not full_path.exists():
        print(f"Skipping {filepath} - file not found")
        return

    with open(full_path, 'r', encoding='utf-8') as f:
        lines = f.readlines()

    # Sort errors by line number in reverse order
    errors_sorted = sorted(errors, key=lambda x: x['line'], reverse=True)

    modified = False
    for error in errors_sorted:
        line_idx = error['line'] - 1  # Convert to 0-indexed

        if line_idx >= len(lines):
            continue

        original_line = lines[line_idx]
        var_name = error['var']

        # Try to remove the unused variable
        new_line = remove_unused_import(original_line, var_name)

        if new_line != original_line:
            if new_line == '':
                # Remove the entire line
                lines[line_idx] = ''
            else:
                lines[line_idx] = new_line
            modified = True

    if modified:
        # Remove empty lines that were imports
        lines = [line for line in lines if line.strip() or not line.startswith('import')]

        with open(full_path, 'w', encoding='utf-8') as f:
            f.writelines(lines)

        print(f"Fixed {len(errors_sorted)} errors in {filepath}")

def main():
    error_file = '/tmp/unused-vars.txt'
    errors_by_file = parse_error_file(error_file)

    print(f"Found {len(errors_by_file)} files with unused variables")

    for filepath, errors in errors_by_file.items():
        fix_file(filepath, errors)

    print(f"\nProcessed {len(errors_by_file)} files")

if __name__ == '__main__':
    main()
