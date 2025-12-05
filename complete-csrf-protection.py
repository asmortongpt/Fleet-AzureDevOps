#!/usr/bin/env python3
"""
Complete CSRF Protection Agent
Scans all route files and adds csrfProtection middleware to unprotected routes
"""

import os
import re
from pathlib import Path
from typing import List, Dict, Set
import json
from datetime import datetime

class CSRFProtectionAgent:
    def __init__(self, project_root: str):
        self.project_root = Path(project_root)
        self.routes_dir = self.project_root / "api" / "src" / "routes"
        self.results = {
            "timestamp": datetime.now().isoformat(),
            "files_scanned": 0,
            "files_modified": 0,
            "routes_protected": 0,
            "already_protected": 0,
            "files": []
        }

    def scan_file(self, file_path: Path) -> Dict:
        """Scan a single route file for CSRF protection status"""
        content = file_path.read_text()

        # Check if csrfProtection is imported
        has_csrf_import = bool(re.search(r"import.*csrfProtection.*from.*['\"].*csrf", content))

        # Find all route definitions (POST, PUT, DELETE, PATCH)
        route_patterns = [
            r"router\.(post|put|delete|patch)\s*\(\s*['\"]([^'\"]+)['\"]",
            r"app\.(post|put|delete|patch)\s*\(\s*['\"]([^'\"]+)['\"]",
        ]

        routes = []
        for pattern in route_patterns:
            matches = re.finditer(pattern, content, re.IGNORECASE)
            for match in matches:
                method = match.group(1).upper()
                path = match.group(2)

                # Check if this route has csrfProtection middleware
                # Look for csrfProtection in the same line or next few lines
                route_start = match.start()
                route_context = content[route_start:route_start+500]
                has_csrf = "csrfProtection" in route_context

                routes.append({
                    "method": method,
                    "path": path,
                    "protected": has_csrf,
                    "match_text": match.group(0)
                })

        return {
            "file": str(file_path.relative_to(self.project_root)),
            "has_import": has_csrf_import,
            "routes": routes,
            "needs_protection": any(not r["protected"] for r in routes) and len(routes) > 0
        }

    def apply_csrf_protection(self, file_path: Path, scan_result: Dict) -> bool:
        """Apply CSRF protection to a file"""
        content = file_path.read_text()
        original_content = content
        modified = False

        # Step 1: Add import if not present
        if not scan_result["has_import"] and scan_result["routes"]:
            # Find where to add the import (after other imports)
            import_patterns = [
                r"(import.*from\s+['\"].*['\"])",
                r"(const.*=.*require\(['\"].*['\"]\))"
            ]

            last_import_pos = 0
            for pattern in import_patterns:
                matches = list(re.finditer(pattern, content))
                if matches:
                    last_import_pos = max(last_import_pos, matches[-1].end())

            if last_import_pos > 0:
                # Add the import after the last import
                import_line = "\nimport { csrfProtection } from '../middleware/csrf'\n"
                content = content[:last_import_pos] + import_line + content[last_import_pos:]
                modified = True

        # Step 2: Add csrfProtection to unprotected routes
        for route in scan_result["routes"]:
            if not route["protected"]:
                # Pattern to match the route and add middleware
                # Looking for patterns like: router.post('/path', async (req, res)
                # And changing to: router.post('/path', csrfProtection, async (req, res)

                method = route["method"].lower()
                path = re.escape(route["path"])

                patterns = [
                    # Pattern 1: router.method('/path', async
                    (
                        rf"(router\.{method}\s*\(\s*['\"]" + path + r"['\"],\s*)(async\s*\()",
                        r"\1csrfProtection, \2"
                    ),
                    # Pattern 2: router.method('/path', (req
                    (
                        rf"(router\.{method}\s*\(\s*['\"]" + path + r"['\"],\s*)(\(req)",
                        r"\1csrfProtection, \2"
                    ),
                    # Pattern 3: router.method('/path', function
                    (
                        rf"(router\.{method}\s*\(\s*['\"]" + path + r"['\"],\s*)(function)",
                        r"\1csrfProtection, \2"
                    ),
                    # Pattern 4: app.method (for Express app instances)
                    (
                        rf"(app\.{method}\s*\(\s*['\"]" + path + r"['\"],\s*)(async\s*\(|\(req|function)",
                        r"\1csrfProtection, \2"
                    )
                ]

                for pattern, replacement in patterns:
                    new_content = re.sub(pattern, replacement, content)
                    if new_content != content:
                        content = new_content
                        modified = True
                        self.results["routes_protected"] += 1
                        break

        # Save if modified
        if modified and content != original_content:
            file_path.write_text(content)
            self.results["files_modified"] += 1
            return True

        return False

    def process_all_routes(self):
        """Process all route files"""
        print("=" * 80)
        print("COMPLETE CSRF PROTECTION AGENT")
        print("=" * 80)
        print(f"Project Root: {self.project_root}")
        print(f"Routes Directory: {self.routes_dir}")
        print("=" * 80)

        # Find all TypeScript/JavaScript route files
        route_files = list(self.routes_dir.glob("**/*.ts")) + list(self.routes_dir.glob("**/*.js"))
        route_files = [f for f in route_files if f.is_file()]

        print(f"\nFound {len(route_files)} route files\n")

        for file_path in sorted(route_files):
            self.results["files_scanned"] += 1

            # Scan the file
            scan_result = self.scan_file(file_path)

            # Count already protected routes
            for route in scan_result["routes"]:
                if route["protected"]:
                    self.results["already_protected"] += 1

            # Apply protection if needed
            if scan_result["needs_protection"]:
                print(f"📝 Processing: {scan_result['file']}")
                unprotected = [r for r in scan_result["routes"] if not r["protected"]]
                print(f"   Found {len(unprotected)} unprotected routes")

                if self.apply_csrf_protection(file_path, scan_result):
                    print(f"   ✅ Protected {len(unprotected)} routes")
                    scan_result["status"] = "protected"
                else:
                    print(f"   ⚠️  Manual review needed")
                    scan_result["status"] = "needs_manual_review"
            elif scan_result["routes"]:
                print(f"✓ Already protected: {scan_result['file']}")
                scan_result["status"] = "already_protected"
            else:
                scan_result["status"] = "no_routes"

            self.results["files"].append(scan_result)

        print("\n" + "=" * 80)
        print("CSRF PROTECTION COMPLETE")
        print("=" * 80)
        print(f"Files Scanned:       {self.results['files_scanned']}")
        print(f"Files Modified:      {self.results['files_modified']}")
        print(f"Routes Protected:    {self.results['routes_protected']}")
        print(f"Already Protected:   {self.results['already_protected']}")
        print(f"Total Routes:        {self.results['routes_protected'] + self.results['already_protected']}")
        print("=" * 80)

        # Save results
        results_path = self.project_root / "csrf-protection-results.json"
        results_path.write_text(json.dumps(self.results, indent=2))
        print(f"\n📊 Results saved to: {results_path}")

        return self.results

if __name__ == "__main__":
    import sys

    project_root = sys.argv[1] if len(sys.argv) > 1 else "/Users/andrewmorton/Documents/GitHub/Fleet"

    agent = CSRFProtectionAgent(project_root)
    results = agent.process_all_routes()

    # Exit with error if any files need manual review
    needs_review = sum(1 for f in results["files"] if f.get("status") == "needs_manual_review")
    if needs_review > 0:
        print(f"\n⚠️  {needs_review} files need manual review")
        sys.exit(1)
    else:
        print("\n✅ All routes successfully protected!")
        sys.exit(0)
