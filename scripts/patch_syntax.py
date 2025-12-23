import glob
import re

def patch_file(filepath):
    with open(filepath, 'r') as f:
        content = f.read()

    # Fix Math.ceil missing paren
    # Pattern: pages: Math.ceil(countResult.rows[0].count / Number(limit)
    new_content = re.sub(r'(pages: Math\.ceil\(.*Number\(limit\))(\s*)$', r'\1)\2', content, flags=re.MULTILINE)

    if new_content != content:
        print(f"Patching syntax in {filepath}...")
        with open(filepath, 'w') as f:
            f.write(new_content)
        return True
    return False

files = glob.glob('api/src/routes/*.ts')
count = 0
for file in files:
    if patch_file(file):
        count += 1

print(f"Total syntax patched: {count}")
