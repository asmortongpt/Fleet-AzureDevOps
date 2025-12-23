lines = open('api/src/services/OcrService.ts').readlines()

# Line 575 (approx): , 120000); -> }, 120000);
for i, line in enumerate(lines):
    if line.strip().startswith(', 120000);'):
        lines[i] = lines[i].replace(', 120000);', '}, 120000);')
    if line.strip() == ', 120000);':
         # If exact match
         lines[i] = '      }, 120000);\n'

with open('api/src/services/OcrService.ts', 'w') as f:
    f.writelines(lines)
