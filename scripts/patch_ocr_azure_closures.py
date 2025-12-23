lines = open('api/src/services/OcrService.ts').readlines()

# Context: readResults.map
map_start = -1
for i, line in enumerate(lines):
    if 'pages: OcrPage[] = readResults.map' in line:
        map_start = i
        break

if map_start != -1:
    for j in range(map_start, len(lines)):
        # 833 approx: boundingBox: this.convertAzureBoundingBox(line.boundingBox)
        # 833 is next line
        if 'boundingBox: this.convertAzureBoundingBox(line.boundingBox)' in lines[j]:
            if j+1 < len(lines) and '))' in lines[j+1]:
                lines[j+1] = lines[j+1].replace('))', '}))')
            
            # 834: page.height
            if j+2 < len(lines) and 'height: page.height' in lines[j+2]:
                if not lines[j+2].strip().endswith('},'): # might end with ,
                    lines[j+2] = lines[j+2].replace('height: page.height ,', 'height: page.height },')
                    if not '},' in lines[j+2]: # in case logic fails
                         lines[j+2] = lines[j+2].rstrip().rstrip(',') + ' },\n'

            # 837: ));
            # Scan ahead a bit
            for k in range(j+1, j+10):
                if k < len(lines) and lines[k].strip() == '));':
                    lines[k] = lines[k].replace('));', '}));')
                    break
            break

with open('api/src/services/OcrService.ts', 'w') as f:
    f.writelines(lines)
