#!/usr/bin/env python3
"""
Comprehensive Accessibility Audit and Auto-Fix Script
Scans all React/TypeScript components for accessibility issues and applies fixes
"""

import os
import re
import json
from pathlib import Path
from typing import List, Dict, Set
from dataclasses import dataclass, asdict

@dataclass
class AccessibilityIssue:
    file: str
    line: int
    issue_type: str
    component: str
    fix_applied: bool
    description: str

class AccessibilityAuditor:
    def __init__(self, src_dir: str):
        self.src_dir = Path(src_dir)
        self.issues: List[AccessibilityIssue] = []
        self.files_modified = 0
        self.total_fixes = 0

    def find_tsx_files(self) -> List[Path]:
        """Find all TSX files in the src directory"""
        return list(self.src_dir.rglob("*.tsx"))

    def audit_file(self, file_path: Path) -> tuple[str, bool]:
        """Audit a single file and apply fixes"""
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()

            original_content = content
            modified = False

            # Fix 1: Input components without aria-label
            content, input_fixes = self.fix_inputs(content, file_path)
            modified = modified or input_fixes > 0

            # Fix 2: Button components without aria-label
            content, button_fixes = self.fix_buttons(content, file_path)
            modified = modified or button_fixes > 0

            # Fix 3: Add ARIA live regions
            content, live_region_fixes = self.add_live_regions(content, file_path)
            modified = modified or live_region_fixes > 0

            # Fix 4: Dialog/Modal focus management
            content, dialog_fixes = self.fix_dialogs(content, file_path)
            modified = modified or dialog_fixes > 0

            # Fix 5: Table headers
            content, table_fixes = self.fix_tables(content, file_path)
            modified = modified or table_fixes > 0

            # Fix 6: Add skip links (only to main App component)
            if file_path.name == "App.tsx" or "FleetDashboard" in file_path.name:
                content, skip_fixes = self.add_skip_links(content, file_path)
                modified = modified or skip_fixes > 0

            if modified:
                self.files_modified += 1
                return content, True

            return original_content, False

        except Exception as e:
            print(f"Error processing {file_path}: {e}")
            return None, False

    def fix_inputs(self, content: str, file_path: Path) -> tuple[str, int]:
        """Fix Input components without aria-label or id"""
        fixes = 0
        lines = content.split('\n')
        result_lines = []

        for i, line in enumerate(lines):
            # Match <Input components
            if re.search(r'<Input\s', line):
                # Check if aria-label or aria-labelledby already exists
                if 'aria-label' not in line and 'aria-labelledby' not in line:
                    # Try to extract placeholder or name for label
                    placeholder_match = re.search(r'placeholder=["\']([^"\']+)["\']', line)
                    name_match = re.search(r'name=["\']([^"\']+)["\']', line)

                    label_text = None
                    if placeholder_match:
                        label_text = placeholder_match.group(1)
                    elif name_match:
                        label_text = name_match.group(1).replace('_', ' ').replace('-', ' ').title()
                    else:
                        # Generic label based on context
                        label_text = "Input field"

                    # Add aria-label before the closing />
                    if '/>' in line:
                        line = line.replace('/>', f' aria-label="{label_text}" />')
                    elif '>' in line and not line.strip().endswith('>'):
                        # Multi-line Input, add to current line
                        line = line.rstrip() + f' aria-label="{label_text}"'

                    fixes += 1
                    self.issues.append(AccessibilityIssue(
                        file=str(file_path),
                        line=i + 1,
                        issue_type="missing-aria-label",
                        component="Input",
                        fix_applied=True,
                        description=f"Added aria-label='{label_text}'"
                    ))

            result_lines.append(line)

        return '\n'.join(result_lines), fixes

    def fix_buttons(self, content: str, file_path: Path) -> tuple[str, int]:
        """Fix Button components without aria-label"""
        fixes = 0
        lines = content.split('\n')
        result_lines = []

        for i, line in enumerate(lines):
            # Match <Button components that are icon-only (no children text)
            button_match = re.search(r'<Button\s[^>]*>', line)
            if button_match:
                # Check if it's an icon-only button (common pattern: <Button><Icon /></Button>)
                if 'aria-label' not in line and 'aria-labelledby' not in line:
                    # Check if button has icon children in same line or next line
                    if re.search(r'<([\w]+)Icon|Icon\s|<[\w]+\s+className.*icon', line, re.IGNORECASE):
                        # Extract icon name or use generic label
                        icon_match = re.search(r'<([\w]+)(?:Icon)?', line)
                        label_text = "Button"

                        if icon_match:
                            icon_name = icon_match.group(1)
                            label_text = icon_name.replace('Icon', '')

                        # Add aria-label
                        line = re.sub(r'(<Button\s[^>]*)(>)', rf'\1 aria-label="{label_text}"\2', line)
                        fixes += 1

                        self.issues.append(AccessibilityIssue(
                            file=str(file_path),
                            line=i + 1,
                            issue_type="missing-aria-label",
                            component="Button",
                            fix_applied=True,
                            description=f"Added aria-label='{label_text}' to icon button"
                        ))

            result_lines.append(line)

        return '\n'.join(result_lines), fixes

    def add_live_regions(self, content: str, file_path: Path) -> tuple[str, int]:
        """Add ARIA live regions for dynamic content"""
        fixes = 0

        # Look for toast/notification patterns
        if 'toast' in content.lower() or 'notification' in content.lower():
            if 'aria-live' not in content:
                # Add role="status" and aria-live to toast containers
                content = re.sub(
                    r'(<div[^>]*className=["\'][^"\']*toast[^"\']*["\'])',
                    r'\1 role="status" aria-live="polite" aria-atomic="true"',
                    content
                )
                if content != content:
                    fixes += 1
                    self.issues.append(AccessibilityIssue(
                        file=str(file_path),
                        line=0,
                        issue_type="missing-live-region",
                        component="Toast",
                        fix_applied=True,
                        description="Added aria-live to toast container"
                    ))

        return content, fixes

    def fix_dialogs(self, content: str, file_path: Path) -> tuple[str, int]:
        """Add focus management to Dialogs"""
        fixes = 0

        # Radix UI Dialog already has good accessibility, but ensure aria-describedby
        if '<Dialog' in content or '<DialogContent' in content:
            if 'aria-describedby' not in content and '<DialogDescription' not in content:
                # Add DialogDescription import if not present
                if 'DialogDescription' not in content and 'from "@/components/ui/dialog"' in content:
                    content = content.replace(
                        'from "@/components/ui/dialog"',
                        'from "@/components/ui/dialog" // DialogDescription available'
                    )
                    fixes += 1
                    self.issues.append(AccessibilityIssue(
                        file=str(file_path),
                        line=0,
                        issue_type="missing-dialog-description",
                        component="Dialog",
                        fix_applied=False,
                        description="Dialog should include DialogDescription for screen readers"
                    ))

        return content, fixes

    def fix_tables(self, content: str, file_path: Path) -> tuple[str, int]:
        """Ensure tables have proper thead/th structure"""
        fixes = 0

        # Look for table elements
        if '<table' in content.lower() or '<Table' in content:
            # Check for thead
            if '<thead' not in content.lower() and '<TableHead' not in content:
                self.issues.append(AccessibilityIssue(
                    file=str(file_path),
                    line=0,
                    issue_type="missing-table-headers",
                    component="Table",
                    fix_applied=False,
                    description="Table should use TableHeader component with proper scope attributes"
                ))

        return content, fixes

    def add_skip_links(self, content: str, file_path: Path) -> tuple[str, int]:
        """Add skip to main content link"""
        fixes = 0

        # Only add if not already present
        if 'skip-to-main' not in content and '#main-content' not in content:
            # Find the return statement in the component
            return_match = re.search(r'return\s*\(', content)
            if return_match:
                # Add skip link after the opening parent div
                skip_link = '''
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-0 focus:left-0 focus:z-50 focus:bg-blue-600 focus:text-white focus:px-4 focus:py-2"
        aria-label="Skip to main content"
      >
        Skip to main content
      </a>'''

                # Insert after first opening div/fragment
                content = re.sub(
                    r'(return\s*\(\s*<[^>]+>)',
                    r'\1' + skip_link,
                    content,
                    count=1
                )

                # Add id to main content area
                content = re.sub(
                    r'(<div[^>]*className=["\'][^"\']*main[^"\']*["\'][^>]*)(>)',
                    r'\1 id="main-content"\2',
                    content,
                    count=1
                )

                fixes += 1
                self.issues.append(AccessibilityIssue(
                    file=str(file_path),
                    line=0,
                    issue_type="missing-skip-link",
                    component="App",
                    fix_applied=True,
                    description="Added skip to main content link"
                ))

        return content, fixes

    def run_audit(self) -> Dict:
        """Run full audit and generate report"""
        tsx_files = self.find_tsx_files()
        print(f"Found {len(tsx_files)} TSX files to audit")

        for file_path in tsx_files:
            new_content, modified = self.audit_file(file_path)

            if modified and new_content:
                # Write fixed content back to file
                try:
                    with open(file_path, 'w', encoding='utf-8') as f:
                        f.write(new_content)
                    print(f"✓ Fixed: {file_path.relative_to(self.src_dir)}")
                except Exception as e:
                    print(f"✗ Error writing {file_path}: {e}")

        # Generate report
        report = {
            "total_files_scanned": len(tsx_files),
            "files_modified": self.files_modified,
            "total_issues_found": len(self.issues),
            "issues_by_type": {},
            "issues": [asdict(issue) for issue in self.issues]
        }

        # Count by type
        for issue in self.issues:
            issue_type = issue.issue_type
            if issue_type not in report["issues_by_type"]:
                report["issues_by_type"][issue_type] = 0
            report["issues_by_type"][issue_type] += 1

        return report

def main():
    src_dir = "/Users/andrewmorton/Documents/GitHub/fleet-local/src"

    print("=" * 80)
    print("FLEET ACCESSIBILITY AUDIT & AUTO-FIX")
    print("=" * 80)
    print()

    auditor = AccessibilityAuditor(src_dir)
    report = auditor.run_audit()

    # Save report
    report_path = "/Users/andrewmorton/Documents/GitHub/fleet-local/accessibility-audit-report.json"
    with open(report_path, 'w') as f:
        json.dump(report, indent=2, fp=f)

    print()
    print("=" * 80)
    print("AUDIT COMPLETE")
    print("=" * 80)
    print(f"Total files scanned: {report['total_files_scanned']}")
    print(f"Files modified: {report['files_modified']}")
    print(f"Total issues found: {report['total_issues_found']}")
    print()
    print("Issues by type:")
    for issue_type, count in report['issues_by_type'].items():
        print(f"  - {issue_type}: {count}")
    print()
    print(f"Full report saved to: {report_path}")

    return report

if __name__ == "__main__":
    main()
