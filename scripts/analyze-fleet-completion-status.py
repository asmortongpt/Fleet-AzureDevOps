#!/usr/bin/env python3
"""
Fleet Completion Status Analyzer
Reads analysis Excel files and compares against actual codebase to provide honest status updates
"""

import pandas as pd
import os
import json
import subprocess
from pathlib import Path
from datetime import datetime
import sys

# Color codes for terminal output
class Colors:
    GREEN = '\033[0;32m'
    YELLOW = '\033[1;33m'
    RED = '\033[0;31m'
    BLUE = '\033[0;34m'
    CYAN = '\033[0;36m'
    NC = '\033[0m'  # No Color

def print_header(text):
    print(f"\n{Colors.GREEN}{'='*70}{Colors.NC}")
    print(f"{Colors.GREEN}{text:^70}{Colors.NC}")
    print(f"{Colors.GREEN}{'='*70}{Colors.NC}\n")

def print_section(text):
    print(f"\n{Colors.BLUE}[{text}]{Colors.NC}")

def print_success(text):
    print(f"{Colors.GREEN}✓ {text}{Colors.NC}")

def print_warning(text):
    print(f"{Colors.YELLOW}⚠ {text}{Colors.NC}")

def print_error(text):
    print(f"{Colors.RED}✗ {text}{Colors.NC}")

# Paths
DOWNLOADS_DIR = Path("/Users/andrewmorton/Downloads")
BACKEND_EXCEL = DOWNLOADS_DIR / "backend_analysis_w_roughestimates.xlsx"
FRONTEND_EXCEL = DOWNLOADS_DIR / "frontend_analysis_w_roughestimates.xlsx"
FLEET_DIR = Path("/Users/andrewmorton/Documents/GitHub/fleet-local")

print_header("FLEET COMPLETION STATUS ANALYZER")

# Check if Excel files exist
if not BACKEND_EXCEL.exists():
    print_error(f"Backend analysis not found: {BACKEND_EXCEL}")
    sys.exit(1)

if not FRONTEND_EXCEL.exists():
    print_error(f"Frontend analysis not found: {FRONTEND_EXCEL}")
    sys.exit(1)

print_success(f"Found backend analysis: {BACKEND_EXCEL}")
print_success(f"Found frontend analysis: {FRONTEND_EXCEL}")

# Read Excel files
print_section("Reading Analysis Documents")

try:
    backend_df = pd.read_excel(BACKEND_EXCEL, sheet_name=None)  # Read all sheets
    frontend_df = pd.read_excel(FRONTEND_EXCEL, sheet_name=None)

    print_success(f"Backend sheets: {', '.join(backend_df.keys())}")
    print_success(f"Frontend sheets: {', '.join(frontend_df.keys())}")
except Exception as e:
    print_error(f"Error reading Excel files: {e}")
    sys.exit(1)

# Export to JSON for analysis
print_section("Exporting to JSON for Agent Review")

output_dir = FLEET_DIR / "analysis-output"
output_dir.mkdir(exist_ok=True)

# Export backend analysis
backend_json = {}
for sheet_name, df in backend_df.items():
    backend_json[sheet_name] = df.to_dict(orient='records')

backend_json_path = output_dir / "backend_analysis.json"
with open(backend_json_path, 'w') as f:
    json.dump(backend_json, f, indent=2, default=str)
print_success(f"Backend exported to: {backend_json_path}")

# Export frontend analysis
frontend_json = {}
for sheet_name, df in frontend_df.items():
    frontend_json[sheet_name] = df.to_dict(orient='records')

frontend_json_path = output_dir / "frontend_analysis.json"
with open(frontend_json_path, 'w') as f:
    json.dump(frontend_json, f, indent=2, default=str)
print_success(f"Frontend exported to: {frontend_json_path}")

# Print summary
print_section("Analysis Summary")

def print_sheet_summary(df_dict, name):
    print(f"\n{Colors.CYAN}{name}:{Colors.NC}")
    for sheet, df in df_dict.items():
        print(f"  • {sheet}: {len(df)} rows × {len(df.columns)} columns")
        if 'Status' in df.columns or 'status' in df.columns:
            status_col = 'Status' if 'Status' in df.columns else 'status'
            print(f"    Status breakdown: {df[status_col].value_counts().to_dict()}")

print_sheet_summary(backend_df, "Backend Analysis")
print_sheet_summary(frontend_df, "Frontend Analysis")

# Create agent prompt for detailed review
print_section("Preparing Agent Review")

