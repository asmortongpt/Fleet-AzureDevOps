lines = open('api/src/services/OcrService.ts').readlines()

# Line 1002 (index 1001 approx)
# Search for private convertAWSBoundingBox
aws_idx = -1
for i, line in enumerate(lines):
    if 'private convertAWSBoundingBox' in line:
        aws_idx = i
        break

if aws_idx != -1:
    for j in range(aws_idx, aws_idx+20):
        # 1000/1001: bbox.Height
        if 'height: bbox.Height || 0' in lines[j]:
            # Next line }
            if j+1 < len(lines) and lines[j+1].strip() == '}':
                lines[j+1] = '    };\n'
                # Check 1003
                if j+2 < len(lines) and lines[j+2].strip() == '':
                    lines[j+2] = '  }\n'

# Line 1008 (index 1007 approx): Azure
azure_idx = -1
for i, line in enumerate(lines):
    if 'private convertAzureBoundingBox' in line:
        azure_idx = i
        break
        
if azure_idx != -1:
    # 1011: if (!bbox || bbox.length < 8)
    for j in range(azure_idx, azure_idx+10):
        if 'return { x: 0, y: 0, width: 0, height: 0 };' in lines[j]:
            # Next line }
            if j+1 < len(lines) and lines[j+1].strip() == '':
                 lines[j+1] = '    }\n'
                 break
    
    # 1018: height: bbox[5] - bbox[1]
    for j in range(azure_idx, azure_idx+20):
         if 'height: bbox[5] - bbox[1]' in lines[j]:
             # Next line }
             if j+1 < len(lines) and lines[j+1].strip() == '}':
                 lines[j+1] = '    };\n'
                 # Check 1019
                 if j+2 < len(lines) and lines[j+2].strip() == '':
                     lines[j+2] = '  }\n'
                     break

with open('api/src/services/OcrService.ts', 'w') as f:
    f.writelines(lines)
