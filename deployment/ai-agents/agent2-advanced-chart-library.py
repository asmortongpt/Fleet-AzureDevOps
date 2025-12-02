#!/usr/bin/env python3
"""
Agent 2: Advanced Chart Library Builder
Uses GPT-4 Turbo API to build complete chart library with 15+ chart types
"""

import os
import sys
import time
import json
from datetime import datetime
from pathlib import Path
import subprocess
from openai import OpenAI

# Configuration
AGENT_NAME = "Agent 2: Advanced Chart Library Builder"
LLM_MODEL = "gpt-4-turbo-preview"
OUTPUT_FILE = "src/components/charts/ChartLibrary.tsx"
COMMIT_MESSAGE = "feat: Add advanced chart library with 15+ chart types\n\n🤖 Generated with GPT-4 via AI Agent\n\nCo-Authored-By: GPT-4 <noreply@openai.com>"

def log(message):
    """Log with timestamp"""
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    print(f"[{timestamp}] {message}", flush=True)

def main():
    log(f"Starting {AGENT_NAME}")
    log(f"Using model: {LLM_MODEL}")
    log(f"Output file: {OUTPUT_FILE}")

    # Check API key
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        log("ERROR: OPENAI_API_KEY not found")
        sys.exit(1)

    # Initialize OpenAI client
    client = OpenAI(api_key=api_key)

    # Define the comprehensive prompt
    prompt = """You are an expert React, TypeScript, and data visualization developer. Create a production-ready, comprehensive chart library component with 15+ chart types.

**Component Name**: ChartLibrary

**File**: src/components/charts/ChartLibrary.tsx

**Requirements**:

1. **Chart Types** (all using Recharts):
   - LineChart (single and multi-line)
   - AreaChart (stacked and unstacked)
   - BarChart (vertical, horizontal, stacked, grouped)
   - ColumnChart
   - PieChart (with labels and percentages)
   - DonutChart (with center label)
   - GaugeChart (progress indicator)
   - ScatterChart (with trend lines)
   - BubbleChart (3D data visualization)
   - HeatmapChart (color-coded grid)
   - TreeMapChart (hierarchical data)
   - RadarChart (multi-axis comparison)
   - SparklineChart (mini inline charts)
   - CandlestickChart (financial data)
   - WaterfallChart (cumulative effect)

2. **Common Features for All Charts**:
   - Dark mode support (detect via data-theme or useTheme hook)
   - Smooth animations (enter, update, exit)
   - Interactive tooltips with custom formatting
   - Legends (customizable position: top, right, bottom, left)
   - Export functionality (PNG, SVG, PDF)
   - Zoom and pan capabilities (where applicable)
   - Responsive design (auto-resize on container change)
   - Loading states with skeleton loaders
   - Empty states with helpful messages
   - Error boundaries

3. **Configuration Props**:
```typescript
interface BaseChartProps {
  data: any[];
  width?: number | string;
  height?: number | string;
  title?: string;
  subtitle?: string;
  showLegend?: boolean;
  legendPosition?: 'top' | 'right' | 'bottom' | 'left';
  showGrid?: boolean;
  showTooltip?: boolean;
  enableZoom?: boolean;
  enableExport?: boolean;
  theme?: 'light' | 'dark' | 'auto';
  animation?: boolean;
  loading?: boolean;
  error?: string;
  className?: string;
  onDataPointClick?: (data: any) => void;
}

interface LineChartProps extends BaseChartProps {
  xKey: string;
  yKeys: string[];
  colors?: string[];
  strokeWidth?: number;
  showDots?: boolean;
  curve?: 'linear' | 'monotone' | 'step';
}

// Similar interfaces for each chart type...
```

4. **Component Structure**:
   - Export individual chart components (LineChart, BarChart, etc.)
   - Export a unified ChartLibrary component with type prop
   - Provide chart configuration helpers
   - Include theme color palettes for light/dark modes

5. **Example Usage**:
```typescript
import { LineChart, BarChart, PieChart } from '@/components/charts/ChartLibrary';

<LineChart
  data={salesData}
  xKey="date"
  yKeys={['sales', 'profit']}
  colors={['#3b82f6', '#10b981']}
  showLegend
  enableZoom
  enableExport
/>
```

6. **Color Palettes**:
   - Light mode: Blue, green, orange, purple, red tones
   - Dark mode: Brighter variants for visibility
   - Accessible color combinations (WCAG AA)
   - Colorblind-friendly options

7. **Export Functionality**:
   - PNG: Use html-to-image or canvas API
   - SVG: Native Recharts SVG export
   - PDF: Use jsPDF with chart as image
   - CSV: Export underlying data

8. **Performance**:
   - Memoized components to prevent re-renders
   - Debounced resize handlers
   - Lazy loading for complex charts
   - Virtual rendering for large datasets

9. **Dependencies** (use what's in package.json):
   - recharts (already installed)
   - lucide-react (icons)
   - date-fns (date formatting)
   - Install if needed: html2canvas, jspdf

**Code Quality**:
- Production-ready code with comprehensive error handling
- Full TypeScript support with proper types (no 'any' unless necessary)
- JSDoc comments for all components and props
- Clean, readable code with proper indentation
- Accessibility (ARIA labels, keyboard navigation)
- Security: No eval(), proper data sanitization

**Output Format**:
Provide ONLY the complete TypeScript code for the chart library. No explanations, no markdown formatting, just the raw .tsx file content. Include all 15+ chart types in one comprehensive file.
"""

    log("Sending request to GPT-4 API...")

    try:
        # Call GPT-4 API
        response = client.chat.completions.create(
            model=LLM_MODEL,
            messages=[{
                "role": "system",
                "content": "You are an expert React and TypeScript developer specializing in data visualization."
            }, {
                "role": "user",
                "content": prompt
            }],
            max_tokens=16000,
            temperature=0.2
        )

        # Extract code from response
        code = response.choices[0].message.content

        # Clean up code (remove markdown if present)
        if "```" in code:
            import re
            code_blocks = re.findall(r'```(?:typescript|tsx|javascript|jsx)?\n(.*?)\n```', code, re.DOTALL)
            if code_blocks:
                code = code_blocks[0]

        log(f"Received {len(code)} characters of code")

        # Create output directory if it doesn't exist
        output_path = Path(OUTPUT_FILE)
        output_path.parent.mkdir(parents=True, exist_ok=True)

        # Write code to file
        log(f"Writing code to {OUTPUT_FILE}...")
        with open(OUTPUT_FILE, 'w') as f:
            f.write(code)

        log("Code written successfully")

        # Git operations
        log("Adding file to git...")
        subprocess.run(["git", "add", OUTPUT_FILE], check=True)

        log("Creating commit...")
        subprocess.run(["git", "commit", "-m", COMMIT_MESSAGE], check=True)

        log("Pushing to repository...")
        subprocess.run(["git", "push"], check=True)

        log(f"{AGENT_NAME} completed successfully!")
        log(f"File: {OUTPUT_FILE}")
        log(f"Commit: {COMMIT_MESSAGE.split(chr(10))[0]}")

        # Write completion status
        with open("agent2-status.json", 'w') as f:
            json.dump({
                "agent": AGENT_NAME,
                "status": "completed",
                "output_file": OUTPUT_FILE,
                "timestamp": datetime.now().isoformat(),
                "code_length": len(code)
            }, f, indent=2)

    except Exception as e:
        log(f"ERROR: {str(e)}")
        import traceback
        log(traceback.format_exc())

        # Write error status
        with open("agent2-status.json", 'w') as f:
            json.dump({
                "agent": AGENT_NAME,
                "status": "failed",
                "error": str(e),
                "timestamp": datetime.now().isoformat()
            }, f, indent=2)

        sys.exit(1)

if __name__ == "__main__":
    main()
