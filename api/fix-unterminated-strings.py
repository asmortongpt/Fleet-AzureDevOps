#!/usr/bin/env python3

import os
import re
import subprocess
from pathlib import Path

def get_unterminated_errors():
    """Get list of files with unterminated string errors"""
    result = subprocess.run(
        ['npx', 'tsc', '--noEmit'],
        capture_output=True,
        text=True,
        cwd='/Users/andrewmorton/Documents/GitHub/Fleet/api'
    )

    errors = {}
    for line in result.stderr.split('\n'):
        if 'Unterminated' in line:
            # Parse: src/file.ts(line,col): error TS1160: Unterminated template literal.
            match = re.match(r'([^(]+)\((\d+),(\d+)\):', line)
            if match:
                file_path = match.group(1)
                line_num = int(match.group(2))
                if file_path not in errors:
                    errors[file_path] = []
                errors[file_path].append(line_num)

    return errors

def fix_unterminated_template_literal(file_path, line_num):
    """Fix unterminated template literal at specific line"""
    full_path = os.path.join('/Users/andrewmorton/Documents/GitHub/Fleet/api', file_path)

    if not os.path.exists(full_path):
        print(f"⚠️  File not found: {file_path}")
        return False

    with open(full_path, 'r', encoding='utf-8') as f:
        lines = f.readlines()

    if line_num > len(lines):
        return False

    # Check if the line has an unterminated template literal
    target_line = lines[line_num - 1]

    # Count backticks in the line
    backtick_count = target_line.count('`')

    # If odd number of backticks, we have an unterminated literal
    if backtick_count % 2 == 1:
        # Try to find the matching backtick in following lines
        for i in range(line_num, len(lines)):
            if '`' in lines[i] and i != line_num - 1:
                # Found a line with backtick, check if it terminates the literal
                if lines[i].count('`') % 2 == 1:
                    # This might be the closing backtick
                    break
        else:
            # Didn't find closing backtick, add one at the end of the line
            lines[line_num - 1] = target_line.rstrip() + '`\n'

            with open(full_path, 'w', encoding='utf-8') as f:
                f.writelines(lines)

            return True

    return False

def fix_unterminated_string_literal(file_path, line_num):
    """Fix unterminated string literal (single/double quote) at specific line"""
    full_path = os.path.join('/Users/andrewmorton/Documents/GitHub/Fleet/api', file_path)

    if not os.path.exists(full_path):
        return False

    with open(full_path, 'r', encoding='utf-8') as f:
        lines = f.readlines()

    if line_num > len(lines):
        return False

    target_line = lines[line_num - 1]

    # Count unescaped quotes
    single_quotes = len(re.findall(r"(?<!\\)'", target_line))
    double_quotes = len(re.findall(r'(?<!\\)"', target_line))

    # If odd number of quotes, add closing quote at the end
    if single_quotes % 2 == 1:
        lines[line_num - 1] = target_line.rstrip() + "'\n"
        with open(full_path, 'w', encoding='utf-8') as f:
            f.writelines(lines)
        return True

    if double_quotes % 2 == 1:
        lines[line_num - 1] = target_line.rstrip() + '"\n'
        with open(full_path, 'w', encoding='utf-8') as f:
            f.writelines(lines)
        return True

    return False

def main():
    print("Finding unterminated string errors...\n")

    errors = get_unterminated_errors()

    if not errors:
        print("No unterminated string errors found!")
        return

    print(f"Found {len(errors)} files with unterminated string errors\n")

    fixed_count = 0
    for file_path, line_numbers in errors.items():
        for line_num in line_numbers:
            # Try both template literal and string literal fixes
            if fix_unterminated_template_literal(file_path, line_num):
                print(f"✓ Fixed template literal: {file_path}:{line_num}")
                fixed_count += 1
            elif fix_unterminated_string_literal(file_path, line_num):
                print(f"✓ Fixed string literal: {file_path}:{line_num}")
                fixed_count += 1

    print(f"\n✓ Fixed {fixed_count} unterminated string errors")

    # Re-run TypeScript check
    print("\nRunning TypeScript compiler check...")
    result = subprocess.run(
        ['npx', 'tsc', '--noEmit'],
        cwd='/Users/andrewmorton/Documents/GitHub/Fleet/api',
        capture_output=True
    )

    error_count = result.stderr.decode().count('error TS')
    print(f"Remaining errors: {error_count}")

if __name__ == '__main__':
    main()
