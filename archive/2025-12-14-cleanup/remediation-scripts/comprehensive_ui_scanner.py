#!/usr/bin/env python3
"""
Comprehensive UI Element Scanner
Scans ALL .tsx/.ts files and extracts EVERY interactive element
"""

import os
import re
import json
import csv
from pathlib import Path
from typing import List, Dict, Any
import ast
from dataclasses import dataclass, asdict
from tqdm import tqdm

@dataclass
class UIElement:
    element_type: str
    file_path: str
    line_number: int
    label_text: str
    handler_action: str
    context: str
    test_coverage: str
    component_name: str
    props: str

class ComprehensiveUIScanner:
    def __init__(self, root_dir: str):
        self.root_dir = Path(root_dir)
        self.elements: List[UIElement] = []

        # Patterns for interactive elements
        self.patterns = {
            'Button': r'<Button[^>]*>.*?</Button>|<Button[^>]*/?>',
            'Link': r'<Link[^>]*>.*?</Link>|<Link[^>]*/?>',
            'a_tag': r'<a[^>]*>.*?</a>|<a[^>]*/?>',
            'Input': r'<Input[^>]*>.*?</Input>|<Input[^>]*/?>|<input[^>]*/?>',
            'Select': r'<Select[^>]*>.*?</Select>|<Select[^>]*/?>|<select[^>]*/?>',
            'Checkbox': r'<Checkbox[^>]*>.*?</Checkbox>|<Checkbox[^>]*/?>',
            'Radio': r'<Radio[^>]*>.*?</Radio>|<Radio[^>]*/?>',
            'Textarea': r'<Textarea[^>]*>.*?</Textarea>|<Textarea[^>]*/?>|<textarea[^>]*/?>',
            'Form': r'<Form[^>]*>.*?</Form>|<form[^>]*/?>',
            'Dialog': r'<Dialog[^>]*>.*?</Dialog>|<Dialog[^>]*/?>',
            'Modal': r'<Modal[^>]*>.*?</Modal>|<Modal[^>]*/?>',
            'Dropdown': r'<Dropdown[^>]*>.*?</Dropdown>|<Dropdown[^>]*/?>',
            'Menu': r'<Menu[^>]*>.*?</Menu>|<Menu[^>]*/?>',
            'Tab': r'<Tab[^>]*>.*?</Tab>|<Tab[^>]*/?>',
            'Accordion': r'<Accordion[^>]*>.*?</Accordion>|<Accordion[^>]*/?>',
            'Card': r'<Card[^>]*>.*?</Card>|<Card[^>]*/?>',
        }

        # Handler patterns
        self.handler_patterns = [
            r'onClick\s*=\s*\{([^}]+)\}',
            r'onSubmit\s*=\s*\{([^}]+)\}',
            r'onChange\s*=\s*\{([^}]+)\}',
            r'onFocus\s*=\s*\{([^}]+)\}',
            r'onBlur\s*=\s*\{([^}]+)\}',
            r'onKeyPress\s*=\s*\{([^}]+)\}',
            r'onKeyDown\s*=\s*\{([^}]+)\}',
            r'onMouseEnter\s*=\s*\{([^}]+)\}',
            r'onMouseLeave\s*=\s*\{([^}]+)\}',
        ]

    def get_component_name(self, file_path: Path) -> str:
        """Extract component name from file"""
        content = file_path.read_text(encoding='utf-8', errors='ignore')

        # Try to find export default or export function
        patterns = [
            r'export\s+default\s+function\s+(\w+)',
            r'export\s+function\s+(\w+)',
            r'const\s+(\w+)\s*=\s*\(',
            r'function\s+(\w+)\s*\(',
        ]

        for pattern in patterns:
            match = re.search(pattern, content)
            if match:
                return match.group(1)

        return file_path.stem

    def extract_label_text(self, element_str: str) -> str:
        """Extract visible text/label from element"""
        # Try to find text content
        text_match = re.search(r'>([^<]+)</', element_str)
        if text_match:
            return text_match.group(1).strip()

        # Try to find label/placeholder/value attributes
        for attr in ['label', 'placeholder', 'value', 'title', 'aria-label']:
            attr_match = re.search(f'{attr}=["\']([^"\']+)["\']', element_str)
            if attr_match:
                return attr_match.group(1)

        # Try to find children prop
        children_match = re.search(r'children=\{([^}]+)\}', element_str)
        if children_match:
            return children_match.group(1)

        return 'No label found'

    def extract_handlers(self, element_str: str) -> str:
        """Extract all event handlers"""
        handlers = []
        for pattern in self.handler_patterns:
            matches = re.finditer(pattern, element_str)
            for match in matches:
                handlers.append(match.group(0))
        return '; '.join(handlers) if handlers else 'No handler'

    def extract_props(self, element_str: str) -> str:
        """Extract all props from element"""
        props = []
        prop_pattern = r'(\w+)=\{([^}]+)\}|(\w+)="([^"]+)"'
        matches = re.finditer(prop_pattern, element_str)
        for match in matches:
            if match.group(1):
                props.append(f'{match.group(1)}={{{match.group(2)}}}')
            elif match.group(3):
                props.append(f'{match.group(3)}="{match.group(4)}"')
        return ' '.join(props[:5])  # Limit to first 5 props

    def get_context(self, content: str, line_num: int) -> str:
        """Get surrounding context for element"""
        lines = content.split('\n')
        start = max(0, line_num - 3)
        end = min(len(lines), line_num + 2)
        context_lines = lines[start:end]
        return ' | '.join([l.strip() for l in context_lines if l.strip()])[:200]

    def scan_file(self, file_path: Path) -> None:
        """Scan a single file for UI elements"""
        try:
            content = file_path.read_text(encoding='utf-8', errors='ignore')
            component_name = self.get_component_name(file_path)

            for element_type, pattern in self.patterns.items():
                matches = re.finditer(pattern, content, re.DOTALL | re.IGNORECASE)

                for match in matches:
                    element_str = match.group(0)

                    # Find line number
                    line_num = content[:match.start()].count('\n') + 1

                    # Extract information
                    label = self.extract_label_text(element_str)
                    handler = self.extract_handlers(element_str)
                    props = self.extract_props(element_str)
                    context = self.get_context(content, line_num)

                    element = UIElement(
                        element_type=element_type,
                        file_path=str(file_path.relative_to(self.root_dir)),
                        line_number=line_num,
                        label_text=label[:100],
                        handler_action=handler[:200],
                        context=context,
                        test_coverage='Unknown',
                        component_name=component_name,
                        props=props[:200]
                    )

                    self.elements.append(element)

        except Exception as e:
            print(f"Error scanning {file_path}: {e}")

    def scan_directory(self) -> None:
        """Scan all TypeScript/React files in directory"""
        # Find all .tsx and .ts files
        ts_files = list(self.root_dir.glob('**/*.tsx')) + list(self.root_dir.glob('**/*.ts'))

        # Filter out node_modules, dist, build
        ts_files = [
            f for f in ts_files
            if 'node_modules' not in str(f)
            and 'dist' not in str(f)
            and 'build' not in str(f)
            and '.next' not in str(f)
        ]

        print(f"Found {len(ts_files)} TypeScript/React files to scan")

        # Scan each file with progress bar
        for file_path in tqdm(ts_files, desc="Scanning files"):
            self.scan_file(file_path)

    def cross_reference_tests(self, test_dir: Path) -> None:
        """Cross-reference elements with test files"""
        test_files = list(test_dir.glob('**/*.test.tsx')) + \
                     list(test_dir.glob('**/*.test.ts')) + \
                     list(test_dir.glob('**/*.spec.tsx')) + \
                     list(test_dir.glob('**/*.spec.ts'))

        print(f"\nFound {len(test_files)} test files")

        # Build test coverage map
        test_coverage_map = {}
        for test_file in tqdm(test_files, desc="Analyzing tests"):
            try:
                content = test_file.read_text(encoding='utf-8', errors='ignore')

                # Extract tested components
                import_matches = re.finditer(r'from\s+["\'](.+?)["\']', content)
                for match in import_matches:
                    imported_path = match.group(1)
                    if not imported_path.startswith('.'):
                        continue
                    test_coverage_map[imported_path] = test_file.name

            except Exception as e:
                print(f"Error reading test file {test_file}: {e}")

        # Update elements with test coverage
        for element in self.elements:
            file_path_key = element.file_path.replace('.tsx', '').replace('.ts', '')

            # Check if component is tested
            tested = False
            for test_path, test_file in test_coverage_map.items():
                if element.component_name.lower() in test_path.lower() or \
                   Path(element.file_path).stem.lower() in test_path.lower():
                    element.test_coverage = f'Tested in {test_file}'
                    tested = True
                    break

            if not tested:
                element.test_coverage = 'NOT TESTED'

    def export_to_csv(self, output_path: Path) -> None:
        """Export results to CSV"""
        with open(output_path, 'w', newline='', encoding='utf-8') as csvfile:
            if not self.elements:
                print("No elements found!")
                return

            fieldnames = list(asdict(self.elements[0]).keys())
            writer = csv.DictWriter(csvfile, fieldnames=fieldnames)

            writer.writeheader()
            for element in self.elements:
                writer.writerow(asdict(element))

        print(f"\n✓ Exported {len(self.elements)} elements to {output_path}")

    def export_to_json(self, output_path: Path) -> None:
        """Export results to JSON"""
        data = [asdict(e) for e in self.elements]
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2)

        print(f"✓ Exported JSON to {output_path}")

    def generate_statistics(self) -> Dict[str, Any]:
        """Generate statistics about UI elements"""
        stats = {
            'total_elements': len(self.elements),
            'elements_by_type': {},
            'elements_with_handlers': 0,
            'elements_without_handlers': 0,
            'tested_elements': 0,
            'untested_elements': 0,
            'files_scanned': len(set(e.file_path for e in self.elements)),
            'components_found': len(set(e.component_name for e in self.elements))
        }

        for element in self.elements:
            # Count by type
            stats['elements_by_type'][element.element_type] = \
                stats['elements_by_type'].get(element.element_type, 0) + 1

            # Count handlers
            if element.handler_action != 'No handler':
                stats['elements_with_handlers'] += 1
            else:
                stats['elements_without_handlers'] += 1

            # Count test coverage
            if element.test_coverage != 'NOT TESTED' and element.test_coverage != 'Unknown':
                stats['tested_elements'] += 1
            else:
                stats['untested_elements'] += 1

        return stats

