lines = open('api/src/services/OcrService.ts').readlines()

# Line 1057 (approx): }); -> );
# Context: JSON.stringify(result.metadata)
json_idx = -1
for i, line in enumerate(lines):
    if 'JSON.stringify(result.metadata)' in line:
        json_idx = i
        break

if json_idx != -1:
    # Next line ]
    # Next line });
    if json_idx+2 < len(lines):
        if '});' in lines[json_idx+2]:
            lines[json_idx+2] = lines[json_idx+2].replace('});', ');')

with open('api/src/services/OcrService.ts', 'w') as f:
    f.writelines(lines)
