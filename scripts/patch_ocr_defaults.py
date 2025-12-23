lines = open('api/src/services/OcrService.ts').readlines()

new_lines = []
skip = False
for i, line in enumerate(lines):
    if skip:
        skip = False
        continue

    # Fix: options: OcrOptions = {
    #      ): Promise...
    if 'options: OcrOptions = {' in line and i+1 < len(lines) and lines[i+1].strip().startswith('):'):
        # Replace { with {}
        new_lines.append(line.replace('{', '{}'))
        new_lines.append(lines[i+1])
        skip = True # skip next line as we appended it
    else:
        new_lines.append(line)

with open('api/src/services/OcrService.ts', 'w') as f:
    f.writelines(new_lines)
