lines = open('api/src/services/OcrService.ts').readlines()

# Line 986 (index 985): } -> }; + } (at 987)
# Context: height: (vertices[2].y || 0) - (vertices[0].y || 0)
found_google = False
for i, line in enumerate(lines):
    if 'height: (vertices[2].y || 0) - (vertices[0].y || 0)' in line:
        found_google = i
        break

if found_google:
    # 986 is current i+1
    if i+1 < len(lines) and lines[i+1].strip() == '}':
        lines[i+1] = '    };\n'
        # Check if 987 has }
        if i+2 < len(lines):
            # If it's whitespace or empty or starts with /*, insert }
            if lines[i+2].strip() == '':
                 lines[i+2] = '  }\n'

# Line 994/995: return { x... }; }
# Context: private convertAWSBoundingBox
aws_idx = -1
for i, line in enumerate(lines):
    if 'private convertAWSBoundingBox' in line:
        aws_idx = i
        break
        
if aws_idx != -1:
    # Look for if (!bbox)
    for j in range(aws_idx, aws_idx+10):
        if 'if (!bbox)' in lines[j]:
            # Look for return
            # ...
            pass
            
    # Or just search by content
    # return { x: 0, y: 0, width: 0, height: 0 };
    # line 995 is empty/whitespace
    for j in range(aws_idx, aws_idx+10):
        if 'return { x: 0, y: 0, width: 0, height: 0 };' in lines[j]:
             if j+1 < len(lines) and lines[j+1].strip() == '':
                 lines[j+1] = '    }\n'
                 break

with open('api/src/services/OcrService.ts', 'w') as f:
    f.writelines(lines)
