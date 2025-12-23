lines = open('api/src/services/OcrService.ts').readlines()

# Line 552 (index 551): Worker  = -> Worker } =
if 'Worker  =' in lines[551]:
    lines[551] = lines[551].replace('Worker  =', 'Worker } =')

# Line 565 (index 564): Insert } for options
if lines[564].strip() == '':
    lines[564] = '              }\n'

# Line 566 (index 565): Insert } for workerData
if lines[565].strip() == '':
    lines[565] = '            }\n'

# Line 567 (index 566): Insert } for Worker config
if lines[566].strip() == '':
    lines[566] = '          }\n'

with open('api/src/services/OcrService.ts', 'w') as f:
    f.writelines(lines)
