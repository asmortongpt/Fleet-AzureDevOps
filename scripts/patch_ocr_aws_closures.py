lines = open('api/src/services/OcrService.ts').readlines()

# Context: lines.map(line => ({
map_start = -1
for i, line in enumerate(lines):
    if 'lines: lines.map(line => ({' in line:
        map_start = i
        break
        
if map_start != -1:
    # 734 approx
    for j in range(map_start, len(lines)):
        if 'boundingBox: this.convertAWSBoundingBox' in lines[j]:
             if j+1 < len(lines) and '))' in lines[j+1]:
                 lines[j+1] = lines[j+1].replace('))', '}))')
                 
                 # Next line 735
                 if 'height: 1' in lines[j+2]:
                     if not lines[j+2].strip().endswith('}'):
                         lines[j+2] = lines[j+2].rstrip() + ' }\n'
                 
                 # Next line 736
                 if '];' in lines[j+3]:
                     lines[j+3] = lines[j+3].replace('];', '}];')
                 break

with open('api/src/services/OcrService.ts', 'w') as f:
    f.writelines(lines)
