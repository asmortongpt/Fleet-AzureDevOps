#!/usr/bin/env python3
"""
Batch Validation Addition Script (BACKEND-23 Phase 2)

This script adds Zod validation middleware to high-risk routes.
"""

import os
import re
from pathlib import Path

# Base path for API routes
API_ROUTES_DIR = Path('/Users/andrewmorton/Documents/GitHub/Fleet/api/src/routes')

# List of high-risk route files
HIGH_RISK_ROUTES = [
    'admin-jobs.routes.ts',
    'asset-management.routes.ts',
    'calendar.routes.ts',
    'cost-analysis.routes.ts',
    'dispatch.routes.ts',
]

def find_route_definitions(content: str):
    """Find all route definitions in the file."""
    routes = []
    pattern = r"router\.(get|post|put|patch|delete)\s*\(\s*['\"]([^'\"]+)['\"]"
    
    for match in re.finditer(pattern, content):
        method = match.group(1).upper()
        path = match.group(2)
        line_number = content[:match.start()].count('\n') + 1
        routes.append((method, path, line_number))
    
    return routes

def has_validation(route_block: str) -> bool:
    """Check if route already has validation middleware."""
    validation_patterns = [
        r'validate\(',
        r'validateBody\(',
        r'validateQuery\(',
        r'body\(',
        r'query\(',
    ]
    
    for pattern in validation_patterns:
        if re.search(pattern, route_block):
            return True
    return False

def analyze_route_file(file_path: Path):
    """Analyze a route file for missing validation."""
    if not file_path.exists():
        print(f"  ⚠️  File not found: {file_path}")
        return
    
    with open(file_path, 'r') as f:
        content = f.read()
    
    routes = find_route_definitions(content)
    routes_needing_validation = []
    
    for method, path, line_num in routes:
        lines = content.split('\n')
        start_idx = line_num - 1
        end_idx = min(start_idx + 50, len(lines))
        route_block = '\n'.join(lines[start_idx:end_idx])
        
        if not has_validation(route_block):
            routes_needing_validation.append((method, path, line_num))
    
    if routes_needing_validation:
        print(f"  📝 Found {len(routes_needing_validation)} routes needing validation:")
        for method, path, _ in routes_needing_validation:
            print(f"     - {method} {path}")
    else:
        print(f"  ✅ All routes validated")
    
    return len(routes_needing_validation)

def main():
    print("="*80)
    print("BACKEND-23 Phase 2: Route Validation Analysis")
    print("="*80)
    print()
    
    total_routes = 0
    
    for route_file in HIGH_RISK_ROUTES:
        file_path = API_ROUTES_DIR / route_file
        print(f"Analyzing: {route_file}")
        count = analyze_route_file(file_path)
        if count:
            total_routes += count
        print()
    
    print("="*80)
    print(f"Total routes needing validation: {total_routes}")
    print("="*80)

if __name__ == '__main__':
    main()
