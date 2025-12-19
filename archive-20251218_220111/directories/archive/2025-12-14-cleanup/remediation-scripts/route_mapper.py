#!/usr/bin/env python3
"""
Route Analyzer and Mapper
Maps ALL routes, pages, and navigation paths
"""

import os
import re
import json
from pathlib import Path
from typing import List, Dict, Any, Set
from dataclasses import dataclass, asdict
from tqdm import tqdm

@dataclass
class Route:
    route_id: str
    path: str
    component: str
    file_path: str
    requires_auth: bool
    permissions: List[str]
    states: List[str]
    lazy_loaded: bool
    parent_route: str
    route_type: str  # 'page', 'nested', 'dynamic', 'protected'
    props: Dict[str, Any]

class RouteMapper:
    def __init__(self, root_dir: str):
        self.root_dir = Path(root_dir)
        self.routes: List[Route] = []
        self.route_counter = 0

    def extract_routes_from_app(self, app_file: Path) -> None:
        """Extract routes from App.tsx"""
        print("\nAnalyzing App.tsx for route definitions...")

        if not app_file.exists():
            print(f"Warning: {app_file} not found")
            return

        content = app_file.read_text(encoding='utf-8', errors='ignore')

        # Extract lazy imports
        lazy_pattern = r'const\s+(\w+)\s*=\s*lazy\(\s*\(\)\s*=>\s*import\(["\']([^"\']+)["\']\)'
        lazy_matches = re.finditer(lazy_pattern, content)

        lazy_imports = {}
        for match in lazy_matches:
            component_name = match.group(1)
            import_path = match.group(2)
            lazy_imports[component_name] = import_path
            print(f"  Found lazy import: {component_name} -> {import_path}")

        # Extract Route components
        route_pattern = r'<Route\s+([^>]*?)(?:/>|>)'
        route_matches = re.finditer(route_pattern, content, re.DOTALL)

        for match in route_matches:
            route_props = match.group(1)

            # Extract path
            path_match = re.search(r'path=["\']([^"\']+)["\']', route_props)
            path = path_match.group(1) if path_match else '/'

            # Extract element/component
            element_match = re.search(r'element=\{<(\w+)', route_props)
            component = element_match.group(1) if element_match else 'Unknown'

            # Check if protected
            requires_auth = 'ProtectedRoute' in route_props or 'requiresAuth' in route_props

            # Get file path
            file_path = lazy_imports.get(component, 'Unknown')

            self.route_counter += 1
            route = Route(
                route_id=f'ROUTE_{self.route_counter:04d}',
                path=path,
                component=component,
                file_path=file_path,
                requires_auth=requires_auth,
                permissions=[],
                states=['loading', 'error', 'success'],
                lazy_loaded=component in lazy_imports,
                parent_route='/',
                route_type='page',
                props={}
            )

            self.routes.append(route)

    def extract_routes_from_navigation(self, nav_file: Path) -> None:
        """Extract routes from navigation configuration"""
        print("\nAnalyzing navigation files...")

        if not nav_file.exists():
            print(f"Warning: {nav_file} not found")
            return

        content = nav_file.read_text(encoding='utf-8', errors='ignore')

        # Extract navigation items
        nav_pattern = r'\{\s*title:\s*["\']([^"\']+)["\']\s*,\s*path:\s*["\']([^"\']+)["\']'
        nav_matches = re.finditer(nav_pattern, content)

        for match in nav_matches:
            title = match.group(1)
            path = match.group(2)

            # Check if route already exists
            if not any(r.path == path for r in self.routes):
                self.route_counter += 1
                route = Route(
                    route_id=f'ROUTE_{self.route_counter:04d}',
                    path=path,
                    component=title.replace(' ', ''),
                    file_path='Unknown',
                    requires_auth=True,
                    permissions=[],
                    states=['loading', 'error', 'success'],
                    lazy_loaded=False,
                    parent_route='/',
                    route_type='page',
                    props={'title': title}
                )

                self.routes.append(route)

    def scan_pages_directory(self, pages_dir: Path) -> None:
        """Scan pages directory for all page components"""
        print("\nScanning pages directory...")

        if not pages_dir.exists():
            print(f"Warning: {pages_dir} not found")
            return

        page_files = list(pages_dir.glob('**/*.tsx')) + list(pages_dir.glob('**/*.ts'))

        for page_file in tqdm(page_files, desc="Analyzing page files"):
            if page_file.name.endswith('.test.tsx') or page_file.name.endswith('.test.ts'):
                continue

            # Infer route from file path
            relative_path = page_file.relative_to(pages_dir)
            route_path = '/' + str(relative_path.parent / relative_path.stem).replace('\\', '/').lower()

            # Clean up route path
            route_path = route_path.replace('/index', '').replace('.tsx', '').replace('.ts', '')

            # Check if route already exists
            if any(r.file_path == str(relative_path) for r in self.routes):
                continue

            # Extract component name
            component_name = self.extract_component_name(page_file)

            # Check for authentication requirements
            content = page_file.read_text(encoding='utf-8', errors='ignore')
            requires_auth = 'useAuth' in content or 'requiresAuth' in content

            # Extract permissions
            permissions = self.extract_permissions(content)

            self.route_counter += 1
            route = Route(
                route_id=f'ROUTE_{self.route_counter:04d}',
                path=route_path,
                component=component_name,
                file_path=str(relative_path),
                requires_auth=requires_auth,
                permissions=permissions,
                states=['loading', 'error', 'success', 'empty'],
                lazy_loaded=False,
                parent_route='/',
                route_type='page',
                props={}
            )

            self.routes.append(route)

    def extract_component_name(self, file_path: Path) -> str:
        """Extract component name from file"""
        content = file_path.read_text(encoding='utf-8', errors='ignore')

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

    def extract_permissions(self, content: str) -> List[str]:
        """Extract permission requirements from content"""
        permissions = []

        # Look for permission checks
        permission_patterns = [
            r'permission\s*===\s*["\']([^"\']+)["\']',
            r'permissions\.includes\(["\']([^"\']+)["\']\)',
            r'hasPermission\(["\']([^"\']+)["\']\)',
            r'role\s*===\s*["\']([^"\']+)["\']',
        ]

        for pattern in permission_patterns:
            matches = re.finditer(pattern, content)
            for match in matches:
                permissions.append(match.group(1))

        return list(set(permissions))

    def analyze_route_states(self) -> None:
        """Analyze each route for state handling"""
        print("\nAnalyzing route states...")

        for route in tqdm(self.routes, desc="Analyzing states"):
            if route.file_path == 'Unknown':
                continue

            file_path = self.root_dir / route.file_path
            if not file_path.exists():
                continue

            try:
                content = file_path.read_text(encoding='utf-8', errors='ignore')

                states = []

                # Check for common states
                if 'isLoading' in content or 'loading' in content:
                    states.append('loading')
                if 'error' in content or 'isError' in content:
                    states.append('error')
                if 'isEmpty' in content or 'data.length === 0' in content:
                    states.append('empty')
                if 'success' in content or 'data' in content:
                    states.append('success')

                route.states = states if states else ['unknown']

            except Exception as e:
                print(f"Error analyzing states for {route.file_path}: {e}")

    def identify_nested_routes(self) -> None:
        """Identify nested and dynamic routes"""
        print("\nIdentifying route relationships...")

        for route in self.routes:
            # Check for dynamic routes
            if ':' in route.path or '*' in route.path:
                route.route_type = 'dynamic'

            # Check for nested routes
            parts = route.path.split('/')
            if len(parts) > 2:
                parent_path = '/'.join(parts[:-1])
                parent_route = next((r for r in self.routes if r.path == parent_path), None)
                if parent_route:
                    route.parent_route = parent_route.route_id
                    route.route_type = 'nested'

            # Check for protected routes
            if route.requires_auth or route.permissions:
                route.route_type = 'protected'

    def generate_route_tree(self) -> Dict[str, Any]:
        """Generate hierarchical route tree"""
        tree = {
            'root': [],
            'nested': {},
            'dynamic': [],
            'protected': []
        }

        for route in self.routes:
            if route.route_type == 'page' and route.parent_route == '/':
                tree['root'].append(asdict(route))
            elif route.route_type == 'nested':
                if route.parent_route not in tree['nested']:
                    tree['nested'][route.parent_route] = []
                tree['nested'][route.parent_route].append(asdict(route))
            elif route.route_type == 'dynamic':
                tree['dynamic'].append(asdict(route))
            elif route.route_type == 'protected':
                tree['protected'].append(asdict(route))

        return tree

    def export_results(self, output_dir: Path) -> None:
        """Export all route analysis results"""
        output_dir.mkdir(exist_ok=True)

        # Export as JSON
        routes_data = [asdict(r) for r in self.routes]
        with open(output_dir / 'ROUTE_ANALYSIS.json', 'w', encoding='utf-8') as f:
            json.dump(routes_data, f, indent=2)

        # Export route tree
        tree = self.generate_route_tree()
        with open(output_dir / 'ROUTE_TREE.json', 'w', encoding='utf-8') as f:
            json.dump(tree, f, indent=2)

        # Export statistics
        stats = {
            'total_routes': len(self.routes),
            'page_routes': sum(1 for r in self.routes if r.route_type == 'page'),
            'nested_routes': sum(1 for r in self.routes if r.route_type == 'nested'),
            'dynamic_routes': sum(1 for r in self.routes if r.route_type == 'dynamic'),
            'protected_routes': sum(1 for r in self.routes if r.requires_auth),
            'lazy_loaded_routes': sum(1 for r in self.routes if r.lazy_loaded),
        }

        with open(output_dir / 'ROUTE_STATISTICS.json', 'w', encoding='utf-8') as f:
            json.dump(stats, f, indent=2)

        print(f"\n✓ Exported route analysis to {output_dir}")
        print(f"✓ Total routes found: {len(self.routes)}")

