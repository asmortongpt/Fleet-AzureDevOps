#!/usr/bin/env python3
"""
Final SQL Fix - Remove ALL malformed WHERE clauses
Handles all edge cases from the broken regex replacements
"""

import re
from pathlib import Path

def fix_file(file_path: Path) -> int:
    """Fix all malformed SQL in a single file"""
    content = file_path.read_text()
    original = content
    fixes = 0

    # Pattern 1: Triple WHERE with /[char] fragments
    # FROM table WHERE tenant_id = $1 /c WHERE tenant_id = $1 /e WHERE id = $1
    # Should become: FROM table WHERE tenant_id = $1 AND id = $2
    pattern1 = r'(FROM\s+\w+)\s+WHERE\s+tenant_id\s*=\s*\$1\s*/\*[^*]*\*/[a-z]\s+WHERE\s+tenant_id\s*=\s*\$1\s*/\*[^*]*\*/[a-z]\s+WHERE\s+(\w+\s*=\s*\$1)'
    content = re.sub(pattern1, r'\1 WHERE tenant_id = $1 AND \2', content)

    # Pattern 2: Triple WHERE with TODO comment
    # WHERE tenant_id = $1 /n WHERE tenant_id = $1 /s WHERE /* TODO */ id = $1
    pattern2 = r'WHERE\s+tenant_id\s*=\s*\$1\s*/\*[^*]*\*/[a-z]\s+WHERE\s+tenant_id\s*=\s*\$1\s*/\*[^*]*\*/[a-z]\s+WHERE\s+/\*\s*TODO:[^*]*\*/\s*'
    content = re.sub(pattern2, 'WHERE tenant_id = $1 AND ', content)

    # Pattern 3: Double WHERE with /[char]
    # WHERE tenant_id = $1 /t WHERE tenant_id = $1 /s WHERE
    pattern3 = r'WHERE\s+tenant_id\s*=\s*\$1\s*/\*[^*]*\*/[a-z]\s+WHERE\s+tenant_id\s*=\s*\$1\s*/\*[^*]*\*/[a-z]\s+WHERE\s+'
    content = re.sub(pattern3, 'WHERE tenant_id = $1 AND ', content)

    # Pattern 4: Fix truncated table names
    truncated = {
        'maintenan': 'maintenance',
        'vehicle_reservatio': 'vehicle_reservations',
        'damage_repor': 'damage_reports',
        'rout(?!e)': 'routes',  # route but not 'route'
        'telemetry_da': 'telemetry_data',
        'camer': 'cameras',
        'weath': 'weather',
        'foreca': 'forecast',
        'aler': 'alerts',
        'rad(?!ar)': 'radar',  # rad but not 'radar'
        'vehicle_assignmen': 'vehicle_assignments',
        'refresh_toke': 'refresh_tokens',
        'vehicl(?!e)': 'vehicles'  # vehicl but not 'vehicle'
    }

    for broken, fixed in truncated.items():
        content = re.sub(rf'\b{broken}\b', fixed, content)

    # Count fixes
    if content != original:
        fixes = original.count('WHERE') - content.count('WHERE') + 1
        file_path.write_text(content)

    return fixes

def main():
    project_root = Path("/Users/andrewmorton/Documents/GitHub/Fleet")
    routes_dir = project_root / "api" / "src" / "routes"

    total_fixes = 0
    files_fixed = []

    print("=" * 80)
    print("FINAL SQL CLEANUP - FIXING ALL MALFORMED QUERIES")
    print("=" * 80)

    for file_path in routes_dir.glob("*.ts"):
        fixes = fix_file(file_path)
        if fixes > 0:
            total_fixes += fixes
            files_fixed.append(file_path.name)
            print(f"✅ Fixed {file_path.name}: {fixes} changes")

    print("\n" + "=" * 80)
    print(f"✅ Total files fixed: {len(files_fixed)}")
    print(f"✅ Total changes: {total_fixes}")
    print("=" * 80)

    # Verify no more broken queries
    broken_count = 0
    for file_path in routes_dir.glob("*.ts"):
        content = file_path.read_text()
        if re.search(r'WHERE.*WHERE.*WHERE', content):
            broken_count += 1
            print(f"⚠️  Still broken: {file_path.name}")

    if broken_count == 0:
        print("\n✅ SUCCESS: No more malformed queries found!")
    else:
        print(f"\n❌ WARNING: {broken_count} files still have issues")

    return 0 if broken_count == 0 else 1

if __name__ == "__main__":
    exit(main())
