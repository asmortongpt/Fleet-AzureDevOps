lines = open('api/src/services/OcrService.ts').readlines()

# Line 359 (index 358): Insert } for catch
if lines[358].strip() == '':
    lines[358] = '      }\n'

# Line 371 (index 370): Insert } for else
if lines[370].strip() == '':
    lines[370] = '      }\n'

# Line 372 (index 371): Insert } for method
if lines[371].strip() == '':
    lines[371] = '  }\n'

# Line 384 (index 383): ); -> });
if 'extractRawText' in lines[383] and ');' in lines[383]:
    lines[383] = lines[383].replace(');', '});')
    
# Line 395 (index 394): Append }
if 'boundingBox' in lines[394] and not lines[394].strip().endswith('}'):
    # Check if it ends with , or so
    if not lines[394].strip().endswith('},'): # if it's boundingBox: { ... }
         lines[394] = lines[394].rstrip() + ' }\n'

with open('api/src/services/OcrService.ts', 'w') as f:
    f.writelines(lines)
