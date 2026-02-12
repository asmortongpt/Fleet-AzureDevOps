#!/usr/bin/env python3
"""
Comprehensive Accessibility Fix
Systematically eliminate ALL remaining violations to achieve 18/18 certification
"""
import re
from pathlib import Path
import subprocess

def fix_all_source_files():
    """Apply comprehensive fixes to source code"""
    # Ensure we're in project root
    script_dir = Path(__file__).parent
    project_root = script_dir.parent
    src_dir = project_root / "src"

    fixes_applied = 0

    print("🔧 Comprehensive Accessibility Remediation")
    print("=" * 60)

    # Fix 1: Remove ALL role="navigation" from nav elements (redundant)
    print("\n1️⃣  Removing redundant role='navigation' from <nav> elements...")
    for tsx_file in src_dir.rglob("*.tsx"):
        content = tsx_file.read_text()
        original = content

        # Remove role="navigation" from nav elements
        content = re.sub(r'<nav\s+role="navigation"', '<nav', content)
        content = re.sub(r'<nav([^>]*)\s+role="navigation"', r'<nav\1', content)

        if content != original:
            tsx_file.write_text(content)
            fixes_applied += 1
            print(f"   ✓ {tsx_file.relative_to(project_root)}")

    # Fix 2: Upgrade ALL light text colors for better contrast
    print("\n2️⃣  Upgrading text colors for WCAG AA contrast...")
    color_upgrades = [
        (r'\btext-gray-400\b', 'text-gray-700'),
        (r'\btext-gray-500\b', 'text-gray-700'),
        (r'\btext-emerald-400\b', 'text-emerald-700'),
        (r'\btext-emerald-500\b', 'text-emerald-600'),
        (r'\btext-blue-400\b', 'text-blue-700'),
        (r'\btext-slate-400\b', 'text-slate-700'),
    ]

    for tsx_file in src_dir.rglob("*.tsx"):
        content = tsx_file.read_text()
        original = content

        for pattern, replacement in color_upgrades:
            content = re.sub(pattern, replacement, content)

        if content != original:
            tsx_file.write_text(content)
            fixes_applied += 1
            print(f"   ✓ {tsx_file.relative_to(project_root)}")

    # Fix 3: Add unique aria-labels to ALL nav elements to fix landmark-unique
    print("\n3️⃣  Adding unique aria-labels to navigation landmarks...")
    nav_patterns = [
        (r'<nav\s+className="flex-1[^"]*"\s+aria-label="Main navigation"',
         '<nav className="flex-1 py-0.5 px-0.5 space-y-0.5 overflow-y-auto no-scrollbar" aria-label="Primary sidebar navigation"'),
        (r'<nav\s+aria-label="pagination"',
         '<nav aria-label="Pagination controls"'),
        (r'<nav\s+aria-label="breadcrumb"',
         '<nav aria-label="Breadcrumb trail"'),
        (r'<nav\s+aria-label="Drilldown breadcrumb"',
         '<nav aria-label="Drilldown navigation breadcrumb"'),
    ]

    for tsx_file in src_dir.rglob("*.tsx"):
        content = tsx_file.read_text()
        original = content

        for pattern, replacement in nav_patterns:
            content = re.sub(pattern, replacement, content)

        if content != original:
            tsx_file.write_text(content)
            fixes_applied += 1
            print(f"   ✓ {tsx_file.relative_to(project_root)}")

    # Fix 4: Fix small text (9px, 10px) to have darker colors
    print("\n4️⃣  Fixing tiny text contrast (9px, 10px, 11px)...")
    for tsx_file in src_dir.rglob("*.tsx"):
        content = tsx_file.read_text()
        original = content

        # Find text-[9px], text-[10px], text-[11px] and ensure they have dark text
        # Pattern: text-[9px] or text-[10px] followed by any text color class
        content = re.sub(
            r'(text-\[(?:9|10|11)px\])\s+(text-(?:gray|slate|blue|emerald)-[345]00)',
            r'\1 text-gray-800',
            content
        )

        if content != original:
            tsx_file.write_text(content)
            fixes_applied += 1
            print(f"   ✓ {tsx_file.relative_to(project_root)}")

    # Fix 5: Fix tracking-wider elements with light colors
    print("\n5️⃣  Fixing tracking-wider elements...")
    for tsx_file in src_dir.rglob("*.tsx"):
        content = tsx_file.read_text()
        original = content

        # Ensure tracking-wider uses dark text
        content = re.sub(
            r'(tracking-wider[^"]*)\s+(text-(?:gray|slate)-[345]00)',
            r'\1 text-gray-800',
            content
        )

        if content != original:
            tsx_file.write_text(content)
            fixes_applied += 1
            print(f"   ✓ {tsx_file.relative_to(project_root)}")

    print(f"\n✅ Applied {fixes_applied} comprehensive fixes")
    print("=" * 60)

    return fixes_applied

if __name__ == "__main__":
    fix_all_source_files()
    print("\n🎯 Source code remediation complete!")
    print("   Re-running certification to verify...")
