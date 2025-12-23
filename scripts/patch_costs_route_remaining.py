lines = open('api/src/routes/costs.ts').readlines()

# Line 526 (index 525): })) -> });
if lines[525].strip() == '}))':
    lines[525] = lines[525].replace('}))', '});')

# Line 586 (index 585): })) -> });
if lines[585].strip() == '}))':
    lines[585] = lines[585].replace('}))', '});')

with open('api/src/routes/costs.ts', 'w') as f:
    f.writelines(lines)
