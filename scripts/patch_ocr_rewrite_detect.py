lines = open('api/src/services/OcrService.ts').readlines()

start_idx = -1
end_idx = -1

for i, line in enumerate(lines):
    if 'private async detectDocumentFormat' in line:
        start_idx = i
        # Find closing brace?
        # We know it ends after .csv
        for j in range(i, len(lines)):
            if '.csv' in lines[j] and 'DocumentFormat.CSV' in lines[j]:
                # Look ahead for }
                if j+3 < len(lines) and '}' in lines[j+3]:
                    end_idx = j+3
                else: 
                     # scan for next method or end of method (return line?)
                     pass
                break
        break

# If end_idx unset, just target approx lines
if start_idx != -1:
    # Scan for return key
    for j in range(start_idx, len(lines)):
        if 'return formatMap[ext]' in lines[j]:
             end_idx = j + 1 # include close brace
             break
    
    if end_idx == -1:
        # scan for .csv and assume few lines after
        for j in range(start_idx, len(lines)):
            if '.csv' in lines[j]:
                end_idx = j + 4 # };, return, }, empty
                break

if start_idx != -1 and end_idx != -1:
    new_code = [
        "  private async detectDocumentFormat(filePath: string): Promise<DocumentFormat> {\n",
        "    const ext = path.extname(filePath).toLowerCase();\n",
        "\n",
        "    const formatMap: Record<string, DocumentFormat> = {\n",
        "      '.pdf': DocumentFormat.PDF,\n",
        "      '.jpg': DocumentFormat.IMAGE_JPEG,\n",
        "      '.jpeg': DocumentFormat.IMAGE_JPEG,\n",
        "      '.png': DocumentFormat.IMAGE_PNG,\n",
        "      '.tiff': DocumentFormat.IMAGE_TIFF,\n",
        "      '.tif': DocumentFormat.IMAGE_TIFF,\n",
        "      '.webp': DocumentFormat.IMAGE_WEBP,\n",
        "      '.docx': DocumentFormat.DOCX,\n",
        "      '.xlsx': DocumentFormat.XLSX,\n",
        "      '.txt': DocumentFormat.TXT,\n",
        "      '.csv': DocumentFormat.CSV\n",
        "    };\n",
        "\n",
        "    return formatMap[ext] || DocumentFormat.IMAGE_JPEG;\n",
        "  }\n"
    ]
    
    # Replace
    lines[start_idx:end_idx+1] = new_code

with open('api/src/services/OcrService.ts', 'w') as f:
    f.writelines(lines)
