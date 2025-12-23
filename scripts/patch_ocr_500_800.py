lines = open('api/src/services/OcrService.ts').readlines()

# Helper to look ahead/behind
def get_line(idx):
    if 0 <= idx < len(lines):
        return lines[idx]
    return ""

new_lines = []
skip = False

for i, line in enumerate(lines):
    if skip:
        skip = False
        continue
    
    # 1. processImage: missing } after return
    if 'return this.processImageWithProvider' in line:
        new_lines.append(line)
        if i+1 < len(lines) and lines[i+1].strip() == '':
             new_lines.append('  }\n')
             skip = True # Replace the empty line
        continue

    # 2. switch default throw: missing }
    if 'Unsupported OCR provider' in line:
        new_lines.append(line)
        # Needs } for switch, then } for method?
        # Check next lines
        if i+1 < len(lines) and lines[i+1].strip() == '':
            new_lines.append('    }\n') # switch
            new_lines.append('  }\n') # method
            skip = True
        continue
        
    # 3. pages boundingBox
    if 'boundingBox: { x: 0, y: 0, width: data.imageWidth' in line:
        if not line.strip().endswith('}'):
             line = line.rstrip() + ' }\n'
    
    # 4. processedAt / metadata end
    if 'processedAt: new Date()' in line:
        new_lines.append(line)
        # Next line should include }
        if i+1 < len(lines) and lines[i+1].strip() == '':
             new_lines.append('      }\n')
             skip = True
        continue
    
    # 5. resolve call end
    if 'processedAt' in get_line(i-2) and line.strip() == ');':
        # This is resolve({ ... ); -> });
        line = line.replace(');', '});')

    # 6. worker.on end
    if 'worker.on' in get_line(i-100): # Hard to use lookback efficiently, rely on content
        # But 'worker.on' lines end with ); in the file.
        # We need });
        pass

    if line.strip() == ');':
        # Check context
        prev = get_line(i-1).strip()
        if prev == '}' or prev == '}': # closing metadata?
            line = line.replace(');', '});')
        # Check for error/exit handlers which are short
        if 'reject(error)' in prev: # error handler
             line = line.replace(');', '});')
        if 'reject' in prev and 'exit code' in prev: # exit handler
             line = line.replace(');', '});')
        if 'Bytes: imageBuffer' in prev: # DetectDocumentTextCommand
             line = line.replace(');', '});')
    
    # 7. exit code interpolation
    if 'exit code ${code' in line:
        line = line.replace('${code', '${code}')

    # 8. new Promise end
    # It ends with ); too. It wraps the worker logic.
    # It's usually indented 4 spaces.
    if line.rstrip() == '    );':
        line = line.replace(');', '});')

    # 9. processWithTesseract method end
    # After new Promise end
    if line.rstrip() == '    });': # We just fixed it above? No, Python executes sequentially?
        pass 
    
    # We apply replacements to line, then append.
    
    # Fix 9 continued:
    if line.strip() == '});' and get_line(i+1).strip() == '':
        # Could be end of promise
        # Next line empty? Insert } for method?
        # But we need to be careful not to double insert.
        # Let's rely on specific method context via variable.
        pass

    # 10. if (!this.googleVisionClient) ...
    if 'Google Cloud Vision not configured' in line:
        new_lines.append(line)
        if i+1 < len(lines) and lines[i+1].strip() == '':
             new_lines.append('    }\n')
             skip = True
        continue

    # 11. image: { content: imageBuffer
    if 'image: { content: imageBuffer' in line:
        if not line.strip().endswith('}'):
            line = line.rstrip() + ' }\n'
    
    # 12. Google documentTextDetection end
    if 'image: { content' in get_line(i-1) and line.strip() == ');':
        line = line.replace(');', '});')

    # 13. if (!fullTextAnnotation)
    if 'No text found in document' in line:
        new_lines.append(line)
        if i+1 < len(lines) and lines[i+1].strip() == '':
             new_lines.append('    }\n')
             skip = True
        continue
    
    # 14. processWithGoogleVision method end
    # If we see processedAt, we inserted }, then likely end of method follows?
    
    # 15. if (!this.textractClient)
    if 'AWS Textract not configured' in line:
        new_lines.append(line)
        if i+1 < len(lines) and lines[i+1].strip() == '':
             new_lines.append('    }\n')
             skip = True
        continue

    # 16. AnalyzeDocumentCommand Bytes
    if 'Bytes: imageBuffer' in line and ',' in line: # has comma
        line = line.rstrip().rstrip(',') + ' }' 
        if ',' in get_line(i): line += ','
        line += '\n'
        # Wait, simple append } is safer
    
    if 'Bytes: imageBuffer' in line:
         if not line.strip().endswith('}'):
             # Should end with } or },
             if line.strip().endswith(','):
                  line = line.replace(',', ' },')
             else:
                  line = line.rstrip() + ' }\n'

    # 17. AnalyzeDocumentCommand end
    if 'FeatureTypes:' in get_line(i-4) and line.strip() == ')':
         line = line.replace(')', '})')

    # 18. DetectDocumentTextCommand end
    if 'new DetectDocumentTextCommand' in get_line(i-2) and line.strip() == ');':
         line = line.replace(');', '});')

    # 19. tables.push
    if 'confidence: (table.Confidence' in get_line(i-1) and line.strip() == ');':
         line = line.replace(');', '});')

    # 20. tableBlocks.forEach
    if 'tables.push' in get_line(i-7) and line.strip() == ');': # heuristic
         pass # Handled by generic ); -> }); check if indented correctly?
         # forEach usually indented 6 spaces?
    
    if line.rstrip() == '      );': # closes forEach
         line = line.replace(');', '});')

    # 21. if (options.detectTables)
    if 'forEach(table =>' in get_line(i-8): # end of block
        new_lines.append(line)
        if i+1 < len(lines) and lines[i+1].strip() == '':
             new_lines.append('    }\n') # Close if
             skip = True
        continue

    # 22. if (options.detectForms)
    if 'keyValueBlocks' in line: # Start of if block content
         # The end of this block is typically empty line
         pass

    # We need to close detectForms
    # It has // Process form extraction (simplified for now)
    if '// Process form extraction' in line:
        new_lines.append(line)
        # The next line is likely empty or close brace?
        # In file view it is empty.
        new_lines.append('    }\n')
        continue

    # 23. processWithAWSTextract end
    # After metadata block
    
    new_lines.append(line)

with open('api/src/services/OcrService.ts', 'w') as f:
    f.writelines(new_lines)
