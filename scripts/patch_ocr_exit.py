lines = open('api/src/services/OcrService.ts').readlines()

# Line 631 (index 630): Backticks -> Quotes
if 'worker.on(`exit`' in lines[630]:
    lines[630] = lines[630].replace('`exit`', "'exit'")

# Line 635 (index 634): Insert } for if
if lines[634].strip() == '':
    lines[634] = '        }\n'

# Line 638 (index 637): Insert } for method
if lines[637].strip() == '':
    lines[637] = '  }\n'

with open('api/src/services/OcrService.ts', 'w') as f:
    f.writelines(lines)
