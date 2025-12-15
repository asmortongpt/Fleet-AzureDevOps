#!/usr/bin/env python3
"""
Test Coverage Analyzer
Maps test coverage across all components, routes, and UI elements
"""

import os
import re
import json
from pathlib import Path
from typing import List, Dict, Any, Set
from dataclasses import dataclass, asdict
from tqdm import tqdm
import csv

@dataclass
class TestFile:
    file_path: str
    test_count: int
    tested_components: List[str]
    test_types: List[str]  # unit, integration, e2e
    coverage_percentage: float
    assertions: int

@dataclass
class CoverageGap:
    item_type: str  # 'component', 'route', 'ui_element'
    item_name: str
    file_path: str
    priority: str  # 'critical', 'high', 'medium', 'low'
    reason: str
    suggested_tests: List[str]

class TestCoverageAnalyzer:
    def __init__(self, root_dir: str):
        self.root_dir = Path(root_dir)
        self.test_files: List[TestFile] = []
        self.coverage_gaps: List[CoverageGap] = []
        self.component_coverage: Dict[str, bool] = {}

    def scan_test_files(self) -> None:
        """Scan all test files"""
        print("\nScanning test files...")

        test_patterns = ['**/*.test.tsx', '**/*.test.ts', '**/*.spec.tsx', '**/*.spec.ts']
        test_files = []

        for pattern in test_patterns:
            test_files.extend(self.root_dir.glob(pattern))

        # Filter out node_modules
        test_files = [f for f in test_files if 'node_modules' not in str(f)]

        print(f"Found {len(test_files)} test files")

        for test_file in tqdm(test_files, desc="Analyzing test files"):
            self.analyze_test_file(test_file)

    def analyze_test_file(self, test_file: Path) -> None:
        """Analyze a single test file"""
        try:
            content = test_file.read_text(encoding='utf-8', errors='ignore')

            # Count tests
            test_count = len(re.findall(r'\b(test|it)\s*\(', content))

            # Extract tested components
            tested_components = []
            import_matches = re.finditer(r'from\s+["\'](.+?)["\']', content)
            for match in import_matches:
                import_path = match.group(1)
                if import_path.startswith('.'):
                    tested_components.append(import_path)

            # Determine test types
            test_types = []
            if 'render' in content or 'screen' in content:
                test_types.append('integration')
            if 'expect' in content:
                test_types.append('unit')
            if 'page.' in content or 'browser.' in content:
                test_types.append('e2e')

            # Count assertions
            assertions = len(re.findall(r'\bexpect\s*\(', content))

            # Estimate coverage
            coverage_percentage = min(100.0, (test_count * 10 + assertions * 5))

            test = TestFile(
                file_path=str(test_file.relative_to(self.root_dir)),
                test_count=test_count,
                tested_components=tested_components,
                test_types=test_types,
                coverage_percentage=coverage_percentage,
                assertions=assertions
            )

            self.test_files.append(test)

            # Update component coverage map
            for component in tested_components:
                self.component_coverage[component] = True

        except Exception as e:
            print(f"Error analyzing {test_file}: {e}")

    def cross_reference_ui_elements(self, ui_inventory_path: Path) -> None:
        """Cross-reference UI elements with tests"""
        print("\nCross-referencing UI elements with tests...")

        if not ui_inventory_path.exists():
            print(f"Warning: {ui_inventory_path} not found")
            return

        with open(ui_inventory_path, 'r', encoding='utf-8') as f:
            ui_elements = json.load(f)

        print(f"Analyzing {len(ui_elements)} UI elements...")

        for element in tqdm(ui_elements, desc="Checking UI coverage"):
            file_path = element.get('file_path', '')
            component_name = element.get('component_name', '')
            element_type = element.get('element_type', '')
            test_coverage = element.get('test_coverage', 'Unknown')

            # Check if component is tested
            is_tested = any(
                file_path.replace('.tsx', '') in comp or component_name.lower() in comp.lower()
                for comp in self.component_coverage.keys()
            )

            if not is_tested and test_coverage in ['NOT TESTED', 'Unknown']:
                priority = self.determine_priority(element_type, element.get('handler_action', ''))

                gap = CoverageGap(
                    item_type='ui_element',
                    item_name=f"{component_name}.{element_type}",
                    file_path=file_path,
                    priority=priority,
                    reason=f"{element_type} without test coverage",
                    suggested_tests=[
                        f"Test {element_type} rendering",
                        f"Test {element_type} interactions",
                        f"Test {element_type} accessibility"
                    ]
                )

                self.coverage_gaps.append(gap)

    def cross_reference_routes(self, routes_path: Path) -> None:
        """Cross-reference routes with tests"""
        print("\nCross-referencing routes with tests...")

        if not routes_path.exists():
            print(f"Warning: {routes_path} not found")
            return

        with open(routes_path, 'r', encoding='utf-8') as f:
            routes = json.load(f)

        print(f"Analyzing {len(routes)} routes...")

        for route in tqdm(routes, desc="Checking route coverage"):
            component = route.get('component', '')
            path = route.get('path', '')
            file_path = route.get('file_path', '')

            # Check if route component is tested
            is_tested = any(
                component.lower() in comp.lower() or
                file_path.replace('.tsx', '') in comp
                for comp in self.component_coverage.keys()
            )

            if not is_tested:
                priority = 'critical' if route.get('requires_auth', False) else 'high'

                gap = CoverageGap(
                    item_type='route',
                    item_name=f"{path} ({component})",
                    file_path=file_path,
                    priority=priority,
                    reason="Route without test coverage",
                    suggested_tests=[
                        f"Test route navigation to {path}",
                        f"Test {component} page loading",
                        f"Test {component} error states",
                        f"Test {component} authentication" if route.get('requires_auth') else None
                    ]
                )
                gap.suggested_tests = [t for t in gap.suggested_tests if t]

                self.coverage_gaps.append(gap)

    def scan_untested_components(self) -> None:
        """Find all components without tests"""
        print("\nScanning for untested components...")

        # Find all component files
        component_files = list(self.root_dir.glob('**/*.tsx')) + list(self.root_dir.glob('**/*.ts'))
        component_files = [
            f for f in component_files
            if 'node_modules' not in str(f)
            and '.test.' not in str(f)
            and '.spec.' not in str(f)
            and 'dist' not in str(f)
        ]

        print(f"Scanning {len(component_files)} component files...")

        for comp_file in tqdm(component_files, desc="Checking components"):
            relative_path = str(comp_file.relative_to(self.root_dir))

            # Check if component has tests
            is_tested = any(
                relative_path.replace('.tsx', '') in comp or
                comp_file.stem.lower() in comp.lower()
                for comp in self.component_coverage.keys()
            )

            if not is_tested:
                # Determine if this is a page, component, or utility
                if 'pages' in relative_path or 'app' in relative_path:
                    priority = 'critical'
                    item_type = 'page_component'
                elif 'components' in relative_path:
                    priority = 'high'
                    item_type = 'component'
                else:
                    priority = 'medium'
                    item_type = 'utility'

                gap = CoverageGap(
                    item_type=item_type,
                    item_name=comp_file.stem,
                    file_path=relative_path,
                    priority=priority,
                    reason=f"No test file found for {item_type}",
                    suggested_tests=[
                        f"Create {comp_file.stem}.test.tsx",
                        f"Test component rendering",
                        f"Test component props",
                        f"Test component interactions"
                    ]
                )

                self.coverage_gaps.append(gap)

    def determine_priority(self, element_type: str, handler: str) -> str:
        """Determine priority for coverage gap"""
        critical_types = ['Button', 'Form', 'Input', 'Link']
        high_types = ['Select', 'Checkbox', 'Radio', 'Textarea']

        if element_type in critical_types:
            return 'critical'
        elif element_type in high_types:
            return 'high'
        elif 'onClick' in handler or 'onSubmit' in handler:
            return 'high'
        else:
            return 'medium'

    def generate_coverage_report(self) -> Dict[str, Any]:
        """Generate comprehensive coverage report"""
        total_tests = sum(t.test_count for t in self.test_files)
        total_assertions = sum(t.assertions for t in self.test_files)

        test_types_count = {}
        for test in self.test_files:
            for test_type in test.test_types:
                test_types_count[test_type] = test_types_count.get(test_type, 0) + 1

        gaps_by_priority = {}
        for gap in self.coverage_gaps:
            gaps_by_priority[gap.priority] = gaps_by_priority.get(gap.priority, 0) + 1

        gaps_by_type = {}
        for gap in self.coverage_gaps:
            gaps_by_type[gap.item_type] = gaps_by_type.get(gap.item_type, 0) + 1

        report = {
            'test_statistics': {
                'total_test_files': len(self.test_files),
                'total_tests': total_tests,
                'total_assertions': total_assertions,
                'test_types': test_types_count,
                'average_tests_per_file': total_tests / len(self.test_files) if self.test_files else 0
            },
            'coverage_gaps': {
                'total_gaps': len(self.coverage_gaps),
                'by_priority': gaps_by_priority,
                'by_type': gaps_by_type,
                'critical_count': gaps_by_priority.get('critical', 0),
                'high_count': gaps_by_priority.get('high', 0),
                'medium_count': gaps_by_priority.get('medium', 0),
                'low_count': gaps_by_priority.get('low', 0)
            },
            'recommendations': {
                'immediate_action': gaps_by_priority.get('critical', 0),
                'next_sprint': gaps_by_priority.get('high', 0),
                'backlog': gaps_by_priority.get('medium', 0) + gaps_by_priority.get('low', 0)
            }
        }

        return report

    def export_results(self, output_dir: Path) -> None:
        """Export all coverage analysis results"""
        output_dir.mkdir(exist_ok=True)

        # Export test files
        with open(output_dir / 'TEST_FILES_ANALYSIS.json', 'w', encoding='utf-8') as f:
            json.dump([asdict(t) for t in self.test_files], f, indent=2)

        # Export coverage gaps as JSON
        with open(output_dir / 'TEST_COVERAGE_GAPS.json', 'w', encoding='utf-8') as f:
            json.dump([asdict(g) for g in self.coverage_gaps], f, indent=2)

        # Export coverage gaps as CSV
        if self.coverage_gaps:
            with open(output_dir / 'TEST_COVERAGE_GAPS.csv', 'w', newline='', encoding='utf-8') as f:
                fieldnames = list(asdict(self.coverage_gaps[0]).keys())
                writer = csv.DictWriter(f, fieldnames=fieldnames)
                writer.writeheader()
                for gap in self.coverage_gaps:
                    row = asdict(gap)
                    row['suggested_tests'] = '; '.join(row['suggested_tests'])
                    writer.writerow(row)

        # Export coverage report
        report = self.generate_coverage_report()
        with open(output_dir / 'TEST_COVERAGE_REPORT.json', 'w', encoding='utf-8') as f:
            json.dump(report, f, indent=2)

        print(f"\n✓ Exported coverage analysis to {output_dir}")

