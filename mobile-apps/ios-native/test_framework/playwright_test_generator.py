#!/usr/bin/env python3
"""
Playwright Test Generator from UI Completeness Specification

Generates Playwright test suites from the CSV exports and page audits
in the UI completeness specification.

Usage:
    python playwright_test_generator.py fleet_ui_completeness_spec_v2.json
"""

from __future__ import annotations
import json
import sys
from pathlib import Path
from typing import Dict, Any, List


def generate_page_test(page_audit: Dict[str, Any]) -> str:
    """Generate a Playwright test for a single page audit"""

    page_key = page_audit.get('page_key', 'unknown')
    components = page_audit.get('components', [])
    states = page_audit.get('states', [])
    analytics = page_audit.get('analytics', [])

    # Start test file
    test_code = f'''import {{ test, expect }} from '@playwright/test';

test.describe('{page_key} page', () => {{
  test.beforeEach(async ({{ page }}) => {{
    // TODO: Add authentication if required
    // await page.goto('/login');
    // await page.fill('[name="email"]', 'test@example.com');
    // await page.fill('[name="password"]', 'password');
    // await page.click('button[type="submit"]');
  }});

'''

    # Test for each state
    for state in states:
        if state == 'loading':
            test_code += f'''  test('should show loading state', async ({{ page }}) => {{
    await page.goto('/{page_key}');

    // Verify loading indicator appears
    const loadingIndicator = page.locator('[data-testid="loading"], .loading, [aria-label="Loading"]');
    await expect(loadingIndicator).toBeVisible();
  }});

'''
        elif state == 'empty':
            test_code += f'''  test('should show empty state when no data', async ({{ page }}) => {{
    // TODO: Mock API to return empty data
    await page.route('**/api/{page_key}*', route => {{
      route.fulfill({{
        status: 200,
        body: JSON.stringify({{ data: [], total: 0 }})
      }});
    }});

    await page.goto('/{page_key}');

    // Verify empty state message
    const emptyState = page.locator('[data-testid="empty-state"], .empty-state');
    await expect(emptyState).toBeVisible();
  }});

'''
        elif state == 'error':
            test_code += f'''  test('should show error state on API failure', async ({{ page }}) => {{
    // Mock API error
    await page.route('**/api/{page_key}*', route => {{
      route.fulfill({{
        status: 500,
        body: JSON.stringify({{ error: 'Internal server error' }})
      }});
    }});

    await page.goto('/{page_key}');

    // Verify error message
    const errorState = page.locator('[role="alert"], .error-state');
    await expect(errorState).toBeVisible();
  }});

'''

    # Test for each component and its actions
    for component in components:
        comp_key = component.get('key', 'unknown')
        actions = component.get('actions', [])

        for action in actions:
            control = action.get('control', 'unknown')
            handler = action.get('handler', 'unknown')
            api = action.get('api', '')
            fully_wired = action.get('fully_wired', False)

            if fully_wired and api:
                test_code += f'''  test('should handle {control} action', async ({{ page }}) => {{
    await page.goto('/{page_key}');

    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Click the control
    const control = page.locator('[data-testid="{control}"], button:has-text("{control.replace("btn_", "").replace("_", " ").title()}")').first();
    await control.click();

    // Wait for API call
    const response = await page.waitForResponse(resp =>
      resp.url().includes('/{api.split("/")[-1] if "/" in api else api}') &&
      resp.request().method() === '{api.split()[0] if " " in api else "POST"}'
    );

    // Verify successful response
    expect(response.status()).toBe(200);

    // TODO: Add assertions for UI updates after action
  }});

'''

    # Test for drilldowns
    for component in components:
        drilldowns = component.get('drilldowns', [])
        for drilldown in drilldowns:
            level = drilldown.get('level', 1)
            from_action = drilldown.get('from', 'unknown')
            to_page = drilldown.get('to_page_key', 'unknown')

            test_code += f'''  test('should navigate to {to_page} on {from_action}', async ({{ page }}) => {{
    await page.goto('/{page_key}');
    await page.waitForLoadState('networkidle');

    // Trigger drilldown action
    const trigger = page.locator('[data-testid="{from_action}"]').first();
    await trigger.click();

    // Verify navigation
    await expect(page).toHaveURL(new RegExp('/{to_page}'));
  }});

'''

    # Test for analytics events
    for event in analytics:
        event_name = event.get('event', 'unknown')
        on_trigger = event.get('on', 'unknown')

        test_code += f'''  test('should fire {event_name} analytics event on {on_trigger}', async ({{ page }}) => {{
    // Intercept analytics calls
    const analyticsEvents: any[] = [];
    await page.route('**/analytics/**', route => {{
      analyticsEvents.push(route.request().postDataJSON());
      route.fulfill({{ status: 200, body: '{{}}' }});
    }});

    await page.goto('/{page_key}');

    // Trigger action (page_load happens automatically)
    {'// Action already triggered by page load' if on_trigger == 'page_load' else f'// TODO: Trigger {on_trigger}'}

    // Wait briefly for analytics
    await page.waitForTimeout(500);

    // Verify event was sent
    const event = analyticsEvents.find(e => e.event === '{event_name}');
    expect(event).toBeDefined();

    // TODO: Verify event properties
  }});

'''

    test_code += '});\n'
    return test_code


