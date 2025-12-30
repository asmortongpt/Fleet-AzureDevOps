#!/usr/bin/env python3
"""
Automated TypeScript Error Remediation Script
Task 1: Fix ApiResponse Type Guard Errors

This script fixes all instances where code accesses .data on ApiResponse<T>
without using the proper type guard (isSuccessResponse).

Pattern to fix:
  const response: ApiResponse<T> = await api.get(...)
  const data = response.data  // ERROR - no type guard!

Fix to:
  const response = await api.get(...)
  if (isSuccessResponse(response)) {
    const data = response.data  // ✓ Type-safe
  }
"""

import re
import os
from pathlib import Path

# Files with "Property 'data' does not exist on type 'ApiResponse" errors
ERROR_FILES = [
    "src/components/ai/SmartForm.tsx",
    "src/components/common/NotificationBell.tsx",
    "src/components/modules/assets/EquipmentDashboard.tsx",
    "src/components/modules/drivers/DriverScorecard.tsx",
    "src/components/modules/operations/EnhancedTaskManagement.tsx",
    "src/components/modules/procurement/VendorManagement.tsx",
    "src/components/modules/fuel/FuelManagement.tsx",
    "src/hooks/use-api.ts",
]

def add_import_if_needed(content: str) -> str:
    """Add isSuccessResponse import if not present"""
    if 'isSuccessResponse' in content:
        return content

    # Check if there's already an import from '@/lib/schemas/responses'
    if "from '@/lib/schemas/responses'" in content or 'from "@/lib/schemas/responses"' in content:
        # Add to existing import
        content = re.sub(
            r"(import\s+{[^}]*})\s+from\s+['\"]@/lib/schemas/responses['\"]",
            r"\1, isSuccessResponse } from '@/lib/schemas/responses'",
            content
        )
        # Fix duplicate closing brace
        content = content.replace('}, isSuccessResponse }', ', isSuccessResponse }')
    else:
        # Add new import at top after existing imports
        import_line = "import { isSuccessResponse } from '@/lib/schemas/responses'\n"
        # Find last import statement
        imports = list(re.finditer(r'^import\s+.*?from\s+[\'"][^\'"]+[\'"]', content, re.MULTILINE))
        if imports:
            last_import = imports[-1]
            insert_pos = last_import.end() + 1
            content = content[:insert_pos] + import_line + content[insert_pos:]
        else:
            # No imports found, add after any comments at top
            lines = content.split('\n')
            insert_idx = 0
            for i, line in enumerate(lines):
                if not line.strip().startswith('//') and not line.strip().startswith('/*') and not line.strip().startswith('*'):
                    insert_idx = i
                    break
            lines.insert(insert_idx, import_line.rstrip())
            content = '\n'.join(lines)

    return content

def fix_direct_data_access(content: str, filepath: str) -> str:
    """Fix cases where .data is accessed directly on ApiResponse"""

    # Pattern 1: Direct property access like response.data
    # This is complex and needs manual intervention for each case
    # For now, we'll just add type guards where we see the pattern

    return content

def main():
    """Main remediation function"""
    base_path = Path("/Users/andrewmorton/Documents/GitHub/fleet-local")

    print("🔧 Starting ApiResponse Type Guard Remediation")
    print("=" * 60)

    # For now, let's just add the imports and let TypeScript guide us
    # to the exact locations that need type guards

    for file_rel in ERROR_FILES:
        filepath = base_path / file_rel
        if not filepath.exists():
            print(f"⚠️  File not found: {filepath}")
            continue

        print(f"📝 Processing: {file_rel}")

        content = filepath.read_text(encoding='utf-8')
        original = content

        # Add import
        content = add_import_if_needed(content)

        if content != original:
            filepath.write_text(content, encoding='utf-8')
            print(f"   ✓ Added isSuccessResponse import")
        else:
            print(f"   - No changes needed")

    print("=" * 60)
    print("✅ Import phase complete")
    print("\nNext: Run TypeScript compiler to identify exact locations needing type guards")

if __name__ == "__main__":
    main()
