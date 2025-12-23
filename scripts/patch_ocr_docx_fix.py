lines = open('api/src/services/OcrService.ts').readlines()

# Line 396 (index 395): }}]; -> }],
if '}}];' in lines[395]:
    lines[395] = lines[395].replace('}}];', '}],')

with open('api/src/services/OcrService.ts', 'w') as f:
    f.writelines(lines)
