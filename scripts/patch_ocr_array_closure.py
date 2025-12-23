lines = open('api/src/services/OcrService.ts').readlines()

# Line 603 (index 602): ]; -> }];
# Use context: previous line has data.imageHeight
for i, line in enumerate(lines):
    if line.strip() == '];':
        # Check prev
        if i > 0 and 'data.imageHeight' in lines[i-1]:
            lines[i] = lines[i].replace('];', '}];')

with open('api/src/services/OcrService.ts', 'w') as f:
    f.writelines(lines)
