lines = open('api/src/services/OcrService.ts').readlines()

# Line 324 (index 323): Insert } for switch
# Check context: prev line 'break;'
if 'break;' in lines[322] and lines[323].strip() == '':
    lines[323] = '      }\n'

# Line 338 (index 337): Insert } for method
# Check context: prev line '  }' (catch end)
if lines[336].strip() == '}' and lines[337].strip() == '':
    lines[337] = '  }\n'

with open('api/src/services/OcrService.ts', 'w') as f:
    f.writelines(lines)