agent_prompt = f"""
# Fleet Application Completion Status Review

## Task
Review the Fleet application codebase and compare against the requirements in the analysis documents.
Provide an HONEST assessment of completion status for each item.

## Analysis Documents

### Backend Analysis
Location: {backend_json_path}
Sheets: {', '.join(backend_df.keys())}

### Frontend Analysis
Location: {frontend_json_path}
Sheets: {', '.join(frontend_df.keys())}

## Codebase Location
{FLEET_DIR}

## Instructions

For EACH item in the analysis documents:

1. **Verify Implementation**
   - Check if the file/component exists
   - Review the code quality and completeness
   - Test if the feature actually works

2. **Update Status**
   - ✅ Complete: Fully implemented and tested
   - 🔄 In Progress: Partially implemented
   - ❌ Not Started: No code found
   - ⚠️  Blocked: Dependencies missing or issues found

3. **Provide Evidence**
   - File paths that implement the feature
   - Code snippets showing completion
   - Tests that verify functionality
   - Any issues or gaps found

4. **Update Estimates**
   - If incomplete, provide realistic hours to finish
   - Consider dependencies and technical debt
   - Account for testing and documentation

## Output Format

For each sheet in the Excel files, create a markdown table:

| Item | Original Status | Actual Status | Evidence | Hours Remaining | Notes |
|------|----------------|---------------|----------|-----------------|-------|
| ... | ... | ... | ... | ... | ... |

## Key Areas to Review

### Backend
- API endpoints and routes
- Database models and migrations
- Authentication and authorization
- Business logic and services
- Tests and documentation

### Frontend
- Components and pages
- State management
- API integration
- UI/UX implementation
- Responsive design
- Accessibility

## Honesty Policy

Be BRUTALLY HONEST:
- Don't mark incomplete work as complete
- Highlight technical debt and shortcuts
- Point out missing tests or documentation
- Flag any bugs or issues found
- Provide realistic timelines

## Deliverables

1. Updated Excel files with honest status
2. Markdown report with findings
3. List of blocking issues
4. Realistic completion timeline
"""

agent_prompt_path = output_dir / "agent_review_prompt.md"
with open(agent_prompt_path, 'w') as f:
    f.write(agent_prompt)

print_success(f"Agent prompt created: {agent_prompt_path}")

# Generate initial status report
print_section("Generating Initial Status Report")

report = []
report.append("# Fleet Application Status Report")
report.append(f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")

# Check codebase structure
report.append("## Codebase Structure\n")

key_dirs = [
    "src/components",
    "src/pages",
    "src/hooks",
    "src/lib",
    "server",
    "tests"
]

for dir_path in key_dirs:
    full_path = FLEET_DIR / dir_path
    if full_path.exists():
        file_count = len(list(full_path.rglob("*.*")))
        report.append(f"✅ {dir_path}: {file_count} files")
    else:
        report.append(f"❌ {dir_path}: NOT FOUND")

# Check key files
report.append("\n## Key Files\n")

key_files = [
    "package.json",
    "vite.config.ts",
    "tsconfig.json",
    "src/App.tsx",
    "src/main.tsx"
]

for file_path in key_files:
    full_path = FLEET_DIR / file_path
    if full_path.exists():
        size_kb = full_path.stat().st_size / 1024
        report.append(f"✅ {file_path}: {size_kb:.1f} KB")
    else:
        report.append(f"❌ {file_path}: NOT FOUND")

# Count modules
report.append("\n## Module Count\n")

modules_dir = FLEET_DIR / "src/components/modules"
if modules_dir.exists():
    modules = list(modules_dir.glob("*.tsx"))
    report.append(f"Total Modules: {len(modules)}")
    report.append("\nModules found:")
    for mod in sorted(modules)[:20]:  # Show first 20
        report.append(f"  - {mod.stem}")
    if len(modules) > 20:
        report.append(f"  ... and {len(modules) - 20} more")
else:
    report.append("❌ Modules directory not found")

# Save report
report_path = output_dir / "initial_status_report.md"
with open(report_path, 'w') as f:
    f.write('\n'.join(report))

print_success(f"Initial report saved: {report_path}")

# Print report to console
print_section("Initial Status Report")
print('\n'.join(report))

# Next steps
print_section("Next Steps")
print(f"""
1. {Colors.CYAN}Review the agent prompt:{Colors.NC}
   cat {agent_prompt_path}

2. {Colors.CYAN}Launch the Task agent to perform detailed review:{Colors.NC}
   Use Claude Code to run the analysis with the prompt above

3. {Colors.CYAN}The agent will:{Colors.NC}
   • Scan the entire codebase
   • Compare against Excel requirements
   • Update status for each item
   • Generate updated Excel files with honest assessments

4. {Colors.CYAN}Output will be saved to:{Colors.NC}
   {output_dir}/backend_analysis_UPDATED.xlsx
   {output_dir}/frontend_analysis_UPDATED.xlsx
   {output_dir}/detailed_review_report.md

5. {Colors.CYAN}Review the findings and prioritize work:{Colors.NC}
   Based on blocking issues and completion percentages
""")

print_header("ANALYSIS COMPLETE - READY FOR AGENT REVIEW")

# Return paths for Claude Code to use
print(f"\n{Colors.GREEN}JSON Analysis Files:{Colors.NC}")
print(backend_json_path)
print(frontend_json_path)
print(f"\n{Colors.GREEN}Agent Prompt:{Colors.NC}")
print(agent_prompt_path)