def generate_csv_based_tests(csv_matrix: List[List[str]]) -> str:
    """Generate tests from CSV export matrix"""

    test_code = '''import { test, expect } from '@playwright/test';

test.describe('Page Component Matrix Coverage', () => {
  // Generated from CSV_EXPORTS.PAGE_COMPONENT_MATRIX

'''

    for row in csv_matrix:
        if len(row) < 7:
            continue

        page, component, control, api, wired, guard, event = row

        if wired.lower() == 'true':
            test_code += f'''  test('{page} - {component} - {control}', async ({{ page }}) => {{
    // TODO: Authenticate with appropriate role: {guard if guard else "any"}

    await page.goto('/{page}');
    await page.waitForLoadState('networkidle');

    // Locate and click control
    const control = page.locator('[data-testid="{control}"]').first();
    await expect(control).toBeVisible();
    await control.click();

    {f'// Wait for API: {api}' if api and api != 'none' else '// No API call expected'}
    {f"""const response = await page.waitForResponse(resp => resp.url().includes('{api.split()[-1].split('/')[-1]}'));
    expect(response.status()).toBe(200);""" if api and api != 'none' else ''}

    {f'// Verify analytics event: {event}' if event else ''}
    {f"""// TODO: Assert {event} was fired""" if event else ''}
  }});

'''

    test_code += '});\n'
    return test_code


def generate_accessibility_tests(page_audits: List[Dict[str, Any]]) -> str:
    """Generate accessibility tests"""

    test_code = '''import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Accessibility (WCAG 2.2 AA)', () => {
'''

    for audit in page_audits:
        page_key = audit.get('page_key', 'unknown')
        a11y = audit.get('a11y', {})
        wcag = a11y.get('wcag', '2.2AA')

        test_code += f'''  test('{page_key} should have no accessibility violations', async ({{ page }}) => {{
    await page.goto('/{page_key}');
    await page.waitForLoadState('networkidle');

    const accessibilityScanResults = await new AxeBuilder({{ page }})
      .withTags(['wcag2a', 'wcag2aa', 'wcag22aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  }});

  test('{page_key} should be keyboard navigable', async ({{ page }}) => {{
    await page.goto('/{page_key}');
    await page.waitForLoadState('networkidle');

    // Tab through interactive elements
    const interactiveElements = await page.locator('button, a, input, select, textarea').all();

    for (let i = 0; i < Math.min(interactiveElements.length, 10); i++) {{
      await page.keyboard.press('Tab');
      const focused = await page.evaluate(() => document.activeElement?.tagName);
      expect(['BUTTON', 'A', 'INPUT', 'SELECT', 'TEXTAREA']).toContain(focused);
    }}
  }});

'''

    test_code += '});\n'
    return test_code


