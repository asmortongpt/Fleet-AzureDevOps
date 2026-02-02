#!/usr/bin/env python3
"""
Comprehensive TypeScript syntax fixer for Fleet API
Fixes template literal syntax errors
"""

import os
import re
import sys
from pathlib import Path

def fix_template_literals(content: str, filepath: str) -> tuple[str, int]:
    """Fix template literal syntax issues"""
    original = content
    fixes = 0

    # Pattern 1: Single-quoted strings with ${...} should use backticks
    # Match: 'text ${var} more text'
    # Replace with: `text ${var} more text`
    def replace_single_quotes_with_interpolation(match):
        inner = match.group(1)
        return f'`{inner}`'

    pattern1 = r"'([^']*\$\{[^}]+\}[^']*)'"
    new_content, count1 = re.subn(pattern1, replace_single_quotes_with_interpolation, content)
    fixes += count1
    content = new_content

    # Pattern 2: Mixed quotes like 'text '${var}' more'
    # This is harder - we need to look for specific contexts

    # Pattern 2a: Error messages with mixed quotes
    # throw new Error('text '${var}' text')
    pattern2a = r"(throw new Error\()'([^']*)'\$\{([^}]+)\}'([^']*)'\)"
    def fix_error_message(match):
        prefix = match.group(1)
        text1 = match.group(2)
        var = match.group(3)
        text2 = match.group(4)
        return f"{prefix}`{text1}${{{var}}}{text2}`)"

    new_content, count2a = re.subn(pattern2a, fix_error_message, content)
    fixes += count2a
    content = new_content

    # Pattern 3: console.log statements with template literals in single quotes
    # Lines like: console.log('   - Database: ${var ? "yes" : "no"}');
    pattern3 = r"(console\.(log|error|warn|info|debug)\()\s*'((?:[^']|\\')*?\$\{[^}]+\}(?:[^']|\\')*)'\s*\)"
    new_content, count3 = re.subn(pattern3, r'\1`\3`)', content)
    fixes += count3
    content = new_content

    if fixes > 0:
        print(f"  ✅ Fixed {fixes} template literal issues in {filepath}")

    return content, fixes

def process_file(filepath: Path) -> bool:
    """Process a single TypeScript file"""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()

        fixed_content, fix_count = fix_template_literals(content, filepath)

        if fix_count > 0:
            # Create backup
            backup_path = f"{filepath}.bak"
            with open(backup_path, 'w', encoding='utf-8') as f:
                f.write(content)

            # Write fixed content
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(fixed_content)

            return True

        return False

    except Exception as e:
        print(f"  ❌ Error processing {filepath}: {e}")
        return False

def main():
    """Main entry point"""
    api_dir = Path(__file__).parent
    src_dir = api_dir / 'src'

    if not src_dir.exists():
        print(f"❌ Source directory not found: {src_dir}")
        sys.exit(1)

    print("🔧 Starting comprehensive TypeScript syntax fix...")
    print(f"📁 Scanning directory: {src_dir}")

    # Find all TypeScript files
    ts_files = list(src_dir.rglob('*.ts'))
    print(f"📊 Found {len(ts_files)} TypeScript files")

    total_fixed = 0
    for ts_file in ts_files:
        if process_file(ts_file):
            total_fixed += 1

    print(f"\n✅ Processing complete!")
    print(f"📊 Fixed {total_fixed} files")

    # Run TypeScript compiler to check
    print("\n🔍 Running TypeScript compiler check...")
    os.chdir(api_dir)
    result = os.system("npx tsc --noEmit 2>&1 | head -100")

    return 0

if __name__ == '__main__':
    sys.exit(main())
