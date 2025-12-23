lines = open('api/src/services/OcrService.ts').readlines()

for i, line in enumerate(lines):
    # Fix map closures
    if ')) || []' in line and '}))' not in line:
        lines[i] = line.replace(')) || []', '})) || []')
    
    if ')) || [];' in line and '}))' not in line:
        lines[i] = line.replace(')) || [];', '})) || [];')

with open('api/src/services/OcrService.ts', 'w') as f:
    f.writelines(lines)