def main():
    print("=" * 80)
    print("COMPREHENSIVE TEST COVERAGE ANALYZER")
    print("=" * 80)

    # Configuration
    root_dir = Path(__file__).parent.parent / 'src'
    output_dir = Path(__file__).parent.parent / 'remediation-data'

    # Initialize analyzer
    analyzer = TestCoverageAnalyzer(root_dir)

    # Scan test files
    print("\n[1/5] Scanning test files...")
    analyzer.scan_test_files()

    # Cross-reference with UI elements
    print("\n[2/5] Cross-referencing UI elements...")
    ui_path = output_dir / 'COMPLETE_UI_INVENTORY.json'
    analyzer.cross_reference_ui_elements(ui_path)

    # Cross-reference with routes
    print("\n[3/5] Cross-referencing routes...")
    routes_path = output_dir / 'ROUTE_ANALYSIS.json'
    analyzer.cross_reference_routes(routes_path)

    # Scan for untested components
    print("\n[4/5] Scanning for untested components...")
    analyzer.scan_untested_components()

    # Export results
    print("\n[5/5] Exporting results...")
    analyzer.export_results(output_dir)

    # Generate and print report
    report = analyzer.generate_coverage_report()

    print("\n" + "=" * 80)
    print("TEST COVERAGE ANALYSIS COMPLETE")
    print("=" * 80)
    print(f"Total Test Files: {report['test_statistics']['total_test_files']}")
    print(f"Total Tests: {report['test_statistics']['total_tests']}")
    print(f"Total Assertions: {report['test_statistics']['total_assertions']}")
    print(f"\nTest Types:")
    for test_type, count in report['test_statistics']['test_types'].items():
        print(f"  {test_type}: {count}")
    print(f"\nCoverage Gaps: {report['coverage_gaps']['total_gaps']}")
    print(f"  Critical: {report['coverage_gaps']['critical_count']}")
    print(f"  High: {report['coverage_gaps']['high_count']}")
    print(f"  Medium: {report['coverage_gaps']['medium_count']}")
    print(f"  Low: {report['coverage_gaps']['low_count']}")
    print(f"\nRecommendations:")
    print(f"  Immediate Action: {report['recommendations']['immediate_action']} items")
    print(f"  Next Sprint: {report['recommendations']['next_sprint']} items")
    print(f"  Backlog: {report['recommendations']['backlog']} items")
    print("=" * 80)

if __name__ == '__main__':
    main()
