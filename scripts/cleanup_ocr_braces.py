import re

filepath = 'api/src/services/OcrService.ts'
with open(filepath, 'r') as f:
    lines = f.readlines()

new_lines = []
for i, line in enumerate(lines):
    # Check if this is a standalone brace
    if re.match(r'^\s*\}\s*$', line):
        # Look back for previous code line
        prev_code_line = ""
        for j in range(len(new_lines) - 1, -1, -1):
            if new_lines[j].strip():
                prev_code_line = new_lines[j]
                break
        
        # If previous line is a property declaration, SKIP this brace
        # Property: private name: Type = value;
        # Method: private name() {
        if prev_code_line and re.search(r'(private|public|protected|readonly)', prev_code_line) and prev_code_line.strip().endswith(';') and '(' not in prev_code_line:
            continue
            
    new_lines.append(line)

with open(filepath, 'w') as f:
    f.writelines(new_lines)
