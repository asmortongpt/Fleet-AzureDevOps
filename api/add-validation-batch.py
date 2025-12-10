#!/usr/bin/env python3
"""
Batch Validation Addition Script
Adds Zod validation middleware to all routes missing validation
Part of BACKEND-23: Add Zod Validation to 155 API Routes
"""

import re
import sys
from pathlib import Path
from typing import List, Tuple

# Routes directory
ROUTES_DIR = Path('src/routes')

# Schema mappings (route name -> schema import)
SCHEMA_MAPPINGS = {
    'ai-chat': 'aiChatMessageSchema, aiChatSessionSchema',
    'ai-dispatch': 'dispatchAssignmentSchema',
    'ai-insights': 'aiInsightQuerySchema',
    'ai-task-prioritization': 'aiTaskPrioritizationSchema',
    'alerts': 'alertCreateSchema, alertUpdateSchema, alertQuerySchema',
    'asset-management': 'assetCreateSchema, assetUpdateSchema, assetQuerySchema',
    'asset-relationships': 'assetCreateSchema, assetUpdateSchema',
    'attachments': 'attachmentUploadSchema, documentSearchSchema',
    'billing-reports': 'billingReportSchema',
    'calendar': 'calendarEventSchema',
    'charging-stations': 'chargingStationSchema',
    'communication-logs': 'communicationLogSchema',
    'cost-analysis': 'costAnalysisQuerySchema',
    'costs': 'costEntrySchema',
    'crash-detection': 'crashDetectionSchema',
    'damage-reports': 'damageReportSchema',
    'dispatch': 'dispatchAssignmentSchema',
    'incidents': 'incidentCreateSchema',
    'mobile-assignment': 'mobileAssignmentSchema',
    'mobile-integration': 'mobileCheckInSchema',
    'ocr': 'ocrProcessSchema',
    'reservations': 'reservationSchema',
    'route-optimization': 'routeOptimizationSchema',
    'video-telematics': 'videoTelematicsEventSchema',
}

def get_schema_for_route(route_name: str) -> str:
    """Get appropriate schema imports for a route."""
    route_base = route_name.replace('.routes', '').replace('.enhanced', '').replace('.ts', '')

    if route_base in SCHEMA_MAPPINGS:
        return SCHEMA_MAPPINGS[route_base]

    # Default to common schemas
    return 'paginationSchema, uuidParamSchema'

def add_imports(content: str, route_name: str) -> str:
    """Add validation middleware and schema imports."""

    # Check if imports already exist
    if 'validateBody' in content or 'validateQuery' in content:
        return content

    # Find the last import statement
    import_pattern = r'(import\s+.*?from\s+[\'"].*?[\'"])'
    imports = list(re.finditer(import_pattern, content, re.MULTILINE))

    if not imports:
        return content

    last_import = imports[-1]
    insert_pos = last_import.end()

    # Get schema imports
    schemas = get_schema_for_route(route_name)

    # Create new imports
    new_imports = f'''
import {{ validateBody, validateParams, validateQuery, validateAll }} from '../middleware/validate'
import {{ {schemas} }} from '../schemas/comprehensive.schema'
import {{ uuidParamSchema, paginationSchema }} from '../schemas/common.schema'
'''

    # Insert imports
    content = content[:insert_pos] + new_imports + content[insert_pos:]

    return content

