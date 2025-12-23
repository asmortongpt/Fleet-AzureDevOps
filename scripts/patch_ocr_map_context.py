lines = open('api/src/services/OcrService.ts').readlines()

for i, line in enumerate(lines):
    # Fix 1: word map
    if 'boundingBox: word.bbox' in line:
        # Check next line
        if i+1 < len(lines):
            next_line = lines[i+1].strip()
            if next_line == '))':
                # Preserve indentation?
                indent = lines[i+1][:lines[i+1].find(')')]
                lines[i+1] = indent + '})),\n'
    
    # Fix 2: line map
    if 'boundingBox: line.bbox' in line:
        # Check next line
        if i+1 < len(lines):
            next_line = lines[i+1].strip()
            if next_line == '))':
                indent = lines[i+1][:lines[i+1].find(')')]
                lines[i+1] = indent + '})),\n'

with open('api/src/services/OcrService.ts', 'w') as f:
    f.writelines(lines)
