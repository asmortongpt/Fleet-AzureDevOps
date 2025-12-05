#!/usr/bin/env python3
"""
Final 42 CSRF Routes Fix - Template Literal Edition
Handles complex multi-line routes with template literals that regex missed
"""

import re
from pathlib import Path
from typing import List, Tuple

class Final42CSRFFix:
    def __init__(self, project_root: str):
        self.project_root = Path(project_root)
        self.routes_dir = self.project_root / "api" / "src" / "routes"
        self.fixed_count = 0
        self.files_modified = []

    def fix_template_literal_route(self, content: str, file_path: Path) -> str:
        """Fix routes that use template literals (backticks) instead of quotes"""
        original_content = content

        # Pattern 1: router.method(`/path`, requirePermission...
        # Need to insert csrfProtection BEFORE requirePermission
        pattern1 = r'(router\.(post|put|delete|patch)\s*\(\s*`[^`]+`,\s*)(?!csrfProtection)(requirePermission|validateBody|validateParams)'

        def add_csrf_before_middleware(match):
            return match.group(1) + 'csrfProtection, ' + match.group(3)

        content = re.sub(pattern1, add_csrf_before_middleware, content, flags=re.IGNORECASE)

        # Pattern 2: Multi-line with newlines - router.method(
        #   `/path`,
        #   requirePermission...
        pattern2 = r'(router\.(post|put|delete|patch)\s*\(\s*`[^`]+`,\s*\n\s*)(?!csrfProtection)(requirePermission|validateBody|validateParams)'

        content = re.sub(pattern2, add_csrf_before_middleware, content, flags=re.IGNORECASE | re.MULTILINE)

        if content != original_content:
            self.fixed_count += 1
            self.files_modified.append(str(file_path.relative_to(self.project_root)))
            return content

        return content

    def process_file(self, file_path: Path) -> bool:
        """Process a single file and return True if modified"""
        try:
            content = file_path.read_text()
            new_content = self.fix_template_literal_route(content, file_path)

            if new_content != content:
                file_path.write_text(new_content)
                return True

            return False
        except Exception as e:
            print(f"❌ Error processing {file_path.name}: {e}")
            return False

    def execute(self) -> Tuple[int, int]:
        """Execute the fix and return (routes_fixed, files_modified)"""
        print("=" * 80)
        print("FINAL 42 CSRF ROUTES FIX - Template Literal Edition")
        print("=" * 80)

        # List of files that have the remaining 42 routes
        target_files = [
            "video-events.ts",
            "routes.ts",
            "geofences.ts",
            "policies.ts",
            "charging-stations.ts",
            "communication-logs.ts",
            "osha-compliance.ts",
            "mobile-hardware.routes.ts",
            "mobile-obd2.routes.ts",
            "ocr.routes.ts",
            "scheduling-notifications.routes.ts",
            "scheduling.routes.ts",
            "document-geo.routes.ts",
            "admin-jobs.routes.ts",
            "emulator.routes.ts",
            "ai-insights.routes.ts",
            "mobile-trips.routes.ts",
            "vehicle-3d.routes.ts",
            "vehicle-idling.routes.ts",
            "charging-sessions.ts",
            "mobile-ocr.routes.ts",
            "calendar.routes.ts",
            "telemetry.ts",
            "attachments.routes.ts",
            "storage-admin.ts",
            "documents.ts",
            "document-search.example.ts",
            "heavy-equipment.routes.ts",
            "maintenance.ts",
            "traffic-cameras.enhanced.ts",
            "push-notifications.routes.ts",
            "ai-task-asset.routes.ts",
            "queue.routes.ts",
            "documents.routes.ts",
            "mobile-photos.routes.ts",
            "dispatch.routes.ts",
            "vehicle-assignments.routes.ts",
            "route-emulator.routes.ts",
            "gps.ts"
        ]

        for filename in target_files:
            file_path = self.routes_dir / filename
            if file_path.exists():
                if self.process_file(file_path):
                    print(f"✅ Fixed: {filename}")
            else:
                # Check subdirectories
                found = False
                for subdir_file in self.routes_dir.rglob(filename):
                    if self.process_file(subdir_file):
                        print(f"✅ Fixed: {subdir_file.relative_to(self.routes_dir)}")
                        found = True
                        break

                if not found:
                    print(f"⚠️  Not found: {filename}")

        print("=" * 80)
        print(f"Routes Fixed: {self.fixed_count}")
        print(f"Files Modified: {len(self.files_modified)}")
        print("=" * 80)

        return self.fixed_count, len(self.files_modified)

if __name__ == "__main__":
    import sys

    project_root = sys.argv[1] if len(sys.argv) > 1 else "/Users/andrewmorton/Documents/GitHub/Fleet"

    agent = Final42CSRFFix(project_root)
    routes_fixed, files_modified = agent.execute()

    print(f"\n✅ Final 42 routes fix complete: {routes_fixed} routes in {files_modified} files")
    sys.exit(0)
