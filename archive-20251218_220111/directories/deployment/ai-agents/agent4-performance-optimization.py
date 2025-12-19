#!/usr/bin/env python3
"""
Agent 4: Performance Optimization Specialist
Uses Claude 3.5 Sonnet API to optimize performance and implement caching
"""

import os
import sys
import json
from datetime import datetime
from pathlib import Path
import subprocess
from anthropic import Anthropic

# Configuration
AGENT_NAME = "Agent 4: Performance Optimization Specialist"
LLM_MODEL = "claude-3-5-sonnet-20241022"
OUTPUT_FILES = [
    "vite.config.optimized.ts",
    "src/lib/react-query-setup.ts",
    "src/lib/performance-monitoring.ts"
]
COMMIT_MESSAGE = "feat: Add performance optimizations and monitoring\n\n🤖 Generated with Claude Code via AI Agent\n\nCo-Authored-By: Claude <noreply@anthropic.com>"

def log(message):
    """Log with timestamp"""
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    print(f"[{timestamp}] {message}", flush=True)

def main():
    log(f"Starting {AGENT_NAME}")
    log(f"Using model: {LLM_MODEL}")
    log(f"Output files: {', '.join(OUTPUT_FILES)}")

    # Check API key
    api_key = os.getenv("ANTHROPIC_API_KEY")
    if not api_key:
        log("ERROR: ANTHROPIC_API_KEY not found")
        sys.exit(1)

    # Initialize Anthropic client
    client = Anthropic(api_key=api_key)

    # Define prompts for each file
    prompts = {
        "vite.config.optimized.ts": """Create an optimized Vite configuration file for the Fleet Management System.

**File**: vite.config.optimized.ts

**Requirements**:

1. **Code Splitting**:
   - Split vendor dependencies into separate chunks
   - Split route-based code using dynamic imports
   - Configure manual chunk splitting for large libraries
   - Optimize chunk size (target: 200-500KB per chunk)

2. **Build Optimization**:
   - Enable compression (gzip and brotli)
   - Minification with terser (preserve license comments)
   - Tree shaking for unused code
   - CSS code splitting and minification
   - Asset optimization (images, fonts)
   - Source map configuration for production

3. **Performance**:
   - Enable esbuild for faster builds
   - Configure build cache
   - Parallel processing
   - Optimize dependencies pre-bundling

4. **Bundle Analysis**:
   - Include rollup-plugin-visualizer
   - Generate stats.html for bundle analysis
   - Set size limits and warnings

5. **Configuration**:
```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { visualizer } from 'rollup-plugin-visualizer';
import compression from 'vite-plugin-compression';

export default defineConfig({
  // Comprehensive configuration here
});
```

Provide ONLY the complete vite.config.optimized.ts file. No explanations.""",

        "src/lib/react-query-setup.ts": """Create a comprehensive React Query setup for the Fleet Management System.

**File**: src/lib/react-query-setup.ts

**Requirements**:

1. **Query Client Configuration**:
   - Default cache time: 5 minutes
   - Stale time configuration per query type
   - Retry logic with exponential backoff
   - Refetch on window focus (configurable)
   - Network mode handling (online/offline)

2. **Query Helpers**:
   - Standardized query keys factory
   - Query hooks for common operations (vehicles, drivers, maintenance, fuel)
   - Mutation hooks with optimistic updates
   - Prefetching strategies
   - Infinite query helpers

3. **Caching Strategy**:
   - Cache invalidation patterns
   - Background refetch configuration
   - Stale-while-revalidate pattern
   - Cache persistence to localStorage (optional)

4. **Optimistic Updates**:
   - Update cache before server response
   - Rollback on error
   - Conflict resolution

5. **Error Handling**:
   - Centralized error handling
   - Retry logic
   - Error boundaries integration
   - Toast notifications for errors

6. **Performance**:
   - Query deduplication
   - Request batching where possible
   - Suspense integration
   - Prefetching on hover/route change

7. **DevTools**:
   - React Query DevTools integration
   - Performance monitoring
   - Cache inspection

**Example Structure**:
```typescript
import { QueryClient, QueryCache, MutationCache } from '@tanstack/react-query';

// Query keys factory
export const queryKeys = {
  vehicles: {
    all: ['vehicles'] as const,
    lists: () => [...queryKeys.vehicles.all, 'list'] as const,
    list: (filters: VehicleFilters) => [...queryKeys.vehicles.lists(), { filters }] as const,
    details: () => [...queryKeys.vehicles.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.vehicles.details(), id] as const,
  },
  // More query keys...
};

// Query client with optimizations
export const queryClient = new QueryClient({
  // Configuration here
});

// Custom hooks
export const useVehicles = (filters?: VehicleFilters) => { /* ... */ };
export const useVehicle = (id: string) => { /* ... */ };
export const useUpdateVehicle = () => { /* ... */ };
```

Provide ONLY the complete TypeScript file. No explanations.""",

        "src/lib/performance-monitoring.ts": """Create a comprehensive performance monitoring system for the Fleet Management System.

**File**: src/lib/performance-monitoring.ts

**Requirements**:

1. **Web Vitals Monitoring**:
   - Largest Contentful Paint (LCP)
   - First Input Delay (FID)
   - Cumulative Layout Shift (CLS)
   - Time to First Byte (TTFB)
   - First Contentful Paint (FCP)

2. **Custom Metrics**:
   - Component render times
   - API request duration
   - Route navigation timing
   - Asset load times
   - Memory usage tracking

3. **Performance Budget**:
   - Set thresholds for metrics
   - Alert when budgets exceeded
   - Track trends over time

4. **React Performance**:
   - Component re-render tracking
   - Expensive component identification
   - React DevTools Profiler integration
   - Custom performance markers

5. **Network Monitoring**:
   - API call duration
   - Network errors
   - Request/response sizes
   - Connection quality

6. **User Experience Metrics**:
   - Time to Interactive (TTI)
   - Page load times
   - User interaction lag
   - Animation frame rate

7. **Reporting**:
   - Send metrics to analytics (console.log for now)
   - Real-time performance dashboard
   - Performance reports
   - Alert system for degradation

8. **Integration**:
   - Easy to integrate with existing app
   - Minimal performance overhead
   - Development vs Production modes
   - Export for external monitoring services

**Example Structure**:
```typescript
// Web Vitals monitoring
export const initPerformanceMonitoring = () => { /* ... */ };

// Custom performance tracking
export const trackComponentRender = (componentName: string, duration: number) => { /* ... */ };
export const trackAPICall = (endpoint: string, duration: number, status: number) => { /* ... };

// React component wrapper for tracking
export const withPerformanceTracking = <P extends object>(
  Component: React.ComponentType<P>,
  componentName: string
) => { /* ... */ };

// Custom hooks
export const usePerformanceMetrics = () => { /* ... */ };
export const useRenderTracking = (componentName: string) => { /* ... */ };

// Performance budget checker
export const checkPerformanceBudget = () => { /* ... */ };
```

Provide ONLY the complete TypeScript file. No explanations."""
    }

    all_outputs = {}

    try:
        for output_file, prompt in prompts.items():
            log(f"Generating {output_file}...")

            # Call Claude API
            response = client.messages.create(
                model=LLM_MODEL,
                max_tokens=8000,
                temperature=0.2,
                messages=[{
                    "role": "user",
                    "content": prompt
                }]
            )

            # Extract code from response
            code = response.content[0].text

            # Clean up code (remove markdown if present)
            if "```" in code:
                import re
                code_blocks = re.findall(r'```(?:typescript|tsx|javascript|jsx)?\n(.*?)\n```', code, re.DOTALL)
                if code_blocks:
                    code = code_blocks[0]

            all_outputs[output_file] = code
            log(f"  Generated {len(code)} characters for {output_file}")

        # Write all files
        for output_file, code in all_outputs.items():
            # Create output directory if it doesn't exist
            output_path = Path(output_file)
            output_path.parent.mkdir(parents=True, exist_ok=True)

            log(f"Writing {output_file}...")
            with open(output_file, 'w') as f:
                f.write(code)

        log("All files written successfully")

        # Git operations
        log("Adding files to git...")
        subprocess.run(["git", "add"] + OUTPUT_FILES, check=True)

        log("Creating commit...")
        subprocess.run(["git", "commit", "-m", COMMIT_MESSAGE], check=True)

        log("Pushing to repository...")
        subprocess.run(["git", "push"], check=True)

        log(f"{AGENT_NAME} completed successfully!")
        for output_file in OUTPUT_FILES:
            log(f"  File: {output_file}")

        # Write completion status
        with open("agent4-status.json", 'w') as f:
            json.dump({
                "agent": AGENT_NAME,
                "status": "completed",
                "output_files": OUTPUT_FILES,
                "timestamp": datetime.now().isoformat(),
                "total_code_length": sum(len(code) for code in all_outputs.values())
            }, f, indent=2)

    except Exception as e:
        log(f"ERROR: {str(e)}")
        import traceback
        log(traceback.format_exc())

        # Write error status
        with open("agent4-status.json", 'w') as f:
            json.dump({
                "agent": AGENT_NAME,
                "status": "failed",
                "error": str(e),
                "timestamp": datetime.now().isoformat()
            }, f, indent=2)

        sys.exit(1)

if __name__ == "__main__":
    main()
