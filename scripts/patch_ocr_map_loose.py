lines = open('api/src/services/OcrService.ts').readlines()

for i, line in enumerate(lines):
    # Fix 1: word map
    if 'boundingBox: word.bbox' in line:
        if i+1 < len(lines):
            val = lines[i+1]
            if '))' in val and '}))' not in val:
                 lines[i+1] = val.replace('))', '}))')
    
    # Fix 2: line map
    if 'boundingBox: line.bbox' in line:
        if i+1 < len(lines):
            val = lines[i+1]
            if '))' in val and '}))' not in val:
                 lines[i+1] = val.replace('))', '}))')

with open('api/src/services/OcrService.ts', 'w') as f:
    f.writelines(lines)
