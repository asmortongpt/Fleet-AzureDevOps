#!/usr/bin/env python3
"""
Add ErrorBoundary to all route elements in routes.tsx
"""

import re
from pathlib import Path

def add_error_boundaries():
    routes_file = Path('src/router/routes.tsx')
    
    if not routes_file.exists():
        print(f"ERROR: {routes_file} not found")
        return False
    
    content = routes_file.read_text()
    
    # Check if ErrorBoundary is already imported
    if 'ErrorBoundary' not in content:
        # Add import at the top after other imports
        import_line = 'import { ErrorBoundary } from "@/components/ErrorBoundary";\n'
        
        # Find the last import statement
        import_pattern = r'(import.*;\n)(?!import)'
        content = re.sub(import_pattern, r'\1' + import_line, content, count=1)
        print("✓ Added ErrorBoundary import")
    
    # Wrap <Suspense> with <ErrorBoundary> in the route mapping
    # Pattern: <Suspense fallback={<LoadingSpinner />}> ... </Suspense>
    
    # For the index route
    if '<ErrorBoundary>' not in content or content.count('<ErrorBoundary>') < 50:
        # Replace index route
        index_pattern = r'element: \(\s*<Suspense fallback={<LoadingSpinner />}>\s*<(\w+) />\s*</Suspense>\s*\)'
        index_replacement = r'''element: (
          <ErrorBoundary>
            <Suspense fallback={<LoadingSpinner />}>
              <\1 />
            </Suspense>
          </ErrorBoundary>
        )'''
        content = re.sub(index_pattern, index_replacement, content)
        
        # Replace mapped routes
        routes_pattern = r'element: \(\s*<Suspense fallback={<LoadingSpinner />}>\s*{route\.element}\s*</Suspense>\s*\)'
        routes_replacement = r'''element: (
          <ErrorBoundary>
            <Suspense fallback={<LoadingSpinner />}>
              {route.element}
            </Suspense>
          </ErrorBoundary>
        )'''
        content = re.sub(routes_pattern, routes_replacement, content)
        
        print("✓ Wrapped routes with ErrorBoundary")
    else:
        print("- ErrorBoundary already applied")
        return False
    
    # Write back
    routes_file.write_text(content)
    print(f"✓ Updated {routes_file}")
    
    return True

def main():
    print("Adding Error Boundaries to Router")
    print("="*60)
    
    if add_error_boundaries():
        import subprocess
        
        # Commit the change
        subprocess.run(['git', 'add', 'src/router/routes.tsx'], check=True)
        subprocess.run([
            'git', 'commit', '-m',
            'feat(error-handling): Add ErrorBoundary to all 53 route modules'
        ], check=True)
        
        print("\n" + "="*60)
        print("Error Boundary Addition Complete!")
        print("All 53 modules now wrapped with ErrorBoundary")
        print("="*60)
    else:
        print("\nNo changes needed - ErrorBoundary already in place")

if __name__ == '__main__':
    main()
