#!/usr/bin/env python3
"""
Fleet Management System - Remediation Cards Generator
Generates detailed remediation cards for every UI element
"""

import csv
import json
from pathlib import Path
from collections import defaultdict
from typing import Dict, List

class RemediationCardsGenerator:
    def __init__(self, root_dir: str):
        self.root_dir = Path(root_dir)
        self.inventory = []
        self.routes = []
        self.endpoints = []
        self.statistics = defaultdict(int)

    def load_data(self):
        """Load all inventory data"""
        # Load UI elements with coverage
        with open(self.root_dir / "COMPLETE_INVENTORY_WITH_COVERAGE.csv", 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            self.inventory = list(reader)

        # Load routes
        routes_file = self.root_dir / "ROUTES_INVENTORY.json"
        if routes_file.exists():
            with open(routes_file, 'r', encoding='utf-8') as f:
                self.routes = json.load(f)

        # Load endpoints
        endpoints_file = self.root_dir / "API_ENDPOINTS_INVENTORY.json"
        if endpoints_file.exists():
            with open(endpoints_file, 'r', encoding='utf-8') as f:
                self.endpoints = json.load(f)

    def calculate_statistics(self):
        """Calculate comprehensive statistics"""
        stats = {
            'total_items': len(self.inventory),
            'by_type': defaultdict(int),
            'by_status': defaultdict(int),
            'by_file': defaultdict(int),
            'critical_issues': [],
            'coverage_stats': {
                'covered': 0,
                'not_covered': 0,
                'partially_covered': 0,
            }
        }

        for item in self.inventory:
            # Count by type
            stats['by_type'][item['element_type']] += 1

            # Count by status
            stats['by_status'][item['test_status']] += 1

            # Count by file
            stats['by_file'][item['file_path']] += 1

            # Coverage stats
            if item['test_status'] == 'COVERED':
                stats['coverage_stats']['covered'] += 1
            elif item['test_status'] == 'PARTIALLY COVERED':
                stats['coverage_stats']['partially_covered'] += 1
            else:
                stats['coverage_stats']['not_covered'] += 1

            # Identify critical issues
            if item['element_type'] == 'Button' and not item['handler']:
                stats['critical_issues'].append({
                    'item_id': item['item_id'],
                    'issue': 'Button without handler',
                    'file': item['file_path'],
                    'line': item['line_number']
                })

            if item['element_type'] in ['Input', 'Textarea', 'Select'] and not item['label']:
                stats['critical_issues'].append({
                    'item_id': item['item_id'],
                    'issue': 'Form field without label (accessibility issue)',
                    'file': item['file_path'],
                    'line': item['line_number']
                })

        # Calculate percentages
        total = stats['total_items']
        stats['coverage_percentage'] = (stats['coverage_stats']['covered'] / total * 100) if total > 0 else 0
        stats['not_covered_percentage'] = (stats['coverage_stats']['not_covered'] / total * 100) if total > 0 else 0

        # Route and endpoint stats
        stats['total_routes'] = len(self.routes)
        stats['total_endpoints'] = len(self.endpoints)

        return stats

    def generate_card(self, item: Dict, item_num: int) -> str:
        """Generate a single remediation card"""
        card = f"""
## Item #{item['item_id']}: {item['element_type']} in {Path(item['file_path']).name}
**Type**: {item['element_type']}
**Location**: `{item['file_path']}:{item['line_number']}`
**Context**: {item['context']}

### Code Snippet
```tsx
{item['jsx_snippet'][:300]}
```

### Business Purpose
{self._infer_business_purpose(item)}

### Expected Behavior
{self._infer_expected_behavior(item)}

### Validation
- **Correctness**: {self._check_correctness(item)}
- **Security**: {self._check_security(item)}
- **Performance**: {self._check_performance(item)}
- **UX/Accessibility**: {self._check_accessibility(item)}
- **Test Coverage**: {self._check_test_coverage(item)}

### Fix Required
{self._determine_fix(item)}

### Test Plan
{self._generate_test_plan(item)}

### Status
{self._determine_status(item)}

---
"""
        return card

    def _infer_business_purpose(self, item: Dict) -> str:
        """Infer business purpose from context"""
        elem_type = item['element_type']
        file_path = item['file_path']
        label = item['label']

        if 'fleet' in file_path.lower():
            return f"Part of the Fleet Management system. This {elem_type} allows users to interact with vehicle data and operations."
        elif 'maintenance' in file_path.lower():
            return f"Part of the Maintenance Management system. This {elem_type} enables maintenance tracking and scheduling."
        elif 'driver' in file_path.lower():
            return f"Part of the Driver Management system. This {elem_type} facilitates driver performance and compliance tracking."
        elif 'fuel' in file_path.lower():
            return f"Part of the Fuel Management system. This {elem_type} helps track and analyze fuel consumption and costs."
        elif 'analytics' in file_path.lower() or 'dashboard' in file_path.lower():
            return f"Part of the Analytics/Dashboard system. This {elem_type} displays key metrics and insights."
        elif 'settings' in file_path.lower() or 'admin' in file_path.lower():
            return f"Part of the Settings/Admin system. This {elem_type} controls system configuration."
        else:
            return f"This {elem_type} is part of the {Path(file_path).parent.name} module, providing user interaction capabilities."

    def _infer_expected_behavior(self, item: Dict) -> str:
        """Infer expected behavior"""
        elem_type = item['element_type']
        handler = item['handler']
        label = item['label']

        behaviors = {
            'Button': f"When clicked, should execute '{handler}' handler. Expected to provide visual feedback and trigger the associated action.",
            'Link': f"Should navigate to '{handler}' when clicked. Must maintain application state and update URL appropriately.",
            'Input': "Should accept user text input, validate on change/blur, display error states, and integrate with form submission.",
            'Select': "Should display dropdown options, allow single selection, update form state, and validate the selected value.",
            'Checkbox': "Should toggle between checked/unchecked states, update form data, and provide visual feedback.",
            'Radio': "Should allow single selection within a group, deselect other options, and update form state.",
            'Textarea': "Should accept multi-line text input, support resize, validate content, and show character count if limited.",
            'Modal': "Should open/close on trigger, trap focus, support keyboard navigation (Esc to close), and prevent background interaction.",
            'Table': "Should display tabular data, support sorting, filtering, pagination, and row selection if applicable.",
            'Form': "Should collect user input, validate all fields, prevent submission if invalid, display errors, and submit data to backend.",
            'Tab': "Should switch between views, maintain only one active tab, preserve state, and support keyboard navigation.",
            'Menu': "Should open/close on trigger, support keyboard navigation, close on outside click, and execute menu item actions.",
            'Card': "Should display grouped information, support interactions on its content, and maintain consistent styling.",
        }

        return behaviors.get(elem_type, f"Should function as a standard {elem_type} component with appropriate user feedback.")

    def _check_correctness(self, item: Dict) -> str:
        """Check functional correctness"""
        elem_type = item['element_type']
        handler = item['handler']
        label = item['label']

        issues = []

        # Check for missing handlers
        if elem_type in ['Button', 'Link'] and not handler:
            issues.append("Missing handler/action")

        # Check for missing labels
        if elem_type in ['Input', 'Select', 'Checkbox', 'Radio', 'Textarea'] and not label:
            issues.append("Missing label (may affect accessibility and usability)")

        if issues:
            return f"⚠️ ISSUES: {', '.join(issues)}"
        else:
            return "✅ No obvious correctness issues detected"

    def _check_security(self, item: Dict) -> str:
        """Check security considerations"""
        elem_type = item['element_type']
        snippet = item['jsx_snippet'].lower()

        issues = []

        # Check for dangerous patterns
        if 'dangerouslysetinnerhtml' in snippet:
            issues.append("Uses dangerouslySetInnerHTML - verify XSS protection")

        if elem_type == 'Form' and 'novalidate' in snippet:
            issues.append("Form has noValidate - ensure server-side validation")

        if elem_type == 'Link' and 'target="_blank"' in snippet and 'rel="noopener noreferrer"' not in snippet:
            issues.append("Link opens in new tab without rel=\"noopener noreferrer\"")

        if elem_type == 'Input' and 'type="password"' in snippet and 'autocomplete="off"' in snippet:
            issues.append("Password field disables autocomplete - may violate security best practices")

        if issues:
            return f"⚠️ SECURITY CONCERNS: {', '.join(issues)}"
        else:
            return "✅ No obvious security issues detected"

    def _check_performance(self, item: Dict) -> str:
        """Check performance considerations"""
        elem_type = item['element_type']
        file_path = item['file_path']

        # Large tables/lists need virtualization
        if elem_type == 'Table' and 'virtual' not in file_path.lower():
            return "⚠️ Consider virtualization for large datasets"

        # Cards in loops should be memoized
        if elem_type == 'Card' and 'map(' in item['jsx_snippet']:
            return "⚠️ Verify memoization for mapped components"

        return "✅ No obvious performance issues"

    def _check_accessibility(self, item: Dict) -> str:
        """Check accessibility"""
        elem_type = item['element_type']
        snippet = item['jsx_snippet']
        label = item['label']

        issues = []

        # Check for accessibility attributes
        if elem_type == 'Button' and not any(attr in snippet for attr in ['aria-label=', 'title=', '>']):
            issues.append("Missing accessible label")

        if elem_type in ['Input', 'Select', 'Textarea'] and not label:
            issues.append("Form field missing label")

        if elem_type == 'Modal' and 'role="dialog"' not in snippet:
            issues.append("Modal should have role=\"dialog\"")

        if elem_type == 'Button' and '<button' in snippet.lower() and 'type=' not in snippet.lower():
            issues.append("Button missing explicit type attribute")

        if issues:
            return f"❌ ACCESSIBILITY ISSUES: {', '.join(issues)}"
        else:
            return "✅ Appears accessible"

    def _check_test_coverage(self, item: Dict) -> str:
        """Check test coverage"""
        status = item['test_status']
        test_file = item['test_file']
        test_count = item['test_count']

        if status == 'COVERED':
            return f"✅ COVERED by {test_file} ({test_count} tests)"
        elif status == 'PARTIALLY COVERED':
            return f"⚠️ PARTIALLY COVERED by {test_file}"
        else:
            return "❌ NOT COVERED - Test required"

    def _determine_fix(self, item: Dict) -> str:
        """Determine what fix is needed"""
        fixes = []

        # Correctness fixes
        if item['element_type'] in ['Button', 'Link'] and not item['handler']:
            fixes.append("- Add onClick/href handler")

        if item['element_type'] in ['Input', 'Select', 'Textarea', 'Checkbox', 'Radio'] and not item['label']:
            fixes.append("- Add accessible label using <label> tag or aria-label")

        # Security fixes
        if 'dangerouslysetinnerhtml' in item['jsx_snippet'].lower():
            fixes.append("- Replace dangerouslySetInnerHTML with safe rendering or sanitize input")

        if 'target="_blank"' in item['jsx_snippet'] and 'rel="noopener noreferrer"' not in item['jsx_snippet']:
            fixes.append("- Add rel=\"noopener noreferrer\" to external links")

        # Accessibility fixes
        if item['element_type'] == 'Button' and '<button' in item['jsx_snippet'].lower() and 'type=' not in item['jsx_snippet'].lower():
            fixes.append("- Add explicit type=\"button\" or type=\"submit\"")

        if not fixes:
            return "No code changes required - element appears correctly implemented"

        return "\n".join(fixes)

    def _generate_test_plan(self, item: Dict) -> str:
        """Generate test plan"""
        elem_type = item['element_type']
        handler = item['handler']

        if item['test_status'] == 'COVERED':
            return f"Already covered by {item['test_file']}"

        test_cases = []

        if elem_type == 'Button':
            test_cases.append(f"- Verify button renders with correct label")
            if handler:
                test_cases.append(f"- Verify {handler} is called when clicked")
            test_cases.append(f"- Verify button is keyboard accessible (Enter/Space)")
            test_cases.append(f"- Verify button has appropriate ARIA attributes")

        elif elem_type == 'Input':
            test_cases.append(f"- Verify input accepts text and updates state")
            test_cases.append(f"- Verify validation works (if applicable)")
            test_cases.append(f"- Verify error states display correctly")
            test_cases.append(f"- Verify label is associated correctly")

        elif elem_type == 'Form':
            test_cases.append(f"- Verify form submission with valid data")
            test_cases.append(f"- Verify form validation prevents invalid submission")
            test_cases.append(f"- Verify error messages display for invalid fields")
            test_cases.append(f"- Verify form reset functionality")

        elif elem_type == 'Modal':
            test_cases.append(f"- Verify modal opens/closes correctly")
            test_cases.append(f"- Verify focus trap works")
            test_cases.append(f"- Verify Esc key closes modal")
            test_cases.append(f"- Verify background interaction is prevented")

        elif elem_type == 'Table':
            test_cases.append(f"- Verify table renders with correct data")
            test_cases.append(f"- Verify sorting works (if applicable)")
            test_cases.append(f"- Verify pagination works (if applicable)")
            test_cases.append(f"- Verify row actions work (if applicable)")

        else:
            test_cases.append(f"- Verify {elem_type} renders correctly")
            test_cases.append(f"- Verify user interactions work as expected")
            test_cases.append(f"- Verify accessibility requirements are met")

        test_cases.append(f"\nSuggested test file: `{item['file_path'].replace('.tsx', '.test.tsx').replace('.ts', '.test.ts')}`")

        return "\n".join(test_cases)

    def _determine_status(self, item: Dict) -> str:
        """Determine overall status"""
        # Check for blocking issues
        blocking_issues = []

        if item['element_type'] in ['Button', 'Link'] and not item['handler']:
            blocking_issues.append("Missing handler")

        if item['element_type'] in ['Input', 'Select', 'Textarea'] and not item['label']:
            blocking_issues.append("Missing label (accessibility)")

        if 'dangerouslysetinnerhtml' in item['jsx_snippet'].lower():
            blocking_issues.append("Potential XSS vulnerability")

        if item['test_status'] == 'NOT COVERED':
            blocking_issues.append("No test coverage")

        if blocking_issues:
            return f"**BLOCKING** - Issues: {', '.join(blocking_issues)}"
        elif item['test_status'] == 'PARTIALLY COVERED':
            return "**NEEDS-TEST** - Partial coverage insufficient"
        else:
            return "**PASS** - No blocking issues"

    def generate_all_cards(self, output_file: str, max_cards: int = None):
        """Generate all remediation cards"""
        with open(output_file, 'w', encoding='utf-8') as f:
            f.write("# Fleet Management System - Complete Remediation Cards\n\n")
            f.write("Auto-generated comprehensive remediation plan covering ALL UI elements.\n\n")
            f.write(f"**Total Items**: {len(self.inventory)}\n\n")
            f.write("---\n\n")

            items_to_process = self.inventory[:max_cards] if max_cards else self.inventory

            for idx, item in enumerate(items_to_process, 1):
                card = self.generate_card(item, idx)
                f.write(card)

                if idx % 100 == 0:
                    print(f"Generated {idx}/{len(items_to_process)} cards...")

        print(f"\n✅ Generated {len(items_to_process)} remediation cards to {output_file}")

    def generate_executive_summary(self, stats: Dict, output_file: str):
        """Generate executive summary"""
        with open(output_file, 'w', encoding='utf-8') as f:
            f.write("# Fleet Management System - 100% Remediation Review\n")
            f.write("# Executive Summary\n\n")

            f.write("## Overall Statistics\n\n")
            f.write(f"- **Total UI Elements Scanned**: {stats['total_items']:,}\n")
            f.write(f"- **Total Routes**: {stats['total_routes']}\n")
            f.write(f"- **Total API Endpoints**: {stats['total_endpoints']}\n\n")

            f.write("## Test Coverage\n\n")
            f.write(f"- **Covered**: {stats['coverage_stats']['covered']:,} ({stats['coverage_percentage']:.1f}%)\n")
            f.write(f"- **Partially Covered**: {stats['coverage_stats']['partially_covered']:,}\n")
            f.write(f"- **Not Covered**: {stats['coverage_stats']['not_covered']:,} ({stats['not_covered_percentage']:.1f}%)\n\n")

            f.write("## Elements by Type\n\n")
            f.write("| Element Type | Count | Percentage |\n")
            f.write("|--------------|-------|------------|\n")
            for elem_type, count in sorted(stats['by_type'].items(), key=lambda x: x[1], reverse=True)[:20]:
                pct = count / stats['total_items'] * 100
                f.write(f"| {elem_type} | {count:,} | {pct:.1f}% |\n")

            f.write("\n## Critical Issues\n\n")
            f.write(f"**Total Critical Issues Found**: {len(stats['critical_issues'])}\n\n")

            if stats['critical_issues']:
                f.write("### Sample Critical Issues (first 20)\n\n")
                for issue in stats['critical_issues'][:20]:
                    f.write(f"- **Item #{issue['item_id']}**: {issue['issue']} in `{issue['file']}:{issue['line']}`\n")

            f.write("\n## GO/NO-GO Assessment\n\n")

            # Calculate GO/NO-GO
            blocking_count = sum(1 for issue in stats['critical_issues'] if 'without' in issue['issue'] or 'XSS' in issue['issue'])
            test_coverage_insufficient = stats['not_covered_percentage'] > 50

            if blocking_count > 100 or test_coverage_insufficient:
                f.write("### 🔴 **NO-GO FOR PRODUCTION**\n\n")
                f.write("**Reasons**:\n")
                if blocking_count > 100:
                    f.write(f"- {blocking_count} critical accessibility/security issues\n")
                if test_coverage_insufficient:
                    f.write(f"- Test coverage is only {stats['coverage_percentage']:.1f}% (minimum 80% required)\n")
                f.write("\n**Required Actions**:\n")
                f.write("1. Fix all critical accessibility issues (missing labels)\n")
                f.write("2. Add handlers to all interactive buttons/links\n")
                f.write("3. Increase test coverage to at least 80%\n")
                f.write("4. Review and remediate all XSS vulnerabilities\n")
            else:
                f.write("### 🟡 **CONDITIONAL GO - REMEDIATION REQUIRED**\n\n")
                f.write("**Status**: System is functional but has known issues that should be addressed.\n\n")
                f.write("**Recommended Actions**:\n")
                f.write("1. Address critical accessibility issues\n")
                f.write("2. Improve test coverage from {stats['coverage_percentage']:.1f}% to 80%+\n")
                f.write("3. Review security concerns in remediation cards\n")

            f.write("\n## Next Steps\n\n")
            f.write("1. Review `REMEDIATION_CARDS.md` for detailed fixes\n")
            f.write("2. Prioritize BLOCKING status items\n")
            f.write("3. Create test files for NOT COVERED elements\n")
            f.write("4. Re-run this analysis after fixes to verify improvement\n")

        print(f"✅ Generated executive summary to {output_file}")

if __name__ == "__main__":
    root_dir = "/Users/andrewmorton/Documents/GitHub/Fleet"
    generator = RemediationCardsGenerator(root_dir)

    print("="*80)
    print("FLEET MANAGEMENT SYSTEM - REMEDIATION CARDS GENERATION")
    print("="*80)
    print()

    print("Loading data...")
    generator.load_data()

    print("Calculating statistics...")
    stats = generator.calculate_statistics()

    print(f"\nFound {stats['total_items']:,} UI elements to remediate")
    print(f"Coverage: {stats['coverage_percentage']:.1f}%")
    print(f"Critical Issues: {len(stats['critical_issues'])}")

    print("\nGenerating executive summary...")
    generator.generate_executive_summary(stats, f"{root_dir}/COVERAGE_REPORT.md")

    print("\nGenerating remediation cards (this may take a few minutes)...")
    # Generate first 500 cards as sample, can be increased
    generator.generate_all_cards(f"{root_dir}/REMEDIATION_CARDS_SAMPLE.md", max_cards=500)

    # Save statistics to JSON
    with open(f"{root_dir}/REMEDIATION_STATISTICS.json", 'w', encoding='utf-8') as f:
        # Convert defaultdict to dict for JSON serialization
        stats_json = {k: dict(v) if isinstance(v, defaultdict) else v for k, v in stats.items()}
        json.dump(stats_json, f, indent=2)

    print(f"\n✅ All reports generated successfully!")
    print(f"\nGenerated files:")
    print(f"  - COVERAGE_REPORT.md (Executive Summary)")
    print(f"  - REMEDIATION_CARDS_SAMPLE.md (First 500 detailed cards)")
    print(f"  - REMEDIATION_STATISTICS.json (Raw statistics)")
    print(f"  - COMPLETE_INVENTORY_WITH_COVERAGE.csv (Full inventory with test coverage)")
