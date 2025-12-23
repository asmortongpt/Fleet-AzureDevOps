lines = open('api/src/services/OcrService.ts').readlines()

# Line 429: fullText += `\n--- Sheet: ${sheetName} ---\n${sheetText}\n`;
# Index approx 428
for i, line in enumerate(lines):
    if 'fullText +=' in line and 'Sheet:' in line:
        # Replace with concat
        # fullText += '\n--- Sheet: ' + sheetName + ' ---\n' + sheetText + '\n';
        lines[i] = "      fullText += '\\n--- Sheet: ' + sheetName + ' ---\\n' + sheetText + '\\n';\n"
    
    # Line 538: throw new Error(`Unsupported OCR provider: ${provider`);
    if 'Unsupported OCR provider' in line:
        # Check if backticks still exist
        if '`' in line:
             lines[i] = "        throw new Error('Unsupported OCR provider: ' + provider);\n"

with open('api/src/services/OcrService.ts', 'w') as f:
    f.writelines(lines)
