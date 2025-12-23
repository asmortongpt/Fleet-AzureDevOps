lines = open('api/src/services/OcrService.ts').readlines()

# Range 576 to 624 (approx)
start_idx = -1
end_idx = -1

for i, line in enumerate(lines):
    if "worker.on('message', (result) => {" in line:
        start_idx = i
    # We know it ends with the }); line BEFORE empty line 625 (in view 580)
    # Line 624 was '      });'
    # Line 626 is '      worker.on('error', ...'
    if start_idx != -1 and "worker.on('error', (error)" in line:
        # The previous non-empty line was the end
        # Search backwards from i
        for j in range(i-1, start_idx, -1):
            if lines[j].strip().endswith('});'):
                end_idx = j
                break
        break

if start_idx != -1 and end_idx != -1:
    # Construct replacement
    replacement = [
        "      worker.on('message', (result) => {\n",
        "        clearTimeout(timeout);\n",
        "        if (!result.success) {\n",
        "          reject(new Error(result.error || 'OCR processing failed'));\n",
        "          return;\n",
        "        }\n",
        "        // Simplified return for debugging\n",
        "        const data = result.data;\n",
        "        resolve({\n",
        "            provider: OcrProvider.TESSERACT,\n",
        "            documentId,\n",
        "            fullText: data.text,\n",
        "            pages: [],\n",
        "            languages: ['eng'],\n",
        "            primaryLanguage: 'eng',\n",
        "            averageConfidence: 0,\n",
        "            processingTime: 0,\n",
        "            metadata: {\n",
        "                documentFormat: 'image',\n",
        "                pageCount: 1,\n",
        "                hasHandwriting: false,\n",
        "                hasTables: false,\n",
        "                hasForms: false,\n",
        "                fileSize,\n",
        "                processedAt: new Date()\n",
        "            }\n",
        "        });\n",
        "      });\n"
    ]
    
    # Replace lines
    lines[start_idx:end_idx+1] = replacement

with open('api/src/services/OcrService.ts', 'w') as f:
    f.writelines(lines)
