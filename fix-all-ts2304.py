#!/usr/bin/env python3
"""
Fix all TS2304 "Cannot find name" errors by adding missing imports
"""
import re
from collections import defaultdict
from pathlib import Path

# Parse the typecheck output
def parse_errors(error_file):
    """Parse errors from typecheck output"""
    errors = defaultdict(list)

    with open(error_file, 'r') as f:
        for line in f:
            match = re.match(r'(src/[^(]+)\(\d+,\d+\): error TS2304: Cannot find name \'(\w+)\'', line)
            if match:
                filepath, missing_name = match.groups()
                # Convert to absolute path
                abs_path = f"/Users/andrewmorton/Documents/GitHub/Fleet-CTA/{filepath}"
                errors[abs_path].append(missing_name)

    return errors

# Define import mappings
LUCIDE_ICONS = {
    'Zap', 'Car', 'AlertTriangle', 'Route', 'MessageCircle', 'AlertCircle',
    'TrendingUp', 'TrendingDown', 'Minus', 'Store', 'DollarSign', 'Calendar',
    'Shield', 'Package', 'Truck', 'Users', 'Settings', 'CheckCircle',
    'XCircle', 'Info', 'Plus', 'Minus', 'Edit', 'Trash', 'Eye', 'Download',
    'Upload', 'Search', 'Filter', 'Menu', 'X', 'ChevronDown', 'ChevronUp',
    'ChevronLeft', 'ChevronRight', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'
}

RECHARTS_COMPONENTS = {
    'Sector', 'Cell', 'LabelList', 'PieChart', 'Pie', 'LineChart', 'Line',
    'BarChart', 'Bar', 'XAxis', 'YAxis', 'CartesianGrid', 'Tooltip', 'Legend',
    'ResponsiveContainer', 'Area', 'AreaChart'
}

REACT_IMPORTS = {
    'useState', 'useEffect', 'useCallback', 'useMemo', 'useRef', 'useContext',
    'createContext', 'FC', 'ReactNode', 'ReactElement', 'ComponentProps'
}

def categorize_missing_imports(missing_names):
    """Categorize missing imports by their source"""
    categories = {
        'lucide-react': [],
        'recharts': [],
        'react': [],
        'logger': []
    }

    for name in missing_names:
        if name == 'logger':
            categories['logger'].append(name)
        elif name in LUCIDE_ICONS:
            categories['lucide-react'].append(name)
        elif name in RECHARTS_COMPONENTS:
            categories['recharts'].append(name)
        elif name in REACT_IMPORTS:
            categories['react'].append(name)

    return {k: sorted(set(v)) for k, v in categories.items() if v}

def add_imports_to_file(filepath, missing_names):
    """Add missing imports to a file"""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
    except Exception as e:
        print(f"Error reading {filepath}: {e}")
        return False

    # Categorize imports
    categories = categorize_missing_imports(missing_names)

    if not categories:
        print(f"No categorized imports for {filepath}")
        return False

    # Find import section
    import_pattern = r'^import\s+.*?;?\s*$'
    imports = list(re.finditer(import_pattern, content, re.MULTILINE))

    if not imports:
        print(f"No existing imports in {filepath}, skipping")
        return False

    # Get position after last import
    last_import = imports[-1]
    insert_pos = last_import.end()

    # Build new imports
    new_imports = []
    existing_react = None
    existing_lucide = None

    if 'logger' in categories:
        new_imports.append("\nimport logger from '@/utils/logger';")

    if 'react' in categories:
        # Check if React import already exists
        existing_react = re.search(r"^import.*from\s+['\"]react['\"];?", content, re.MULTILINE)
        if existing_react:
            # Merge with existing import
            existing_match = re.search(r"import\s+({[^}]+})\s+from\s+['\"]react['\"];?", content)
            if existing_match:
                existing_imports = existing_match.group(1).strip('{}').split(',')
                existing_imports = [i.strip() for i in existing_imports]
                all_imports = sorted(set(existing_imports + categories['react']))
                new_import_line = f"import {{ {', '.join(all_imports)} }} from 'react';"
                # Replace the existing import
                content = content.replace(existing_match.group(0), new_import_line)
        else:
            react_imports = ', '.join(categories['react'])
            new_imports.append(f"\nimport {{ {react_imports} }} from 'react';")

    if 'lucide-react' in categories:
        # Check if lucide-react import exists
        existing_lucide = re.search(r"^import.*from\s+['\"]lucide-react['\"];?", content, re.MULTILINE)
        if existing_lucide:
            # Merge with existing
            existing_match = re.search(r"import\s+({[^}]+})\s+from\s+['\"]lucide-react['\"];?", content)
            if existing_match:
                existing_imports = existing_match.group(1).strip('{}').split(',')
                existing_imports = [i.strip() for i in existing_imports]
                all_imports = sorted(set(existing_imports + categories['lucide-react']))
                new_import_line = f"import {{ {', '.join(all_imports)} }} from 'lucide-react';"
                content = content.replace(existing_match.group(0), new_import_line)
        else:
            lucide_imports = ', '.join(categories['lucide-react'])
            new_imports.append(f"\nimport {{ {lucide_imports} }} from 'lucide-react';")

    if 'recharts' in categories:
        recharts_imports = ', '.join(categories['recharts'])
        new_imports.append(f"\nimport {{ {recharts_imports} }} from 'recharts';")

    # Add new imports only if we have any that aren't handled by merging
    if new_imports and not existing_react and not existing_lucide:
        new_content = content[:insert_pos] + ''.join(new_imports) + content[insert_pos:]
    else:
        new_content = content

    # Write back
    try:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        return True
    except Exception as e:
        print(f"Error writing {filepath}: {e}")
        return False

def main():
    error_file = '/tmp/typecheck-output.txt'

    print("Parsing TS2304 errors...")
    errors = parse_errors(error_file)

    print(f"\nFound errors in {len(errors)} files")

    fixed_count = 0
    for filepath, missing_names in errors.items():
        print(f"\nFixing {filepath}")
        print(f"  Missing: {', '.join(set(missing_names))}")

        if add_imports_to_file(filepath, missing_names):
            fixed_count += 1
            print(f"  ✓ Fixed")
        else:
            print(f"  ✗ Skipped")

    print(f"\n\n=== Summary ===")
    print(f"Fixed {fixed_count}/{len(errors)} files")

if __name__ == '__main__':
    main()
