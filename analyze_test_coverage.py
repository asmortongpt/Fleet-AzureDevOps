#!/usr/bin/env python3
"""
Fleet Management System - Test Coverage Analyzer
Cross-references UI elements with test files
"""

import os
import re
import json
import csv
from pathlib import Path
from typing import Dict, List, Set
from collections import defaultdict

class TestCoverageAnalyzer:
    def __init__(self, root_dir: str):
        self.root_dir = Path(root_dir)
        self.test_files: Dict[str, str] = {}
        self.test_coverage: Dict[str, List[str]] = defaultdict(list)
        self.routes: List[Dict] = []
        self.api_endpoints: List[Dict] = []

    def scan_test_files(self):
        """Scan all test files and extract what they test"""
        test_patterns = [
            "**/*.test.ts",
            "**/*.test.tsx",
            "**/*.spec.ts",
            "**/*.spec.tsx",
        ]

        for pattern in test_patterns:
            for test_file in self.root_dir.rglob(pattern):
                print(f"Scanning test: {test_file.relative_to(self.root_dir)}")
                try:
                    with open(test_file, 'r', encoding='utf-8') as f:
                        content = f.read()
                        self.test_files[str(test_file.relative_to(self.root_dir))] = content

                        # Extract describe/it blocks
                        describe_matches = re.findall(r'describe\([\'"]([^\'"]+)[\'"]', content)
                        it_matches = re.findall(r'it\([\'"]([^\'"]+)[\'"]', content)
                        test_matches = re.findall(r'test\([\'"]([^\'"]+)[\'"]', content)

                        # Extract components being tested
                        import_matches = re.findall(r'import.*from\s+[\'"]([^\'"]+)[\'"]', content)
                        render_matches = re.findall(r'render\(<(\w+)', content)

                        file_key = str(test_file.relative_to(self.root_dir))
                        self.test_coverage[file_key] = {
                            'describes': describe_matches,
                            'tests': it_matches + test_matches,
                            'imports': import_matches,
                            'renders': render_matches,
                        }
                except Exception as e:
                    print(f"Error reading {test_file}: {e}")

    def scan_routes(self):
        """Scan route definitions"""
        route_files = [
            'src/App.tsx',
            'src/lib/navigation.tsx',
            'src/lib/navigation.ts',
            'src/router/index.tsx',
        ]

        for route_file in route_files:
            file_path = self.root_dir / route_file
            if not file_path.exists():
                continue

            print(f"Scanning routes: {route_file}")
            try:
                with open(file_path, 'r', encoding='utf-8') as f:
                    content = f.read()

                    # Extract route definitions
                    # Pattern: path="/something"
                    path_matches = re.findall(r'path=[\'"]([^\'"]+)[\'"]', content)

                    # Pattern: { path: '/something', component: Something }
                    object_routes = re.findall(r'\{\s*path:\s*[\'"]([^\'"]+)[\'"].*?component:\s*(\w+)', content, re.DOTALL)

                    # Pattern: lazy(() => import('./pages/Something'))
                    lazy_imports = re.findall(r'lazy\(\(\)\s*=>\s*import\([\'"]([^\'"]+)[\'"]', content)

                    for path in path_matches:
                        self.routes.append({
                            'path': path,
                            'file': route_file,
                            'type': 'path_attribute'
                        })

                    for path, component in object_routes:
                        self.routes.append({
                            'path': path,
                            'component': component,
                            'file': route_file,
                            'type': 'object_route'
                        })

                    for import_path in lazy_imports:
                        self.routes.append({
                            'import': import_path,
                            'file': route_file,
                            'type': 'lazy_import'
                        })

            except Exception as e:
                print(f"Error reading {file_path}: {e}")

    def scan_api_endpoints(self):
        """Scan API endpoint definitions"""
        api_files = [
            'src/hooks/use-api.ts',
            'src/lib/api.ts',
            'src/lib/api-client.ts',
        ]

        for api_file in api_files:
            file_path = self.root_dir / api_file
            if not file_path.exists():
                continue

            print(f"Scanning API: {api_file}")
            try:
                with open(file_path, 'r', encoding='utf-8') as f:
                    content = f.read()

                    # Extract fetch/axios calls
                    fetch_matches = re.findall(r'fetch\([\'"`]([^\'"` ]+)[\'"`]', content)
                    axios_matches = re.findall(r'axios\.(get|post|put|patch|delete)\([\'"`]([^\'"` ]+)[\'"`]', content)

                    # Extract endpoint constants
                    endpoint_matches = re.findall(r'[\'"`](/api/[^\'"` ]+)[\'"`]', content)

                    for url in fetch_matches:
                        self.api_endpoints.append({
                            'endpoint': url,
                            'method': 'GET',
                            'file': api_file,
                            'type': 'fetch'
                        })

                    for method, url in axios_matches:
                        self.api_endpoints.append({
                            'endpoint': url,
                            'method': method.upper(),
                            'file': api_file,
                            'type': 'axios'
                        })

                    for endpoint in endpoint_matches:
                        if not any(e['endpoint'] == endpoint for e in self.api_endpoints):
                            self.api_endpoints.append({
                                'endpoint': endpoint,
                                'method': 'UNKNOWN',
                                'file': api_file,
                                'type': 'constant'
                            })

            except Exception as e:
                print(f"Error reading {file_path}: {e}")

    def match_coverage(self, inventory_file: str):
        """Match UI elements with test coverage"""
        coverage_results = []

        with open(inventory_file, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)

            for row in reader:
                file_path = row['file_path']
                element_type = row['element_type']
                label = row['label']

                # Check if this file has a corresponding test
                test_status = "NOT COVERED"
                test_file = None
                test_details = []

                # Look for test file with same name
                base_name = file_path.replace('.tsx', '').replace('.ts', '')
                possible_test_files = [
                    f"{base_name}.test.tsx",
                    f"{base_name}.test.ts",
                    f"{base_name}.spec.tsx",
                    f"{base_name}.spec.ts",
                ]

                # Also check __tests__ directory
                if '/' in file_path:
                    parts = file_path.rsplit('/', 1)
                    possible_test_files.extend([
                        f"{parts[0]}/__tests__/{parts[1].replace('.tsx', '.test.tsx')}",
                        f"{parts[0]}/__tests__/{parts[1].replace('.tsx', '.spec.tsx')}",
                    ])

                for test_path in possible_test_files:
                    if test_path in self.test_coverage:
                        test_status = "COVERED"
                        test_file = test_path
                        test_details = self.test_coverage[test_path]
                        break

                # Check if element label appears in any test
                if label and test_status == "NOT COVERED":
                    for test_path, test_content in self.test_files.items():
                        if label in test_content:
                            test_status = "PARTIALLY COVERED"
                            test_file = test_path
                            break

                coverage_results.append({
                    **row,
                    'test_status': test_status,
                    'test_file': test_file or '',
                    'test_count': len(test_details.get('tests', [])) if test_details else 0
                })

        return coverage_results

    def export_coverage_report(self, coverage_results: List[Dict], output_file: str):
        """Export coverage report"""
        with open(output_file, 'w', newline='', encoding='utf-8') as f:
            if coverage_results:
                fieldnames = coverage_results[0].keys()
                writer = csv.DictWriter(f, fieldnames=fieldnames)
                writer.writeheader()
                writer.writerows(coverage_results)

        print(f"Exported coverage report to {output_file}")

    def export_routes(self, output_file: str):
        """Export routes to JSON"""
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(self.routes, f, indent=2)
        print(f"Exported {len(self.routes)} routes to {output_file}")

    def export_endpoints(self, output_file: str):
        """Export API endpoints to JSON"""
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(self.api_endpoints, f, indent=2)
        print(f"Exported {len(self.api_endpoints)} endpoints to {output_file}")

    def get_statistics(self, coverage_results: List[Dict]) -> Dict:
        """Calculate coverage statistics"""
        stats = {
            'total_elements': len(coverage_results),
            'covered': 0,
            'partially_covered': 0,
            'not_covered': 0,
            'total_routes': len(self.routes),
            'total_endpoints': len(self.api_endpoints),
            'total_test_files': len(self.test_files),
        }

        for result in coverage_results:
            status = result['test_status']
            if status == "COVERED":
                stats['covered'] += 1
            elif status == "PARTIALLY COVERED":
                stats['partially_covered'] += 1
            else:
                stats['not_covered'] += 1

        stats['coverage_percentage'] = (stats['covered'] / stats['total_elements'] * 100) if stats['total_elements'] > 0 else 0

        return stats

