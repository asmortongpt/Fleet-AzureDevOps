#!/usr/bin/env python3
"""
Fleet Management System - Complete UI Element Scanner
Scans all TypeScript/TSX files and extracts EVERY interactive element
"""

import os
import re
import json
import csv
from pathlib import Path
from typing import List, Dict, Any
from dataclasses import dataclass, asdict

@dataclass
class UIElement:
    item_id: int
    element_type: str  # Button, Link, Input, Select, etc.
    file_path: str
    line_number: int
    label: str
    handler: str
    context: str
    jsx_snippet: str
    test_status: str = "UNKNOWN"

class UIElementScanner:
    def __init__(self, root_dir: str):
        self.root_dir = Path(root_dir)
        self.elements: List[UIElement] = []
        self.item_counter = 1

    def scan_file(self, file_path: Path) -> List[UIElement]:
        """Scan a single TypeScript/TSX file for UI elements"""
        elements = []

        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
                lines = content.split('\n')

            # Patterns to search for
            patterns = {
                'Button': [
                    r'<Button[^>]*>([^<]*)</Button>',
                    r'<button[^>]*>([^<]*)</button>',
                    r'<IconButton[^>]*',
                ],
                'Link': [
                    r'<Link[^>]*to="([^"]*)"[^>]*>([^<]*)</Link>',
                    r'<a[^>]*href="([^"]*)"[^>]*>([^<]*)</a>',
                    r'<NavLink[^>]*to="([^"]*)"[^>]*>',
                ],
                'Input': [
                    r'<Input[^>]*',
                    r'<input[^>]*',
                    r'<TextField[^>]*',
                ],
                'Select': [
                    r'<Select[^>]*',
                    r'<select[^>]*',
                    r'<Dropdown[^>]*',
                ],
                'Checkbox': [
                    r'<Checkbox[^>]*',
                    r'<input[^>]*type="checkbox"[^>]*',
                ],
                'Radio': [
                    r'<Radio[^>]*',
                    r'<input[^>]*type="radio"[^>]*',
                ],
                'Textarea': [
                    r'<Textarea[^>]*',
                    r'<textarea[^>]*',
                ],
                'Modal': [
                    r'<Modal[^>]*',
                    r'<Dialog[^>]*',
                    r'<AlertDialog[^>]*',
                ],
                'Table': [
                    r'<Table[^>]*',
                    r'<DataTable[^>]*',
                ],
                'Form': [
                    r'<form[^>]*',
                    r'<Form[^>]*',
                ],
                'Tab': [
                    r'<Tabs[^>]*',
                    r'<Tab[^>]*',
                    r'<TabsList[^>]*',
                ],
                'Menu': [
                    r'<Menu[^>]*',
                    r'<DropdownMenu[^>]*',
                    r'<MenuItem[^>]*',
                ],
                'Card': [
                    r'<Card[^>]*',
                ],
            }

            for line_num, line in enumerate(lines, 1):
                for elem_type, pattern_list in patterns.items():
                    for pattern in pattern_list:
                        matches = re.finditer(pattern, line, re.IGNORECASE)
                        for match in matches:
                            # Extract label and handler
                            label = self._extract_label(line, match)
                            handler = self._extract_handler(line)
                            context = self._extract_context(file_path, line_num, lines)

                            element = UIElement(
                                item_id=self.item_counter,
                                element_type=elem_type,
                                file_path=str(file_path.relative_to(self.root_dir)),
                                line_number=line_num,
                                label=label,
                                handler=handler,
                                context=context,
                                jsx_snippet=line.strip()[:200],
                                test_status="UNKNOWN"
                            )
                            elements.append(element)
                            self.item_counter += 1

        except Exception as e:
            print(f"Error scanning {file_path}: {e}")

        return elements

    def _extract_label(self, line: str, match: re.Match) -> str:
        """Extract the label/text from a UI element"""
        try:
            # Try to get text between tags
            if match.groups():
                return match.group(1)[:100] if match.group(1) else ""

            # Try to extract label prop
            label_match = re.search(r'label="([^"]*)"', line)
            if label_match:
                return label_match.group(1)

            # Try to extract aria-label
            aria_match = re.search(r'aria-label="([^"]*)"', line)
            if aria_match:
                return aria_match.group(1)

            # Try to extract title
            title_match = re.search(r'title="([^"]*)"', line)
            if title_match:
                return title_match.group(1)

            return ""
        except:
            return ""

    def _extract_handler(self, line: str) -> str:
        """Extract onClick, onChange, onSubmit handlers"""
        handlers = []

        patterns = [
            r'onClick=\{([^}]*)\}',
            r'onChange=\{([^}]*)\}',
            r'onSubmit=\{([^}]*)\}',
            r'onPress=\{([^}]*)\}',
            r'to="([^"]*)"',
            r'href="([^"]*)"',
        ]

        for pattern in patterns:
            match = re.search(pattern, line)
            if match:
                handlers.append(match.group(1))

        return ", ".join(handlers)[:200] if handlers else ""

    def _extract_context(self, file_path: Path, line_num: int, lines: List[str]) -> str:
        """Extract surrounding context to understand where this element lives"""
        # Look up to 20 lines back for component name or JSX container
        start = max(0, line_num - 20)
        context_lines = lines[start:line_num]

        # Look for function/const component declaration
        for line in reversed(context_lines):
            func_match = re.search(r'(?:export\s+)?(?:const|function)\s+(\w+)', line)
            if func_match:
                return f"In component: {func_match.group(1)}"

        return f"File: {file_path.name}"

    def scan_directory(self, dir_path: str) -> None:
        """Recursively scan a directory for all TSX/TS files"""
        path = Path(dir_path)

        for tsx_file in path.rglob("*.tsx"):
            print(f"Scanning: {tsx_file.relative_to(self.root_dir)}")
            elements = self.scan_file(tsx_file)
            self.elements.extend(elements)

        for ts_file in path.rglob("*.ts"):
            if not ts_file.name.endswith('.test.ts') and not ts_file.name.endswith('.spec.ts'):
                print(f"Scanning: {ts_file.relative_to(self.root_dir)}")
                elements = self.scan_file(ts_file)
                self.elements.extend(elements)

    def export_to_csv(self, output_path: str) -> None:
        """Export all elements to CSV"""
        with open(output_path, 'w', newline='', encoding='utf-8') as f:
            if self.elements:
                fieldnames = asdict(self.elements[0]).keys()
                writer = csv.DictWriter(f, fieldnames=fieldnames)
                writer.writeheader()
                for element in self.elements:
                    writer.writerow(asdict(element))
        print(f"Exported {len(self.elements)} elements to {output_path}")

    def export_to_json(self, output_path: str) -> None:
        """Export all elements to JSON"""
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump([asdict(e) for e in self.elements], f, indent=2)
        print(f"Exported {len(self.elements)} elements to {output_path}")

    def get_statistics(self) -> Dict[str, Any]:
        """Get summary statistics"""
        stats = {
            'total_elements': len(self.elements),
            'by_type': {},
            'by_file': {},
            'with_handlers': 0,
            'without_labels': 0,
        }

        for elem in self.elements:
            # Count by type
            stats['by_type'][elem.element_type] = stats['by_type'].get(elem.element_type, 0) + 1

            # Count by file
            stats['by_file'][elem.file_path] = stats['by_file'].get(elem.file_path, 0) + 1

            # Count with handlers
            if elem.handler:
                stats['with_handlers'] += 1

            # Count without labels
            if not elem.label:
                stats['without_labels'] += 1

        return stats