def main():
    print("=" * 80)
    print("COMPREHENSIVE UI ELEMENT SCANNER")
    print("=" * 80)

    # Configuration
    root_dir = Path(__file__).parent.parent / 'src'
    test_dir = Path(__file__).parent.parent / 'src'
    output_dir = Path(__file__).parent.parent / 'remediation-data'

    output_dir.mkdir(exist_ok=True)

    # Initialize scanner
    scanner = ComprehensiveUIScanner(root_dir)

    # Scan all files
    print("\n[1/4] Scanning TypeScript/React files...")
    scanner.scan_directory()

    # Cross-reference with tests
    print("\n[2/4] Cross-referencing with test files...")
    scanner.cross_reference_tests(test_dir)

    # Export results
    print("\n[3/4] Exporting results...")
    scanner.export_to_csv(output_dir / 'COMPLETE_UI_INVENTORY.csv')
    scanner.export_to_json(output_dir / 'COMPLETE_UI_INVENTORY.json')

    # Generate statistics
    print("\n[4/4] Generating statistics...")
    stats = scanner.generate_statistics()

    with open(output_dir / 'UI_SCAN_STATISTICS.json', 'w') as f:
        json.dump(stats, f, indent=2)

    # Print summary
    print("\n" + "=" * 80)
    print("SCAN COMPLETE")
    print("=" * 80)
    print(f"Total UI Elements Found: {stats['total_elements']}")
    print(f"Files Scanned: {stats['files_scanned']}")
    print(f"Components Found: {stats['components_found']}")
    print(f"Elements with Handlers: {stats['elements_with_handlers']}")
    print(f"Elements without Handlers: {stats['elements_without_handlers']}")
    print(f"Tested Elements: {stats['tested_elements']}")
    print(f"Untested Elements: {stats['untested_elements']}")
    print("\nElements by Type:")
    for elem_type, count in sorted(stats['elements_by_type'].items(), key=lambda x: -x[1]):
        print(f"  {elem_type}: {count}")
    print("=" * 80)

if __name__ == '__main__':
    main()
