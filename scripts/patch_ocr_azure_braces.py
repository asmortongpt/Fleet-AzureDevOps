lines = open('api/src/services/OcrService.ts').readlines()

for i, line in enumerate(lines):
    # 1. if (!this.azureVisionClient)
    if 'if (!this.azureVisionClient)' in line:
        # Expect } at i+2 usually (throw, })
        # Or search forward for empty line
        for j in range(i+1, i+5):
            if j < len(lines) and lines[j].strip() == '':
                lines[j] = '    }\n'
                break
    
    # 2. if (result.status === 'succeeded')
    if "if (result.status === 'succeeded')" in line:
        for j in range(i+1, i+5):
            if j < len(lines) and lines[j].strip() == '':
                 lines[j] = '      }\n'
                 break
                 
    # 3. while (retries < 30)
    # Ends after retries++
    if 'while (retries < 30)' in line:
        pass # Handle via retries++
    
    if 'retries++' in line:
        # Next line }
        if i+1 < len(lines) and lines[i+1].strip() == '':
            lines[i+1] = '    }\n'

    # 4. if (result?.status !== 'succeeded')
    if "if (result?.status !== 'succeeded')" in line:
        for j in range(i+1, i+5):
            if j < len(lines) and lines[j].strip() == '':
                lines[j] = '    }\n'
                break

with open('api/src/services/OcrService.ts', 'w') as f:
    f.writelines(lines)