def generate_performance_tests(page_audits: List[Dict[str, Any]]) -> str:
    """Generate performance budget tests"""

    test_code = '''import { test, expect } from '@playwright/test';

test.describe('Performance Budgets (Core Web Vitals)', () => {
'''

    for audit in page_audits:
        page_key = audit.get('page_key', 'unknown')
        budget = audit.get('perf_budget', {})

        lcp_budget = budget.get('LCP_ms', 2500)
        inp_budget = budget.get('INP_ms', 200)
        cls_budget = budget.get('CLS', 0.1)

        test_code += f'''  test('{page_key} should meet Core Web Vitals budgets', async ({{ page }}) => {{
    await page.goto('/{page_key}');

    // Measure performance
    const metrics = await page.evaluate(() => {{
      const entries = performance.getEntriesByType('navigation');
      const lcp = performance.getEntriesByType('largest-contentful-paint')[0];

      return {{
        lcp: lcp?.startTime || 0,
        // Note: Full CWV measurement requires additional instrumentation
      }};
    }});

    // Check LCP budget
    expect(metrics.lcp).toBeLessThan({lcp_budget});

    // TODO: Add INP and CLS measurements with web-vitals library
  }});

'''

    test_code += '});\n'
    return test_code


def main():
    """Main execution"""
    if len(sys.argv) < 2:
        print("Usage: python playwright_test_generator.py <spec_file.json>")
        print()
        print("Example:")
        print("  python playwright_test_generator.py fleet_ui_completeness_spec_v2.json")
        sys.exit(1)

    spec_file = Path(sys.argv[1])
    if not spec_file.exists():
        print(f"Error: Spec file not found: {spec_file}")
        sys.exit(1)

    print(f"Generating Playwright tests from: {spec_file.name}")
    print()

    # Load spec
    with open(spec_file) as f:
        spec = json.load(f)

    output_dir = Path("generated_tests")
    output_dir.mkdir(exist_ok=True)

    # Generate page-specific tests
    page_audits = spec.get('page_audits', [])
    for audit in page_audits:
        page_key = audit.get('page_key', 'unknown')
        test_code = generate_page_test(audit)

        output_file = output_dir / f"{page_key}.spec.ts"
        with open(output_file, 'w') as f:
            f.write(test_code)

        print(f"✓ Generated: {output_file}")

    # Generate CSV-based tests
    csv_matrix = spec.get('csv_exports', {}).get('PAGE_COMPONENT_MATRIX', [])
    if csv_matrix:
        test_code = generate_csv_based_tests(csv_matrix)
        output_file = output_dir / "component_matrix.spec.ts"
        with open(output_file, 'w') as f:
            f.write(test_code)
        print(f"✓ Generated: {output_file}")

    # Generate accessibility tests
    test_code = generate_accessibility_tests(page_audits)
    output_file = output_dir / "accessibility.spec.ts"
    with open(output_file, 'w') as f:
        f.write(test_code)
    print(f"✓ Generated: {output_file}")

    # Generate performance tests
    test_code = generate_performance_tests(page_audits)
    output_file = output_dir / "performance.spec.ts"
    with open(output_file, 'w') as f:
        f.write(test_code)
    print(f"✓ Generated: {output_file}")

    print()
    print("=" * 70)
    print("Test generation complete!")
    print("=" * 70)
    print()
    print(f"Tests saved to: {output_dir}/")
    print()
    print("Next steps:")
    print("  1. Review generated tests and add missing assertions")
    print("  2. Update selectors to match your actual app")
    print("  3. Add authentication logic in beforeEach hooks")
    print("  4. Install dependencies:")
    print("     npm install --save-dev @playwright/test @axe-core/playwright")
    print("  5. Run tests:")
    print("     npx playwright test")
    print()


if __name__ == "__main__":
    main()
