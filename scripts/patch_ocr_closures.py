lines = open('api/src/services/OcrService.ts').readlines()

new_lines = []
for i, line in enumerate(lines):
    # Fix unclosed catch blocks ending with console.warn
    # Pattern:
    #   console.warn(...);
    #   (empty or whitespace)
    #   (next block start or new catch)
    
    if i > 0 and 'console.warn' in lines[i-1] and line.strip() == '':
        new_lines.append('  }\n')
        continue
        
    # Fix unclosed catch blocks ending with throw error
    if i > 0 and 'throw error' in lines[i-1] and line.strip() == '':
         new_lines.append('  }\n')
         continue

    # Close function before export enum OcrProvider
    if 'export enum OcrProvider' in line:
        # Check if previous line closed the function
        # We might have just inserted '  }\n' for the catch block above.
        # But the function needs another '}'.
        new_lines.append('}\n\n')

    new_lines.append(line)

with open('api/src/services/OcrService.ts', 'w') as f:
    f.writelines(new_lines)
