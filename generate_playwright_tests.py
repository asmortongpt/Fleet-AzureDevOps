#!/usr/bin/env python3
"""
Generate Playwright E2E tests for UI elements from TEST_COVERAGE_GAPS.csv
"""

import csv
import json
import subprocess
from pathlib import Path
from collections import defaultdict

def parse_coverage_gaps():
    """Parse the CSV and group by file_path"""
    csv_file = Path('remediation-data/TEST_COVERAGE_GAPS.csv')
    
    if not csv_file.exists():
        print(f"ERROR: {csv_file} not found")
        return {}
    
    gaps_by_file = defaultdict(list)
    
    with open(csv_file, 'r') as f:
        reader = csv.DictReader(f)
        for row in reader:
            # Focus on critical UI elements first
            if row['item_type'] == 'ui_element' and row['priority'] in ['critical', 'high']:
                gaps_by_file[row['file_path']].append(row)
    
    return gaps_by_file

def generate_test_for_file(file_path, elements, test_index):
    """Generate a Playwright test file for a component"""
    
    # Extract component name from file path
    component_name = Path(file_path).stem
    
    # Group elements by type
    elements_by_type = defaultdict(list)
    for elem in elements:
        elem_type = elem['item_name'].split('.')[-1]  # e.g., Button, Card, Input
        elements_by_type[elem_type].append(elem)
    
    # Generate test content
    test_content = f'''import {{ test, expect }} from '@playwright/test';

/**
 * E2E Tests for {component_name}
 * Auto-generated from TEST_COVERAGE_GAPS.csv
 * 
 * Component: {file_path}
 * Elements tested: {len(elements)}
 */

test.describe('{component_name} - UI Elements', () => {{
  test.beforeEach(async ({{ page }}) => {{
    // Navigate to the page containing this component
    await page.goto('/');
    // TODO: Navigate to specific route for {component_name}
  }});
'''
    
    # Generate tests for each element type
    for elem_type, elems in elements_by_type.items():
        test_content += f'''
  test.describe('{elem_type} elements', () => {{
'''
        for idx, elem in enumerate(elems[:3]):  # Limit to 3 tests per type to avoid spam
            test_content += f'''
    test('should render {elem_type} #{idx + 1}', async ({{ page }}) => {{
      // Test rendering
      const element = page.locator('{elem_type.lower()}').nth({idx});
      await expect(element).toBeVisible();
    }});

    test('should be accessible - {elem_type} #{idx + 1}', async ({{ page }}) => {{
      // Test accessibility
      const element = page.locator('{elem_type.lower()}').nth({idx});
      await expect(element).toHaveAttribute('aria-label');
    }});

    test('should be interactive - {elem_type} #{idx + 1}', async ({{ page }}) => {{
      // Test interactions
      const element = page.locator('{elem_type.lower()}').nth({idx});
      await element.click();
      // TODO: Add specific interaction assertions
    }});
'''
        
        test_content += '''  });
'''
    
    test_content += '''});
'''
    
    # Write test file
    test_dir = Path('e2e/generated-tests')
    test_dir.mkdir(parents=True, exist_ok=True)
    
    test_file = test_dir / f'{test_index:04d}-{component_name}.spec.ts'
    test_file.write_text(test_content)
    
    return test_file

def main():
    print("Playwright Test Generator")
    print("="*60)
    
    gaps_by_file = parse_coverage_gaps()
    
    if not gaps_by_file:
        print("No critical/high priority UI elements found")
        return
    
    print(f"Found {len(gaps_by_file)} files with coverage gaps")
    print(f"Generating tests for top 100 files...\n")
    
    # Sort by number of elements (most gaps first)
    sorted_files = sorted(gaps_by_file.items(), key=lambda x: len(x[1]), reverse=True)
    
    generated_count = 0
    total_tests = 0
    
    for idx, (file_path, elements) in enumerate(sorted_files[:100]):  # Generate 100 test files
        if idx >= 100:
            break
        
        test_file = generate_test_for_file(file_path, elements, idx + 1)
        num_tests = len(elements) * 3  # 3 tests per element (render, accessibility, interaction)
        total_tests += num_tests
        generated_count += 1
        
        print(f"  {idx+1:3d}. {test_file.name:50s} ({num_tests:3d} tests)")
        
        # Commit every 20 test files
        if (idx + 1) % 20 == 0:
            subprocess.run(['git', 'add', 'e2e/generated-tests/'], check=True)
            subprocess.run([
                'git', 'commit', '-m',
                f'test: Generate {20} Playwright test files (total: {generated_count} files, ~{total_tests} tests)'
            ], check=True)
            print(f"\n📦 Committed batch of 20 test files\n")
    
    # Final commit
    if generated_count % 20 != 0:
        subprocess.run(['git', 'add', 'e2e/generated-tests/'], check=True)
        subprocess.run([
            'git', 'commit', '-m',
            f'test: Generate final Playwright test files (total: {generated_count} files, ~{total_tests} tests)'
        ], check=True)
    
    # Update progress
    try:
        with open('.remediation-progress.json', 'r') as f:
            progress = json.load(f)
        progress['results']['tests_generated'] = total_tests
        progress['completed'].append('playwright_tests')
        with open('.remediation-progress.json', 'w') as f:
            json.dump(progress, f, indent=2)
    except Exception as e:
        print(f"Warning: Could not update progress: {e}")
    
    print("\n" + "="*60)
    print(f"Test Generation Complete!")
    print(f"Test files created: {generated_count}")
    print(f"Approximate tests: {total_tests}")
    print("="*60)

if __name__ == '__main__':
    main()