def main():
    print("=" * 80)
    print("COMPREHENSIVE ROUTE ANALYZER")
    print("=" * 80)

    # Configuration
    root_dir = Path(__file__).parent.parent / 'src'
    output_dir = Path(__file__).parent.parent / 'remediation-data'

    # Initialize mapper
    mapper = RouteMapper(root_dir)

    # Extract routes from various sources
    print("\n[1/6] Extracting routes from App.tsx...")
    mapper.extract_routes_from_app(root_dir / 'App.tsx')

    print("\n[2/6] Extracting routes from navigation...")
    mapper.extract_routes_from_navigation(root_dir / 'lib' / 'navigation.tsx')
    mapper.extract_routes_from_navigation(root_dir / 'lib' / 'navigation.ts')

    print("\n[3/6] Scanning pages directory...")
    mapper.scan_pages_directory(root_dir / 'pages')
    mapper.scan_pages_directory(root_dir / 'components' / 'pages')

    print("\n[4/6] Analyzing route states...")
    mapper.analyze_route_states()

    print("\n[5/6] Identifying route relationships...")
    mapper.identify_nested_routes()

    print("\n[6/6] Exporting results...")
    mapper.export_results(output_dir)

    # Print summary
    print("\n" + "=" * 80)
    print("ROUTE ANALYSIS COMPLETE")
    print("=" * 80)
    print(f"Total Routes: {len(mapper.routes)}")
    print(f"Page Routes: {sum(1 for r in mapper.routes if r.route_type == 'page')}")
    print(f"Nested Routes: {sum(1 for r in mapper.routes if r.route_type == 'nested')}")
    print(f"Dynamic Routes: {sum(1 for r in mapper.routes if r.route_type == 'dynamic')}")
    print(f"Protected Routes: {sum(1 for r in mapper.routes if r.requires_auth)}")
    print(f"Lazy Loaded: {sum(1 for r in mapper.routes if r.lazy_loaded)}")
    print("=" * 80)

if __name__ == '__main__':
    main()
