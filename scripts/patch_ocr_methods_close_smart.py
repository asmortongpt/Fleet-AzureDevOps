lines = open('api/src/services/OcrService.ts').readlines()

def fix_preceding_closure(method_name):
    # Find method start
    start_idx = -1
    for i, line in enumerate(lines):
        if method_name in line:
            start_idx = i
            break
            
    if start_idx == -1:
        return

    # Scan backwards
    j = start_idx - 1
    while j >= 0:
        content = lines[j].strip()
        # Skip empty or comments
        if content == '' or content.startswith('/') or content.startswith('*'):
            j -= 1
            continue
        break
    
    # lines[j] is the last code line of previous block
    if j >= 0:
        indent = len(lines[j]) - len(lines[j].lstrip())
        content = lines[j].strip()
        
        # If it ends with }, likely object or block close
        if content == '}':
            if indent >= 4:
                # Likely return object or inner block
                lines[j] = lines[j].rstrip() + ';\n' # Ensure ;
                
                # Insert method closure } at j+1
                lines.insert(j+1, '  }\n')
            elif indent == 2:
                # Already closed?
                pass
        
        # If it doesn't end with }, maybe missing braces entirely?
        # But we assume the file structure is mostly } or empty.

# Fix Google -> AWS
fix_preceding_closure('private async processWithAWSTextract')

# Fix AWS -> Azure
fix_preceding_closure('private async processWithAzureVision')

# Fix Azure -> detectDocumentFormat
fix_preceding_closure('private async detectDocumentFormat')

with open('api/src/services/OcrService.ts', 'w') as f:
    f.writelines(lines)