if __name__ == "__main__":
    import sys

    root_dir = "/Users/andrewmorton/Documents/GitHub/Fleet"
    scanner = UIElementScanner(root_dir)

    print("="*80)
    print("FLEET MANAGEMENT SYSTEM - COMPLETE UI ELEMENT SCAN")
    print("="*80)
    print()

    # Scan all source directories
    print("Scanning src/components...")
    scanner.scan_directory(f"{root_dir}/src/components")

    print("\nScanning src/pages...")
    scanner.scan_directory(f"{root_dir}/src/pages")

    print("\nScanning src/lib...")
    scanner.scan_directory(f"{root_dir}/src/lib")

    print("\nScanning src/hooks...")
    scanner.scan_directory(f"{root_dir}/src/hooks")

    # Export results
    print("\n" + "="*80)
    print("EXPORTING RESULTS")
    print("="*80)

    scanner.export_to_csv(f"{root_dir}/COMPLETE_INVENTORY.csv")
    scanner.export_to_json(f"{root_dir}/COMPLETE_INVENTORY.json")

    # Print statistics
    stats = scanner.get_statistics()
    print("\n" + "="*80)
    print("STATISTICS")
    print("="*80)
    print(f"Total UI Elements Found: {stats['total_elements']}")
    print(f"Elements with Handlers: {stats['with_handlers']}")
    print(f"Elements without Labels: {stats['without_labels']}")
    print()
    print("Elements by Type:")
    for elem_type, count in sorted(stats['by_type'].items(), key=lambda x: x[1], reverse=True):
        print(f"  {elem_type}: {count}")
    print()
    print("Top 10 Files by Element Count:")
    for file_path, count in sorted(stats['by_file'].items(), key=lambda x: x[1], reverse=True)[:10]:
        print(f"  {file_path}: {count}")