if __name__ == "__main__":
    root_dir = "/Users/andrewmorton/Documents/GitHub/Fleet"
    analyzer = TestCoverageAnalyzer(root_dir)

    print("="*80)
    print("FLEET MANAGEMENT SYSTEM - TEST COVERAGE ANALYSIS")
    print("="*80)
    print()

    print("Scanning test files...")
    analyzer.scan_test_files()

    print("\nScanning routes...")
    analyzer.scan_routes()

    print("\nScanning API endpoints...")
    analyzer.scan_api_endpoints()

    print("\nMatching coverage...")
    coverage_results = analyzer.match_coverage(f"{root_dir}/COMPLETE_INVENTORY.csv")

    print("\nExporting results...")
    analyzer.export_coverage_report(coverage_results, f"{root_dir}/COMPLETE_INVENTORY_WITH_COVERAGE.csv")
    analyzer.export_routes(f"{root_dir}/ROUTES_INVENTORY.json")
    analyzer.export_endpoints(f"{root_dir}/API_ENDPOINTS_INVENTORY.json")

    # Statistics
    stats = analyzer.get_statistics(coverage_results)
    print("\n" + "="*80)
    print("COVERAGE STATISTICS")
    print("="*80)
    print(f"Total UI Elements: {stats['total_elements']}")
    print(f"Covered: {stats['covered']} ({stats['covered']/stats['total_elements']*100:.1f}%)")
    print(f"Partially Covered: {stats['partially_covered']} ({stats['partially_covered']/stats['total_elements']*100:.1f}%)")
    print(f"Not Covered: {stats['not_covered']} ({stats['not_covered']/stats['total_elements']*100:.1f}%)")
    print(f"\nTotal Routes: {stats['total_routes']}")
    print(f"Total API Endpoints: {stats['total_endpoints']}")
    print(f"Total Test Files: {stats['total_test_files']}")
    print(f"\nOverall Coverage: {stats['coverage_percentage']:.1f}%")
