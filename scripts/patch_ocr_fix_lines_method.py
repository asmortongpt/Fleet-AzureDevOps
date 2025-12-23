lines = open('api/src/services/OcrService.ts').readlines()

# Line 968 (index 967): )), -> })),
# Context: words: line.split...
if 'words: line.split' in ''.join(lines[960:970]):
    for i in range(960, 980):
        if i < len(lines):
            # 968
            if lines[i].strip() == ')),':
                lines[i] = lines[i].replace(')),', '})),')
            # 970
            if lines[i].strip() == '));':
                lines[i] = lines[i].replace('));', '}));')
                
                # Check 971 for closing brace
                if i+1 < len(lines) and lines[i+1].strip() == '':
                    lines[i+1] = '  }\n'
            
            # 978
            if 'return { x: 0, y: 0, width: 0, height: 0 ;' in lines[i]:
                 lines[i] = lines[i].replace('height: 0 ;', 'height: 0 };')

with open('api/src/services/OcrService.ts', 'w') as f:
    f.writelines(lines)
