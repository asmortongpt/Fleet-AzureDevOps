lines = open('api/src/services/OcrService.ts').readlines()

# Locate resolve({
start = -1
end = -1

for i, line in enumerate(lines):
    if 'resolve({' in line:
        start = i
    if start != -1 and '});' in line and i > start:
        # We need the } that closes resolve
        # We know it ends around 623/624
        # Look for the indentation '        });' (8 spaces) which closes resolve
        # 624 was '      });' (6 spaces) which closes worker.on
        if '        });' in line:
            end = i
            break

if start != -1 and end != -1:
    lines[start] = '/* ' + lines[start]
    lines[end] = lines[end].rstrip() + ' */\n'

with open('api/src/services/OcrService.ts', 'w') as f:
    f.writelines(lines)
