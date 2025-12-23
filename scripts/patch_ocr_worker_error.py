lines = open('api/src/services/OcrService.ts').readlines()

# Line 634 (index 633): Replace template literal
target = 'reject(new Error(`Worker stopped with exit code ${code}`));'
replacement = "          reject(new Error('Worker stopped with exit code ' + code));\n"

if target.strip() in lines[633].strip():
    lines[633] = replacement
elif 'Worker stopped with' in lines[633]:
    # Fallback partial match if indentation differs
    lines[633] = replacement

with open('api/src/services/OcrService.ts', 'w') as f:
    f.writelines(lines)
