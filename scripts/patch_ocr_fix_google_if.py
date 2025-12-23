lines = open('api/src/services/OcrService.ts').readlines()

# Line 978 (index 977): return { ... };
# Context: convertGoogleBoundingBox
found = False
for i, line in enumerate(lines):
    if 'private convertGoogleBoundingBox' in line:
        found = i
        break
        
if found:
    for j in range( found, found+10):
        # Find return
        if 'return { x: 0, y: 0, width: 0, height: 0' in lines[j] and '};' in lines[j]:
             # Next line (j+1) should be }
             if j+1 < len(lines):
                 if lines[j+1].strip() != '}':
                     lines.insert(j+1, '    }\n')
                     break

with open('api/src/services/OcrService.ts', 'w') as f:
    f.writelines(lines)
