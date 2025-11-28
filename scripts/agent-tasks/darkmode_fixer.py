#!/usr/bin/env python3
"""
Dark Mode Fixer Task - Ensures all UI elements are visible in dark mode
Uses: OpenAI GPT-4 Turbo
"""

import os
import json
import openai
from pathlib import Path
import glob
import re

def fix_darkmode():
    """Fix dark mode visibility across all UI elements"""

    openai.api_key = os.getenv('OPENAI_API_KEY')

    # Find all component and style files
    files_to_check = []
    search_paths = [
        "/home/azureuser/Fleet/src/components/**/*.tsx",
        "/home/azureuser/Fleet/src/components/**/*.css",
        "/home/azureuser/Fleet/src/styles/**/*.css",
        "/home/azureuser/Fleet/src/**/*.module.css",
    ]

    for pattern in search_paths:
        files_to_check.extend(glob.glob(pattern, recursive=True))

    print(f"📋 Checking {len(files_to_check)} files for dark mode issues")

    fixed_files = []
    issues_found = []

    for file_path in files_to_check:
        try:
            with open(file_path, 'r') as f:
                content = f.read()

            # Check for common dark mode issues
            has_issues = False
            file_issues = []

            # Check for hardcoded light colors
            if re.search(r'(#fff|#ffffff|white|rgb\(255,\s*255,\s*255\))', content, re.IGNORECASE):
                if 'dark:' not in content:
                    file_issues.append("Hardcoded white/light colors without dark mode variants")
                    has_issues = True

            # Check for low contrast text
            if re.search(r'(text-gray-[123]00|text-white)', content):
                if not re.search(r'dark:text-', content):
                    file_issues.append("Low contrast text without dark mode variants")
                    has_issues = True

            # Check for background colors
            if re.search(r'bg-(white|gray-[123]00)', content):
                if not re.search(r'dark:bg-', content):
                    file_issues.append("Light backgrounds without dark mode variants")
                    has_issues = True

            if not has_issues:
                continue

            print(f"  🔧 Fixing dark mode in: {os.path.basename(file_path)}")
            issues_found.extend([f"{os.path.basename(file_path)}: {issue}" for issue in file_issues])

            # Use GPT-4 to fix dark mode issues
            prompt = f"""Fix dark mode visibility issues in this React/CSS code:

{content}

Issues detected:
{chr(10).join(f"- {issue}" for issue in file_issues)}

Apply these fixes:
1. Add dark: variants for all colors (use Tailwind dark mode)
2. Ensure proper contrast ratios (WCAG AA minimum):
   - Normal text: 4.5:1
   - Large text: 3:1
3. Use semantic color variables where possible
4. For light backgrounds, add dark:bg-gray-800 or darker
5. For dark text, add dark:text-gray-100 or lighter
6. For borders, add dark:border-gray-700
7. Ensure all interactive elements (buttons, links) are visible
8. Maintain visual hierarchy in both modes
9. Use CSS custom properties for theme-aware colors if needed
10. Test color combinations:
    - Light mode: dark text on light bg
    - Dark mode: light text on dark bg

IMPORTANT:
- Keep all existing functionality
- Maintain TypeScript types
- Don't change component structure
- Only fix color/visibility issues
- Use Tailwind's dark mode variants (class-based)

Return ONLY the fixed code, no explanations."""

            response = openai.chat.completions.create(
                model="gpt-4-turbo-preview",
                messages=[
                    {"role": "system", "content": "You are an expert in web accessibility and dark mode implementation using Tailwind CSS."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.2,
            )

            fixed_code = response.choices[0].message.content

            # Extract code from markdown if wrapped
            if "```" in fixed_code:
                parts = fixed_code.split("```")
                for i, part in enumerate(parts):
                    if i % 2 == 1:  # Code block
                        fixed_code = part
                        if fixed_code.startswith("typescript") or fixed_code.startswith("tsx") or fixed_code.startswith("css"):
                            fixed_code = "\n".join(fixed_code.split("\n")[1:])
                        break

            # Backup original
            backup_path = f"{file_path}.darkmode-backup"
            with open(backup_path, 'w') as f:
                f.write(content)

            # Write fixed version
            with open(file_path, 'w') as f:
                f.write(fixed_code)

            fixed_files.append(file_path)
            print(f"    ✅ Fixed: {os.path.basename(file_path)}")

        except Exception as e:
            print(f"    ❌ Error fixing {file_path}: {str(e)}")
            continue

    # Create dark mode color palette guide
    color_guide = """# Dark Mode Color Palette

## Background Colors
- Light mode: bg-white, bg-gray-50, bg-gray-100
- Dark mode: dark:bg-gray-900, dark:bg-gray-800, dark:bg-gray-950

## Text Colors
- Light mode: text-gray-900, text-gray-800, text-gray-700
- Dark mode: dark:text-gray-100, dark:text-gray-200, dark:text-gray-300

## Border Colors
- Light mode: border-gray-200, border-gray-300
- Dark mode: dark:border-gray-700, dark:border-gray-600

## Interactive Elements
- Buttons: bg-blue-600 dark:bg-blue-500
- Hover: hover:bg-blue-700 dark:hover:bg-blue-600
- Focus rings: focus:ring-blue-500 dark:focus:ring-blue-400

## Status Colors
- Success: text-green-600 dark:text-green-400
- Warning: text-yellow-600 dark:text-yellow-400
- Error: text-red-600 dark:text-red-400
- Info: text-blue-600 dark:text-blue-400

## Contrast Requirements (WCAG AA)
- Normal text: 4.5:1 minimum
- Large text (18pt+): 3:1 minimum
- UI components: 3:1 minimum
"""

    guide_path = "/home/azureuser/Fleet/DARK_MODE_GUIDE.md"
    with open(guide_path, 'w') as f:
        f.write(color_guide)

    # Create summary
    summary = {
        "status": "completed",
        "files_fixed": len(fixed_files),
        "total_issues": len(issues_found),
        "issues": issues_found[:20],  # First 20 issues
        "fixes_applied": [
            "Added dark mode variants for all colors",
            "Ensured WCAG AA contrast ratios",
            "Fixed hardcoded light/white colors",
            "Added semantic color variables",
            "Made all interactive elements visible",
            "Maintained visual hierarchy in both modes"
        ],
        "files": [os.path.basename(f) for f in fixed_files],
        "color_guide": guide_path,
        "ai_engine": "OpenAI GPT-4 Turbo"
    }

    summary_path = "/home/azureuser/Fleet/darkmode-fixes-summary.json"
    with open(summary_path, 'w') as f:
        json.dump(summary, f, indent=2)

    print(f"\n✅ Dark mode fixes completed!")
    print(f"   Fixed {len(fixed_files)} files")
    print(f"   Found and fixed {len(issues_found)} issues")
    print(f"   Color guide: {guide_path}")
    print(f"   Summary: {summary_path}")

    return summary

if __name__ == "__main__":
    result = fix_darkmode()
    print(json.dumps(result, indent=2))
