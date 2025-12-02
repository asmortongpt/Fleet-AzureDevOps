#!/usr/bin/env python3
"""
Find all mixed quote issues in TypeScript files
"""
import os
import re
from pathlib import Path

def check_file(filepath):
    """Check a single file for mixed quote issues"""
    issues = []

    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            lines = f.readlines()

        for i, line in enumerate(lines, 1):
            # Pattern 1: Single quote ending but backtick somewhere before in SQL context
            if "',\n" in line and ("SELECT" in line or "FROM" in line or "WHERE" in line or "INSERT" in line or "UPDATE" in line):
                # Look back to see if a backtick started this
                for j in range(max(0, i-10), i):
                    if '`' in lines[j] and 'pool.query(' in lines[j]:
                        issues.append((i, "SQL query: backtick start, single quote end", line.strip()))
                        break

            # Pattern 2: Mixed quotes in same line like 'uuid` or `params'
            if re.search(r"'[^'`]*`|`[^'`]*'", line):
                # Exclude comments and strings that might legitimately contain both
                if not line.strip().startswith('//') and not line.strip().startswith('*'):
                    issues.append((i, "Mixed quotes in single line", line.strip()))

            # Pattern 3: Backtick-quoted array elements like [`tenant_id`]
            if re.search(r"\[\s*`[a-z_]+`\s*\]", line):
                issues.append((i, "Backtick-quoted array element", line.strip()))

    except Exception as e:
        issues.append((0, f"Error reading file: {e}", ""))

    return issues

def main():
    src_dir = Path("/Users/andrewmorton/Documents/GitHub/Fleet/api/src")

    all_issues = {}
    total_files = 0
    total_issues = 0

    for ts_file in src_dir.rglob("*.ts"):
        if ".d.ts" in str(ts_file) or "node_modules" in str(ts_file):
            continue

        total_files += 1
        issues = check_file(ts_file)

        if issues:
            rel_path = ts_file.relative_to(src_dir.parent)
            all_issues[str(rel_path)] = issues
            total_issues += len(issues)

    print(f"Scanned {total_files} TypeScript files\n")
    print(f"Found {total_issues} potential mixed quote issues in {len(all_issues)} files\n")
    print("=" * 80)

    for filepath in sorted(all_issues.keys()):
        print(f"\n{filepath}:")
        for line_num, issue_type, line_content in all_issues[filepath]:
            print(f"  Line {line_num}: {issue_type}")
            print(f"    {line_content[:100]}")

    print("\n" + "=" * 80)

if __name__ == "__main__":
    main()
