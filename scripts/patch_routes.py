import glob
import os
import re

def patch_file(filepath):
    with open(filepath, 'r') as f:
        content = f.read()

    # Check criteria
    has_pool_query = 'pool.query' in content or 'new OCPPService(pool)' in content or 'new EVChargingService(pool' in content
    has_pool_import = re.search(r'import.*\{.*pool.*\}.*from', content) or re.search(r'import.*pool.*from', content)

    if has_pool_query and not has_pool_import:
        print(f"Patching {filepath}...")
        lines = content.splitlines()
        last_import_idx = -1
        for i, line in enumerate(lines):
            if line.strip().startswith('import '):
                last_import_idx = i
        
        if last_import_idx != -1:
            lines.insert(last_import_idx + 1, "import { pool } from '../db/connection';")
            with open(filepath, 'w') as f:
                f.write('\n'.join(lines) + '\n')
            return True
        else:
            print(f"Warning: No imports found in {filepath}")
    return False

files = glob.glob('api/src/routes/*.ts')
count = 0
for file in files:
    if patch_file(file):
        count += 1

print(f"Total patched: {count}")
