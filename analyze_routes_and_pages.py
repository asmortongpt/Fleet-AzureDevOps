#!/usr/bin/env python3
"""
Fleet Management System - Route and Page Analysis
Analyzes all routes, pages, and navigation flows
"""

import os
import re
import json
from pathlib import Path
from typing import Dict, List

class RouteAnalyzer:
    def __init__(self, root_dir: str):
        self.root_dir = Path(root_dir)
        self.routes = []
        self.pages = []
        self.lazy_imports = []

    def analyze_app_tsx(self):
        """Analyze main App.tsx for lazy loaded modules"""
        app_file = self.root_dir / "src" / "App.tsx"

        try:
            with open(app_file, 'r', encoding='utf-8') as f:
                content = f.read()

                # Extract lazy imports
                lazy_pattern = r'const\s+(\w+)\s*=\s*lazy\(\s*\(\)\s*=>\s*import\([\'"]([^\'"]+)[\'"]'
                matches = re.findall(lazy_pattern, content)

                for component_name, import_path in matches:
                    self.lazy_imports.append({
                        'component': component_name,
                        'path': import_path,
                        'type': 'lazy_module'
                    })

        except Exception as e:
            print(f"Error analyzing App.tsx: {e}")

    def analyze_navigation_file(self):
        """Analyze navigation.tsx for navigation registry"""
        nav_files = [
            self.root_dir / "src" / "lib" / "navigation.tsx",
            self.root_dir / "src" / "lib" / "navigation.ts",
        ]

        for nav_file in nav_files:
            if not nav_file.exists():
                continue

            try:
                with open(nav_file, 'r', encoding='utf-8') as f:
                    content = f.read()

                    # Extract navigation items
                    # Pattern: { id: "something", label: "Something", icon: ..., section: "main" }
                    item_pattern = r'\{\s*id:\s*[\'"]([^\'"]+)[\'"].*?label:\s*[\'"]([^\'"]+)[\'"].*?section:\s*[\'"]([^\'"]+)[\'"]'
                    matches = re.findall(item_pattern, content, re.DOTALL)

                    for module_id, label, section in matches:
                        self.routes.append({
                            'id': module_id,
                            'label': label,
                            'section': section,
                            'type': 'navigation_item',
                            'file': str(nav_file.relative_to(self.root_dir))
                        })

            except Exception as e:
                print(f"Error analyzing {nav_file}: {e}")

    def analyze_pages_directory(self):
        """Analyze all page files"""
        pages_dir = self.root_dir / "src" / "pages"

        if not pages_dir.exists():
            return

        for page_file in pages_dir.rglob("*.tsx"):
            try:
                with open(page_file, 'r', encoding='utf-8') as f:
                    content = f.read()

                    # Extract component name
                    component_match = re.search(r'export\s+(?:default\s+)?(?:const|function)\s+(\w+)', content)
                    component_name = component_match.group(1) if component_match else page_file.stem

                    # Look for routes defined within the page
                    route_matches = re.findall(r'<Route[^>]*path=[\'"]([^\'"]+)[\'"]', content)

                    # Check for auth requirements
                    requires_auth = 'authenticateJWT' in content or 'useAuth' in content or 'ProtectedRoute' in content

                    # Check for permissions
                    permission_matches = re.findall(r'requirePermission\([\'"]([^\'"]+)[\'"]', content)

                    self.pages.append({
                        'file': str(page_file.relative_to(self.root_dir)),
                        'component': component_name,
                        'routes': route_matches,
                        'requires_auth': requires_auth,
                        'permissions': permission_matches,
                    })

            except Exception as e:
                print(f"Error analyzing {page_file}: {e}")

    def analyze_hub_pages(self):
        """Analyze hub pages specifically"""
        hubs = [
            'FleetHub',
            'OperationsHub',
            'PeopleHub',
            'WorkHub',
            'InsightsHub',
        ]

        for hub in hubs:
            hub_file = self.root_dir / "src" / "pages" / "hubs" / f"{hub}.tsx"
            if hub_file.exists():
                try:
                    with open(hub_file, 'r', encoding='utf-8') as f:
                        content = f.read()

                        # Extract sub-modules/features within hub
                        tab_matches = re.findall(r'<Tab[^>]*value=[\'"]([^\'"]+)[\'"]', content)
                        section_matches = re.findall(r'<.*?title=[\'"]([^\'"]+)[\'"]', content)

                        self.pages.append({
                            'file': str(hub_file.relative_to(self.root_dir)),
                            'component': hub,
                            'type': 'hub',
                            'tabs': tab_matches,
                            'sections': section_matches,
                        })

                except Exception as e:
                    print(f"Error analyzing {hub_file}: {e}")

    def generate_report(self) -> Dict:
        """Generate comprehensive route analysis report"""
        report = {
            'total_lazy_imports': len(self.lazy_imports),
            'total_navigation_items': len(self.routes),
            'total_pages': len(self.pages),
            'lazy_imports': self.lazy_imports,
            'navigation_items': self.routes,
            'pages': self.pages,
            'sections': {},
        }

        # Group navigation items by section
        for route in self.routes:
            section = route.get('section', 'unknown')
            if section not in report['sections']:
                report['sections'][section] = []
            report['sections'][section].append(route)

        # Calculate coverage
        report['coverage'] = {
            'pages_with_auth': sum(1 for p in self.pages if p.get('requires_auth', False)),
            'pages_without_auth': sum(1 for p in self.pages if not p.get('requires_auth', False)),
        }

        return report

if __name__ == "__main__":
    root_dir = "/Users/andrewmorton/Documents/GitHub/Fleet"
    analyzer = RouteAnalyzer(root_dir)

    print("="*80)
    print("FLEET MANAGEMENT SYSTEM - ROUTE & PAGE ANALYSIS")
    print("="*80)
    print()

    print("Analyzing App.tsx...")
    analyzer.analyze_app_tsx()

    print("Analyzing navigation registry...")
    analyzer.analyze_navigation_file()

    print("Analyzing pages directory...")
    analyzer.analyze_pages_directory()

    print("Analyzing hub pages...")
    analyzer.analyze_hub_pages()

    print("\nGenerating report...")
    report = analyzer.generate_report()

    # Save report
    output_file = f"{root_dir}/ROUTES_AND_PAGES_ANALYSIS.json"
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(report, f, indent=2)

    print(f"\n✅ Saved route analysis to {output_file}")

    # Print summary
    print("\n" + "="*80)
    print("SUMMARY")
    print("="*80)
    print(f"Lazy-Loaded Modules: {report['total_lazy_imports']}")
    print(f"Navigation Items: {report['total_navigation_items']}")
    print(f"Page Files: {report['total_pages']}")
    print()
    print("Navigation Sections:")
    for section, items in report['sections'].items():
        print(f"  {section}: {len(items)} items")
    print()
    print(f"Pages with Auth: {report['coverage']['pages_with_auth']}/{report['total_pages']}")
    print(f"Pages without Auth: {report['coverage']['pages_without_auth']}/{report['total_pages']}")
