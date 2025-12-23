import re

lines = open('api/src/services/OcrService.ts').readlines()

for i, line in enumerate(lines):
    # Skip if no backticks
    if '`' not in line:
        continue
    
    # 1. Simple backticks without interpolation
    # `string` -> 'string'
    # Regex: `([^$]*)` -> '$1' (but naive replace is safer if no ${)
    if '${' not in line:
        line = line.replace('`', "'")
    else:
        # 2. Backticks with interpolation
        # `text ${var} text` -> 'text ' + var + ' text'
        # This is complex to do with regex perfectly, but for simple error messages it's doable.
        # Example: `Worker stopped with exit code ${code}`
        # We already fixed that one specifically.
        
        # Example: `Unsupported OCR provider: ${provider}`
        if 'Unsupported OCR provider' in line:
            line = line.replace('`Unsupported OCR provider: ${provider}`', "'Unsupported OCR provider: ' + provider")
            # If quotes match mismatch?
            # Original uses backticks.
        
        # Example: `Worker stopped with exit code ${code` (already fixed)
        
        # Example: `Google Cloud Vision not configured` (No interpolation, handled by case 1)
        
        # General simple interpolation: `prefix ${var}` -> 'prefix ' + var
        # Regex replacement?
        # pattern: `(.*)\$\{(.*)\}(.*)` -> '$1' + $2 + '$3'
        # But quotes might be tricky inside.
        
        # Let's target specific known errors from my scan.
        pass

    lines[i] = line

with open('api/src/services/OcrService.ts', 'w') as f:
    f.writelines(lines)
