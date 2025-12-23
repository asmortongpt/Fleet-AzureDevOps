lines = open('api/src/services/OcrService.ts').readlines()

# Line 396 (index 395): ], -> }],
if '],' in lines[395]:
    lines[395] = lines[395].replace('],', '}],')

# Line 409 (index 408): Insert } for metadata
if lines[408].strip() == '':
    lines[408] = '      }\n'

# Line 410 (index 409): } -> };
if lines[409].strip() == '}':
    lines[409] = '    };\n'

# Line 411 (index 410): Insert } for method
if lines[410].strip() == '':
    lines[410] = '  }\n'

# Line 429 (index 428): Fix interpolation
# fullText += `\n--- Sheet: ${sheetName ---\n${sheetText\n`;
if 'sheetName' in lines[428] and '{sheetName' in lines[428]:
    lines[428] = lines[428].replace('${sheetName', '${sheetName}').replace('${sheetText', '${sheetText}')
    # Remove extra ---\n inside? No, it looks like: ${sheetName} ---\n ${sheetText}\n
    # Original: ${sheetName ---\n${sheetText\n
    # The user truncated } and }.

# Line 436 (index 435): Append } for boundingBox
if 'boundingBox' in lines[435] and not lines[435].strip().endswith('}'):
    if not lines[435].strip().endswith('},'):
        lines[435] = lines[435].rstrip() + ' }\n'

# Line 438 (index 437): ); -> }); (close forEach)
if ');' in lines[437]:
    lines[437] = lines[437].replace(');', '});')


with open('api/src/services/OcrService.ts', 'w') as f:
    f.writelines(lines)
