#!/usr/bin/env python3
"""
CSRF Protection Remediation Agent
Automatically adds CSRF protection to all state-changing API routes:
1. Finds all POST/PUT/DELETE routes without csrfProtection middleware
2. Adds import statement for csrfProtection
3. Inserts middleware in correct position (after auth, before validation)
4. Preserves existing middleware order
"""

import argparse
import json
import re
import subprocess
import sys
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional, Tuple


class CSRFRemediationAgent:
    """Agent for adding CSRF protection to routes"""

    def __init__(self, project_root: Path, dry_run: bool = False):
        self.project_root = project_root
        self.dry_run = dry_run
        self.fixes = []

    def find_route_files(self) -> List[Path]:
        """Find all route files in the project"""
        print("🔍 Finding route files...")

        route_files = []

        # Search in api/src/routes and server/src/routes
        for routes_dir in ['api/src/routes', 'server/src/routes']:
            routes_path = self.project_root / routes_dir
            if routes_path.exists():
                for route_file in routes_path.glob("**/*.routes.ts"):
                    route_files.append(route_file)

        print(f"  Found {len(route_files)} route files")
        return route_files

    def scan_unprotected_routes(self, file_path: Path) -> List[Dict]:
        """Scan a route file for unprotected POST/PUT/DELETE routes"""
        try:
            content = file_path.read_text()

            # Check if file already imports csrfProtection
            has_csrf_import = 'csrfProtection' in content

            vulnerabilities = []

            # Pattern to match route definitions
            # router.post('/path', ...middleware, handler)
            # router.put('/path', ...middleware, handler)
            # router.delete('/path', ...middleware, handler)
            route_pattern = r'router\.(post|put|delete|patch)\s*\(\s*[\'"`]([^\'"]+)[\'"`]\s*,\s*([^)]+)\)'

            for match in re.finditer(route_pattern, content, re.MULTILINE):
                method = match.group(1)
                path = match.group(2)
                middleware_and_handler = match.group(3)

                # Check if csrfProtection is already in middleware
                if 'csrfProtection' in middleware_and_handler:
                    continue  # Already protected

                # Find line number
                line_num = content[:match.start()].count('\n') + 1

                vulnerabilities.append({
                    'method': method.upper(),
                    'path': path,
                    'line': line_num,
                    'middleware': middleware_and_handler.strip(),
                    'has_import': has_csrf_import
                })

            return vulnerabilities

        except Exception as e:
            print(f"  ❌ Error scanning {file_path}: {e}")
            return []

    def add_csrf_import(self, file_path: Path) -> bool:
        """Add csrfProtection import if not present"""
        try:
            content = file_path.read_text()

            # Check if already imported
            if 'csrfProtection' in content:
                return True

            # Determine import path (relative to file location)
            # If in api/src/routes/*, import from '../middleware/csrf'
            # If in api/src/routes/subdir/*, import from '../../middleware/csrf'

            if 'api/src/routes' in str(file_path):
                depth = len(file_path.relative_to(self.project_root / 'api' / 'src' / 'routes').parts) - 1
                import_path = '../' * (depth + 1) + 'middleware/csrf'
            elif 'server/src/routes' in str(file_path):
                depth = len(file_path.relative_to(self.project_root / 'server' / 'src' / 'routes').parts) - 1
                import_path = '../' * (depth + 1) + 'middleware/csrf'
            else:
                import_path = '../middleware/csrf'

            # Find existing imports
            import_pattern = r"import\s+.*from\s+['\"].*['\"]"
            imports = list(re.finditer(import_pattern, content))

            if imports:
                # Add after last import
                last_import = imports[-1]
                insert_pos = last_import.end()

                import_statement = f"\nimport {{ csrfProtection }} from '{import_path}';\n"

                # Insert import
                new_content = content[:insert_pos] + import_statement + content[insert_pos:]

                if not self.dry_run:
                    file_path.write_text(new_content)

                print(f"  ✅ Added csrfProtection import to: {file_path.name}")
                return True
            else:
                print(f"  ⚠️  No imports found in: {file_path.name}")
                return False

        except Exception as e:
            print(f"  ❌ Error adding import to {file_path}: {e}")
            return False

    def add_csrf_to_route(self, file_path: Path, vuln: Dict) -> bool:
        """Add csrfProtection middleware to a specific route"""
        try:
            content = file_path.read_text()
            lines = content.split('\n')

            # Get the vulnerable line
            line_idx = vuln['line'] - 1
            if line_idx >= len(lines):
                print(f"  ⚠️  Line {vuln['line']} out of range in {file_path.name}")
                return False

            vulnerable_line = lines[line_idx]

            # Check if this is indeed a router method call
            if not f"router.{vuln['method'].lower()}" in vulnerable_line:
                print(f"  ⚠️  Route not found on line {vuln['line']} of {file_path.name}")
                return False

            # Pattern to find the route definition
            # router.method('path', ...middleware, handler)
            route_pattern = rf"router\.{vuln['method'].lower()}\s*\(\s*['\"`]{re.escape(vuln['path'])}['\"`]\s*,\s*"

            match = re.search(route_pattern, vulnerable_line)
            if not match:
                print(f"  ⚠️  Pattern not found in line {vuln['line']} of {file_path.name}")
                return False

            # Insert csrfProtection after the route path
            insert_pos = match.end()

            # Determine if we need to handle existing middleware
            # If there's already middleware, insert after auth middleware
            middleware_part = vulnerable_line[insert_pos:]

            if 'authMiddleware' in middleware_part or 'authenticate' in middleware_part:
                # Insert after auth middleware
                # Find the first comma after auth
                auth_patterns = [
                    (r'authMiddleware\s*,', 'authMiddleware, csrfProtection,'),
                    (r'authenticate\s*,', 'authenticate, csrfProtection,'),
                    (r'requireAuth\s*,', 'requireAuth, csrfProtection,'),
                ]

                replaced = False
                for pattern, replacement in auth_patterns:
                    if re.search(pattern, vulnerable_line):
                        new_line = re.sub(pattern, replacement, vulnerable_line, count=1)
                        lines[line_idx] = new_line
                        replaced = True
                        break

                if not replaced:
                    # Just add at the beginning
                    new_line = vulnerable_line[:insert_pos] + 'csrfProtection, ' + vulnerable_line[insert_pos:]
                    lines[line_idx] = new_line
            else:
                # No auth middleware, add as first middleware
                new_line = vulnerable_line[:insert_pos] + 'csrfProtection, ' + vulnerable_line[insert_pos:]
                lines[line_idx] = new_line

            # Write back
            new_content = '\n'.join(lines)

            if not self.dry_run:
                file_path.write_text(new_content)

            print(f"  ✅ Added csrfProtection to {vuln['method']} {vuln['path']} in {file_path.name}:{vuln['line']}")
            return True

        except Exception as e:
            print(f"  ❌ Error adding CSRF to route in {file_path}: {e}")
            return False

    def fix_route_file(self, file_path: Path) -> List[Dict]:
        """Fix all unprotected routes in a file"""
        print(f"\n📝 Processing: {file_path.relative_to(self.project_root)}")

        # Scan for vulnerabilities
        vulnerabilities = self.scan_unprotected_routes(file_path)

        if not vulnerabilities:
            print("  ✓ No unprotected routes found")
            return []

        print(f"  Found {len(vulnerabilities)} unprotected routes")

        # Add import if needed
        if vulnerabilities and not vulnerabilities[0]['has_import']:
            self.add_csrf_import(file_path)

        # Fix each route
        results = []
        for vuln in vulnerabilities:
            start = datetime.now()
            success = self.add_csrf_to_route(file_path, vuln)
            end = datetime.now()

            results.append({
                'file_path': str(file_path),
                'type': 'csrf_route_protection',
                'method': vuln['method'],
                'path': vuln['path'],
                'line': vuln['line'],
                'status': 'success' if success else 'failed',
                'start_time': start.isoformat(),
                'end_time': end.isoformat(),
                'verified': False  # Will be verified later
            })

        return results

    def run(self) -> Dict:
        """Run the CSRF remediation agent"""
        print("\n" + "="*80)
        print("CSRF PROTECTION REMEDIATION AGENT")
        print("="*80 + "\n")

        start_time = datetime.now()

        # Step 1: Find all route files
        print("📊 STEP 1: FINDING ROUTE FILES\n")
        route_files = self.find_route_files()

        if not route_files:
            print("❌ No route files found!")
            return {
                'agent': 'csrf',
                'fixes': [],
                'summary': {
                    'total': 0,
                    'successful': 0,
                    'failed': 0,
                    'elapsed_seconds': 0
                }
            }

        if self.dry_run:
            print("⚠️  DRY RUN MODE - No changes will be made\n")

        # Step 2: Process each route file
        print("🔧 STEP 2: ADDING CSRF PROTECTION\n")

        for route_file in route_files:
            results = self.fix_route_file(route_file)
            self.fixes.extend(results)

        end_time = datetime.now()
        elapsed = (end_time - start_time).total_seconds()

        # Summary
        print("\n" + "="*80)
        print("CSRF REMEDIATION SUMMARY")
        print("="*80 + "\n")

        successful = len([f for f in self.fixes if f['status'] == 'success'])
        failed = len([f for f in self.fixes if f['status'] == 'failed'])

        print(f"Route files processed:  {len(route_files)}")
        print(f"Total routes fixed:     {len(self.fixes)}")
        print(f"Successful:             {successful} ✅")
        print(f"Failed:                 {failed} ❌")
        print(f"Elapsed time:           {elapsed:.1f}s")
        print(f"\nDry run:                {self.dry_run}")
        print()

        # Breakdown by route file
        print("📁 Breakdown by file:")
        file_counts = {}
        for fix in self.fixes:
            file_name = Path(fix['file_path']).name
            file_counts[file_name] = file_counts.get(file_name, 0) + 1

        for file_name, count in sorted(file_counts.items()):
            print(f"  {file_name}: {count} routes")

        print()

        # Return results in JSON format
        return {
            'agent': 'csrf',
            'fixes': self.fixes,
            'summary': {
                'total': len(self.fixes),
                'successful': successful,
                'failed': failed,
                'elapsed_seconds': elapsed,
                'files_processed': len(route_files)
            }
        }


def main():
    parser = argparse.ArgumentParser(description='CSRF Protection Remediation Agent')
    parser.add_argument('project_root', type=Path, help='Project root directory')
    parser.add_argument('--dry-run', action='store_true', help='Scan only, no changes')

    args = parser.parse_args()

    agent = CSRFRemediationAgent(args.project_root, args.dry_run)
    results = agent.run()

    # Output JSON results to stdout for orchestrator
    print(json.dumps(results, indent=2))


if __name__ == "__main__":
    main()
