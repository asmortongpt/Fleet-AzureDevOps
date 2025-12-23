lines = open('api/src/services/OcrService.ts').readlines()

# Line 598 (index 597): )) -> })),
if lines[597].strip() == '))':
    lines[597] = lines[597].replace('))', '})),')
elif lines[597].strip() == ')),':
    pass # already fixed? or comma exists
    # If it is ')),' but needs '})),'
    if '})),' not in lines[597]:
         lines[597] = lines[597].replace(')),', '})),')

# Line 600 (index 599): )) -> })),
if lines[599].strip() == '))':
    lines[599] = lines[599].replace('))', '})),')
elif lines[599].strip() == ')),':
    if '})),' not in lines[599]:
         lines[599] = lines[599].replace(')),', '})),')

with open('api/src/services/OcrService.ts', 'w') as f:
    f.writelines(lines)
