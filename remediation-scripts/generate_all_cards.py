#!/usr/bin/env python3
"""
Remediation Card Generator
Generates individual remediation cards for EVERY item needing attention
"""

import json
from pathlib import Path
from typing import List, Dict, Any
from tqdm import tqdm
from datetime import datetime

class RemediationCardGenerator:
    def __init__(self, data_dir: str, output_dir: str):
        self.data_dir = Path(data_dir)
        self.output_dir = Path(output_dir)
        self.cards = []

    def load_data(self) -> Dict[str, Any]:
        """Load all analysis data"""
        print("\nLoading analysis data...")

        data = {
            'ui_elements': [],
            'routes': [],
            'coverage_gaps': [],
            'test_files': []
        }

        # Load UI elements
        ui_path = self.data_dir / 'COMPLETE_UI_INVENTORY.json'
        if ui_path.exists():
            with open(ui_path, 'r', encoding='utf-8') as f:
                data['ui_elements'] = json.load(f)
            print(f"  ✓ Loaded {len(data['ui_elements'])} UI elements")

        # Load routes
        routes_path = self.data_dir / 'ROUTE_ANALYSIS.json'
        if routes_path.exists():
            with open(routes_path, 'r', encoding='utf-8') as f:
                data['routes'] = json.load(f)
            print(f"  ✓ Loaded {len(data['routes'])} routes")

        # Load coverage gaps
        gaps_path = self.data_dir / 'TEST_COVERAGE_GAPS.json'
        if gaps_path.exists():
            with open(gaps_path, 'r', encoding='utf-8') as f:
                data['coverage_gaps'] = json.load(f)
            print(f"  ✓ Loaded {len(data['coverage_gaps'])} coverage gaps")

        return data

    def generate_ui_element_card(self, element: Dict[str, Any], index: int) -> str:
        """Generate card for UI element"""
        card = f"""
## Card {index:06d}: {element.get('element_type', 'Unknown')} - {element.get('component_name', 'Unknown')}

**Type:** UI Element Remediation
**Priority:** {self.determine_ui_priority(element)}
**Status:** Needs Testing

### Location
- **File:** `{element.get('file_path', 'Unknown')}`
- **Line:** {element.get('line_number', 'N/A')}
- **Component:** {element.get('component_name', 'Unknown')}

### Element Details
- **Element Type:** {element.get('element_type', 'Unknown')}
- **Label/Text:** {element.get('label_text', 'No label')}
- **Handler:** `{element.get('handler_action', 'No handler')}`
- **Props:** {element.get('props', 'None')}

### Business Purpose
{self.infer_business_purpose(element)}

### Expected Behavior
{self.define_expected_behavior(element)}

### Current Test Status
- **Coverage:** {element.get('test_coverage', 'NOT TESTED')}
- **Needs:** Comprehensive test coverage

### Required Tests
{self.generate_test_plan(element)}

### Acceptance Criteria
- [ ] Unit tests written and passing
- [ ] Integration tests cover user interactions
- [ ] Accessibility tests implemented
- [ ] Edge cases handled
- [ ] Error states tested
- [ ] Loading states tested

### Implementation Notes
{self.generate_implementation_notes(element)}

---
"""
        return card

    def generate_route_card(self, route: Dict[str, Any], index: int) -> str:
        """Generate card for route"""
        card = f"""
## Card {index:06d}: Route - {route.get('path', 'Unknown')}

**Type:** Route/Page Remediation
**Priority:** {'Critical' if route.get('requires_auth') else 'High'}
**Status:** Needs Testing

### Location
- **Route Path:** `{route.get('path', 'Unknown')}`
- **Component:** {route.get('component', 'Unknown')}
- **File:** `{route.get('file_path', 'Unknown')}`

### Route Details
- **Type:** {route.get('route_type', 'page')}
- **Requires Auth:** {route.get('requires_auth', False)}
- **Permissions:** {', '.join(route.get('permissions', [])) or 'None'}
- **Lazy Loaded:** {route.get('lazy_loaded', False)}
- **Parent Route:** {route.get('parent_route', 'None')}

### Business Purpose
{self.infer_route_purpose(route)}

### Expected Behavior
{self.define_route_behavior(route)}

### Current States
Handles the following states:
{self.format_list(route.get('states', []))}

### Required Tests
1. **Navigation Tests**
   - Test route accessibility
   - Test navigation from parent routes
   - Test deep linking

2. **Loading State Tests**
   - Test initial load
   - Test lazy loading behavior
   - Test loading indicators

3. **Error State Tests**
   - Test 404 handling
   - Test error boundaries
   - Test API failures

4. **Authentication Tests** {'(REQUIRED)' if route.get('requires_auth') else '(If applicable)'}
   - Test authenticated access
   - Test redirect to login
   - Test permission checking

5. **Content Tests**
   - Test page rendering
   - Test all interactive elements
   - Test responsive behavior

### Acceptance Criteria
- [ ] Route navigation tested
- [ ] All page states tested (loading, error, empty, success)
- [ ] Authentication/authorization tested
- [ ] All UI elements on page tested
- [ ] Accessibility compliance verified
- [ ] Performance metrics met

### Implementation Notes
- Ensure all child components are tested
- Test with different user roles/permissions
- Consider mobile and tablet viewports

---
"""
        return card

    def generate_gap_card(self, gap: Dict[str, Any], index: int) -> str:
        """Generate card for coverage gap"""
        card = f"""
## Card {index:06d}: Coverage Gap - {gap.get('item_name', 'Unknown')}

**Type:** Test Coverage Gap
**Priority:** {gap.get('priority', 'Medium').upper()}
**Status:** No Tests Exist

### Location
- **Item Type:** {gap.get('item_type', 'Unknown')}
- **Item Name:** {gap.get('item_name', 'Unknown')}
- **File:** `{gap.get('file_path', 'Unknown')}`

### Issue
{gap.get('reason', 'No test coverage exists for this item')}

### Suggested Tests
{self.format_list(gap.get('suggested_tests', []))}

### Test Creation Plan
1. **Create test file** at `{self.suggest_test_file_path(gap)}`
2. **Set up test environment** with necessary mocks and fixtures
3. **Implement test cases** covering all scenarios
4. **Run tests** and verify 100% coverage
5. **Document edge cases** and limitations

### Acceptance Criteria
- [ ] Test file created
- [ ] All suggested tests implemented
- [ ] Tests passing
- [ ] Coverage ≥ 80%
- [ ] Edge cases documented

---
"""
        return card

    def determine_ui_priority(self, element: Dict[str, Any]) -> str:
        """Determine priority for UI element"""
        element_type = element.get('element_type', '')
        handler = element.get('handler_action', '')
        test_coverage = element.get('test_coverage', '')

        if test_coverage != 'NOT TESTED':
            return 'Low'

        critical_types = ['Button', 'Form', 'Input', 'Link']
        if element_type in critical_types:
            return 'Critical'

        if 'onClick' in handler or 'onSubmit' in handler:
            return 'High'

        return 'Medium'

    def infer_business_purpose(self, element: Dict[str, Any]) -> str:
        """Infer business purpose from element details"""
        element_type = element.get('element_type', '')
        label = element.get('label_text', '').lower()
        file_path = element.get('file_path', '').lower()

        purposes = {
            'Button': 'Triggers user actions and workflow transitions',
            'Input': 'Captures user input data',
            'Select': 'Allows user to choose from predefined options',
            'Form': 'Collects and submits user data',
            'Link': 'Navigates to different pages or sections',
            'Checkbox': 'Enables boolean selection',
            'Radio': 'Enables single selection from multiple options',
        }

        base_purpose = purposes.get(element_type, 'Provides user interaction')

        # Add context from file path
        if 'auth' in file_path:
            context = 'in authentication flow'
        elif 'dashboard' in file_path:
            context = 'in dashboard interface'
        elif 'admin' in file_path:
            context = 'in administrative functions'
        elif 'report' in file_path:
            context = 'in reporting features'
        else:
            context = 'in application workflow'

        return f"{base_purpose} {context}."

    def define_expected_behavior(self, element: Dict[str, Any]) -> str:
        """Define expected behavior for element"""
        element_type = element.get('element_type', '')
        handler = element.get('handler_action', '')

        behaviors = {
            'Button': [
                'Responds to click events',
                'Shows appropriate visual feedback',
                'Executes associated handler function',
                'Handles disabled state correctly',
                'Provides accessible labels'
            ],
            'Input': [
                'Accepts user text input',
                'Validates input according to rules',
                'Shows validation errors clearly',
                'Handles focus/blur states',
                'Supports keyboard navigation'
            ],
            'Form': [
                'Collects all field values',
                'Validates before submission',
                'Handles submission errors',
                'Shows loading state during submit',
                'Resets or clears after success'
            ]
        }

        default_behaviors = [
            'Renders correctly in all states',
            'Handles user interactions appropriately',
            'Provides clear feedback to users',
            'Maintains accessibility standards'
        ]

        return self.format_list(behaviors.get(element_type, default_behaviors))

    def generate_test_plan(self, element: Dict[str, Any]) -> str:
        """Generate test plan for element"""
        element_type = element.get('element_type', '')

        test_plans = {
            'Button': [
                '**Rendering:** Verify button renders with correct label and styling',
                '**Click Handling:** Test onClick handler is called with correct parameters',
                '**Disabled State:** Verify button cannot be clicked when disabled',
                '**Loading State:** Test loading indicator and disabled state during async operations',
                '**Accessibility:** Verify ARIA labels and keyboard navigation'
            ],
            'Input': [
                '**Rendering:** Verify input renders with correct type and placeholder',
                '**Value Changes:** Test onChange handler updates value correctly',
                '**Validation:** Test input validation for invalid values',
                '**Error Display:** Verify error messages display correctly',
                '**Focus/Blur:** Test focus and blur event handlers'
            ],
            'Form': [
                '**Rendering:** Verify form renders with all fields',
                '**Submission:** Test form submission with valid data',
                '**Validation:** Test form-level validation before submit',
                '**Error Handling:** Test handling of server errors',
                '**Success Handling:** Test success callback and form reset'
            ]
        }

        default_plan = [
            '**Rendering:** Verify element renders correctly',
            '**Interaction:** Test user interactions',
            '**States:** Test all visual states',
            '**Accessibility:** Verify accessibility compliance'
        ]

        return self.format_list(test_plans.get(element_type, default_plan))

    def generate_implementation_notes(self, element: Dict[str, Any]) -> str:
        """Generate implementation notes"""
        notes = [
            f"Use Testing Library for user-centric tests",
            f"Mock external dependencies appropriately",
            f"Test with various user roles/permissions",
            f"Consider edge cases and error scenarios"
        ]
        return self.format_list(notes)

    def infer_route_purpose(self, route: Dict[str, Any]) -> str:
        """Infer business purpose of route"""
        path = route.get('path', '').lower()
        component = route.get('component', '').lower()

        if 'dashboard' in path:
            return "Provides high-level overview and key metrics for users."
        elif 'admin' in path:
            return "Enables administrative functions and system management."
        elif 'report' in path:
            return "Displays data analytics and reporting features."
        elif 'vehicle' in path or 'fleet' in path:
            return "Manages fleet vehicle information and operations."
        elif 'driver' in path:
            return "Manages driver information and assignments."
        elif 'maintenance' in path:
            return "Tracks and schedules vehicle maintenance activities."
        elif 'settings' in path:
            return "Allows users to configure system and account settings."
        elif 'auth' in path or 'login' in path:
            return "Handles user authentication and authorization."
        else:
            return f"Provides {component} functionality to users."

    def define_route_behavior(self, route: Dict[str, Any]) -> str:
        """Define expected behavior for route"""
        behaviors = [
            'Loads and displays page content correctly',
            'Shows loading indicator during data fetch',
            'Displays error state if data loading fails',
            'Shows empty state when no data available',
            'Handles user interactions appropriately',
            'Maintains proper authentication state',
            'Supports browser back/forward navigation',
            'Loads efficiently with lazy loading'
        ]
        return self.format_list(behaviors)

    def format_list(self, items: List[str]) -> str:
        """Format list as markdown"""
        if not items:
            return "- None specified"
        return '\n'.join([f"- {item}" for item in items])

    def suggest_test_file_path(self, gap: Dict[str, Any]) -> str:
        """Suggest test file path for gap"""
        file_path = gap.get('file_path', '')
        if file_path and file_path != 'Unknown':
            return file_path.replace('.tsx', '.test.tsx').replace('.ts', '.test.ts')
        return f"{gap.get('item_name', 'Unknown').replace('.', '_')}.test.tsx"

    def generate_all_cards(self) -> None:
        """Generate remediation cards for all items"""
        data = self.load_data()

        print("\nGenerating remediation cards...")

        card_index = 1

        # Generate UI element cards
        print(f"\n[1/3] Generating {len(data['ui_elements'])} UI element cards...")
        for element in tqdm(data['ui_elements'], desc="UI cards"):
            if element.get('test_coverage') in ['NOT TESTED', 'Unknown']:
                card = self.generate_ui_element_card(element, card_index)
                self.cards.append(card)
                card_index += 1

        # Generate route cards
        print(f"\n[2/3] Generating {len(data['routes'])} route cards...")
        for route in tqdm(data['routes'], desc="Route cards"):
            card = self.generate_route_card(route, card_index)
            self.cards.append(card)
            card_index += 1

        # Generate coverage gap cards
        print(f"\n[3/3] Generating {len(data['coverage_gaps'])} coverage gap cards...")
        for gap in tqdm(data['coverage_gaps'], desc="Gap cards"):
            card = self.generate_gap_card(gap, card_index)
            self.cards.append(card)
            card_index += 1

    def export_cards(self) -> None:
        """Export all cards to markdown file"""
        self.output_dir.mkdir(exist_ok=True)

        output_file = self.output_dir / 'REMEDIATION_CARDS_ALL.md'

        with open(output_file, 'w', encoding='utf-8') as f:
            # Write header
            f.write(f"""# Fleet Management System - Complete Remediation Cards

**Generated:** {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
**Total Cards:** {len(self.cards)}

---

## Table of Contents

This document contains individual remediation cards for every item requiring attention in the Fleet Management System.

### Statistics
- **Total Remediation Items:** {len(self.cards)}
- **Estimated Effort:** {len(self.cards) * 2} developer-hours (avg 2 hours per item)
- **Recommended Timeline:** 8-10 weeks with team of 4-6 developers

### Priority Breakdown
Cards are organized by priority:
- **Critical:** Immediate action required
- **High:** Next sprint
- **Medium:** Backlog
- **Low:** Future consideration

---

## Remediation Cards

""")

            # Write all cards
            for card in self.cards:
                f.write(card)

        print(f"\n✓ Exported {len(self.cards)} cards to {output_file}")
        print(f"  File size: {output_file.stat().st_size / 1024 / 1024:.2f} MB")

def main():
    print("=" * 80)
    print("REMEDIATION CARD GENERATOR")
    print("=" * 80)

    data_dir = Path(__file__).parent.parent / 'remediation-data'
    output_dir = Path(__file__).parent.parent

    generator = RemediationCardGenerator(data_dir, output_dir)

    print("\n[1/2] Generating cards...")
    generator.generate_all_cards()

    print("\n[2/2] Exporting cards...")
    generator.export_cards()

    print("\n" + "=" * 80)
    print("CARD GENERATION COMPLETE")
    print("=" * 80)
    print(f"Total Cards Generated: {len(generator.cards)}")
    print("=" * 80)

if __name__ == '__main__':
    main()
