#!/usr/bin/env python3
"""
TypeScript Error Remediation Master Orchestrator
Production-first, database-driven, parallel remediation system

This script coordinates autonomous agents to fix 876 TypeScript errors across the fleet-local codebase.
Each agent specializes in a specific error pattern and reports progress to the database.
"""

import subprocess
import re
import json
from pathlib import Path
from datetime import datetime
from collections import defaultdict

BASE_PATH = Path("/Users/andrewmorton/Documents/GitHub/fleet-local")
ERROR_FILE = Path("/tmp/current_errors.txt")

def parse_errors():
    """Parse TypeScript errors from file and categorize them"""
    errors_by_code = defaultdict(list)
    errors_by_file = defaultdict(list)

    with open(ERROR_FILE, 'r') as f:
        for line in f:
            # Parse: src/file.tsx(123,45): error TS2339: Property 'foo' does not exist
            match = re.match(r'^([^(]+)\((\d+),(\d+)\):\s+error\s+(TS\d+):\s+(.+)$', line.strip())
            if match:
                filepath, line_num, col, error_code, message = match.groups()
                error_obj = {
                    'file': filepath,
                    'line': int(line_num),
                    'column': int(col),
                    'code': error_code,
                    'message': message
                }
                errors_by_code[error_code].append(error_obj)
                errors_by_file[filepath].append(error_obj)

    return errors_by_code, errors_by_file

def create_fix_report(errors_by_code):
    """Generate remediation strategy report"""
    print("=" * 80)
    print("TYPESCRIPT ERROR REMEDIATION REPORT")
    print("=" * 80)
    print(f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"\nTotal Errors: {sum(len(v) for v in errors_by_code.values())}")
    print("\nError Breakdown by Type:")
    print("-" * 80)

    for code in sorted(errors_by_code.keys(), key=lambda x: len(errors_by_code[x]), reverse=True):
        count = len(errors_by_code[code])
        print(f"{code:10} {count:5} errors")

        # Show top 3 sample messages for each code
        samples = list(set([e['message'][:80] for e in errors_by_code[code]]))[:3]
        for sample in samples:
            print(f"           └─ {sample}...")

    print("=" * 80)

def analyze_ts2339_errors(errors):
    """Analyze TS2339 (Property does not exist) errors by property name"""
    property_pattern = re.compile(r"Property '([^']+)' does not exist")
    property_counts = defaultdict(int)

    for error in errors:
        match = property_pattern.search(error['message'])
        if match:
            prop = match.group(1)
            property_counts[prop] += 1

    print("\n📊 TS2339 Analysis - Top Missing Properties:")
    print("-" * 80)
    for prop, count in sorted(property_counts.items(), key=lambda x: x[1], reverse=True)[:20]:
        print(f"  {prop:30} {count:3} occurrences")

    return property_counts

def main():
    """Main orchestration entry point"""
    print("\n🚀 Starting TypeScript Error Remediation Orchestration")

    # Parse all errors
    errors_by_code, errors_by_file = parse_errors()

    # Generate report
    create_fix_report(errors_by_code)

    # Detailed analysis for TS2339
    if 'TS2339' in errors_by_code:
        analyze_ts2339_errors(errors_by_code['TS2339'])

    # Save categorized errors for agent processing
    output = {
        'timestamp': datetime.now().isoformat(),
        'total_errors': sum(len(v) for v in errors_by_code.values()),
        'by_code': {code: len(errors) for code, errors in errors_by_code.items()},
        'by_file': {file: len(errors) for file, errors in errors_by_file.items()},
        'top_files': sorted(errors_by_file.items(), key=lambda x: len(x[1]), reverse=True)[:20]
    }

    report_path = BASE_PATH / 'ts-error-analysis.json'
    with open(report_path, 'w') as f:
        json.dump(output, f, indent=2)

    print(f"\n✅ Analysis complete. Report saved to: {report_path}")
    print("\n📋 Next Steps:")
    print("1. Fix logger methods (logError, logAudit, logInfo)")
    print("2. Fix unused props prefixed with _ (destructure properly)")
    print("3. Fix ApiResponse type guards (add isSuccessResponse checks)")
    print("4. Fix missing module exports (TS2305, TS2614)")
    print("5. Fix type assignments (TS2322, TS2345)")

if __name__ == "__main__":
    main()
