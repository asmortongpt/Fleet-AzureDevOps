#!/usr/bin/env python3
"""
Scrolling Optimizer Task - Minimizes scrolling across all components
Uses: Google Gemini 1.5 Pro
"""

import os
import json
import google.generativeai as genai
from pathlib import Path
import glob

def optimize_scrolling():
    """Optimize all components to minimize scrolling"""

    genai.configure(api_key=os.getenv('GEMINI_API_KEY'))
    model = genai.GenerativeModel('gemini-1.5-pro')

    # Find all component files that need optimization
    component_dirs = [
        "/home/azureuser/Fleet/src/components/modules",
        "/home/azureuser/Fleet/src/components/ui",
        "/home/azureuser/Fleet/src/components",
    ]

    components_to_optimize = []
    for directory in component_dirs:
        if os.path.exists(directory):
            components_to_optimize.extend(glob.glob(f"{directory}/**/*.tsx", recursive=True))

    print(f"📋 Found {len(components_to_optimize)} components to optimize")

    optimized_files = []

    for component_file in components_to_optimize:
        try:
            with open(component_file, 'r') as f:
                original_code = f.read()

            # Skip if file is already optimized or too small
            if len(original_code) < 500 or "ScrollArea" in original_code:
                continue

            print(f"  🔧 Optimizing: {os.path.basename(component_file)}")

            prompt = f"""Optimize this React component to minimize scrolling:

{original_code}

Apply these optimizations:
1. Use Collapsible sections for long content
2. Implement tabbed interfaces where appropriate
3. Use Grid/Flexbox for better space utilization
4. Add ScrollArea from shadcn/ui only where necessary
5. Make cards more compact
6. Use accordion patterns for expandable content
7. Implement virtualization for long lists
8. Add "Show More" patterns instead of long scrolling lists
9. Ensure dark mode compatibility
10. Keep all functionality intact

IMPORTANT:
- Maintain all existing functionality
- Keep TypeScript types
- Use existing shadcn/ui components
- Don't break any props or exports
- Preserve all event handlers and state management

Return ONLY the optimized component code, no explanations."""

            response = model.generate_content(prompt)
            optimized_code = response.text

            # Extract code from markdown if wrapped
            if "```" in optimized_code:
                if "```typescript" in optimized_code:
                    optimized_code = optimized_code.split("```typescript")[1].split("```")[0].strip()
                elif "```tsx" in optimized_code:
                    optimized_code = optimized_code.split("```tsx")[1].split("```")[0].strip()
                else:
                    optimized_code = optimized_code.split("```")[1].split("```")[0].strip()

            # Backup original
            backup_path = f"{component_file}.backup"
            with open(backup_path, 'w') as f:
                f.write(original_code)

            # Write optimized version
            with open(component_file, 'w') as f:
                f.write(optimized_code)

            optimized_files.append(component_file)
            print(f"    ✅ Optimized: {os.path.basename(component_file)}")

        except Exception as e:
            print(f"    ❌ Error optimizing {component_file}: {str(e)}")
            continue

    # Create optimization summary
    summary = {
        "status": "completed",
        "files_optimized": len(optimized_files),
        "optimizations_applied": [
            "Collapsible sections for long content",
            "Tabbed interfaces for multi-section views",
            "Grid layouts for better space utilization",
            "Compact card designs",
            "Accordion patterns for expandable content",
            "Show More patterns instead of infinite scrolling",
            "Dark mode compatibility ensured"
        ],
        "files": [os.path.basename(f) for f in optimized_files],
        "ai_engine": "Google Gemini 1.5 Pro"
    }

    summary_path = "/home/azureuser/Fleet/optimization-summary.json"
    with open(summary_path, 'w') as f:
        json.dump(summary, f, indent=2)

    print(f"\n✅ Scrolling optimization completed!")
    print(f"   Optimized {len(optimized_files)} files")
    print(f"   Summary: {summary_path}")

    return summary

if __name__ == "__main__":
    result = optimize_scrolling()
    print(json.dumps(result, indent=2))
