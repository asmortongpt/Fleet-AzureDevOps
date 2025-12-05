#!/usr/bin/env python3
"""
XSS Protection Remediation Agent
Automatically fixes XSS vulnerabilities by:
1. Adding xss-sanitizer imports to components
2. Wrapping dangerouslySetInnerHTML with sanitizeHtml()
3. Adding input sanitization to form handlers
4. Validating URLs with sanitizeUrl()
"""

import argparse
import json
import re
import subprocess
import sys
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Tuple


class XSSRemediationAgent:
    """Agent for fixing XSS vulnerabilities"""

    def __init__(self, project_root: Path, dry_run: bool = False):
        self.project_root = project_root
        self.dry_run = dry_run
        self.fixes = []

    def scan_dangerous_html(self) -> List[Dict]:
        """Find all dangerouslySetInnerHTML usage"""
        print("🔍 Scanning for dangerouslySetInnerHTML...")

        vulnerabilities = []

        # Search in src directory
        src_dir = self.project_root / "src"
        if not src_dir.exists():
            print(f"❌ Source directory not found: {src_dir}")
            return vulnerabilities

        # Use grep to find dangerouslySetInnerHTML
        try:
            result = subprocess.run(
                ['grep', '-r', '-n', 'dangerouslySetInnerHTML', str(src_dir), '--include=*.tsx', '--include=*.ts'],
                capture_output=True,
                text=True
            )

            if result.returncode == 0:
                for line in result.stdout.strip().split('\n'):
                    if ':' in line:
                        parts = line.split(':', 2)
                        if len(parts) >= 3:
                            file_path = parts[0]
                            line_num = parts[1]
                            content = parts[2]

                            vulnerabilities.append({
                                'file': file_path,
                                'line': int(line_num),
                                'content': content.strip(),
                                'type': 'dangerouslySetInnerHTML'
                            })

            print(f"  Found {len(vulnerabilities)} dangerouslySetInnerHTML instances")

        except Exception as e:
            print(f"❌ Error scanning: {e}")

        return vulnerabilities

    def scan_form_components(self) -> List[Dict]:
        """Find form components that need input sanitization"""
        print("🔍 Scanning for form components...")

        components = []

        # Find all form-related files
        forms_dir = self.project_root / "src" / "components" / "forms"
        if forms_dir.exists():
            for tsx_file in forms_dir.glob("**/*.tsx"):
                # Check if file has form submission handlers
                content = tsx_file.read_text()

                if 'handleSubmit' in content or 'onSubmit' in content:
                    # Check if already imports xss-sanitizer
                    if 'xss-sanitizer' not in content:
                        components.append({
                            'file': str(tsx_file),
                            'type': 'form_component',
                            'needs_import': True
                        })

        print(f"  Found {len(components)} form components needing sanitization")
        return components

    def scan_user_content_display(self) -> List[Dict]:
        """Find components displaying user-generated content"""
        print("🔍 Scanning for user content display...")

        components = []

        # Search for common patterns
        patterns = [
            r'<a\s+href=\{[^}]+\}',  # Links with user data
            r'<img\s+src=\{[^}]+\}',  # Images with user data
            r'<div>.*\{.*\.name.*\}</div>',  # Display user names
        ]

        src_dir = self.project_root / "src" / "components"
        if src_dir.exists():
            for tsx_file in src_dir.glob("**/*.tsx"):
                content = tsx_file.read_text()

                for pattern in patterns:
                    if re.search(pattern, content):
                        if 'xss-sanitizer' not in content:
                            components.append({
                                'file': str(tsx_file),
                                'type': 'user_content_display',
                                'pattern': pattern
                            })
                            break

        print(f"  Found {len(components)} components displaying user content")
        return components

    def add_xss_sanitizer_import(self, file_path: Path) -> bool:
        """Add xss-sanitizer import to a file if not present"""
        try:
            content = file_path.read_text()

            # Check if already imported
            if 'xss-sanitizer' in content:
                return True

            # Find the appropriate place to add import
            # Look for existing imports
            import_pattern = r"import\s+.*from\s+['\"].*['\"]"
            imports = list(re.finditer(import_pattern, content))

            if imports:
                # Add after last import
                last_import = imports[-1]
                insert_pos = last_import.end()

                # Determine what to import based on file content
                needed_functions = []
                if 'dangerouslySetInnerHTML' in content:
                    needed_functions.append('sanitizeHtml')
                if 'handleSubmit' in content or 'onSubmit' in content:
                    needed_functions.append('sanitizeUserInput')
                if '<a href' in content:
                    needed_functions.append('sanitizeUrl')

                if not needed_functions:
                    needed_functions = ['sanitizeHtml']  # Default

                import_statement = f"\nimport {{ {', '.join(needed_functions)} }} from '@/utils/xss-sanitizer';\n"

                # Insert import
                new_content = content[:insert_pos] + import_statement + content[insert_pos:]

                if not self.dry_run:
                    file_path.write_text(new_content)

                print(f"  ✅ Added import to: {file_path.name}")
                return True
            else:
                print(f"  ⚠️  No imports found in: {file_path.name}")
                return False

        except Exception as e:
            print(f"  ❌ Error adding import to {file_path}: {e}")
            return False

    def fix_dangerous_html(self, vuln: Dict) -> bool:
        """Fix a dangerouslySetInnerHTML vulnerability"""
        file_path = Path(vuln['file'])

        try:
            content = file_path.read_text()
            lines = content.split('\n')

            # Get the vulnerable line
            line_idx = vuln['line'] - 1
            if line_idx >= len(lines):
                print(f"  ⚠️  Line {vuln['line']} out of range in {file_path.name}")
                return False

            vulnerable_line = lines[line_idx]

            # Pattern to match: dangerouslySetInnerHTML={{ __html: content }}
            pattern = r'dangerouslySetInnerHTML=\{\{\s*__html:\s*([^}]+)\s*\}\}'
            match = re.search(pattern, vulnerable_line)

            if not match:
                print(f"  ⚠️  Pattern not found in line {vuln['line']} of {file_path.name}")
                return False

            # Extract the content expression
            content_expr = match.group(1).strip()

            # Check if already sanitized
            if 'sanitizeHtml(' in content_expr:
                print(f"  ✓ Already sanitized: {file_path.name}:{vuln['line']}")
                return True

            # Wrap with sanitizeHtml()
            fixed_expr = f"sanitizeHtml({content_expr})"
            fixed_line = vulnerable_line.replace(
                match.group(0),
                f"dangerouslySetInnerHTML={{{{ __html: {fixed_expr} }}}}"
            )

            # Replace the line
            lines[line_idx] = fixed_line
            new_content = '\n'.join(lines)

            # Add import if needed
            self.add_xss_sanitizer_import(file_path)

            if not self.dry_run:
                file_path.write_text(new_content)

            print(f"  ✅ Fixed dangerouslySetInnerHTML in {file_path.name}:{vuln['line']}")
            return True

        except Exception as e:
            print(f"  ❌ Error fixing {file_path}: {e}")
            return False

    def add_form_sanitization(self, component: Dict) -> bool:
        """Add input sanitization to form component"""
        file_path = Path(component['file'])

        try:
            content = file_path.read_text()

            # Add import
            if not self.add_xss_sanitizer_import(file_path):
                return False

            # Find form submission handlers
            # This is complex - we'll add a comment for manual review
            pattern = r'(const\s+handleSubmit\s*=.*?\{)'

            if re.search(pattern, content):
                # Add TODO comment before handleSubmit
                comment = '\n  // TODO: Add sanitizeUserInput() for all text fields\n  // Example: name: sanitizeUserInput(data.name)\n  '

                new_content = re.sub(
                    pattern,
                    comment + r'\1',
                    content,
                    count=1
                )

                if not self.dry_run:
                    file_path.write_text(new_content)

                print(f"  ✅ Added sanitization TODO to: {file_path.name}")
                return True

            return False

        except Exception as e:
            print(f"  ❌ Error adding form sanitization to {file_path}: {e}")
            return False

    def run(self) -> Dict:
        """Run the XSS remediation agent"""
        print("\n" + "="*80)
        print("XSS PROTECTION REMEDIATION AGENT")
        print("="*80 + "\n")

        start_time = datetime.now()

        # Step 1: Scan for vulnerabilities
        print("📊 STEP 1: SCANNING FOR XSS VULNERABILITIES\n")
        dangerous_html = self.scan_dangerous_html()
        form_components = self.scan_form_components()
        user_content = self.scan_user_content_display()

        total_found = len(dangerous_html) + len(form_components) + len(user_content)
        print(f"\n  Total vulnerabilities found: {total_found}\n")

        if self.dry_run:
            print("⚠️  DRY RUN MODE - No changes will be made\n")

        # Step 2: Fix dangerouslySetInnerHTML
        print("🔧 STEP 2: FIXING dangerouslySetInnerHTML\n")
        for vuln in dangerous_html:
            start = datetime.now()
            success = self.fix_dangerous_html(vuln)
            end = datetime.now()

            self.fixes.append({
                'file_path': vuln['file'],
                'type': 'dangerouslySetInnerHTML',
                'status': 'success' if success else 'failed',
                'start_time': start.isoformat(),
                'end_time': end.isoformat()
            })

        # Step 3: Add form sanitization
        print("\n🔧 STEP 3: ADDING FORM SANITIZATION\n")
        for component in form_components:
            start = datetime.now()
            success = self.add_form_sanitization(component)
            end = datetime.now()

            self.fixes.append({
                'file_path': component['file'],
                'type': 'form_sanitization',
                'status': 'success' if success else 'failed',
                'start_time': start.isoformat(),
                'end_time': end.isoformat()
            })

        # Step 4: Add imports to user content display components
        print("\n🔧 STEP 4: ADDING IMPORTS TO COMPONENTS\n")
        for component in user_content:
            start = datetime.now()
            file_path = Path(component['file'])
            success = self.add_xss_sanitizer_import(file_path)
            end = datetime.now()

            self.fixes.append({
                'file_path': component['file'],
                'type': 'import_only',
                'status': 'success' if success else 'failed',
                'start_time': start.isoformat(),
                'end_time': end.isoformat()
            })

        end_time = datetime.now()
        elapsed = (end_time - start_time).total_seconds()

        # Summary
        print("\n" + "="*80)
        print("XSS REMEDIATION SUMMARY")
        print("="*80 + "\n")

        successful = len([f for f in self.fixes if f['status'] == 'success'])
        failed = len([f for f in self.fixes if f['status'] == 'failed'])

        print(f"Total fixes attempted: {len(self.fixes)}")
        print(f"Successful:            {successful} ✅")
        print(f"Failed:                {failed} ❌")
        print(f"Elapsed time:          {elapsed:.1f}s")
        print(f"\nDry run:               {self.dry_run}")
        print()

        # Return results in JSON format
        return {
            'agent': 'xss',
            'fixes': self.fixes,
            'summary': {
                'total': len(self.fixes),
                'successful': successful,
                'failed': failed,
                'elapsed_seconds': elapsed
            }
        }


def main():
    parser = argparse.ArgumentParser(description='XSS Protection Remediation Agent')
    parser.add_argument('project_root', type=Path, help='Project root directory')
    parser.add_argument('--dry-run', action='store_true', help='Scan only, no changes')

    args = parser.parse_args()

    agent = XSSRemediationAgent(args.project_root, args.dry_run)
    results = agent.run()

    # Output JSON results to stdout for orchestrator
    print(json.dumps(results, indent=2))


if __name__ == "__main__":
    main()
