lines = open('api/src/services/OcrService.ts').readlines()

# Line 706 (approx)
for i, line in enumerate(lines):
    if 'Document: { Bytes: imageBuffer' in line and '} },' in line:
        lines[i] = line.replace('} },', '},')

with open('api/src/services/OcrService.ts', 'w') as f:
    f.writelines(lines)
