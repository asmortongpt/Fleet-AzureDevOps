lines = open('api/src/services/OcrService.ts').readlines()

# Line 552 (index 551): Replace backticks with quotes
if 'import(`worker_threads`)' in lines[551]:
    lines[551] = lines[551].replace('`', "'")

# Just in case, clean up any } = issues
# Ensure it is: const { Worker } = ...
if 'const { Worker } =' not in lines[551] and 'Worker' in lines[551]:
    # This might be tricky if regex failed earlier.
    # But visually it looked fine in previous step.
    pass

with open('api/src/services/OcrService.ts', 'w') as f:
    f.writelines(lines)
