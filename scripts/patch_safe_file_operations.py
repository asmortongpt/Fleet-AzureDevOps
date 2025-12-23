lines = open('api/src/utils/safe-file-operations.ts').readlines()

# Line 15: from `stream` -> from 'stream'
if 14 < len(lines):
    if "from `stream`" in lines[14]:
        lines[14] = lines[14].replace("from `stream`", "from 'stream'")

# Line 22: super("Path traversal detected: "${attemptedPath}"... -> super(`Path...`)
if 21 < len(lines):
    # Match incorrectly quoted string with template vars
    if '"${attemptedPath}"' in lines[21] or '"${allowedDirectory}"' in lines[21]:
         # Replace start " with `
         # Replace end "); with `);
         lines[21] = '    super(`Path traversal detected: "${attemptedPath}" is outside allowed directory "${allowedDirectory}"`);\n'

# Line 71: part !== '`; -> part !== '';
if 70 < len(lines):
    if "part !== '`;" in lines[70]:
        lines[70] = lines[70].replace("part !== '`;", "part !== '';")

with open('api/src/utils/safe-file-operations.ts', 'w') as f:
    f.writelines(lines)
