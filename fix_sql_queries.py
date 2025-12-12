#!/usr/bin/env python3
"""
Real SQL Query Remediation Script
Fixes SELECT * queries by replacing with explicit column lists
"""

import re
import os
import json
import subprocess
from pathlib import Path

# Load table schemas from the TypeScript file
TABLE_SCHEMAS = {}

def load_table_schemas():
    """Extract table schemas from existing fix-select-star.ts"""
    schema_file = Path('api/scripts/fix-select-star.ts')
    if not schema_file.exists():
        print(f"Warning: {schema_file} not found")
        return
    
    content = schema_file.read_text()
    
    # Extract table schema definitions using regex
    # Pattern: table_name: ['col1', 'col2', ...]
    pattern = r"(\w+):\s*\[([^\]]+)\]"
    matches = re.findall(pattern, content)
    
    for table_name, columns_str in matches:
        # Clean up column names
        columns = [c.strip().strip("'") for c in columns_str.split(',')]
        TABLE_SCHEMAS[table_name] = columns
    
    print(f"Loaded {len(TABLE_SCHEMAS)} table schemas")

def fix_select_star_in_file(file_path, table_name, original_line):
    """Replace SELECT * with explicit columns in a file"""
    if table_name not in TABLE_SCHEMAS:
        print(f"  Warning: No schema found for table '{table_name}'  - SKIPPING")
        return False
    
    columns = TABLE_SCHEMAS[table_name]
    explicit_columns = ', '.join(columns)
    
    try:
        with open(file_path, 'r') as f:
            content = f.read()
        
        # Replace SELECT * FROM table_name with SELECT explicit_columns FROM table_name
        # Handle various formatting: SELECT *, SELECT  *, etc.
        pattern = rf"SELECT\s+\*\s+FROM\s+{table_name}"
        replacement = f"SELECT {explicit_columns} FROM {table_name}"
        
        new_content, count = re.subn(pattern, replacement, content, flags=re.IGNORECASE)
        
        if count > 0:
            with open(file_path, 'w') as f:
                f.write(new_content)
            print(f"  ✓ Fixed {count} occurrence(s) in {file_path}")
            return True
        else:
            print(f"  - No match found in {file_path} (might already be fixed)")
            return False
            
    except Exception as e:
        print(f"  ✗ Error fixing {file_path}: {e}")
        return False

def main():
    print("SQL Query Remediation Script")
    print("="*60)
    
    # Load schemas
    load_table_schemas()
    
    if not TABLE_SCHEMAS:
        print("ERROR: Could not load table schemas. Exiting.")
        return
    
    # Read sql-fixes-needed.log
    log_file = Path('sql-fixes-needed.log')
    if not log_file.exists():
        print(f"ERROR: {log_file} not found")
        return
    
    lines = log_file.read_text().splitlines()
    
    # Filter for production code only
    production_lines = []
    for line in lines:
        if not line or line.startswith('#'):
            continue
        # Skip tests, specs, and docs
        if any(x in line for x in ['.md:', 'test.ts:', 'spec.ts:', 'test.tsx:', 'spec.tsx:']):
            continue
        # Only process src/ and api/src/
        if 'src/' in line and ('SELECT *' in line or 'select *' in line.lower()):
            production_lines.append(line)
    
    print(f"\nFound {len(production_lines)} production SQL queries to fix\n")
    
    fixed_count = 0
    commit_interval = 50
    files_processed = set()
    
    for line in production_lines:
        # Parse line: filepath:SELECT * FROM table_name
        parts = line.split(':', 1)
        if len(parts) < 2:
            continue
            
        file_path = parts[0].strip()
        query_part = parts[1].strip()
        
        # Extract table name
        table_match = re.search(r'FROM\s+(\w+)', query_part, re.IGNORECASE)
        if not table_match:
            continue
        
        table_name = table_match.group(1)
        
        # Skip if we've already processed this file
        if file_path in files_processed:
            continue
        
        # Fix the file
        if fix_select_star_in_file(file_path, table_name, line):
            files_processed.add(file_path)
            fixed_count += 1
            
            # Commit every 50 fixes
            if fixed_count % commit_interval == 0:
                subprocess.run(['git', 'add', '-A'], check=True)
                subprocess.run([
                    'git', 'commit', '-m', 
                    f'fix(sql): Remediate {commit_interval} SQL queries (total: {fixed_count})'
                ], check=True)
                print(f"\n📦 Committed batch (total fixed: {fixed_count})\n")
    
    # Final commit
    if fixed_count % commit_interval != 0:
        subprocess.run(['git', 'add', '-A'], check=True)
        subprocess.run([
            'git', 'commit', '-m', 
            f'fix(sql): Remediate final SQL queries (total: {fixed_count})'
        ], check=True)
    
    # Update progress file
    try:
        with open('.remediation-progress.json', 'r') as f:
            progress = json.load(f)
        progress['results']['sql_queries_fixed'] = fixed_count
        progress['completed'].append('sql_queries')
        with open('.remediation-progress.json', 'w') as f:
            json.dump(progress, f, indent=2)
    except Exception as e:
        print(f"Warning: Could not update progress file: {e}")
    
    print("\n" + "="*60)
    print(f"SQL Remediation Complete!")
    print(f"Files fixed: {len(files_processed)}")
    print(f"Queries fixed: {fixed_count}")
    print("="*60)

if __name__ == '__main__':
    main()
