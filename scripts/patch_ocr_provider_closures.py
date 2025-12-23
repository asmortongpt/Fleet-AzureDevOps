lines = open('api/src/services/OcrService.ts').readlines()

# 1. selectProvider closures (multiple ifs)
# if (requestedProvider ...) {
for i, line in enumerate(lines):
    if 'if (requestedProvider && requestedProvider !== OcrProvider.AUTO) {' in line:
        if i+2 < len(lines) and lines[i+2].strip() == '':
             lines[i+2] = '    }\n'
             
    if 'if (options.detectTables || options.detectForms) {' in line:
        # 905 is return
        # 906 is empty in view
        if i+3 < len(lines) and lines[i+3].strip() == '':
             lines[i+3] = '    }\n'

    if 'if (options.detectHandwriting) {' in line:
        # 910, 911 returns
        # 912 empty
        if i+4 < len(lines) and lines[i+4].strip() == '':
             lines[i+4] = '    }\n'
             
    if 'return OcrProvider.TESSERACT;' in line:
        # End of method
        if i+1 < len(lines) and lines[i+1].strip() == '':
             lines[i+1] = '  }\n'

# 2. createResultFromPDFText closures
    if 'boundingBox: { x: 0, y: 0, width: 0, height: 0' in line:
        # Add }
        if not line.strip().endswith('}'):
             lines[i] = line.rstrip() + ' }\n'
             
        # Next line (939 in view) is ],
        # Needs to be }]; to close the object item in array
        if i+1 < len(lines) and '],' in lines[i+1]:
             lines[i+1] = lines[i+1].replace('],', '}];')

with open('api/src/services/OcrService.ts', 'w') as f:
    f.writelines(lines)
