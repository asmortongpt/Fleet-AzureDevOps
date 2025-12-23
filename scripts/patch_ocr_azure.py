lines = open('api/src/services/OcrService.ts').readlines()

# Line 262 (index 261): Append }
if 'AZURE_VISION_KEY' in lines[261] and not lines[261].strip().endswith('}'):
    lines[261] = lines[261].rstrip() + ' }\n'

# Line 263 (index 262): ), -> })
if lines[262].strip() == '),':
    lines[262] = lines[262].replace('),', '}),')

# Line 267 (index 266): Insert } for if
if lines[266].strip() == '':
    lines[266] = '      }\n'

# Line 274 (index 273): Insert } for catch
if lines[273].strip() == '':
    lines[273] = '    }\n'

# Line 277 (index 276): Insert } for function
if lines[276].strip() == '':
    lines[276] = '  }\n'

with open('api/src/services/OcrService.ts', 'w') as f:
    f.writelines(lines)