def add_validation_to_route(route_def: str, method: str, route_path: str) -> str:
    """Add validation middleware to a route definition."""

    # Skip if already has validation
    if 'validate' in route_def.lower():
        return route_def

    # Find the route function start (after the path string)
    # Pattern: router.METHOD('path', [middleware,] async (req, res)

    # Determine which validation to add based on method and route
    validations = []

    # Add query validation for GET requests
    if method == 'get' and '?' not in route_path:
        if 'req.query' in route_def or 'page' in route_def or 'limit' in route_def:
            validations.append('validateQuery(paginationSchema)')

    # Add params validation for routes with :id or similar
    if ':id' in route_path or ':' in route_path:
        validations.append('validateParams(uuidParamSchema)')

    # Add body validation for POST/PUT/PATCH
    if method in ['post', 'put', 'patch']:
        if method == 'put' or method == 'patch':
            # Use partial schema for updates
            validations.append('validateBody(/* TODO: Add appropriate schema */.partial())')
        else:
            validations.append('validateBody(/* TODO: Add appropriate schema */)')

    if not validations:
        return route_def

    # Find where to insert validation (after csrf/auth, before async)
    # Look for pattern: router.METHOD('path', csrf, auth, async
    insert_pattern = r"(router\." + method + r"\s*\(\s*['\"]" + re.escape(route_path) + r"['\"],\s*)"

    match = re.search(insert_pattern, route_def)
    if not match:
        return route_def

    insert_pos = match.end()

    # Check if there's csrf/auth middleware already
    next_chars = route_def[insert_pos:insert_pos+200]

    # Insert validation AFTER csrf/auth but BEFORE async handler
    if 'async' in next_chars:
        async_pos = next_chars.find('async')
        insert_pos += async_pos

        validation_str = '\n  ' + ',\n  '.join(validations) + ',\n  '
        route_def = route_def[:insert_pos] + validation_str + route_def[insert_pos:]

    return route_def

def process_file(file_path: Path) -> Tuple[bool, str]:
    """Process a single route file."""
    try:
        content = file_path.read_text(encoding='utf-8', errors='ignore')
        original_content = content

        # Add imports
        content = add_imports(content, file_path.name)

        # Find all route definitions
        route_pattern = r'router\.(get|post|put|patch|delete)\s*\(\s*[\'"]([^\'"]+)[\'"]'
        routes = re.finditer(route_pattern, content)

        # Process each route (we need to work backwards to not mess up positions)
        route_matches = list(routes)

        # Sort by position (descending) to work backwards
        route_matches.sort(key=lambda x: x.start(), reverse=True)

        for match in route_matches:
            method = match.group(1)
            route_path = match.group(2)

            # Extract the full route definition
            start = match.start()

            # Find the end of this route (next router. or end of file)
            next_route = re.search(r'router\.', content[start+10:])
            if next_route:
                end = start + 10 + next_route.start()
            else:
                end = len(content)

            route_def = content[start:end]

            # Add validation
            new_route_def = add_validation_to_route(route_def, method, route_path)

            if new_route_def != route_def:
                content = content[:start] + new_route_def + content[end:]

        if content != original_content:
            file_path.write_text(content, encoding='utf-8')
            return True, "Updated"
        else:
            return False, "No changes needed"

    except Exception as e:
        return False, f"Error: {str(e)}"

def main():
    """Main execution."""
    print("=" * 80)
    print("BACKEND-23: Batch Validation Addition")
    print("Adding Zod validation middleware to all routes")
    print("=" * 80)
    print()

    # Get all route files
    route_files = sorted(ROUTES_DIR.glob('*.ts'))
    route_files = [f for f in route_files if not f.name.startswith('__') and '.test.' not in f.name]

    print(f"Found {len(route_files)} route files")
    print()

    updated = 0
    skipped = 0
    errors = 0

    for route_file in route_files:
        success, message = process_file(route_file)

        if success:
            print(f"✓ {route_file.name}: {message}")
            updated += 1
        elif 'Error' in message:
            print(f"✗ {route_file.name}: {message}")
            errors += 1
        else:
            skipped += 1

    print()
    print("=" * 80)
    print(f"Summary:")
    print(f"  Updated: {updated}")
    print(f"  Skipped: {skipped}")
    print(f"  Errors: {errors}")
    print("=" * 80)
    print()
    print("NOTE: Some routes have '/* TODO */' comments where specific schemas need to be added.")
    print("Review and update these with the appropriate schema for each endpoint.")

if __name__ == '__main__':
    main()
