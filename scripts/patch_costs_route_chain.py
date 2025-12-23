lines = open('api/src/routes/costs.ts').readlines()

# Line 285 (index 284): }) -> }))
# 286 starts with .sort
if lines[284].strip() == '})':
    lines[284] = lines[284].replace('})', '}))')

with open('api/src/routes/costs.ts', 'w') as f:
    f.writelines(lines)
