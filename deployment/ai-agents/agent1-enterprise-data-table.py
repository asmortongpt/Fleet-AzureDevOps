#!/usr/bin/env python3
"""
Agent 1: Enterprise Data Table Builder
Uses Claude 3.5 Sonnet API to build complete EnterpriseDataTable component
"""

import os
import sys
import time
import json
from datetime import datetime
from pathlib import Path
import subprocess
from anthropic import Anthropic

# Configuration
AGENT_NAME = "Agent 1: Enterprise Data Table Builder"
LLM_MODEL = "claude-3-5-sonnet-20241022"
OUTPUT_FILE = "src/components/tables/EnterpriseDataTable.tsx"
COMMIT_MESSAGE = "feat: Add enterprise data table with all features\n\n🤖 Generated with Claude Code via AI Agent\n\nCo-Authored-By: Claude <noreply@anthropic.com>"

def log(message):
    """Log with timestamp"""
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    print(f"[{timestamp}] {message}", flush=True)

def main():
    log(f"Starting {AGENT_NAME}")
    log(f"Using model: {LLM_MODEL}")
    log(f"Output file: {OUTPUT_FILE}")

    # Check API key
    api_key = os.getenv("ANTHROPIC_API_KEY")
    if not api_key:
        log("ERROR: ANTHROPIC_API_KEY not found")
        sys.exit(1)

    # Initialize Anthropic client
    client = Anthropic(api_key=api_key)

    # Define the comprehensive prompt
    prompt = """You are an expert React and TypeScript developer. Create a production-ready, enterprise-grade data table component with all features.

**Component Name**: EnterpriseDataTable

**File**: src/components/tables/EnterpriseDataTable.tsx

**Requirements**:

1. **Core Features**:
   - Built with @tanstack/react-table v8
   - Full TypeScript support with generic types
   - Column sorting (single and multi-column with shift-click)
   - Advanced filtering (text, number, date, range filters per column)
   - Column resize via drag handles
   - Column reorder via drag-and-drop
   - Row selection (single and multi-select with shift-click)
   - Pagination with page size options (10, 25, 50, 100, 500)
   - Global search across all columns
   - Expandable rows for nested data
   - Frozen/pinned columns (left and right)

2. **Performance**:
   - Virtual scrolling for 10,000+ rows using @tanstack/react-virtual
   - Memoized components to prevent unnecessary re-renders
   - Debounced filtering and search
   - Lazy loading for large datasets

3. **Export Features**:
   - Export to CSV (all data or filtered/selected)
   - Export to Excel (XLSX format)
   - Export to PDF (table format)
   - Copy selected rows to clipboard

4. **Saved Views**:
   - Save current filter/sort/column configuration
   - Load saved views
   - Manage multiple saved views
   - Persist views to localStorage

5. **Inline Editing**:
   - Editable cells with validation
   - Batch edit mode
   - Undo/redo support
   - Dirty state tracking

6. **UI/UX**:
   - Dark mode support via Tailwind CSS
   - Loading states and skeletons
   - Empty states with helpful messages
   - Responsive design (mobile, tablet, desktop)
   - Keyboard navigation (arrows, tab, enter, space)
   - Accessibility (ARIA labels, screen reader support)
   - Drag handles with visual feedback

7. **Props Interface**:
```typescript
interface EnterpriseDataTableProps<TData> {
  data: TData[];
  columns: ColumnDef<TData>[];
  enableSorting?: boolean;
  enableFiltering?: boolean;
  enableColumnResize?: boolean;
  enableColumnReorder?: boolean;
  enableRowSelection?: boolean;
  enablePagination?: boolean;
  enableVirtualization?: boolean;
  enableExport?: boolean;
  enableSavedViews?: boolean;
  enableInlineEdit?: boolean;
  enableExpandableRows?: boolean;
  loading?: boolean;
  onRowClick?: (row: TData) => void;
  onRowSelect?: (rows: TData[]) => void;
  onCellEdit?: (rowIndex: number, columnId: string, value: any) => void;
  renderExpandedRow?: (row: TData) => React.ReactNode;
  className?: string;
}
```

8. **Dependencies** (already in package.json):
   - @tanstack/react-table
   - @tanstack/react-virtual (install if needed)
   - lucide-react (icons)
   - date-fns (date formatting)
   - tailwindcss (styling)

**Code Quality**:
- Production-ready code with error handling
- JSDoc comments for all props and methods
- Proper TypeScript types (no 'any' unless necessary)
- Parameterized queries for any data operations
- No hardcoded values
- Clean, readable code with proper indentation
- Security: XSS prevention via DOMPurify for any HTML content

**Output Format**:
Provide ONLY the complete TypeScript code for the component. No explanations, no markdown formatting, just the raw .tsx file content.
"""

    log("Sending request to Claude API...")

    try:
        # Call Claude API
        response = client.messages.create(
            model=LLM_MODEL,
            max_tokens=16000,
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
            # Extract code from markdown blocks
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
        with open("agent1-status.json", 'w') as f:
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
        with open("agent1-status.json", 'w') as f:
            json.dump({
                "agent": AGENT_NAME,
                "status": "failed",
                "error": str(e),
                "timestamp": datetime.now().isoformat()
            }, f, indent=2)

        sys.exit(1)

if __name__ == "__main__":
    main()
