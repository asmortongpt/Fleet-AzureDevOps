lines = open('api/src/services/OcrService.ts').readlines()

# Line 954 (index 953)
# It is empty/whitepace. We need to insert } before line 956/959
# 953 is } (closes object)
# Insert } after 953

# Verify context
if 'metadata: {' in ''.join(lines[940:946]):
    # Find the closing } of metadata
    # ...
    # Find line with private convertTextToLines
    for i, line in enumerate(lines):
        if 'private convertTextToLines' in line:
            # Look backwards
            # i-1: might be comment opening /** or whitespace
            # i-2..
            if '}' in lines[i-6]: # 953 approx
                 # We need to ensure method closes.
                 # Check if lines[i-2] is }?
                 # view says 953 is }, 954 is '  ', 955 is empty?
                 pass

# Safer: Find "private convertTextToLines", look back for }
idx = -1
for i, line in enumerate(lines):
    if 'private convertTextToLines(text: string):' in line:
        idx = i
        break

if idx != -1:
    # Scan back
    j = idx - 1
    while j > 0 and (lines[j].strip() == '' or lines[j].strip().startswith('/') or lines[j].strip().startswith('*')):
        j -= 1
        
    # lines[j] is the last code line. Likely }
    # We need to append ; if missing, and then add }
    if lines[j].strip() == '}': # Closes return object
        lines[j] = lines[j].rstrip() + ';\n'
        lines.insert(j+1, '  }\n')

with open('api/src/services/OcrService.ts', 'w') as f:
    f.writelines(lines)
