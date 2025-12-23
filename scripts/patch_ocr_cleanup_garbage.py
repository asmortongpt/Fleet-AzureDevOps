lines = open('api/src/services/OcrService.ts').readlines()

# Look for duplicate return statement unique to detectDocumentFormat
content = 'return formatMap[ext] || DocumentFormat.IMAGE_JPEG;'

# Find all indices
indices = [i for i, line in enumerate(lines) if content in line]

if len(indices) > 1:
    # Keep the first one (inside the method), remove the others
    # indices[0] is likely the correct one (line 884)
    # indices[1] is the garbage (line 887)
    
    # We delete from end to start to maintain indices
    for i in reversed(indices[1:]):
        # Verify it's garbage?
        # Check if preceded by } (line 885 is }, 86 line 886 empty)
        # 885 (index 884) is }, 
        # lines[i-1] might be empty
        lines.pop(i)

with open('api/src/services/OcrService.ts', 'w') as f:
    f.writelines(lines)
