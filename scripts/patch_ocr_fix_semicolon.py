lines = open('api/src/services/OcrService.ts').readlines()

# Line 939 (index 938): }]; -> }],
if '}];' in lines[938]:
    lines[938] = lines[938].replace('}];', '}],')

with open('api/src/services/OcrService.ts', 'w') as f:
    f.writelines(lines)
