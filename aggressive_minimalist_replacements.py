#!/usr/bin/env python3
"""
Aggressive Minimalist Design System - Mass Find/Replace Script
This script makes DRAMATIC size reductions across ALL TypeScript/TSX files
"""

import os
import re
from pathlib import Path
from typing import List, Tuple

# Define replacement rules (find -> replace)
REPLACEMENTS: List[Tuple[str, str]] = [
    # ============================================
    # FONT SIZE REPLACEMENTS (Most aggressive)
    # ============================================
    ("text-4xl", "text-2xl"),
    ("text-3xl", "text-xl"),
    ("text-2xl", "text-lg"),
    ("text-xl", "text-base"),
    ("text-lg", "text-sm"),
    # Be selective with text-base -> text-xs (only for labels/secondary)
    # We'll keep text-base for main content

    # ============================================
    # PADDING REPLACEMENTS (Very aggressive)
    # ============================================
    ("p-8", "p-3"),
    ("p-6", "p-3"),
    ("p-4", "p-2"),
    ("px-8", "px-3"),
    ("px-6", "px-3"),
    ("px-4", "px-2"),
    ("py-8", "py-3"),
    ("py-6", "py-3"),
    ("py-4", "py-2"),
    ("pt-8", "pt-3"),
    ("pt-6", "pt-3"),
    ("pt-4", "pt-2"),
    ("pb-8", "pb-3"),
    ("pb-6", "pb-3"),
    ("pb-4", "pb-2"),
    ("pl-8", "pl-3"),
    ("pl-6", "pl-3"),
    ("pl-4", "pl-2"),
    ("pr-8", "pr-3"),
    ("pr-6", "pr-3"),
    ("pr-4", "pr-2"),

    # ============================================
    # MARGIN REPLACEMENTS
    # ============================================
    ("m-8", "m-3"),
    ("m-6", "m-3"),
    ("m-4", "m-2"),
    ("mb-8", "mb-3"),
    ("mb-6", "mb-3"),
    ("mb-4", "mb-2"),
    ("mt-8", "mt-3"),
    ("mt-6", "mt-3"),
    ("mt-4", "mt-2"),
    ("ml-8", "ml-3"),
    ("ml-6", "ml-3"),
    ("ml-4", "ml-2"),
    ("mr-8", "mr-3"),
    ("mr-6", "mr-3"),
    ("mr-4", "mr-2"),
    ("mx-8", "mx-3"),
    ("mx-6", "mx-3"),
    ("mx-4", "mx-2"),
    ("my-8", "my-3"),
    ("my-6", "my-3"),
    ("my-4", "my-2"),

    # ============================================
    # GAP/SPACE REPLACEMENTS
    # ============================================
    ("gap-8", "gap-2"),
    ("gap-6", "gap-2"),
    ("gap-4", "gap-2"),
    ("space-y-8", "space-y-2"),
    ("space-y-6", "space-y-2"),
    ("space-y-4", "space-y-2"),
    ("space-x-8", "space-x-2"),
    ("space-x-6", "space-x-2"),
    ("space-x-4", "space-x-2"),

    # ============================================
    # ICON SIZE REPLACEMENTS
    # ============================================
    ("w-8 h-8", "w-4 h-4"),
    ("w-6 h-6", "w-4 h-4"),
    ("w-5 h-5", "w-3 h-3"),

    # ============================================
    # BUTTON HEIGHT REPLACEMENTS
    # ============================================
    ("h-12", "h-9"),
    ("h-10", "h-8"),

    # ============================================
    # BORDER RADIUS REPLACEMENTS
    # ============================================
    ("rounded-2xl", "rounded-lg"),
    ("rounded-xl", "rounded-md"),

    # ============================================
    # SHADOW REPLACEMENTS (Remove heavy shadows)
    # ============================================
    ("shadow-2xl", "shadow-sm"),
    ("shadow-xl", "shadow-sm"),
    ("shadow-lg", "shadow-sm"),

    # ============================================
    # REMOVE BLOAT EFFECTS
    # ============================================
    # We'll do these manually in specific cases
]

def process_file(file_path: Path) -> Tuple[int, int]:
    """
    Process a single file and apply all replacements
    Returns: (number of replacements, number of lines)
    """
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()

        original_content = content
        replacement_count = 0

        # Apply all replacements
        for find_str, replace_str in REPLACEMENTS:
            # Use word boundaries to avoid partial matches
            # e.g., don't replace "text-lg" in "text-lg-custom"
            pattern = r'\b' + re.escape(find_str) + r'\b'
            new_content, count = re.subn(pattern, replace_str, content)
            content = new_content
            replacement_count += count

        # Only write if changes were made
        if content != original_content:
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(content)
            return replacement_count, len(content.splitlines())

        return 0, 0

    except Exception as e:
        print(f"❌ Error processing {file_path}: {e}")
        return 0, 0

def main():
    """Main execution function"""
    print("🚀 AGGRESSIVE MINIMALIST DESIGN SYSTEM - Mass Replacements")
    print("=" * 70)
    print()

    # Get the src directory
    src_dir = Path(__file__).parent / "src"

    if not src_dir.exists():
        print(f"❌ Source directory not found: {src_dir}")
        return

    # Find all TypeScript/TSX files
    tsx_files = list(src_dir.rglob("*.tsx"))
    ts_files = list(src_dir.rglob("*.ts"))
    all_files = tsx_files + ts_files

    print(f"📁 Found {len(all_files)} TypeScript/TSX files")
    print(f"   - {len(tsx_files)} .tsx files")
    print(f"   - {len(ts_files)} .ts files")
    print()

    # Process all files
    total_replacements = 0
    files_modified = 0

    for file_path in all_files:
        replacements, lines = process_file(file_path)
        if replacements > 0:
            files_modified += 1
            total_replacements += replacements
            relative_path = file_path.relative_to(src_dir.parent)
            print(f"✅ {relative_path}: {replacements} replacements")

    print()
    print("=" * 70)
    print(f"🎉 COMPLETE!")
    print(f"   - Files modified: {files_modified} / {len(all_files)}")
    print(f"   - Total replacements: {total_replacements}")
    print()
    print("💡 Next steps:")
    print("   1. Review the changes with: git diff src/")
    print("   2. Test the dev server: npm run dev")
    print("   3. Verify UI is noticeably more compact")
    print()

if __name__ == "__main__":
    main()
